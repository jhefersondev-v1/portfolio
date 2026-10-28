"""Notify IndexNow after Pages publishes main. Python standard library only.

Successful runs of indexnow.yml are the durable checkpoint; no commits, caches,
visitor requests, or extra credentials are needed. --dry-run never sends a POST.
"""
import argparse
import hashlib
from html import escape
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
from urllib.error import HTTPError
from urllib.parse import unquote, urlsplit
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
HOST = 'jrcholan.lat'
ORIGIN = f'https://{HOST}'
KEY = '653b8ac8c5854295beb8ba981bedf938'
KEY_LOCATION = f'{ORIGIN}/{KEY}.txt'
ENDPOINT = 'https://api.indexnow.org/indexnow'
REPOSITORY = 'jhefersondev-v1/portfolio'
WORKFLOW = 'indexnow.yml'
NOTIFY_STEP = 'Verify production and notify changed canonical HTML pages'
RESPONSES = {
    200: 'URLs received successfully (indexing is not guaranteed).',
    202: 'URLs accepted; IndexNow key validation is pending.',
    400: 'Invalid request format.',
    403: 'Key verification failed.',
    422: 'URLs or key do not match the host/protocol.',
    429: 'Rate limited. No automatic POST retry; retry manually later.',
}


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def source(ref, path):
    return git('show', f'{ref}:{path}')


def digest(data):
    # Git checkouts on Windows can have CRLF; Pages serves Git's LF blobs.
    return hashlib.sha256(data.replace(b'\r\n', b'\n')).hexdigest()


def html_digest(data):
    """Ignore only known Cloudflare email/analytics transforms and tag whitespace."""
    text = data.decode('utf-8-sig')

    def email(encoded):
        raw = bytes.fromhex(encoded)
        return escape(bytes(value ^ raw[0] for value in raw[1:]).decode('utf-8'))

    text = re.sub(r'<span\b(?=[^>]*\bclass=[\"\']__cf_email__[\"\'])'
                  r'(?=[^>]*\bdata-cfemail=[\"\']([0-9a-f]+)[\"\'])[^>]*>.*?</span>',
                  lambda match: email(match[1]), text, flags=re.I | re.S)
    text = re.sub(r'/cdn-cgi/l/email-protection#([0-9a-f]+)',
                  lambda match: 'mailto:' + email(match[1]), text, flags=re.I)
    text = re.sub(r'<script\b(?=[^>]*\bsrc=[\"\'](?:'
                  r'/cdn-cgi/scripts/[^\"\']+/cloudflare-static/email-decode\.min\.js|'
                  r'https://static\.cloudflareinsights\.com/beacon\.min\.js[^\"\']*)'
                  r'[\"\'])[^>]*>.*?</script\s*>', '', text, flags=re.I | re.S)
    return digest(re.sub(r'>\s+<', '><', text).strip().encode('utf-8'))


def validate_url(url):
    parsed = urlsplit(url)
    path = unquote(parsed.path)
    if (parsed.scheme != 'https' or parsed.netloc != HOST
            or parsed.query or parsed.fragment or not parsed.path.startswith('/')
            or '\\' in path or any(p in ('.', '..') for p in path.split('/'))
            or re.search(r'[\x00-\x20\x7f]', url + path)
            or (not path.endswith('/') and not path.endswith('.html'))
            or path.startswith(('/assets/', '/scripts/', '/.'))
            or path == '/404.html'):
        raise ValueError(f'Not an official canonical HTML URL: {url}')
    return url


class Page(HTMLParser):
    def __init__(self, data):
        super().__init__(convert_charrefs=True)
        self.canonicals = []
        self.noindex = False
        self.feed(data.decode('utf-8-sig'))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'link' and 'canonical' in attrs.get('rel', '').lower().split():
            self.canonicals.append(attrs.get('href', ''))
        if tag == 'meta' and attrs.get('name', '').lower() in ('robots', 'bingbot'):
            directives = re.split(r'[\s,]+', attrs.get('content', '').lower())
            self.noindex |= bool({'noindex', 'none'} & set(directives))

    handle_startendtag = handle_starttag


def manifest(ref):
    robots = RobotFileParser()
    robots.parse(source(ref, 'robots.txt').decode('utf-8-sig').splitlines())
    entries = {}
    paths = git('ls-tree', '-r', '--name-only', '-z', ref).decode().split('\0')
    for path in paths:
        if (not path.endswith('.html') or path == '404.html'
                or path.startswith(('assets/', 'scripts/', '.'))):
            continue
        data = source(ref, path)
        page = Page(data)
        if page.noindex or not page.canonicals:
            continue
        if len(page.canonicals) != 1:
            raise ValueError(f'{path}: expected exactly one canonical')
        url = validate_url(page.canonicals[0])
        # Aliases with a canonical pointing elsewhere do not create submissions.
        expected_path = path[:-10] if path == 'index.html' or path.endswith('/index.html') else path
        if url != f'{ORIGIN}/{expected_path}':
            continue
        if not robots.can_fetch('*', url) or not robots.can_fetch('bingbot', url):
            continue
        if url in entries:
            raise ValueError(f'Duplicate canonical: {url}')
        entries[url] = {'path': path, 'digest': digest(data)}
    return entries


def sitemap_urls(data):
    root = ET.fromstring(data)
    namespace = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
    if root.tag != f'{namespace}urlset':
        raise ValueError('Expected a sitemap urlset')
    return sorted({validate_url(node.text.strip())
                   for node in root.findall(f'{namespace}url/{namespace}loc')})


def select_urls(current, previous, listed):
    if previous is None:
        missing = set(listed) - current.keys()
        if missing:
            raise ValueError(f'Sitemap URLs are not canonical/indexable: {sorted(missing)}')
        return sorted(listed)
    return sorted(url for url in current.keys() | previous.keys()
                  if current.get(url) != previous.get(url))


def request(url, payload=None, headers=None):
    request_headers = {'User-Agent': 'JRCHOLAN-IndexNow/1.0', **(headers or {})}
    if payload is not None:
        request_headers['Content-Type'] = 'application/json; charset=utf-8'
    req = Request(url, data=payload, headers=request_headers)
    try:
        with urlopen(req, timeout=30) as response:
            return response.status, response.read(), response.headers, response.url
    except HTTPError as error:
        return error.code, error.read(), error.headers, error.url


def github(path):
    headers = {'Accept': 'application/vnd.github+json'}
    token = os.environ.get('GITHUB_TOKEN')
    if token:
        headers['Authorization'] = f'Bearer {token}'
    status, body, _, _ = request(f'https://api.github.com/repos/{REPOSITORY}/{path}', headers=headers)
    if status != 200:
        raise RuntimeError(f'GitHub {path}: HTTP {status}')
    return json.loads(body)


def deployment_ready(ref):
    if os.environ.get('GITHUB_SHA') and os.environ['GITHUB_SHA'] != ref:
        raise RuntimeError('Workflow head SHA differs from the checked-out deployment; no checkpoint can be recorded.')
    main = github('git/ref/heads/main')['object']['sha']
    build = github('pages/builds/latest')
    if main != ref:
        raise RuntimeError('This checkout is no longer the current main; do not notify a stale deployment.')
    if build.get('status') != 'built' or build.get('commit') != ref:
        raise RuntimeError(f'Pages has not published {ref}: {build.get("status")} {build.get("commit")}')
    print(f'Pages build verified: {ref}')


def previous_submission():
    run_id = os.environ.get('GITHUB_RUN_ID', '')
    attempt = int(os.environ.get('GITHUB_RUN_ATTEMPT', '1'))
    # Re-running an already successful attempt must not repeat the same POST.
    for number in range(1, attempt):
        prior = github(f'actions/runs/{run_id}/attempts/{number}')
        if prior.get('conclusion') == 'success' and notification_completed(run_id, number):
            return prior['head_sha']
    page = 1
    while True:
        runs = github(f'actions/workflows/{WORKFLOW}/runs?branch=main&status=success&per_page=100&page={page}')
        for run in runs['workflow_runs']:
            if str(run['id']) != run_id and notification_completed(run['id']):
                return run['head_sha']
        if len(runs['workflow_runs']) < 100:
            return None
        page += 1


def notification_completed(run_id, attempt=None):
    path = f'actions/runs/{run_id}/'
    if attempt is not None:
        path += f'attempts/{attempt}/'
    jobs = github(path + 'jobs?per_page=100')['jobs']
    return any(job.get('conclusion') == 'success' and
               any(step.get('name') == NOTIFY_STEP and step.get('conclusion') == 'success'
                   for step in job.get('steps', [])) for job in jobs)


def verify_public(url, expected=None, removed=False):
    last_error = None
    # Retry GETs for CDN propagation, never POSTs.
    for attempt in range(3):
        try:
            status, body, headers, final_url = request(url)
            print(f'GET {url} -> HTTP {status}')
            if final_url != url:
                raise RuntimeError(f'Unexpected redirect: {url} -> {final_url}')
            if removed:
                if status not in (404, 410):
                    raise RuntimeError(f'Removed page still exists: {url} (HTTP {status})')
            else:
                if status != 200:
                    raise RuntimeError(f'{url}: expected HTTP 200, received {status}')
                is_html = url.endswith(('/', '.html'))
                content_digest = html_digest if is_html else digest
                if expected is not None and content_digest(body) != content_digest(expected):
                    raise RuntimeError(f'Published content does not match the deployed commit: {url}')
                if url != KEY_LOCATION and url.endswith(('/', '.html')):
                    if 'text/html' not in headers.get('Content-Type', ''):
                        raise RuntimeError(f'Not HTML: {url}')
                    page = Page(body)
                    if page.noindex or page.canonicals != [url]:
                        raise RuntimeError(f'Page is not canonical/indexable: {url}')
                    if re.search(r'\b(noindex|none)\b', headers.get('X-Robots-Tag', ''), re.I):
                        raise RuntimeError(f'X-Robots-Tag prevents indexing: {url}')
                if url == KEY_LOCATION and body != KEY.encode('utf-8'):
                    raise RuntimeError('Published key must contain only the exact UTF-8 key')
            return
        except (OSError, RuntimeError) as error:
            last_error = error
            if attempt < 2:
                time.sleep(10)
    raise RuntimeError(str(last_error))


def submit(urls):
    if not urls or len(urls) > 10000:
        raise ValueError('Expected between 1 and 10000 unique URLs')
    if len(set(urls)) != len(urls):
        raise ValueError('Duplicate URLs in submission')
    for url in urls:
        validate_url(url)
    payload = json.dumps({'host': HOST, 'key': KEY, 'keyLocation': KEY_LOCATION,
                          'urlList': urls}).encode('utf-8')
    status, body, headers, _ = request(ENDPOINT, payload=payload)
    message = RESPONSES.get(status, 'Unexpected IndexNow response.')
    print(f'POST {ENDPOINT} -> HTTP {status}: {message}')
    if body:
        print(body.decode('utf-8', errors='replace')[:2000])
    if headers.get('Retry-After'):
        print(f'Retry-After: {headers["Retry-After"]}')
    if status not in (200, 202):
        raise RuntimeError(f'IndexNow HTTP {status}: {message}')
    return status


def summary(message):
    print(message)
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8') as output:
            output.write(message + '\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dry-run', action='store_true', help='Plan only; no network or POST')
    parser.add_argument('--base', help='Git checkpoint for an offline dry run')
    args = parser.parse_args()
    if not args.dry_run and os.environ.get('GITHUB_ACTIONS') != 'true':
        raise ValueError('Live submissions run only in GitHub Actions; use --dry-run locally.')
    ref = git('rev-parse', 'HEAD').decode().strip()
    if source(ref, f'{KEY}.txt') != KEY.encode('utf-8'):
        raise ValueError('Key file must contain only the existing UTF-8 key, without BOM/newline')
    if source(ref, 'CNAME').decode().strip() != HOST:
        raise ValueError('CNAME does not match the official domain')
    if not args.dry_run:
        deployment_ready(ref)
    base = args.base if args.dry_run else previous_submission()
    if base:
        subprocess.run(['git', 'merge-base', '--is-ancestor', base, ref], cwd=ROOT, check=True)
    current = manifest(ref)
    previous = manifest(base) if base else None
    sitemap = source(ref, 'sitemap.xml')
    urls = select_urls(current, previous, sitemap_urls(sitemap))
    summary(f'Commit: `{ref}`\n\nCheckpoint: `{base or "initial sitemap submission"}`')
    if not urls:
        summary('No new, changed, or removed canonical HTML pages. No IndexNow POST sent.')
        return
    summary('URLs to notify:\n\n' + '\n'.join(f'- {url}' for url in urls))
    if args.dry_run:
        print('Dry run: no requests sent.')
        return
    verify_public(KEY_LOCATION, KEY.encode('utf-8'))
    verify_public(f'{ORIGIN}/robots.txt', source(ref, 'robots.txt'))
    if previous is None:
        verify_public(f'{ORIGIN}/sitemap.xml', sitemap)
    tracked = set(git('ls-tree', '-r', '--name-only', ref).decode().splitlines())
    for url in urls:
        if url in current:
            verify_public(url, source(ref, current[url]['path']))
        elif previous[url]['path'] not in tracked:
            verify_public(url, removed=True)
        else:
            # HTML made noindex, disallowed, or canonicalized elsewhere still
            # needs a removal notification. Verify the published changed bytes.
            path = previous[url]['path']
            status, body, _, final_url = request(url)
            print(f'GET {url} -> HTTP {status} (removed from indexable pages)')
            if final_url != url or status != 200 or html_digest(body) != html_digest(source(ref, path)):
                raise RuntimeError(f'Changed indexing directives not yet published: {url}')
    deployment_ready(ref)
    status = submit(urls)
    summary(f'IndexNow HTTP **{status}**: {RESPONSES[status]}\n\nPages deployment is independent of this notification workflow.')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        summary(f'::error::{error}\n\nNo successful checkpoint recorded. Pages remains deployed; retry this workflow after fixing the error.')
        sys.exit(1)
