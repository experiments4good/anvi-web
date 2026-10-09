"""Builds src/lib/stage2.json, the text of the stage 2 pages, from the approved files.

Usage: python3 scripts/build-stage2.py <web-stage2-2026.md> <seasonal_tips_2026.md>

The approved file (~/anvi/content/web-stage2-2026.md) is the only source of the
page words; the season pages take each type's tip and source line from
seasonal_tips_2026.md, the app's "This season" tips, unchanged. Notes in
parentheses that are instructions to the builder are left out. The routine
steps come from the app separately (scripts/build-routine.ts).
"""
import json
import re
import sys
from pathlib import Path

stage2 = Path(sys.argv[1]).read_text()
tips_md = Path(sys.argv[2]).read_text()
root = Path(__file__).resolve().parent.parent

secs = dict(zip(*[iter(re.split(r'^## (/[a-z/,\- ]+)\n', stage2, flags=re.M)[1:])] * 2))


def field(body, name):
    return re.search(rf'^{name}: (.+)$', body, re.M).group(1).strip()


def paragraphs(body):
    """Body paragraphs after the ### heading, up to the next blank-separated block that is not prose."""
    return [p.strip() for p in re.split(r'\n\s*\n', body) if p.strip()]


# The six tastes.
b = secs['/six-tastes'].split('\n---\n')[0]
paras = paragraphs(b[b.index('### '):].split('\n', 1)[1])
table_block = next(p for p in paras if p.startswith('|'))
rows = [[c.strip() for c in l.strip().strip('|').split('|')] for l in table_block.splitlines()]
how = next(p for p in paras if p.startswith('**How to use this:**'))
how_text = re.sub(r' \(Link "your type.s guide"[^)]*\)', '', how)
assert '(Link' not in how_text
src_line = field(b, 'Sources')
# "T3 (food examples); W-PK, W-VP, W-VK, W-T (which tastes ...); G (all six tastes daily)."
source_groups = []
for part in src_line.rstrip('.').split('; '):
    m = re.match(r'(.+?) \((.+)\)$', part.strip())
    keys = [k.strip() for k in m.group(1).split(',')]
    source_groups.append({'keys': keys, 'note': m.group(2)})
six = {
    'title': field(b, 'Search title'),
    'description': field(b, 'Search description'),
    'heading': re.search(r'^### (.+)$', b, re.M).group(1),
    'intro': paras[paras.index(next(p for p in paras if p.startswith('### '))) + 1] if any(p.startswith('### ') for p in paras) else None,
    'table': {'head': rows[0], 'rows': rows[2:]},
    'notes': [],
    'how': how_text,
    'sourceGroups': source_groups,
}
body_paras = [p for p in paras if not p.startswith(('|', '**How', 'Sources:', 'Search '))]
six['intro'] = body_paras[0]
six['notes'] = body_paras[1:]

# The routine page.
b = secs['/routine'].split('\n---\n')[0]
after = b[b.index('### '):].split('\n', 1)[1]
rp = paragraphs(after)
closing = re.search(r'Below the steps: "([^"]+)"', b).group(1)
routine = {
    'title': field(b, 'Search title'),
    'description': field(b, 'Search description'),
    'heading': re.search(r'^### (.+)$', b, re.M).group(1),
    'intro': rp[0],
    'closing': closing,
}

# The season pages.
b = secs['/season/fall, /season/summer, /season/winter-spring']
titles = re.findall(r'^- (Ayurveda in .+)$', b, re.M)
descs = re.findall(r'^- (What to eat and how to live .+)$', b, re.M)
intros = re.findall(r'^- (Fall|Summer|Winter and spring): "([^"]+)"', b, re.M)
assert len(titles) == len(descs) == len(intros) == 3
home_line = re.search(r'The home page gets a "This season" link', b)
assert home_line
credit = re.search(r'Credit (W-VK), (W-VP) and (W-PK) in each season page', stage2)
extra_keys = list(credit.groups())

GROUP_SLUG = {
    'Vata': ('Vata', 'vata'),
    'Pitta': ('Pitta', 'pitta'),
    'Kapha': ('Kapha', 'kapha'),
    'Vata-Pitta, Pitta-Vata': ('Vata-Pitta', 'vata-pitta'),
    'Vata-Kapha, Kapha-Vata': ('Vata-Kapha', 'vata-kapha'),
    'Pitta-Kapha, Kapha-Pitta': ('Pitta-Kapha', 'pitta-kapha'),
    'Tridoshic': ('Tridoshic', 'tridoshic'),
}
season_tips = {}
current = None
for line in tips_md.splitlines():
    m = re.match(r'^## (Vata|Pitta|Kapha) season', line)
    if m:
        current = m.group(1).lower()
        season_tips[current] = []
        continue
    m = re.match(r'^- \*\*(.+?)\*\*: (.+?) \*\(([^)]+)\)\* -> (.+)$', line)
    if m and current:
        name, slug = GROUP_SLUG[m.group(1)]
        season_tips[current].append({
            'type': name,
            'slug': slug,
            'tip': m.group(2),
            'source': m.group(4).strip(),
            'keys': [k.strip() for k in m.group(3).split(',')],
        })
assert all(len(v) == 7 for v in season_tips.values()), {k: len(v) for k, v in season_tips.items()}

SEASON = [('fall', 'vata'), ('summer', 'pitta'), ('winter-spring', 'kapha')]
seasons = []
for (slug, dosha), title, desc, (heading, intro) in zip(SEASON, titles, descs, intros):
    keys = []
    for t in season_tips[dosha]:
        for k in t['keys']:
            if k not in keys:
                keys.append(k)
    for k in extra_keys:
        if k not in keys:
            keys.append(k)
    seasons.append({
        'slug': slug,
        'dosha': dosha,
        'title': title,
        'description': desc,
        'heading': heading,
        'intro': intro,
        'tips': [{k: v for k, v in t.items() if k != 'keys'} for t in season_tips[dosha]],
        'sourceKeys': keys,
    })

out = {'from': ['web-stage2-2026.md', 'seasonal_tips_2026.md'], 'sixTastes': six, 'routine': routine, 'seasons': seasons}
(root / 'src/lib/stage2.json').write_text(json.dumps(out, indent=2, ensure_ascii=False) + '\n')
print('six tastes rows:', len(six['table']['rows']), '| seasons:', ', '.join(s['slug'] for s in seasons), '| source keys per season:', [len(s['sourceKeys']) for s in seasons])
