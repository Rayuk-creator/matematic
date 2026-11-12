// Coding: ogni risposta ricalcolata da zero leggendo la domanda e il disegno (robot, stella, lettere)
global.LANG = process.env.LANG_GAME || 'it';
const EN = global.LANG === 'en';
global.Vis = require('../src/vis.js');
const M = require(EN ? '../src/curriculum.en.js' : '../src/curriculum.js');
const DIR = { '↑': [0, -1], '↓': [0, 1], '←': [-1, 0], '→': [1, 0] };
let fails = 0, total = 0;
const bad = (id, msg, q) => { fails++; if (fails < 30) console.log('FALLITO', id, msg, JSON.stringify(q).slice(0, 400)); };
// legge il disegno: posizione del robot, della stella e delle lettere; dimensioni della griglia
function grid(v) {
  const vb = v.match(/viewBox="0 0 (\d+) (\d+)"/); const cols = (vb[1] - 8) / 48, rows = (vb[2] - 8) / 48;
  const items = {};
  for (const m of v.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*>([^<]+)<\/text>/g)) items[m[3]] = [Math.floor((m[1] - 4) / 48), Math.floor((m[2] - 4 - 1) / 48)];
  return { cols, rows, items };
}
const cmdsIn = s => [...s.matchAll(/<span class="cmd">(.)<\/span>/g)].map(m => m[1]);
const go = (p, list) => list.reduce((q, c) => [q[0] + DIR[c][0], q[1] + DIR[c][1]], p);
const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];
const inside = (p, g) => p[0] >= 0 && p[1] >= 0 && p[0] < g.cols && p[1] < g.rows;
const ids = {}, pos = {};
for (const w of M.worlds) for (const m of w.modules) if (/cod$/.test(m.id)) { ids[w.n] = m; if (m.levels.length !== 2) bad(m.id, 'livelli', m.levels.length); }
if (Object.keys(ids).length !== 5) bad('moduli', 'manca una classe', Object.keys(ids));
for (const [n, m] of Object.entries(ids)) for (const l of m.levels) for (let i = 0; i < 1500; i++) {
  const q = l.gen(); total++;
  const right = q.k === 'choice' ? q.o[q.a] : q.a;
  if (q.k === 'choice') { pos[l.id] = pos[l.id] || new Set(); pos[l.id].add(q.a); }
  if (/cod/.test(m.id) && q.t.includes('class="cmd"') && !q.v && !/ripeti|repeat/i.test(q.t)) bad(l.id, 'senza disegno', q);
  const g = q.v ? grid(q.v) : null;
  const robot = g && g.items['🤖'], star = g && g.items['⭐'];
  if (g && (!robot || !inside(robot, g))) bad(l.id, 'robot', q);
  if (l.id === 'percorso1' || (l.id === 'ripeti3' && q.k === 'choice')) {
    let list = cmdsIn(q.t);
    const rep = q.t.match(/(?:ripeti|repeat) (\d+)/i); if (rep) { const b = list; list = []; for (let k = 0; k < +rep[1]; k++) list.push(...b); }
    const end = go(robot, list);
    const hit = ['A', 'B', 'C', 'D'].filter(k => same(g.items[k], end));
    if (hit.length !== 1 || hit[0] !== right) bad(l.id, 'arrivo', { right, hit, t: q.t });
    if (!['A', 'B', 'C', 'D'].every(k => g.items[k] && inside(g.items[k], g) && !same(g.items[k], robot))) bad(l.id, 'lettere', q);
    let p = robot; for (const c of list) { p = go(p, [c]); if (!inside(p, g)) bad(l.id, 'esce dalla griglia', q.t); }
  } else if (l.id === 'ripeti3') {
    const rep = +q.t.match(/(?:ripeti|repeat) (\d+)/i)[1]; if (q.a !== rep * cmdsIn(q.t).length) bad(l.id, 'passi', q);
  } else if (l.id === 'freccia1') {
    const twice = /2 volte|twice/.test(q.t);
    const reached = q.o.filter(a => same(go(robot, twice ? [a, a] : [a]), star));
    if (reached.length !== 1 || reached[0] !== right) bad(l.id, 'freccia', q);
  } else if (l.id === 'percorso2') {
    const ok = q.o.filter(o => same(go(robot, o.split(' ')), star));
    if (ok.length !== 1 || ok[0] !== right) bad(l.id, 'percorso', { o: q.o, right });
  } else if (l.id === 'passi2') {
    if (q.a !== Math.abs(robot[0] - star[0]) + Math.abs(robot[1] - star[1])) bad(l.id, 'passi', q);
  } else if (l.id === 'errore3') {
    const list = cmdsIn(q.t); if (same(go(robot, list), star)) bad(l.id, 'già giusto', q);
    const fix = new Set(); list.forEach((a, j) => Object.keys(DIR).forEach(b => { if (b !== a) { const w = list.slice(); w[j] = b; if (same(go(robot, w), star)) fix.add(j); } }));
    const k = parseInt(right) - 1; if (fix.size !== 1 || !fix.has(k)) bad(l.id, 'errore', { fix: [...fix], right, t: q.t });
    if (q.o.length !== list.length) bad(l.id, 'opzioni', q);
  } else if (l.id === 'seallora4') {
    let x = +q.t.match(/(?:da|from) <b>(\d+)<\/b>/)[1]; const times = +q.t.match(/(\d+) (?:volte|times)/)[1];
    const f = /pari|even/.test(q.t) ? v => v % 2 ? v + 1 : v / 2 : /maggiore|greater/.test(q.t) ? v => v > 10 ? v - 4 : v + 7 : v => v % 10 ? v + 3 : v / 10;
    for (let k = 0; k < times; k++) x = f(x);
    if (q.a !== x || !Number.isInteger(x)) bad(l.id, 'regola', q);
  } else if (l.id === 'figure4') {
    const [, n, L, deg] = q.t.match(/(?:ripeti|repeat) (\d+)[^:]*: (?:avanti|forward) (\d+) cm, (?:gira a destra di|turn right) (\d+)°/).map(Number);
    if (n * deg !== 360) bad(l.id, 'angolo', q);
    if (q.k === 'num') { if (q.a !== n * L) bad(l.id, 'lunghezza', q); }
    else { const names = EN ? { 3: 'triangle', 4: 'square', 5: 'pentagon', 6: 'hexagon', 8: 'octagon' } : { 3: 'triangolo', 4: 'quadrato', 5: 'pentagono', 6: 'esagono', 8: 'ottagono' }; if (right !== names[n]) bad(l.id, 'figura', q); }
  } else if (l.id === 'variabili5') {
    // esegue il programma scritto nella domanda
    const lines = q.t.split('<br>').slice(0, -1).map(s => s.replace(/<\/?b>/g, '').replace(/−/g, '-').replace(/×/g, '*'));
    const env = {};
    const run = s => { const [v, e] = s.split(' = '); env[v.trim()] = Function(...Object.keys(env), 'return ' + e)(...Object.values(env)); };
    for (const s of lines) { const r = s.match(/^(?:ripeti|repeat) (\d+) (?:volte|times): (.*)$/); if (r) for (let k = 0; k < +r[1]; k++) run(r[2]); else run(s); }
    const v = /quanto vale (\w+)|what is (\w+)/i.exec(q.t); const name = v[1] || v[2];
    if (q.a !== env[name]) bad(l.id, 'variabile', { a: q.a, env, t: q.t });
  } else if (l.id === 'cicli5') {
    const N = +q.t.match(/(?:da 1 a|from 1 to) (\d+)/)[1], k = +q.t.match(/(?:divisibile per|divided by) (\d+)/)[1];
    let tot = 0, cnt = 0; for (let x = 1; x <= N; x++) if (x % k === 0) { tot += x; cnt++; }
    if (q.a !== (/conta|count/.test(q.t) ? cnt : tot)) bad(l.id, 'ciclo', q);
  } else bad(l.id, 'livello senza controllo', q.t);
}
for (const [id, s] of Object.entries(pos)) if (s.size < 3) bad(id, 'risposta giusta sempre nello stesso posto', [...s]);
console.log(`[${global.LANG}] ${total} domande di coding ricalcolate: ` + (fails ? fails + ' FALLITE' : 'TUTTE GIUSTE'));
process.exit(fails ? 1 : 0);
