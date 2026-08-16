# Dr. Kannan's Dentistry

Static site. No build step, no dependencies. The contents of this folder
**are** the repository root — `index.html` sits at the top, which is what
GitHub Pages serves.

---

## Putting it live

1. Create a new repository on GitHub.
2. Upload **everything in this folder** — `index.html`, `css/`, `js/`,
   `media/`, and the dotfile `.nojekyll`. Drag the whole set into the
   upload box in one go; GitHub keeps the folder structure.
3. Repository → **Settings → Pages**.
4. Under *Build and deployment*, set Source to **Deploy from a branch**,
   branch `main`, folder `/ (root)`. Save.
5. Wait a minute. The site is at
   `https://YOUR-USERNAME.github.io/YOUR-REPO/`.

**`.nojekyll` matters.** Without it GitHub runs the files through Jekyll,
which ignores anything starting with an underscore and can quietly drop
assets. It is an empty file — if your uploader hides dotfiles, create it in
GitHub with **Add file → Create new file**, name it `.nojekyll`, and commit
it empty.

### Custom domain

Settings → Pages → Custom domain. Then in `index.html`, `robots.txt` and
`sitemap.xml`, replace `REPLACE-WITH-YOUR-DOMAIN` with the real one.

---

## The booking form on GitHub Pages

GitHub Pages serves files and nothing else — it cannot run server code. So
on Pages the form validates every field, then **opens WhatsApp with the
request already written**, and the visitor presses send. Nothing is lost and
nothing pretends to have been sent.

To have requests arrive at the clinic's WhatsApp without the visitor doing
anything, the site needs a host that runs functions — Netlify, Cloudflare
Pages or Vercel all have a free tier. Deploy `api/appointment.js` there,
then in `js/app.js` change:

```js
var ENDPOINT = '';                    // becomes
var ENDPOINT = '/api/appointment';
```

Setup notes are in the comment block at the top of `api/appointment.js`.
Note that WhatsApp will not deliver a message from a number to itself, so
the API sender cannot be +91 90420 66006.

---

## Before it goes live

Everything unfinished is wrapped in `[square brackets]` and renders dimmed
with a dotted underline, so it is visible on the page and in a screenshot.
Search `index.html` for `data-todo`.

| Where | Needed |
| --- | --- |
| About | Degrees, Dental Council number, special interest, year started, role |
| Results 02 and 03 | Case titles, treatment and duration, and the photographs |
| Footer | Clinic email, Google Maps embed URL |

Delete the `[data-todo]` rule in `css/style.css` once they are filled.

One more: the site spells the dentist **Dr. K. Loghavarshini**; the nameplate
in the clinic photograph reads **Logavarshini**. Match whichever is on the
Dental Council registration.

---

## What is real

Rating, address, phone and hours come from the clinic's Google Business
Profile. Reviews are short excerpts from it, linked to the full listing.
Photographs are the clinic's own, colour-corrected on import — clinical LED
light photographs cold, so each was pulled back toward neutral. The aligner
illustration in `media/aligner.svg` is generated from a parametric curve, not
licensed artwork.

Statistics that could not be verified were removed rather than bracketed.

---

## Layout

Four breakpoints: **640** phone landscape · **900** tablet portrait, where
multi-column begins · **1080** desktop, where the six-item nav fits ·
**1280** wide. Plus a landscape-phone rule so the hero stops forcing full
height on a 375px-tall screen.
