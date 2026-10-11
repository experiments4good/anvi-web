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
- "Sources: F, KP" becomes a frontmatter list the layout renders as links;
- tables become HTML tables whose cells carry their column header, so they
  can read as cards on a phone, and the "(balancing X)" columns are tagged
  with that dosha for the season colors;
- the "By season" sentences become a set of items tagged with the seasons
  each names (fall vata, summer pitta, winter and spring kapha);
- the first sentence of each guide goes to frontmatter for the home cards
  and the quiz result;
- each "Your daily routine" mention links to /routine/.
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

def esc(t):
    return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def inline(t):
    """The two inline marks the approved text uses, as HTML."""
    t = esc(t)
    t = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', t)
    return t


def html_table(block, note=None):
    """A routine table as labelled HTML. A note ("Teachers differ on Kapha's oil: ...",
    the line under the table in the approved text) goes inside the Oil massage cell for
    Kapha, under its value."""
    lines = [l.strip() for l in block.strip().splitlines()]
    cells = [[c.strip() for c in l.strip('|').split('|')] for l in lines]
    head, rows = cells[0], cells[2:]
    row_headers = head[0] == ''
    def balance(h):
        m = re.search(r'balancing (Vata|Pitta|Kapha)', h)
        return f' data-balance="{m.group(1).lower()}"' if m else ''
    th = ''.join(f'<th scope="col"{balance(h)}>{esc(h)}</th>' if h else '<td></td>' for h in head)
    body = ''
    placed = []
    for r in rows:
        tds = ''
        for j, c in enumerate(r):
            if row_headers and j == 0:
                tds += f'<th scope="row">{esc(c)}</th>'
            else:
                oil = (r[0] == 'Oil massage' and 'balancing Kapha' in head[j]) if row_headers else head[j] == 'Oil massage'
                extra = f'<span class="cell-note">{inline(note)}</span>' if note and oil else ''
                if extra:
                    placed.append(1)
                tds += f'<td data-label="{esc(head[j])}"{balance(head[j])}>{esc(c)}{extra}</td>'
        body += f'<tr>{tds}</tr>'
    assert not note or len(placed) == 1, note
    kind = 'windows' if row_headers else 'single'
    return f'<table class="routine-table routine-{kind}"><thead><tr>{th}</tr></thead><tbody>{body}</tbody></table>'


def seasons_of(sentence):
    low = sentence.lower()
    found = []
    if re.search(r'\bfall\b', low): found.append('vata')
    if re.search(r'\bsummer\b', low): found.append('pitta')
    if re.search(r'\b(winter|spring)\b', low): found.append('kapha')
    return found


def season_list(items):
    def item(t):
        found = seasons_of(t)
        dots = ''.join(f'<span class="dot dot-{x}"></span>' for x in found)
        one = f' is-{found[0]}' if len(found) == 1 else ''
        return f'<li class="season{one}"><span class="dots" aria-hidden="true">{dots}</span><span>{inline(t)}</span></li>'
    lis = ''.join(item(t) for t in items)
    return f'<ul class="seasons">{lis}</ul>'


PAIR = {'vata-pitta': 'vata-pitta', 'vata-kapha': 'vata-kapha', 'pitta-kapha': 'pitta-kapha'}


def routine_table(slug):
    """A single-dosha guide's routine table, from its approved Markdown, as labelled HTML,
    with its note in the Oil massage cell when it has one (Kapha's oil, since October 10, 2026)."""
    m = re.search(r'(\| Wake up \| Oil massage \| Move \|\n\| --- \| --- \| --- \|\n\|[^\n]+\|)(?:\n\n(Teachers differ[^\n]+))?', pages[slug]['raw'])
    return html_table(m.group(1), m.group(2))


for p in pages.values():
    p['raw'] = p['content']

for slug, p in pages.items():
    c = p['content']
    # A line that is only bold is a section heading.
    c = re.sub(r'^\*\*([^*]+)\*\*$', r'## \1', c, flags=re.M)
    # "Your daily routine" links to the routine page, words unchanged.
    c = c.replace('## Your daily routine', '## [Your daily routine](/routine/)')
    c = c.replace('**Your daily routine** follows', '**[Your daily routine](/routine/)** follows')
    # The date line.
    def now(m):
        assert slug in PAIR, slug
        return f'<em class="now" data-pair="{PAIR[slug]}" hidden>{m.group(1)}</em>'
    # Tables, as labelled HTML.
    # A "Teachers differ" line right under a table moves into the table's Oil massage cell.
    c = re.sub(r'((?:^\|.*\|\n?)+)(?:\n(Teachers differ[^\n]+)\n?)?', lambda m: html_table(m.group(1), m.group(2)) + '\n', c, flags=re.M)
    # "**By season:** a. b. c." becomes the season set, one sentence each.
    def by_season(m):
        sentences = re.split(r'(?<=\.)\s+(?=[A-Z])', m.group(1).strip())
        return '<p class="season-intro"><strong>By season:</strong></p>\n' + season_list(sentences)
    c = re.sub(r'^\*\*By season:\*\* (.+)$', by_season, c, flags=re.M)
    # A "By season" bullet list ("- **Fall:** ...") becomes the same set.
    def season_bullets(m):
        items = [l[2:] for l in m.group(0).strip().splitlines()]
        return season_list(items) + '\n'
    c = re.sub(r'(?<=## By season\n\n)((?:^- .+\n?)+)', season_bullets, c, flags=re.M)
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
            f'<div class="season-routine is-{s}" data-season="{s}">\n<p class="season-label"><span class="dot dot-{s}" aria-hidden="true"></span>{label}</p>\n{table}\n</div>' for s, label, table in blocks
        )
        c = c.rstrip() + '\n\n' + html
    p['content'] = c
    type_name = p['heading'].split(' (')[0]
    first = re.match(r'(.+?\.)(?:\s|$)', p['content'].strip()).group(1)
    fm = {
        'slug': slug,
        'type': type_name,
        'title': p['title'],
        'description': p['description'],
        'heading': p['heading'],
        'sources': p['sources'],
        'first': first,
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
# Every key either file defines, so the stage 2 pages resolve theirs too.
(root / 'src/lib/sources.json').write_text(json.dumps({k: src[k] for k in sorted(src)}, indent=2, ensure_ascii=False) + '\n')
print('guides:', ', '.join(sorted(pages)), '| sources used:', len(used))
