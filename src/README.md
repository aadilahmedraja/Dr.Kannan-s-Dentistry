# Tooling

Two scripts that check the site. Run them from the project root after any
change to the CSS or markup.

```bash
python3 src/audit.py    # what every section resolves to, 320px → 1920px
python3 src/qa.py       # structure, accessibility, content, breakpoints
```

`audit.py` resolves the media-query cascade at fourteen viewport widths and
prints the grid each major section falls into. It is how the tablet range
was found to be unattended: eight breakpoints, several a few pixels apart,
with 768–1079px never actually looked at.

`qa.py` checks tag balance, alt text on every image, a label for every form
field, one h1, the skip link, the phone number and address, and that the
breakpoint scale is still the intended four.
