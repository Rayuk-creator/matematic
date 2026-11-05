/* "Did you know…?": facts about the history of numbers and operations, shown between levels (English version).
   tag: topics they relate to (numeri, add, mul, div, fraz, dec, mis, tempo, soldi, geo, dati, perc, pot, rel). */
(function (root) {
  'use strict';
  const FACTS = [
    { tag: ['numeri'], icon: '🦴', text: 'About 20,000 years ago, in Africa, someone kept count by cutting notches into a bone: it is called the “Ishango bone”, and it is one of the oldest counting objects we know of.' },
    { tag: ['numeri'], icon: '🖐️', text: 'We probably count in groups of ten (ones, tens, hundreds…) because we have ten fingers: our hands were the very first calculator!' },
    { tag: ['numeri'], icon: '🇮🇳', text: 'The digits we use, from 0 to 9, were invented in India and reached Europe thanks to Arab mathematicians. That is why they are called “Hindu-Arabic” numerals.' },
    { tag: ['numeri'], icon: '📖', text: 'Hindu-Arabic numerals became popular in Europe thanks to Leonardo Fibonacci, a mathematician from Pisa in Italy, who wrote a book about them in 1202: the “Liber Abaci”.' },
    { tag: ['numeri'], icon: '0️⃣', text: 'Zero hasn\'t always existed! In the year 628 the Indian mathematician Brahmagupta wrote down the rules for calculating with zero.' },
    { tag: ['numeri'], icon: '🏛️', text: 'The ancient Romans wrote numbers with letters (I, V, X, L, C, D, M) and had no symbol for zero. You can still see Roman numerals on clocks and monuments.' },
    { tag: ['numeri'], icon: '🔢', text: 'The word “million” comes from Italian: “milione” means “big thousand”, that is, a thousand times a thousand.' },
    { tag: ['numeri'], icon: '♾️', text: 'Numbers never end: you can always add 1 to any number. That is why we say there are infinitely many numbers.' },
    { tag: ['add'], icon: '⚪', text: 'The word “calculate” comes from the Latin “calculus”, which means “small pebble”: long ago, people did their sums by moving pebbles around.' },
    { tag: ['add'], icon: '🧮', text: 'The abacus is a very old counting tool: beads or pebbles in different rows, one row for the ones, one for the tens, one for the hundreds…' },
    { tag: ['add'], icon: '➕', text: 'The + and − signs first appeared in print in a German arithmetic book in 1489. The + probably comes from the Latin word “et”, which means “and”.' },
    { tag: ['add'], icon: '⚖️', text: 'The = sign was invented in 1557 by Robert Recorde, a Welsh mathematician. He used two parallel lines because, he wrote, no two things can be more equal.' },
    { tag: ['add'], icon: '🔄', text: 'In an addition you can change the order of the numbers and the answer stays the same: 3 + 5 = 5 + 3. This is called the commutative property.' },
    { tag: ['mul'], icon: '✖️', text: 'The × sign for multiplication was first used by the English mathematician William Oughtred, in a book published in 1631.' },
    { tag: ['mul'], icon: '🔺', text: 'In Italy the times table grid is called the “Pythagorean table”, after Pythagoras, a Greek mathematician who lived about 2,500 years ago.' },
    { tag: ['mul'], icon: '🖐️', text: 'A trick for the 9 times table: hold up all ten fingers and fold down finger number 4. There are 3 fingers on the left and 6 on the right: 9 × 4 = 36!' },
    { tag: ['mul'], icon: '♟️', text: 'A legend says the inventor of chess asked the king for 1 grain of rice on the first square, 2 on the second, 4 on the third, doubling every time. In the end he would have needed more rice than there is in the whole world!' },
    { tag: ['div'], icon: '➗', text: 'The ÷ sign was first used in 1659 by the Swiss mathematician Johann Rahn. In Italy and some other countries people divide with a colon “:”, as the German mathematician Leibniz did.' },
    { tag: ['div'], icon: '🍬', text: 'You can\'t divide by 0: if you have 6 sweets and 0 children, there is no way to share them out!' },
    { tag: ['fraz'], icon: '🏺', text: 'More than 3,500 years ago, the ancient Egyptians mostly used fractions with 1 on top, like 1/2, 1/3 and 1/4. We know this from an ancient papyrus, the Rhind Papyrus.' },
    { tag: ['fraz'], icon: '➖', text: 'The fraction bar was used by Arab mathematicians, and Fibonacci made it known in Europe. The word “fraction” comes from the Latin “frangere”, which means “to break”.' },
    { tag: ['dec'], icon: '🔟', text: 'Decimal numbers became famous in Europe thanks to Simon Stevin, a mathematician from Flanders, who wrote a little book about them in 1585. Before that, people only used fractions.' },
    { tag: ['dec'], icon: '🌍', text: 'In the UK and the USA decimals are written with a point (3.5), but in Italy and many other countries they are written with a comma (3,5).' },
    { tag: ['mis'], icon: '📏', text: 'The metre was invented in France at the end of the 18th century: it was one ten-millionth of the distance from the North Pole to the Equator.' },
    { tag: ['mis'], icon: '🦶', text: 'Before the metre, people measured with feet, inches and arm lengths, and these changed from town to town. Imagine the muddle at the market!' },
    { tag: ['mis'], icon: '💧', text: 'At first, a gram was the mass of one cubic centimetre of water, and a litre of water weighs about one kilogram.' },
    { tag: ['tempo'], icon: '⏳', text: 'An hour has 60 minutes and a minute has 60 seconds thanks to the ancient Babylonians, who counted in groups of 60.' },
    { tag: ['tempo'], icon: '☀️', text: 'The ancient Egyptians divided the day into 12 hours and the night into another 12: that is why a whole day has 24 hours.' },
    { tag: ['soldi'], icon: '💶', text: 'Euro coins and banknotes have been in use since 1 January 2002. At the start, 12 European countries used them; today many more do.' },
    { tag: ['soldi'], icon: '%', text: 'The % sign grew out of the abbreviation for “per cento” (“for each hundred”) that Italian merchants wrote in their account books.' },
    { tag: ['geo'], icon: '🌾', text: '“Geometry” means “measuring the earth”. The ancient Egyptians had to measure their fields again every time the River Nile flooded and washed away the boundaries.' },
    { tag: ['geo'], icon: '⭕', text: 'More than 2,000 years ago, Archimedes of Syracuse worked out that the circumference of a circle is a little more than 3 times its diameter: this is the number π, about 3.14.' },
    { tag: ['geo'], icon: '🐝', text: 'Bees build the cells of their honeycomb in the shape of a hexagon: this shape uses less wax and leaves no gaps.' },
    { tag: ['geo'], icon: '📐', text: 'A full turn is 360 degrees, perhaps because of the Babylonians, who counted in groups of 60 and noticed that a year has about 360 days.' },
    { tag: ['dati'], icon: '🎲', text: 'Probability was born in 1654, in some letters between two French mathematicians, Blaise Pascal and Pierre de Fermat, who were writing about dice games.' },
    { tag: ['dati'], icon: '⚙️', text: 'When he was about 19, Blaise Pascal built one of the first mechanical calculators, the “Pascaline”, to help his father with his sums.' },
    { tag: ['rel'], icon: '🥢', text: 'More than 2,000 years ago in China, people did calculations with little rods: red ones for positive numbers and black ones for negative numbers.' },
    { tag: ['pot', 'numeri'], icon: '🧩', text: 'More than 2,000 years ago, the Greek mathematician Euclid proved that prime numbers never run out: there are infinitely many of them.' },
  ];
  // topics of each module
  const MOD_TAGS = {
    c1n: ['numeri'], c1op: ['add'], c1pr: ['add'], c1sp: ['geo'], c1dt: ['dati', 'geo'], c1tm: ['tempo', 'soldi'],
    c2n: ['numeri'], c2op: ['add'], c2mol: ['mul', 'div'], c2mis: ['tempo', 'soldi'], c2sp: ['geo'], c2dt: ['dati'],
    c3n: ['numeri'], c3op: ['add', 'mul', 'div'], c3fr: ['fraz', 'dec'], c3mis: ['mis', 'tempo'], c3geo: ['geo'], c3dt: ['dati'],
    c4n: ['numeri'], c4dec: ['dec'], c4op: ['mul', 'div'], c4fr: ['fraz'], c4mis: ['mis', 'soldi'], c4geo: ['geo'], c4dt: ['dati'],
    c5calc: ['dec', 'mul', 'div'], c5n: ['numeri', 'rel', 'pot'], c5op: ['soldi', 'add', 'mul'], c5fr: ['fraz', 'soldi'], c5mis: ['mis'], c5geo: ['geo'], c5dt: ['dati'],
  };
  // picks a fact related to the module, preferably one the player hasn't seen yet
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
