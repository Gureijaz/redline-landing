/* ============================================================
   Redline MVP — shared state, helpers and the prototype menu.
   SIT317 Task 8.2HD · Gureijaz Singh Aulakh · s224859639

   State lives in localStorage so the client-side Readiness Check,
   the consultant console and the issued Cyber Posture Statement are
   one continuous engagement rather than three disconnected mock-ups.
   Nothing leaves the browser — which is also the privacy position
   the real service takes.
   ============================================================ */
(function (global) {
  'use strict';

  var KEY = 'redline.mvp.v1';

  var BLANK = {
    check: null,          // { answers, band, score, gaps, takenAt }
    engagement: null,     // { practice, staff, systems, contact, startedAt }
    e8: {},               // { controlId: 'pass' | 'partial' | 'fail' }
    discovery: null,      // { ranAt, locations: [...] }
    decisions: {},        // { itemId: {action:'clear'|'keep', reason, at} }
    statement: null       // { ref, issued, band, authorisedBy }
  };

  function load() {
    try {
      var raw = global.localStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(BLANK));
      var s = JSON.parse(raw);
      Object.keys(BLANK).forEach(function (k) {
        if (!(k in s)) s[k] = JSON.parse(JSON.stringify(BLANK[k]));
      });
      return s;
    } catch (e) {
      return JSON.parse(JSON.stringify(BLANK));
    }
  }

  function save(s) {
    try { global.localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private mode */ }
    return s;
  }

  function reset() {
    try { global.localStorage.removeItem(KEY); } catch (e) {}
  }

  /* ---------------- posture bands ---------------- */
  var BANDS = ['Initial', 'Developing', 'Managed', 'Strong'];

  function bandIndex(name) { return Math.max(0, BANDS.indexOf(name)); }

  /* ---------------- formatting ---------------- */
  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

  function longDate(d) {
    d = d ? new Date(d) : new Date();
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }
  function shortDate(d) {
    d = d ? new Date(d) : new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
  }
  function isoDate(d) {
    d = d ? new Date(d) : new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }

  /* Reference numbers are sequential-looking but deterministic per
     engagement, so the same demo run always produces the same number. */
  function makeRef(seed) {
    var h = 0, s = String(seed || Date.now());
    for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
    var n = 100 + (h % 900);
    return 'RL-' + new Date().getFullYear() + '-0' + n;
  }

  /* ---------------- tiny DOM helpers ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------------- theme ---------------- */
  var TKEY = 'redline.theme';
  function applyTheme() {
    try {
      var t = global.localStorage.getItem(TKEY);
      if (t) document.documentElement.setAttribute('data-theme', t);
    } catch (e) {}
  }
  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme');
    if (!cur) {
      cur = global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { global.localStorage.setItem(TKEY, next); } catch (e) {}
  }

  /* ---------------- prototype menu ---------------- */
  var PAGES = [
    ['index.html',     'Landing'],
    ['check.html',     'Readiness Check'],
    ['console.html',   'Consultant console'],
    ['statement.html', 'Posture Statement'],
    ['intake.html',    'Secure intake'],
    ['incident.html',  'Incident card']
  ];

  function here() {
    var p = location.pathname.split('/').pop();
    return p === '' ? 'index.html' : p;
  }

  function mountMenu() {
    if (document.body.hasAttribute('data-no-menu')) return;
    var open = false;
    try { open = global.localStorage.getItem('redline.menu') === '1'; } catch (e) {}

    var body = el('div', { class: 'bd' });
    PAGES.forEach(function (p) {
      body.appendChild(el('a', { href: p[0], class: p[0] === here() ? 'here' : '', text: p[1] }));
    });
    body.appendChild(el('button', {
      class: 'seed',
      title: 'Fill the prototype with the worked example so every screen has data',
      onclick: function () { global.Redline.seed(); location.reload(); }
    }, ['Load worked example']));
    body.appendChild(el('button', {
      onclick: function () { reset(); location.href = 'index.html'; }
    }, ['Reset']));
    body.appendChild(el('button', { onclick: toggleTheme }, ['Light / dark']));

    var head = el('div', { class: 'hd' }, []);
    head.appendChild(el('span', { class: 'dot' }));
    head.appendChild(el('b', { text: 'Prototype menu' }));
    head.appendChild(el('span', { class: 'grow' }));
    var chev = el('span', { text: open ? '✕' : '▲' });
    head.appendChild(chev);

    var bar = el('div', { class: 'protobar noprint' }, [head, body]);
    body.hidden = !open;
    head.addEventListener('click', function () {
      open = !open;
      body.hidden = !open;
      chev.textContent = open ? '✕' : '▲';
      try { global.localStorage.setItem('redline.menu', open ? '1' : '0'); } catch (e) {}
    });
    document.body.appendChild(bar);
  }

  /* ---------------- boot ---------------- */
  applyTheme();
  document.addEventListener('DOMContentLoaded', mountMenu);

  global.Redline = {
    load: load, save: save, reset: reset,
    BANDS: BANDS, bandIndex: bandIndex,
    longDate: longDate, shortDate: shortDate, isoDate: isoDate,
    plural: plural, makeRef: makeRef,
    $: $, $$: $$, el: el, esc: esc,
    toggleTheme: toggleTheme
  };
})(window);
