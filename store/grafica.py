"""Grafica in evidenza (1024×500) e icona (512×512) per la scheda di Google Play.
Uso: python3 store/grafica.py   → store/grafica/"""
from playwright.sync_api import sync_playwright
from PIL import Image
import os, base64
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.environ.get('OUT', ROOT + '/store/grafica'); os.makedirs(OUT, exist_ok=True)
font = base64.b64encode(open(ROOT + '/pwa/font/nunito.woff', 'rb').read()).decode()
svg = open(ROOT + '/pwa/icon.svg', encoding='utf-8').read()
i = svg.index('<path d="M398 118'); j = svg.rindex('</svg>')
mattoncini = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="80 80 370 350" width="370" height="350">' + svg[svg.index('<defs>'):svg.index('<rect width="512"')] + svg[i:j] + '</svg>'
TESTI = {'it': ('Matematica<br>in gioco', 'Scuola primaria · dalla 1ª alla 5ª', ['146 livelli', 'Calcoli in colonna', 'Senza pubblicità']),
         'en': ('Maths<br>at Play', 'Primary school · Grades 1 to 5', ['146 levels', 'Column methods', 'No ads'])}
HTML = '''<html><head><style>
@font-face { font-family: Nunito; font-weight: 500 900; src: url(data:font/woff;base64,%s); }
body { margin: 0; width: 1024px; height: 500px; overflow: hidden; font-family: Nunito, sans-serif; color: #fff;
  background: linear-gradient(180deg, #6ea8ff, #7b5cf0); position: relative; }
.c { position: absolute; border-radius: 50%%; background: #fff; }
.txt { position: absolute; left: 64px; top: 0; height: 500px; width: 560px; display: flex; flex-direction: column; justify-content: center; }
h1 { margin: 0; font-size: 88px; line-height: .98; font-weight: 900; letter-spacing: -1px; text-shadow: 0 4px 0 rgba(40, 30, 120, .28); }
.sub { margin-top: 20px; font-size: 30px; font-weight: 800; opacity: .96; }
.tags { margin-top: 26px; display: flex; gap: 10px; }
.tags span { background: rgba(255, 255, 255, .2); border-radius: 999px; padding: 7px 16px; font-size: 20px; font-weight: 800; white-space: nowrap; }
.art { position: absolute; right: 44px; top: 75px; }
</style></head><body>
<div class="c" style="width:150px;height:150px;left:-40px;top:-50px;opacity:.12"></div>
<div class="c" style="width:90px;height:90px;left:560px;top:28px;opacity:.12"></div>
<div class="c" style="width:230px;height:230px;right:-70px;bottom:-90px;opacity:.1"></div>
<div class="txt"><h1>%s</h1><div class="sub">%s</div><div class="tags">%s</div></div>
<div class="art">%s</div>
</body></html>'''
with sync_playwright() as p:
    b = p.chromium.launch()
    for lang, (titolo, sotto, tags) in TESTI.items():
        pg = b.new_page(viewport={'width': 1024, 'height': 500})
        pg.set_content(HTML % (font, titolo, sotto, ''.join('<span>%s</span>' % t for t in tags), mattoncini))
        pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(300)
        f = f'{OUT}/grafica-in-evidenza-{lang}.png'
        pg.screenshot(path=f); pg.close()
        Image.open(f).convert('RGB').save(f)      # 24 bit, senza trasparenza
        print(f, Image.open(f).size)
    b.close()
ic = Image.open(ROOT + '/pwa/icon-512.png').convert('RGBA'); ic.save(OUT + '/icona-512.png')   # PNG a 32 bit, 512×512
print('icona', ic.size, ic.mode)
