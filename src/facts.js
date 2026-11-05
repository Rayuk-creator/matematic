/* «Lo sai che…?»: curiosità sulla storia dei numeri e delle operazioni, mostrate tra un livello e l'altro.
   tag: argomenti a cui si collegano (numeri, add, mul, div, fraz, dec, mis, tempo, soldi, geo, dati, perc, pot, rel). */
(function (root) {
  'use strict';
  const FACTS = [
    { tag: ['numeri'], icon: '🦴', text: 'Circa 20.000 anni fa, in Africa, qualcuno contava facendo tante tacche su un osso: è l\'«osso di Ishango», uno dei più antichi oggetti per contare che conosciamo.' },
    { tag: ['numeri'], icon: '🖐️', text: 'Contiamo a gruppi di dieci (unità, decine, centinaia…) probabilmente perché abbiamo dieci dita: le mani sono state la prima calcolatrice!' },
    { tag: ['numeri'], icon: '🇮🇳', text: 'Le cifre che usiamo, da 0 a 9, sono nate in India e sono arrivate in Europa grazie ai matematici arabi. Per questo si chiamano cifre «indo-arabiche».' },
    { tag: ['numeri'], icon: '📖', text: 'In Italia le cifre indo-arabiche le ha fatte conoscere Leonardo Fibonacci, un matematico di Pisa, con un libro scritto nel 1202: il «Liber Abaci».' },
    { tag: ['numeri'], icon: '0️⃣', text: 'Lo zero non c\'è sempre stato! Nel 628 dopo Cristo il matematico indiano Brahmagupta scrisse le regole per fare i calcoli con lo zero.' },
    { tag: ['numeri'], icon: '🏛️', text: 'Gli antichi Romani scrivevano i numeri con le lettere (I, V, X, L, C, D, M) e non avevano un simbolo per lo zero. I numeri romani si vedono ancora su orologi e monumenti.' },
    { tag: ['numeri'], icon: '🔢', text: 'La parola «milione» è nata in Italia: vuol dire «grande mille», cioè mille volte mille.' },
    { tag: ['numeri'], icon: '♾️', text: 'I numeri non finiscono mai: a qualunque numero puoi sempre aggiungere 1. Per questo si dice che i numeri sono infiniti.' },
    { tag: ['add'], icon: '⚪', text: 'La parola «calcolo» viene dal latino «calculus», che vuol dire sassolino: nell\'antichità si facevano i conti spostando dei sassolini.' },
    { tag: ['add'], icon: '🧮', text: 'L\'abaco è uno strumento antichissimo per contare: palline o sassolini su file diverse, una per le unità, una per le decine, una per le centinaia…' },
    { tag: ['add'], icon: '➕', text: 'I segni + e − sono comparsi stampati per la prima volta in un libro di aritmetica tedesco del 1489. Il + deriva probabilmente dalla parola latina «et», che vuol dire «e».' },
    { tag: ['add'], icon: '⚖️', text: 'Il segno = l\'ha inventato nel 1557 Robert Recorde, un matematico gallese: usò due linee parallele perché, scrisse, «nessuna cosa è più uguale di due linee parallele».' },
    { tag: ['add'], icon: '🔄', text: 'In un\'addizione puoi cambiare l\'ordine dei numeri e il risultato non cambia: 3 + 5 = 5 + 3. È la proprietà commutativa.' },
    { tag: ['mul'], icon: '✖️', text: 'Il segno × per la moltiplicazione lo ha usato per primo il matematico inglese William Oughtred, in un libro del 1631.' },
    { tag: ['mul'], icon: '🔺', text: 'La tavola delle tabelline si chiama «tavola pitagorica» in onore di Pitagora, un matematico greco vissuto circa 2500 anni fa.' },
    { tag: ['mul'], icon: '🖐️', text: 'Un trucco per la tabellina del 9: apri le dieci dita e abbassa il dito numero 4. A sinistra restano 3 dita, a destra 6: 9 × 4 = 36!' },
    { tag: ['mul'], icon: '♟️', text: 'Una leggenda racconta che l\'inventore degli scacchi chiese al re 1 chicco di riso sulla prima casella, 2 sulla seconda, 4 sulla terza, raddoppiando ogni volta. Alla fine sarebbe servito più riso di quanto ne esista nel mondo!' },
    { tag: ['div'], icon: '➗', text: 'Il segno ÷ fu usato per la prima volta nel 1659 dal matematico svizzero Johann Rahn. In Italia per dividere usiamo i due punti «:», come faceva il matematico tedesco Leibniz.' },
    { tag: ['div'], icon: '🍬', text: 'Dividere per 0 non si può: se hai 6 caramelle e 0 bambini, non c\'è nessun modo di fare le parti!' },
    { tag: ['fraz'], icon: '🏺', text: 'Gli antichi Egizi, più di 3500 anni fa, usavano soprattutto frazioni con il numeratore 1, come 1/2, 1/3, 1/4. Lo sappiamo da un antico papiro, il papiro di Rhind.' },
    { tag: ['fraz'], icon: '➖', text: 'La lineetta delle frazioni l\'hanno usata i matematici arabi e Fibonacci l\'ha fatta conoscere in Europa. La parola «frazione» viene dal latino «frangere», che vuol dire «rompere».' },
    { tag: ['dec'], icon: '🔟', text: 'I numeri decimali li ha resi famosi in Europa Simon Stevin, un matematico delle Fiandre, con un libretto del 1585. Prima si usavano solo le frazioni.' },
    { tag: ['dec'], icon: '🌍', text: 'In Italia i decimali si scrivono con la virgola (3,5), mentre in Inghilterra e negli Stati Uniti si usa il punto (3.5).' },
    { tag: ['mis'], icon: '📏', text: 'Il metro è nato in Francia alla fine del Settecento: era la decimilionesima parte della distanza tra il Polo Nord e l\'Equatore.' },
    { tag: ['mis'], icon: '🦶', text: 'Prima del metro si misurava con piedi, pollici e braccia, che cambiavano da una città all\'altra. Che confusione al mercato!' },
    { tag: ['mis'], icon: '💧', text: 'All\'inizio il grammo era il peso di un centimetro cubo d\'acqua, e un litro d\'acqua pesa circa un chilogrammo.' },
    { tag: ['tempo'], icon: '⏳', text: 'Un\'ora ha 60 minuti e un minuto 60 secondi grazie agli antichi Babilonesi, che facevano i conti a gruppi di 60.' },
    { tag: ['tempo'], icon: '☀️', text: 'Gli antichi Egizi dividevano il giorno in 12 ore e la notte in altre 12: per questo una giornata intera ha 24 ore.' },
    { tag: ['soldi'], icon: '💶', text: 'In Italia le monete e le banconote in euro si usano dal 1° gennaio 2002. Prima c\'era la lira.' },
    { tag: ['soldi'], icon: '%', text: 'Il simbolo % è nato dall\'abbreviazione di «per cento» che scrivevano i mercanti italiani nei loro conti.' },
    { tag: ['geo'], icon: '🌾', text: '«Geometria» vuol dire «misura della terra». Gli antichi Egizi dovevano rimisurare i campi ogni volta che il fiume Nilo straripava e cancellava i confini.' },
    { tag: ['geo'], icon: '⭕', text: 'Archimede di Siracusa, più di 2000 anni fa, scoprì che la circonferenza è poco più di 3 volte il diametro: è il numero π, circa 3,14.' },
    { tag: ['geo'], icon: '🐝', text: 'Le api costruiscono le celle dell\'alveare a forma di esagono: con questa forma usano meno cera e non lasciano spazi vuoti.' },
    { tag: ['geo'], icon: '📐', text: 'L\'angolo giro misura 360 gradi forse per merito dei Babilonesi, che contavano a gruppi di 60 e osservavano che l\'anno ha circa 360 giorni.' },
    { tag: ['dati'], icon: '🎲', text: 'Il calcolo delle probabilità è nato nel 1654 da alcune lettere tra due matematici francesi, Blaise Pascal e Pierre de Fermat, che parlavano di giochi con i dadi.' },
    { tag: ['dati'], icon: '⚙️', text: 'Blaise Pascal, a circa 19 anni, costruì una delle prime calcolatrici meccaniche, la «Pascalina», per aiutare il papà a fare i conti.' },
    { tag: ['rel'], icon: '🥢', text: 'Più di 2000 anni fa in Cina si facevano i calcoli con dei bastoncini: rossi per i numeri positivi e neri per quelli negativi.' },
    { tag: ['pot', 'numeri'], icon: '🧩', text: 'Più di 2000 anni fa il matematico greco Euclide dimostrò che i numeri primi non finiscono mai: ce ne sono infiniti.' },
  ];
  // argomenti di ogni modulo
  const MOD_TAGS = {
    c1n: ['numeri'], c1op: ['add'], c1pr: ['add'], c1sp: ['geo'], c1dt: ['dati', 'geo'], c1tm: ['tempo', 'soldi'],
    c2n: ['numeri'], c2op: ['add'], c2mol: ['mul', 'div'], c2mis: ['tempo', 'soldi'], c2sp: ['geo'], c2dt: ['dati'],
    c3n: ['numeri'], c3op: ['add', 'mul', 'div'], c3fr: ['fraz', 'dec'], c3mis: ['mis', 'tempo'], c3geo: ['geo'], c3dt: ['dati'],
    c4n: ['numeri'], c4dec: ['dec'], c4op: ['mul', 'div'], c4fr: ['fraz'], c4mis: ['mis', 'soldi'], c4geo: ['geo'], c4dt: ['dati'],
    c5calc: ['dec', 'mul', 'div'], c5n: ['numeri', 'rel', 'pot'], c5op: ['soldi', 'add', 'mul'], c5fr: ['fraz', 'soldi'], c5mis: ['mis'], c5geo: ['geo'], c5dt: ['dati'],
  };
  // sceglie una curiosità collegata al modulo, possibilmente non ancora vista
  function pickFact(modId, seen = []) {
    const tags = MOD_TAGS[modId] || [];
    const idx = FACTS.map((f, i) => i);
    const related = idx.filter(i => FACTS[i].tag.some(t => tags.includes(t)));
    const fresh = a => a.filter(i => !seen.includes(i));
    const pool = fresh(related).length ? fresh(related) : fresh(idx).length ? fresh(idx) : related.length ? related : idx;
    const i = pool[Math.floor(Math.random() * pool.length)];
    return { i, ...FACTS[i] };
  }
  const api = { FACTS, MOD_TAGS, pickFact };
  root.Facts = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
