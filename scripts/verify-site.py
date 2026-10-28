"""Read-only site checks. --http reads local resources; it does not run a browser."""
import argparse
from collections import Counter
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import quote, unquote, urlsplit
from urllib.request import urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.elements = []
        self.ids = []
        self.json_ld = []
        self.in_json = False
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.elements.append((tag, attrs))
        if attrs.get('id'):
            self.ids.append(attrs['id'])
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self.in_json = True

    handle_startendtag = handle_starttag

    def handle_endtag(self, tag):
        if tag == 'script':
            self.in_json = False

    def handle_data(self, data):
        if self.in_json:
            self.json_ld.append(json.loads(data))


def main():
    options = argparse.ArgumentParser()
    options.add_argument('--http', action='store_true')
    args = options.parse_args()
    pages = sorted(p for p in ROOT.glob('*.html') if not p.name.startswith('yandex_'))
    pages += sorted((ROOT / 'work').glob('*.html'))
    docs = {p: Document(p.read_text(encoding='utf-8-sig')) for p in pages}
    errors = []
    resources = set(pages)
    checked_links = 0

    for path, doc in docs.items():
        label = str(path.relative_to(ROOT))
        duplicates = [key for key, count in Counter(doc.ids).items() if count > 1]
        if duplicates:
            errors.append(f'{label}: duplicate ids {duplicates}')
        if sum(tag == 'h1' for tag, _ in doc.elements) != 1:
            errors.append(f'{label}: expected one h1')
        if not any(tag == 'meta' and a.get('name') == 'description' for tag, a in doc.elements):
            errors.append(f'{label}: missing description')
        if path.name != '404.html' and not any(tag == 'link' and a.get('rel') == 'canonical' for tag, a in doc.elements):
            errors.append(f'{label}: missing canonical')
        for tag, attrs in doc.elements:
            if tag == 'img' and ('alt' not in attrs or not attrs.get('width') or not attrs.get('height')):
                errors.append(f'{label}: image needs alt and dimensions: {attrs.get("src")}')
            for key in ('href', 'src'):
                value = attrs.get(key)
                if not value:
                    continue
                url = urlsplit(value)
                if url.scheme or url.netloc:
                    continue
                if url.path.startswith('/'):
                    target = (ROOT / unquote(url.path).lstrip('/')).resolve()
                else:
                    target = (path.parent / unquote(url.path)).resolve() if url.path else path
                if target.is_dir():
                    target /= 'index.html'
                checked_links += 1
                if not target.is_relative_to(ROOT) or not target.is_file():
                    errors.append(f'{label}: missing local resource {value}')
                    continue
                resources.add(target)
                if url.fragment and target.suffix == '.html':
                    target_doc = docs.get(target)
                    if target_doc and unquote(url.fragment) not in target_doc.ids:
                        errors.append(f'{label}: missing fragment {value}')
            for attribute in ('aria-describedby', 'aria-controls', 'aria-labelledby'):
                for ref in attrs.get(attribute, '').split():
                    if ref not in doc.ids:
                        errors.append(f'{label}: missing {attribute} target {ref}')

        entrypoints = [attrs.get('src', '').split('?')[0] for tag, attrs in doc.elements if tag == 'script' and attrs.get('src')]
        if not any(src.endswith('assets/js/main.js') for src in entrypoints):
            errors.append(f'{label}: missing canonical JavaScript entrypoint assets/js/main.js')
        if any(src.endswith('/script.js') or src == 'script.js' for src in entrypoints):
            errors.append(f'{label}: loads legacy JavaScript instead of the canonical entrypoint')
        if path.name == '404.html':
            for tag, attrs in doc.elements:
                for key in ('href', 'src'):
                    value = attrs.get(key, '')
                    url = urlsplit(value)
                    if value and not (url.scheme or url.netloc or value.startswith(('/', '#'))):
                        errors.append(f'{label}: relative {key} breaks on nested missing routes: {value}')

    home = docs[ROOT / 'index.html']
    def count_class(name):
        return sum(name in attrs.get('class', '').split() for _, attrs in home.elements)
    for name, expected in [('project-card', 8), ('certificate-card', 4), ('world-chapter', 3)]:
        if count_class(name) != expected:
            errors.append(f'index.html: expected {expected} {name} elements')
    if not home.json_ld:
        errors.append('index.html: missing structured data')

    sitemap = ET.parse(ROOT / 'sitemap.xml')
    namespace = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    listed = {item.text for item in sitemap.findall('.//s:loc', namespace)}
    for path in pages:
        if path.name == '404.html':
            continue
        relative = path.relative_to(ROOT).as_posix()
        canonical = 'https://jrcholan.lat/' + ('' if relative == 'index.html' else relative)
        if canonical not in listed:
            errors.append(f'sitemap: missing {canonical}')

    css = (ROOT / 'assets/css/premium.css').read_text(encoding='utf-8')
    unquoted = re.sub(r'/\*.*?\*/|"(?:\\.|[^"\\])*"|\x27(?:\\.|[^\x27\\])*\x27', '', css, flags=re.S)
    balance = 0
    for character in unquoted:
        balance += (character == '{') - (character == '}')
        if balance < 0:
            break
    if balance != 0:
        errors.append('premium.css: unbalanced blocks')

    if args.http:
        for path in sorted(resources):
            relative = path.relative_to(ROOT).as_posix()
            try:
                with urlopen('http://localhost:8000/' + quote(relative), timeout=5) as response:
                    if response.status != 200 or response.read() != path.read_bytes():
                        errors.append(f'HTTP: content mismatch for {relative}')
            except OSError as error:
                errors.append(f'HTTP: {relative}: {error}')

    if errors:
        raise SystemExit('\n'.join(errors))
    print(f'PASS: {len(pages)} HTML pages, {checked_links} local references, 8 projects, 4 certificates, 3 world chapters, SEO metadata, sitemap, ARIA targets and canonical JavaScript entrypoint.')
    if args.http:
        print(f'PASS: {len(resources)} local documents/resources served byte-for-byte on localhost:8000.')
    print('These checks do not validate browser rendering, contrast measurements or device performance.')


if __name__ == '__main__':
    main()
