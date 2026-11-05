"""Pagina per l'insegnante: giocatori del dispositivo e file dei bambini, conti giusti per ogni classe,
nessuna modifica ai giocatori, file sbagliati segnalati, nelle due lingue.
Prima: sh build.sh. Uso: python3 test/teacher.py"""
from playwright.sync_api import sync_playwright
import json, os, shutil, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tmp = tempfile.mkdtemp()
SHOTS = os.environ.get('SHOTS')
fails, errs = [], []
def check(what, cond):
    print(('ok   ' if cond else 'NO   ') + what)
    if not cond: fails.append(what)
def write(name, obj):
    path = tmp + '/' + name
    with open(path, 'w', encoding='utf-8') as f:
        f.write(obj if isinstance(obj, str) else json.dumps(obj))
    return path
def backup(lang, players, saved='2026-11-02T10:00:00.000Z'):
    return {'app': 'matematica-in-gioco', 'version': 1, 'saved': saved, 'saves': {lang: {'players': players}}}
def open_page(b, file):
    c = b.new_context(viewport={'width': 1180, 'height': 820}); pg = c.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto('file://' + ROOT + '/dist/' + file); pg.wait_for_timeout(200)
    return c, pg
def open_teacher(pg):
    pg.click('#tSet'); pg.click('#tchOpen'); pg.wait_for_timeout(80)
def add(pg, *paths):
    with pg.expect_file_chooser() as fc: pg.click('#tchAdd')
    fc.value.set_files(list(paths)); pg.wait_for_timeout(200)
def row(pg, name):
    return pg.locator('.tch tbody tr', has=pg.locator('.tch-name', has_text=name))
def cells(pg, name):
    return [c.strip() for c in row(pg, name).locator('td').all_inner_texts()]
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        for lang, file, key, class_key in (('it', 'matematica-file.html', 'mate-gioco-v1', 'mate-classe-v1'), ('en', 'maths-file.html', 'math-game-en-v1', 'math-class-en-v1')):
            print('==', lang)
            c, pg = open_page(b, file)
            IT = lang == 'it'
            # senza bambini
            open_teacher(pg)
            check('pagina vuota: lo dice', ('ancora' if IT else 'no children') in pg.inner_text('#screen'))
            check('pagina vuota: niente tabella', pg.locator('.tch').count() == 0)
            # i livelli veri della classe 2: Sara ne ha superati alcuni di un modulo, Luca tutti
            w2 = pg.evaluate("Mate.worlds[1].modules.map(m => ({id: m.id, levels: m.levels.map(l => l.id)}))")
            m0 = w2[0]
            key_of = lambda m, l: f"2/{m['id']}/{l}"
            sara = {'id': 'sara1', 'name': 'Sara', 'avatar': '🦊', 'coins': 10, 'stars': {key_of(m0, m0['levels'][0]): 3, key_of(m0, m0['levels'][1]): 1, key_of(m0, m0['levels'][2]): 0}, 'verif': {}}
            luca = {'id': 'luca1', 'name': 'Luca', 'avatar': '🐼', 'coins': 20, 'stars': {key_of(m0, l): 2 for l in m0['levels']}, 'verif': {f"2/{m0['id']}/verifica": 80}}
            # un livello di un'altra classe non deve contare nella classe 2
            sara['stars']['1/altro/x'] = 3
            f1 = write('sara.txt', backup(lang, [sara]))
            f2 = write('luca.txt', backup(lang, [luca], '2026-11-03T10:00:00.000Z'))
            add(pg, f1, f2)
            check('carica più file insieme', pg.locator('.tch tbody tr').count() == 2)
            check('messaggio con i conti', all(x in pg.inner_text('.tch-msg') for x in ['2']))
            check('si apre sulla classe con più stelle', pg.locator('.tch-tab[aria-pressed="true"]').inner_text() == ('Classe 2ª' if IT else 'Grade 2'))
            n = len(m0['levels'])
            cs, cl = cells(pg, 'Sara'), cells(pg, 'Luca')
            check(f'Sara: 2 livelli su {n} (0 stelle non contano)', cs[0] == f'2/{n}')
            check(f'Luca: tutti i {n} livelli', cl[0].startswith(f'{n}/{n}'))
            check('Luca: giudizio della verifica', ('Intermedio' if IT else 'Intermediate') in cl[0])
            tot = pg.evaluate("Mate.worlds[1].modules.reduce((s, m) => s + m.levels.length, 0)") * 3
            check('stelle della sola classe 2', cs[-1] == f'4/{tot}' and cl[-1] == f'{2 * n}/{tot}')
            check('una colonna per modulo', pg.locator('.tch thead th').count() == len(w2) + 2)
            check('in ordine di nome', pg.locator('.tch-name').first.inner_text().endswith('Luca'))
            check('data del file', '03/11/2026' in row(pg, 'Luca').locator('.tch-where').inner_text())
            if SHOTS: pg.screenshot(path=f'{SHOTS}/t_{lang}_table.png')
            # cambio classe
            pg.locator('.tch-tab').nth(0).click(); pg.wait_for_timeout(60)
            check('in un\'altra classe i conti cambiano', cells(pg, 'Luca')[0].startswith('0/'))
            pg.locator('.tch-tab').nth(1).click(); pg.wait_for_timeout(60)
            # dettaglio
            row(pg, 'Sara').locator('.tch-name').click(); pg.wait_for_timeout(60)
            d = pg.inner_text('.modal')
            check('dettaglio: conti', (f'2 su {tot // 3}' if IT else f'2 out of {tot // 3}') in d and ('stelle 4' if IT else 'stars 4') in d)
            check('dettaglio: stelle del livello', pg.locator('.modal .tch-st').first.inner_text() == '★★★')
            check('dettaglio: verifica non fatta', ('Verifica non fatta' if IT else 'Test not taken') in d)
            if SHOTS: pg.screenshot(path=f'{SHOTS}/t_{lang}_detail.png')
            pg.locator('.modal .btn').click()
            # file più recente: migliora, non peggiora
            better = dict(sara, stars={key_of(m0, m0['levels'][0]): 1, key_of(m0, m0['levels'][2]): 2}, coins=3)
            add(pg, write('sara2.txt', backup(lang, [better], '2026-11-04T10:00:00.000Z')))
            check('stesso bambino: una riga sola', pg.locator('.tch tbody tr').count() == 2)
            check('tiene il risultato migliore', cells(pg, 'Sara')[0] == f'3/{n}' and cells(pg, 'Sara')[-1] == f'6/{tot}')
            check('data aggiornata', '04/11/2026' in row(pg, 'Sara').locator('.tch-where').inner_text())
            # file sbagliati e dell'altra lingua: gli altri passano
            other = 'en' if IT else 'it'
            anna = {'id': 'anna1', 'name': 'Anna', 'avatar': '🐧', 'coins': 1, 'stars': {}}
            add(pg, write('spesa.txt', 'la lista della spesa'), write('vuoto.txt', ''), write('altra.txt', backup(other, [anna])), write('anna.txt', backup(lang, [anna])))
            msg = pg.locator('.tch-msg')
            check('segnala i file sbagliati', all(x in msg.inner_text() for x in ['spesa.txt', 'vuoto.txt', 'altra.txt']) and msg.get_attribute('class').find('bad') > 0)
            check('i file buoni entrano lo stesso', pg.locator('.tch tbody tr').count() == 3)
            # nome con codice: resta testo
            evil = {'id': 'x1', 'name': '<img src=x onerror=H=1>', 'avatar': '🐞', 'coins': 0, 'stars': {}}
            add(pg, write('evil.txt', backup(lang, [evil])))
            check('nessun codice eseguito', pg.evaluate("typeof H === 'undefined'") and pg.locator('.tch img').count() == 0)
            # i giocatori non si toccano e tutto resta dopo il riavvio
            st = pg.evaluate("k => JSON.parse(localStorage.getItem(k) || '{\"players\":[]}')", key)
            check('i file non diventano giocatori', st['players'] == [])
            pg.reload(); pg.wait_for_timeout(200)
            check('niente giocatori nuovi nella schermata iniziale', pg.locator('.player:not(.new)').count() == 0)
            open_teacher(pg)
            check('l\'elenco resta dopo il riavvio', pg.locator('.tch tbody tr').count() == 4)
            # giocatore anche sul dispositivo: riga unica con il meglio, e niente ✕
            pg.evaluate("""([k, s]) => { const d = JSON.parse(localStorage.getItem(k) || '{"players":[]}'); d.players.push(s); localStorage.setItem(k, JSON.stringify(d)); }""", [key, dict(sara, stars={key_of(m0, m0['levels'][3]): 3}, coins=50)])
            pg.reload(); pg.wait_for_timeout(200); open_teacher(pg)
            check('giocatore del dispositivo e del file: riga unica', pg.locator('.tch-name', has_text='Sara').count() == 1)
            check('unisce i risultati', cells(pg, 'Sara')[0] == f'4/{n}')
            check('sul dispositivo non si può togliere da qui', row(pg, 'Sara').locator('.tch-del').count() == 0 and ('questo dispositivo' if IT else 'this device') in row(pg, 'Sara').inner_text())
            # togliere
            row(pg, 'Luca').locator('.tch-del').click(); pg.locator('.modal .btn.alt').click(); pg.wait_for_timeout(40)
            check('No non toglie', pg.locator('.tch-name', has_text='Luca').count() == 1)
            row(pg, 'Luca').locator('.tch-del').click(); pg.locator('.modal .btn:not(.alt)').click(); pg.wait_for_timeout(60)
            check('toglie il bambino', pg.locator('.tch-name', has_text='Luca').count() == 0)
            pg.click('#tchClear'); pg.locator('.modal .btn:not(.alt)').click(); pg.wait_for_timeout(60)
            check('svuota: restano solo i giocatori del dispositivo', pg.locator('.tch tbody tr').count() == 1)
            check('svuota: il giocatore è intatto', pg.evaluate("k => JSON.parse(localStorage.getItem(k)).players[0].coins", key) == 50)
            # indietro e trasferimento: la classe non finisce nel file dei progressi
            pg.click('#tBack'); pg.wait_for_timeout(60)
            check('indietro torna al gioco', pg.locator('.player, .world').count() > 0)
            # memoria bloccata
            c.close()
            c, pg = open_page(b, file)
            open_teacher(pg)
            pg.evaluate("() => { Storage.prototype.setItem = function () { throw new Error('piena'); }; }")
            add(pg, f1)
            check('memoria bloccata: lo dice', pg.locator('.tch-msg.bad').count() == 1)
            c.close()
        # telefono: si scorre dentro la tabella, non la pagina
        c = b.new_context(viewport={'width': 375, 'height': 667}); pg = c.new_page()
        pg.goto('file://' + ROOT + '/dist/matematica-file.html'); pg.wait_for_timeout(200)
        pg.click('#tSet'); pg.click('#tchOpen'); pg.wait_for_timeout(80)
        m0 = pg.evaluate("Mate.worlds[1].modules[0].id")
        add(pg, write('tel.txt', backup('it', [{'id': f'k{i}', 'name': n, 'avatar': '🐢', 'coins': 0, 'stars': {f'2/{m0}/x': 1}} for i, n in enumerate(['Massimiliano Ro', 'Ada', 'Pietro'])])))
        check('telefono: la pagina non scorre di lato', pg.evaluate("document.documentElement.scrollWidth <= innerWidth"))
        check('telefono: la tabella scorre', pg.evaluate("(() => { const e = document.querySelector('.tch-wrap'); return e.scrollWidth > e.clientWidth; })()"))
        if SHOTS: pg.screenshot(path=f'{SHOTS}/t_phone.png')
        b.close()
finally:
    shutil.rmtree(tmp, ignore_errors=True)
print('errori pagina:', errs)
if errs: fails.append('errori pagina')
print('INSEGNANTE OK' if not fails else 'INSEGNANTE: QUALCOSA NON VA ' + str(fails))
