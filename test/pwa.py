"""App installabile (PWA): manifest senza errori, service worker attivo, pagine che si aprono offline,
pulsante «📲 Installa» sempre visibile con le istruzioni giuste su iPad e Android.
Prima: sh build.sh. Uso: python3 test/pwa.py"""
from playwright.sync_api import sync_playwright
import os, shutil, subprocess, tempfile, time
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tmp = tempfile.mkdtemp(); shutil.copytree(ROOT + '/site', tmp + '/matematic')
srv = subprocess.Popen(['python3', '-m', 'http.server', '8765', '-d', tmp], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
BASE = 'http://localhost:8765/matematic/'
UAS = {'ipad': ('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1', 'Condividi'),
       'android': ('Mozilla/5.0 (Linux; Android 14; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36', 'Installa app')}
ok = True
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); ctx = b.new_context(); pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        for path in ['index.html', 'english.html']:
            pg.goto(BASE + path); pg.wait_for_timeout(1500)
            cdp = ctx.new_cdp_session(pg)
            man = cdp.send('Page.getAppManifest'); inst = cdp.send('Page.getInstallabilityErrors')
            print(path, 'manifest:', man.get('errors'), '| installabilità:', inst.get('installabilityErrors'))
            ok &= not man.get('errors') and not inst.get('installabilityErrors')
        pg.reload(); pg.wait_for_timeout(800)
        ctx.set_offline(True)
        for path in ['index.html', 'english.html', '']:
            pg.goto(BASE + path); pg.wait_for_timeout(500)
            print('offline', path or '(cartella)', '->', pg.title()); ok &= bool(pg.title())
        for k, (ua, word) in UAS.items():
            c = b.new_context(user_agent=ua, viewport={'width': 800, 'height': 1100})
            c.add_init_script("window.addEventListener('beforeinstallprompt', e => e.stopImmediatePropagation())")
            q = c.new_page(); q.goto(BASE + 'index.html'); q.wait_for_timeout(800)
            vis = q.is_visible('#tInstall'); q.click('#tInstall'); q.wait_for_timeout(200)
            txt = q.inner_text('.modal') if q.locator('.modal').count() else ''
            print(k, 'pulsante visibile:', vis, '| istruzioni giuste:', word in txt); ok &= vis and word in txt
        print('errori pagina:', errs); ok &= not errs
finally:
    srv.kill(); shutil.rmtree(tmp, ignore_errors=True)
print('PWA OK' if ok else 'PWA: QUALCOSA NON VA')
