#!/bin/sh
# Costruisce la versione italiana (dist/matematica*.html) e quella inglese (dist/maths*.html)
set -e
cd "$(dirname "$0")"
python3 - <<'PY'
import os
os.makedirs('dist', exist_ok=True)
shell = open('src/shell.html', encoding='utf-8').read()
import base64
css = open('src/style.css', encoding='utf-8').read().replace('__NUNITO__', base64.b64encode(open('pwa/font/nunito.woff', 'rb').read()).decode())
LOGO = base64.b64encode(open('pwa/logo-64.png', 'rb').read()).decode()
def build(lang, files, title, out, out_file, switch=None, head_extra='', pwa=False):
    js = f"window.LANG = '{lang}';\n" + ('window.PWA = true;\n' if pwa else '') + '\n'.join(open('src/' + f, encoding='utf-8').read() for f in files).replace('__LOGO__', LOGO)
    assert '</script' not in js
    page = shell.replace('<title>Matematica in gioco</title>', f'<title>{title}</title>')
    if switch:  # versione per il sito: pulsante per cambiare lingua
        href, label, tip = switch
        page = page.replace('<button class="icon-btn" id="tSet"', f'<a class="icon-btn lang-btn" href="{href}" title="{tip}" aria-label="{tip}">{label}</a>\n    <button class="icon-btn" id="tSet"')
    page = page.replace('/*__CSS__*/', css).replace('/*__JS__*/', js)
    open('dist/' + out, 'w', encoding='utf-8').write(page)
    head = f'<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">{head_extra}</head><body>'
    open('dist/' + out_file, 'w', encoding='utf-8').write(head + page + '</body></html>')
    print('ok', lang, len(page))
build('it', ['vis.js', 'coding.js', 'curriculum.js', 'autocalc.js', 'facts.js', 'guide.js', 'steps.js', 'game.js'], 'Matematica in gioco', 'matematica.html', 'matematica-file.html')
build('en', ['vis.js', 'coding.js', 'curriculum.en.js', 'autocalc.js', 'facts.en.js', 'guide.en.js', 'steps.js', 'game.js'], 'Maths at Play', 'maths.html', 'maths-file.html')
# sito per GitHub Pages: index.html (italiano) e english.html, con il pulsante della lingua
import os
os.makedirs('site', exist_ok=True)
def pwa_head(manifest, title, desc):
    return (f'<link rel="manifest" href="{manifest}"><meta name="theme-color" content="#4361ee"><meta name="description" content="{desc}">'
            '<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png"><link rel="apple-touch-icon" href="apple-touch-icon.png">'
            f'<meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="{title}">')
build('it', ['vis.js', 'coding.js', 'curriculum.js', 'autocalc.js', 'facts.js', 'guide.js', 'steps.js', 'game.js'], 'Matematica in gioco', '../site/.it.tmp', '../site/index.html', ('english.html', 'EN', 'English version'),
      pwa_head('manifest.webmanifest', 'Matematica', 'Gioco di matematica per la scuola primaria, dalla 1ª alla 5ª.'), True)
build('en', ['vis.js', 'coding.js', 'curriculum.en.js', 'autocalc.js', 'facts.en.js', 'guide.en.js', 'steps.js', 'game.js'], 'Maths at Play', '../site/.en.tmp', '../site/english.html', ('index.html', 'IT', 'Versione italiana'),
      pwa_head('manifest-en.webmanifest', 'Maths', 'A primary-school maths game, Grades 1 to 5.'), True)
# file dell'app installabile: icone, manifest e service worker (con una versione nuova a ogni costruzione)
import shutil, hashlib
for f in ['privacy.html', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon-32.png', 'manifest.webmanifest', 'manifest-en.webmanifest']: shutil.copy('pwa/' + f, 'site/' + f)
ver = hashlib.sha1(open('site/index.html', 'rb').read() + open('site/english.html', 'rb').read()).hexdigest()[:10]
open('site/sw.js', 'w').write(open('pwa/sw.template.js').read().replace('__VERSION__', ver))
for f in ('site/.it.tmp', 'site/.en.tmp'): os.remove(f)
PY
