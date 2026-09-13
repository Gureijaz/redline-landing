(function (global) {
  'use strict';

  /* 1. READINESS CHECK */

  var QUESTIONS = [
    {
      id: 'where',
      multi: true,
      q: 'Where do client ID documents end up?',
      help: 'Tick every place a licence or passport scan could be sitting right now. Most practices tick more than they expect to.',
      options: [
        { v: 'mailbox', t: 'Email inbox or shared mailbox', score: 0, gap: 'Full ID copies are sitting in a shared mailbox', mins: 40 },
        { v: 'drive',   t: 'Shared network drive',          score: 1, gap: 'ID scans are filed in matter folders on the shared drive', mins: 35 },
        { v: 'pms',     t: 'Practice management system',    score: 2 },
        { v: 'scanner', t: 'Scanner drop folder',           score: 0, gap: 'The scanner folder keeps everything and is never cleared', mins: 10 },
        { v: 'laptops', t: 'Staff laptops',                 score: 0, gap: 'ID copies are held on individual staff machines', mins: 25 },
        { v: 'unsure',  t: "I'm not sure",  unsure: true,   score: 0, gap: 'Nobody in the practice can say where client ID is stored', mins: 60 }
      ]
    },
    {
      id: 'retain',
      q: 'After you verify a client, do you still keep the full copy of their ID?',
      help: 'OAIC guidance is that a full copy is not needed for AML/CTF record-keeping once the verification is recorded.',
      options: [
        { v: 'always', t: 'Yes, we keep everything',        sub: 'It goes in the matter and stays there', score: 0, gap: 'Full ID copies are retained by default after verification', mins: 45 },
        { v: 'some',   t: 'Sometimes',                      sub: 'It depends who did the file', score: 1, gap: 'ID retention depends on who handled the matter', mins: 30 },
        { v: 'no',     t: 'No, we clear them',              sub: 'We keep the verification record only', score: 3 },
        { v: 'unsure', t: "I'm not sure", unsure: true,     score: 0, gap: 'No one can confirm whether ID copies are being kept', mins: 45 }
      ]
    },
    {
      id: 'mfa',
      q: 'Is multi-factor authentication turned on for everyone?',
      help: 'This is the single control that most often decides whether a stolen password becomes an incident.',
      options: [
        { v: 'all',    t: 'Yes, everyone',                  score: 3 },
        { v: 'some',   t: 'Some accounts, not all',         sub: 'Usually the principal has it and nobody else does', score: 1, gap: 'Multi-factor authentication is missing on some accounts', mins: 20 },
        { v: 'none',   t: 'No',                             score: 0, gap: 'Multi-factor authentication is not enabled', mins: 25 },
        { v: 'unsure', t: "I'm not sure", unsure: true,     score: 0, gap: 'MFA coverage is unknown and has never been checked', mins: 20 }
      ]
    },
    {
      id: 'admin',
      q: 'How many people can change settings for everyone (administrators)?',
      help: 'Small practices often hand out administrator rights once and never take them back.',
      options: [
        { v: '1-2',    t: 'One or two',                     score: 3 },
        { v: '3-4',    t: 'Three or four',                  score: 1, gap: 'More administrator accounts than the practice needs', mins: 15 },
        { v: '5+',     t: 'Five or more',                   sub: 'Or everyone, because it was easier', score: 0, gap: 'Administrator rights are held by most of the practice', mins: 20 },
        { v: 'unsure', t: "I'm not sure", unsure: true,     score: 0, gap: 'Nobody knows who holds administrator access', mins: 15 }
      ]
    },
    {
      id: 'prove',
      q: "If AUSTRAC asked today, could you show what you hold and what you've deleted?",
      help: 'This is the obligation that catches practices: not the checking, but the proof that you did not keep what you checked.',
      options: [
        { v: 'yes',    t: "Yes, it's documented",           sub: 'We could produce it this afternoon', score: 3 },
        { v: 'partly', t: "Partly, we'd have to go looking", score: 1, gap: 'No standing record of what has been held or removed', mins: 60 },
        { v: 'no',     t: 'No',                             score: 0, gap: 'The practice cannot evidence what it holds or has deleted', mins: 60 },
        { v: 'unsure', t: "I'm not sure", unsure: true,     score: 0, gap: 'It is unclear whether any retention record exists', mins: 60 }
      ]
    },
    {
      id: 'backup',
      q: 'When did someone last check that your backups actually restore?',
      help: 'A backup nobody has restored from is a plan, not a backup.',
      options: [
        { v: '3m',     t: 'In the last three months',       score: 3 },
        { v: '12m',    t: 'In the last year',               score: 2 },
        { v: 'never',  t: 'Longer ago, or never',           score: 0, gap: 'Backups have never been test-restored', mins: 30 },
        { v: 'unsure', t: "I'm not sure", unsure: true,     score: 0, gap: 'No one can say whether backups have been tested', mins: 30 }
      ]
    }
  ];

  function scoreCheck(answers) {
    var max = 0, got = 0, gaps = [], unsureCount = 0;

    QUESTIONS.forEach(function (q) {
      max += 3;
      var picked = answers[q.id];
      if (!picked || (Array.isArray(picked) && !picked.length)) return;
      var chosen = (Array.isArray(picked) ? picked : [picked]).map(function (v) {
        return q.options.filter(function (o) { return o.v === v; })[0];
      }).filter(Boolean);
      if (!chosen.length) return;

      var worst = chosen.reduce(function (a, b) { return b.score < a.score ? b : a; });
      got += worst.score;

      chosen.forEach(function (o) {
        if (o.unsure) unsureCount++;
        if (o.gap) gaps.push({ text: o.gap, mins: o.mins || 20, weight: 3 - o.score, from: q.id });
      });
    });

    var pct = max ? got / max : 0;
    var band = pct >= 0.85 ? 'Strong' : pct >= 0.6 ? 'Managed' : pct >= 0.32 ? 'Developing' : 'Initial';

    gaps.sort(function (a, b) { return b.weight - a.weight || a.mins - b.mins; });

    return { score: got, max: max, pct: pct, band: band, gaps: gaps.slice(0, 3), allGaps: gaps, unsure: unsureCount };
  }

  /* 2. ESSENTIAL EIGHT SUBSET */
  var E8 = [
    { id: 'mfa',     n: 'Multi-factor authentication',   d: 'Every account that can reach client information, not just the principal.',  fix: 'Turn on multi-factor authentication for the accounts still without it.', mins: 20 },
    { id: 'admin',   n: 'Restrict administrator access', d: 'Only the people who genuinely need to change settings for everyone.',       fix: 'Reduce administrator accounts to the two people who need them.',        mins: 15 },
    { id: 'patchos', n: 'Operating systems patched',     d: 'Windows and macOS updates applied within a month.',                          fix: 'Apply the outstanding operating system updates on all machines.',       mins: 30 },
    { id: 'patchapp',n: 'Applications patched',          d: 'Browser, PDF reader, Office and the practice management client.',            fix: 'Update the browser and PDF reader on every machine.',                   mins: 25 },
    { id: 'backup',  n: 'Backups, and a tested restore', d: 'Taken regularly, and proven by restoring something.',                        fix: 'Restore one file from backup to prove the backup works.',               mins: 30 },
    { id: 'macro',   n: 'Office macro settings',         d: 'Macros from the internet blocked by default.',                               fix: 'Block macros from the internet in Office settings.',                    mins: 10 },
    { id: 'harden',  n: 'Browser and reader hardening',  d: 'Turning off the features small practices never use and attackers do.',       fix: 'Disable legacy browser plug-ins and PDF JavaScript.',                   mins: 20 },
    { id: 'appctl',  n: 'Control what staff can install',d: 'Stops unapproved software arriving on a machine that holds client ID.',      fix: 'Remove local install rights from standard staff accounts.',             mins: 25 }
  ];

  /* 3. THE WORKED EXAMPLE */
  var PRACTICE = {
    practice: 'Harrow & Bell Conveyancing Pty Ltd',
    staff: 6,
    suburb: 'Bendigo VIC',
    contact: 'M. Kaur, Principal',
    systems: 'Microsoft 365, shared drive (S:), scanner drop folder, 2 staff laptops, archive drive'
  };

  var CORPUS = [
    {
      id: 'mailbox', n: 'Shared mailbox: settlements@', short: 'Full ID copies in the settlements mailbox',
      where: 'Microsoft 365', secs: 2.1,
      items: [
        ['Kaur_licence_front.jpg',          'settlements@ / Inbox / Ellery matter',        '2026-07-04'],
        ['drivers licence scan.pdf',        'settlements@ / Inbox / Ellery matter',        '2026-07-04'],
        ['passport_page1.png',              'settlements@ / Inbox / Nguyen purchase',      '2026-07-11'],
        ['ID for settlement.pdf',           'settlements@ / Inbox / Nguyen purchase',      '2026-07-11'],
        ['Scan_20260715_094412.pdf',        'settlements@ / Inbox',                        '2026-07-15'],
        ['licence both sides.jpg',          'settlements@ / Inbox / Toomey sale',          '2026-07-18'],
        ['medicare_card.jpg',               'settlements@ / Inbox / Toomey sale',          '2026-07-18'],
        ['FW_ verification docs.msg',       'settlements@ / Inbox',                        '2026-07-22'],
        ['DL_front_back.pdf',               'settlements@ / Archive / 2026',               '2026-07-29'],
        ['client id (2).jpeg',              'settlements@ / Archive / 2026',               '2026-08-02'],
        ['passport bio page.pdf',           'settlements@ / Inbox / Abebe transfer',       '2026-08-06'],
        ['IMG_4471.HEIC',                   'settlements@ / Inbox / Abebe transfer',       '2026-08-06'],
        ['licence_renewed_2026.jpg',        'settlements@ / Inbox / Ellery matter',        '2026-08-13'],
        ['RE_ ID please.msg',               'settlements@ / Inbox',                        '2026-08-14'],
        ['proof of identity.pdf',           'settlements@ / Inbox / Wu subdivision',       '2026-08-20'],
        ['scan0093.pdf',                    'settlements@ / Inbox',                        '2026-08-21'],
        ['birth certificate.pdf',           'settlements@ / Inbox / Wu subdivision',       '2026-08-25'],
        ['licence.png',                     'settlements@ / Deleted Items',                '2026-08-28'],
        ['ID docs combined.pdf',            'settlements@ / Sent Items',                   '2026-09-01']
      ]
    },
    {
      id: 'drive', n: 'Shared network drive: matter folders', short: 'ID scans filed in matter folders',
      where: 'S:\\Matters', secs: 3.4,
      items: [
        ['01_ID_Ellery.pdf',                'S:\\Matters\\2026\\Ellery\\Verification',     '2026-07-04'],
        ['licence_scan.jpg',                'S:\\Matters\\2026\\Nguyen\\Client docs',      '2026-07-12'],
        ['passport.pdf',                    'S:\\Matters\\2026\\Nguyen\\Client docs',      '2026-07-12'],
        ['ID - Toomey.pdf',                 'S:\\Matters\\2026\\Toomey\\Verification',     '2026-07-19'],
        ['VOI pack signed.pdf',             'S:\\Matters\\2026\\Toomey\\Verification',     '2026-07-19'],
        ['identity documents.zip',          'S:\\Matters\\2026\\Abebe',                    '2026-08-07'],
        ['DL front.jpg',                    'S:\\Matters\\2026\\Abebe\\Scans',             '2026-08-07'],
        ['DL back.jpg',                     'S:\\Matters\\2026\\Abebe\\Scans',             '2026-08-07'],
        ['client_id_wu.pdf',                'S:\\Matters\\2026\\Wu\\Verification',         '2026-08-22'],
        ['old ID 2024.pdf',                 'S:\\Matters\\2024\\Pethick',                  '2024-11-03'],
        ['ID scans 2025 batch.pdf',         'S:\\Matters\\2025\\_misc',                    '2025-06-17'],
        ['licence copy.tif',                'S:\\Matters\\2025\\Raines',                   '2025-09-30'],
        ['passport_copy_old.pdf',           'S:\\Matters\\2024\\Okafor',                   '2024-08-12']
      ]
    },
    {
      id: 'scanner', n: 'Scanner drop folder', short: 'Scanner drop folder',
      where: '\\\\MFP-01\\Scans', secs: 1.3,
      items: [
        ['Scan_20260703_1102.pdf',          '\\\\MFP-01\\Scans',                           '2026-07-03'],
        ['Scan_20260717_0915.pdf',          '\\\\MFP-01\\Scans',                           '2026-07-17'],
        ['Scan_20260729_1444.pdf',          '\\\\MFP-01\\Scans',                           '2026-07-29'],
        ['Scan_20260805_1020.pdf',          '\\\\MFP-01\\Scans',                           '2026-08-05'],
        ['Scan_20260819_1331.pdf',          '\\\\MFP-01\\Scans',                           '2026-08-19'],
        ['Scan_20260826_0908.pdf',          '\\\\MFP-01\\Scans',                           '2026-08-26'],
        ['Scan_20260902_1517.pdf',          '\\\\MFP-01\\Scans',                           '2026-09-02'],
        ['Scan_20260908_1045.pdf',          '\\\\MFP-01\\Scans',                           '2026-09-08']
      ]
    },
    {
      id: 'laptops', n: 'Staff machines: Downloads and Desktop', short: 'Copies on staff machines',
      where: '2 laptops', secs: 2.6,
      items: [
        ['licence (1).jpg',                 'DESKTOP-BELL2 \\ Downloads',                  '2026-07-16'],
        ['passport scan.pdf',               'DESKTOP-BELL2 \\ Downloads',                  '2026-08-08'],
        ['ID to send.pdf',                  'DESKTOP-BELL2 \\ Desktop',                    '2026-08-08'],
        ['client licence.png',              'LAPTOP-HARROW \\ Downloads',                  '2026-08-24'],
        ['Scan_20260827_1120.pdf',          'LAPTOP-HARROW \\ Desktop \\ to file',         '2026-08-27']
      ]
    },
    {
      id: 'archive', n: 'Archive drive in the cupboard', short: 'Archive drive in the cupboard',
      where: 'D:\\Archive', secs: 1.8,
      keepDefault: true,
      items: [
        ['POA_identity_bundle_2023.pdf',    'D:\\Archive\\2023\\Delacroix (POA)',          '2023-05-19'],
        ['deceased_estate_ID_2024.pdf',     'D:\\Archive\\2024\\Falk estate',              '2024-02-28']
      ]
    }
  ];

  function corpusItems() {
    var out = [];
    CORPUS.forEach(function (loc) {
      loc.items.forEach(function (it, i) {
        out.push({
          id: loc.id + '-' + i,
          loc: loc.id,
          locName: loc.n,
          file: it[0],
          path: it[1],
          date: it[2],
          keepDefault: !!loc.keepDefault
        });
      });
    });
    return out;
  }

  function seed() {
    var R = global.Redline;
    var s = R.load();

    s.check = {
      answers: { where: ['mailbox', 'drive', 'scanner'], retain: 'some', mfa: 'some', admin: '3-4', prove: 'partly', backup: '12m' },
      takenAt: new Date().toISOString()
    };
    var sc = scoreCheck(s.check.answers);
    s.check.band = sc.band; s.check.score = sc.score; s.check.max = sc.max; s.check.gaps = sc.gaps;

    s.engagement = Object.assign({}, PRACTICE, { startedAt: new Date().toISOString() });

    s.e8 = { mfa: 'partial', admin: 'fail', patchos: 'pass', patchapp: 'partial', backup: 'fail', macro: 'pass', harden: 'partial', appctl: 'pass' };

    s.discovery = { ranAt: new Date().toISOString(), items: corpusItems() };

    s.decisions = {};
    s.discovery.items.forEach(function (it) {
      s.decisions[it.id] = it.keepDefault
        ? { action: 'keep', reason: 'Retained on client instruction: long-running matter', at: new Date().toISOString() }
        : { action: 'clear', reason: '', at: new Date().toISOString() };
    });

    s.statement = null;
    R.save(s);
    return s;
  }

  try {
    if (/[?&]demo=1/.test(global.location.search)) {
      var t = global.Redline.load();
      if (!t.statement || !t.discovery) {
        seed();
        t = global.Redline.load();
        t.statement = {
          ref: global.Redline.makeRef(t.engagement.practice),
          issued: new Date().toISOString(),
          band: 'Developing',
          authorisedBy: t.engagement.contact
        };
        global.Redline.save(t);
      }
    }
  } catch (e) { /* storage unavailable */ }

  global.RedlineData = {
    QUESTIONS: QUESTIONS,
    scoreCheck: scoreCheck,
    E8: E8,
    PRACTICE: PRACTICE,
    CORPUS: CORPUS,
    corpusItems: corpusItems,
    seed: seed
  };
  global.Redline.seed = seed;
})(window);
