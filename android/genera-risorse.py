"""Crea le icone e l'immagine di avvio dell'app Android partendo da pwa/icon.svg.
Uso: python3 android/genera-risorse.py   (serve Playwright con Chromium)"""
import os, re
from playwright.sync_api import sync_playwright
QUI = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(QUI, 'app/src/main/res')
svg = open(os.path.join(QUI, '../pwa/icon.svg'), encoding='utf-8').read()
# Icona adattiva: lo sfondo resta a tutta grandezza, i mattoncini e la stella si rimpiccioliscono
# al 72% per stare dentro la zona sicura (cerchio di 66 dp su 108 dp).
i = svg.index('<path d="M398 118')
j = svg.rindex('</svg>')
adattiva = svg[:i] + '<g transform="translate(256 256) scale(.72) translate(-256 -256)">' + svg[i:j] + '</g></svg>'
DENS = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
def pagina(s, lato, raggio=''):
    return ('<html><body style="margin:0;background:transparent"><div style="width:%dpx;height:%dpx;overflow:hidden;%s">%s</div></body></html>'
            % (lato, lato, raggio, re.sub(r'width="512" height="512"', 'width="%d" height="%d"' % (lato, lato), s, count=1)))
with sync_playwright() as p:
    b = p.chromium.launch()
    def scatta(s, lato, file, raggio=''):
        pg = b.new_page(viewport={'width': lato, 'height': lato})
        pg.set_content(pagina(s, lato, raggio))
        os.makedirs(os.path.dirname(file), exist_ok=True)
        pg.screenshot(path=file, omit_background=True, clip={'x': 0, 'y': 0, 'width': lato, 'height': lato})
        pg.close()
    for d, k in DENS.items():
        scatta(svg, round(48 * k), f'{RES}/mipmap-{d}/ic_launcher.png', 'border-radius:22%')        # icona classica
        scatta(adattiva, round(108 * k), f'{RES}/mipmap-{d}/ic_launcher_foreground.png')            # icona adattiva
        scatta(svg, round(160 * k), f'{RES}/drawable-{d}/splash.png', 'border-radius:22%')          # immagine di avvio
    b.close()
print('risorse create in', RES)
