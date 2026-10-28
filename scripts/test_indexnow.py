"""Offline regression coverage for IndexNow selection and publication safeguards."""
import contextlib
import io
import json
import os
import unittest
from unittest.mock import patch

import indexnow as subject


def html(url=subject.ORIGIN + '/', extra=''):
    return (f'<html><head><link rel="canonical" href="{url}">{extra}'
            '</head><body>Portfolio</body></html>').encode()


class UrlAndPageTests(unittest.TestCase):
    def test_official_canonical_pages_are_allowed(self):
        for url in (subject.ORIGIN + '/', subject.ORIGIN + '/privacidad.html',
                    subject.ORIGIN + '/work/case.html', subject.ORIGIN + '/work/'):
            with self.subTest(url=url):
                self.assertEqual(subject.validate_url(url), url)

    def test_assets_aliases_and_untrusted_urls_are_rejected(self):
        paths = ('/script.js', '/photo.webp', '/404.html', '/assets/page.html',
                 '/scripts/page.html', '/.github/page.html', '/%2e%2e/page.html',
                 '/work/../page.html', '/work/%5cpage.html', '/page.html?x=1',
                 '/page.html#section', '/bad%0apage.html')
        urls = [subject.ORIGIN + path for path in paths]
        urls += ['http://jrcholan.lat/', 'https://www.jrcholan.lat/',
                 'https://jrcholan.lat:443/', 'https://user@jrcholan.lat/',
                 'https://jrcholan.lat.evil.example/', '//jrcholan.lat/']
        for url in urls:
            with self.subTest(url=url), self.assertRaises(ValueError):
                subject.validate_url(url)

    def test_parser_handles_case_entities_and_self_closing_tags(self):
        page = subject.Page(b'\xef\xbb\xbf<LINK REL="alternate CANONICAL" '
                            b'HREF="https://jrcholan.lat/" />')
        self.assertEqual(page.canonicals, [subject.ORIGIN + '/'])
        self.assertFalse(page.noindex)

    def test_robots_and_bingbot_noindex_or_none(self):
        for name, directive in (('ROBOTS', 'NOINDEX, follow'),
                                ('bingbot', 'none'), ('robots', 'noindex')):
            with self.subTest(name=name, directive=directive):
                page = subject.Page(html(extra=f'<meta name="{name}" content="{directive}">'))
                self.assertTrue(page.noindex)
        self.assertFalse(subject.Page(html(extra='<meta name="robots" content="index, follow">')).noindex)

    def test_crlf_does_not_create_a_content_change(self):
        self.assertEqual(subject.digest(b'first\nsecond\n'),
                         subject.digest(b'first\r\nsecond\r\n'))

    def test_cloudflare_email_and_beacon_normalization_preserves_the_page(self):
        address = 'jheferson@example.com'
        encoded = bytes([0x42] + [value ^ 0x42 for value in address.encode()]).hex()
        original = (f'<html><body><a href="mailto:{address}">{address}</a>'
                    '<p>Portfolio</p></body></html>').encode()
        transformed = (f'<html>\n<body><a href="/cdn-cgi/l/email-protection#{encoded}">'
                       f'<span class="__cf_email__" data-cfemail="{encoded}">[email protected]</span>'
                       '</a>\n<p>Portfolio</p>'
                       '<script data-cfasync="false" '
                       'src="/cdn-cgi/scripts/hash/cloudflare-static/email-decode.min.js"></script>'
                       '<script defer src="https://static.cloudflareinsights.com/beacon.min.js/hash" '
                       'data-cf-beacon="config"></script></body></html>').encode()
        self.assertEqual(subject.html_digest(original), subject.html_digest(transformed))
        self.assertNotEqual(subject.digest(original), subject.digest(transformed))
        self.assertNotEqual(subject.html_digest(original),
                            subject.html_digest(transformed.replace(b'Portfolio', b'Updated portfolio')))

    def test_html_normalization_keeps_ordinary_scripts_and_content_changes(self):
        original = html()
        changed_script = original.replace(b'</head>', b'<script src="/assets/js/main.js"></script></head>')
        changed_text = original.replace(b'Portfolio', b'Changed portfolio')
        for changed in (changed_script, changed_text):
            with self.subTest(changed=changed):
                self.assertNotEqual(subject.html_digest(original), subject.html_digest(changed))

    def test_manifest_excludes_noindex_verification_aliases_and_assets(self):
        files = {
            'robots.txt': b'User-agent: *\nDisallow: /blocked.html\n',
            'index.html': html(),
            'work/index.html': html(subject.ORIGIN + '/work/'),
            'work/case.html': html(subject.ORIGIN + '/work/case.html'),
            'blocked.html': html(subject.ORIGIN + '/blocked.html'),
            'noindex.html': html(subject.ORIGIN + '/noindex.html',
                                 '<meta name="robots" content="noindex">'),
            'alias.html': html(),
            'yandex_verification.html': b'<html>Verification only</html>',
            '404.html': html(subject.ORIGIN + '/404.html'),
            'assets/internal.html': html(subject.ORIGIN + '/assets/internal.html'),
            '.github/internal.html': html(subject.ORIGIN + '/.github/internal.html'),
        }
        with patch.object(subject, 'git', return_value='\0'.join(files).encode()), \
                patch.object(subject, 'source', side_effect=lambda ref, path: files[path]):
            result = subject.manifest('test-ref')
        self.assertEqual(set(result), {subject.ORIGIN + '/', subject.ORIGIN + '/work/',
                                       subject.ORIGIN + '/work/case.html'})
        self.assertEqual(result[subject.ORIGIN + '/']['path'], 'index.html')

    def test_manifest_rejects_multiple_canonicals(self):
        files = {'robots.txt': b'User-agent: *\nAllow: /\n',
                 'index.html': html(extra='<link rel="canonical" href="https://jrcholan.lat/">')}
        with patch.object(subject, 'git', return_value=b'index.html\0'), \
                patch.object(subject, 'source', side_effect=lambda ref, path: files[path]), \
                self.assertRaises(ValueError):
            subject.manifest('test-ref')


class SelectionTests(unittest.TestCase):
    def setUp(self):
        self.home = subject.ORIGIN + '/'
        self.old = subject.ORIGIN + '/old.html'
        self.new = subject.ORIGIN + '/new.html'
        self.entry = {'path': 'index.html', 'digest': 'unchanged'}

    def test_initial_only_uses_canonical_indexable_sitemap_urls(self):
        current = {self.home: self.entry, self.new: {'path': 'new.html', 'digest': 'new'}}
        self.assertEqual(subject.select_urls(current, None, [self.home]), [self.home])
        with self.assertRaises(ValueError):
            subject.select_urls(current, None, [self.old])

    def test_sitemap_deduplicates_and_rejects_external_urls(self):
        def xml(locations):
            return ('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
                    ''.join(f'<url><loc>{url}</loc></url>' for url in locations) + '</urlset>').encode()
        self.assertEqual(subject.sitemap_urls(xml([self.home, self.home])), [self.home])
        with self.assertRaises(ValueError):
            subject.sitemap_urls(xml(['https://example.com/']))

    def test_unchanged_pages_produce_no_submission(self):
        current = {self.home: self.entry}
        self.assertEqual(subject.select_urls(current, dict(current), [self.home]), [])

    def test_added_changed_removed_and_renamed_pages_are_selected_once(self):
        previous = {self.home: self.entry, self.old: {'path': 'old.html', 'digest': 'old'}}
        current = {self.home: {'path': 'index.html', 'digest': 'changed'},
                   self.new: {'path': 'new.html', 'digest': 'old'}}
        self.assertEqual(subject.select_urls(current, previous, []),
                         sorted([self.home, self.old, self.new]))


class PublicVerificationTests(unittest.TestCase):
    def setUp(self):
        self.output = contextlib.redirect_stdout(io.StringIO())
        self.output.__enter__()
        self.addCleanup(self.output.__exit__, None, None, None)
        self.sleep = patch.object(subject.time, 'sleep').start()
        self.addCleanup(patch.stopall)

    def test_exact_published_key_is_required(self):
        response = (200, subject.KEY.encode(), {}, subject.KEY_LOCATION)
        with patch.object(subject, 'request', return_value=response) as request:
            subject.verify_public(subject.KEY_LOCATION, subject.KEY.encode())
            self.assertEqual(request.call_count, 1)
        for body in (subject.KEY.encode() + b'\n', b'\xef\xbb\xbf' + subject.KEY.encode(), b'wrong-key'):
            with self.subTest(body=body), \
                    patch.object(subject, 'request', return_value=(200, body, {}, subject.KEY_LOCATION)), \
                    self.assertRaises(RuntimeError):
                subject.verify_public(subject.KEY_LOCATION)

    def test_stale_content_retries_get_until_exact_bytes_are_published(self):
        url = subject.ORIGIN + '/'
        body = html()
        responses = [(200, body + b'stale', {'Content-Type': 'text/html'}, url),
                     (200, body, {'Content-Type': 'text/html; charset=utf-8'}, url)]
        with patch.object(subject, 'request', side_effect=responses) as request:
            subject.verify_public(url, body)
            self.assertEqual(request.call_count, 2)
        self.sleep.assert_called_once_with(10)

    def test_noncanonical_noindex_nonhtml_and_redirects_are_rejected(self):
        url = subject.ORIGIN + '/'
        cases = [
            (200, html(subject.ORIGIN + '/other.html'), {'Content-Type': 'text/html'}, url),
            (200, html(extra='<meta name="robots" content="noindex">'), {'Content-Type': 'text/html'}, url),
            (200, html(), {'Content-Type': 'text/plain'}, url),
            (200, html(), {'Content-Type': 'text/html', 'X-Robots-Tag': 'noindex'}, url),
            (200, html(), {'Content-Type': 'text/html'}, 'https://example.com/'),
            (404, html(), {'Content-Type': 'text/html'}, url),
        ]
        for response in cases:
            with self.subTest(response=response), \
                    patch.object(subject, 'request', return_value=response), \
                    self.assertRaises(RuntimeError):
                subject.verify_public(url)

    def test_removed_pages_accept_only_real_404_or_410(self):
        url = subject.ORIGIN + '/deleted.html'
        for status in (404, 410):
            with self.subTest(status=status), \
                    patch.object(subject, 'request', return_value=(status, b'gone', {}, url)):
                subject.verify_public(url, removed=True)
        with patch.object(subject, 'request', return_value=(200, b'custom 404', {}, url)), \
                self.assertRaises(RuntimeError):
            subject.verify_public(url, removed=True)


class SubmissionAndDeploymentTests(unittest.TestCase):
    def setUp(self):
        self.output = contextlib.redirect_stdout(io.StringIO())
        self.output.__enter__()
        self.addCleanup(self.output.__exit__, None, None, None)

    def test_post_uses_official_host_key_location_and_json_once(self):
        urls = [subject.ORIGIN + '/', subject.ORIGIN + '/privacidad.html']
        for status in (200, 202):
            with self.subTest(status=status), \
                    patch.object(subject, 'request', return_value=(status, b'', {}, subject.ENDPOINT)) as request:
                self.assertEqual(subject.submit(urls), status)
                request.assert_called_once()
                self.assertEqual(request.call_args.args, (subject.ENDPOINT,))
                self.assertEqual(json.loads(request.call_args.kwargs['payload']),
                                 {'host': subject.HOST, 'key': subject.KEY,
                                  'keyLocation': subject.KEY_LOCATION, 'urlList': urls})

    def test_error_codes_and_transport_failure_never_retry_post(self):
        for status in (400, 403, 422, 429, 500):
            with self.subTest(status=status), \
                    patch.object(subject, 'request', return_value=(status, b'', {'Retry-After': '60'}, subject.ENDPOINT)) as request, \
                    self.assertRaises(RuntimeError):
                subject.submit([subject.ORIGIN + '/'])
            request.assert_called_once()
        with patch.object(subject, 'request', side_effect=OSError('connection interrupted')) as request, \
                self.assertRaises(OSError):
            subject.submit([subject.ORIGIN + '/'])
        request.assert_called_once()

    def test_invalid_or_duplicate_batches_never_reach_network(self):
        with patch.object(subject, 'request') as request:
            for urls in ([], [subject.ORIGIN + '/'] * 2,
                         [subject.ORIGIN + '/script.js'], ['https://example.com/']):
                with self.subTest(urls=urls), self.assertRaises(ValueError):
                    subject.submit(urls)
            request.assert_not_called()

    def test_deployment_requires_current_main_and_exact_successful_pages_commit(self):
        ref = 'a' * 40
        with patch.dict(os.environ, {}, clear=True), \
                patch.object(subject, 'github', side_effect=[{'object': {'sha': ref}},
                                                         {'status': 'built', 'commit': ref}]):
            subject.deployment_ready(ref)
        for main, build in ((ref, {'status': 'building', 'commit': ref}),
                            (ref, {'status': 'built', 'commit': 'b' * 40}),
                            ('b' * 40, {'status': 'built', 'commit': ref})):
            with self.subTest(main=main, build=build), \
                    patch.dict(os.environ, {}, clear=True), \
                    patch.object(subject, 'github', side_effect=[{'object': {'sha': main}}, build]), \
                    self.assertRaises(RuntimeError):
                subject.deployment_ready(ref)

    def test_workflow_context_must_match_the_deployment_sha(self):
        with patch.dict(os.environ, {'GITHUB_SHA': 'b' * 40}, clear=True), \
                patch.object(subject, 'github') as github, \
                self.assertRaises(RuntimeError):
            subject.deployment_ready('a' * 40)
        github.assert_not_called()


class CheckpointTests(unittest.TestCase):
    def test_only_successful_notification_steps_form_a_checkpoint(self):
        fixtures = [
            ({'jobs': [{'conclusion': 'skipped', 'steps': []}]}, False),
            ({'jobs': [{'conclusion': 'success', 'steps': [
                {'name': subject.NOTIFY_STEP, 'conclusion': 'skipped'}]}]}, False),
            ({'jobs': [{'conclusion': 'failure', 'steps': [
                {'name': subject.NOTIFY_STEP, 'conclusion': 'success'}]}]}, False),
            ({'jobs': [{'conclusion': 'success', 'steps': [
                {'name': subject.NOTIFY_STEP, 'conclusion': 'success'}]}]}, True),
        ]
        for fixture, expected in fixtures:
            with self.subTest(fixture=fixture), patch.object(subject, 'github', return_value=fixture):
                self.assertEqual(subject.notification_completed(12), expected)

    def test_notification_can_be_checked_for_a_specific_prior_attempt(self):
        with patch.object(subject, 'github', return_value={'jobs': []}) as github:
            self.assertFalse(subject.notification_completed('12', 2))
        github.assert_called_once_with('actions/runs/12/attempts/2/jobs?per_page=100')

    def test_checkpoint_search_skips_current_and_skipped_runs(self):
        runs = [{'id': 9, 'head_sha': 'current'}, {'id': 8, 'head_sha': 'skipped'},
                {'id': 7, 'head_sha': 'successful'}]
        with patch.dict(os.environ, {'GITHUB_RUN_ID': '9'}, clear=True), \
                patch.object(subject, 'github', return_value={'workflow_runs': runs}), \
                patch.object(subject, 'notification_completed', side_effect=lambda run_id: run_id == 7) as completed:
            self.assertEqual(subject.previous_submission(), 'successful')
        self.assertEqual(completed.call_args_list, [unittest.mock.call(8), unittest.mock.call(7)])

    def test_checkpoint_search_paginates_past_100_skipped_runs(self):
        first_page = [{'id': value, 'head_sha': 'skipped'} for value in range(100)]
        second_page = [{'id': 101, 'head_sha': 'successful'}]
        with patch.dict(os.environ, {'GITHUB_RUN_ID': '999'}, clear=True), \
                patch.object(subject, 'github', side_effect=[{'workflow_runs': first_page},
                                                             {'workflow_runs': second_page}]) as github, \
                patch.object(subject, 'notification_completed', side_effect=lambda run_id: run_id == 101):
            self.assertEqual(subject.previous_submission(), 'successful')
        self.assertEqual(github.call_count, 2)
        self.assertTrue(github.call_args_list[0].args[0].endswith('&page=1'))
        self.assertTrue(github.call_args_list[1].args[0].endswith('&page=2'))

    def test_rerun_of_successful_notification_does_not_submit_again(self):
        with patch.dict(os.environ, {'GITHUB_RUN_ID': '12', 'GITHUB_RUN_ATTEMPT': '2'}, clear=True), \
                patch.object(subject, 'github', return_value={'conclusion': 'success',
                                                             'head_sha': 'already-sent'}) as github, \
                patch.object(subject, 'notification_completed', return_value=True) as completed:
            self.assertEqual(subject.previous_submission(), 'already-sent')
        github.assert_called_once_with('actions/runs/12/attempts/1')
        completed.assert_called_once_with('12', 1)

    def test_successful_but_skipped_attempt_does_not_advance_checkpoint(self):
        with patch.dict(os.environ, {'GITHUB_RUN_ID': '12', 'GITHUB_RUN_ATTEMPT': '2'}, clear=True), \
                patch.object(subject, 'github', side_effect=[{'conclusion': 'success', 'head_sha': 'skipped'},
                                                             {'workflow_runs': []}]) as github, \
                patch.object(subject, 'notification_completed', return_value=False):
            self.assertIsNone(subject.previous_submission())
        self.assertEqual(github.call_count, 2)


if __name__ == '__main__':
    unittest.main()
