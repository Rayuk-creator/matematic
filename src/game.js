/* Il gioco: profili dei bambini, mappa dei mondi (classi), moduli e livelli, minigiochi, stelle e monete. */
(function () {
  'use strict';
  const M = window.Mate;
  const $ = s => document.querySelector(s);
  const EN = window.LANG === 'en';
  const t = (it, en) => EN ? en : it;
  const TH = EN ? ',' : '.', DP = EN ? '.' : ','; // separatore delle migliaia e dei decimali
  const KEYS = { it: 'mate-gioco-v1', en: 'math-game-en-v1' }; // un salvataggio per ogni lingua
  const MY_LANG = EN ? 'en' : 'it', KEY = KEYS[MY_LANG];
  const AVATARS = ['🐶', '🐱', '🐰', '🦊', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🦄', '🐙', '🐢', '🦖', '🐧', '🦉', '🐞', '🐬'];
  const WORLD_EMOJI = { prato: '🌼', bosco: '🌲', mare: '🐳', montagna: '🏔️', spazio: '🌌' };
  const BALLOON_COL = ['#e63946', '#3a86ff', '#ff9f1c', '#8338ec', '#2a9d8f', '#f72585'];
  const QN = 8; // domande per livello

  /* ---------------- salvataggio ---------------- */
  let D = { players: [], cur: null, teacher: false, sound: true };
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && Array.isArray(s.players)) D = Object.assign(D, s); } catch (e) { /* senza salvataggio */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { /* ignora */ } };
  const me = () => D.players.find(p => p.id === D.cur) || null;
  const lkey = (w, m, l) => `${w}/${m}/${l}`;

  /* ---------------- suoni (sintetizzati, niente file) ---------------- */
  let actx = null;
  function beep(kind) {
    if (!D.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = { ok: [660, 880], no: [300, 220], tap: [520], win: [523, 659, 784, 1046] }[kind] || [440];
      notes.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = kind === 'no' ? 'sawtooth' : 'triangle'; o.frequency.value = f;
        const t = actx.currentTime + i * 0.11;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(kind === 'no' ? 0.06 : 0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.2);
      });
    } catch (e) { /* audio non disponibile */ }
  }

  /* ---------------- utilità ---------------- */
  const el = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, ''); else if (v !== false && v != null) e.setAttribute(k, v);
    }
    for (const c of kids.flat()) if (c != null) e.append(c instanceof Node ? c : document.createTextNode(String(c)));
    return e;
  };
  let toastT;
  function toast(t) { const x = $('#toast'); x.textContent = t; x.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { x.hidden = true; }, 2600); }
  const starsOf = (p, k) => (p && p.stars[k]) || 0;
  function worldStars(p, w) { let s = 0, n = 0; for (const m of w.modules) for (const l of m.levels) { s += starsOf(p, lkey(w.n, m.id, l.id)); n += 3; } return [s, n]; }
  function setTop(title, back) {
    $('#tTitle').innerHTML = '';
    if (!back) $('#tTitle').append(el('img', { class: 'logo', src: 'data:image/png;base64,__LOGO__', alt: '' }));
    $('#tTitle').append(el('span', {}, title));
    $('#tBack').hidden = !back;
    $('#tBack').onclick = back || null;
    const p = me();
    $('#tCoins').hidden = !p; $('#tPlayer').hidden = !p;
    if (p) { $('#tCoins').textContent = '🪙 ' + p.coins; $('#tPlayer').textContent = p.avatar + ' ' + p.name; }
    $('#tSound').textContent = D.sound ? '🔊' : '🔇';
  }
  /* ---------------- numeri colorati per posizione ----------------
     unità blu, decine rosso, centinaia verde, migliaia viola, milioni arancio, decimali azzurro;
     il punto delle migliaia è piccolo e grigio, la virgola dei decimali grande e marcata */
  const POS = ['u', 'da', 'h', 'k', 'k', 'k', 'mi', 'mi', 'mi', 'g', 'g', 'g'];
  const NUM_RE = EN ? /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g : /\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g;
  function numSpan(str) {
    const [ip, dp] = str.split(DP);
    const digits = ip.split(TH).join('');
    const out = el('span', { class: 'nm' });
    let pos = digits.length - 1;
    for (const ch of ip) {
      if (ch === TH) { out.append(el('span', { class: 'sep-k', title: t('separatore delle migliaia', 'thousands separator') }, TH)); continue; }
      out.append(el('span', { class: 'd-' + (POS[pos] || 'g') }, ch)); pos--;
    }
    if (dp !== undefined) { out.append(el('span', { class: 'sep-dec', title: t('virgola dei decimali', 'decimal point') }, DP)); for (const ch of dp) out.append(el('span', { class: 'd-dec' }, ch)); }
    return out;
  }
  const SKIP = 'svg, .fact, .note, .mg-title, .anslbl, .lvl, .btn, .giudizio, .rv-l, .keypad, .legend, .nm, .top, .bigstars';
  function deco(root) {
    if (!root) return root;
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.parentElement && n.parentElement.closest(SKIP)) || !/\d/.test(n.nodeValue) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const nodes = []; while (tw.nextNode()) nodes.push(tw.currentNode);
    let big = false;
    for (const n of nodes) {
      const t = n.nodeValue, frag = document.createDocumentFragment();
      let last = 0;
      // le cifre isolate (5 h, 7 da…) restano normali: si colorano i numeri con più cifre o con la virgola
      t.replace(NUM_RE, (m, i) => { if (m.length < 2) return m; frag.append(t.slice(last, i)); frag.append(numSpan(m)); last = i + m.length; big = true; return m; });
      frag.append(t.slice(last));
      n.replaceWith(frag);
    }
    root._big = big;
    return root;
  }
  // legenda dei colori (si mostra quando ci sono numeri con più cifre)
  function legend(withDec, withK) {
    const it = (c, t) => el('span', { class: 'lg' }, el('i', { class: 'd-' + c }, '■'), t);
    return el('div', { class: 'legend' }, withK ? it('k', t('migliaia', 'thousands')) : null, it('h', t('centinaia', 'hundreds')), it('da', t('decine', 'tens')), it('u', t('unità', 'ones')), withDec ? el('span', { class: 'lg' }, el('b', { class: 'sep-dec' }, DP), ' ', el('i', { class: 'd-dec' }, '■'), t('decimali', 'decimals')) : null);
  }
  /* ---------------- passaggi del calcolo in colonna ---------------- */
  // disegna un fotogramma dei passaggi (righe da r0 a r1) nella griglia
  function fillGrid(gridEl, f, group, r0 = 0, r1 = f.rows - 1) {
    gridEl.innerHTML = '';
    gridEl.style.gridTemplateColumns = `repeat(${f.cols}, var(--cw))`;
    const map = new Map(f.cells.map(c => [c.r + ',' + c.c, c]));
    const marks = new Map(); for (const mk of f.marks || []) marks.set(mk.r + ',' + mk.c, (marks.get(mk.r + ',' + mk.c) || '') + ' ' + mk.k);
    // le righe vuote che portano solo la linea del risultato restano basse
    const thin = r => f.lines.includes(r) && !group.some(fr => fr.cells.some(x => x.r === r));
    const rows = []; for (let r = r0; r <= r1; r++) rows.push(r);
    gridEl.style.gridTemplateRows = rows.map(r => thin(r) ? '14px' : 'var(--rh)').join(' ');
    for (const r of rows) for (let c = 0; c < f.cols; c++) {
      const cell = map.get(r + ',' + c);
      let cls = 'sc' + (r === 0 && !f.layout ? ' ctop' : '') + (f.lines.includes(r) ? ' line' : '') + (c === f.hl ? ' hl' : '') + (marks.get(r + ',' + c) || '');
      if (cell) cls += ' ' + cell.k;
      gridEl.append(el('div', { class: cls }, cell ? cell.t : ''));
    }
    return gridEl;
  }
  // l'operazione della domanda, già incolonnata (senza il risultato)
  function columnView(calc) {
    if (!calc || Array.isArray(calc) || !window.Steps) return null;
    const frames = window.Steps.build(calc);
    if (!frames || !frames.length) return null;
    const f = frames[0];
    // addizione, sottrazione e moltiplicazione: i numeri e la linea; divisione: tutto lo schema
    const r0 = f.layout ? 0 : 1, r1 = f.layout ? f.rows - 1 : f.lines[0];
    const g = fillGrid(el('div', { class: 'sgrid' }), { ...f, hl: -1 }, frames, r0, r1);
    return el('div', { class: 'qcol', 'aria-label': t('operazione in colonna', 'column calculation') }, el('div', { class: 'swrap' }, g));
  }
  const calcOf = q => q.calc || q.calcs || null;
  // i calcoli si fanno a mano, sul quaderno: nel gioco si scrive solo il risultato
  const handNote = single => el('div', { class: 'handnote' }, single
    ? t('✏️ Copia l\'operazione sul quaderno, fai il calcolo in colonna a mano e poi scrivi qui solo il risultato.', '✏️ Copy the calculation into your exercise book, work it out in columns by hand, then type just the answer here.')
    : t('✏️ Fai i calcoli in colonna a mano sul quaderno, uno alla volta, e poi scrivi qui solo il risultato finale.', '✏️ Work out the calculations in columns by hand in your exercise book, one at a time, then type just the final answer here.'));
  function stepsViewer(calc) {
    const frames = window.Steps && window.Steps.build(calc);
    if (!frames || !frames.length) return null;
    let i = 0;
    const box = el('div', { class: 'steps' });
    const gridEl = el('div', { class: 'sgrid' });
    const note = el('div', { class: 'snote' });
    const cnt = el('span', { class: 'scnt' });
    const prev = el('button', { class: 'btn alt sbtn', type: 'button', onclick: () => go(i - 1) }, t('◀ Indietro', '◀ Back'));
    const next = el('button', { class: 'btn sbtn', type: 'button', onclick: () => go(i + 1) }, t('Avanti ▶', 'Next ▶'));
    const all = el('button', { class: 'btn alt sbtn', type: 'button', onclick: () => go(frames.length - 1) }, t('Fino alla fine ⏭', 'Skip to the end ⏭'));
    function render() {
      const f = frames[i];
      fillGrid(gridEl, f, frames.filter(fr => fr.grp === f.grp));
      note.innerHTML = f.note;
      deco(note);
      cnt.textContent = t(`Passo ${i + 1} di ${frames.length}`, `Step ${i + 1} of ${frames.length}`);
      prev.disabled = i === 0; next.disabled = i === frames.length - 1; all.disabled = i === frames.length - 1;
    }
    function go(k) { i = Math.max(0, Math.min(frames.length - 1, k)); render(); beep('tap'); }
    box.append(el('div', { class: 'stitle' }, t('👣 Il calcolo passo per passo', '👣 The calculation, step by step')), el('div', { class: 'swrap' }, gridEl), note, el('div', { class: 'sctl' }, prev, cnt, next, all));
    box._key = e => { if (e.key === 'ArrowRight') { go(i + 1); return true; } if (e.key === 'ArrowLeft') { go(i - 1); return true; } return false; };
    render();
    return box;
  }
  // pulsante che apre i passaggi sotto di sé
  function stepsButton(calc, label = t('👣 Guarda i passaggi', '👣 Show the steps')) {
    if (!calc || !window.Steps) return null;
    const wrap = el('div', { class: 'steps-holder' });
    const b = el('button', { class: 'btn alt', type: 'button', onclick: () => { const v = stepsViewer(calc); if (!v) return; b.remove(); wrap.append(v); stepsOpen = v; v.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } }, label);
    wrap.append(b);
    return wrap;
  }
  let stepsOpen = null;
  const screen = () => { const s = $('#screen'); s.innerHTML = ''; window.scrollTo(0, 0); return s; };

  /* ---------------- profili ---------------- */
  function showPlayers() {
    D.cur = null; save();
    setTop(t('Matematica in gioco', 'Maths at Play'));
    const s = screen();
    s.append(el('h1', {}, t('Chi gioca oggi?', 'Who\'s playing today?')), el('p', { class: 'sub' }, t('Scegli il tuo nome oppure crea un nuovo giocatore.', 'Choose your name or create a new player.')));
    const g = el('div', { class: 'players' });
    for (const p of D.players) {
      let tot = 0; for (const v of Object.values(p.stars)) tot += v;
      g.append(el('div', { class: 'player', role: 'button', tabindex: 0, onclick: () => { D.cur = p.id; save(); showWorlds(); }, onkeydown: e => { if (e.key === 'Enter') { D.cur = p.id; save(); showWorlds(); } } },
        el('div', { class: 'av' }, p.avatar), el('div', { class: 'nm' }, p.name), el('div', { class: 'st' }, `⭐ ${tot}  ·  🪙 ${p.coins}`),
        el('button', { class: 'del', type: 'button', title: t('Elimina giocatore', 'Delete player'), 'aria-label': t('Elimina ', 'Delete ') + p.name, onclick: e => { e.stopPropagation(); confirmDel(p); } }, '✕')));
    }
    g.append(el('button', { class: 'player new', type: 'button', onclick: newPlayer }, el('div', { class: 'av' }, '➕'), el('div', { class: 'nm' }, t('Nuovo giocatore', 'New player'))));
    s.append(g);
    s.append(el('p', { class: 'note', style: 'margin-top:22px' }, t('I progressi restano salvati su questo tablet o computer, in Chrome. Per passarli a un altro dispositivo, tocca ⚙️ in alto.', 'Progress is saved on this tablet or computer, in Chrome. To move it to another device, tap ⚙️ at the top.')));
  }
  function modal(content) {
    const m = el('div', { class: 'modal', onclick: e => { if (e.target === m) m.remove(); } }, el('div', { class: 'box' }, content));
    document.body.append(m); return m;
  }
  function newPlayer() {
    let av = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const name = el('input', { class: 'field', maxlength: 16, placeholder: t('Il tuo nome', 'Your name'), 'aria-label': t('Nome', 'Name') });
    const grid = el('div', { class: 'avatars' });
    const paint = () => grid.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.textContent === av)));
    for (const a of AVATARS) grid.append(el('button', { type: 'button', onclick: () => { av = a; paint(); beep('tap'); } }, a));
    paint();
    const go = () => {
      const n = name.value.trim();
      if (!n) { name.focus(); toast(t('Scrivi il tuo nome', 'Type your name')); return; }
      const p = { id: 'p' + Date.now().toString(36), name: n, avatar: av, coins: 0, stars: {} };
      D.players.push(p); D.cur = p.id; save(); m.remove(); showWorlds();
    };
    name.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    const m = modal([el('h2', { style: 'margin-top:0' }, t('Nuovo giocatore', 'New player')), name, el('div', { style: 'font-weight:800;margin-top:14px' }, t('Scegli il tuo personaggio', 'Choose your character')), grid,
      el('div', { class: 'row' }, el('button', { class: 'btn alt', type: 'button', onclick: () => m.remove() }, t('Annulla', 'Cancel')), el('button', { class: 'btn', type: 'button', onclick: go }, t('Iniziamo!', 'Let\'s go!')))]);
    setTimeout(() => name.focus(), 50);
  }
  function confirmDel(p) {
    const m = modal([el('h2', { style: 'margin-top:0' }, t(`Eliminare ${p.name}?`, `Delete ${p.name}?`)), el('p', {}, t('Si perdono le stelle e le monete di questo giocatore.', 'This player\'s stars and coins will be lost.')),
      el('div', { class: 'row' }, el('button', { class: 'btn alt', type: 'button', onclick: () => m.remove() }, t('No', 'No')), el('button', { class: 'btn', style: 'background:#e63946;box-shadow:0 4px 0 #a4161a', type: 'button', onclick: () => { D.players = D.players.filter(x => x !== p); save(); m.remove(); showPlayers(); } }, t('Sì, elimina', 'Yes, delete')))]);
  }

  /* ---------------- mondi (classi) ---------------- */
  function showWorlds() {
    const p = me(); if (!p) return showPlayers();
    setTop(t('I mondi della matematica', 'The worlds of maths'), showPlayers);
    const s = screen();
    s.append(el('h1', {}, t(`Ciao ${p.name}! ${p.avatar}`, `Hi ${p.name}! ${p.avatar}`)), el('p', { class: 'sub' }, t('Ogni mondo è una classe. Scegli dove andare!', 'Each world is a school year. Choose where to go!')));
    const g = el('div', { class: 'worlds' });
    for (const w of M.worlds) {
      const [st, tot] = worldStars(p, w);
      g.append(el('button', { class: 'world t-' + w.theme, type: 'button', onclick: () => showWorld(w) },
        el('div', { class: 'num' }, t(`Classe ${w.n}ª`, `Grade ${w.n}`)), el('div', { class: 'wn' }, w.name), el('div', { class: 'em' }, WORLD_EMOJI[w.theme]), el('div', { class: 'prog' }, `⭐ ${st} / ${tot}`)));
    }
    s.append(g);
  }

  /* ---------------- moduli e livelli di un mondo ---------------- */
  function unlocked(p, w, m, i) {
    if (D.teacher || i === 0) return true;
    return starsOf(p, lkey(w.n, m.id, m.levels[i - 1].id)) > 0;
  }
  // «Cosa imparerai quest'anno»: la guida della classe, con le definizioni che si incontreranno
  function showGuide(w) {
    const p = me(); if (!p) return showPlayers();
    const G = window.Guide && window.Guide[w.n];
    if (!G) return showWorld(w, true);
    const done = () => { p.guideSeen = p.guideSeen || {}; p.guideSeen[w.n] = true; save(); beep('tap'); showWorld(w, true); };
    setTop(t(`Classe ${w.n}ª · Cosa imparerai`, `Grade ${w.n} · What you'll learn`), done);
    const s = screen();
    const box = el('div', { class: 'guide' },
      el('div', { class: 'g-em' }, WORLD_EMOJI[w.theme] || '📖'),
      el('h1', {}, t(`Che cosa imparerai in ${w.n}ª`, `What you'll learn in Grade ${w.n}`)),
      el('p', { class: 'g-intro', html: G.intro }),
      el('p', { class: 'note' }, t('Leggi con calma: queste sono le parole che incontrerai nei giochi. Puoi tornare qui quando vuoi con il pulsante «📖 Cosa imparerai».', 'Take your time: these are the words you will meet in the games. You can come back here whenever you like with the “📖 What you\'ll learn” button.')));
    for (const m of w.modules) {
      const g = G.mods[m.id]; if (!g) continue;
      const dl = el('dl', { class: 'g-terms' });
      for (const [term, def] of g.terms) dl.append(el('dt', {}, term), el('dd', { html: def }));
      box.append(el('section', { class: 'g-mod' },
        el('h2', {}, el('span', {}, m.icon), el('span', {}, m.title)),
        el('p', { class: 'g-learn', html: t('<b>Imparerai:</b> ', '<b>You will learn:</b> ') + g.learn }),
        dl));
    }
    box.append(el('div', { class: 'row' }, el('button', { class: 'btn ok', type: 'button', onclick: done }, t('Ho capito, andiamo a giocare! ▶', 'Got it, let\'s play! ▶'))));
    deco(box);
    s.append(box);
  }
  function showWorld(w, fromGuide) {
    const p = me(); if (!p) return showPlayers();
    // la prima volta che si entra in una classe si legge la guida
    if (!fromGuide && window.Guide && window.Guide[w.n] && !(p.guideSeen || {})[w.n]) return showGuide(w);
    setTop(t(`Classe ${w.n}ª · ${w.name}`, `Grade ${w.n} · ${w.name}`), showWorlds);
    const s = screen();
    s.append(el('p', { class: 'sub', style: 'margin-top:4px' }, t('Gli argomenti sono divisi in moduli. Completa un livello per sbloccare il successivo.', 'Topics are grouped into modules. Complete a level to unlock the next one.')));
    if (window.Guide && window.Guide[w.n]) s.append(el('div', { class: 'row', style: 'margin:0 0 14px' }, el('button', { class: 'btn alt g-btn', type: 'button', onclick: () => { beep('tap'); showGuide(w); } }, t('📖 Cosa imparerai quest\'anno', '📖 What you\'ll learn this year'))));
    for (const m of w.modules) {
      const box = el('section', { class: 'module' });
      let ms = 0; for (const l of m.levels) ms += starsOf(p, lkey(w.n, m.id, l.id));
      box.append(el('h2', {}, el('span', {}, m.icon), el('span', {}, m.title), el('span', { class: 'ms' }, `⭐ ${ms}/${m.levels.length * 3}`)));
      const path = el('div', { class: 'path' });
      m.levels.forEach((l, i) => {
        const st = starsOf(p, lkey(w.n, m.id, l.id)), open = unlocked(p, w, m, i);
        path.append(el('button', { class: 'lvl' + (st ? ' done' : '') + (open ? '' : ' locked'), type: 'button', 'aria-label': `${l.title}${open ? '' : t(' (bloccato)', ' (locked)')}`, onclick: () => { if (!open) { toast(t('Prima completa il livello precedente!', 'Complete the previous level first!')); return; } beep('tap'); showIntro(w, m, l); } },
          el('div', { class: 'dot' }, open ? String(i + 1) : '🔒'), el('div', { class: 'lt' }, l.title), el('div', { class: 'stars', html: [0, 1, 2].map(k => k < st ? '<b>★</b>' : '★').join('') })));
      });
      // verifica finale del modulo: si apre quando tutti i livelli del modulo sono superati
      const allDone = m.levels.every(l => starsOf(p, lkey(w.n, m.id, l.id)) > 0);
      const vOpen = allDone || D.teacher;
      const best = (p.verif || {})[lkey(w.n, m.id, 'verifica')];
      path.append(el('button', { class: 'lvl verif' + (best !== undefined ? ' done' : '') + (vOpen ? '' : ' locked'), type: 'button', 'aria-label': t('Verifica finale', 'Final test') + (vOpen ? '' : t(' (bloccata)', ' (locked)')), onclick: () => { if (!vOpen) { toast(t('La verifica si apre quando hai superato tutti i livelli del modulo!', 'The test opens when you have passed every level in the module!')); return; } beep('tap'); showVerifIntro(w, m); } },
        el('div', { class: 'dot' }, vOpen ? '🏆' : '🔒'), el('div', { class: 'lt' }, t('Verifica finale', 'Final test')), el('div', { class: 'vg' }, best !== undefined ? GIUDIZI(best).short : '')));
      box.append(path);
      s.append(box);
    }
  }
  // giudizi della scuola primaria (O.M. 172/2020)
  function GIUDIZI(pct) {
    if (pct >= 90) return { short: t('Avanzato', 'Advanced'), text: t('Avanzato', 'Advanced'), col: '#2a9d5c' };
    if (pct >= 75) return { short: t('Intermedio', 'Intermediate'), text: t('Intermedio', 'Intermediate'), col: '#4361ee' };
    if (pct >= 60) return { short: t('Base', 'Basic'), text: t('Base', 'Basic'), col: '#ff9f1c' };
    return { short: t('Da rinforzare', 'Keep practising'), text: t('In via di prima acquisizione', 'Still learning (emerging)'), col: '#e63946' };
  }
  const VN = 10; // domande della verifica
  function showVerifIntro(w, m) {
    setTop(`${m.icon} ${t('Verifica', 'Test')}: ${m.title}`, () => showWorld(w));
    const s = screen();
    s.append(el('div', { class: 'intro' },
      el('h1', { style: 'margin-top:0' }, t('🏆 Verifica finale', '🏆 Final test')),
      el('p', { style: 'font-size:20px;text-align:center' }, t(`Modulo «${m.title}»: ${VN} domande su tutti i livelli del modulo.`, `Module “${m.title}”: ${VN} questions covering every level in the module.`)),
      el('div', { class: 'how', html: t('📝 Durante la verifica non ci sono aiuti: rispondi con calma. <br>✏️ Tieni pronto il quaderno: i calcoli falli a mano, in colonna, e scrivi qui solo il risultato. <br>Alla fine vedrai il risultato e la spiegazione di ogni errore.', '📝 There are no hints during the test: take your time. <br>✏️ Keep your exercise book ready: do the calculations by hand, in columns, and type just the answer here. <br>At the end you will see your result and an explanation of every mistake.') }),
      el('div', { class: 'row' }, el('button', { class: 'btn ok', type: 'button', onclick: () => playVerif(w, m) }, t('Inizia la verifica ▶', 'Start the test ▶')))));
  }
  function playVerif(w, m) {
    const qs = [], seen = new Set();
    const order = [];
    // ogni livello almeno una volta (se ce ne sono abbastanza), il resto a caso
    const lv = m.levels.slice().sort(() => Math.random() - 0.5);
    for (let i = 0; i < VN; i++) order.push(lv[i % lv.length]);
    for (const l of order) {
      let q, g = 0;
      do { q = l.gen(); g++; } while (seen.has(q.t + (q.v || '').length) && g < 30);
      seen.add(q.t + (q.v || '').length);
      q._lid = l.id; q._theory = l.theory; q._ltitle = l.title;
      qs.push(q);
    }
    cur = { w, m, l: { id: 'verifica', title: t('Verifica: ', 'Test: ') + m.title, theory: '' }, qs, i: 0, res: [], coins: 0, verif: true, wrong: [] };
    nextQ();
  }

  /* ---------------- livello: spiegazione e gioco ---------------- */
  function showIntro(w, m, l) {
    setTop(`${m.icon} ${l.title}`, () => showWorld(w));
    const s = screen();
    const ex = l.gen();
    const card = el('div', { class: 'intro' },
      el('h1', { style: 'margin-top:0' }, l.title),
      el('div', { class: 'how', html: t('💡 <b>Come si fa</b><br>', '💡 <b>How to do it</b><br>') + l.theory }),
      el('div', { class: 'note' }, t('Un esempio:', 'An example:')),
      el('div', { class: 'qtext', style: 'text-align:center;font-size:22px', html: ex.t }),
      ex.v ? el('div', { class: 'qvis', html: ex.v }) : null,
      ex.calcHide ? null : columnView(ex.calc),
      calcOf(ex) && !ex.calcHide ? handNote(!!columnView(ex.calc)) : null,
      calcOf(ex) ? stepsButton(calcOf(ex), t('👣 Guarda come si fa, passo per passo', '👣 See how it\'s done, step by step')) : null,
      el('p', { class: 'note' }, t(`Rispondi a ${QN} domande. Tieni vicino il quaderno: i calcoli si fanno a mano e nel gioco si scrive solo il risultato. Se sbagli ti spiego come si fa.`, `Answer ${QN} questions. Keep your exercise book handy: you do the calculations by hand and only type the answer in the game. If you make a mistake, I'll show you how to do it.`)),
      el('div', { class: 'row' }, el('button', { class: 'btn ok', type: 'button', onclick: () => play(w, m, l) }, t('Gioca! ▶', 'Play! ▶'))));
    deco(card);
    s.append(card);
  }

  let cur = null; // partita in corso
  // chiave di una domanda (per non ripetere le stesse quando si rigioca)
  const qkey = q => q.t + '|' + (q.v || '').length + '|' + (q.o || []).join(',');
  function play(w, m, l) {
    const p = me();
    p.recent = p.recent || {};
    const rk = lkey(w.n, m.id, l.id);
    const recent = new Set(p.recent[rk] || []);
    const qs = [], seen = new Set();
    // domande sempre nuove: si scartano quelle delle partite precedenti (finché è possibile)
    for (let g = 0; qs.length < QN && g < 400; g++) {
      const q = l.gen(), k = qkey(q);
      if (seen.has(k) && g < 300) continue;
      if (recent.has(k) && g < 250) continue;
      seen.add(k); qs.push(q);
    }
    p.recent[rk] = [...(p.recent[rk] || []), ...qs.map(qkey)].slice(-60);
    save();
    // i minigiochi cambiano a ogni partita: si parte da un punto diverso della rotazione
    p.spin = ((p.spin || 0) + 1) % 997;
    qs.forEach((q, i) => { q._style = (p.spin + i) % 3; if (q.k === 'num' && Number.isInteger(q.a) && (p.spin + i) % 3 === 2) toChoice(q); });
    cur = { w, m, l, qs, i: 0, res: [], coins: 0 };
    nextQ();
  }
  // una domanda numerica diventa a scelta (minigioco diverso), con risposte vicine come distrattori
  function toChoice(q) {
    const a = q.a, opts = new Set([a]);
    const spread = Math.max(2, Math.round(Math.abs(a) * 0.15));
    let g = 0;
    while (opts.size < 4 && g++ < 60) { const d = Math.floor(Math.random() * (2 * spread + 1)) - spread; const v = a + (d || 1); if (v >= 0 || a < 0) opts.add(v); }
    if (a % 10 === 0 && a >= 10) opts.add(a + 1);
    const arr = [...opts].slice(0, 4).sort(() => Math.random() - 0.5);
    q.k = 'choice'; q.o = arr.map(v => M.unitFmt(M.F(v), q.unit && q.unit.length <= 3 ? q.unit : '')); q.a = arr.indexOf(a); q._fromNum = true;
  }
  function progressBar() {
    const b = el('div', { class: 'progress' });
    for (let i = 0; i < cur.qs.length; i++) b.append(el('i', { class: i < cur.res.length ? (cur.res[i] ? 'ok' : 'no') : i === cur.i ? 'cur' : '' }));
    return b;
  }
  function nextQ() {
    if (cur.i >= cur.qs.length) return finish();
    const { w, m, l } = cur, q = cur.qs[cur.i];
    setTop(`${m.icon} ${l.title}`, () => showWorld(w));
    const s = screen();
    const game = el('div', { class: 'game' });
    game.append(progressBar());
    const card = el('div', { class: 'qcard' });
    const st = q._style || 0;
    const kind = q.k === 'choice' ? ['palloncini', 'pesci', 'carte'][st] : q.k === 'cmp' ? 'coccodrillo' : 'forziere';
    card.append(el('div', { class: 'mg-title' }, (EN ? { palloncini: '🎈 Pop the right balloon', pesci: '🎣 Catch the right fish', carte: '🃏 Turn over the right card', coccodrillo: '🐊 Help the crocodile', forziere: '🧰 Open the treasure chest with the right answer' } : { palloncini: '🎈 Scoppia il palloncino giusto', pesci: '🎣 Pesca il pesce giusto', carte: '🃏 Gira la carta giusta', coccodrillo: '🐊 Aiuta il coccodrillo', forziere: '🧰 Apri il forziere con la risposta giusta' })[kind]));
    card.append(el('div', { class: 'qtext', html: q.t }));
    if (q.v) card.append(el('div', { class: 'qvis', html: q.v }));
    if (!q.calcHide) { const cv = columnView(q.calc); if (cv) card.append(cv); if (calcOf(q)) card.append(handNote(!!cv)); }
    const area = el('div', {});
    card.append(area);
    game.append(card);
    s.append(game);
    if (q.k === 'choice') balloons(area, q, kind);
    else if (q.k === 'cmp') crocs(area, q);
    else chest(area, q);
    if (q.plain) return; // coding: niente colori delle cifre, qui i numeri sono comandi e valori
    deco(card);
    // legenda dei colori delle cifre
    const txt = card.querySelector('.qtext').textContent + ' ' + (q.o || []).join(' ');
    const decRe = EN ? /\d\.\d/ : /\d,\d/, thRe = EN ? /\d,\d{3}|\d{4}/ : /\d\.\d{3}|\d{4}/;
    if (card._big || decRe.test(txt)) card.insertBefore(legend(decRe.test(txt) || (q.k === 'num' && !Number.isInteger(q.a)), thRe.test(txt) || (q.k === 'num' && Math.abs(q.a) >= 1000)), card.querySelector('.qtext').nextSibling);
  }

  // palloncini: si tocca quello con la risposta giusta
  // tre minigiochi a scelta: palloncini, pesci che nuotano, carte da girare
  function balloons(area, q, kind = 'palloncini') {
    const wrap = el('div', { class: 'balloons mg-' + kind });
    q.o.forEach((o, i) => {
      const b = el('button', { class: 'balloon', type: 'button', 'aria-label': o, onclick: () => { if (cur.locked) return; b.classList.add(kind === 'carte' ? 'flip' : 'pop'); answer(q, i, () => wrap.querySelectorAll('.balloon').forEach((x, j) => { if (j === q.a) x.classList.add('good'); })); } },
        el('div', { class: 'b', style: `background:${BALLOON_COL[i % BALLOON_COL.length]}` }, /\d/.test(o) ? el('span', { class: 'lab' }, o) : o), kind === 'palloncini' ? el('div', { class: 's' }) : null);
      wrap.append(b);
    });
    area.append(wrap);
    cur.keyHandler = e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= q.o.length) wrap.children[n - 1].click(); };
  }
  // coccodrillo: <, >, =
  function crocs(area, q) {
    const wrap = el('div', { class: 'crocs' });
    for (const [sym, lab] of [['<', t('minore', 'less than')], ['=', t('uguale', 'equal to')], ['>', t('maggiore', 'greater than')]]) wrap.append(el('button', { class: 'croc', type: 'button', 'aria-label': lab, onclick: () => { if (!cur.locked) answer(q, sym); } }, el('div', {}, sym, el('small', {}, lab))));
    area.append(wrap);
    cur.keyHandler = e => { if (['<', '>', '='].includes(e.key)) answer(q, e.key); };
  }
  // forziere: uno o più campi numerici con il tastierino
  function chest(area, q) {
    const fields = q.k === 'multi' ? q.f.map(f => f.l) : [null];
    const vals = fields.map(() => '');
    let focus = 0;
    const boxes = [];
    const row = el('div', { class: 'answer-row' });
    const mkBox = i => { const b = el('div', { class: 'ansbox', role: 'textbox', 'aria-label': fields[i] || t('risposta', 'answer'), onclick: () => { focus = i; paint(); } }); boxes[i] = b; return b; };
    if (q.fr) {
      row.append(el('div', { class: 'frac' }, el('div', { class: 'anslbl' }, fields[0]), mkBox(0), el('div', { class: 'bar' }), mkBox(1), el('div', { class: 'anslbl' }, fields[1])));
    } else {
      fields.forEach((f, i) => row.append(el('div', {}, f ? el('div', { class: 'anslbl' }, f) : null, mkBox(i))));
      if (q.unit) { const u = el('div', { class: 'unit' }, q.unit); if (M.unitBefore(q.unit)) row.prepend(u); else row.append(u); }
    }
    const paint = () => boxes.forEach((b, i) => { b.textContent = ''; const v = vals[i]; if (/\d\d/.test(v) || v.includes(DP)) { const neg = v.startsWith('-'); if (neg) b.append('−'); b.append(numSpan(v.replace('-', ''))); } else b.textContent = v || ' '; b.classList.toggle('focus', i === focus && !cur.locked); });
    const press = k => {
      if (cur.locked) return;
      if (k === 'ok') { if (vals.some(v => !v)) { toast(vals.length > 1 ? t('Completa tutte le caselle', 'Fill in all the boxes') : t('Scrivi la risposta', 'Type your answer')); return; } submit(); return; }
      if (k === 'del') vals[focus] = vals[focus].slice(0, -1);
      else if (k === '±') vals[focus] = vals[focus].startsWith('-') ? vals[focus].slice(1) : '-' + vals[focus];
      else if (k === 'dp') { if (!vals[focus].includes(DP)) vals[focus] = (vals[focus] || '0') + DP; }
      else if (vals[focus].replace(/[-,.]/g, '').length < 9) { vals[focus] += k; if (q.fr === undefined && fields.length > 1 && false) focus++; }
      beep('tap'); paint();
    };
    const submit = () => {
      const given = q.k === 'multi' ? vals.slice() : vals[0];
      answer(q, given, ok => { boxes.forEach((b, i) => b.classList.add(ok ? 'ok' : 'no')); });
    };
    const lid = q._lid || cur.l.id;
    const needNeg = q.k === 'num' && q.a < 0 || /relativi|negative/.test(lid);
    const needDec = q.k === 'num' && !Number.isInteger(q.a) || /dec|cerchio|x10|equiv|lung|massa|capac|perc|frdec|lordo|superf/.test(lid);
    const pad = el('div', { class: 'keypad' });
    for (const k of ['7', '8', '9', '4', '5', '6', '1', '2', '3']) pad.append(el('button', { type: 'button', onclick: () => press(k) }, k));
    pad.append(el('button', { type: 'button', class: 'k-del', 'aria-label': t('Cancella', 'Delete'), onclick: () => press('del') }, '⌫'));
    pad.append(el('button', { type: 'button', onclick: () => press('0') }, '0'));
    pad.append(needDec ? el('button', { type: 'button', 'aria-label': t('virgola', 'decimal point'), onclick: () => press('dp') }, DP) : needNeg ? el('button', { type: 'button', 'aria-label': t('più o meno', 'plus or minus'), onclick: () => press('±') }, '±') : el('button', { type: 'button', class: 'k-ok', 'aria-label': t('Conferma', 'Confirm'), onclick: () => press('ok') }, '✔'));
    if (needDec && needNeg) pad.append(el('button', { type: 'button', onclick: () => press('±') }, '±'));
    if (needDec || needNeg) pad.append(el('button', { type: 'button', class: 'k-ok', style: 'grid-column: span ' + (needDec && needNeg ? 2 : 3), onclick: () => press('ok') }, t('✔ Apri il forziere', '✔ Open the chest')));
    area.append(el('div', { class: 'chest' }, row, pad));
    paint();
    cur.keyHandler = e => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === DP || (!EN && e.key === '.')) press('dp');
      else if (e.key === '-') press('±');
      else if (e.key === 'Backspace') { e.preventDefault(); press('del'); }
      else if (e.key === 'Enter') press('ok');
      else if (e.key === 'Tab' && fields.length > 1) { e.preventDefault(); focus = (focus + (e.shiftKey ? fields.length - 1 : 1)) % fields.length; paint(); }
      else if ((e.key === 'ArrowDown' || e.key === 'ArrowRight') && fields.length > 1) { focus = Math.min(fields.length - 1, focus + 1); paint(); }
      else if ((e.key === 'ArrowUp' || e.key === 'ArrowLeft') && fields.length > 1) { focus = Math.max(0, focus - 1); paint(); }
    };
  }

  // risposta: giusta → festa e avanti; sbagliata → spiegazione
  function answer(q, given, mark) {
    if (cur.locked) return;
    cur.locked = true; cur.keyHandler = null;
    const ok = M.check(q, given);
    if (mark) mark(ok);
    cur.res.push(ok);
    if (ok) cur.coins++;
    beep(ok ? 'ok' : 'no');
    const card = document.querySelector('.qcard');
    const fb = el('div', { class: 'feedback ' + (ok ? 'ok' : 'no') });
    const next = () => { cur.i++; cur.locked = false; nextQ(); };
    if (cur.verif) {
      // in verifica niente aiuti: le spiegazioni arrivano alla fine
      if (!ok) cur.wrong.push({ q, given });
      fb.append(el('div', { class: 'fh' }, ok ? t('Risposta giusta ✔', 'Correct ✔') : t('Risposta sbagliata ✘', 'Wrong ✘')), el('div', { class: 'note', style: 'text-align:left' }, t('La spiegazione la vedrai alla fine della verifica.', 'You will see the explanation at the end of the test.')));
      fb.append(el('div', { class: 'row' }, el('button', { class: 'btn', type: 'button', onclick: next }, cur.i + 1 < cur.qs.length ? t('Prossima domanda ▶', 'Next question ▶') : t('Vedi il risultato ▶', 'See your result ▶'))));
    } else if (ok) {
      fb.append(el('div', { class: 'fh' }, (EN ? ['Brilliant! 🎉', 'Exactly! ⭐', 'Correct! 👏', 'Perfect! 🚀'] : ['Bravissimo! 🎉', 'Esatto! ⭐', 'Giusto! 👏', 'Perfetto! 🚀'])[Math.floor(Math.random() * 4)]), el('div', { html: q.x || '' }));
      if (calcOf(q)) fb.append(stepsButton(calcOf(q), t('👣 Rivedi i passaggi', '👣 Go over the steps')));
      fb.append(el('div', { class: 'row' }, el('button', { class: 'btn ok', type: 'button', onclick: next }, t('Avanti ▶', 'Next ▶'))));
    } else {
      fb.append(el('div', { class: 'fh' }, t('Quasi! Vediamo insieme 🤔', 'Nearly! Let\'s look at it together 🤔')));
      fb.append(el('div', {}, t('La risposta giusta è ', 'The right answer is '), el('span', { class: 'ans' }, M.answerText(q)), '.'));
      fb.append(el('div', { style: 'margin-top:6px', html: t('<b>Perché:</b> ', '<b>Why:</b> ') + (q.x || '') }));
      fb.append(el('div', { class: 'how', html: '💡 ' + cur.l.theory }));
      if (calcOf(q)) { const v = stepsViewer(calcOf(q)); if (v) { fb.append(v); stepsOpen = v; } }
      fb.append(el('div', { class: 'row' }, el('button', { class: 'btn', type: 'button', onclick: next }, t('Ho capito, avanti ▶', 'Got it, next ▶'))));
    }
    deco(fb);
    card.append(fb);
    fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    cur.keyHandler = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } };
    setTimeout(() => { const b = fb.querySelector('button'); if (b) b.focus({ preventScroll: true }); }, 30);
  }

  function finish() {
    if (cur.verif) return finishVerif();
    const { w, m, l } = cur;
    const right = cur.res.filter(Boolean).length, n = cur.res.length;
    const stars = right === n ? 3 : right >= Math.ceil(n * 0.75) ? 2 : right >= Math.ceil(n / 2) ? 1 : 0;
    const p = me();
    const k = lkey(w.n, m.id, l.id);
    const prev = starsOf(p, k);
    if (stars > prev) p.stars[k] = stars;
    p.coins += cur.coins;
    save();
    setTop(`${m.icon} ${l.title}`, () => showWorld(w));
    const s = screen();
    const idx = m.levels.indexOf(l), nxt = m.levels[idx + 1];
    const box = el('div', { class: 'result' },
      el('div', { class: 'bigstars', html: [0, 1, 2].map(i => i < stars ? '<b>★</b>' : '★').join('') }),
      el('h1', {}, stars === 3 ? t('Fantastico!', 'Fantastic!') : stars === 2 ? t('Molto bene!', 'Very good!') : stars === 1 ? t('Bene, livello superato!', 'Well done, level passed!') : t('Ci riproviamo?', 'Shall we try again?')),
      el('p', { style: 'font-size:20px' }, t(`Hai risposto giusto a ${right} domande su ${n}.`, `You got ${right} out of ${n} questions right.`)),
      el('p', { style: 'font-size:20px' }, t(`Hai guadagnato 🪙 ${cur.coins} monete.`, `You earned 🪙 ${cur.coins} coin${cur.coins === 1 ? '' : 's'}.`)),
      stars === 0 ? el('p', { class: 'note' }, t('Per sbloccare il livello successivo servono almeno metà risposte giuste. Rileggi «Come si fa» e riprova!', 'To unlock the next level you need at least half of the answers right. Read “How to do it” again and have another go!')) : null,
      factCard(m.id),
      el('div', { class: 'row' },
        el('button', { class: 'btn alt', type: 'button', onclick: () => showWorld(w) }, t('🗺️ Mappa', '🗺️ Map')),
        el('button', { class: 'btn alt', type: 'button', onclick: () => play(w, m, l) }, t('🔁 Rigioca', '🔁 Play again')),
        nxt && (stars > 0 || D.teacher) ? el('button', { class: 'btn ok', type: 'button', onclick: () => showIntro(w, m, nxt) }, t('Livello successivo ▶', 'Next level ▶')) : null));
    s.append(box);
    if (stars > 0) { beep('win'); confetti(); }
  }
  function finishVerif() {
    const { w, m } = cur;
    const right = cur.res.filter(Boolean).length, n = cur.res.length, pct = Math.round(right * 100 / n);
    const g = GIUDIZI(pct);
    const p = me();
    p.verif = p.verif || {};
    const k = lkey(w.n, m.id, 'verifica');
    if (p.verif[k] === undefined || pct > p.verif[k]) p.verif[k] = pct;
    p.coins += cur.coins + (pct >= 90 ? 5 : 0);
    save();
    setTop(`${m.icon} ${t('Verifica', 'Test')}: ${m.title}`, () => showWorld(w));
    const s = screen();
    const box = el('div', { class: 'result' },
      el('div', { style: 'font-size:64px' }, pct >= 90 ? '🏆' : pct >= 60 ? '🎖️' : '💪'),
      el('h1', {}, t(`Verifica: ${right} su ${n}`, `Test: ${right} out of ${n}`)),
      el('div', { class: 'giudizio', style: `background:${g.col}` }, g.text),
      el('p', { style: 'font-size:18px' }, t(`Hai guadagnato 🪙 ${cur.coins + (pct >= 90 ? 5 : 0)} monete${pct >= 90 ? ' (5 di premio!)' : ''}.`, `You earned 🪙 ${cur.coins + (pct >= 90 ? 5 : 0)} coin${cur.coins + (pct >= 90 ? 5 : 0) === 1 ? '' : 's'}${pct >= 90 ? ' (including a 5-coin bonus!)' : ''}.`)));
    if (cur.wrong.length) {
      const list = el('div', { class: 'review' }, el('h2', { style: 'margin:6px 0 8px' }, t('Rivediamo gli errori', 'Let\'s go over the mistakes')));
      for (const { q, given } of cur.wrong) {
        const g2 = Array.isArray(given) ? given.join(' / ') : q.k === 'choice' ? q.o[given] : String(given);
        list.append(el('div', { class: 'rv' },
          el('div', { class: 'rv-l' }, q._ltitle || ''),
          el('div', { class: 'rv-q', html: q.t }),
          q.v ? el('div', { class: 'qvis', html: q.v }) : null,
          q.calcHide ? null : columnView(q.calc),
          el('div', {}, t('Hai risposto ', 'You answered '), el('span', { class: 'ans no' }, g2 || '—'), t(' · giusta: ', ' · right answer: '), el('span', { class: 'ans' }, M.answerText(q))),
          el('div', { style: 'margin-top:4px', html: t('<b>Perché:</b> ', '<b>Why:</b> ') + (q.x || '') }),
          el('div', { class: 'how', html: '💡 ' + (q._theory || '') }),
          calcOf(q) ? stepsButton(calcOf(q)) : null));
      }
      box.append(list);
    } else box.append(el('p', { style: 'font-size:20px' }, t('Nessun errore: complimenti! 🎉', 'No mistakes: well done! 🎉')));
    box.append(factCard(m.id));
    box.append(el('div', { class: 'row' },
      el('button', { class: 'btn alt', type: 'button', onclick: () => showWorld(w) }, t('🗺️ Mappa', '🗺️ Map')),
      el('button', { class: 'btn', type: 'button', onclick: () => playVerif(w, m) }, t('🔁 Rifai la verifica', '🔁 Take the test again'))));
    deco(box);
    s.append(box);
    if (pct >= 60) { beep('win'); confetti(); }
  }
  // «Lo sai che…?» tra un livello e l'altro (senza ripetere quelle già viste dal giocatore)
  function factCard(modId) {
    if (!window.Facts) return null;
    const p = me();
    p.seenFacts = p.seenFacts || [];
    const f = window.Facts.pickFact(modId, p.seenFacts);
    p.seenFacts.push(f.i);
    if (p.seenFacts.length >= window.Facts.FACTS.length) p.seenFacts = [f.i];
    save();
    return el('div', { class: 'fact' }, el('div', { class: 'fi' }, f.icon), el('div', {}, el('div', { class: 'ft' }, t('Lo sai che…?', 'Did you know…?')), el('div', { class: 'fx' }, f.text)));
  }
  function confetti() {
    const c = el('div', { class: 'confetti' });
    for (let i = 0; i < 70; i++) c.append(el('i', { style: `left:${Math.random() * 100}%;background:${BALLOON_COL[i % 6]};animation-delay:${Math.random() * 0.8}s;animation-duration:${1.6 + Math.random() * 1.4}s` }));
    document.body.append(c); setTimeout(() => c.remove(), 3500);
  }

  /* ---------------- impostazioni (per l'insegnante) ---------------- */
  function settings() {
    const chk = el('input', { type: 'checkbox' }); chk.checked = D.teacher;
    const m = modal([el('h2', { style: 'margin-top:0' }, t('Impostazioni', 'Settings')),
      el('label', { style: 'display:flex;gap:10px;align-items:center;font-size:18px;font-weight:700' }, chk, t('Modalità insegnante: tutti i livelli sbloccati', 'Teacher mode: all levels unlocked')),
      el('p', { class: 'note', style: 'text-align:left' }, t('Utile per scegliere subito l\'argomento della lezione alla LIM o per ripassare.', 'Useful for going straight to the topic of the lesson on the interactive whiteboard, or for revision.')),
      el('div', { class: 'row', style: 'justify-content:flex-start' }, el('button', { class: 'btn alt', type: 'button', id: 'tchOpen', onclick: () => { m.remove(); showTeacher(); } }, t('📊 Progressi della classe', '📊 Class progress'))),
      transferBox(),
      el('p', { class: 'note', style: 'text-align:left' }, t('Il gioco non raccoglie dati: niente account, pubblicità o statistiche. ', 'The game collects no data: no accounts, ads or analytics. '),
        el('a', { class: 'priv-link', id: 'privLink', href: (window.PWA ? '' : 'https://rayuk-creator.github.io/matematic/') + 'privacy.html' + t('', '#en'), target: '_blank', rel: 'noopener' }, t('🔒 Leggi la privacy', '🔒 Read the privacy policy'))),
      el('div', { class: 'row' }, el('button', { class: 'btn', type: 'button', onclick: () => { D.teacher = chk.checked; save(); m.remove(); if (me()) showWorlds(); } }, t('Fatto', 'Done')))]);
  }

  /* ---------------- trasferimento dei progressi su un altro dispositivo ----------------
     Un file di testo con i giocatori delle due lingue: non passa da internet se non lo decide chi lo manda.
     Il caricamento unisce e non cancella mai: per ogni livello si tiene il risultato migliore. */
  const BACKUP_APP = 'matematica-in-gioco', BACKUP_VERSION = 1;
  const LEVEL_KEY = /^[1-5]\/[\w-]+\/[\w-]+$/;
  function readSave(lang) {
    if (lang === MY_LANG) return D;
    try { const s = JSON.parse(localStorage.getItem(KEYS[lang]) || 'null'); return s && Array.isArray(s.players) ? s : null; } catch (e) { return null; }
  }
  // tiene solo i dati validi di un giocatore (i file possono arrivare da fuori)
  function cleanPlayer(x) {
    if (!x || typeof x !== 'object' || typeof x.id !== 'string' || !/^[\w-]{1,40}$/.test(x.id) || typeof x.name !== 'string' || !x.name.trim()) return null;
    const scores = (o, max) => {
      const r = {};
      if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (LEVEL_KEY.test(k) && Number.isInteger(v) && v >= 0 && v <= max) r[k] = v;
      return r;
    };
    const guideSeen = {};
    for (const n of [1, 2, 3, 4, 5]) if (x.guideSeen && typeof x.guideSeen === 'object' && x.guideSeen[n] === true) guideSeen[n] = true;
    return {
      id: x.id, name: x.name.trim().slice(0, 16),
      avatar: typeof x.avatar === 'string' && x.avatar.length > 0 && x.avatar.length <= 8 ? x.avatar : AVATARS[0],
      coins: Number.isSafeInteger(x.coins) && x.coins >= 0 ? x.coins : 0,
      stars: scores(x.stars, 3), verif: scores(x.verif, 100), guideSeen,
      seenFacts: Array.isArray(x.seenFacts) ? [...new Set(x.seenFacts.filter(v => Number.isInteger(v) && v >= 0))] : []
    };
  }
  // unisce senza perdere niente: i giocatori nuovi si aggiungono, quelli già presenti tengono il risultato migliore
  function mergePlayers(base, incoming) {
    const out = base.map(p => ({ ...p }));
    const best = (a, b) => { const r = { ...(a || {}) }; for (const [k, v] of Object.entries(b)) if (!(r[k] >= v)) r[k] = v; return r; };
    for (const x of incoming) {
      const p = out.find(o => o.id === x.id);
      if (!p) { out.push(x); continue; }
      p.coins = Math.max(p.coins || 0, x.coins);
      p.stars = best(p.stars, x.stars); p.verif = best(p.verif, x.verif);
      p.guideSeen = { ...(p.guideSeen || {}), ...x.guideSeen };
      p.seenFacts = [...new Set([...(p.seenFacts || []), ...x.seenFacts])];
    }
    return out;
  }
  function makeBackup() {
    const saves = {};
    for (const lang of Object.keys(KEYS)) {
      const s = readSave(lang), players = s ? s.players.map(cleanPlayer).filter(Boolean) : [];
      if (players.length) saves[lang] = { players };
    }
    if (!Object.keys(saves).length) return null;
    const now = new Date(), pad = n => String(n).padStart(2, '0');
    const name = `${t('matematica-progressi', 'maths-progress')}-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.txt`;
    // .txt e non .json: su tablet e telefoni si può inviare e aprire senza problemi
    const text = JSON.stringify({ app: BACKUP_APP, version: BACKUP_VERSION, info: 'Matematica in gioco / Maths at Play: file dei progressi, da non modificare / progress file, do not edit.', saved: now.toISOString(), saves });
    return new File([text], name, { type: 'text/plain' });
  }
  // legge il file: restituisce i dati, oppure il motivo per cui non va bene
  function readBackup(text) {
    let o;
    try { o = JSON.parse(text.replace(/^\uFEFF/, '').trim()); } catch (e) { o = null; }
    if (!o || o.app !== BACKUP_APP || !o.saves || typeof o.saves !== 'object') return { error: t('Questo non è un file dei progressi del gioco.', 'This is not a progress file from this game.') };
    if (!Number.isInteger(o.version) || o.version < 1) return { error: t('Questo non è un file dei progressi del gioco.', 'This is not a progress file from this game.') };
    if (o.version > BACKUP_VERSION) return { error: t('Questo file viene da una versione più nuova del gioco: aggiorna il gioco e riprova.', 'This file comes from a newer version of the game: update the game and try again.') };
    const saves = {};
    for (const lang of Object.keys(KEYS)) {
      const s = o.saves[lang], seen = new Set();
      const players = s && Array.isArray(s.players) ? s.players.map(cleanPlayer).filter(p => p && !seen.has(p.id) && seen.add(p.id)) : [];
      if (players.length) saves[lang] = { players };
    }
    if (!Object.keys(saves).length) return { error: t('In questo file non ci sono giocatori.', 'There are no players in this file.') };
    return { saves, saved: new Date(o.saved) };
  }
  // scrive tutto e solo se ci riesce aggiorna il gioco; se non riesce restituisce false
  function applyBackup(saves) {
    const mine = {};
    try {
      for (const lang of Object.keys(saves)) {
        const s = readSave(lang) || { players: [], cur: null, teacher: false, sound: true };
        const players = mergePlayers(s.players, saves[lang].players);
        localStorage.setItem(KEYS[lang], JSON.stringify({ ...s, players }));
        if (lang === MY_LANG) mine.players = players;
      }
    } catch (e) { return false; }
    if (mine.players) D.players = mine.players;
    return true;
  }
  function confirmImport(b, close) {
    const line = p => {
      let tot = 0; for (const v of Object.values(p.stars)) tot += v;
      return el('div', { class: 'xfer-p' }, el('span', { class: 'xfer-n' }, p.avatar + ' ' + p.name), el('span', { class: 'xfer-s' }, `⭐ ${tot}  ·  🪙 ${p.coins}`));
    };
    const langs = Object.keys(b.saves);
    const m = modal([el('h2', { style: 'margin-top:0' }, t('Caricare questi progressi?', 'Load this progress?')),
      isNaN(b.saved) ? null : el('p', { class: 'note', style: 'text-align:left' }, t('File salvato il ', 'File saved on ') + b.saved.toLocaleDateString(t('it-IT', 'en-GB')) + '.'),
      ...langs.flatMap(lang => [
        el('div', { class: 'xfer-h' }, lang === 'it' ? t('Versione italiana', 'Italian version') : t('Versione inglese', 'English version')),
        ...b.saves[lang].players.map(line)]),
      el('p', { class: 'note', style: 'text-align:left' }, t('Non si cancella niente: i giocatori già presenti su questo dispositivo restano e, se un giocatore c\'è già, per ogni livello si tiene il risultato migliore.', 'Nothing gets deleted: players already on this device stay and, if a player is already here, the best result for each level is kept.')),
      el('div', { class: 'row' }, el('button', { class: 'btn alt', type: 'button', onclick: () => m.remove() }, t('Annulla', 'Cancel')),
        el('button', { class: 'btn ok', type: 'button', onclick: () => {
          if (!applyBackup(b.saves)) { m.remove(); return close(t('Non riesco a salvare su questo dispositivo: controlla che il browser non sia in modalità privata e riprova.', 'I can\'t save on this device: check that the browser isn\'t in private mode and try again.'), true); }
          m.remove(); document.querySelectorAll('.modal').forEach(x => x.remove());
          showPlayers(); beep('win');
          toast(b.saves[MY_LANG] ? t('Progressi caricati!', 'Progress loaded!') : t('Progressi caricati: li trovi nella versione inglese del gioco.', 'Progress loaded: you\'ll find it in the Italian version of the game.'));
        } }, t('Carica', 'Load')))]);
  }
  // il riquadro dentro le Impostazioni
  function transferBox() {
    const status = el('p', { class: 'xfer-msg', role: 'status', hidden: true });
    const say = (text, bad) => { status.textContent = text; status.hidden = false; status.classList.toggle('bad', !!bad); };
    const SENT = t('Ora porta il file sull\'altro dispositivo e lì scegli «Carica da un file».', 'Now take the file to the other device and choose “Load from a file” there.');
    const EMPTY = t('Non ci sono ancora progressi da salvare.', 'There is no progress to save yet.');
    const download = () => {
      const f = makeBackup();
      if (!f) return say(EMPTY);
      const url = URL.createObjectURL(f), a = el('a', { href: url, download: f.name, style: 'display:none' });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      say(t('File «', 'File “') + f.name + t('» salvato, di solito nella cartella Download. ', '” saved, usually in the Downloads folder. ') + SENT);
    };
    const share = async () => {
      const f = makeBackup();
      if (!f) return say(EMPTY);
      try { await navigator.share({ files: [f], title: f.name }); say(SENT); }
      catch (e) { if (e && e.name !== 'AbortError') download(); }
    };
    let canShare = false;
    try { canShare = !!navigator.canShare && navigator.canShare({ files: [new File(['x'], 'x.txt', { type: 'text/plain' })] }); } catch (e) { /* non disponibile */ }
    // nessun filtro sul tipo di file: alcuni tablet renderebbero il file non selezionabile; il controllo si fa dopo, sul contenuto
    const input = el('input', { type: 'file', style: 'display:none', 'aria-hidden': 'true', onchange: () => {
      const f = input.files && input.files[0];
      input.value = '';
      if (!f) return;
      const bad = t('Non riesco a leggere questo file.', 'I can\'t read this file.');
      if (f.size > 5e6) return say(t('Questo non è un file dei progressi del gioco.', 'This is not a progress file from this game.'), true);
      const r = new FileReader();
      r.onerror = () => say(bad, true);
      r.onload = () => { const b = readBackup(String(r.result)); if (b.error) say(b.error, true); else { status.hidden = true; confirmImport(b, say); } };
      r.readAsText(f);
    } });
    return el('div', { class: 'xfer' }, el('div', { class: 'xfer-t' }, t('Passare a un altro tablet o computer', 'Moving to another tablet or computer')),
      el('p', { class: 'note', style: 'text-align:left' }, t('Salva i progressi in un file, mandalo sull\'altro dispositivo (per esempio con un\'email) e lì scegli «Carica da un file». Il file contiene i nomi e i risultati dei giocatori: il gioco non lo invia a nessuno da solo.', 'Save your progress in a file, send it to the other device (by email, for example) and choose “Load from a file” there. The file contains the players\' names and results: the game never sends it anywhere by itself.')),
      el('div', { class: 'row' },
        el('button', { class: 'btn alt', type: 'button', id: 'xferSave', onclick: download }, t('💾 Salva in un file', '💾 Save to a file')),
        canShare ? el('button', { class: 'btn alt', type: 'button', id: 'xferShare', onclick: share }, t('📤 Invia il file', '📤 Send the file')) : null,
        el('button', { class: 'btn alt', type: 'button', id: 'xferLoad', onclick: () => input.click() }, t('📂 Carica da un file', '📂 Load from a file'))),
      input, status);
  }

  /* ---------------- pagina per l'insegnante: i progressi di più bambini ----------------
     Mostra i giocatori di questo dispositivo e quelli dei file dei progressi che l'insegnante raccoglie.
     L'elenco dei file resta solo qui, a parte: non tocca i giocatori e non passa da internet. */
  const CLASS_KEY = EN ? 'math-class-en-v1' : 'mate-classe-v1';
  let teacherGrade = null;
  function loadClass() {
    try {
      const s = JSON.parse(localStorage.getItem(CLASS_KEY) || 'null');
      if (!s || !Array.isArray(s.players)) return [];
      return s.players.map(x => { const p = cleanPlayer(x); if (p && typeof x.saved === 'string') p.saved = x.saved; return p; }).filter(Boolean);
    } catch (e) { return []; }
  }
  function saveClass(players) {
    try { localStorage.setItem(CLASS_KEY, JSON.stringify({ players })); return true; } catch (e) { return false; }
  }
  const readText = f => new Promise((ok, no) => { const r = new FileReader(); r.onerror = () => no(r.error); r.onload = () => ok(String(r.result)); r.readAsText(f); });
  // aggiunge i file all'elenco: un bambino già presente viene aggiornato, tenendo il risultato migliore
  async function addClassFiles(files) {
    const list = loadClass(), names = new Set(), bad = [], other = [];
    let used = 0;
    for (const f of files) {
      let b = null;
      try { if (f.size <= 5e6) b = readBackup(await readText(f)); } catch (e) { /* illeggibile */ }
      if (!b || b.error) { bad.push(f.name); continue; }
      if (!b.saves[MY_LANG]) { other.push(f.name); continue; }
      used++;
      const saved = isNaN(b.saved) ? null : b.saved.toISOString();
      for (const x of b.saves[MY_LANG].players) {
        const i = list.findIndex(o => o.id === x.id);
        names.add(x.id);
        if (i < 0) { list.push(saved ? { ...x, saved } : x); continue; }
        const last = [list[i].saved, saved].filter(Boolean).sort().pop();
        list[i] = mergePlayers([list[i]], [x])[0];
        if (last) list[i].saved = last;
      }
    }
    const msgs = [];
    if (used && !saveClass(list)) return { text: t('Non riesco a salvare su questo dispositivo: controlla che il browser non sia in modalità privata e riprova.', 'I can\'t save on this device: check that the browser isn\'t in private mode and try again.'), bad: true };
    if (used) msgs.push(t(`File caricati: ${used}. Bambini aggiunti o aggiornati: ${names.size}.`, `Files loaded: ${used}. Children added or updated: ${names.size}.`));
    if (bad.length) msgs.push(t('Non sono file dei progressi: ', 'These are not progress files: ') + bad.join(', ') + '.');
    if (other.length) msgs.push(t('Contengono solo la versione inglese: ', 'These contain only the Italian version: ') + other.join(', ') + '.');
    return { text: msgs.join(' '), bad: bad.length > 0 || other.length > 0 };
  }
  function classRows() {
    const here = D.players.map(cleanPlayer).filter(Boolean), files = loadClass();
    const hereIds = new Set(here.map(p => p.id));
    const byId = new Map(files.map(f => [f.id, f]));
    return mergePlayers(here, files).map(p => ({ p, here: hereIds.has(p.id), file: byId.get(p.id) || null }))
      .sort((a, b) => a.p.name.localeCompare(b.p.name, MY_LANG) || a.p.id.localeCompare(b.p.id));
  }
  const levelsDone = (p, w, m) => m.levels.filter(l => starsOf(p, lkey(w.n, m.id, l.id)) > 0).length;
  const fmtDate = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString(t('it-IT', 'en-GB')); };
  function verifBadge(p, w, m) {
    const v = p.verif[lkey(w.n, m.id, 'verifica')];
    if (v === undefined) return null;
    const g = GIUDIZI(v);
    return el('span', { class: 'tch-v', style: `background:${g.col}` }, g.short);
  }
  function classDetail(p, w) {
    const body = [];
    let done = 0, tot = 0, st = 0;
    for (const m of w.modules) {
      done += levelsDone(p, w, m); tot += m.levels.length;
      const v = p.verif[lkey(w.n, m.id, 'verifica')];
      body.push(el('div', { class: 'tch-dm' }, el('span', {}, `${m.icon} ${m.title}`), v === undefined ? el('span', { class: 'tch-no' }, t('Verifica non fatta', 'Test not taken')) : el('span', { class: 'tch-dv' }, verifBadge(p, w, m), ` ${v}%`)));
      for (const l of m.levels) {
        const n = starsOf(p, lkey(w.n, m.id, l.id)); st += n;
        body.push(el('div', { class: 'tch-dl' + (n ? '' : ' none') }, el('span', {}, l.title), el('span', { class: 'tch-st', 'aria-label': t(`${n} stelle su 3`, `${n} stars out of 3`) }, '★'.repeat(n) + '☆'.repeat(3 - n))));
      }
    }
    const m = modal([el('h2', { style: 'margin-top:0' }, `${p.avatar} ${p.name}`),
      el('p', { class: 'note', style: 'text-align:left' }, t(`Classe ${w.n}ª: livelli superati ${done} su ${tot}, stelle ${st} su ${tot * 3}.`, `Grade ${w.n}: levels passed ${done} out of ${tot}, stars ${st} out of ${tot * 3}.`)),
      ...body,
      el('div', { class: 'row', style: 'margin-top:14px' }, el('button', { class: 'btn', type: 'button', onclick: () => m.remove() }, t('Chiudi', 'Close')))]);
  }
  function confirmRemove(title, text, ok, again) {
    const m = modal([el('h2', { style: 'margin-top:0' }, title), el('p', {}, text),
      el('div', { class: 'row' }, el('button', { class: 'btn alt', type: 'button', onclick: () => m.remove() }, t('No', 'No')),
        el('button', { class: 'btn', style: 'background:#e63946;box-shadow:0 4px 0 #a4161a', type: 'button', onclick: () => { ok(); m.remove(); again(); } }, t('Sì, togli', 'Yes, remove')))]);
  }
  function showTeacher(status) {
    setTop(t('Progressi della classe', 'Class progress'), () => { if (me()) showWorlds(); else showPlayers(); });
    const s = screen();
    const rows = classRows(), files = loadClass();
    // finché l'insegnante non sceglie, si mostra la classe in cui ci sono più stelle
    const score = x => rows.reduce((a, r) => a + worldStars(r.p, x)[0], 0);
    const w = M.worlds.find(x => x.n === teacherGrade) || M.worlds.reduce((best, x) => score(x) > score(best) ? x : best, M.worlds[0]);
    s.append(el('h1', {}, t('Progressi della classe', 'Class progress')));
    const input = el('input', { type: 'file', multiple: true, style: 'display:none', 'aria-hidden': 'true', id: 'tchFiles', onchange: async () => {
      const list = [...input.files];
      input.value = '';
      if (list.length) showTeacher(await addClassFiles(list));
    } });
    s.append(el('p', { class: 'sub' }, t('Ogni bambino salva i progressi in un file da ⚙️ Impostazioni. Tu raccogli i file e li carichi qui: restano solo su questo dispositivo.', 'Each child saves their progress to a file from ⚙️ Settings. You collect the files and load them here: they stay on this device only.')));
    s.append(el('div', { class: 'row' }, el('button', { class: 'btn alt', type: 'button', id: 'tchAdd', onclick: () => input.click() }, t('📂 Aggiungi i file dei bambini', '📂 Add the children\'s files')),
      files.length ? el('button', { class: 'btn alt', type: 'button', id: 'tchClear', onclick: () => confirmRemove(t('Svuotare l\'elenco dei file?', 'Clear the list of files?'), t('Si tolgono da questa pagina i bambini caricati dai file. I giocatori di questo dispositivo restano.', 'The children loaded from files are removed from this page. The players on this device stay.'), () => saveClass([]), () => showTeacher()) }, t('Svuota l\'elenco', 'Clear the list')) : null, input));
    if (status && status.text) s.append(el('p', { class: 'xfer-msg tch-msg' + (status.bad ? ' bad' : ''), role: 'status' }, status.text));
    if (!rows.length) { s.append(el('p', { class: 'note', style: 'margin-top:22px' }, t('Non ci sono ancora bambini da mostrare.', 'There are no children to show yet.'))); return; }
    s.append(el('div', { class: 'tch-tabs', role: 'group', 'aria-label': t('Classe', 'Grade') }, M.worlds.map(x =>
      el('button', { class: 'tch-tab', type: 'button', 'aria-pressed': String(x.n === w.n), onclick: () => { teacherGrade = x.n; showTeacher(); } }, t(`Classe ${x.n}ª`, `Grade ${x.n}`)))));
    const head = el('tr', {}, el('th', { class: 'tch-who', scope: 'col' }, t('Bambino', 'Child')),
      w.modules.map(m => el('th', { scope: 'col' }, el('div', { class: 'tch-ic' }, m.icon), m.title)), el('th', { scope: 'col' }, t('Stelle', 'Stars')));
    const body = el('tbody', {});
    for (const { p, here, file } of rows) {
      const where = here ? t('su questo dispositivo', 'on this device') : t('file del ', 'file from ') + (file.saved ? fmtDate(file.saved) : '—');
      const who = el('th', { class: 'tch-who', scope: 'row' }, el('div', { class: 'tch-whorow' },
        el('button', { class: 'tch-name', type: 'button', title: t('Vedi i dettagli', 'See the details'), onclick: () => classDetail(p, w) }, `${p.avatar} ${p.name}`),
        here ? null : el('button', { class: 'tch-del', type: 'button', 'aria-label': t('Togli ', 'Remove ') + p.name, onclick: () => confirmRemove(t(`Togliere ${p.name} dall'elenco?`, `Remove ${p.name} from the list?`), t('Sparisce solo da questa pagina. Il file e il gioco del bambino non cambiano.', 'It only disappears from this page. The file and the child\'s game do not change.'), () => saveClass(loadClass().filter(x => x.id !== p.id)), () => showTeacher()) }, '✕')),
        el('div', { class: 'tch-where' }, where));
      const tr = el('tr', {}, who);
      for (const m of w.modules) {
        const done = levelsDone(p, w, m), n = m.levels.length;
        tr.append(el('td', {}, el('div', { class: 'tch-c ' + (done === 0 ? 'none' : done === n ? 'all' : 'some') }, `${done}/${n}`), verifBadge(p, w, m)));
      }
      const [st, tot] = worldStars(p, w);
      tr.append(el('td', { class: 'tch-tot' }, `${st}/${tot}`));
      body.append(tr);
    }
    s.append(el('div', { class: 'tch-wrap' }, el('table', { class: 'tch' }, el('thead', {}, head), body)));
    s.append(el('p', { class: 'note', style: 'margin-top:14px' }, t('In ogni casella: livelli superati sul totale e, sotto, il giudizio della verifica finale. Tocca un nome per vedere il dettaglio dei livelli.', 'In each box: levels passed out of the total and, below, the result of the final test. Tap a name to see each level.')));
  }

  document.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input, textarea')) return;
    if (stepsOpen && document.body.contains(stepsOpen) && stepsOpen._key(e)) { e.preventDefault(); return; }
    if (cur && cur.keyHandler && document.querySelector('.qcard')) cur.keyHandler(e);
  });
  if (EN) { document.documentElement.lang = 'en'; $('#tBack').setAttribute('aria-label', 'Back'); $('#tPlayer').title = 'Change player'; $('#tSound').setAttribute('aria-label', 'Sound'); $('#tSet').setAttribute('aria-label', 'Settings'); }
  // la moneta 🪙 è un'emoji recente che su alcuni tablet non si vede: la disegniamo noi
  const COIN = '\u{1FA99}';
  function coinify(node) {
    const tw = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, { acceptNode: n => n.nodeValue.includes(COIN) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
    const list = []; while (tw.nextNode()) list.push(tw.currentNode);
    for (const n of list) {
      const parts = n.nodeValue.split(COIN), frag = document.createDocumentFragment();
      parts.forEach((p, i) => { if (i) frag.append(el('span', { class: 'coin', role: 'img', 'aria-label': t('monete', 'coins') })); if (p) frag.append(p); });
      n.replaceWith(frag);
    }
  }
  new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData' && m.target.nodeValue.includes(COIN)) coinify(m.target.parentNode); for (const a of m.addedNodes) if (a.nodeType === 1 || a.nodeType === 3) coinify(a.nodeType === 3 ? a.parentNode || document.body : a); } }).observe(document.body, { childList: true, subtree: true, characterData: true });
  // app installabile (PWA): solo sul sito, non nei file aperti dal computer
  if (window.PWA && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* senza modalità offline */ });
    let deferred = null;
    const ib = $('#tInstall');
    ib.innerHTML = '📲<span class="lbl"> ' + t('Installa', 'Install') + '</span>'; ib.title = t('Installa il gioco come app', 'Install the game as an app');
    // il pulsante è sempre visibile (tranne quando il gioco è già aperto come app): se Chrome permette
    // l'installazione diretta la avvia, altrimenti spiega come fare su quel dispositivo
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    ib.hidden = standalone;
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; ib.hidden = false; });
    function howTo() {
      const ua = navigator.userAgent;
      const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
      const android = /Android/.test(ua), samsung = /SamsungBrowser/.test(ua), firefox = /Firefox|FxiOS/.test(ua);
      let steps;
      if (ios) steps = [t('Apri questa pagina con <b>Safari</b> (o Chrome).', 'Open this page in <b>Safari</b> (or Chrome).'),
        t('Tocca il pulsante <b>Condividi</b> <span style="font-size:22px">⬆️</span> (in alto o in basso, a seconda del modello).', 'Tap the <b>Share</b> button <span style="font-size:22px">⬆️</span> (at the top or the bottom, depending on the device).'),
        t('Scorri e scegli <b>«Aggiungi a Home»</b>, poi <b>Aggiungi</b>.', 'Scroll down and choose <b>“Add to Home Screen”</b>, then <b>Add</b>.')];
      else if (samsung) steps = [t('Tocca il menu <b>☰</b> in basso.', 'Tap the <b>☰</b> menu at the bottom.'), t('Scegli <b>«Aggiungi pagina a» → «Schermata Home»</b>.', 'Choose <b>“Add page to” → “Home screen”</b>.')];
      else if (android) steps = [t('Apri questa pagina con <b>Chrome</b>.', 'Open this page in <b>Chrome</b>.'), t('Tocca il menu <b>⋮</b> in alto a destra.', 'Tap the <b>⋮</b> menu at the top right.'),
        t('Scegli <b>«Installa app»</b> oppure <b>«Aggiungi a schermata Home» → Installa</b>.', 'Choose <b>“Install app”</b> or <b>“Add to Home screen” → Install</b>.')];
      else if (firefox) steps = [t('Firefox per computer non installa le app web: apri questa pagina con <b>Chrome</b> o <b>Edge</b>.', 'Firefox on computers cannot install web apps: open this page in <b>Chrome</b> or <b>Edge</b>.')];
      else steps = [t('Usa <b>Chrome</b> o <b>Edge</b>.', 'Use <b>Chrome</b> or <b>Edge</b>.'), t('Clicca l\'icona di installazione <b>⊕</b> a destra nella barra degli indirizzi, oppure menu <b>⋮</b> → <b>«Trasmetti, salva e condividi» → «Installa pagina come app»</b>.', 'Click the install icon <b>⊕</b> on the right of the address bar, or menu <b>⋮</b> → <b>“Cast, save and share” → “Install page as app”</b>.')];
      const m = modal([el('h2', { style: 'margin-top:0' }, t('📲 Installa il gioco come app', '📲 Install the game as an app')),
        el('ol', { class: 'inst-steps' }, steps.map(h => el('li', { html: h }))),
        el('p', { class: 'note', style: 'text-align:left' }, t('Poi trovi l\'icona del gioco insieme alle altre app. Funziona anche senza internet e si aggiorna da solo.', 'You will then find the game\'s icon with your other apps. It works offline too and updates itself.')),
        el('div', { class: 'row' }, el('button', { class: 'btn', onclick: () => m.remove() }, t('Ho capito', 'Got it')))]);
    }
    ib.addEventListener('click', async () => { if (!deferred) return howTo(); const d = deferred; deferred = null; d.prompt(); try { const c = await d.userChoice; if (c && c.outcome === 'accepted') ib.hidden = true; } catch (err) { /* annullato */ } });
    window.addEventListener('appinstalled', () => { ib.hidden = true; toast(t('Il gioco è installato: lo trovi tra le tue app!', 'The game is installed: you\'ll find it with your apps!')); });
  }
  $('#tSound').addEventListener('click', () => { D.sound = !D.sound; save(); $('#tSound').textContent = D.sound ? '🔊' : '🔇'; });
  $('#tSet').addEventListener('click', settings);
  $('#tPlayer').addEventListener('click', showPlayers);
  window.__mate = { D, showWorlds, play: (w, m, l) => play(M.worlds[w - 1], M.worlds[w - 1].modules.find(x => x.id === m), M.worlds[w - 1].modules.find(x => x.id === m).levels.find(x => x.id === l)), cur: () => cur, verif: (w, m) => playVerif(M.worlds[w - 1], M.worlds[w - 1].modules.find(x => x.id === m)) };
  if (me()) showWorlds(); else showPlayers();
})();
