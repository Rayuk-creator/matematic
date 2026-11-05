/* Tutte le operazioni in colonna: per ogni domanda si cercano le operazioni (nel testo «… = ?» oppure nelle
   uguaglianze della spiegazione, per esempio «(26 + 19) × 2 = 90 cm») e si preparano i calcoli in colonna,
   uno per ogni operazione, nell'ordine in cui si fanno. Si accettano solo se arrivano esattamente alla risposta.
   q.calc = un solo calcolo; q.calcs = più calcoli in fila (espressioni, perimetri, aree…). */
(function (root) {
  'use strict';
  const M = root.Mate;
  const EN = root.LANG === 'en';
  const TH = EN ? ',' : '.', DP = EN ? '.' : ',';
  const NUM = EN ? '\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+(?:\\.\\d+)?' : '\\d{1,3}(?:\\.\\d{3})+(?:,\\d+)?|\\d+(?:,\\d+)?';
  const OP = EN ? '[+−×÷]' : '[+−×:]';
  const UNIT = '(?: ?(?:cm²|dm²|mm²|m²|km|cm|dm|mm|kg|g|m|°|€))?';
  const TERM = `[\\[(]*[€£$]?(?:${NUM})${UNIT}[)\\]]*`;
  const EXPR = `${TERM}(?: ${OP} ${TERM})+`;
  // un'uguaglianza: espressione = numero (o «?» nel testo della domanda)
  const EQ = new RegExp(`(?<![\\d.,] [−\\-+×:÷] )(?<![\\d.,/−\\-+])(${EXPR}) = (?=(\\?|[€£$]?(?:${NUM}))(?![\\d]|[.,]\\d)(?! ?[×:÷+−/]))`, 'g');

  // numero esatto: intero scalato e cifre decimali (3,75 → {k: 375, dec: 2})
  function parseNum(s) { s = s.replace(/[€£$]/, '').split(TH).join(''); const [ip, fp = ''] = s.split(DP); return { k: +(ip + fp), dec: fp.length }; }
  function fromValue(v) {
    if (!isFinite(v) || v < 0) return null;
    const s = String(Math.round(v * 1e6) / 1e6);
    if (/e/.test(s)) return null;
    const [ip, fp = ''] = s.split('.');
    return { k: +(ip + fp), dec: fp.length };
  }
  const value = x => x.k / Math.pow(10, x.dec);
  const scale = (x, dec) => x.k * Math.pow(10, dec - x.dec);
  const same = (x, y) => Math.abs(x - y) < 1e-9 * Math.max(1, Math.abs(y));

  // un calcolo in colonna fra due (o più, per l'addizione) numeri esatti
  function make(op, xs) {
    if (op === '+') {
      const dec = Math.max(...xs.map(x => x.dec));
      const v = xs.map(x => scale(x, dec));
      const calc = { op: '+', a: v[0], b: v[1], dec };
      if (v.length > 2) calc.more = v.slice(2);
      return { calc, value: v.reduce((s, y) => s + y, 0) / Math.pow(10, dec) };
    }
    const [x, y] = xs;
    if (op === '−') {
      const dec = Math.max(x.dec, y.dec), a = scale(x, dec), b = scale(y, dec);
      if (a < b) return null;
      return { calc: { op: '−', a, b, dec }, value: (a - b) / Math.pow(10, dec) };
    }
    if (op === '×') return x.k === 0 || y.k === 0 ? null : { calc: { op: '×', a: x.k, b: y.k, decA: x.dec, decB: y.dec }, value: x.k * y.k / Math.pow(10, x.dec + y.dec) };
    if (op === ':' || op === '÷') {
      if (y.k === 0) return null;
      // il divisore diventa intero moltiplicando tutti e due per 10, 100…
      const shift = y.dec;
      let a = x.k, decA = x.dec - shift;
      if (decA < 0) { a = a * Math.pow(10, -decA); decA = 0; }
      const d = y.k;
      // cifre decimali in più per finire senza resto (al massimo 3)
      let extra = -1;
      for (let e = 0; e <= 3; e++) if ((a * Math.pow(10, e)) % d === 0) { extra = e; break; }
      const calc = { op: ':', a, b: d, maxDec: Math.max(0, extra) };
      if (shift) calc.shift = shift;
      if (decA) calc.decA = decA;
      return { calc, value: extra >= 0 ? a / d / Math.pow(10, decA) : NaN, q: Math.floor(a / d), r: a % d, decA, exact: extra >= 0 };
    }
    return null;
  }

  // espressione → calcoli nell'ordine giusto (prima le parentesi, poi × e :, poi + e −, da sinistra)
  function tokenize(e) {
    const out = [];
    const re = new RegExp(`\\s*(?:([\\[(])|([\\])])|(${OP})|[€£$]?(${NUM})${UNIT})`, 'y');
    let m;
    while (re.lastIndex < e.length && (m = re.exec(e))) {
      if (m[1]) out.push({ t: '(' }); else if (m[2]) out.push({ t: ')' }); else if (m[3]) out.push({ t: 'op', v: m[3] }); else out.push({ t: 'n', v: parseNum(m[4]) });
    }
    return re.lastIndex >= e.length ? out : null;
  }
  function evaluate(e) {
    const tk = tokenize(e);
    if (!tk) return null;
    // solo addizioni senza parentesi: un'unica addizione in colonna con tutti gli addendi
    if (tk.every(t => t.t === 'n' || (t.t === 'op' && t.v === '+'))) {
      const xs = tk.filter(t => t.t === 'n').map(t => t.v);
      if (xs.length > 6) return null;
      const r = make('+', xs);
      return r ? { steps: [r.calc], value: r.value } : null;
    }
    let i = 0;
    const steps = [];
    const prec = o => (o === '+' || o === '−') ? 1 : 2;
    function primary() {
      const t = tk[i++];
      if (!t) throw 0;
      if (t.t === 'n') return t.v;
      if (t.t === '(') {
        // una parentesi con sole addizioni diventa un'unica addizione in colonna
        let j = i, xs = [];
        while (tk[j] && (tk[j].t === 'n' || (tk[j].t === 'op' && tk[j].v === '+'))) { if (tk[j].t === 'n') xs.push(tk[j].v); j++; }
        if (tk[j] && tk[j].t === ')' && xs.length > 2 && xs.length <= 6) { const r = make('+', xs); i = j + 1; steps.push(r.calc); return fromValue(r.value); }
        const v = expr(0); if (!tk[i] || tk[i].t !== ')') throw 0; i++; return v; }
      throw 0;
    }
    function expr(minP) {
      let left = primary();
      while (tk[i] && tk[i].t === 'op' && prec(tk[i].v) >= minP) {
        const op = tk[i++].v;
        const right = expr(prec(op) + 1);
        const r = make(op, [left, right]);
        if (!r || !isFinite(r.value)) throw 0;
        steps.push(r.calc);
        left = fromValue(r.value);
        if (!left) throw 0;
      }
      return left;
    }
    try { const v = expr(0); if (i !== tk.length) return null; return { steps, value: value(v) }; } catch (err) { return null; }
  }

  const strip = t => String(t || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  function derive(q) {
    if (q.calc || q.calcs) return null;
    const ans = q.k === 'num' ? q.a : null;
    // 1) l'operazione è nel testo della domanda: «… = ?» oppure «Calcola in colonna: a + b»
    const t = strip(q.t).replace(/^(?:Calcola in colonna|Work it out in columns): (.*)$/, '$1 = ?');
    for (const m of t.matchAll(EQ)) {
      if (m[2] !== '?') continue;
      const ev = evaluate(m[1]);
      if (!ev || !ev.steps.length) continue;
      if (ans !== null && same(ev.value, ans)) return ev.steps;
      // divisione con quoziente e resto
      if (q.k === 'multi' && ev.steps.length === 1 && ev.steps[0].op === ':' && q.f.length === 2 && !ev.steps[0].decA && !ev.steps[0].shift) {
        const c = ev.steps[0];
        if (Math.floor(c.a / c.b) === q.f[0].a && c.a % c.b === q.f[1].a) { c.maxDec = 0; return [c]; }
      }
    }
    // 2) le uguaglianze della spiegazione, fino a quella che dà la risposta
    if (!q.x) return null;
    const x = strip(q.x);
    const all = [], eqs = [];
    for (const m of x.matchAll(EQ)) {
      if (m[2] === '?') continue;
      const ev = evaluate(m[1]);
      if (!ev || !ev.steps.length) continue;
      const stated = parseNum(m[2]);
      if (!same(ev.value, value(stated))) continue; // l'uguaglianza scritta dev'essere giusta
      all.push(...ev.steps); eqs.push(ev);
      if (ans !== null && same(ev.value, ans)) return all;
    }
    // il numero nascosto (3 + ? = 10) o le domande a scelta: l'operazione completa si vede solo nella spiegazione
    if (eqs.length && (q.k === 'choice' || (ans !== null && /\?/.test(t)))) { all.hide = true; return all; }
    return null;
  }
  // ogni generatore di domande passa da qui
  for (const w of M.worlds) for (const m of w.modules) for (const l of m.levels) {
    const g = l.gen;
    l.gen = () => {
      const q = g();
      const c = derive(q);
      if (c && c.length === 1) q.calc = c[0]; else if (c && c.length) q.calcs = c.slice();
      if (c && c.hide) q.calcHide = true;
      return q;
    };
  }
  M.deriveCalc = derive;
  M.evalExpr = evaluate;
})(typeof window !== 'undefined' ? window : globalThis);
