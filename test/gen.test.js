// Ogni livello: 400 domande generate, risposte coerenti e autoverificate
global.LANG = process.env.LANG_GAME || 'it';
const EN = global.LANG === 'en';
global.Vis = require('../src/vis.js');
const M = require(EN ? '../src/curriculum.en.js' : '../src/curriculum.js');
require('../src/autocalc.js');
const St = require('../src/steps.js');
let fails = 0, total = 0, levels = 0;
const bad = (lv, msg, q) => { fails++; if (fails < 40) console.log('FALLITO', lv, msg, JSON.stringify(q).slice(0, 300)); };
for (const w of M.worlds) for (const m of w.modules) for (const l of m.levels) {
  levels++;
  for (let i = 0; i < 400; i++) {
    let q; try { q = l.gen(); } catch (e) { bad(l.id, 'eccezione ' + e.message); break; }
    total++;
    const txt = q.t + (q.x || '') + (q.o || []).join('|');
    if (/undefined|NaN|null|Infinity/.test(txt)) bad(l.id, 'testo', q);
    if (q.v && /NaN|undefined/.test(q.v)) bad(l.id, 'disegno', { t: q.t });
    if (!q.x) bad(l.id, 'manca spiegazione', q);
    if (q.k === 'num') { if (!isFinite(q.a)) bad(l.id, 'risposta', q); if (!M.check(q, M.answerText(q).replace(/ .*/, ''))) bad(l.id, 'autoverifica', { a: q.a, t: M.answerText(q) }); if (q.a < 0 && !/relativi/.test(l.id)) bad(l.id, 'negativo', q); }
    else if (q.k === 'choice') { if (!(q.a >= 0 && q.a < q.o.length) || q.o.length < 2 || new Set(q.o).size !== q.o.length) bad(l.id, 'opzioni', q); if (!M.check(q, q.a)) bad(l.id, 'auto', q); }
    else if (q.k === 'cmp') { if (!['<', '>', '='].includes(q.a)) bad(l.id, 'cmp', q); }
    else if (q.k === 'multi') { if (!q.f.every(f => isFinite(f.a) && f.a >= 0)) bad(l.id, 'multi', q); if (!M.check(q, q.f.map(f => String(f.a)))) bad(l.id, 'auto', q); }
    else bad(l.id, 'tipo', q);
  }
}
// controlli di valori esatti
const eq = (a, b, n) => { if (a !== b) { fails++; console.log('FALLITO', n, a, b); } };
if (EN) {
  eq(M.words(23415), 'twenty-three thousand, four hundred and fifteen', 'words'); eq(M.words(1001), 'one thousand and one', 'words 1001'); eq(M.words(81), 'eighty-one', '81'); eq(M.words(180), 'one hundred and eighty', '180'); eq(M.words(2000), 'two thousand', '2000'); eq(M.words(40015), 'forty thousand and fifteen', '40015'); eq(M.words(12300), 'twelve thousand, three hundred', '12300');
  eq(M.romano(1994), 'MCMXCIV', 'romano'); eq(M.romano(2026), 'MMXXVI', 'romano2');
  eq(M.D(375, 2), '3.75', 'D'); eq(M.D(12345678, 0), '12,345,678', 'F'); eq(M.D(5, 3), '0.005', 'D2'); eq(M.D(1200, 2), '12', 'D3');
  eq(M.parseNum('3.75'), 3.75, 'parse'); eq(M.parseNum('12,345'), 12345, 'parse thousands'); eq(M.parseNum('-4'), -4, 'parse neg'); eq(M.parseNum('1,234.5'), 1234.5, 'parse mixed'); eq(M.parseNum('€12.5'), 12.5, 'parse euro');
  eq(M.unitFmt('2.5', '€'), '€2.50', 'euro'); eq(M.unitFmt('25', '°'), '25°', 'deg');
  // only euros: no dollars left anywhere in the English version
  const USD = /\$|dollar|\bbills?\b/i;
  for (const w of M.worlds) for (const m of w.modules) for (const l of m.levels) { if (USD.test(l.title + ' ' + l.theory)) bad(l.id, 'dollari', l.title); for (let i = 0; i < 60; i++) { const q = l.gen(); const txt = [q.t, q.x, M.answerText(q), q.unit, ...(q.o || [])].join(' '); if (USD.test(txt)) bad(l.id, 'dollari', txt); } }
  // no Italian words left in the English questions
  const IT = /\b(quanti|quante|della|delle|sono|numero|risultato|resto|virgola|decine|unità|centinaia|perché|scrivi|calcola)\b/i;
  for (const w of M.worlds) { if (IT.test(w.name)) bad('mondo', 'italiano', w.name); for (const m of w.modules) { if (IT.test(m.title)) bad(m.id, 'italiano', m.title); for (const l of m.levels) { if (IT.test(l.title + ' ' + l.theory)) bad(l.id, 'italiano', l.title); for (let i = 0; i < 60; i++) { const q = l.gen(); const t = q.t + ' ' + (q.x || '') + ' ' + (q.o || []).join(' ') + ' ' + (q.f || []).map(f => f.l).join(' '); if (IT.test(t)) { bad(l.id, 'italiano', t); break; } if (/\d,\d(?!\d\d)/.test(t.replace(/<[^>]+>/g, ''))) { bad(l.id, 'virgola decimale', t); break; } } } } }
} else {
  eq(M.lettere(23415), 'ventitremilaquattrocentoquindici', 'lettere'); eq(M.lettere(1001), 'milleuno', 'lettere 1001'); eq(M.lettere(81), 'ottantuno', '81'); eq(M.lettere(180), 'centottanta', '180'); eq(M.lettere(33), 'trentatré', '33'); eq(M.lettere(2000), 'duemila', '2000');
eq(M.romano(1994), 'MCMXCIV', 'romano'); eq(M.romano(2026), 'MMXXVI', 'romano2');
eq(M.D(375, 2), '3,75', 'D'); eq(M.D(12345678, 0), '12.345.678', 'F'); eq(M.D(5, 3), '0,005', 'D2'); eq(M.D(1200, 2), '12', 'D3');
eq(M.parseNum('3,75'), 3.75, 'parse'); eq(M.parseNum('12.345'), 12345, 'parse migliaia'); eq(M.parseNum('-4'), -4, 'parse neg'); eq(M.parseNum('1.234,5'), 1234.5, 'parse misto');
}
console.log(`${levels} livelli, ${total} domande`);
console.log('[' + global.LANG + '] ' + (fails ? fails + ' FALLITI' : 'TUTTE LE DOMANDE CORRETTE'));
if (fails) process.exitCode = 1;
// i passaggi in colonna arrivano alla stessa risposta della domanda
{
  let cnt = 0, bad2 = 0;
  for (const w of M.worlds) for (const m of w.modules) for (const l of m.levels) for (let i = 0; i < 150; i++) {
    const q = l.gen(); if (!q.calc && !q.calcs) continue; cnt++;
    const fr = St.build(q.calc || q.calcs); const last = fr[fr.length - 1];
    const m2 = last.note.match(/(?:quoziente|quotient) <b>([\d.,]+)<\/b>/) || last.note.match(/<b>([−\d.,]+)<\/b>(?!.*<b>[−\d.,]+<\/b>)/);
    if (q.calcHide) { if (fr.some(f => /undefined|NaN/.test(f.note))) { bad2++; console.log('FALLITO testo passaggi', l.id); } continue; }
    const exp = q.k === 'multi' ? q.f[0].a : q.a;
    const got = m2 ? M.parseNum(m2[1]) : NaN;
    if (Math.abs(got - exp) > 1e-9) { bad2++; if (bad2 < 10) console.log('FALLITO passaggi', l.id, JSON.stringify(q.calc), last.note, exp); }
    if (fr.some(f => /undefined|NaN/.test(f.note))) { bad2++; console.log('FALLITO testo passaggi', l.id); }
  }
  console.log(cnt + ' domande con i passaggi');
  if (bad2) { console.log(bad2 + ' PASSAGGI SBAGLIATI'); process.exitCode = 1; } else console.log('PASSAGGI COERENTI CON LE RISPOSTE');
}
