"""Checks the built site against the approved text and the app's own files.

Usage: python3 scripts/check-text.py <anvi content dir> <anvi-expo repo>
Run after `astro build`. Exits non-zero on any mismatch.

- Type guides: every line and table cell of web-guides-2026.md, the search
  title and description, the shared ending and every source, linked.
- Six tastes and routine: every line of web-stage2-2026.md for those pages.
- Routine steps: routine-steps.json is re-extracted from the app's routine.ts
  and must be identical, and every step's title, how-to, reason and source
  must appear on /routine/ exactly.
- Season pages: every type's tip and source line, parsed here straight from
  seasonal_tips_2026.md, must appear on its season page exactly.
- No em or en dash on any page but /privacy/ and /terms/.
"""
import glob
import html
import json
import re
import subprocess
import sys
from pathlib import Path

content, app = Path(sys.argv[1]), Path(sys.argv[2])
root = Path(__file__).resolve().parent.parent
dist = root / 'dist/client'
problems = []
checked = 0


def visible(h):
    h = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', h, flags=re.S)
    t = html.unescape(re.sub(r'<[^>]+>', ' ', h)).replace('’', "'").replace('‑', '-').replace('“', '"').replace('”', '"')
    return re.sub(r'\s+', ' ', t)


def page(path):
    return (dist / path.strip('/') / 'index.html').read_text()


def need(text, s, where):
    global checked
    checked += 1
    s = re.sub(r'\s+', ' ', s.replace('’', "'"))
    if s not in text:
        problems.append(f'{where}: missing "{s[:80]}"')


def meta(h, title, description, where):
    if re.search(r'<title>(.*?)</title>', h).group(1) != html.escape(title, quote=False):
        problems.append(f'{where}: title')
    if html.unescape(re.search(r'<meta name="description" content="(.*?)"', h).group(1)) != description:
        problems.append(f'{where}: description')


sources = json.loads((root / 'src/lib/sources.json').read_text())
QUIZ_LINE = 'Take the free dosha quiz: 20 questions, no sign-up.'
WELLNESS = 'This page is general wellness information, not medical advice. For a clinical assessment, see a NAMA-certified Ayurvedic practitioner.'
# /routine/ keeps "this routine"; every other page has the general line.
STORE_ROUTINE = 'Get this every day: Anvi gives you this routine to check off, a daily tip at the time you choose, and what to order when you eat out.'
STORE_OTHER = 'Anvi gives you guidance like this every day: a daily routine to check off, a tip at the time you choose, and what to order when you eat out.'


def ending(h, text, keys, where):
    store = STORE_ROUTINE if where.startswith('/routine/') else STORE_OTHER
    other = STORE_OTHER if store == STORE_ROUTINE else STORE_ROUTINE
    for e in (QUIZ_LINE, store, WELLNESS):
        need(text, e, where + ' ending')
    if other in text:
        problems.append(f'{where}: has the other App Store line')
    if 'download-on-the-app-store-black.svg' not in h:
        problems.append(f'{where}: App Store badge')
    for k in keys:
        for e in sources[k]:
            need(text, e['name'], f'{where} source {k}')
            if e['url'] not in html.unescape(h):
                problems.append(f'{where}: source {k} not linked')


# Type guides.
approved = (content / 'web-guides-2026.md').read_text()
secs = re.split(r'^## (/dosha/[a-z-]+)[^\n]*\n', approved, flags=re.M)
for path, body in zip(secs[1::2], secs[2::2]):
    body = body.split('\n---\n')[0]
    h = page(path)
    text = visible(h)
    for raw in body[body.index('### '):].splitlines():
        line = raw.strip()
        if not line or line.startswith('Sources:') or set(line) <= set('|- '):
            continue
        if line.startswith('### '):
            line = re.sub(r'\((and [^)]+)\)', r'\1', line[4:])
        line = line.replace(' (updates by date)', '')
        line = re.sub(r' \(Show the current season.s routine[^)]*\)', '', line)
        line = re.sub(r'^- ', '', line).replace('**', '').replace('*', '')
        for part in ([c.strip() for c in line.strip('|').split('|')] if line.startswith('|') else [line]):
            if part:
                need(text, part, path)
    meta(h, re.search(r'^Search title: (.+)$', body, re.M).group(1), re.search(r'^Search description: (.+)$', body, re.M).group(1), path)
    ending(h, text, [s.strip() for s in re.search(r'^Sources: (.+)$', body, re.M).group(1).split(',')], path)
    if 'href="/routine/"' not in h:
        problems.append(f'{path}: "Your daily routine" not linked to /routine/')

# Stage 2 approved text.
stage2 = (content / 'web-stage2-2026.md').read_text()
s2 = dict(zip(*[iter(re.split(r'^## (/[a-z/,\- ]+)\n', stage2, flags=re.M)[1:])] * 2))

b = s2['/six-tastes'].split('\n---\n')[0]
h = page('/six-tastes/')
text = visible(h)
meta(h, re.search(r'^Search title: (.+)$', b, re.M).group(1), re.search(r'^Search description: (.+)$', b, re.M).group(1), '/six-tastes/')
for raw in b[b.index('### '):].splitlines():
    line = raw.strip()
    if not line or line.startswith('Sources:') or set(line) <= set('|- '):
        continue
    line = re.sub(r'^### ', '', line)
    line = re.sub(r' \(Link "your type.s guide"[^)]*\)', '', line).replace('**', '')
    for part in ([c.strip() for c in line.strip('|').split('|')] if line.startswith('|') else [line]):
        if part:
            need(text, part, '/six-tastes/')
src_line = re.search(r'^Sources: (.+)$', b, re.M).group(1).rstrip('.')
keys = []
for part in src_line.split('; '):
    m = re.match(r'(.+?) \((.+)\)$', part)
    keys += [k.strip() for k in m.group(1).split(',')]
    need(text, f'({m.group(2)})', '/six-tastes/ source note')
ending(h, text, keys, '/six-tastes/')
if 'href="/#guides"' not in h:
    problems.append('/six-tastes/: "your type\'s guide" not linked to the guide list')
if h.count('class="guide-card"') != 7:
    problems.append('/six-tastes/: seven guide cards')

b = s2['/routine'].split('\n---\n')[0]
h = page('/routine/')
text = visible(h)
meta(h, re.search(r'^Search title: (.+)$', b, re.M).group(1), re.search(r'^Search description: (.+)$', b, re.M).group(1), '/routine/')
need(text, re.search(r'^### (.+)$', b, re.M).group(1), '/routine/')
need(text, [p for p in re.split(r'\n\s*\n', b[b.index('### '):].split('\n', 1)[1]) if p.strip()][0].strip(), '/routine/ intro')
need(text, re.search(r'Below the steps: "([^"]+)"', b).group(1), '/routine/ closing')
if h.count('class="guide-card"') != 7:
    problems.append('/routine/: seven guide cards')
ending(h, text, ['T1', 'T2', 'M', 'KV', 'KP', 'KK', 'KA', 'HM', 'F', 'G', 'VS', 'BV', 'BB', 'BK', 'AD'], '/routine/')

# Routine steps: identical to the app, and on the page exactly.
committed = (root / 'src/lib/routine-steps.json').read_text()
subprocess.run(['node', str(root / 'scripts/build-routine.ts'), str(app)], check=True, capture_output=True)
fresh = (root / 'src/lib/routine-steps.json').read_text()
if fresh != committed:
    problems.append('routine-steps.json differs from the app\'s routine.ts')
steps = json.loads(fresh)['steps']
for s in steps:
    need(text, s['title'], f'/routine/ {s["id"]} title')
    for d, v in s['versions'].items():
        for k in ('howTo', 'reason'):
            need(text, v[k], f'/routine/ {s["id"]} {d} {k}')
        need(text, 'Source: ' + v['source'], f'/routine/ {s["id"]} {d} source')

# Season pages: headings, intros and every tip, from the files directly.
b = s2['/season/fall, /season/summer, /season/winter-spring']
titles = re.findall(r'^- (Ayurveda in .+)$', b, re.M)
descs = re.findall(r'^- (What to eat and how to live .+)$', b, re.M)
intros = re.findall(r'^- (Fall|Summer|Winter and spring): "([^"]+)"', b, re.M)
tips = {}
cur = None
for line in (content / 'seasonal_tips_2026.md').read_text().splitlines():
    m = re.match(r'^## (Vata|Pitta|Kapha) season', line)
    if m:
        cur = m.group(1).lower()
        tips[cur] = []
    m = re.match(r'^- \*\*(.+?)\*\*: (.+?) \*\(([^)]+)\)\* -> (.+)$', line)
    if m and cur:
        tips[cur].append((m.group(1).split(',')[0].strip(), m.group(2), m.group(4).strip()))
for (slug, dosha), title, desc, (heading, intro) in zip([('fall', 'vata'), ('summer', 'pitta'), ('winter-spring', 'kapha')], titles, descs, intros):
    where = f'/season/{slug}/'
    h = page(where)
    text = visible(h)
    meta(h, title, desc, where)
    need(text, heading, where)
    need(text, intro, where)
    if len(tips[dosha]) != 7:
        problems.append(f'{where}: expected 7 tips')
    for name, tip, src in tips[dosha]:
        need(text, f'{name} {tip} Source: {src}', f'{where} {name}')
    for other in {'fall', 'summer', 'winter-spring'} - {slug}:
        if f'href="/season/{other}/"' not in h:
            problems.append(f'{where}: no link to {other}')
    for k in ('W-VK', 'W-VP', 'W-PK'):
        for e in sources[k]:
            need(text, e['name'], f'{where} credit {k}')
home = page('/')
for slug in ('fall', 'summer', 'winter-spring'):
    if f'href="/season/{slug}/"' not in home:
        problems.append(f'/: no-JavaScript link to {slug}')
need(visible(home), 'This season', '/')
for path in ('/six-tastes/', '/routine/'):
    if f'href="{path}"' not in home:
        problems.append(f'/: no link to {path}')

# Link-preview images: the tags on every page, and the words drawn on each
# image (recorded in the PNG by scripts/build-og.ts) are the page's own
# heading and the approved quiz line, with no dash.
import struct
QUIZ_IMAGE_LINE = 'Take the free dosha quiz at getanvi.app'


def png_info(path):
    b = path.read_bytes()
    assert b[:8] == b'\x89PNG\r\n\x1a\n', path
    w, hgt = struct.unpack('>II', b[16:24])
    texts, i = {}, 8
    while i < len(b):
        n = struct.unpack('>I', b[i:i + 4])[0]
        kind = b[i + 4:i + 8]
        if kind == b'tEXt':
            k, _, v = b[i + 8:i + 8 + n].partition(b'\0')
            texts[k.decode('latin1')] = v.decode('latin1')
        i += 12 + n
    return w, hgt, texts


for f in sorted(glob.glob(str(dist / '**/index.html'), recursive=True)):
    rel = '/' + str(Path(f).relative_to(dist)).replace('index.html', '')
    h = Path(f).read_text()
    tag = lambda prop: (re.search(rf'<meta (?:property|name)="{prop}" content="([^"]*)"', h) or [None, None])[1]
    image = tag('og:image')
    canonical = re.search(r'<link rel="canonical" href="([^"]*)"', h).group(1)
    if not image or not image.startswith('https://getanvi.app/og/') or not image.endswith('.png'):
        problems.append(f'{rel}: og:image {image}')
        continue
    if tag('og:image:width') != '1200' or tag('og:image:height') != '630':
        problems.append(f'{rel}: og:image size tags')
    if tag('twitter:card') != 'summary_large_image':
        problems.append(f'{rel}: twitter:card')
    if tag('og:url') != canonical or tag('og:type') != 'website' or tag('og:site_name') != 'Anvi':
        problems.append(f'{rel}: og:url, og:type or og:site_name')
    if html.unescape(tag('og:description') or '') != html.unescape(re.search(r'<meta name="description" content="([^"]*)"', h).group(1)):
        problems.append(f'{rel}: og:description is not the meta description')
    png = dist / image.removeprefix('https://getanvi.app/')
    if not png.exists():
        problems.append(f'{rel}: {png.name} missing')
        continue
    w, hgt, texts = png_info(png)
    if (w, hgt) != (1200, 630):
        problems.append(f'{rel}: image is {w}x{hgt}')
    lines = texts.get('Description', '').split('\n')
    h1 = visible(re.search(r'<h1[^>]*>(.*?)</h1>', h, re.S).group(1)).strip()
    if len(lines) != 2 or lines[0] != h1 or lines[1] != QUIZ_IMAGE_LINE:
        problems.append(f'{rel}: image text {lines} is not the heading "{h1}" and the quiz line')
    alt = html.unescape(tag('og:image:alt') or '')
    if alt != f'{h1}. {QUIZ_IMAGE_LINE}':
        problems.append(f'{rel}: og:image:alt "{alt}"')
    if any(c in ''.join(lines) for c in '\u2013\u2014'):
        problems.append(f'{rel}: dash in the image text')
    checked += 1
images = sorted(glob.glob(str(dist / 'og/**/*.png'), recursive=True))
pages = sorted(glob.glob(str(dist / '**/index.html'), recursive=True))
if len(images) != len(pages):
    problems.append(f'{len(images)} images for {len(pages)} pages')
if (dist / 'og/manifest.json').exists():
    problems.append('og/manifest.json was published')

# Dashes.
for f in sorted(glob.glob(str(dist / '**/index.html'), recursive=True)) + sorted(glob.glob(str(dist / '_astro/*'))):
    rel = '/' + str(Path(f).relative_to(dist)).replace('index.html', '')
    if rel in ('/privacy/', '/terms/'):
        continue
    raw = Path(f).read_text(errors='ignore')
    for m in re.finditer('[\u2013\u2014]', raw):
        problems.append(f'{rel}: dash in "{raw[max(0, m.start() - 12): m.end() + 12]}"')

print(f'checked {checked} strings')
for p in problems:
    print('PROBLEM', p)
sys.exit(1 if problems else 0)
