#!/usr/bin/env python3
"""Structural and accessibility QA over the built page."""
import re, sys
# CSS and JS are separate files now; the checks span all three
s = (open('index.html').read()
     + '\n<style>' + open('css/style.css').read() + '</style>'
     + '\n<script>' + open('js/app.js').read() + '</script>')
flat = re.sub(r'data:[a-z/]+;base64,[A-Za-z0-9+/=]+', 'DATA', s)

fails = []
def check(label, ok, detail=''):
    print(('  OK   ' if ok else '  FAIL ') + label + (('  — ' + detail) if detail and not ok else ''))
    if not ok: fails.append(label)

print('STRUCTURE')
for tag in ['div','section','form','fieldset','ol','ul','figure','picture','button','a','p','h2','h3']:
    o = len(re.findall(r'<%s[\s>]' % tag, flat)); c = flat.count('</%s>' % tag)
    check('%s balanced (%d)' % (tag, o), o == c, '%d open / %d close' % (o, c))

print('\nACCESSIBILITY')
imgs = re.findall(r'<img\b[^>]*>', flat)
check('every img has alt', all('alt=' in i for i in imgs), '%d of %d missing' % (sum('alt=' not in i for i in imgs), len(imgs)))
btns = re.findall(r'<button\b[^>]*>(.*?)</button>', flat, re.S)
labelled = sum(1 for b in btns if b.strip() and not b.strip().startswith('<svg')) 
check('buttons carry a label or aria-label',
      all(('aria-label' in b) or re.sub(r'<[^>]+>','',b).strip() for b in re.findall(r'<button\b([^>]*)>(.*?)</button>', flat, re.S) and [m[0]+m[1] for m in re.findall(r'<button\b([^>]*)>(.*?)</button>', flat, re.S)]))
check('one h1', len(re.findall(r'<h1[\s>]', flat)) == 1, str(len(re.findall(r'<h1[\s>]', flat))))
check('lang set', 'lang="en"' in flat)
check('viewport meta', 'width=device-width' in flat)
check('skip link', 'Skip to content' in flat)
inputs = re.findall(r'<(?:input|select|textarea)\b[^>]*id="([\w-]+)"', flat)
check('every field has a label', all(('for="%s"' % i) in flat for i in inputs),
      ','.join(i for i in inputs if ('for="%s"'%i) not in flat))

print('\nCONTENT')
check('phone correct everywhere', flat.count('90420 66006') + flat.count('919042066006') >= 4)
check('address present', 'Nerkundram, Chennai 600107' in flat)
check('hours 10:00 – 21:00', '10:00 – 21:00' in flat)
check('no competitor asset', 'theimagehospital' not in flat.lower())
check('no invented statistics', 'Treatments completed' not in flat)

print('\nRESPONSIVE')
check('four breakpoints only', sorted(set(re.findall(r'min-width:(\d+)px', flat))) == ['1080','1280','640','900'],
      str(sorted(set(re.findall(r'min-width:(\d+)px', flat)))))
check('no min/max overlap', 'max-width:900px)' not in flat)
check('page cannot scroll sideways', 'overflow-x:clip' in flat)
check('safe-area padding', 'env(safe-area-inset' in flat)
check('short-viewport handling', 'max-height:560px' in flat)
check('no grid-column outside a query',
      not re.search(r'\}\s*\.[\w-]+\{[^}]*grid-column:[^}]*\}\s*\.', flat.split('@media')[0]))

print('\n%s' % ('ALL CHECKS PASSED' if not fails else '%d FAILED: %s' % (len(fails), fails)))
