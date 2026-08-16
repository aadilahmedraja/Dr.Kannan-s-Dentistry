#!/usr/bin/env python3
"""Static responsive audit: work out what each section resolves to at a
given viewport width, and flag anything that cannot fit."""
import re, sys

css = re.sub(r'/\*.*?\*/', '', open('css/style.css').read(), flags=re.S)
body = open('index.html').read()

WIDTHS = [320, 360, 375, 414, 480, 640, 768, 834, 900, 1024, 1080, 1280, 1440, 1920]

def active_css(w):
    """Concatenate the rules that apply at width w."""
    out = []
    i = 0
    while True:
        m = re.search(r'@media\(([^)]+)\)\{', css[i:])
        if not m:
            out.append(css[i:])
            break
        out.append(css[i:i + m.start()])
        # find the matching close brace
        j = i + m.end()
        depth = 1
        k = j
        while depth and k < len(css):
            if css[k] == '{': depth += 1
            elif css[k] == '}': depth -= 1
            k += 1
        block = css[j:k-1]
        cond = m.group(1)
        ok = True
        for c in cond.split(' and '):
            c = c.strip()
            mm = re.match(r'min-width:([\d.]+)px', c)
            mx = re.match(r'max-width:([\d.]+)px', c)
            ar = re.match(r'max-aspect-ratio', c)
            if mm and w < float(mm.group(1)): ok = False
            if mx and w > float(mx.group(1)): ok = False
            if ar: ok = False
            if 'height' in c: ok = False
        if ok: out.append(block)
        i = k
    return '\n'.join(out)

def prop(rules, selector, name):
    """Last declaration of `name` for `selector` in the active cascade."""
    val = None
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', rules):
        sels = [x.strip() for x in m.group(1).split(',')]
        if selector not in sels: continue
        for d in m.group(2).split(';'):
            if ':' not in d: continue
            k, v = d.split(':', 1)
            if k.strip() == name: val = v.strip()
    return val

CHECKS = [
    ('.nav__links', 'display', 'desktop nav'),
    ('#burger',     'display', 'menu button'),
    ('.grid12',     'grid-template-columns', 'about / appointment grid'),
    ('.tr__wrap',   'grid-template-columns', 'treatments layout'),
    ('.sig__grid',  'grid-template-columns', 'signature layout'),
    ('.online__grid','grid-template-columns','online consultation'),
    ('.tech',       'grid-template-columns', 'technology grid'),
    ('.book__slots','grid-template-columns', 'time slots'),
    ('.rail',       'display', 'progress rail'),
]

print('width  ' + '  '.join(n[:11].ljust(11) for _, _, n in CHECKS))
print('-' * 118)
for w in WIDTHS:
    r = active_css(w)
    row = []
    for sel, p, _ in CHECKS:
        v = prop(r, sel, p) or '—'
        v = v.replace('repeat(', 'r(').replace('minmax(0,1fr)', '1fr').replace(' ', '')
        row.append(v[:11].ljust(11))
    print(str(w).ljust(6) + ' ' + '  '.join(row))
