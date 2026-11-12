#!/usr/bin/env python3
"""Build XShot's portable, bilingual static website without dependencies.

English is the default at /; translated routes live under their language code.
All routes work without JavaScript and share a single copy of the site assets.
"""
from collections import OrderedDict
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from string import Template
from urllib.parse import urljoin
import hashlib
import json
import os
import posixpath
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist'
REPO = 'https://github.com/hijoebon/xshot'
RELEASE = f'{REPO}/releases/latest'
LOCALES = {
    'en': {'prefix': '', 'lang': 'en', 'label': 'EN', 'docs': 'docs-content.en.json'},
    'zh': {'prefix': 'zh/', 'lang': 'zh-CN', 'label': '中文', 'docs': 'docs-content.json'},
}
ORIGIN = os.environ.get('SITE_URL', '').rstrip('/')
PAGE_CSP = ("default-src 'self'; script-src 'self'; style-src 'self'; "
            "img-src 'self'; font-src 'self'; connect-src 'self'; frame-src 'self'; "
            "object-src 'none'; base-uri 'self'; frame-ancestors 'none'")
DEMO_CSP = ("default-src 'none'; img-src data:; style-src 'unsafe-inline'; "
            "script-src 'unsafe-inline'; connect-src 'none'; base-uri 'none'; "
            "form-action 'none'; frame-ancestors 'self'")


class Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_data(self, data):
        self.parts.append(data)


def plain(html):
    parser = Text()
    parser.feed(html)
    return re.sub(r'\s+', ' ', ' '.join(parser.parts)).strip()


def load_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def route(locale, suffix=''):
    return LOCALES[locale]['prefix'] + suffix


def relative(source, target):
    """Link a pretty route to another route, including nested language routes."""
    directory = source.rstrip('/') if source.endswith('/') else posixpath.dirname(source)
    directory = directory or '.'
    destination = target.rstrip('/') or '.'
    result = posixpath.relpath(destination, directory)
    if not result.startswith('.'):
        result = './' + result
    if target.endswith('/') or not target:
        result += '/'
    return result


def base_for(source, target=''):
    directory = source.rstrip('/') if source.endswith('/') else posixpath.dirname(source)
    return posixpath.relpath(target.rstrip('/') or '.', directory or '.')


def asset_url(base, filename):
    """Keep asset paths portable while invalidating stale browser responses."""
    version = hashlib.sha256((ROOT / filename).read_bytes()).hexdigest()[:12]
    return f'{base}/{filename}?v={version}'


def icon(name, base):
    return f'<svg class="icon" aria-hidden="true"><use href="{base}/assets/icons.svg#{name}"/></svg>'


def alternate_links(locale, suffix):
    source = route(locale, suffix)
    links = []
    for language, details in LOCALES.items():
        target = route(language, suffix)
        href = urljoin(ORIGIN + '/', target) if ORIGIN else relative(source, target)
        links.append(f'<link rel="alternate" hreflang="{details["lang"]}" href="{escape(href, quote=True)}">')
    default_route = route('en', suffix)
    default = urljoin(ORIGIN + '/', default_route) if ORIGIN else relative(source, default_route)
    links.append(f'<link rel="alternate" hreflang="x-default" href="{escape(default, quote=True)}">')
    if ORIGIN:
        links.append(f'<link rel="canonical" href="{escape(urljoin(ORIGIN + "/", source), quote=True)}">')
    return '\n'.join(links)


def language_switch(locale, suffix, ui):
    source = route(locale, suffix)
    links = []
    for language, details in LOCALES.items():
        current = ' aria-current="true"' if locale == language else ''
        links.append(f'<a href="{relative(source, route(language, suffix))}" lang="{details["lang"]}" hreflang="{details["lang"]}" data-locale-link="{language}"{current}>{details["label"]}</a>')
    return f'<nav class="language-switch" aria-label="{escape(ui["language_navigation"], quote=True)}">' + ''.join(links) + '</nav>'


def header(locale, suffix, ui, theme='default'):
    source = route(locale, suffix)
    base = base_for(source)
    home = relative(source, route(locale))
    docs = relative(source, route(locale, 'docs/'))
    started = relative(source, route(locale, 'docs/getting-started.html'))
    current = ' aria-current="page"' if suffix.startswith('docs/') else ''
    wordmark = 'wordmark-white.svg' if theme == 'hero' else 'wordmark.svg'
    external = icon('external', base)
    languages = language_switch(locale, suffix, ui)
    return f'''<a class="skip-link" href="#main">{escape(ui['skip_content'])}</a>
<header class="site-header"><div class="nav-wrap">
<a class="brand" href="{home}" aria-label="{escape(ui['home_label'], quote=True)}"><img src="{base}/assets/{wordmark}" width="124" height="47" alt="XShot"></a>
<nav class="desktop-nav" aria-label="{escape(ui['main_navigation'], quote=True)}"><a href="{home}#workflow">{escape(ui['features'])}</a><a href="{docs}"{current}>{escape(ui['docs'])}</a><a href="{REPO}" target="_blank" rel="noopener noreferrer">GitHub {external}</a></nav>
{languages}<a class="button button-small nav-cta" href="{started}">{escape(ui['get_started'])} {icon('arrow', base)}</a>
<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="{escape(ui['open_navigation'], quote=True)}">{icon('menu', base)}</button></div>
<nav class="mobile-nav" id="mobile-nav" aria-label="{escape(ui['mobile_navigation'], quote=True)}" hidden><a href="{home}">{escape(ui['home'])}</a><a href="{home}#workflow">{escape(ui['features'])}</a><a href="{docs}">{escape(ui['docs'])}</a><a href="{REPO}" target="_blank" rel="noopener noreferrer">{escape(ui['github_repository'])}</a><a href="{started}">{escape(ui['get_started'])}</a></nav></header>
<noscript><nav class="no-js" aria-label="{escape(ui['no_script_navigation'], quote=True)}"><a href="{home}">{escape(ui['home'])}</a> · <a href="{docs}">{escape(ui['help_directory'])}</a> · <a href="{REPO}">GitHub</a></nav></noscript>'''


def footer(locale, suffix, ui):
    source = route(locale, suffix)
    base = base_for(source)
    return f'''<footer class="site-footer wrap"><a class="brand" href="{relative(source, route(locale))}" aria-label="{escape(ui['home_label'], quote=True)}"><img src="{base}/assets/wordmark.svg" width="124" height="47" alt="XShot"></a><span>{escape(ui['footer_tagline'])}</span><nav aria-label="{escape(ui['footer_navigation'], quote=True)}"><a href="{relative(source, route(locale, 'docs/'))}">{escape(ui['help'])}</a><a href="{REPO}/issues" target="_blank" rel="noopener noreferrer">{escape(ui['feedback'])}</a><a href="{REPO}/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">MIT License</a></nav></footer>'''


def sidebar(docs, locale, suffix, ui, current=''):
    base = base_for(route(locale, suffix))
    groups = OrderedDict()
    for doc in docs:
        groups.setdefault(doc['group'], []).append(doc)
    links = []
    for group, entries in groups.items():
        links.append(f'<div class="sidebar-group"><p>{escape(group)}</p>')
        for doc in entries:
            selected = ' aria-current="page"' if doc['slug'] == current else ''
            links.append(f'<a href="./{doc["slug"]}.html"{selected}>{escape(doc["title"])}</a>')
        links.append('</div>')
    return f'''<aside class="docs-sidebar" aria-label="{escape(ui['docs_navigation'], quote=True)}"><a class="docs-home-link" href="./">{escape(ui['docs_home'])}</a><label class="search-label" for="docs-search">{escape(ui['search_label'])}</label><div class="search-field">{icon('search', base)}<input type="search" id="docs-search" placeholder="{escape(ui['search_placeholder'], quote=True)}" autocomplete="off" aria-controls="search-results" aria-describedby="search-status"></div><p class="search-status" id="search-status" role="status" aria-live="polite"></p><div class="search-results" id="search-results" hidden></div><details open><summary>{escape(ui['browse_docs'])}</summary>{''.join(links)}</details><p class="docs-version">{escape(ui['version'])}<br>{escape(ui['requirements'])}</p></aside>'''


def page(locale, suffix, ui, title, description, content):
    source = route(locale, suffix)
    base = base_for(source)
    locale_base = base_for(source, LOCALES[locale]['prefix'])
    return f'''<!doctype html>
<html lang="{LOCALES[locale]['lang']}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{escape(title)} — {escape(ui['help_suffix'])}</title><meta name="description" content="{escape(description, quote=True)}"><meta name="theme-color" content="#f7f7f5">{alternate_links(locale, suffix)}<link rel="icon" type="image/svg+xml" href="{base}/assets/favicon.svg"><link rel="stylesheet" href="{asset_url(base, 'styles.css')}"><script src="{asset_url(base, 'app.js')}" defer></script></head><body class="docs-body" data-locale="{locale}" data-base="{base}" data-locale-base="{locale_base}">{header(locale, suffix, ui)}<main class="docs-shell" id="main">{content}</main>{footer(locale, suffix, ui)}</body></html>'''


def body_with_controls(body, locale, suffix, ui):
    base = base_for(route(locale, suffix))
    body = body.replace('../assets/', f'{base}/assets/')
    body = re.sub(r'<table>(.*?)</table>', r'<div class="table-scroll"><table>\1</table></div>', body, flags=re.S)
    counter = 0

    def code(match):
        nonlocal counter
        counter += 1
        return f'<div class="code-wrap"><div class="code-toolbar"><span>{escape(ui["terminal"])}</span><button type="button" class="copy-button" data-copy="code-{counter}" aria-label="{escape(ui["copy_label"], quote=True)}">{escape(ui["copy_command"])}</button></div><pre><code id="code-{counter}">{match.group(1)}</code></pre></div>'

    return re.sub(r'<pre><code>(.*?)</code></pre>', code, body, flags=re.S)


def flatten_copy(values, prefix=''):
    flattened = {}
    for key, value in values.items():
        name = f'{prefix}_{key}' if prefix else key
        if isinstance(value, dict):
            flattened.update(flatten_copy(value, name))
        elif isinstance(value, (str, int, float)):
            flattened[name] = str(value)
            flattened[name.upper()] = str(value)
    return flattened


def write_route(destination, html):
    path = OUT / destination
    if destination.endswith('/') or not destination:
        path = path / 'index.html'
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html, encoding='utf-8')


def copy_demos():
    """Publish only audited, hash-pinned native exports from the manifest."""
    manifest_path = ROOT / 'demos' / 'manifest.json'
    manifest = load_json(manifest_path)
    destination = OUT / 'demos'
    destination.mkdir()
    shutil.copyfile(manifest_path, destination / 'manifest.json')
    routes = []
    for entry in manifest['exports']:
        filename = entry['file']
        if Path(filename).name != filename or not filename.endswith('.html'):
            raise SystemExit(f'Invalid demo filename: {filename}')
        source = ROOT / 'demos' / filename
        content = source.read_bytes()
        if len(content) != entry['bytes'] or hashlib.sha256(content).hexdigest() != entry['sha256']:
            raise SystemExit(f'Demo no longer matches its audited export: {filename}')
        shutil.copyfile(source, destination / filename)
        routes.append(f'demos/{filename}')
    return routes


def headers_for(routes, demo_routes):
    """Keep page CSP and native-player CSP on disjoint, exact URL paths.

    _headers hosts can merge matching policies instead of overriding them.
    Applying the strict site CSP to /* would block the native export's inline
    player and embedded screenshots even if a later rule allowed them.
    """
    lines = ['/*', '  X-Content-Type-Options: nosniff',
             '  Referrer-Policy: strict-origin-when-cross-origin', '']
    for route_path in routes:
        paths = ['/' + route_path]
        if not route_path or route_path.endswith('/'):
            paths.append('/' + route_path + 'index.html')
        elif route_path.endswith('.html'):
            paths.append('/' + route_path[:-5])
        for path in paths:
            lines.extend([path, f'  Content-Security-Policy: {PAGE_CSP}', ''])
    for route_path in demo_routes:
        for path in ['/' + route_path, '/' + route_path[:-5]]:
            lines.extend([path, f'  Content-Security-Policy: {DEMO_CSP}', ''])
    return '\n'.join(lines)


def build_locale(locale, template):
    details = LOCALES[locale]
    docs = load_json(ROOT / details['docs'])
    ui = load_json(ROOT / 'locales' / f'ui.{locale}.json')
    home = load_json(ROOT / 'locales' / f'home.{locale}.json')
    copy = flatten_copy(home)
    copy.update({
        'LANG': details['lang'], 'LOCALE': locale,
        'BASE': base_for(route(locale)), 'LOCALE_BASE': '.',
        'STYLES_URL': asset_url(base_for(route(locale)), 'styles.css'),
        'HERO_SCRIPT_URL': asset_url(base_for(route(locale)), 'hero-paper.js'),
        'APP_SCRIPT_URL': asset_url(base_for(route(locale)), 'app.js'),
        'REPO_URL': REPO, 'RELEASE_URL': RELEASE,
        'HEADER': header(locale, '', ui, theme='hero'), 'FOOTER': footer(locale, '', ui),
        'TITLE': escape(home.get('meta_title', home.get('title', 'XShot — Capture a thought. Make it clear.'))),
        'DESCRIPTION': escape(home.get('meta_description', home.get('description', ui['footer_tagline'])), quote=True),
        'LANGUAGE_ALTERNATES': alternate_links(locale, ''),
    })
    try:
        landing = Template(template).substitute(copy)
    except (KeyError, ValueError) as error:
        raise SystemExit(f'Cannot build {locale} landing page: {error}') from error
    write_route(route(locale), landing)

    for index, doc in enumerate(docs):
        suffix = f'docs/{doc["slug"]}.html'
        base = base_for(route(locale, suffix))
        headings = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', doc['body'], re.S)
        toc = f'<aside class="page-toc" aria-label="{escape(ui["on_this_page"], quote=True)}"><p>{escape(ui["on_this_page"])}</p>' + ''.join(f'<a href="#{key}">{escape(plain(label))}</a>' for key, label in headings) + '</aside>'
        pagination = f'<nav class="doc-pagination" aria-label="{escape(ui["adjacent_articles"], quote=True)}">'
        for step, label in [(-1, ui['previous']), (1, ui['next'])]:
            target = index + step
            if 0 <= target < len(docs):
                other = docs[target]
                pagination += f'<a href="./{other["slug"]}.html"><small>{escape(label)}</small><strong>{escape(other["title"])}</strong></a>'
            else:
                pagination += '<span></span>'
        pagination += '</nav>'
        article = f'''<article class="doc-article"><nav class="breadcrumbs" aria-label="{escape(ui['breadcrumbs'], quote=True)}"><a href="../">{escape(ui['home'])}</a><span aria-hidden="true">/</span><a href="./">{escape(ui['help'])}</a><span aria-hidden="true">/</span><span>{escape(doc['title'])}</span></nav><h1>{escape(doc['title'])}</h1><p class="doc-description">{escape(doc['description'])}</p><div class="doc-body">{body_with_controls(doc['body'], locale, suffix, ui)}</div><div class="doc-meta"><span>{escape(ui['updated'])}</span><a href="{REPO}/issues" target="_blank" rel="noopener noreferrer">{escape(ui['docs_feedback'])}</a></div>{pagination}</article>'''
        write_route(route(locale, suffix), page(locale, suffix, ui, doc['title'], doc['description'], sidebar(docs, locale, suffix, ui, doc['slug']) + article + toc))

    suffix = 'docs/'
    base = base_for(route(locale, suffix))
    topics = ''.join(f'<a href="./{doc["slug"]}.html"><div><h2>{escape(doc["title"])}</h2><p>{escape(doc["description"])}</p></div>{icon("arrow", base)}</a>' for doc in docs)
    index_content = f'''<article class="doc-article docs-index"><nav class="breadcrumbs" aria-label="{escape(ui['breadcrumbs'], quote=True)}"><a href="../">{escape(ui['home'])}</a><span aria-hidden="true">/</span><span>{escape(ui['docs'])}</span></nav><h1>{escape(ui['index_title'])}</h1><p class="doc-description">{escape(ui['index_description'])}</p><a class="button" href="./getting-started.html">{escape(ui['index_action'])} {icon('arrow', base)}</a><div class="docs-topic-list">{topics}</div></article>'''
    write_route(route(locale, suffix), page(locale, suffix, ui, ui['docs'], ui['index_meta_description'], sidebar(docs, locale, suffix, ui) + index_content))
    search_index = [{**{key: doc[key] for key in ['slug', 'title', 'description']}, 'text': plain(doc['body'])} for doc in docs]
    (OUT / details['prefix'] / 'search-index.json').write_text(json.dumps(search_index, ensure_ascii=False), encoding='utf-8')
    return [route(locale), route(locale, 'docs/')] + [route(locale, f'docs/{doc["slug"]}.html') for doc in docs]


def build():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    for filename in ['styles.css', 'app.js', 'hero-paper.js']:
        shutil.copyfile(ROOT / filename, OUT / filename)
    shutil.copytree(ROOT / 'assets', OUT / 'assets', ignore=shutil.ignore_patterns('*.json'))
    demo_routes = copy_demos()
    template = (ROOT / 'index.html').read_text(encoding='utf-8')
    routes = []
    for locale in LOCALES:
        routes.extend(build_locale(locale, template))
    (OUT / 'robots.txt').write_text('User-agent: *\nAllow: /\n', encoding='utf-8')
    (OUT / '_headers').write_text(headers_for(routes, demo_routes), encoding='utf-8')
    if ORIGIN:
        urls = ''.join(f'<url><loc>{escape(urljoin(ORIGIN + "/", path))}</loc></url>' for path in routes)
        (OUT / 'sitemap.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>', encoding='utf-8')
        (OUT / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {ORIGIN}/sitemap.xml\n', encoding='utf-8')
    print(f'Built {len(routes)} pages in {len(LOCALES)} languages and {len(demo_routes)} native HTML export → {OUT}')


if __name__ == '__main__':
    build()
