/* Calcoli in colonna passo per passo: addizione (riporti), sottrazione (prestiti), moltiplicazione
   (riporti e prodotti parziali), divisione con il metodo italiano (resti sotto il dividendo) oppure,
   nella versione inglese, con la «long division» (quoziente sopra, prodotti e sottrazioni sotto).
   Ogni funzione restituisce una lista di fotogrammi: { cols, rows, cells: [{r, c, t, k}], note, hl, lines, marks } */
(function (root) {
  'use strict';
  const en = () => root.LANG === 'en';
  const L = (it, eng) => en() ? eng : it;
  const PLACE_IT = { '-3': 'millesimi', '-2': 'centesimi', '-1': 'decimi', 0: 'unità', 1: 'decine', 2: 'centinaia', 3: 'migliaia', 4: 'decine di migliaia', 5: 'centinaia di migliaia', 6: 'milioni' };
  const PLACE_EN = { '-3': 'thousandths', '-2': 'hundredths', '-1': 'tenths', 0: 'ones', 1: 'tens', 2: 'hundreds', 3: 'thousands', 4: 'ten thousands', 5: 'hundred thousands', 6: 'millions' };
  const ONE_IT = { '-3': 'millesimo', '-2': 'centesimo', '-1': 'decimo', 0: 'unità', 1: 'decina', 2: 'centinaio', 3: 'migliaio', 4: 'decina di migliaia', 5: 'centinaio di migliaia', 6: 'milione' };
  const ONE_EN = { '-3': 'thousandth', '-2': 'hundredth', '-1': 'tenth', 0: 'one', 1: 'ten', 2: 'hundred', 3: 'thousand', 4: 'ten thousand', 5: 'hundred thousand', 6: 'million' };
  const place = p => (en() ? PLACE_EN : PLACE_IT)[p] || L('cifre', 'digits');
  const placeOne = p => (en() ? ONE_EN : ONE_IT)[p] || L('unità', 'one');
  const rev = n => String(n).split('').reverse().map(Number);
  // un intero scalato con dec cifre decimali, scritto all'italiana (12.345,6) o all'inglese (12,345.6)
  function fmt(k, dec) {
    const TH = L('.', ','), DP = L(',', '.');
    const neg = k < 0; const s = String(Math.abs(k)).padStart(dec + 1, '0');
    let ip = dec ? s.slice(0, -dec) : s, fp = dec ? s.slice(-dec) : '';
    ip = ip.replace(/\B(?=(\d{3})+(?!\d))/g, TH);
    fp = fp.replace(/0+$/, '');
    return (neg ? '−' : '') + ip + (fp ? DP + fp : '');
  }
  const posCls = p => p < 0 ? 'dec' : ['u', 'da', 'h', 'k', 'k', 'k', 'mi', 'mi', 'mi'][p] || 'g';
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  // griglia con le colonne delle cifre: posizione k (0 = cifra più a destra) → colonna
  function grid(Wd, dec, lead = 1) {
    const colOf = k => lead + (Wd - 1 - k) + (k < dec ? 1 : 0);
    const commaCol = dec ? lead + (Wd - dec) : -1;
    return { colOf, commaCol, cols: lead + Wd + (dec ? 1 : 0) };
  }
  function snapshot(st, note, hl) { return { cols: st.cols, rows: st.rows, cells: st.cells.map(c => ({ ...c })), note, hl, lines: st.lines ? st.lines.slice() : [], marks: st.marks ? st.marks.map(m => ({ ...m })) : [], layout: st.layout || '' }; }
  const put = (st, r, c, t, k = '') => { st.cells = st.cells.filter(x => !(x.r === r && x.c === c)); if (t !== null && t !== undefined && t !== '') st.cells.push({ r, c, t: String(t), k }); };
  const sep = () => L(',', '.');

  /* ---------------- addizione ---------------- */
  function addition(a, b, dec = 0, more = []) {
    const nums = [a, b, ...more], N = nums.length;
    const Ds = nums.map(rev), sum = nums.reduce((x, y) => x + y, 0), S = rev(sum);
    const Wd = Math.max(...Ds.map(D => D.length), S.length, dec + 1);
    const g = grid(Wd, dec);
    const resR = N + 2;
    const st = { cols: g.cols, rows: resR + 1, cells: [], lines: [N + 1] };
    const row = (r, D) => { for (let k = 0; k < Math.max(D.length, dec + 1); k++) { const d = D[k] !== undefined ? D[k] : 0; put(st, r, g.colOf(k), d, 'd-' + posCls(k - dec) + (k >= D.length ? ' pad' : '')); } if (dec) put(st, r, g.commaCol, sep(), 'comma'); };
    Ds.forEach((D, i) => row(i + 1, D)); put(st, N, 0, '+', 'op');
    const frames = [snapshot(st, dec
      ? L('Incolonno i numeri: <b>virgola sotto virgola</b>, unità sotto unità, decine sotto decine. Dove mancano cifre decimali metto gli zeri.', 'Line up the numbers: <b>decimal point under decimal point</b>, ones under ones, tens under tens. Where decimal places are missing, write zeros.')
      : L('Incolonno i numeri: <b>unità sotto unità</b>, decine sotto decine, centinaia sotto centinaia. Si parte dalla colonna di destra.', 'Line up the numbers: <b>ones under ones</b>, tens under tens, hundreds under hundreds. Start from the right-hand column.'), -1)];
    let carry = 0;
    const n = Math.max(...Ds.map(D => D.length), dec);
    for (let k = 0; k < n; k++) {
      const xs = Ds.map(D => D[k] || 0), s = xs.reduce((x, y) => x + y, 0) + carry;
      const p = k - dec;
      put(st, resR, g.colOf(k), s % 10, 'd-' + posCls(p) + ' res');
      let note = `<b>${cap(place(p))}</b>: ${xs.join(' + ')}${carry ? ' + ' + carry + L(' (riporto)', ' (carried)') : ''} = ${s}.`;
      const c = Math.floor(s / 10);
      if (c) { note += L(` Scrivo <b>${s % 10}</b> e <b>riporto ${c}</b> alle ${place(p + 1)}.`, ` Write <b>${s % 10}</b> and <b>carry ${c}</b> to the ${place(p + 1)}.`); put(st, 0, g.colOf(k + 1), c, 'carry'); }
      else note += L(` Scrivo <b>${s}</b>.`, ` Write <b>${s}</b>.`);
      if (k === dec - 1 && dec) note += L(' Poi metto la virgola sotto le altre virgole.', ' Then put the decimal point in line with the other decimal points.');
      carry = c;
      if (dec && k === dec - 1) put(st, resR, g.commaCol, sep(), 'comma');
      frames.push(snapshot(st, note, g.colOf(k)));
    }
    if (carry) { put(st, resR, g.colOf(n), carry, 'd-' + posCls(n - dec) + ' res'); frames.push(snapshot(st, L(`Il riporto ${carry} non ha più niente da sommare: lo scrivo nel risultato come <b>${place(n - dec)}</b>.`, `The carried ${carry} has nothing left to add to: write it in the answer, in the <b>${place(n - dec)}</b> column.`), g.colOf(n))); }
    frames.push(snapshot(st, `${L('Risultato', 'Answer')}: ${nums.map(x => fmt(x, dec)).join(' + ')} = <b>${fmt(sum, dec)}</b>.`, -1));
    return frames;
  }

  /* ---------------- sottrazione (con il prestito) ---------------- */
  function subtraction(a, b, dec = 0) {
    const A = rev(a), B = rev(b), diff = a - b;
    const Wd = Math.max(A.length, B.length, dec + 1);
    const g = grid(Wd, dec);
    const st = { cols: g.cols, rows: 5, cells: [], lines: [3] };
    const cur = A.slice();
    while (cur.length < Wd) cur.push(0);
    for (let k = 0; k < Math.max(A.length, dec); k++) put(st, 1, g.colOf(k), A[k] !== undefined ? A[k] : 0, 'd-' + posCls(k - dec) + (k >= A.length ? ' pad' : ''));
    for (let k = 0; k < Math.max(B.length, dec); k++) put(st, 2, g.colOf(k), B[k] !== undefined ? B[k] : 0, 'd-' + posCls(k - dec) + (k >= B.length ? ' pad' : ''));
    if (dec) { put(st, 1, g.commaCol, sep(), 'comma'); put(st, 2, g.commaCol, sep(), 'comma'); }
    put(st, 2, 0, '−', 'op');
    const frames = [snapshot(st, (dec
      ? L('Incolonno: <b>virgola sotto virgola</b>; dove mancano cifre decimali metto gli zeri. ', 'Line up: <b>decimal point under decimal point</b>; where decimal places are missing, write zeros. ')
      : L('Incolonno: <b>unità sotto unità</b>. ', 'Line up: <b>ones under ones</b>. ')) + L('Il numero più grande sta sopra. Si parte da destra.', 'The bigger number goes on top. Start from the right.'), -1)];
    const n = Math.max(A.length, dec);
    const strike = k => { const c = st.cells.find(x => x.r === 1 && x.c === g.colOf(k)); if (c && !/struck/.test(c.k)) c.k += ' struck'; };
    for (let k = 0; k < n; k++) {
      const y = B[k] || 0, p = k - dec;
      let note = '';
      if (cur[k] < y) {
        // prestito: si cerca a sinistra la prima cifra diversa da 0
        let j = k + 1; while (cur[j] === 0) j++;
        cur[j] -= 1; strike(j); put(st, 0, g.colOf(j), cur[j], 'borrow');
        for (let m = j - 1; m > k; m--) { cur[m] = 9; strike(m); put(st, 0, g.colOf(m), 9, 'borrow'); }
        const before = cur[k];
        cur[k] += 10; strike(k); put(st, 0, g.colOf(k), cur[k], 'borrow');
        note = L(`<b>${cap(place(p))}</b>: ${before} − ${y} non si può. `, `<b>${cap(place(p))}</b>: you can't take ${y} from ${before}. `);
        if (j === k + 1) note += L(`Chiedo in prestito 1 ${placeOne(p + 1)} alle ${place(p + 1)} (che diventano ${cur[j]}): 1 ${placeOne(p + 1)} = 10 ${place(p)}, quindi ho ${cur[k]} ${place(p)}. `,
          `Borrow 1 ${placeOne(p + 1)} from the ${place(p + 1)} (they become ${cur[j]}): 1 ${placeOne(p + 1)} = 10 ${place(p)}, so now you have ${cur[k]} ${place(p)}. `);
        else note += L(`Le ${place(p + 1)} sono 0: chiedo alle ${place(j - dec)} (che diventano ${cur[j]}); gli zeri in mezzo diventano 9 e qui ho ${cur[k]}. `,
          `The ${place(p + 1)} digit is 0, so borrow from the ${place(j - dec)} (they become ${cur[j]}); the zeros in between become 9s and here you have ${cur[k]}. `);
        note += `${cur[k]} − ${y} = <b>${cur[k] - y}</b>.`;
      } else note = `<b>${cap(place(p))}</b>: ${cur[k]} − ${y} = <b>${cur[k] - y}</b>.`;
      const dgt = cur[k] - y;
      put(st, 4, g.colOf(k), dgt, 'd-' + posCls(p) + ' res');
      if (dec && k === dec - 1) put(st, 4, g.commaCol, sep(), 'comma');
      frames.push(snapshot(st, note, g.colOf(k)));
    }
    // gli zeri a sinistra del risultato non si scrivono
    const Ld = String(diff).length;
    for (let k = Math.max(Ld, dec + 1); k < n; k++) st.cells = st.cells.filter(x => !(x.r === 4 && x.c === g.colOf(k)));
    frames.push(snapshot(st, L(`Risultato: ${fmt(a, dec)} − ${fmt(b, dec)} = <b>${fmt(diff, dec)}</b>. Prova: ${fmt(diff, dec)} + ${fmt(b, dec)} = ${fmt(a, dec)}.`,
      `Answer: ${fmt(a, dec)} − ${fmt(b, dec)} = <b>${fmt(diff, dec)}</b>. Check: ${fmt(diff, dec)} + ${fmt(b, dec)} = ${fmt(a, dec)}.`), -1));
    return frames;
  }

  /* ---------------- moltiplicazione ---------------- */
  function multiplication(a, b, decA = 0, decB = 0) {
    const A = rev(a), B = rev(b), prod = a * b;
    const m = B.length;
    const Wd = Math.max(String(prod).length, A.length, B.length);
    const g = grid(Wd, 0);
    const resRow = m > 1 ? 3 + m + 1 : 4;
    const st = { cols: g.cols, rows: resRow + 1, cells: [], lines: m > 1 ? [3, 3 + m] : [3] };
    A.forEach((d, k) => put(st, 1, g.colOf(k), d, 'd-' + posCls(k)));
    B.forEach((d, k) => put(st, 2, g.colOf(k), d, 'd-' + posCls(k)));
    put(st, 2, 0, '×', 'op');
    const frames = [snapshot(st, m > 1
      ? L(`Moltiplico ${a} per ogni cifra di ${b}, partendo dalle unità; poi sommo i risultati parziali.`, `Multiply ${a} by each digit of ${b}, starting with the ones; then add up the partial products.`)
      : L(`Moltiplico la cifra ${b} per ogni cifra di ${a}, partendo dalle unità.`, `Multiply each digit of ${a} by ${b}, starting with the ones.`), -1)];
    const partials = [];
    for (let j = 0; j < m; j++) {
      const r = m > 1 ? 3 + j : 4;
      const bj = B[j];
      // si cancellano i riporti della riga precedente
      st.cells = st.cells.filter(x => x.r !== 0);
      if (j > 0) {
        // segnaposto: trattino nella versione italiana, zero in quella inglese
        for (let z = 0; z < j; z++) put(st, r, g.colOf(z), L('–', '0'), 'pad');
        frames.push(snapshot(st, L(`Ora moltiplico per la cifra delle <b>${place(j)}</b> (${bj}). Scrivo un trattino al posto ${j === 1 ? 'delle unità' : 'delle ultime ' + j + ' cifre'}: ogni risultato si sposta di ${j === 1 ? 'un posto' : j + ' posti'} a sinistra.`,
          `Now multiply by the <b>${place(j)}</b> digit (${bj}). Write ${j === 1 ? 'a <b>0</b> in the ones column' : '<b>0</b> in the last ' + j + ' columns'} as a placeholder: every result moves ${j === 1 ? 'one place' : j + ' places'} to the left.`), -1));
      }
      let carry = 0;
      for (let i = 0; i < A.length; i++) {
        const pr = A[i] * bj + carry;
        put(st, r, g.colOf(i + j), pr % 10, (m > 1 ? '' : 'd-' + posCls(i + j)) + ' res');
        let note = `${bj} × ${A[i]} = ${A[i] * bj}${carry ? L(', più il riporto ' + carry + ' = ' + pr, ', plus the carried ' + carry + ' = ' + pr) : ''}.`;
        if (i < A.length - 1) {
          if (pr >= 10) { note += L(` Scrivo <b>${pr % 10}</b> e riporto <b>${Math.floor(pr / 10)}</b>.`, ` Write <b>${pr % 10}</b> and carry <b>${Math.floor(pr / 10)}</b>.`); put(st, 0, g.colOf(i + j + 1), Math.floor(pr / 10), 'carry'); }
          else { note += L(` Scrivo <b>${pr}</b>.`, ` Write <b>${pr}</b>.`); st.cells = st.cells.filter(x => !(x.r === 0 && x.c === g.colOf(i + j + 1))); }
          carry = Math.floor(pr / 10);
          frames.push(snapshot(st, note, g.colOf(i + j)));
        } else {
          // ultima cifra: si scrive tutto il numero
          if (pr >= 10) put(st, r, g.colOf(i + j + 1), Math.floor(pr / 10), (m > 1 ? '' : 'd-' + posCls(i + j + 1)) + ' res');
          note += L(` È l'ultima cifra: scrivo <b>${pr}</b>.`, ` It's the last digit: write <b>${pr}</b>.`);
          frames.push(snapshot(st, note, g.colOf(i + j)));
        }
      }
      partials.push(a * bj);
    }
    if (m > 1) {
      st.cells = st.cells.filter(x => x.r !== 0);
      frames.push(snapshot(st, L('Ora sommo i risultati parziali in colonna (i trattini valgono 0).', 'Now add up the partial products, column by column.'), -1));
      let carry = 0;
      const P = partials.map((v, j) => rev(v * Math.pow(10, j)));
      const n = String(prod).length;
      for (let k = 0; k < n; k++) {
        const ds = P.map(x => x[k] || 0);
        const s = ds.reduce((x, y) => x + y, 0) + carry;
        put(st, resRow, g.colOf(k), s % 10, 'd-' + posCls(k) + ' res');
        let note = `<b>${cap(place(k))}</b>: ${ds.join(' + ')}${carry ? ' + ' + carry + L(' (riporto)', ' (carried)') : ''} = ${s}.`;
        if (k === n - 1) note += L(` Scrivo <b>${s}</b>.`, ` Write <b>${s}</b>.`);
        else if (s >= 10) { note += L(` Scrivo <b>${s % 10}</b> e riporto <b>${Math.floor(s / 10)}</b>.`, ` Write <b>${s % 10}</b> and carry <b>${Math.floor(s / 10)}</b>.`); put(st, 0, g.colOf(k + 1), Math.floor(s / 10), 'carry'); }
        else note += L(` Scrivo <b>${s}</b>.`, ` Write <b>${s}</b>.`);
        carry = Math.floor(s / 10);
        frames.push(snapshot(st, note, g.colOf(k)));
      }
    }
    const dec = decA + decB;
    if (dec) frames.push(snapshot(st, L(`Ho moltiplicato senza virgole: ${fmt(a, 0)} × ${fmt(b, 0)} = ${fmt(prod, 0)}. I fattori hanno in tutto ${dec} cifr${dec === 1 ? 'a' : 'e'} decimal${dec === 1 ? 'e' : 'i'}, quindi nel risultato conto ${dec} cifr${dec === 1 ? 'a' : 'e'} da destra e metto la virgola: <b>${fmt(prod, dec)}</b>.`,
      `Ignoring the decimal points: ${fmt(a, 0)} × ${fmt(b, 0)} = ${fmt(prod, 0)}. Together the factors have ${dec} decimal place${dec === 1 ? '' : 's'}, so count ${dec} digit${dec === 1 ? '' : 's'} from the right of the answer and put the decimal point there: <b>${fmt(prod, dec)}</b>.`), -1));
    else frames.push(snapshot(st, `${L('Risultato', 'Answer')}: ${fmt(a, 0)} × ${fmt(b, 0)} = <b>${fmt(prod, 0)}</b>.`, -1));
    return frames;
  }

  // nota iniziale quando dividendo e divisore sono stati moltiplicati per togliere la virgola
  const shiftNote = (a, d, shift, decA) => !shift ? '' : L(`Il divisore ha la virgola: moltiplico dividendo e divisore per ${fmt(Math.pow(10, shift), 0)}, così ${fmt(a, decA + shift)} : ${fmt(d, shift)} diventa ${fmt(a, decA)} : ${fmt(d, 0)} (il risultato non cambia). `,
    `The divisor has a decimal point: multiply both numbers by ${fmt(Math.pow(10, shift), 0)}, so ${fmt(a, decA + shift)} ÷ ${fmt(d, shift)} becomes ${fmt(a, decA)} ÷ ${fmt(d, 0)} (the answer doesn't change). `);

  /* Il calcolo della divisione, uguale per i due metodi: le cifre del dividendo (con eventuali decimali),
     il primo gruppo, le cifre del quoziente per posizione e il testo del quoziente con la virgola. */
  function divCore(a, d, decA) {
    const S = String(a).padStart(decA + 1, '0'), nd = S.length, intLen = nd - decA;
    let end = 0, cur = +S[0];
    while (cur < d && end < nd - 1) { end++; cur = cur * 10 + +S[end]; }
    const qDig = {};
    // testo del quoziente fino alla posizione «last»
    const qText = last => {
      const ip = end0 < intLen ? Array.from({ length: Math.min(last, intLen - 1) - end0 + 1 }, (_, k) => qDig[end0 + k] ?? '').join('') : '0';
      let dp = '';
      for (let p = intLen; p <= last; p++) dp += p < end0 ? '0' : (qDig[p] ?? '');
      return ip + (last >= intLen ? sep() + dp : '');
    };
    const end0 = end;
    return { S, nd, intLen, end, cur, qDig, qText };
  }

  /* ---------------- divisione (metodo italiano) ---------------- */
  function division(a, d, maxDec = 0, shift = 0, decA = 0) {
    if (en()) return longDivision(a, d, maxDec, shift, decA);
    const C = divCore(a, d, decA), { S, nd, intLen, qDig, qText } = C;
    let { end, cur } = C;
    const extra = maxDec;
    const rc = nd + extra + 2; // colonna di inizio del divisore e del quoziente
    const st = { cols: rc + Math.max(String(d).length, intLen + decA + extra + 3) + 1, rows: 2, cells: [], lines: [], layout: 'it' };
    for (let i = 0; i < nd; i++) put(st, 0, i, S[i], 'dv d-' + posCls(intLen - 1 - i) + (decA && i === intLen - 1 ? ' commaR' : ''));
    String(d).split('').forEach((c, i) => put(st, 0, rc + i, c, 'dvs'));
    // le linee della divisione: verticale prima del divisore, orizzontale sotto il divisore
    const lines = () => { st.marks = []; for (let r = 0; r < st.rows; r++) st.marks.push({ r, c: rc, k: 'vbar' }); for (let c = rc; c < st.cols; c++) st.marks.push({ r: 0, c, k: 'hbar' }); };
    lines();
    const A = fmt(a, decA), Dv = fmt(d, 0);
    const frames = [snapshot(st, shiftNote(a, d, shift, decA) + `Divido ${A} per ${Dv}. Il dividendo sta a sinistra, il divisore a destra; il quoziente si scrive sotto il divisore.`, -1)];
    let qs = '';
    const qPut = () => { st.cells = st.cells.filter(x => !(x.r === 1 && x.c >= rc)); qs.split('').forEach((c, i) => put(st, 1, rc + i, c, c === ',' ? 'comma' : 'q')); };
    let first = end === 0 ? `Prendo la prima cifra: <b>${cur}</b>.` : `${S[0]} è più piccolo di ${Dv}: prendo ${end + 1} cifre, cioè <b>${cur}</b>.`;
    if (end >= intLen) { qs = qText(end - 1); if (!qs.includes(',')) qs += ','; qPut(); first = `La parte prima della virgola (${S.slice(0, intLen)}) è più piccola di ${Dv}: il quoziente comincia con <b>${qs}</b>. Prendo ${end + 1} cifre, cioè <b>${cur}</b>.`; }
    frames.push(snapshot(st, first, end));
    let row = 1, ext = 0;
    for (;;) {
      const qd = Math.floor(cur / d), r = cur - qd * d;
      qDig[end] = qd; qs = qText(end); qPut();
      st.rows = Math.max(st.rows, row + 1); lines();
      const rs = String(r);
      for (let i = 0; i < rs.length; i++) put(st, row, end - rs.length + 1 + i, rs[i], 'rem');
      frames.push(snapshot(st, `Quante volte il ${Dv} sta nel ${cur}? <b>${qd}</b> ${qd === 1 ? 'volta' : 'volte'} (${Dv} × ${qd} = ${fmt(d * qd, 0)}). Scrivo ${qd} nel quoziente. Resto: ${cur} − ${d * qd} = <b>${r}</b>, che scrivo sotto.`, end));
      if (end < nd - 1) {
        end++;
        const nxt = +S[end];
        put(st, row, end, nxt, 'down');
        cur = r * 10 + nxt;
        frames.push(snapshot(st, end === intLen ? `Abbasso il ${nxt}, la prima cifra dopo la virgola: metto la <b>virgola</b> anche nel quoziente. Ora ho <b>${cur}</b>.` : `Abbasso la cifra successiva, ${nxt}, accanto al resto: ora ho <b>${cur}</b>.`, end));
        if (end === intLen) { qs = qText(end - 1) + ','; qPut(); }
        row++;
        continue;
      }
      const hasDec = decA > 0 || ext > 0;
      if (r === 0 || ext >= maxDec) {
        frames.push(snapshot(st, hasDec || (shift && !r) ? `Risultato: ${shift ? fmt(a, decA + shift) + ' : ' + fmt(d, shift) : A + ' : ' + Dv} = <b>${qs}</b>${r ? ' (mi fermo qui)' : ''}.` : `Risultato: quoziente <b>${fmt(+qs, 0)}</b>${r ? `, resto <b>${r}</b>` : ', resto 0'}. Prova: ${Dv} × ${fmt(+qs, 0)}${r ? ' + ' + r : ''} = ${A}.`, -1));
        return frames;
      }
      // si continua con i decimali: uno zero in più accanto al resto
      end++; ext++;
      if (!hasDec) { const u = st.cells.find(x => x.r === 0 && x.c === nd - 1); if (u) u.k += ' commaR'; }
      put(st, 0, end, '0', 'pad');
      put(st, row, end, 0, 'down');
      cur = r * 10;
      if (!hasDec) { qs = qText(end - 1) + ','; qPut(); }
      frames.push(snapshot(st, hasDec ? `Le cifre del dividendo sono finite ma c'è ancora un resto: aggiungo uno <b>zero</b> accanto al resto: ora ho <b>${cur}</b>.` : `Le cifre del dividendo sono finite ma c'è ancora un resto: metto la <b>virgola</b> nel quoziente e aggiungo uno <b>zero</b> accanto al resto: ora ho <b>${cur}</b>.`, end));
      row++;
    }
  }

  /* ---------------- long division (versione inglese) ----------------
       quotient on top, divisor outside the bracket, products and remainders underneath */
  function longDivision(a, d, maxDec = 0, shift = 0, decA = 0) {
    const C = divCore(a, d, decA), { S, nd, intLen, qDig } = C;
    let { end, cur } = C;
    const end0 = end;
    const ds = String(d), dl = ds.length;
    const c0 = dl + 1; // first column of the dividend (column dl holds the minus signs of the first step)
    const st = { cols: c0 + nd + maxDec + 1, rows: 2, cells: [], lines: [], marks: [], layout: 'long' };
    for (let i = 0; i < dl; i++) put(st, 1, i, ds[i], 'dvs');
    for (let i = 0; i < nd; i++) put(st, 1, c0 + i, S[i], 'dv d-' + posCls(intLen - 1 - i) + (decA && i === intLen - 1 ? ' dotR' : ''));
    const bracket = () => { st.marks = [{ r: 1, c: c0, k: 'vbar' }]; for (let c = c0; c < c0 + nd + maxDec; c++) st.marks.push({ r: 0, c, k: 'hbar' }); };
    bracket();
    const A = fmt(a, decA), Dv = fmt(d, 0);
    const frames = [snapshot(st, shiftNote(a, d, shift, decA) + `Divide ${A} by ${Dv}. The dividend goes inside the bracket and the divisor outside, on the left; the answer (the quotient) is written on top.`, -1)];
    // zero and decimal point on top when the quotient starts after the decimal point
    const lead = () => { put(st, 0, c0 + intLen - 1, 0, 'q dotR'); for (let p = intLen; p < end0; p++) put(st, 0, c0 + p, 0, 'q'); };
    let first = end === 0 ? `Start with the first digit: <b>${cur}</b>.` : `${S[0]} is smaller than ${Dv}, so take the first ${end + 1} digits: <b>${cur}</b>.`;
    if (end >= intLen) { lead(); first = `The whole-number part (${S.slice(0, intLen)}) is smaller than ${Dv}, so on top write <b>0</b> and a decimal point${end > intLen ? ', then a 0 above each decimal digit you skip' : ''}. Take the first ${end + 1} digits: <b>${cur}</b>.`; }
    frames.push(snapshot(st, first, c0 + end));
    let row = 2, ext = 0;
    const right = (r, col, str, k) => { for (let i = 0; i < str.length; i++) put(st, r, col - str.length + 1 + i, str[i], k); };
    const markDot = () => { const q = st.cells.find(x => x.r === 0 && x.c === c0 + intLen - 1); if (q && !/dotR/.test(q.k)) q.k += ' dotR'; };
    for (;;) {
      const qd = Math.floor(cur / d), p = qd * d, r = cur - p;
      const col = c0 + end;
      qDig[end] = qd;
      put(st, 0, col, qd, 'q' + (end === intLen - 1 && (decA || ext) ? ' dotR' : ''));
      st.rows = Math.max(st.rows, row + 2);
      right(row, col, String(p), 'ul');
      put(st, row, col - String(p).length, '−', 'op');
      frames.push(snapshot(st, `How many times does ${Dv} go into ${cur}? <b>${qd}</b> time${qd === 1 ? '' : 's'}. Write ${qd} on top, then multiply: ${Dv} × ${qd} = <b>${fmt(p, 0)}</b>; write it underneath.`, col));
      right(row + 1, col, String(r), 'rem');
      frames.push(snapshot(st, `Subtract: ${cur} − ${p} = <b>${r}</b>.`, col));
      if (end < nd - 1) {
        end++;
        const nxt = +S[end];
        put(st, row + 1, c0 + end, nxt, 'down');
        cur = r * 10 + nxt;
        if (end === intLen) markDot();
        frames.push(snapshot(st, end === intLen ? `Bring down the next digit, ${nxt}. It comes after the decimal point, so put a <b>decimal point</b> in the quotient too, right above the other one. Now you have <b>${cur}</b>.` : `Bring down the next digit, ${nxt}: now you have <b>${cur}</b>.`, c0 + end));
        row += 2;
        continue;
      }
      const hasDec = decA > 0 || ext > 0;
      if (r === 0 || ext >= maxDec) {
        const qn = C.qText(end);
        frames.push(snapshot(st, hasDec || (shift && !r)
          ? `Answer: ${shift ? fmt(a, decA + shift) + ' ÷ ' + fmt(d, shift) : A + ' ÷ ' + Dv} = <b>${qn}</b>${r ? ' (we stop here)' : ''}.`
          : `Answer: quotient <b>${fmt(+qn, 0)}</b>, remainder <b>${r}</b>. Check: ${Dv} × ${fmt(+qn, 0)}${r ? ' + ' + r : ''} = ${A}.`, -1));
        return frames;
      }
      // carry on after the decimal point: a zero in the dividend, brought down
      end++; ext++;
      if (!hasDec) { const u = st.cells.find(x => x.r === 1 && x.c === c0 + nd - 1); if (u) u.k += ' dotR'; markDot(); }
      put(st, 1, c0 + end, '0', 'pad');
      put(st, row + 1, c0 + end, 0, 'down');
      cur = r * 10;
      frames.push(snapshot(st, `There are no digits left, but there is still a remainder. ${!hasDec ? 'Put a <b>decimal point</b> in the dividend and in the quotient (one above the other), then write' : 'Write another'} <b>0</b> in the dividend and bring it down: now you have <b>${cur}</b>.`, c0 + end));
      row += 2;
    }
  }

  // costruisce i passaggi per una descrizione di calcolo {op, a, b, dec, decA, decB, maxDec, shift}
  function build(c) {
    if (!c) return null;
    // più operazioni in fila: i passaggi di ciascuna, con il numero dell'operazione
    if (Array.isArray(c)) {
      if (c.length === 1) return build(c[0]);
      const n = c.length;
      return c.flatMap((x, i) => build(x).map((f, j) => ({ ...f, grp: i, note: `<span class="stag">${L('Operazione', 'Operation')} ${i + 1} ${L('di', 'of')} ${n}</span> ` + f.note })));
    }
    if (c.op === '+') return addition(c.a, c.b, c.dec || 0, c.more || []);
    if (c.op === '−') return subtraction(c.a, c.b, c.dec || 0);
    if (c.op === '×') return multiplication(c.a, c.b, c.decA || 0, c.decB || 0);
    if (c.op === ':') return division(c.a, c.b, c.maxDec || 0, c.shift || 0, c.decA || 0);
    return null;
  }
  const api = { build, addition, subtraction, multiplication, division, longDivision, fmt };
  root.Steps = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
