
/* ============================================================
   Preview build. Same content, tokens and motion budget as the
   Next.js project — one long interaction, everything else fades.
   ============================================================ */
(function () {
'use strict';

var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
var $  = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
var lerp = function (a, b, t) { return a + (b - a) * t; };
var smoothstep = function (e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

/* ---------- content ---------- */
var TREATMENTS = [
  ['Smile Design', 'A digital mock-up first, then a trial smile you wear out of the clinic before anything becomes permanent.', '2–4 visits', 'Smile design — 3:2'],
  ['Veneers & Crowns', 'Layered ceramics matched to the tooth beside them rather than to a shade chart, so the repair is the part nobody notices.', '2–3 visits', 'Ceramic work — 3:2'],
  ['Dental Implants', 'Guided placement planned from a 3D scan, replacing the root as well as the crown so the bone around it keeps its shape.', 'Staged over months', 'Implant / CBCT — 3:2'],
  ['Clear Aligners', 'Sequential trays planned end to end, reviewed every six weeks. Movement you can measure and nobody else can see.', 'Reviewed 6-weekly', 'media/aligner.webp'],
  ['Root Canal Treatment', 'Performed under magnification with rotary instrumentation, usually in a single sitting, and restored the same week.', 'Often single visit', 'Microscope work — 3:2'],
  ['Whitening', 'Shade lifted to something your face agrees with, with enamel sensitivity managed throughout.', '1 visit + home phase', 'Whitening — 3:2']
];

var TECH = [
  ['3D CBCT imaging', 'Bone volume and nerve position measured before an implant is planned, not discovered during surgery.',
   '<path d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3"/><ellipse cx="12" cy="12" rx="4.5" ry="5.5"/><path d="M7.5 12h9"/>'],
  ['Intraoral scanning', 'A digital impression in minutes. No trays, no putty, and a file the lab can work from immediately.',
   '<path d="M5 19l4.5-4.5"/><rect x="3" y="17" width="4" height="4" rx="1" transform="rotate(-45 5 19)"/><path d="M9 12a6 6 0 0 1 12 0"/><path d="M11.5 12a3.5 3.5 0 0 1 7 0"/>'],
  ['Surgical magnification', 'Root canals and margins prepared under magnified, coaxial light, where the detail is actually visible.',
   '<circle cx="9" cy="8" r="3"/><circle cx="15" cy="8" r="3"/><path d="M9 11l3 6 3-6"/><path d="M12 17v3"/>'],
  ['Same-day ceramics', 'Milled and characterised in-house, so a crown can be fitted without a temporary in between.',
   '<path d="M12 3v6"/><path d="M10.5 9h3l-1.5 3-1.5-3z"/><rect x="5" y="14" width="14" height="6" rx="1"/><path d="M9 14v6M15 14v6"/>']
];

/* ============================================================
   SWIPE RAIL — one implementation, used by the clinic gallery and
   the patient reviews.

   Touch gets native scrolling and momentum for free; the drag
   handler is for mouse users. Snapping is switched off during a drag
   so the rail follows the pointer exactly, then back on for release.
   ============================================================ */
function swipeRail(opts) {
  var vp = document.getElementById(opts.vp);
  var track = document.getElementById(opts.track);
  var bar = document.getElementById(opts.bar);
  var prev = document.getElementById(opts.prev);
  var next = document.getElementById(opts.next);
  if (!vp || !track) return;

  function items() { return Array.prototype.slice.call(track.children); }

  function step() {
    var list = items();
    if (!list.length) return vp.clientWidth * 0.8;
    var cs = getComputedStyle(track);
    var gap = parseFloat(cs.columnGap || cs.gap) || 16;
    return list[0].getBoundingClientRect().width + gap;
  }

  function maxScroll() { return Math.max(1, vp.scrollWidth - vp.clientWidth); }

  function paint() {
    if (bar) bar.style.width = (clamp(vp.scrollLeft / maxScroll(), 0, 1) * 100).toFixed(1) + '%';
    if (prev) prev.disabled = vp.scrollLeft <= 2;
    if (next) next.disabled = vp.scrollLeft >= maxScroll() - 2;
  }

  vp.addEventListener('scroll', paint, { passive: true });
  addEventListener('resize', paint, { passive: true });
  if (prev) prev.addEventListener('click', function () { vp.scrollBy({ left: -step(), behavior: 'smooth' }); });
  if (next) next.addEventListener('click', function () { vp.scrollBy({ left: step(), behavior: 'smooth' }); });

  vp.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); vp.scrollBy({ left: step(), behavior: 'smooth' }); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); vp.scrollBy({ left: -step(), behavior: 'smooth' }); }
    if (e.key === 'Home') { e.preventDefault(); vp.scrollTo({ left: 0, behavior: 'smooth' }); }
    if (e.key === 'End') { e.preventDefault(); vp.scrollTo({ left: maxScroll(), behavior: 'smooth' }); }
  });

  /* click-and-drag for mouse users, with a little inertia on release */
  var down = false, moved = false, startX = 0, startLeft = 0, lastX = 0, lastT = 0, vx = 0, glide = 0;

  vp.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') return;          /* let the OS handle touch */
    down = true; moved = false;
    startX = lastX = e.clientX;
    startLeft = vp.scrollLeft;
    lastT = performance.now(); vx = 0;
    cancelAnimationFrame(glide);
    vp.setPointerCapture(e.pointerId);
  });

  vp.addEventListener('pointermove', function (e) {
    if (!down) return;
    var dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 4) { moved = true; vp.classList.add('is-drag'); }
    if (!moved) return;
    vp.scrollLeft = startLeft - dx;
    var now = performance.now(), dt = now - lastT;
    if (dt > 0) vx = (e.clientX - lastX) / dt;
    lastX = e.clientX; lastT = now;
  });

  function release() {
    if (!down) return;
    down = false;
    if (!moved) return;
    vp.classList.remove('is-drag');
    var v = vx * 16;
    (function coast() {
      if (Math.abs(v) < 0.4) return;
      vp.scrollLeft -= v; v *= 0.92;
      glide = requestAnimationFrame(coast);
    })();
  }
  vp.addEventListener('pointerup', release);
  vp.addEventListener('pointercancel', release);
  vp.addEventListener('pointerleave', release);
  vp.addEventListener('click', function (e) {
    if (moved) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  paint();
}

/* ---------- treatments ---------- */
(function () {
  var list = $('#trList'), frame = $('#trFrame'), idle = $('#trIdle');
  if (!list) return;

  TREATMENTS.forEach(function (t, i) {
    var li = document.createElement('li');
    li.className = 'rv';
    li.innerHTML =
      '<a class="tr__row" href="#appointment" aria-label="' + t[0] + ' — enquire">' +
        '<div class="tr__inner">' +
          '<h3 class="tr__name">' + t[0] + '</h3>' +
          '<p class="tr__desc">' + t[1] + '</p>' +
          '<div class="tr__meta"><span class="tr__visits">' + t[2] + '</span>' +
          '<svg class="tr__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>' +
          '</div>' +
        '</div></a>';
    list.appendChild(li);

    var img = document.createElement('div');
    if (t[3].indexOf('data:') === 0) {          /* a real illustration or photo */
      img.className = 'photo r-3x2';
      img.style.height = '100%';
      img.innerHTML = '<img src="' + t[3] + '" alt="">';
    } else {                                     /* still a labelled slot */
      img.className = 'slot texture r-3x2';
      img.style.height = '100%';
      img.innerHTML = '<span>' + t[3] + '</span>';
    }
    frame.appendChild(img);

    var row = li.querySelector('a');
    var show = function () { idle.classList.remove('on'); $$('.slot', frame).forEach(function (s, n) { s.classList.toggle('on', n === i); }); };
    var hide = function () { idle.classList.add('on'); $$('.slot', frame).forEach(function (s) { s.classList.remove('on'); }); };
    row.addEventListener('mouseenter', show);
    row.addEventListener('focus', show);
    row.addEventListener('mouseleave', hide);
    row.addEventListener('blur', hide);
  });
})();

/* ---------- technology ---------- */
(function () {
  var ul = $('#techList');
  if (!ul) return;
  TECH.forEach(function (t) {
    var li = document.createElement('li');
    li.className = 'rv';
    li.innerHTML = '<div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + t[2] + '</svg>' +
      '<h3>' + t[0] + '</h3><p>' + t[1] + '</p></div>';
    ul.appendChild(li);
  });
})();

/* ============================================================
   REVIEWS

   From the clinic's Google Business Profile (4.9, 89 reviews).
   Short excerpts with a link out to the full listing rather than
   reprinting whole reviews: they are the patients' words, and
   Google is where they live.
   ============================================================ */
(function () {
  var track = document.getElementById('rvTrack');
  if (!track) return;

  var QUOTES = [
    ['All procedures are painless.', 'Wisdom tooth removal · root canals'],
    ['Kind and gentle with her treatment.', 'Accompanying an 86-year-old patient'],
    ['Warm, welcoming, and comforting.', 'First visit'],
    ['Kind, patient, and extremely cooperative.', 'Root canal · fillings'],
    ['Removed my teeth without any pain.', 'Emergency extraction']
  ];

  var star = '<svg viewBox="0 0 20 20" aria-hidden="true">' +
    '<path d="M10 1.6l2.5 5.1 5.6.8-4 3.9 1 5.6L10 14.4 4.9 17l1-5.6-4-3.9 5.6-.8z" fill="var(--gold)"/></svg>';

  track.innerHTML = QUOTES.map(function (q) {
    return '<div class="swipe__item rv__item">' +
             '<figure class="rv__card">' +
               '<div class="rv__stars" aria-label="5 out of 5">' + star + star + star + star + star + '</div>' +
               '<blockquote>&ldquo;' + q[0] + '&rdquo;</blockquote>' +
               '<figcaption>' + q[1] + '<span>Google review</span></figcaption>' +
             '</figure>' +
           '</div>';
  }).join('');

  swipeRail({ vp: 'rvVp', track: 'rvTrack', bar: 'rvBar', prev: 'rvPrev', next: 'rvNext' });
})();

/* ============================================================
   INTRO — the clinic's title film.

   Runs as an animated image rather than a <video>. A single-file
   build has to inline its media as a data: URI, and browsers will
   not stream video from one — there is no byte-range support, so a
   player shows its poster and stalls with no error. An image has no
   such restriction and nothing to be refused.

   The real project serves intro.mp4 over HTTP, where video is fine.
   ============================================================ */
(function () {
  var intro = document.getElementById('intro');
  if (!intro) return;

  var RUN_MS = 8000;                      /* the film's own length */
  var bar = document.getElementById('introBar');
  var replay = document.getElementById('replayIntro');
  var KEY = 'kd-intro-seen-v3';
  var raf = 0, timer = 0, done = false, began = 0;

  function releaseHero() {
    document.body.classList.remove('intro-playing');
    var title = $('.hero__title');
    if (title) title.classList.add('in');
  }

  function close() {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    intro.classList.add('dim');
    intro.setAttribute('aria-hidden', 'true');
    setTimeout(function () {
      intro.classList.add('out');
      document.body.style.overflow = '';
      releaseHero();
    }, 320);
  }

  function open() {
    done = false;
    began = performance.now();
    intro.classList.remove('out', 'dim');
    intro.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    /* restart the animation from its first frame */
    var img = document.getElementById('introFilm');
    if (img) { var src = img.src; img.src = ''; img.src = src; }
    run();
  }

  function run() {
    cancelAnimationFrame(raf);
    (function tick(now) {
      raf = requestAnimationFrame(tick);
      var t = clamp(((now || performance.now()) - began) / RUN_MS, 0, 1);
      bar.style.width = (t * 100).toFixed(2) + '%';
    })(began);
    clearTimeout(timer);
    timer = setTimeout(close, RUN_MS);
  }

  $('#skip').addEventListener('click', close);
  intro.addEventListener('click', function (e) { if (e.target === intro) close(); });
  addEventListener('keydown', function (e) {
    if (!done && (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter')) close();
  });
  if (replay) replay.addEventListener('click', open);

  var seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) {}

  if (seen || REDUCED) {
    intro.classList.add('out', 'dim');
    intro.setAttribute('aria-hidden', 'true');
    releaseHero();
    return;
  }

  document.body.classList.add('intro-playing');
  document.body.style.overflow = 'hidden';
  began = performance.now();
  run();
})();

/* ---------- nav ---------- */
(function () {
  var nav = $('#nav'), burger = $('#burger'), sheet = $('#sheet');
  var sync = function () { nav.classList.toggle('solid', scrollY > innerHeight * 0.7); };
  sync(); addEventListener('scroll', sync, { passive: true });

  burger.addEventListener('click', function () {
    var open = sheet.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('#sheet a').forEach(function (a) {
    a.addEventListener('click', function () {
      sheet.classList.remove('open'); burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
})();

/* ---------- reveals, rules, counters ---------- */
(function () {
  document.documentElement.classList.add('js');
  var show = function (el) { el.classList.add('in'); };

  if (!('IntersectionObserver' in window) || REDUCED) {
    $$('.rv, .rule').forEach(show);
    $$('[data-count]').forEach(function (el) {
      el.textContent = (+el.dataset.count).toLocaleString('en-IN') + (el.dataset.suffix || '');
    });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      show(e.target);
      io.unobserve(e.target);
      var num = e.target.querySelector('[data-count]');
      if (num) count(num);
    });
  }, { rootMargin: '0px 0px -12% 0px' });

  $$('.rv, .rule').forEach(function (el, i) {
    el.style.transitionDelay = Math.min(i % 6, 3) * 0.05 + 's';
    io.observe(el);
  });

  function count(el) {
    var target = +el.dataset.count, suffix = el.dataset.suffix || '', start = performance.now();
    (function step(now) {
      var t = Math.min((now - start) / 1400, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-IN') + suffix;
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }
})();

/* ============================================================
   BEFORE / AFTER — one per case, all driven by the same code.

   The visitor controls it rather than watching a transition, so they
   can hold it wherever they want to look. Drag, click, or arrow keys.
   ============================================================ */
$$('[data-ba]').forEach(function (frame) {
  var clip = $('[data-ba-clip]', frame);
  var line = $('[data-ba-line]', frame);
  var handle = $('.ba__handle', frame);
  if (!clip || !line || !handle) return;

  var pos = 50, dragging = false;

  function set(v) {
    pos = clamp(v, 0, 100);
    clip.style.clipPath = 'inset(0 ' + (100 - pos) + '% 0 0)';
    line.style.left = pos + '%';
    handle.style.left = pos + '%';
    handle.setAttribute('aria-valuenow', Math.round(pos));
    handle.setAttribute('aria-valuetext', Math.round(pos) + '% before');
  }

  function fromX(x) {
    var r = frame.getBoundingClientRect();
    set(((x - r.left) / r.width) * 100);
  }

  frame.addEventListener('pointerdown', function (e) {
    dragging = true;
    frame.setPointerCapture(e.pointerId);
    fromX(e.clientX);
  });
  frame.addEventListener('pointermove', function (e) { if (dragging) fromX(e.clientX); });
  addEventListener('pointerup', function () { dragging = false; });

  handle.addEventListener('keydown', function (e) {
    var d = e.shiftKey ? 10 : 2;
    if (e.key === 'ArrowLeft') { e.preventDefault(); set(pos - d); }
    if (e.key === 'ArrowRight') { e.preventDefault(); set(pos + d); }
    if (e.key === 'Home') { e.preventDefault(); set(0); }
    if (e.key === 'End') { e.preventDefault(); set(100); }
  });

  set(50);
});

/* ============================================================
   BOOKING — consultation type, date, time slot.

   Slots are generated from the clinic's real hours rather than a
   generic morning/afternoon/evening grid: Google lists 10:00–13:00
   and 16:00–21:00, Mon–Sat. There is no afternoon session, and
   Sundays are shown greyed rather than hidden so nobody wonders
   whether the list simply ran out.

   Availability here is indicative. The clinic confirms the actual
   slot on WhatsApp — nothing is reserved by picking one.
   ============================================================ */
var booking = (function () {

  /* ---- the schedule, in one place ----------------------------------
     Open Monday to Saturday, 10:00–21:00. Closed Sundays and on the
     holidays listed below. Ranges are inclusive of the last slot, and
     the last one is 8:45 PM so nobody is booked into the closing minute. */
  var OPEN = [
    [10 * 60,      12 * 60,      'Morning'],      /* 10:00 AM – 12:00 PM */
    [12 * 60 + 15, 17 * 60,      'Afternoon'],    /* 12:15 PM –  5:00 PM */
    [17 * 60 + 15, 20 * 60 + 45, 'Evening']       /*  5:15 PM –  8:45 PM */
  ];

  /* Fixed-date public holidays. Festivals that move with the lunar
     calendar — Deepavali, Ayudha Pooja, Bakrid, Good Friday, Milad-un-Nabi
     — are NOT here: their dates change every year and guessing them would
     put the clinic on the wrong side of a closed day. Add them as MM-DD
     entries at the start of each year. */
  var HOLIDAYS_FIXED = [
    '01-01',   /* New Year\u2019s Day */
    '01-14',   /* Pongal */
    '01-15',   /* Thiruvalluvar Day */
    '01-26',   /* Republic Day */
    '04-14',   /* Tamil New Year / Ambedkar Jayanti */
    '05-01',   /* May Day */
    '08-15',   /* Independence Day */
    '10-02',   /* Gandhi Jayanti */
    '12-25'    /* Christmas */
  ];

  /* Movable festivals for the current year, as YYYY-MM-DD. Fill each January. */
  var HOLIDAYS_DATED = [];

  var STEP = 15, SHOWN = 8, DAYS = 14;

  var state = { type: 'In-clinic consult', date: null, slot: null };

  var dates = document.getElementById('bkDates');
  var slotsBox = document.getElementById('bkSlots');
  var typeBox = document.getElementById('bkType');
  if (!dates || !slotsBox || !typeBox) return null;

  function label(mins) {
    var h = Math.floor(mins / 60), m = mins % 60;
    var ampm = h < 12 ? 'AM' : 'PM';
    var hh = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return hh + ':' + (m < 10 ? '0' + m : m) + ' ' + ampm;
  }

  var DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function ordinal(n) {
    if (n > 3 && n < 21) return n + 'th';
    return n + ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
  }

  /* ---- dates ---- */
  var today = new Date(); today.setHours(0, 0, 0, 0);
  dates.innerHTML = '';
  for (var i = 0; i < DAYS; i++) {
    var d = new Date(today); d.setDate(today.getDate() + i);
    var iso = d.getFullYear() + '-' +
              String(d.getMonth() + 1).padStart(2, '0') + '-' +
              String(d.getDate()).padStart(2, '0');
    var holiday = HOLIDAYS_FIXED.indexOf(iso.slice(5)) > -1 ||
                  HOLIDAYS_DATED.indexOf(iso) > -1;
    var closed = d.getDay() === 0 || holiday;
    var name = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAY[d.getDay()];
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'book__day';
    b.disabled = closed;
    b.dataset.iso = iso;
    b.dataset.human = name + ', ' + ordinal(d.getDate()) + ' ' + MON[d.getMonth()];
    var sub = ordinal(d.getDate()) + ' ' + MON[d.getMonth()];
    if (holiday) sub = 'Holiday';
    else if (closed) sub = 'Closed';
    b.innerHTML = '<b>' + name + '</b><span>' + sub + '</span>';
    dates.appendChild(b);
  }

  function pickDate(btn) {
    $$('.book__day', dates).forEach(function (x) { x.classList.toggle('is-on', x === btn); });
    state.date = btn.dataset.human;
    state.slot = null;
    renderSlots(btn.dataset.iso);
    document.getElementById('bk-err').textContent = '';
    /* bring the freshly drawn grid into view on a phone, where it lands
       below the fold */
    if (innerWidth < 720) {
      slotsBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  dates.addEventListener('click', function (e) {
    var b = e.target.closest('.book__day');
    if (b && !b.disabled) pickDate(b);
  });

  /* ---- slots ---- */
  function renderSlots(iso) {
    var now = new Date();
    var todayIso = now.getFullYear() + '-' +
                   String(now.getMonth() + 1).padStart(2, '0') + '-' +
                   String(now.getDate()).padStart(2, '0');
    var isToday = iso === todayIso;
    var mins = now.getHours() * 60 + now.getMinutes();

    slotsBox.innerHTML = '';
    var any = false;

    OPEN.forEach(function (part) {
      var list = [];
      for (var t = part[0]; t <= part[1]; t += STEP) {
        if (isToday && t <= mins + 45) continue;         /* no same-hour bookings */
        list.push(t);
      }
      if (!list.length) return;
      any = true;

      var wrap = document.createElement('div');
      wrap.className = 'book__part';
      wrap.innerHTML = '<div class="book__parth"><b>' + part[2] + '</b>' +
                       '<span>' + list.length + ' slot' + (list.length === 1 ? '' : 's') + '</span></div>' +
                       '<div class="book__slots"></div>';
      var row = wrap.querySelector('.book__slots');

      list.forEach(function (t, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'book__slot';
        b.textContent = label(t);
        if (i >= SHOWN) b.hidden = true;
        row.appendChild(b);
      });

      if (list.length > SHOWN) {
        var more = document.createElement('button');
        more.type = 'button';
        more.className = 'book__more';
        more.innerHTML = 'More <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
        more.addEventListener('click', function () {
          var open = more.classList.toggle('open');
          $$('.book__slot', row).forEach(function (b, i) { b.hidden = !open && i >= SHOWN; });
          more.firstChild.textContent = open ? 'Fewer ' : 'More ';
        });
        wrap.appendChild(more);
      }
      slotsBox.appendChild(wrap);
    });

    if (!any) {
      slotsBox.innerHTML = '<p class="book__closed">No slots left today. Try tomorrow, ' +
        'or message the clinic and we will fit you in.</p>';
    }
  }

  slotsBox.addEventListener('click', function (e) {
    var b = e.target.closest('.book__slot');
    if (!b) return;
    $$('.book__slot', slotsBox).forEach(function (x) { x.classList.toggle('is-on', x === b); });
    state.slot = b.textContent;
    document.getElementById('bk-err').textContent = '';
  });

  /* ---- type ---- */
  typeBox.addEventListener('click', function (e) {
    var b = e.target.closest('.book__opt');
    if (!b) return;
    $$('.book__opt', typeBox).forEach(function (x) { x.classList.toggle('is-on', x === b); });
    state.type = b.dataset.type;
  });

  /* Nothing is preselected. Forty-four slots on arrival is noise, and it
     also implies a date the visitor never chose. The grid appears once
     they pick one. */
  function prompt() {
    slotsBox.innerHTML = '<p class="book__closed">Choose a date to see the times available.</p>';
  }
  prompt();

  swipeRail({ vp: 'bkDateVp', track: 'bkDates' });

  return state;
})();

/* ============================================================
   APPOINTMENT FORM

   The visitor never leaves the page. The form posts to the clinic's
   own endpoint, which relays the request to the clinic's WhatsApp;
   the visitor just sees a confirmation.

   A browser cannot send a WhatsApp message on someone else's behalf,
   so the relay has to run server-side with API credentials. See
   api/appointment.js in the handover for that half.
   ============================================================ */
(function () {
  var form = document.getElementById('apForm');
  if (!form) return;

  /* The serverless function that relays the booking to WhatsApp. See
     api/appointment.js. Leave it empty to run the form without a backend:
     it validates and confirms but sends nothing, which is useful while
     the WhatsApp Business account is still being approved. */
  var ENDPOINT = '';   /* GitHub Pages is static: no server, so the form
                          hands off to WhatsApp. Set this to
                          '/api/appointment' once the function is deployed. */

  var formErr = document.getElementById('apFormErr');
  var sendBtn = document.getElementById('apSend');
  var panel = document.getElementById('apDone');

  var FIELDS = [
    { id: 'f-name',  msg: 'Enter your full name',
      ok: function (v) { return v.length >= 2; } },
    { id: 'f-phone', msg: 'Enter a number we can reach you on',
      ok: function (v) { return /^[+()\d\s-]{8,}$/.test(v); } },
    { id: 'f-email', msg: 'Enter a valid email address',
      ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); } },
    { id: 'f-treat', msg: 'Choose a treatment',
      ok: function (v) { return v !== ''; } },
    { id: 'f-msg',   msg: 'Tell us what is bothering you',
      ok: function (v) { return v.length >= 4; } }
  ];

  function check(f) {
    var el = document.getElementById(f.id);
    var err = document.getElementById(f.id + '-err');
    var good = f.ok(el.value.trim());
    el.closest('.field').classList.toggle('invalid', !good);
    if (err) err.textContent = good ? '' : f.msg;
    return good;
  }

  FIELDS.forEach(function (f) {
    var el = document.getElementById(f.id);
    ['input', 'change', 'blur'].forEach(function (evt) {
      el.addEventListener(evt, function () {
        if (el.closest('.field').classList.contains('invalid')) check(f);
      });
    });
  });

  function payload() {
    var v = function (id) { return document.getElementById(id).value.trim(); };
    return {
      name: v('f-name'),
      phone: v('f-phone'),
      email: v('f-email'),
      treatment: v('f-treat'),
      type: booking ? booking.type : '',
      date: booking ? booking.date : '',
      slot: booking ? booking.slot : '',
      message: v('f-msg')
    };
  }

  function done(data) {
    panel.querySelector('[data-when]').textContent = data.date + ' at ' + data.slot;
    form.hidden = true;
    panel.hidden = false;
    panel.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function failed() {
    sendBtn.disabled = false;
    sendBtn.textContent = 'Request appointment';
    formErr.textContent = 'That did not go through. Please call the clinic on +91 90420 66006.';
    formErr.classList.add('on');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var bad = FIELDS.filter(function (f) { return !check(f); });
    var slotErr = document.getElementById('bk-err');
    var noSlot = !booking || !booking.date || !booking.slot;
    slotErr.textContent = noSlot ? 'Pick a date and a time' : '';

    if (bad.length || noSlot) {
      var outstanding = bad.length + (noSlot ? 1 : 0);
      formErr.textContent = outstanding === 1
        ? 'One answer is still missing.'
        : outstanding + ' answers are still missing.';
      formErr.classList.add('on');
      var target = bad.length ? document.getElementById(bad[0].id)
                              : document.getElementById('bkSlots');
      if (target.focus) target.focus();
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    formErr.classList.remove('on');

    var data = payload();
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending\u2026';

    /* No backend — GitHub Pages and any other static host. Hand the
       visitor to WhatsApp with the message already written rather than
       showing a confirmation for something that was never sent. */
    if (!ENDPOINT) {
      var lines = [
        'Appointment request \u2014 Dr. Kannan\u2019s Dentistry', '',
        'Name: ' + data.name,
        'Phone: ' + data.phone,
        'Email: ' + data.email,
        'Treatment: ' + data.treatment,
        'Type: ' + data.type,
        'Requested: ' + data.date + ' at ' + data.slot, '',
        data.message
      ];
      window.location.href = 'https://wa.me/919042066006?text=' +
        encodeURIComponent(lines.join('\n'));
      return;
    }

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function () { done(data); })
      .catch(failed);
  });
})();



swipeRail({ vp: 'galVp', track: 'galTrack', bar: 'galBar', prev: 'galPrev', next: 'galNext' });

/* ============================================================
   LINE REVEAL — display headings rise out of a mask, line by line.
   Lines are measured, not guessed, so a re-wrap at a new width
   re-splits correctly.
   ============================================================ */
(function () {
  /* Headings with hand-set breaks (the hero) keep their own line structure
     and their inline markup; only the wrapping is added. */
  $$('[data-split-html]').forEach(function (el) {
    var parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(function (line) {
      return '<span class="line"><span>' + line.trim() + '</span></span>';
    }).join('');
    if (REDUCED) el.classList.add('in');
  });

  var targets = $$('[data-split]');
  if (!targets.length) return;

  targets.forEach(function (el) { el.dataset.text = el.textContent.trim(); });

  function split(el) {
    var words = el.dataset.text.split(/\s+/);
    el.innerHTML = words.map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');

    var ws = $$('.w', el), lines = [], cur = [], top = null;
    ws.forEach(function (w) {
      var t = Math.round(w.offsetTop);
      if (top === null) top = t;
      if (t !== top) { lines.push(cur); cur = []; top = t; }
      cur.push(w.textContent);
    });
    lines.push(cur);

    el.innerHTML = lines.map(function (l) {
      return '<span class="line"><span>' + l.join(' ') + '</span></span>';
    }).join('');
  }

  if (REDUCED) {
    targets.forEach(function (el) { el.classList.add('in'); });
    return;
  }

  targets.forEach(split);

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -14% 0px' });
  targets.forEach(function (el) { io.observe(el); });

  var t;
  addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(function () {
      targets.forEach(function (el) {
        var was = el.classList.contains('in');
        split(el);
        if (was) el.classList.add('in');
      });
    }, 180);
  }, { passive: true });
})();

/* ============================================================
   FRAME DRIFT — the picture moves a little inside its mask as the
   page passes it. Ten percent of the scroll distance, no more.
   ============================================================ */
(function () {
  if (REDUCED || typeof gsap === 'undefined') return;
  $$('[data-drift]').forEach(function (el) {
    gsap.fromTo(el, { scale: 1.12, yPercent: -3 }, {
      scale: 1.0, yPercent: 3, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 }
    });
  });
})();

/* ============================================================
   PROGRESS RAIL + NAV INVERSION
   ============================================================ */
(function () {
  var rail = document.getElementById('rail');
  var fill = document.getElementById('railFill');
  if (!rail) return;

  var wa = document.getElementById('waBtn');
  var steps = $$('.rail__step');
  var sections = steps.map(function (s) { return document.getElementById(s.dataset.rail); });
  var darks = $$('[data-nav="dark"]');
  var navH = 80;
  var target = 0, shown = 0;

  function measure() {
    var doc = document.documentElement;
    target = doc.scrollTop / Math.max(1, doc.scrollHeight - innerHeight);
  }

  function paint() {
    // rail only appears once the visitor is past the hero
    rail.classList.toggle('on', scrollY > innerHeight * 0.8);
    if (wa) wa.classList.toggle('on', scrollY > innerHeight * 0.55);

    var active = -1;
    sections.forEach(function (sec, i) {
      if (!sec) return;
      if (sec.getBoundingClientRect().top <= innerHeight * 0.5) active = i;
    });
    steps.forEach(function (s, i) { s.classList.toggle('on', i === active); });

    // both the rail and the nav invert over a dark section
    var overDark = darks.some(function (d) {
      var r = d.getBoundingClientRect();
      return r.top <= navH && r.bottom > navH;
    });
    document.body.classList.toggle('nav-dark', overDark);

    var railMid = innerHeight * 0.5;
    var railDark = darks.some(function (d) {
      var r = d.getBoundingClientRect();
      return r.top <= railMid && r.bottom > railMid;
    });
    document.body.classList.toggle('rail-light', railDark);
  }

  measure(); paint();

  (function tick() {
    requestAnimationFrame(tick);
    shown += (target - shown) * 0.12;
    fill.style.height = (shown * 100).toFixed(2) + '%';
  })();

  addEventListener('scroll', function () { measure(); paint(); }, { passive: true });
  addEventListener('resize', function () { measure(); paint(); }, { passive: true });
})();


/* ============================================================
   SIGNATURE FILM

   Nothing to drive. The loop is an animated image, so it runs on its
   own with no play() to be refused and no autoplay policy to satisfy.
   Under reduced motion it is swapped for a still frame.
   ============================================================ */
(function () {
  if (!REDUCED) return;
  var img = document.getElementById('sigLoop');
  if (img) img.src = img.dataset.still || img.src;
})();

})();

