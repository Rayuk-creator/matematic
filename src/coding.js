/* Coding e algoritmi (Nuove Indicazioni nazionali 2025: l'informatica dentro la matematica).
   Un modulo per classe, in italiano e in inglese: percorsi su una griglia, sequenze di comandi,
   ripetizioni, errori da trovare, «se… allora», figure disegnate con un ciclo, variabili. */
(function (root) {
  'use strict';
  function addCoding(W, H, EN) {
    const { lv, mod, choice, num, R, pick, shuffle, V } = H;
    const t = (it, en) => EN ? en : it;
    const W_ = n => W.find(w => w.n === n);
    const F = n => String(n);
    const DIR = { '↑': [0, -1], '↓': [0, 1], '←': [-1, 0], '→': [1, 0] };
    const ARROWS = Object.keys(DIR);
    const NAME = { '↑': t('su', 'up'), '↓': t('giù', 'down'), '←': t('sinistra', 'left'), '→': t('destra', 'right') };
    const cmd = c => `<span class="cmd">${c}</span>`;
    const cmds = list => `<span class="cmds">${list.map(cmd).join('')}</span>`;
    const inside = (p, c, r) => p[0] >= 0 && p[0] < c && p[1] >= 0 && p[1] < r;
    const go = (p, list) => list.reduce((q, c) => [q[0] + DIR[c][0], q[1] + DIR[c][1]], p);
    const same = (a, b) => a[0] === b[0] && a[1] === b[1];
    // percorso a caso dentro la griglia, senza tornare subito indietro
    function walk(start, n, c, r) {
      for (let g = 0; g < 200; g++) {
        const out = []; let p = start, ok = true;
        for (let i = 0; i < n; i++) {
          const back = out.length ? { '↑': '↓', '↓': '↑', '←': '→', '→': '←' }[out[out.length - 1]] : null;
          const opts = ARROWS.filter(a => a !== back && inside(go(p, [a]), c, r));
          if (!opts.length) { ok = false; break; }
          const a = pick(opts); out.push(a); p = go(p, [a]);
        }
        if (ok && !same(p, start)) return out;
      }
      return null;
    }
    const cell = (c, r) => [R(0, c - 1), R(0, r - 1)];
    const LET = ['A', 'B', 'C', 'D'];
    // opzioni sempre nello stesso ordine (A B C D, ↑ ↓ ← →, 1° 2° 3°…): la risposta giusta può stare ovunque
    const fixed = (q, opts, correct, extra) => ({ t: q, k: 'choice', o: opts, a: opts.indexOf(correct), ...extra });
    // domanda «dove arriva il robot?»: la casella giusta e tre caselle sbagliate, segnate con le lettere
    function whereQ(c, r, list, robot, intro, why) {
      const end = go(robot, list);
      const cand = [];
      const add = p => { if (inside(p, c, r) && !same(p, robot) && !cand.some(q => same(q, p))) cand.push(p); };
      add(end);
      // errori tipici: un comando dimenticato, destra e sinistra scambiate, su e giù scambiati
      add(go(robot, list.slice(0, -1)));
      add(go(robot, list.map(a => ({ '←': '→', '→': '←' }[a] || a))));
      add(go(robot, list.map(a => ({ '↑': '↓', '↓': '↑' }[a] || a))));
      add(go(robot, list.slice(1)));
      for (let g = 0; cand.length < 4 && g < 100; g++) add(cell(c, r));
      const four = [cand[0], ...shuffle(cand.slice(1)).slice(0, 3)];
      const order = shuffle(four);
      const marks = {}; order.forEach((p, i) => { marks[LET[i]] = p; });
      const right = LET[order.findIndex(p => same(p, end))];
      return fixed(intro, LET, right, { v: V.grid(c, r, { robot, marks }), x: why(right) });
    }
    const steps = (robot, list) => { let p = robot; return list.map(a => { p = go(p, [a]); return NAME[a]; }).join(', '); };

    /* ---------------- classe 1: il percorso del robot ---------------- */
    W_(1).modules.push(mod('c1cod', t('Coding', 'Coding'), '🤖', [
      lv('percorso1', t('Il percorso del robot', 'The robot\'s path'), t('Il robot esegue i comandi uno alla volta, nell\'ordine in cui sono scritti. Ogni freccia lo sposta di una casella: ↑ su, ↓ giù, ← a sinistra, → a destra.', 'The robot follows the commands one at a time, in the order they are written. Each arrow moves it one square: ↑ up, ↓ down, ← left, → right.'), () => {
        const c = 5, r = 4, robot = cell(c, r); const list = walk(robot, R(2, 3), c, r) || ['→'];
        if (!inside(go(robot, list), c, r)) return null;
        return whereQ(c, r, list, robot, t(`Il robot 🤖 esegue i comandi ${cmds(list)}. In quale casella arriva?`, `The robot 🤖 follows the commands ${cmds(list)}. Which square does it reach?`),
          right => t(`Muovi il robot una casella per volta: ${steps(robot, list)}. Arriva nella casella ${right}.`, `Move the robot one square at a time: ${steps(robot, list)}. It reaches square ${right}.`));
      }),
      lv('freccia1', t('Quale freccia?', 'Which arrow?'), t('Guarda dove si trova la stella rispetto al robot: sopra, sotto, a destra o a sinistra. La freccia indica la direzione in cui il robot si sposta.', 'Look at where the star is compared with the robot: above, below, to the right or to the left. The arrow shows the direction the robot moves in.'), () => {
        const c = 5, r = 4; let robot, a, star;
        do { robot = cell(c, r); a = pick(ARROWS); star = go(robot, [a]); } while (!inside(star, c, r));
        const n = Math.random() < 0.5 ? 1 : 2; const far = go(star, [a]);
        const two = n === 2 && inside(far, c, r);
        const goal = two ? far : star;
        return fixed(two ? t('Quale freccia deve usare il robot <b>2 volte</b> per arrivare sulla stella ⭐?', 'Which arrow must the robot use <b>twice</b> to reach the star ⭐?') : t('Quale comando porta il robot sulla stella ⭐?', 'Which command takes the robot to the star ⭐?'),
          ARROWS, a, { v: V.grid(c, r, { robot, star: goal }), x: t(`La stella è ${{ '↑': 'sopra', '↓': 'sotto', '←': 'a sinistra', '→': 'a destra' }[a]} il robot: serve la freccia ${a}${two ? ' due volte' : ''}.`, `The star is ${{ '↑': 'above', '↓': 'below', '←': 'to the left of', '→': 'to the right of' }[a]} the robot: it needs the ${a} arrow${two ? ' twice' : ''}.`) });
      }, 'palloncini'),
    ]));

    /* ---------------- classe 2: scrivere il percorso ---------------- */
    W_(2).modules.push(mod('c2cod', t('Coding', 'Coding'), '🤖', [
      lv('percorso2', t('Scrivere il percorso', 'Writing the path'), t('Un <b>algoritmo</b> è una serie di istruzioni in ordine. Per controllare un percorso, prova a eseguirlo: muovi il dito sulla griglia un comando alla volta.', 'An <b>algorithm</b> is a list of instructions in order. To check a path, try it out: move your finger on the grid one command at a time.'), () => {
        const c = 5, r = 4, robot = cell(c, r); const list = walk(robot, R(3, 4), c, r);
        if (!list) return null;
        const star = go(robot, list), wrong = [];
        for (let g = 0; wrong.length < 3 && g < 200; g++) {
          const w = list.slice(), i = R(0, w.length - 1);
          if (Math.random() < 0.5) w[i] = pick(ARROWS.filter(x => x !== w[i])); else { const j = R(0, w.length - 1); [w[i], w[j]] = [w[j], w[i]]; }
          const s = w.join(' ');
          if (!same(go(robot, w), star) && !wrong.includes(s) && s !== list.join(' ')) wrong.push(s);
        }
        if (wrong.length < 3) return null;
        return choice(t('Quale percorso porta il robot sulla stella ⭐?', 'Which path takes the robot to the star ⭐?'), list.join(' '), wrong,
          { v: V.grid(c, r, { robot, star }), x: t(`Con ${list.join(' ')} il robot va: ${steps(robot, list)}, e arriva sulla stella.`, `With ${list.join(' ')} the robot goes: ${steps(robot, list)}, and reaches the star.`) });
      }),
      lv('passi2', t('Il percorso più corto', 'The shortest path'), t('Il percorso più corto non torna mai indietro: conta quante caselle ci sono in orizzontale e quante in verticale, poi somma.', 'The shortest path never goes back: count how many squares there are across and how many up or down, then add them.'), () => {
        const c = 6, r = 5; let robot, star;
        do { robot = cell(c, r); star = cell(c, r); } while (Math.abs(robot[0] - star[0]) + Math.abs(robot[1] - star[1]) < 3);
        const dx = Math.abs(robot[0] - star[0]), dy = Math.abs(robot[1] - star[1]);
        return num(t('Quanti passi fa il robot per arrivare alla stella ⭐ con il percorso più corto?', 'How many steps does the robot take to reach the star ⭐ along the shortest path?'), dx + dy,
          { v: V.grid(c, r, { robot, star }), x: t(`${dx} ${dx === 1 ? 'passo' : 'passi'} in orizzontale e ${dy} in verticale: ${dx} + ${dy} = ${dx + dy}.`, `${dx} ${dx === 1 ? 'step' : 'steps'} across and ${dy} up or down: ${dx} + ${dy} = ${dx + dy}.`) });
      }),
    ]));

    /* ---------------- classe 3: ripetizioni ed errori ---------------- */
    W_(3).modules.push(mod('c3cod', t('Coding', 'Coding'), '🤖', [
      lv('ripeti3', t('Le ripetizioni', 'Repeats'), t('<b>Ripeti 3 volte</b> vuol dire eseguire gli stessi comandi 3 volte di seguito. «Ripeti 2 volte: → ↑» è uguale a → ↑ → ↑.', '<b>Repeat 3 times</b> means doing the same commands 3 times in a row. “Repeat 2 times: → ↑” is the same as → ↑ → ↑.'), () => {
        const c = 7, r = 5;
        for (let g = 0; g < 100; g++) {
          const n = R(2, 3), body = [pick(ARROWS)]; if (Math.random() < 0.7) body.push(pick(ARROWS.filter(a => a !== { '↑': '↓', '↓': '↑', '←': '→', '→': '←' }[body[0]])));
          const full = []; for (let i = 0; i < n; i++) full.push(...body);
          const robot = cell(c, r); let p = robot, ok = true;
          for (const a of full) { p = go(p, [a]); if (!inside(p, c, r)) { ok = false; break; } }
          if (!ok || same(p, robot)) continue;
          if (Math.random() < 0.4) return num(t(`Il robot esegue: <b>ripeti ${n} volte</b> ${cmds(body)}. Quanti passi fa in tutto?`, `The robot runs: <b>repeat ${n} times</b> ${cmds(body)}. How many steps does it take altogether?`), n * body.length,
            { x: t(`Ogni ripetizione fa ${body.length} ${body.length === 1 ? 'passo' : 'passi'}: ${body.length} × ${n} = ${n * body.length}.`, `Each repeat is ${body.length} ${body.length === 1 ? 'step' : 'steps'}: ${body.length} × ${n} = ${n * body.length}.`) });
          return whereQ(c, r, full, robot, t(`Il robot esegue: <b>ripeti ${n} volte</b> ${cmds(body)}. In quale casella arriva?`, `The robot runs: <b>repeat ${n} times</b> ${cmds(body)}. Which square does it reach?`),
            right => t(`Ripetere ${n} volte ${body.join(' ')} vuol dire ${full.join(' ')}. Il robot arriva nella casella ${right}.`, `Repeating ${body.join(' ')} ${n} times means ${full.join(' ')}. The robot reaches square ${right}.`));
        }
        return null;
      }),
      lv('errore3', t('Trova l\'errore', 'Find the bug'), t('Quando un programma non funziona si cerca l\'errore (in inglese <i>bug</i>): si eseguono i comandi uno alla volta e si guarda dove il robot smette di andare verso la meta.', 'When a program doesn\'t work, you look for the mistake, called a <b>bug</b>: run the commands one at a time and see where the robot stops heading for the goal.'), () => {
        const c = 6, r = 5;
        for (let g = 0; g < 300; g++) {
          const robot = cell(c, r), list = walk(robot, R(4, 5), c, r); if (!list) continue;
          const star = go(robot, list), i = R(0, list.length - 1), bad = list.slice();
          bad[i] = pick(ARROWS.filter(a => a !== list[i]));
          const end = go(robot, bad); if (same(end, star)) continue;
          // l'errore deve essere uno solo: nessun'altra posizione, cambiata, sistema il programma
          const fix = new Set();
          bad.forEach((a, j) => ARROWS.forEach(b => { if (b !== a) { const w = bad.slice(); w[j] = b; if (same(go(robot, w), star)) fix.add(j); } }));
          if (fix.size !== 1 || !fix.has(i)) continue;
          const ord = k => t(`${k + 1}° comando`, ['1st', '2nd', '3rd', '4th', '5th'][k] + ' command');
          return fixed(t(`Il programma ${cmds(bad)} doveva portare il robot sulla stella ⭐, ma c'è un errore. Quale comando è sbagliato?`, `The program ${cmds(bad)} should take the robot to the star ⭐, but there is a bug. Which command is wrong?`),
            bad.map((_, k) => ord(k)), ord(i), { v: V.grid(c, r, { robot, star }), x: t(`Il ${i + 1}° comando dovrebbe essere ${list[i]} e non ${bad[i]}: il programma giusto è ${list.join(' ')}.`, `The ${ord(i).replace(' command', '')} command should be ${list[i]}, not ${bad[i]}: the right program is ${list.join(' ')}.`) });
        }
        return null;
      }),
    ]));

    /* ---------------- classe 4: se… allora, figure con un ciclo ---------------- */
    const RULES = [
      { it: 'se il numero è pari, dividilo per 2; altrimenti aggiungi 1', en: 'if the number is even, divide it by 2; otherwise add 1', f: n => n % 2 ? n + 1 : n / 2, w: n => n % 2 ? t(`${n} è dispari: ${n} + 1 = ${n + 1}`, `${n} is odd: ${n} + 1 = ${n + 1}`) : t(`${n} è pari: ${n} : 2 = ${n / 2}`, `${n} is even: ${n} ÷ 2 = ${n / 2}`), start: () => R(10, 60) },
      { it: 'se il numero è maggiore di 10, togli 4; altrimenti aggiungi 7', en: 'if the number is greater than 10, take away 4; otherwise add 7', f: n => n > 10 ? n - 4 : n + 7, w: n => n > 10 ? t(`${n} è maggiore di 10: ${n} − 4 = ${n - 4}`, `${n} is greater than 10: ${n} − 4 = ${n - 4}`) : t(`${n} non è maggiore di 10: ${n} + 7 = ${n + 7}`, `${n} is not greater than 10: ${n} + 7 = ${n + 7}`), start: () => R(3, 25) },
      { it: 'se il numero finisce con 0, dividilo per 10; altrimenti aggiungi 3', en: 'if the number ends in 0, divide it by 10; otherwise add 3', f: n => n % 10 ? n + 3 : n / 10, w: n => n % 10 ? t(`${n} non finisce con 0: ${n} + 3 = ${n + 3}`, `${n} does not end in 0: ${n} + 3 = ${n + 3}`) : t(`${n} finisce con 0: ${n} : 10 = ${n / 10}`, `${n} ends in 0: ${n} ÷ 10 = ${n / 10}`), start: () => R(1, 9) * 10 + pick([0, 0, 1, 4, 7]) },
    ];
    const SHAPES = [[3, 120, 'triangolo', 'triangle'], [4, 90, 'quadrato', 'square'], [5, 72, 'pentagono', 'pentagon'], [6, 60, 'esagono', 'hexagon'], [8, 45, 'ottagono', 'octagon']];
    W_(4).modules.push(mod('c4cod', t('Coding', 'Coding'), '🤖', [
      lv('seallora4', t('Se… allora… altrimenti', 'If… then… otherwise'), t('Con <b>se… allora… altrimenti</b> un programma sceglie che cosa fare: controlla la condizione e, se è vera, fa la prima cosa; se è falsa, fa la seconda.', 'With <b>if… then… otherwise</b> a program chooses what to do: it checks the condition and, if it is true, does the first thing; if it is false, it does the second.'), () => {
        const rule = pick(RULES), k = R(2, 3); let n = rule.start(); const s = n, why = [];
        for (let i = 0; i < k; i++) { why.push(rule.w(n)); n = rule.f(n); }
        return num(t(`Una macchina dei numeri segue questa regola: <b>${rule.it}</b>. Si parte da <b>${s}</b> e la macchina lavora ${k} volte di seguito. Che numero esce alla fine?`, `A number machine follows this rule: <b>${rule.en}</b>. It starts from <b>${s}</b> and works ${k} times in a row. What number comes out at the end?`), n,
          { x: why.join('; ') + '.' });
      }),
      lv('figure4', t('Disegnare con un ciclo', 'Drawing with a loop'), t('Un robot che disegna può ripetere «avanti, poi gira». Se gira sempre dello stesso angolo e alla fine ha fatto un giro completo (360°), disegna un poligono regolare: il numero di ripetizioni è il numero dei lati.', 'A drawing robot can repeat “forward, then turn”. If it always turns by the same angle and ends up turning all the way round (360°), it draws a regular polygon: the number of repeats is the number of sides.'), () => {
        const [n, deg, it, en] = pick(SHAPES), L = R(2, 9);
        const prog = t(`<b>ripeti ${n} volte</b>: avanti ${L} cm, gira a destra di ${deg}°`, `<b>repeat ${n} times</b>: forward ${L} cm, turn right ${deg}°`);
        if (Math.random() < 0.5) return choice(t(`Un robot esegue: ${prog}. Che figura disegna?`, `A robot runs: ${prog}. What shape does it draw?`), t(it, en), SHAPES.filter(s => s[0] !== n).map(s => t(s[2], s[3])),
          { x: t(`Ripete ${n} volte, quindi la figura ha ${n} lati uguali; ${n} × ${deg}° = 360°, un giro completo: è un ${it}.`, `It repeats ${n} times, so the shape has ${n} equal sides; ${n} × ${deg}° = 360°, a full turn: it is a ${en}.`) });
        return num(t(`Un robot esegue: ${prog}. Quanti centimetri è lunga la linea che disegna?`, `A robot runs: ${prog}. How many centimetres long is the line it draws?`), n * L,
          { unit: 'cm', x: t(`${n} lati da ${L} cm: ${L} × ${n} = ${n * L} cm (è il perimetro del ${it}).`, `${n} sides of ${L} cm: ${L} × ${n} = ${n * L} cm (the perimeter of the ${en}).`) });
      }),
    ]));

    /* ---------------- classe 5: variabili e cicli con condizioni ---------------- */
    W_(5).modules.push(mod('c5cod', t('Coding', 'Coding'), '🤖', [
      lv('variabili5', t('Le variabili', 'Variables'), t('Una <b>variabile</b> è una scatola con un nome che contiene un valore. L\'istruzione «x = x + 2» vuol dire: prendi il valore di x, aggiungi 2 e rimetti il risultato in x.', 'A <b>variable</b> is a box with a name that holds a value. The instruction “x = x + 2” means: take the value of x, add 2 and put the result back in x.'), () => {
        const kind = R(0, 2);
        if (kind === 0) { const a = R(0, 20), b = R(2, 9), n = R(3, 8); return num(t(`x = ${a}<br><b>ripeti ${n} volte</b>: x = x + ${b}<br>Quanto vale x alla fine?`, `x = ${a}<br><b>repeat ${n} times</b>: x = x + ${b}<br>What is x at the end?`), a + n * b, { x: t(`x aumenta di ${b} per ${n} volte: ${a} + ${b} × ${n} = ${a + n * b}.`, `x goes up by ${b}, ${n} times: ${a} + ${b} × ${n} = ${a + n * b}.`) }); }
        if (kind === 1) { const a = R(1, 6), n = R(2, 5); const vals = [a]; for (let i = 0; i < n; i++) vals.push(vals[vals.length - 1] * 2); return num(t(`x = ${a}<br><b>ripeti ${n} volte</b>: x = x × 2<br>Quanto vale x alla fine?`, `x = ${a}<br><b>repeat ${n} times</b>: x = x × 2<br>What is x at the end?`), vals[n], { x: t(`x raddoppia ogni volta: ${vals.join(' → ')}.`, `x doubles every time: ${vals.join(' → ')}.`) }); }
        const a = R(2, 15), b = R(2, 15), s = a + b;
        return num(t(`a = ${a}<br>b = ${b}<br>a = a + b<br>b = a − b<br>Quanto vale b alla fine?`, `a = ${a}<br>b = ${b}<br>a = a + b<br>b = a − b<br>What is b at the end?`), a,
          { x: t(`Dopo «a = a + b», a vale ${a} + ${b} = ${s}. Poi «b = a − b»: ${s} − ${b} = ${a}.`, `After “a = a + b”, a is ${a} + ${b} = ${s}. Then “b = a − b”: ${s} − ${b} = ${a}.`) });
      }),
      lv('cicli5', t('Cicli e condizioni', 'Loops and conditions'), t('Un <b>ciclo</b> ripete le istruzioni per ogni numero di un elenco; dentro il ciclo una <b>condizione</b> decide se fare qualcosa. Per seguirlo, scrivi i passaggi uno sotto l\'altro.', 'A <b>loop</b> repeats the instructions for each number in a list; inside the loop a <b>condition</b> decides whether to do something. To follow it, write the steps down one under the other.'), () => {
        const N = R(10, 30), k = R(2, 5), mult = []; for (let i = k; i <= N; i += k) mult.push(i);
        if (Math.random() < 0.5) return num(t(`totale = 0<br><b>per ogni numero da 1 a ${N}</b>: se il numero è divisibile per ${k}, totale = totale + il numero<br>Quanto vale totale alla fine?`, `total = 0<br><b>for each number from 1 to ${N}</b>: if the number can be divided by ${k}, total = total + the number<br>What is total at the end?`), mult.reduce((s, v) => s + v, 0),
          { x: t(`I numeri divisibili per ${k} sono ${mult.join(', ')}: ${mult.join(' + ')} = ${mult.reduce((s, v) => s + v, 0)}.`, `The numbers that can be divided by ${k} are ${mult.join(', ')}: ${mult.join(' + ')} = ${mult.reduce((s, v) => s + v, 0)}.`) });
        return num(t(`conta = 0<br><b>per ogni numero da 1 a ${N}</b>: se il numero è divisibile per ${k}, conta = conta + 1<br>Quanto vale conta alla fine?`, `count = 0<br><b>for each number from 1 to ${N}</b>: if the number can be divided by ${k}, count = count + 1<br>What is count at the end?`), mult.length,
          { x: t(`I numeri divisibili per ${k} sono ${mult.join(', ')}: ${mult.length === 1 ? 'è 1 numero' : 'sono ' + mult.length + ' numeri'}.`, `The numbers that can be divided by ${k} are ${mult.join(', ')}: that is ${mult.length} ${mult.length === 1 ? 'number' : 'numbers'}.`) });
      }),
    ]));
    // i generatori che a volte non trovano un esercizio adatto riprovano da soli; niente calcoli in colonna: qui conta il ragionamento
    for (const w of W) for (const m of w.modules) if (/cod$/.test(m.id)) for (const l of m.levels) { const g = l.gen; l.gen = () => { for (let i = 0; i < 50; i++) { const q = g(); if (q) { q.noCalc = true; q.plain = true; return q; } } throw new Error('coding: nessuna domanda'); }; }
  }
  root.Coding = addCoding;
  if (typeof module !== 'undefined') module.exports = addCoding;
})(typeof window !== 'undefined' ? window : globalThis);
