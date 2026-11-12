/* Disegni SVG per gli esercizi: oggetti da contare, blocchi in base 10, linea dei numeri,
   orologio, monete, frazioni, figure, grafici. Tutti restituiscono una stringa SVG. */
(function (root) {
  'use strict';
  const V = {};
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const svg = (w, h, body, extra = '') => `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" class="vis" ${extra} xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  V.svg = svg;
  const T = (x, y, s, size = 16, fill = '#2b2d42', anchor = 'middle', weight = 600) => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}" font-family="inherit">${esc(s)}</text>`;
  V.T = T;
  const ICONS = {
    mela: (x, y, r) => `<circle cx="${x}" cy="${y + 1}" r="${r}" fill="#e63946"/><path d="M${x} ${y - r + 2} q2 -6 6 -7" stroke="#6b4226" stroke-width="2" fill="none"/><ellipse cx="${x + 5}" cy="${y - r}" rx="4" ry="2" fill="#52b788"/>`,
    stella: (x, y, r) => { let p = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; p += (i ? 'L' : 'M') + (x + rr * Math.cos(a)).toFixed(1) + ' ' + (y + rr * Math.sin(a)).toFixed(1); } return `<path d="${p}Z" fill="#ffb703" stroke="#e09f00"/>`; },
    pallina: (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#4895ef"/><circle cx="${x - r / 3}" cy="${y - r / 3}" r="${r / 4}" fill="#fff" opacity=".6"/>`,
    fiore: (x, y, r) => { let s = ''; for (let i = 0; i < 5; i++) { const a = i * 2 * Math.PI / 5; s += `<circle cx="${x + r * 0.55 * Math.cos(a)}" cy="${y + r * 0.55 * Math.sin(a)}" r="${r * 0.45}" fill="#f28482"/>`; } return s + `<circle cx="${x}" cy="${y}" r="${r * 0.35}" fill="#ffd166"/>`; },
    pesce: (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.6}" fill="#f4a261"/><path d="M${x + r - 2} ${y} l${r * 0.7} ${-r * 0.5} v${r} Z" fill="#e76f51"/><circle cx="${x - r * 0.45}" cy="${y - 2}" r="2" fill="#222"/>`,
  };
  V.ICONS = Object.keys(ICONS);
  // n oggetti uguali, a righe da 5 (come nelle cornici del dieci)
  V.objects = function (n, kind = 'mela', perRow = 5) {
    const r = 13, gap = 34, rows = Math.max(1, Math.ceil(n / perRow));
    const w = Math.max(1, Math.min(n, perRow)) * gap + 10, h = rows * gap + 6;
    let b = '';
    for (let i = 0; i < n; i++) { const cx = 22 + (i % perRow) * gap, cy = 20 + Math.floor(i / perRow) * gap; b += ICONS[kind](cx, cy, r); }
    return svg(w, h, b);
  };
  // gruppi uguali (moltiplicazione come addizione ripetuta)
  V.groups = function (g, k, kind = 'pallina') {
    const per = Math.min(k, 5), rr = 9, gw = per * 22 + 16, rows = Math.ceil(k / 5), gh = rows * 22 + 16;
    const cols = Math.min(g, 4), w = cols * (gw + 10) + 10, h = Math.ceil(g / 4) * (gh + 10) + 10;
    let b = '';
    for (let i = 0; i < g; i++) {
      const gx = 10 + (i % 4) * (gw + 10), gy = 10 + Math.floor(i / 4) * (gh + 10);
      b += `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="12" fill="#eef4ff" stroke="#9db4e8" stroke-dasharray="4 3"/>`;
      for (let j = 0; j < k; j++) b += ICONS[kind](gx + 18 + (j % 5) * 22, gy + 19 + Math.floor(j / 5) * 22, rr);
    }
    return svg(w, h, b);
  };
  // schieramento righe × colonne
  V.array = function (r, c) {
    const s = 24, w = c * s + 20, h = r * s + 20;
    let b = '';
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) b += `<circle cx="${20 + j * s}" cy="${20 + i * s}" r="8" fill="#7209b7" opacity=".85"/>`;
    return svg(w, h, b);
  };
  // blocchi in base 10: centinaia (quadrati), decine (barrette), unità (cubetti)
  V.base10 = function (h, d, u) {
    const s = 7; let x = 8, b = '';
    for (let i = 0; i < h; i++) { b += `<rect x="${x}" y="8" width="${10 * s}" height="${10 * s}" fill="#95d5b2" stroke="#2a9d5c"/>`; for (let k = 1; k < 10; k++) b += `<line x1="${x + k * s}" y1="8" x2="${x + k * s}" y2="${8 + 10 * s}" stroke="#2a9d5c" stroke-width=".5"/><line x1="${x}" y1="${8 + k * s}" x2="${x + 10 * s}" y2="${8 + k * s}" stroke="#2a9d5c" stroke-width=".5"/>`; x += 10 * s + 8; }
    for (let i = 0; i < d; i++) { b += `<rect x="${x}" y="8" width="${s}" height="${10 * s}" fill="#f4a3a8" stroke="#e63946"/>`; for (let k = 1; k < 10; k++) b += `<line x1="${x}" y1="${8 + k * s}" x2="${x + s}" y2="${8 + k * s}" stroke="#e63946" stroke-width=".5"/>`; x += s + 5; }
    if (d) x += 4;
    for (let i = 0; i < u; i++) { b += `<rect x="${x + (i % 3) * (s + 3)}" y="${8 + 10 * s - s - Math.floor(i / 3) * (s + 3)}" width="${s}" height="${s}" fill="#8ab8f5" stroke="#1d6fe0"/>`; }
    x += u ? 3 * (s + 3) + 4 : 0;
    return svg(Math.max(60, x + 4), 10 * s + 16, b);
  };
  // linea dei numeri con eventuali salti (frecce) e un punto da trovare
  V.numberLine = function (from, to, opts = {}) {
    const n = to - from, w = Math.min(680, Math.max(300, n * 34)), x0 = 20, step = (w - 40) / n;
    const X = v => x0 + (v - from) * step;
    let b = `<line x1="${x0 - 10}" y1="60" x2="${w - 10}" y2="60" stroke="#333" stroke-width="2"/><path d="M${w - 10} 60 l-8 -5 v10z" fill="#333"/>`;
    const lbEvery = opts.every || (n > 20 ? 5 : 1);
    for (let v = from; v <= to; v++) {
      const big = (v - from) % lbEvery === 0;
      b += `<line x1="${X(v)}" y1="${big ? 52 : 55}" x2="${X(v)}" y2="${big ? 68 : 65}" stroke="#333" stroke-width="${big ? 2 : 1}"/>`;
      if (big && !(opts.hide || []).includes(v)) b += T(X(v), 86, String(opts.label ? opts.label(v) : v), 13, '#333');
    }
    for (const [a, c] of (opts.jumps || [])) { const xa = X(a), xc = X(c), mid = (xa + xc) / 2, hgt = Math.min(40, Math.abs(xc - xa) / 2 + 10); b += `<path d="M${xa} 55 Q${mid} ${55 - hgt * 1.6} ${xc} 55" fill="none" stroke="#f3722c" stroke-width="2.5"/><path d="M${xc} 55 l${xc > xa ? -9 : 9} -6 l${xc > xa ? 2 : -2} 8z" fill="#f3722c"/>`; }
    for (const v of (opts.mark || [])) b += `<circle cx="${X(v)}" cy="60" r="7" fill="#e63946"/>`;
    for (const v of (opts.ask || [])) b += `<rect x="${X(v) - 13}" y="72" width="26" height="22" rx="5" fill="#fff3bf" stroke="#f59f00"/>` + T(X(v), 88, '?', 15, '#d9480f');
    return svg(w, 100, b);
  };
  // orologio analogico
  V.clock = function (h, m, big) {
    const c = 80, r = 70;
    let b = `<circle cx="${c}" cy="${c}" r="${r}" fill="#fff" stroke="#264653" stroke-width="5"/>`;
    for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30, big = i % 5 === 0; b += `<line x1="${c + (r - (big ? 11 : 5)) * Math.sin(a)}" y1="${c - (r - (big ? 11 : 5)) * Math.cos(a)}" x2="${c + (r - 2) * Math.sin(a)}" y2="${c - (r - 2) * Math.cos(a)}" stroke="#264653" stroke-width="${big ? 2.5 : 1}"/>`; }
    for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 6; b += T(c + (r - 22) * Math.sin(a), c - (r - 22) * Math.cos(a) + 5, String(i), 14, '#264653'); }
    const ah = ((h % 12) + m / 60) * Math.PI / 6, am = m * Math.PI / 30;
    b += `<line x1="${c}" y1="${c}" x2="${c + 38 * Math.sin(ah)}" y2="${c - 38 * Math.cos(ah)}" stroke="#264653" stroke-width="6" stroke-linecap="round"/>`;
    b += `<line x1="${c}" y1="${c}" x2="${c + 56 * Math.sin(am)}" y2="${c - 56 * Math.cos(am)}" stroke="#e76f51" stroke-width="4" stroke-linecap="round"/><circle cx="${c}" cy="${c}" r="5" fill="#264653"/>`;
    return big ? `<svg viewBox="0 0 160 160" width="240" height="240" class="vis" xmlns="http://www.w3.org/2000/svg">${b}</svg>` : svg(160, 160, b);
  };
  // monete e banconote in centesimi
  V.money = function (list) {
    const en = root.LANG === 'en';
    const lab = v => v >= 100 ? (en ? '€' + (v / 100) : (v / 100) + ' €') : v + (en ? 'c' : ' cent');
    // banconote: colori veri dell'euro; monete: rame (1, 2, 5 cent), oro nordico (10, 20, 50 cent), bimetalliche (1 € e 2 €)
    const NOTE = { 500: '#9fa8a3', 1000: '#e07a7a', 2000: '#6c9bd2', 5000: '#e9a05a', 10000: '#6fb36f', 20000: '#d8b93c', 50000: '#a98ac9' };
    let x = 6, b = '';
    for (const v of list) {
      if (v >= 500) { b += `<rect x="${x}" y="14" width="92" height="52" rx="5" fill="${NOTE[v] || '#999'}" stroke="#555"/><rect x="${x + 5}" y="19" width="82" height="42" rx="3" fill="none" stroke="#fff" stroke-opacity=".6"/>` + T(x + 46, 47, lab(v), 18, '#fff', 'middle', 900); x += 100; }
      else {
        const r = v === 200 ? 24 : v === 100 ? 22 : v >= 10 ? 20 : 17;
        if (v >= 100) {
          const outer = v === 200 ? '#c8ccd1' : '#e6c35c', inner = v === 200 ? '#e6c35c' : '#c8ccd1';
          b += `<circle cx="${x + r}" cy="40" r="${r}" fill="${outer}" stroke="#6b5a2a" stroke-width="2"/><circle cx="${x + r}" cy="40" r="${r - 7}" fill="${inner}" stroke="#6b5a2a" stroke-width="1"/>`;
        } else b += `<circle cx="${x + r}" cy="40" r="${r}" fill="${v >= 10 ? '#e6c35c' : '#c9783a'}" stroke="#8a6d1f" stroke-width="2"/>`;
        if (v >= 100) b += T(x + r, 45, lab(v), 13, '#2b1d00', 'middle', 900);
        else b += T(x + r, 42, String(v), v >= 10 ? 15 : 13, '#2b1d00', 'middle', 900) + T(x + r, 52, 'cent', 7, '#2b1d00', 'middle', 700);
        x += 2 * r + 6;
      }
    }
    return svg(Math.max(60, x + 4), 80, b);
  };
  // frazione: torta o barra con parti colorate
  V.fraction = function (n, d, kind = 'pie') {
    let b = '';
    if (kind === 'pie') {
      const c = 70, r = 60;
      for (let i = 0; i < d; i++) {
        const a0 = -Math.PI / 2 + i * 2 * Math.PI / d, a1 = a0 + 2 * Math.PI / d;
        const p = d === 1 ? `M${c} ${c - r} A${r} ${r} 0 1 1 ${c - 0.01} ${c - r}Z` : `M${c} ${c} L${c + r * Math.cos(a0)} ${c + r * Math.sin(a0)} A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${c + r * Math.cos(a1)} ${c + r * Math.sin(a1)}Z`;
        b += `<path d="${p}" fill="${i < n ? '#f77f00' : '#fff'}" stroke="#333" stroke-width="2"/>`;
      }
      return svg(140, 140, b);
    }
    const w = 300, h = 46, pw = w / d;
    for (let i = 0; i < d; i++) b += `<rect x="${10 + i * pw}" y="10" width="${pw}" height="${h}" fill="${i < n ? '#2a9d8f' : '#fff'}" stroke="#333" stroke-width="2"/>`;
    return svg(w + 20, h + 20, b);
  };
  // poligono con le misure dei lati
  V.polygon = function (pts, labels = [], opts = {}) {
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const mnx = Math.min(...xs), mny = Math.min(...ys), mxx = Math.max(...xs), mxy = Math.max(...ys);
    const sc = Math.min(220 / Math.max(1, mxx - mnx), 150 / Math.max(1, mxy - mny));
    const P = pts.map(p => [40 + (p[0] - mnx) * sc, 30 + (mxy - p[1]) * sc]);
    let b = `<path d="M${P.map(p => p.join(' ')).join(' L')}Z" fill="${opts.fill || '#cdeccf'}" stroke="#2d6a4f" stroke-width="3"/>`;
    const cx = P.reduce((s, p) => s + p[0], 0) / P.length, cy = P.reduce((s, p) => s + p[1], 0) / P.length;
    labels.forEach((lb, i) => {
      if (lb === null || lb === undefined || lb === '') return;
      const a = P[i], c = P[(i + 1) % P.length]; const mx = (a[0] + c[0]) / 2, my = (a[1] + c[1]) / 2;
      const dx = mx - cx, dy = my - cy, l = Math.hypot(dx, dy) || 1;
      b += T(mx + dx / l * 18, my + dy / l * 18 + 5, lb, 14, '#1b4332');
    });
    if (opts.h) { const [a, c] = opts.h.map(p => [40 + (p[0] - mnx) * sc, 30 + (mxy - p[1]) * sc]); b += `<line x1="${a[0]}" y1="${a[1]}" x2="${c[0]}" y2="${c[1]}" stroke="#d00000" stroke-width="2" stroke-dasharray="5 4"/>` + T(c[0] + 8, (a[1] + c[1]) / 2 + 5, opts.hLabel || 'h', 14, '#d00000', 'start'); }
    return svg(Math.max(...P.map(p => p[0])) + 50, Math.max(...P.map(p => p[1])) + 40, b);
  };
  // figura su quadretti (aree e perimetri contando)
  V.gridShape = function (w, h) {
    const s = 22; let b = '';
    for (let i = 0; i <= w + 2; i++) b += `<line x1="${10 + i * s}" y1="10" x2="${10 + i * s}" y2="${10 + (h + 2) * s}" stroke="#d0d7de"/>`;
    for (let j = 0; j <= h + 2; j++) b += `<line x1="10" y1="${10 + j * s}" x2="${10 + (w + 2) * s}" y2="${10 + j * s}" stroke="#d0d7de"/>`;
    b += `<rect x="${10 + s}" y="${10 + s}" width="${w * s}" height="${h * s}" fill="#90e0ef" fill-opacity=".7" stroke="#0077b6" stroke-width="3"/>`;
    return svg((w + 2) * s + 20, (h + 2) * s + 20, b);
  };
  // figure piane semplici
  V.shape = function (name, color = '#ffafcc') {
    const st = `fill="${color}" stroke="#333" stroke-width="3"`;
    const S = {
      cerchio: `<circle cx="70" cy="60" r="48" ${st}/>`,
      quadrato: `<rect x="22" y="12" width="96" height="96" ${st}/>`,
      rettangolo: `<rect x="5" y="30" width="130" height="64" ${st}/>`,
      triangolo: `<path d="M70 10 L130 108 L10 108Z" ${st}/>`,
      rombo: `<path d="M70 6 L126 60 L70 114 L14 60Z" ${st}/>`,
      pentagono: `<path d="M70 8 L126 50 L104 112 L36 112 L14 50Z" ${st}/>`,
      esagono: `<path d="M40 12 L100 12 L130 60 L100 108 L40 108 L10 60Z" ${st}/>`,
      ovale: `<ellipse cx="70" cy="60" rx="62" ry="38" ${st}/>`,
      trapezio: `<path d="M40 20 L100 20 L132 104 L8 104Z" ${st}/>`,
    };
    return svg(140, 120, S[name]);
  };
  // angolo con l'ampiezza data (gradi)
  V.angle = function (deg, label = true) {
    const c = [40, 120], L = 110, a = deg * Math.PI / 180;
    const p = [c[0] + L * Math.cos(a), c[1] - L * Math.sin(a)];
    let b = `<line x1="${c[0]}" y1="${c[1]}" x2="${c[0] + L}" y2="${c[1]}" stroke="#333" stroke-width="3"/><line x1="${c[0]}" y1="${c[1]}" x2="${p[0]}" y2="${p[1]}" stroke="#333" stroke-width="3"/>`;
    if (Math.abs(deg - 90) < 0.01) b += `<path d="M${c[0] + 18} ${c[1]} V${c[1] - 18} H${c[0]}" fill="none" stroke="#e63946" stroke-width="2"/>`;
    else { const r = 26; b += `<path d="M${c[0] + r} ${c[1]} A${r} ${r} 0 ${deg > 180 ? 1 : 0} 0 ${c[0] + r * Math.cos(a)} ${c[1] - r * Math.sin(a)}" fill="none" stroke="#e63946" stroke-width="2"/>`; }
    const minx = Math.min(c[0], p[0]) - 10;
    return svg(Math.max(c[0] + L, p[0]) - minx + 20, 140, `<g transform="translate(${-minx + 10} 0)">${b}</g>`);
  };
  // coppie di rette
  // traslazione, rotazione o simmetria di una figura a forma di L sul reticolo (A = di partenza, B = di arrivo)
  V.transform = function (kind, o) {
    const c = 24, W = 13, H = 9, pad = 6;
    const L = [[0, 0], [1, 0], [1, 2], [2, 2], [2, 3], [0, 3]];
    const A = L.map(([x, y]) => [o.ax + x, o.ay + y]);
    let f, extra = '';
    if (kind === 'trasl') f = ([x, y]) => [x + o.dx, y + o.dy];
    else if (kind === 'rot') { const P = [o.ax + 4, o.ay + 1]; f = ([x, y]) => [P[0] - (y - P[1]), P[1] + (x - P[0])]; extra = `<circle cx="${pad + P[0] * c}" cy="${pad + P[1] * c}" r="5" fill="#d00000"/>`; }
    else { const ax = o.ax + 3; f = ([x, y]) => [2 * ax - x, y]; extra = `<line x1="${pad + ax * c}" y1="${pad}" x2="${pad + ax * c}" y2="${pad + H * c}" stroke="#d00000" stroke-width="3" stroke-dasharray="8 6"/>`; }
    const B = A.map(f);
    const inA = [o.ax + 0.5, o.ay + 1.5], inB = f(inA); // un punto dentro la figura, per la lettera
    let g = '';
    for (let x = 0; x <= W; x++) g += `<line x1="${pad + x * c}" y1="${pad}" x2="${pad + x * c}" y2="${pad + H * c}" stroke="#dde3f0"/>`;
    for (let y = 0; y <= H; y++) g += `<line x1="${pad}" y1="${pad + y * c}" x2="${pad + W * c}" y2="${pad + y * c}" stroke="#dde3f0"/>`;
    const poly = (P, fill, stroke) => `<path d="${P.map(([x, y], i) => (i ? 'L' : 'M') + (pad + x * c) + ' ' + (pad + y * c)).join(' ')}Z" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>`;
    const lab = (q, t, col) => T(pad + q[0] * c, pad + q[1] * c + 6, t, 17, col, 'middle', 900);
    return svg(W * c + 2 * pad, H * c + 2 * pad, g + extra + poly(A, '#bde0fe', '#1d6fe0') + poly(B, '#ffd6a5', '#e76f51') + lab(inA, 'A', '#1d3557') + lab(inB, 'B', '#7a3412'));
  };
  V.lines = function (kind) {
    const s = 'stroke="#3a0ca3" stroke-width="4" stroke-linecap="round"';
    const L = { parallele: `<line x1="10" y1="35" x2="190" y2="25" ${s}/><line x1="10" y1="85" x2="190" y2="75" ${s}/>`, perpendicolari: `<line x1="10" y1="60" x2="190" y2="60" ${s}/><line x1="100" y1="5" x2="100" y2="115" ${s}/>`, incidenti: `<line x1="10" y1="20" x2="190" y2="100" ${s}/><line x1="20" y1="105" x2="180" y2="35" ${s}/>` };
    return svg(200, 120, L[kind]);
  };
  // linee aperte/chiuse, curve/spezzate
  V.curve = function (kind) {
    const s = 'fill="none" stroke="#d62828" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"';
    const K = {
      'aperta curva': `<path d="M15 90 C45 10 90 120 120 50 S175 30 185 80" ${s}/>`,
      'chiusa curva': `<path d="M100 15 C160 15 185 60 150 95 C120 125 50 115 30 80 C10 45 50 15 100 15Z" ${s}/>`,
      'aperta spezzata': `<path d="M15 95 L55 25 L95 90 L140 30 L185 85" ${s}/>`,
      'chiusa spezzata': `<path d="M30 30 L170 20 L185 100 L90 110 L20 90Z" ${s}/>`,
      retta: `<line x1="5" y1="90" x2="195" y2="30" ${s}/>`,
    };
    return svg(200, 120, K[kind]);
  };
  // istogramma
  V.bars = function (labels, values, title = '') {
    const w = labels.length * 60 + 60, H = 160, mx = Math.max(...values), top = Math.ceil(mx / 2) * 2 || 2;
    let b = '';
    for (let v = 0; v <= top; v += (top > 10 ? 2 : 1)) { const y = H - v / top * (H - 30); b += `<line x1="40" y1="${y}" x2="${w - 10}" y2="${y}" stroke="#e5e5e5"/>` + T(32, y + 4, String(v), 11, '#555', 'end', 400); }
    labels.forEach((l, i) => { const x = 54 + i * 60, hh = values[i] / top * (H - 30); b += `<rect x="${x}" y="${H - hh}" width="36" height="${hh}" fill="${['#4361ee', '#f72585', '#4cc9f0', '#7209b7', '#ff9f1c', '#2ec4b6'][i % 6]}" rx="3"/>` + T(x + 18, H + 18, l, 12, '#333', 'middle', 500); });
    b += `<line x1="40" y1="${H}" x2="${w - 10}" y2="${H}" stroke="#333"/>`;
    return svg(w, H + 30, (title ? T(w / 2, 14, title, 13, '#333') : '') + b);
  };
  // sacchetto di palline colorate (probabilità)
  V.bag = function (counts) {
    const cols = { rosse: '#e63946', blu: '#3a86ff', verdi: '#2a9d8f', gialle: '#ffbe0b' };
    let b = `<path d="M30 40 Q20 150 100 150 Q180 150 170 40 Z" fill="#d9c5a0" stroke="#8d6e3f" stroke-width="3"/><path d="M45 40 Q100 20 155 40" fill="none" stroke="#8d6e3f" stroke-width="3"/>`;
    let i = 0;
    for (const [k, n] of Object.entries(counts)) for (let j = 0; j < n; j++) { const x = 60 + (i % 5) * 20, y = 70 + Math.floor(i / 5) * 20; b += `<circle cx="${x}" cy="${y}" r="9" fill="${cols[k]}" stroke="#333"/>`; i++; }
    return svg(200, 160, b);
  };
  // sequenza di figure colorate (ritmi)
  V.sequence = function (items) {
    let b = '', x = 10;
    const d = { c: (x, col) => `<circle cx="${x + 18}" cy="30" r="16" fill="${col}" stroke="#333" stroke-width="2"/>`, q: (x, col) => `<rect x="${x + 2}" y="14" width="32" height="32" fill="${col}" stroke="#333" stroke-width="2"/>`, t: (x, col) => `<path d="M${x + 18} 12 L${x + 36} 46 L${x} 46Z" fill="${col}" stroke="#333" stroke-width="2"/>`, '?': x => `<rect x="${x + 2}" y="12" width="32" height="36" rx="6" fill="#fff3bf" stroke="#f59f00" stroke-width="2"/>` + T(x + 18, 37, '?', 20, '#d9480f') };
    for (const it of items) { b += it === '?' ? d['?'](x) : d[it[0]](x, it[1]); x += 44; }
    return svg(x + 6, 60, b);
  };
  // un oggetto in una griglia di posizioni (sopra, sotto, destra, sinistra)
  V.scene = function (ref, obj, pos) {
    const C = [100, 70];
    const off = { sopra: [0, -48], sotto: [0, 48], destra: [62, 0], sinistra: [-62, 0] }[pos];
    const draw = (k, x, y) => k === 'casa' ? `<path d="M${x - 22} ${y + 18} V${y - 4} L${x} ${y - 24} L${x + 22} ${y - 4} V${y + 18}Z" fill="#e9c46a" stroke="#333" stroke-width="2"/><rect x="${x - 6}" y="${y + 4}" width="12" height="14" fill="#8d5524"/>` : k === 'albero' ? `<rect x="${x - 4}" y="${y}" width="8" height="20" fill="#8d5524"/><circle cx="${x}" cy="${y - 8}" r="18" fill="#52b788"/>` : `<circle cx="${x}" cy="${y}" r="14" fill="#ffb703" stroke="#333" stroke-width="2"/>` + T(x, y + 5, '☺', 16, '#333');
    return svg(200, 150, draw(ref, C[0], C[1]) + draw(obj, C[0] + off[0], C[1] + off[1]));
  };
  // termometro per i numeri relativi
  V.thermo = function (t) {
    const y0 = 20, y1 = 180, mn = -20, mx = 30, Y = v => y1 - (v - mn) / (mx - mn) * (y1 - y0);
    let b = `<rect x="40" y="${y0 - 6}" width="20" height="${y1 - y0 + 12}" rx="10" fill="#fff" stroke="#333" stroke-width="2"/><circle cx="50" cy="${y1 + 14}" r="16" fill="#e63946" stroke="#333" stroke-width="2"/>`;
    b += `<rect x="45" y="${Y(t)}" width="10" height="${y1 + 4 - Y(t)}" fill="#e63946"/>`;
    for (let v = mn; v <= mx; v += 5) b += `<line x1="60" y1="${Y(v)}" x2="70" y2="${Y(v)}" stroke="#333"/>` + T(74, Y(v) + 4, (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + '°', 11, v < 0 ? '#1d4ed8' : '#333', 'start', 500);
    return svg(120, 210, b);
  };
  // solidi (disegno semplice)
  V.solid = function (name) {
    const st = 'stroke="#333" stroke-width="2.5" stroke-linejoin="round"';
    const S = {
      cubo: `<path d="M30 50 L90 50 L90 110 L30 110Z" fill="#a2d2ff" ${st}/><path d="M30 50 L55 25 L115 25 L90 50Z" fill="#cde7ff" ${st}/><path d="M90 50 L115 25 L115 85 L90 110Z" fill="#7db9f0" ${st}/>`,
      parallelepipedo: `<path d="M20 55 L110 55 L110 105 L20 105Z" fill="#ffc8dd" ${st}/><path d="M20 55 L45 30 L135 30 L110 55Z" fill="#ffe0ec" ${st}/><path d="M110 55 L135 30 L135 80 L110 105Z" fill="#f4a3c0" ${st}/>`,
      piramide: `<path d="M25 100 L75 120 L125 95 L75 15Z" fill="#ffd6a5" ${st}/><path d="M75 15 L75 120" ${st}/><path d="M25 100 L75 15" ${st}/>`,
      cilindro: `<path d="M30 30 V100 A45 14 0 0 0 120 100 V30" fill="#caffbf" ${st}/><ellipse cx="75" cy="30" rx="45" ry="14" fill="#e3ffdc" ${st}/>`,
      cono: `<path d="M75 12 L120 100 A45 14 0 0 1 30 100Z" fill="#fdffb6" ${st}/>`,
      sfera: `<circle cx="75" cy="65" r="50" fill="#bdb2ff" ${st}/><ellipse cx="75" cy="65" rx="50" ry="14" fill="none" stroke="#333" stroke-dasharray="4 3"/>`,
    };
    return svg(150, 130, S[name]);
  };
  // operazione in colonna (incolonnata, con lo spazio del risultato)
  V.column = function (a, b, op) {
    const sa = String(a), sb = String(b), n = Math.max(sa.length, sb.length) + 1, cw = 26, w = (n + 1) * cw + 10;
    let s = '';
    // cifre colorate per posizione (unità rosso, decine blu, centinaia verde, migliaia viola)
    const PC = ['#1d6fe0', '#e63946', '#2a9d5c', '#8338ec', '#8338ec', '#8338ec', '#f77f00'];
    const row = (str, y) => { const off = n - str.length; for (let i = 0; i < str.length; i++) s += T(14 + (off + i + 1) * cw, y, str[i], 26, PC[str.length - 1 - i] || '#6d4c41', 'middle', 800); };
    row(sa, 34); row(sb, 70); s += T(18, 70, op, 26, '#e63946', 'middle', 700);
    s += `<line x1="8" y1="82" x2="${w - 4}" y2="82" stroke="#1d3557" stroke-width="3"/>`;
    for (let i = 0; i < n; i++) s += `<rect x="${14 + (i + 1) * cw - 11}" y="90" width="22" height="30" rx="4" fill="#fff3bf" stroke="#f59f00"/>`;
    return svg(w, 126, s);
  };
  // griglia del coding: il robot, la stella e le caselle segnate con le lettere
  V.grid = function (cols, rows, o = {}) {
    const S = 48, P = 4; let b = '';
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) b += `<rect x="${P + x * S}" y="${P + y * S}" width="${S}" height="${S}" fill="${(x + y) % 2 ? '#eef3ff' : '#f8faff'}" stroke="#c9d6ff" stroke-width="1.5"/>`;
    const at = (p, s, size = 28) => T(P + p[0] * S + S / 2, P + p[1] * S + S / 2 + size * 0.36, s, size);
    for (const [k, p] of Object.entries(o.marks || {})) b += `<circle cx="${P + p[0] * S + S / 2}" cy="${P + p[1] * S + S / 2}" r="17" fill="#ffd166" stroke="#e0a100" stroke-width="2"/>` + T(P + p[0] * S + S / 2, P + p[1] * S + S / 2 + 7, k, 20, '#2b2d42', 'middle', 800);
    if (o.star) b += at(o.star, '⭐');
    if (o.robot) b += at(o.robot, '🤖');
    return svg(cols * S + 2 * P, rows * S + 2 * P, b);
  };
  root.Vis = V;
  if (typeof module !== 'undefined') module.exports = V;
})(typeof window !== 'undefined' ? window : globalThis);
