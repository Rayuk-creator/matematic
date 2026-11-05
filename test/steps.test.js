// I passaggi in colonna arrivano sempre al risultato giusto
global.LANG = process.env.LANG_GAME || 'it';
const EN = global.LANG === 'en';
const St = require('../src/steps.js');
let fails = 0, n = 0;
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const rowNum = (f, r, from = 0) => { const cs = f.cells.filter(c => c.r === r && c.c >= from).sort((x, y) => x.c - y.c); let s = ''; for (const c of cs) { if (c.t === '–') continue; s += c.t; if (/commaR|dotR/.test(c.k)) s += ','; } return s; };
const toNum = s => parseFloat(s.replace(/,/g, '.'));
function chk(name, ok, info) { n++; if (!ok) { fails++; if (fails < 15) console.log('FALLITO', name, info); } }
for (let i = 0; i < 3000; i++) {
  const dec = R(0, 3), a = R(0, 99999), b = R(0, 99999);
  let fr = St.addition(a, b, dec); let last = fr[fr.length - 1];
  chk('add', Math.abs(toNum(rowNum(last, 4)) - (a + b) / 10 ** dec) < 1e-9, [a, b, dec, rowNum(last, 4)]);
  chk('add-note', fr.every(f => !/undefined|NaN/.test(f.note)), [a, b]);
  const x = Math.max(a, b), y = Math.min(a, b);
  fr = St.subtraction(x, y, dec); last = fr[fr.length - 1];
  chk('sub', Math.abs(toNum(rowNum(last, 4) || '0') - (x - y) / 10 ** dec) < 1e-9, [x, y, dec, rowNum(last, 4)]);
  chk('sub-note', fr.every(f => !/undefined|NaN/.test(f.note)), [x, y]);
  // i prestiti: nella riga in alto ogni cifra prestata è tra 0 e 18
  chk('sub-borrow', last.cells.filter(c => c.r === 0).every(c => +c.t >= 0 && +c.t <= 18), [x, y]);
  const ma = R(1, 9999), mb = R(1, 999);
  fr = St.multiplication(ma, mb); last = fr[fr.length - 1];
  const rr = String(mb).length > 1 ? 3 + String(mb).length + 1 : 4;
  chk('mul', toNum(rowNum(last, rr)) === ma * mb, [ma, mb, rowNum(last, rr)]);
  chk('mul-note', fr.every(f => !/undefined|NaN/.test(f.note)), [ma, mb]);
  // somma di tre numeri
  { const a3 = R(0, 9999), b3 = R(0, 9999), c3 = R(0, 9999), d3 = R(0, 2); const f3 = St.addition(a3, b3, d3, [c3]); chk('add3', Math.abs(toNum(rowNum(f3[f3.length - 1], 5)) - (a3 + b3 + c3) / 10 ** d3) < 1e-9, [a3, b3, c3, d3, rowNum(f3[f3.length - 1], 5)]); }
  // divisione con il dividendo decimale
  { const dv2 = R(2, 40), da = R(1, 3), k2 = R(1, 99999), md2 = R(0, 3); const f2 = St.division(k2, dv2, md2, 0, da); const l2 = f2[f2.length - 1];
    const rc2 = EN ? f2[0].cells.find(c => c.k.startsWith('dv') && c.k !== 'dvs').c : f2[0].cells.find(c => c.k === 'dvs').c;
    const got = toNum(rowNum(l2, EN ? 0 : 1, rc2)); const ex = Math.floor(k2 * 10 ** md2 / dv2) / 10 ** (da + md2);
    chk('div-dec', Math.abs(got - ex) < 1e-9, [k2, da, dv2, md2, rowNum(l2, EN ? 0 : 1, rc2), ex]); chk('div-dec-note', f2.every(f => !/undefined|NaN/.test(f.note)), [k2, dv2]); }
  const dv = R(2, 40), dd = R(dv, 99999), md = R(0, 3);
  fr = St.division(dd, dv, md); last = fr[fr.length - 1];
  const rc = EN ? fr[0].cells.find(c => c.k.startsWith('dv') && c.k !== 'dvs').c : fr[0].cells.find(c => c.k === 'dvs').c;
  const qv = toNum(rowNum(last, EN ? 0 : 1, rc));
  // long division: every product row is underlined and every subtraction is right
  if (EN) chk('div-layout', last.cells.filter(c => c.r === 0).every(c => c.c >= rc) && last.marks.some(m => m.k === 'vbar'), [dd, dv]);
  const exact = Math.floor(dd * 10 ** md / dv) / 10 ** md;
  chk('div', Math.abs(qv - exact) < 1e-9 || (dd % dv === 0 && qv === dd / dv) || Math.abs(qv - Math.floor(dd / dv * 10 ** Math.min(md, 3)) / 10 ** Math.min(md, 3)) < 1e-9, [dd, dv, md, rowNum(last, 1, rc), exact]);
  chk('div-note', fr.every(f => !/undefined|NaN/.test(f.note)), [dd, dv]);
}
console.log(n + ' controlli');
console.log('[' + global.LANG + '] ' + (fails ? fails + ' FALLITI' : 'TUTTI I PASSAGGI CORRETTI'));
if (fails) process.exitCode = 1;
