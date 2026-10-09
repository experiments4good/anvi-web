"""Builds the seven type guides and their source list from the approved text.

Usage: python3 scripts/build-guides.py <web-guides-2026.md> <anvi-daily-tips.md>

The approved file (~/anvi/content/web-guides-2026.md) is the only source of
the words. This script changes markup, never text:
- the page heading and search title and description move to frontmatter;
- a line that is only bold ("**Food**") becomes a section heading;
- each "(updates by date)" sentence becomes a hidden element the page
  script fills from today's date, so without JavaScript only the full date
  ranges in the text show;
- the tridoshic routine note becomes the three single-dosha routine tables,
  taken from those guides, each under the matching words of the note;
- "Sources: F, KP" becomes a frontmatter list the layout renders as links.
Writes src/content/guides/<slug>.md and src/lib/sources.json.
"""
import json
import re
import sys
from pathlib import Path

guides_md, tips_md = Path(sys.argv[1]), Path(sys.argv[2])
root = Path(__file__).resolve().parent.parent
out_dir = root / 'src/content/guides'
out_dir.mkdir(parents=True, exist_ok=True)

text = guides_md.read_text()
sections = re.split(r'^## (/dosha/[a-z-]+)[^\n]*\n', text, flags=re.M)
# sections: [preamble, path1, body1, path2, body2, ...], the last body runs into the links.
pages = {}
for path, body in zip(sections[1::2], sections[2::2]):
    body = body.split('\n---\n')[0]
    slug = path.split('/')[-1]
    title = re.search(r'^Search title: (.+)$', body, re.M).group(1).strip()
    description = re.search(r'^Search description: (.+)$', body, re.M).group(1).strip()
    heading = re.search(r'^### (.+)$', body, re.M).group(1).strip()
    sources = [s.strip() for s in re.search(r'^Sources: (.+)$', body, re.M).group(1).split(',')]
    content = body[body.index('### ') :].split('\n', 1)[1]
    content = re.sub(r'^Sources: .+$', '', content, flags=re.M).strip()
    pages[slug] = dict(title=title, description=description, heading=heading, sources=sources, content=content)

PAIR = {'vata-pitta': 'vata-pitta', 'vata-kapha': 'vata-kapha', 'pitta-kapha': 'pitta-kapha'}


def routine_table(slug):
    m = re.search(r'(\| Wake up \| Oil massage \| Move \|\n\| --- \| --- \| --- \|\n\|[^\n]+\|)', pages[slug]['content'])
    rows = [[c.strip() for c in line.strip('|').split('|')] for line in m.group(1).splitlines()]
    head, cells = rows[0], rows[2]
    th = ''.join(f'<th scope="col">{h}</th>' for h in head)
    td = ''.join(f'<td>{c}</td>' for c in cells)
    return f'<table><thead><tr>{th}</tr></thead><tbody><tr>{td}</tr></tbody></table>'


for slug, p in pages.items():
    c = p['content']
    # A line that is only bold is a section heading.
    c = re.sub(r'^\*\*([^*]+)\*\*$', r'## \1', c, flags=re.M)
    # The date line.
    def now(m):
        assert slug in PAIR, slug
        return f'<em class="now" data-pair="{PAIR[slug]}" hidden>{m.group(1)}</em>'
    c, n = re.subn(r'\*(Right now that means balancing [A-Za-z]+, through [A-Za-z]+ \d+\.)\* \(updates by date\)', now, c)
    assert n == (1 if slug in PAIR else 0), (slug, n)
    assert '(updates by date)' not in c
    if slug == 'tridoshic':
        note = re.search(r' \(Show the current season.s routine[^)]*\)', c)
        assert note, 'tridoshic note'
        c = c.replace(note.group(0), '')
        blocks = [
            ('vata', 'The Vata routine in fall', routine_table('vata')),
            ('pitta', 'The Pitta routine in summer', routine_table('pitta')),
            ('kapha', 'The Kapha routine in winter and spring', routine_table('kapha')),
        ]
        html = '\n'.join(
            f'<div class="season-routine" data-season="{s}">\n<p class="season-label">{label}</p>\n{table}\n</div>' for s, label, table in blocks
        )
        c = c.rstrip() + '\n\n' + html
    p['content'] = c
    type_name = p['heading'].split(' (')[0]
    fm = {
        'slug': slug,
        'type': type_name,
        'title': p['title'],
        'description': p['description'],
        'heading': p['heading'],
        'sources': p['sources'],
    }
    front = '\n'.join(f'{k}: {json.dumps(v, ensure_ascii=False)}' for k, v in fm.items())
    (out_dir / f'{slug}.md').write_text(f'---\n{front}\n---\n\n{c}\n')

# Sources: the approved file's links section, then the daily tips sources for the shared keys.
src = {}
links = text[text.index('## Source links') :]
for m in re.finditer(r'^- ([A-Z0-9-]+): (.+)$', links, re.M):
    key, rest = m.group(1), m.group(2)
    if rest.startswith('use the names'):
        continue
    parts = [x.strip() for x in rest.split(' ; and ')]
    entries = []
    for part in parts:
        name, url = part.rsplit(': http', 1)
        entries.append({'name': name.strip(), 'url': 'http' + url.strip()})
    src[key] = entries
shared = re.search(r'^- KV, KP[^:]*: use the names', links, re.M)
assert shared
for m in re.finditer(r'^- \*\*([A-Z0-9]+)\*\*: (.+)$', tips_md.read_text(), re.M):
    key = m.group(1)
    if key in src:
        continue
    name, url = m.group(2).rsplit(': http', 1)
    src[key] = [{'name': name.strip(), 'url': 'http' + url.strip()}]
used = {k for p in pages.values() for k in p['sources']}
missing = used - set(src)
assert not missing, missing
(root / 'src/lib/sources.json').write_text(json.dumps({k: src[k] for k in sorted(used)}, indent=2, ensure_ascii=False) + '\n')
print('guides:', ', '.join(sorted(pages)), '| sources used:', len(used))
