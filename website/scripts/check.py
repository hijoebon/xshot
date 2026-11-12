#!/usr/bin/env python3
"""Check the bilingual build's routes, references, and basic HTML semantics."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
from xml.etree import ElementTree
import base64
import binascii
import hashlib
import json
import math
import re
import struct
import sys

SITE = Path(__file__).resolve().parents[1]
ROOT = (SITE / 'dist').resolve()
LOCALES = {'en': ('', 'en'), 'zh': ('zh/', 'zh-CN')}
errors = []


def fail(path, message):
    errors.append(f'{path}: {message}')


def local_target(path, link):
    """Resolve relative and site-root URLs, leaving external URLs alone."""
    url = urlsplit(link)
    if url.scheme or url.netloc:
        return None, url
    route = unquote(url.path)
    target = (ROOT / route.lstrip('/')) if route.startswith('/') else path.parent / route
    target = target.resolve() if route else path
    if target.is_dir():
        target = target / 'index.html'
    return target, url


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path = path
        self.ids = set()
        self.links = []
        self.references = []
        self.switches = []
        self.alternates = []
        self.h1 = 0
        self.main = 0
        self.lang = ''
        self.locale = ''
        self.title = 0
        self.description = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            identifier = attrs['id']
            if not identifier or identifier in self.ids:
                fail(self.path, f'empty or duplicate ID {identifier!r}')
            self.ids.add(identifier)
        self.h1 += tag == 'h1'
        self.main += tag == 'main'
        self.title += tag == 'title'
        if tag == 'html':
            self.lang = attrs.get('lang', '')
        if tag == 'body':
            self.locale = attrs.get('data-locale', '')
        if tag == 'meta' and attrs.get('name') == 'description':
            self.description += bool(attrs.get('content', '').strip())
        if tag == 'img' and 'alt' not in attrs:
            fail(self.path, 'image without alt')
        if tag == 'button' and attrs.get('type') not in {'button', 'submit', 'reset'}:
            fail(self.path, 'button without explicit valid type')
        for key in ['href', 'src', 'poster']:
            if key in attrs:
                self.links.append(attrs[key])
        if 'srcset' in attrs:
            self.links.extend(candidate.strip().split()[0] for candidate in attrs['srcset'].split(',') if candidate.strip())
        if attrs.get('target', '').lower() == '_blank' and 'noopener' not in attrs.get('rel', '').lower().split():
            fail(self.path, 'new tab missing noopener')
        for key in ['aria-controls', 'aria-labelledby', 'aria-describedby', 'for', 'data-copy']:
            if key in attrs:
                self.references.extend((key, identifier) for identifier in attrs[key].split())
        if 'data-locale-link' in attrs:
            self.switches.append(attrs)
        if tag == 'link' and 'alternate' in attrs.get('rel', '').split() and 'hreflang' in attrs:
            self.alternates.append(attrs)


class NativeExport(HTMLParser):
    """Inspect the native player without imposing site-page UI conventions."""
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.lang = ''
        self.csp = ''
        self.external_assets = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'html':
            self.lang = attrs.get('lang', '')
        if 'id' in attrs:
            self.ids.add(attrs['id'])
        if tag == 'meta' and attrs.get('http-equiv', '').lower() == 'content-security-policy':
            self.csp = attrs.get('content', '')
        for key in ['src', 'href']:
            if attrs.get(key) and not attrs[key].startswith('data:image/png;base64,'):
                self.external_assets.append(attrs[key])


def check_native_export(path, entry):
    """The exact audited file must remain portable and contain valid PNG steps."""
    relative = path.relative_to(ROOT).as_posix()
    content = path.read_bytes()
    if len(content) != entry['bytes'] or hashlib.sha256(content).hexdigest() != entry['sha256']:
        fail(relative, 'native HTML does not match its audited byte length and SHA-256')
    source = content.decode('utf-8')
    page = NativeExport()
    page.feed(source)
    page.close()
    if page.lang != entry['language']:
        fail(relative, 'native player language differs from provenance manifest')
    if page.external_assets:
        fail(relative, 'native export references an external asset')
    if "connect-src 'none'" not in page.csp or 'img-src data:' not in page.csp:
        fail(relative, 'native offline CSP is missing')
    required = {'screen', 'hotspot', 'next', 'back', 'restart', 'restart-end', 'counter', 'complete'}
    if not required.issubset(page.ids):
        fail(relative, f'missing native player controls: {sorted(required - page.ids)}')
    match = re.search(r"window\.XShotDemo\.load\('([A-Za-z0-9+/=]+)',0,false\);", source)
    if not match:
        fail(relative, 'missing native, non-editing first-step payload')
        return
    try:
        payload = json.loads(base64.b64decode(match.group(1), validate=True))
        steps = payload['steps']
        ids = [step['id'] for step in steps]
        if len(steps) != entry['stepCount'] or len(set(ids)) != len(ids):
            fail(relative, 'native step count or unique IDs differ from manifest')
        size = entry['screenshotSize']
        if payload['title'] != entry['title'] or (payload['width'], payload['height']) != (size['width'], size['height']):
            fail(relative, 'native title or screenshot size differs from manifest')
        hotspots = 0
        for step in steps:
            if not isinstance(step.get('title'), str) or not isinstance(step.get('body'), str):
                fail(relative, 'step title and description must remain text')
            image = step['image']
            if not image.startswith('data:image/png;base64,'):
                fail(relative, 'step screenshot is not an embedded PNG')
                continue
            png = base64.b64decode(image.split(',', 1)[1], validate=True)
            if len(png) < 24 or png[:8] != b'\x89PNG\r\n\x1a\n' or png[12:16] != b'IHDR':
                fail(relative, 'step screenshot has an invalid PNG header')
            elif struct.unpack('>II', png[16:24]) != (size['width'], size['height']):
                fail(relative, 'step screenshot dimensions differ from manifest')
            if step.get('hotspot') is not None:
                hotspots += 1
                for coordinate in ['x', 'y']:
                    value = step['hotspot'][coordinate]
                    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not 0 <= value <= 1:
                        fail(relative, 'hotspot coordinate outside normalized screenshot bounds')
            if step.get('nextStepID') is not None and step['nextStepID'] not in ids:
                fail(relative, 'step links to a missing destination')
        if hotspots != entry['hotspotCount']:
            fail(relative, 'native hotspot count differs from manifest')
    except (ValueError, TypeError, KeyError, binascii.Error) as error:
        fail(relative, f'invalid native player payload: {error}')


demo_manifest = json.loads((SITE / 'demos/manifest.json').read_text(encoding='utf-8'))
native_exports = {}
for entry in demo_manifest['exports']:
    filename = entry['file']
    if Path(filename).name != filename or not filename.endswith('.html'):
        fail('demos/manifest.json', f'invalid exact export filename: {filename}')
        continue
    relative = f'demos/{filename}'
    if relative in native_exports:
        fail('demos/manifest.json', f'duplicate native export: {filename}')
    native_exports[relative] = entry


expected = {}
for locale, (prefix, lang) in LOCALES.items():
    content = 'docs-content.en.json' if locale == 'en' else 'docs-content.json'
    docs = json.loads((SITE / content).read_text(encoding='utf-8'))
    for suffix in ['index.html', 'docs/index.html', *(f'docs/{doc["slug"]}.html' for doc in docs)]:
        expected[prefix + suffix] = (locale, lang, suffix)

pages = {}
for path in sorted(ROOT.rglob('*.html')):
    relative = path.relative_to(ROOT).as_posix()
    if relative in native_exports:
        check_native_export(path, native_exports[relative])
        continue
    source = path.read_text(encoding='utf-8')
    page = Page(relative)
    page.feed(source)
    page.close()
    if relative not in expected:
        fail(relative, 'unexpected generated page')
        continue
    locale, lang, suffix = expected[relative]
    if page.h1 != 1 or page.main != 1:
        fail(relative, f'expected one h1 and main; found {page.h1} h1, {page.main} main')
    if page.title != 1 or page.description != 1:
        fail(relative, 'expected one title and nonempty meta description')
    if page.lang != lang or page.locale != locale:
        fail(relative, f'expected lang={lang} and data-locale={locale}, found {page.lang}/{page.locale}')
    if 'main' not in page.ids:
        fail(relative, 'missing main landmark target')
    for placeholder in set(re.findall(r'\$(?:\{[A-Za-z_]\w*\}|[A-Za-z_]\w*)', source)):
        fail(relative, f'unreplaced template {placeholder}')
    for attribute, identifier in page.references:
        if identifier not in page.ids:
            fail(relative, f'{attribute} references missing ID {identifier}')
    for language, (prefix, language_tag) in LOCALES.items():
        switches = [link for link in page.switches if link['data-locale-link'] == language]
        counterpart = ROOT / prefix / suffix
        if len(switches) != 1:
            fail(relative, f'expected one {language} language switch, found {len(switches)}')
            continue
        switch = switches[0]
        target, _ = local_target(path, switch.get('href', ''))
        if target != counterpart or switch.get('lang') != language_tag or switch.get('hreflang') != language_tag:
            fail(relative, f'{language} switch must keep the same article and language tag')
        if (switch.get('aria-current') == 'true') != (language == locale):
            fail(relative, f'{language} switch has incorrect current state')
    for language_tag, prefix in [('en', ''), ('zh-CN', 'zh/'), ('x-default', '')]:
        alternates = [link for link in page.alternates if link['hreflang'] == language_tag]
        if len(alternates) != 1:
            fail(relative, f'expected one {language_tag} alternate')
            continue
        href = alternates[0].get('href', '')
        target, url = local_target(path, href)
        # SITE_URL builds use absolute alternate URLs; compare their site path.
        if target is None:
            route = unquote(url.path).lstrip('/')
            target = ROOT / route
            if url.path.endswith('/') or not route:
                target = target / 'index.html'
        if target != ROOT / prefix / suffix:
            fail(relative, f'{language_tag} alternate does not point to the same article')
    pages[path] = page

for missing in sorted(set(expected) - {path.relative_to(ROOT).as_posix() for path in pages}):
    fail(missing, 'missing generated page')
for relative in native_exports:
    if not (ROOT / relative).is_file():
        fail(relative, 'missing manifest-listed native export')
if (ROOT / 'demos/manifest.json').read_bytes() != (SITE / 'demos/manifest.json').read_bytes():
    fail('demos/manifest.json', 'published native-export provenance differs from source')

# Policies must not overlap: matching _headers rules can be combined by hosts.
headers = {}
current = None
for line in (ROOT / '_headers').read_text(encoding='utf-8').splitlines():
    if not line.strip() or line.lstrip().startswith('#'):
        continue
    if not line.startswith((' ', '\t')):
        current = line.strip()
        if current in headers:
            fail('_headers', f'duplicate path rule: {current}')
        headers[current] = {}
    elif current:
        key, value = line.strip().split(':', 1)
        headers[current][key.lower()] = value.strip()
if 'content-security-policy' in headers.get('/*', {}):
    fail('_headers', 'global CSP would also restrict the native inline/data player')
site_paths = set()
for relative in expected:
    site_paths.add('/' + relative)
    site_paths.add('/' + (relative[:-10] if relative.endswith('index.html') else relative[:-5]))
demo_paths = {alias for relative in native_exports for alias in ['/' + relative, '/' + relative[:-5]]}
for route in site_paths | demo_paths:
    policy = headers.get(route, {}).get('content-security-policy', '')
    directives = {parts[0]: parts[1:] for item in policy.split(';') if (parts := item.split())}
    if route in demo_paths:
        for directive, values in {'default-src': ["'none'"], 'img-src': ['data:'],
                                  'script-src': ["'unsafe-inline'"], 'style-src': ["'unsafe-inline'"],
                                  'connect-src': ["'none'"], 'frame-ancestors': ["'self'"]}.items():
            if directives.get(directive) != values:
                fail('_headers', f'{route} native player requires {directive} {" ".join(values)}')
    elif directives.get('script-src') != ["'self'"] or directives.get('style-src') != ["'self'"] or directives.get('frame-src') != ["'self'"] or directives.get('frame-ancestors') != ["'none'"]:
        fail('_headers', f'{route} must preserve strict site scripts/styles and same-origin demo framing')
for route, values in headers.items():
    if 'content-security-policy' in values and route not in site_paths | demo_paths:
        fail('_headers', f'CSP applied beyond exact known site and native-export routes: {route}')

count = 0
svg_ids = {}
for path, page in pages.items():
    for link in page.links:
        target, url = local_target(path, link)
        if target is None:
            continue
        count += 1
        if not target.is_relative_to(ROOT):
            fail(page.path, f'link escapes site: {link}')
        elif not target.is_file():
            fail(page.path, f'missing target: {link}')
        elif url.fragment:
            identifier = unquote(url.fragment)
            if target in pages and identifier not in pages[target].ids:
                fail(page.path, f'missing HTML fragment: {link}')
            elif target.suffix == '.svg':
                if target not in svg_ids:
                    try:
                        svg_ids[target] = {node.get('id') for node in ElementTree.parse(target).iter() if node.get('id')}
                    except ElementTree.ParseError as error:
                        fail(page.path, f'invalid SVG {link}: {error}')
                        svg_ids[target] = set()
                if identifier not in svg_ids[target]:
                    fail(page.path, f'missing SVG fragment: {link}')

for stylesheet in ROOT.rglob('*.css'):
    for asset in re.findall(r'url\(\s*[\'\"]?([^\'\")]+)[\'\"]?\s*\)', stylesheet.read_text(encoding='utf-8')):
        target, _ = local_target(stylesheet, asset.strip())
        if target is not None and (not target.is_relative_to(ROOT) or not target.is_file()):
            fail(stylesheet.relative_to(ROOT), f'missing stylesheet asset: {asset}')

for filename in ['xshot-sans.woff2', 'dm-sans.woff2', 'caveat.woff2']:
    if not (ROOT / 'assets' / filename).is_file():
        fail('assets', f'missing self-hosted font {filename}')
if errors:
    print('\n'.join(errors))
    sys.exit(1)
print(f'PASS: {len(pages)} site pages, {len(native_exports)} hash-pinned native HTML export, {count} local links/assets; bilingual routes, site semantics, embedded PNG steps, native-player integrity and exact-route CSP checked')
