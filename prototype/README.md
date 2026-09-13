# Redline — high-fidelity prototype (SIT317 Task 8.2HD)

A working MVP of the Redline service: the client-facing Tranche 2 Readiness Check, the staff-only
consultant console, and the Cyber Posture Statement the engagement produces.

**Author:** Gureijaz Singh Aulakh · s224859639 · Team 9 — Redline
**Live:** https://gureijaz.github.io/redline-landing/prototype/
**Team landing page (Task 6.2C):** https://gureijaz.github.io/redline-landing/

---

## Running it

No build step, no dependencies, no server required for most of it — open `index.html` in a browser.

If you want the pages to share state reliably (some browsers restrict `localStorage` on `file://`),
serve the folder over HTTP instead:

```bash
python -m http.server 8317
```

then open `http://localhost:8317/prototype/`.

Add `?demo=1` to any page to seed a finished engagement, e.g.
`statement.html?demo=1` shows a completed Cyber Posture Statement without clicking through the flow.

---

## The screens

| File | What it is | What actually works |
|---|---|---|
| `index.html` | Client-facing product home | Two entry paths, brand applied, light/dark |
| `check.html` | Tranche 2 Readiness Check | **Real.** Six questions, multi-select, "I'm not sure" on every question, rules-based scoring, posture band, top three gaps with time estimates |
| `console.html` | Consultant workspace (staff only) | **Real.** Engagement record, Essential Eight baseline that drives the band, simulated discovery across five locations, per-item clear/keep with location bulk actions, live deletion register, Statement issue |
| `statement.html` | Cyber Posture Statement | **Real.** Generated from engagement state, unique reference number, prints to one A4 page with the deletion record as Attachment A |
| `intake.html` | Secure ID intake link | Simulated send; live seven-day deletion countdown. File never leaves the browser |
| `incident.html` | First-hour incident card | Printable card |

`intake.html` and `incident.html` are my own additions beyond the team's Task 7.1P Design and
Technology Plan, which finds and clears identity documents but does nothing about how the next ones
arrive or about the morning something goes wrong.

## The code

```
prototype/
  index.html check.html console.html statement.html intake.html incident.html
  assets/
    redline.css   design system — brand tokens from Task 6.1P, light + dark, print rules
    app.js        shared state (localStorage), formatting, theme, prototype menu
    data.js       the six questions and the scoring engine, the Essential Eight subset,
                  and the seeded practice used for the worked example
```

Vanilla HTML, CSS and JavaScript. No framework and no build tooling, deliberately: the deliverable
is a document and a conversation, and the front end exists to qualify a lead and to render an
artefact. Fonts are Newsreader, IBM Plex Sans and IBM Plex Mono via Google Fonts, with system
fallbacks if they fail to load.

## Data and privacy

Nothing is transmitted. All state lives in `localStorage` in the visitor's own browser and the
**Reset** button in the prototype menu clears it. The uploaded file on the intake screen is read
for its name and size only and never leaves the page. This mirrors the position the real service
takes: discovery runs on the practice's own screen with the principal driving, and Redline holds no
standing access to a client tenancy.

The practice, the files and the findings in the worked example are fictional.

## Disclaimer

Redline is a concept venture developed for Deakin University SIT317 and is not trading. It is not a
law firm, does not provide legal advice, and does not certify AML/CTF or Privacy Act compliance.
