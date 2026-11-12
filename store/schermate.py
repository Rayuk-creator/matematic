"""Schermate per la scheda di Google Play, in italiano e in inglese, per telefono e tablet.
Uso: sh build.sh && python3 store/schermate.py   → store/schermate/<lingua>/<telefono|tablet>/NN.png"""
from playwright.sync_api import sync_playwright
import os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.environ.get('OUT', ROOT + '/store/schermate')
# formato: nome → (larghezza, altezza, scala)  → telefono 1080×1920, tablet 1920×1200
FORMATI = {'telefono': (360, 640, 3), 'tablet': (960, 600, 2)}
LINGUE = {'it': ('matematica-file.html', 'Giulia', ','), 'en': ('maths-file.html', 'Emma', '.')}
# (mondo, modulo, livello, cosa mostrare)
SCENE = [(3, 'c3op', 'add3', 'passi'), (2, 'c2mis', 'ore', 'domanda'),
         (3, 'c3fr', 'frfig', 'domanda'), (2, 'c2cod', 'percorso2', 'domanda'), (2, 'c2mis', 'euro', 'domanda')]
SOLO = os.environ.get('SOLO')

def rispondi(pg, dec, sbaglia=False):
    q = pg.evaluate("(() => { const c = __mate.cur(); const q = c.qs[c.i]; return {k: q.k, a: q.a, f: q.f ? q.f.map(x => x.a) : null, o: q.o} })()")
    if q['k'] == 'choice':
        pg.locator('.balloon').nth((q['a'] + 1) % len(q['o']) if sbaglia else q['a']).click(force=True)
    elif q['k'] == 'cmp':
        sym = q['a'] if not sbaglia else ('<' if q['a'] != '<' else '>')
        pg.locator('.croc', has_text=sym).first.click()
    else:
        vals = q['f'] if q['k'] == 'multi' else [q['a']]
        for i, v in enumerate(vals):
            if sbaglia: v = v + 1
            s = ('%.6f' % v).rstrip('0').rstrip('.').replace('.', dec) if not float(v).is_integer() else str(int(v))
            if i > 0: pg.keyboard.press('Tab')
            for ch in s: pg.keyboard.press('-' if ch == '-' else ch)
        pg.keyboard.press('Enter')
    pg.wait_for_timeout(20)

def gioca(pg, dec, w, m, l, errori=()):
    pg.evaluate(f"__mate.play({w}, '{m}', '{l}')"); pg.wait_for_timeout(30)
    for qi in range(8):
        rispondi(pg, dec, qi in errori); pg.keyboard.press('Enter'); pg.wait_for_timeout(15)

with sync_playwright() as p:
    b = p.chromium.launch()
    for lang, (file, nome, dec) in LINGUE.items():
        for formato, (W, H, K) in FORMATI.items():
            if SOLO and SOLO != f'{lang}-{formato}': continue
            out = f'{OUT}/{lang}/{formato}/'; os.makedirs(out, exist_ok=True)
            pg = b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=K, has_touch=True, is_mobile=(formato == 'telefono'))
            pg.goto('file://' + ROOT + '/dist/' + file); pg.wait_for_timeout(300)
            pg.click('.player.new'); pg.fill('.modal .field', nome); pg.click('.modal .btn:not(.alt)'); pg.wait_for_timeout(200)
            # un po' di progressi, così le mappe non sono vuote
            livelli = pg.evaluate("Mate.worlds.flatMap(w => w.modules.flatMap(m => m.levels.map(l => [w.n, m.id, l.id])))")
            for i, (w, m, l) in enumerate(livelli):
                if w == 1 or (w == 2 and m in ('c2op', 'c2mol', 'c2n')) or (w == 3 and m == 'c3op' and l in ('add3', 'sot3', 'mul1')):
                    gioca(pg, dec, w, m, l, errori=(2,) if i % 3 == 1 else ((2, 5) if i % 7 == 3 else ()))
            n = 1
            def scatta():
                global n
                pg.wait_for_timeout(1300 if pg.locator('.result').count() else 350)   # nel risultato si aspettano le tre stelle
                pg.evaluate("document.querySelectorAll('.confetti').forEach(e => e.remove())")   # i coriandoli coprirebbero il testo
                pg.evaluate("window.scrollTo(0, 0)")
                pg.screenshot(path=out + '%02d.png' % n); n += 1
            pg.evaluate("__mate.showWorlds()"); scatta()                                # 1: i cinque mondi
            pg.click('.world >> nth=1'); pg.wait_for_timeout(400)
            if pg.locator('.guide').count():      # la prima volta compare la guida «Cosa imparerai»: si chiude con il suo pulsante
                pg.locator('.guide .btn').last.click(); pg.wait_for_timeout(400)
            assert not pg.locator('.guide').count()
            scatta()                                                                    # 2: la mappa di un mondo
            for (w, m, l, cosa) in SCENE:
                pg.evaluate(f"__mate.play({w}, '{m}', '{l}')"); pg.wait_for_timeout(60)
                if pg.locator('.intro .btn').count(): pg.locator('.intro .btn').first.click()
                if cosa == 'passi':
                    rispondi(pg, dec, True); pg.wait_for_timeout(200)
                    if pg.locator('.sbtn:not([disabled])').count(): pg.locator('.sbtn:not([disabled])').last.click()   # «Fino alla fine»
                    pg.evaluate("document.querySelector('.steps') && document.querySelector('.steps').scrollIntoView({block: 'center'})")
                    pg.evaluate("document.querySelectorAll('.confetti').forEach(e => e.remove())")
                    pg.wait_for_timeout(350); pg.screenshot(path=out + '%02d.png' % n); n += 1
                else:
                    scatta()
            gioca(pg, dec, 3, 'c3op', 'per10'); scatta()                               # risultato con le stelle
            pg.close()
            print(lang, formato, n - 1, 'schermate')
    b.close()
