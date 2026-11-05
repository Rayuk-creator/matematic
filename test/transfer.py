"""Trasferimento dei progressi: file vero scaricato da un dispositivo e caricato su un altro (browser separati),
senza perdere niente, nelle due lingue, con i file sbagliati rifiutati.
Prima: sh build.sh. Uso: python3 test/transfer.py"""
from playwright.sync_api import sync_playwright
import json, os, shutil, subprocess, tempfile, time
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tmp = tempfile.mkdtemp(); shutil.copytree(ROOT + '/site', tmp + '/matematic')
srv = subprocess.Popen(['python3', '-m', 'http.server', '8766', '-d', tmp], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
BASE = 'http://localhost:8766/matematic/'
KEY = {'it': 'mate-gioco-v1', 'en': 'math-game-en-v1'}
PAGE = {'it': 'index.html', 'en': 'english.html'}
fails = []
errs = []
def check(what, cond):
    print(('ok   ' if cond else 'NO   ') + what)
    if not cond: fails.append(what)

def device(b, lang='it', saves=None, **kw):
    """Un dispositivo a sé: un contesto del browser con la sua memoria."""
    c = b.new_context(accept_downloads=True, **kw)
    # i salvataggi iniziali si scrivono una volta sola, altrimenti ricaricare la pagina li rimetterebbe
    if saves:
        c.add_init_script("if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); const s = %s; for (const k in s) localStorage.setItem(k, JSON.stringify(s[k])); }" % json.dumps({KEY[k]: v for k, v in saves.items()}))
    pg = c.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(BASE + PAGE[lang]); pg.wait_for_timeout(250)
    return c, pg

def stored(pg, lang):
    return pg.evaluate("k => JSON.parse(localStorage.getItem(k) || 'null')", KEY[lang])

def player(s, pid):
    return next(x for x in s['players'] if x['id'] == pid)

def export(pg, path):
    pg.click('#tSet')
    with pg.expect_download() as d: pg.click('#xferSave')
    d.value.save_as(path)
    name = d.value.suggested_filename
    pg.locator('.modal .btn:not(.alt)').last.click(); pg.wait_for_timeout(50)
    return name

def choose(pg, path):
    pg.click('#tSet')
    with pg.expect_file_chooser() as fc: pg.click('#xferLoad')
    fc.value.set_files(path); pg.wait_for_timeout(150)

def load(pg, path):
    choose(pg, path)
    pg.locator('.modal .btn.ok').click(); pg.wait_for_timeout(150)

def bad_file(pg, text, name='prova.txt'):
    path = tmp + '/' + name
    open(path, 'w', encoding='utf-8').write(text)
    before = json.dumps(stored(pg, 'it'), sort_keys=True)
    choose(pg, path)
    msg = pg.inner_text('.xfer-msg') if pg.is_visible('.xfer-msg.bad') else ''
    no_confirm = pg.locator('.modal .btn.ok').count() == 0
    same = json.dumps(stored(pg, 'it'), sort_keys=True) == before
    pg.locator('.modal .btn:not(.alt)').last.click(); pg.wait_for_timeout(30)
    return bool(msg) and no_confirm and same

SIMONE = {'id': 'pa1', 'name': 'Simone', 'avatar': '🦊', 'coins': 40,
          'stars': {'1/num/a': 3, '1/num/b': 1, '2/ops/c': 2}, 'verif': {'1/num/verifica': 80},
          'guideSeen': {'1': True}, 'seenFacts': [1, 2], 'recent': {'1/num/a': ['x']}, 'spin': 7}
ANNA = {'id': 'pa2', 'name': 'Anna', 'avatar': '🐼', 'coins': 5, 'stars': {'1/num/a': 2}}
JOE = {'id': 'pe1', 'name': 'Joe', 'avatar': '🐸', 'coins': 9, 'stars': {'3/x/y': 3}}
base = {'it': {'players': [SIMONE, ANNA], 'cur': None, 'teacher': False, 'sound': True},
        'en': {'players': [JOE], 'cur': None, 'teacher': False, 'sound': True}}

try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        # 1. dal tablet vecchio al tablet nuovo, vuoto
        c1, old = device(b, 'it', base)
        f = tmp + '/progressi.txt'
        name = export(old, f)
        check('nome del file: ' + name, name.startswith('matematica-progressi-') and name.endswith('.txt'))
        data = json.load(open(f, encoding='utf-8'))
        check('il file contiene le due lingue', set(data['saves']) == {'it', 'en'})
        check('il file non porta i dati inutili', 'recent' not in data['saves']['it']['players'][0] and 'spin' not in data['saves']['it']['players'][0])
        c2, new = device(b, 'it')
        check('tablet nuovo vuoto', stored(new, 'it') is None or not stored(new, 'it')['players'])
        choose(new, f)
        txt = new.inner_text('.modal:last-of-type')
        check('prima di caricare mostra chi c\'è', all(w in txt for w in ['Simone', 'Anna', 'Joe', 'Caricare']))
        new.locator('.modal .btn.alt', has_text='Annulla').last.click(); new.wait_for_timeout(50)
        check('Annulla non carica niente', not (stored(new, 'it') or {'players': []})['players'])
        new.locator('.modal .btn:not(.alt)').last.click(); new.wait_for_timeout(50)
        load(new, f)
        check('giocatori visibili dopo il caricamento', new.locator('.player:not(.new)').count() == 2)
        s = stored(new, 'it')
        check('stelle, verifiche, monete e guida identiche', all(player(s, 'pa1')[k] == SIMONE[k] for k in ['stars', 'verif', 'coins', 'guideSeen', 'seenFacts', 'name', 'avatar']))
        new.reload(); new.wait_for_timeout(200)
        check('restano dopo aver riavviato', new.locator('.player:not(.new)').count() == 2)
        new.click('.player:not(.new) >> nth=0'); new.wait_for_timeout(100)
        check('il giocatore caricato si può usare', 'Simone' in new.inner_text('#tPlayer'))
        new.evaluate("__mate.showWorlds()")
        w, m, l = new.evaluate("(() => { const w = Mate.worlds[0], m = w.modules[0]; return [w.n, m.id, m.levels[0].id]; })()")
        new.evaluate(f"__mate.play({w}, '{m}', '{l}')"); new.wait_for_timeout(100)
        check('si gioca subito', new.locator('.qcard').count() == 1)
        new.goto(BASE + PAGE['en']); new.wait_for_timeout(200)
        check('anche la lingua inglese arriva', new.locator('.player:not(.new)', has_text='Joe').count() == 1)

        # 2. la stessa cosa dalla versione inglese
        c3, en_old = device(b, 'en', base)
        f_en = tmp + '/progress.txt'
        name = export(en_old, f_en)
        check('nome inglese: ' + name, name.startswith('maths-progress-'))
        c4, en_new = device(b, 'en')
        choose(en_new, f_en)
        check('conferma in inglese', 'Load this progress?' in en_new.inner_text('.modal:last-of-type'))
        en_new.locator('.modal .btn.ok').click(); en_new.wait_for_timeout(150)
        check('giocatore inglese caricato', en_new.locator('.player:not(.new)', has_text='Joe').count() == 1)
        check('il file dall\'inglese porta anche l\'italiano', player(stored(en_new, 'it'), 'pa1')['coins'] == 40)

        # 3. l'unione non perde mai niente
        LOCAL = {'id': 'pa1', 'name': 'Simone', 'avatar': '🦊', 'coins': 100,
                 'stars': {'1/num/a': 1, '1/num/b': 3, '5/z/z': 2}, 'verif': {'1/num/verifica': 50, '2/o/verifica': 90},
                 'guideSeen': {'2': True}, 'seenFacts': [2, 3], 'recent': {'k': ['locale']}, 'spin': 3}
        OTHER = {'id': 'pz', 'name': 'Marta', 'avatar': '🐧', 'coins': 1, 'stars': {}}
        c5, mix = device(b, 'it', {'it': {'players': [LOCAL, OTHER], 'cur': None, 'teacher': True, 'sound': False}})
        load(mix, f)
        s = stored(mix, 'it')
        q = player(s, 'pa1')
        check('per ogni livello tiene le stelle migliori', q['stars'] == {'1/num/a': 3, '1/num/b': 3, '2/ops/c': 2, '5/z/z': 2})
        check('tiene la verifica migliore', q['verif'] == {'1/num/verifica': 80, '2/o/verifica': 90})
        check('tiene le monete più alte, senza sommarle', q['coins'] == 100)
        check('unisce guide viste e curiosità', q['guideSeen'] == {'1': True, '2': True} and sorted(q['seenFacts']) == [1, 2, 3])
        check('non tocca le domande recenti di questo dispositivo', q['recent'] == {'k': ['locale']} and q['spin'] == 3)
        check('il giocatore che c\'era resta', player(s, 'pz')['name'] == 'Marta')
        check('il giocatore nuovo si aggiunge', player(s, 'pa2')['name'] == 'Anna' and len(s['players']) == 3)
        check('le impostazioni di questo dispositivo non cambiano', s['teacher'] is True and s['sound'] is False)
        snap = json.dumps(s, sort_keys=True)
        load(mix, f)
        check('caricare due volte lo stesso file non cambia niente', json.dumps(stored(mix, 'it'), sort_keys=True) == snap)

        # 4. file sbagliati
        c6, g = device(b, 'it', {'it': {'players': [ANNA], 'cur': None, 'teacher': False, 'sound': True}})
        check('rifiuta un testo qualunque', bad_file(g, 'la lista della spesa'))
        check('rifiuta un altro file di dati', bad_file(g, '{"a": 1}'))
        check('rifiuta un file di un altro gioco', bad_file(g, json.dumps({'app': 'altro', 'version': 1, 'saves': {}})))
        check('rifiuta un file di una versione futura', bad_file(g, json.dumps({'app': 'matematica-in-gioco', 'version': 2, 'saves': {'it': {'players': [ANNA]}}})))
        check('rifiuta un file senza giocatori', bad_file(g, json.dumps({'app': 'matematica-in-gioco', 'version': 1, 'saves': {'it': {'players': []}}})))
        check('rifiuta giocatori non validi', bad_file(g, json.dumps({'app': 'matematica-in-gioco', 'version': 1, 'saves': {'it': {'players': [{'id': 1}, 'x', None]}}})))
        check('un file vuoto', bad_file(g, ''))
        check('il messaggio d\'errore non blocca il gioco', g.locator('.player:not(.new)').count() == 1)

        # 5. dati strani o pericolosi: si scartano e il nome resta testo
        evil = tmp + '/evil.txt'
        json.dump({'app': 'matematica-in-gioco', 'version': 1, 'saves': {'it': {'players': [{
            'id': 'pe', 'name': '<img src=x onerror="window.HACK=1">lunghissimo', 'avatar': '<b>x</b>lungo', 'coins': -5,
            'stars': {'1/a/b': 99, '__proto__': 3, 'constructor': 3, '1/a/c': 2, '1/a/d': '3'}, 'verif': {'1/a/verifica': 101},
            'guideSeen': 'x', 'seenFacts': ['a', 1]}]}}}, open(evil, 'w', encoding='utf-8'))
        load(g, evil)
        s = stored(g, 'it'); q = player(s, 'pe')
        check('scarta i valori non validi', q['stars'] == {'1/a/c': 2} and q['verif'] == {} and q['coins'] == 0 and q['seenFacts'] == [1] and q['avatar'] != '<b>x</b>lungo')
        check('nome tagliato a 16 caratteri', len(q['name']) <= 16)
        check('nessun codice eseguito', g.evaluate("window.HACK === undefined && ({}).polluted === undefined"))
        check('nessuna immagine iniettata', g.locator('.player img').count() == 0)

        # 6. nessun progresso da salvare
        c7, e = device(b, 'it')
        e.click('#tSet'); e.click('#xferSave'); e.wait_for_timeout(100)
        check('senza giocatori lo dice', 'ancora' in e.inner_text('.xfer-msg'))
        c8, ee = device(b, 'en')
        ee.click('#tSet'); ee.click('#xferSave'); ee.wait_for_timeout(100)
        check('anche in inglese', 'no progress' in ee.inner_text('.xfer-msg'))

        # 7. file con solo l'altra lingua
        only = tmp + '/only.txt'
        json.dump({'app': 'matematica-in-gioco', 'version': 1, 'saves': {'en': {'players': [JOE]}}}, open(only, 'w', encoding='utf-8'))
        e.locator('.modal .btn:not(.alt)').last.click(); e.wait_for_timeout(50)
        load(e, only)
        check('avvisa che è nell\'altra lingua', 'inglese' in e.inner_text('#toast'))
        check('il giocatore inglese è salvato', player(stored(e, 'en'), 'pe1')['name'] == 'Joe')

        # 8. memoria piena o bloccata: lo dice, e niente sembra caricato
        c9, full = device(b, 'it')
        full.evaluate("() => { Storage.prototype.setItem = function () { throw new Error('piena'); }; }")
        choose(full, f)
        full.locator('.modal .btn.ok').click(); full.wait_for_timeout(150)
        check('avvisa se non riesce a salvare', full.is_visible('.xfer-msg.bad'))
        check('non mostra giocatori mai salvati', full.evaluate("__mate.D.players.length") == 0)

        # 9. pulsante Invia: compare solo dove il dispositivo sa inviare, e manda un file vero
        c10, sh = device(b, 'it', base)
        sh.evaluate("""() => { navigator.canShare = () => true; window.__sent = null;
            navigator.share = async d => { window.__sent = {name: d.files[0].name, text: await d.files[0].text()}; }; }""")
        sh.click('#tSet'); sh.click('#xferShare'); sh.wait_for_timeout(150)
        sent = sh.evaluate('window.__sent')
        check('invia un file valido', sent and sent['name'].endswith('.txt') and json.loads(sent['text'])['app'] == 'matematica-in-gioco')
        sh.locator('.modal .btn:not(.alt)').last.click(); sh.wait_for_timeout(50)
        sh.evaluate("""() => { navigator.share = async () => { const e = new Error('annullato'); e.name = 'AbortError'; throw e; }; }""")
        sh.click('#tSet'); sh.click('#xferShare'); sh.wait_for_timeout(150)
        check('annullare l\'invio non fa niente', not sh.is_visible('.xfer-msg'))
        sh.locator('.modal .btn:not(.alt)').last.click(); sh.wait_for_timeout(50)

        # 10. la versione da aprire offline, senza sito
        for lang, file in (('it', 'matematica-file.html'), ('en', 'maths-file.html')):
            c = b.new_context(accept_downloads=True); o = c.new_page()
            o.on('pageerror', lambda e: errs.append(str(e)))
            o.goto('file://' + ROOT + '/dist/' + file); o.wait_for_timeout(200)
            o.click('#tSet')
            with o.expect_file_chooser() as fc: o.click('#xferLoad')
            fc.value.set_files(f); o.wait_for_timeout(150)
            o.locator('.modal .btn.ok').click(); o.wait_for_timeout(150)
            who = 'Simone' if lang == 'it' else 'Joe'
            check(f'file offline {lang}: carica', o.locator('.player:not(.new)', has_text=who).count() == 1)
            o.click('#tSet')
            with o.expect_download() as d: o.click('#xferSave')
            check(f'file offline {lang}: salva', d.value.suggested_filename.endswith('.txt'))
            c.close()

        # 11. tutte le chiavi vere dei livelli passano il controllo
        c11, all_ = device(b, 'it')
        for lang in ('it', 'en'):
            all_.goto(BASE + PAGE[lang]); all_.wait_for_timeout(150)
            keys = all_.evaluate("Mate.worlds.flatMap(w => w.modules.flatMap(m => [...m.levels.map(l => `${w.n}/${m.id}/${l.id}`), `${w.n}/${m.id}/verifica`]))")
            full_file = tmp + f'/all_{lang}.txt'
            json.dump({'app': 'matematica-in-gioco', 'version': 1, 'saves': {lang: {'players': [{'id': 'tutti', 'name': 'Tutti', 'avatar': '🦉', 'coins': 7, 'stars': {k: 3 for k in keys}, 'verif': {k: 100 for k in keys}}]}}}, open(full_file, 'w', encoding='utf-8'))
            load(all_, full_file)
            q = player(stored(all_, lang), 'tutti')
            check(f'{lang}: tutti i {len(keys)} livelli e verifiche conservati', len(q['stars']) == len(keys) and len(q['verif']) == len(keys))
        # 12. un giocatore reale: si gioca, si esporta, si ritrova identico
        c12, real = device(b, 'it')
        real.click('.player.new'); real.fill('.modal .field', 'Giulia'); real.click('.modal .btn:not(.alt)'); real.wait_for_timeout(100)
        real.evaluate("__mate.showWorlds()")
        w, m, l = real.evaluate("(() => { const w = Mate.worlds[0], m = w.modules[0]; return [w.n, m.id, m.levels[0].id]; })()")
        real.evaluate(f"__mate.play({w}, '{m}', '{l}')"); real.wait_for_timeout(50)
        for _ in range(8):
            q = real.evaluate("(() => { const c = __mate.cur(); const q = c.qs[c.i]; return {k: q.k, a: q.a, f: q.f ? q.f.map(x => x.a) : null, o: q.o} })()")
            if q['k'] == 'choice': real.locator('.balloon').nth(q['a']).click(force=True)
            elif q['k'] == 'cmp': real.locator('.croc', has_text=q['a']).first.click()
            else:
                for i, v in enumerate(q['f'] if q['k'] == 'multi' else [q['a']]):
                    if i: real.keyboard.press('Tab')
                    for ch in str(v): real.keyboard.press(ch)
                real.keyboard.press('Enter')
            real.wait_for_timeout(20); real.keyboard.press('Enter'); real.wait_for_timeout(15)
        before = stored(real, 'it')['players'][0]
        check('il giocatore ha guadagnato stelle', sum(before['stars'].values()) == 3)
        f3 = tmp + '/giulia.txt'
        real.evaluate("__mate.showWorlds()"); real.click('#tSet')
        with real.expect_download() as d: real.click('#xferSave')
        d.value.save_as(f3)
        c13, dest = device(b, 'it')
        load(dest, f3)
        after = stored(dest, 'it')['players'][0]
        check('Giulia arriva identica', all(after[k] == before[k] for k in ['id', 'name', 'avatar', 'coins', 'stars']))
        b.close()
finally:
    srv.kill(); shutil.rmtree(tmp, ignore_errors=True)
print('errori pagina:', errs)
if errs: fails.append('errori pagina')
print('TRASFERIMENTO OK' if not fails else 'TRASFERIMENTO: QUALCOSA NON VA ' + str(fails))
