"""Tutti i livelli nel browser: si gioca rispondendo giusto (e una volta sbagliando), senza errori."""
from playwright.sync_api import sync_playwright
import sys
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.environ.get('SHOTS', '/tmp/mate-shots/')
os.makedirs(OUT, exist_ok=True)
LANG = os.environ.get('LANG_GAME', 'it')
OUT = OUT.rstrip('/') + ('_en/' if LANG == 'en' else '/')
os.makedirs(OUT, exist_ok=True)
URL = 'file://' + ROOT + '/dist/' + ('maths-file.html' if LANG == 'en' else 'matematica-file.html')
DEC = '.' if LANG == 'en' else ','
errs = []
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1180, 'height': 820}, has_touch=True)
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(URL); pg.wait_for_timeout(300)
    pg.screenshot(path=OUT + '01_profili.png')
    pg.click('.player.new'); pg.fill('.modal .field', 'Giulia'); pg.click('.modal .btn:not(.alt)'); pg.wait_for_timeout(200)
    pg.screenshot(path=OUT + '02_mondi.png')
    levels = pg.evaluate("Mate.worlds.flatMap(w => w.modules.flatMap(m => m.levels.map(l => [w.n, m.id, l.id])))")
    shots = {'conta', 'confronta', 'ordina', 'divr', 'frfig', 'areatri', 'relativi', 'ore3'}
    n = 0
    for (w, m, l) in levels:
        pg.evaluate(f"__mate.play({w}, '{m}', '{l}')"); pg.wait_for_timeout(30)
        for qi in range(8):
            q = pg.evaluate("(() => { const c = __mate.cur(); const q = c.qs[c.i]; return {k: q.k, a: q.a, f: q.f ? q.f.map(x => x.a) : null, o: q.o} })()")
            wrong = (qi == 1)
            if q['k'] == 'choice':
                idx = (q['a'] + 1) % len(q['o']) if wrong else q['a']
                pg.locator('.balloon').nth(idx).click(force=True)
            elif q['k'] == 'cmp':
                sym = q['a'] if not wrong else ('<' if q['a'] != '<' else '>')
                pg.locator('.croc', has_text=sym).first.click()
            else:
                vals = q['f'] if q['k'] == 'multi' else [q['a']]
                for i, v in enumerate(vals):
                    if wrong: v = v + 1
                    s = ('%.6f' % v).rstrip('0').rstrip('.').replace('.', DEC) if not float(v).is_integer() else str(int(v))
                    if i > 0: pg.keyboard.press('Tab')
                    for ch in s: pg.keyboard.press('-' if ch == '-' else ch)
                pg.keyboard.press('Enter')
            pg.wait_for_timeout(20)
            fb = pg.evaluate("(() => { const f = document.querySelector('.feedback'); return f ? f.className : '' })()")
            if ('ok' in fb) == wrong:
                errs.append(f'{w}/{m}/{l} domanda {qi}: esito inatteso {fb} {q}')
            if l in shots and qi == (1 if l in ('divr', 'relativi') else 0):
                pg.screenshot(path=OUT + f'q_{l}.png')
            pg.keyboard.press('Enter'); pg.wait_for_timeout(15)
        res = pg.evaluate("document.querySelector('.result h1') ? document.querySelector('.result h1').textContent : 'NO'")
        if res == 'NO': errs.append(f'{l}: nessun risultato')
        n += 1
    pg.screenshot(path=OUT + '03_risultato.png')
    # verifiche finali di ogni modulo: 2 errori su 10 → 80% (Intermedio)
    mods = pg.evaluate("Mate.worlds.flatMap(w => w.modules.map(m => [w.n, m.id]))")
    for (w, m) in mods:
        pg.evaluate(f"__mate.verif({w}, '{m}')"); pg.wait_for_timeout(20)
        for qi in range(10):
            q = pg.evaluate("(() => { const c = __mate.cur(); const q = c.qs[c.i]; return {k: q.k, a: q.a, f: q.f ? q.f.map(x => x.a) : null, o: q.o} })()")
            wrong = qi in (3, 7)
            if q['k'] == 'choice':
                pg.locator('.balloon').nth((q['a'] + 1) % len(q['o']) if wrong else q['a']).click(force=True)
            elif q['k'] == 'cmp':
                sym = q['a'] if not wrong else ('<' if q['a'] != '<' else '>')
                pg.locator('.croc', has_text=sym).first.click()
            else:
                vals = q['f'] if q['k'] == 'multi' else [q['a']]
                for i, v in enumerate(vals):
                    if wrong: v = v + 1
                    s2 = ('%.6f' % v).rstrip('0').rstrip('.').replace('.', DEC) if not float(v).is_integer() else str(int(v))
                    if i > 0: pg.keyboard.press('Tab')
                    for ch in s2: pg.keyboard.press(ch)
                pg.keyboard.press('Enter')
            pg.wait_for_timeout(15)
            pg.keyboard.press('Enter'); pg.wait_for_timeout(15)
        g = pg.evaluate("(() => { const e = document.querySelector('.giudizio'); return e ? e.textContent + ' ' + document.querySelectorAll('.rv').length : 'NO' })()")
        if g != ('Intermediate 2' if LANG == 'en' else 'Intermedio 2'): errs.append(f'verifica {w}/{m}: {g}')
    pg.screenshot(path=OUT + '05_verifica.png', full_page=True)
    pg.evaluate("__mate.showWorlds()"); pg.click('.world >> nth=0'); pg.wait_for_timeout(200)
    pg.screenshot(path=OUT + '06_mondo1.png', full_page=True)
    pg.evaluate("__mate.showWorlds()"); pg.click('.world >> nth=2'); pg.wait_for_timeout(200)
    pg.screenshot(path=OUT + '04_mondo3.png', full_page=True)
    print('livelli giocati:', n)
    print('stelle:', pg.evaluate("Object.values(__mate.D.players[0].stars).reduce((a,b)=>a+b,0)"), 'monete:', pg.evaluate("__mate.D.players[0].coins"))
    print('ERRORI:', errs[:20], len(errs))
    b.close()
