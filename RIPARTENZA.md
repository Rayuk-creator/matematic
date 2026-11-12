# Ripartenza – Matematica in gioco · Maths at Play

File per riprendere il lavoro in una **nuova task**. Leggerlo tutto prima di cominciare.

Ultimo aggiornamento: 12 novembre 2026.

---

## 1. Messaggio da incollare nella nuova task

> Lavoriamo su «Matematica in gioco», repository **Rayuk-creator/matematic**. Collega il repository, passa al ramo **`sorgenti`** e leggi `RIPARTENZA.md`, poi chiedimi cosa fare. Se non capisci qualcosa dimmelo subito.

---

## 2. Cos'è il progetto

Un gioco di matematica per la **scuola primaria italiana, dalla 1ª alla 5ª**, pensato per Chrome su tablet e PC (anche alla LIM).

- **Due lingue:**
  - italiano, *Matematica in gioco*;
  - inglese, *Maths at Play*, una traduzione vera e non parola per parola.
- **Sito pubblico (GitHub Pages):**
  - italiano: https://rayuk-creator.github.io/matematic/
  - inglese: https://rayuk-creator.github.io/matematic/english.html
- **Release v1.0** pubblicata dall'utente su GitHub, con i due file offline `matematica.html` e `maths.html`.
- **Si installa come app** (PWA), funziona offline e si aggiorna da solo.
- **Non raccoglie dati:** niente account, niente pubblicità. I progressi restano in `localStorage` sul dispositivo.

**Contenuti:** 5 mondi, uno per classe. Ogni mondo ha dei moduli; ogni modulo ha dei livelli che si sbloccano uno dopo l'altro, più una verifica finale di 10 domande senza aiuti.

| Classe | Mondo | Moduli e livelli |
|---|---|---|
| 1ª | Il Prato dei Numeri | 7 moduli, 24 livelli |
| 2ª | Il Bosco delle Decine | 7 moduli, 31 livelli |
| 3ª | Il Mare delle Centinaia | 7 moduli, 30 livelli |
| 4ª | La Montagna delle Migliaia | 8 moduli, 32 livelli |
| 5ª | Lo Spazio dei Milioni | 8 moduli, 29 livelli |

In totale 146 livelli, uguali nelle due lingue. L'ultimo modulo di ogni classe è «Coding» (2 livelli).

---

## 3. Dove sta il codice

Il repository ha **due rami** di lavoro (più `android-build`, che GitHub riempie da solo con il pacchetto Android):

- **`main`**: solo il sito già costruito, che GitHub Pages pubblica dalla radice.
  - `index.html` e `english.html`: il gioco, un solo file ciascuno.
  - `sw.js`, `manifest.webmanifest`, `manifest-en.webmanifest` e le icone PNG.
  - `README.md`, bilingue.
- **`sorgenti`**: tutto quello che serve per lavorare. Non viene pubblicato.
  - `src/`:
    - `shell.html`: lo scheletro della pagina;
    - `style.css`;
    - `vis.js`: i disegni SVG (abaco, regoli, orologio, monete…);
    - `curriculum.js` e `curriculum.en.js`: livelli e generatori di domande, stessi id nelle due lingue;
    - `coding.js`: il modulo «Coding» di ogni classe, uno solo per le due lingue (testi con `t(it, en)`), con il disegno della griglia `V.grid` in `vis.js`;
    - `autocalc.js`: ricava i calcoli in colonna dal testo o dalla spiegazione;
    - `steps.js`: i passaggi in colonna;
    - `facts.js` e `facts.en.js`: le curiosità «Lo sai che…?»;
    - `guide.js` e `guide.en.js`: la guida «Cosa imparerai»;
    - `game.js`: schermate, minigiochi, salvataggio, PWA, pulsante Installa.
  - `pwa/`:
    - `privacy.html`: la pagina sulla privacy, IT ed EN nella stessa pagina (`#en` per l'inglese), copiata nel sito da `build.sh`;
    - `icon.svg` e le icone PNG;
    - `logo-64.png`;
    - i manifest;
    - `sw.template.js`;
    - `font/nunito.woff`, il font Nunito, licenza SIL OFL 1.1, con `OFL.txt`.
  - `test/`: le prove, vedi il punto 5.
  - `build.sh`: costruisce tutto.
  - `android/`: l'app per Google Play, che apre il sito;
  - `store/`: tutto per la scheda di Google Play, a partire da `GOOGLE-PLAY.md`;
  - `.github/workflows/android.yml`: fa costruire a GitHub il pacchetto Android.
  - `site/README.md`: il README bilingue (è un sorgente; il resto di `site/` viene generato).
  - `RIPARTENZA.md`: questo file.

Il ramo `sorgenti` **non ha la cronologia** del vecchio lavoro: è stato creato il 5 novembre 2026 partendo dalla copia di lavoro.

---

## 4. Come si costruisce e si pubblica

```sh
git checkout sorgenti
sh build.sh
```

`build.sh` (Python dentro uno script sh) crea:

- `dist/matematica.html` e `dist/maths.html`: versione per le pagine su claude.ai, senza `<head>`;
- `dist/matematica-file.html` e `dist/maths-file.html`: file completi da aprire offline o allegare alla Release;
- `site/index.html` e `site/english.html`:
  - con il pulsante EN/IT per cambiare lingua;
  - con i tag PWA e `window.PWA = true`;
- `site/sw.js`, generato da `pwa/sw.template.js` con versione = sha1 delle due pagine;
- le icone e i manifest copiati in `site/`.

**Dettagli tecnici:**
- Il font Nunito e il logo vengono **messi dentro la pagina** come base64, al posto dei segnaposto `__NUNITO__` (in `style.css`) e `__LOGO__` (in `game.js`).
- La lingua si sceglie con `window.LANG = 'it' | 'en'`. Le frasi delle due lingue stanno insieme in `game.js`, con `t(it, en)`.

**Per pubblicare sul sito** (solo dopo l'ok dell'utente, vedi il punto 6):

```sh
git checkout main
cp site/{index.html,english.html,sw.js,README.md} .
# anche manifest e icone, se sono cambiati
```

Poi commit e push su `main`. I commit finiscono con le righe `Co-Authored-By` / `Claude-Session` indicate dalla sessione.

Il build è **riproducibile**: il 5 novembre 2026, da questi sorgenti, uscivano file identici a quelli pubblicati.

---

## 5. Prove (da fare tutte prima di ogni pubblicazione)

```sh
sh build.sh
for L in it en; do
  LANG_GAME=$L node test/gen.test.js     # ogni livello: 400 domande, risposte e passaggi coerenti
  LANG_GAME=$L node test/steps.test.js   # i calcoli in colonna passo per passo
  LANG_GAME=$L node test/coding.test.js  # coding: ogni risposta ricalcolata leggendo domanda e griglia
  LANG_GAME=$L python3 test/ui.py        # tutti i livelli giocati in Chrome (Playwright), errori = 0
done
python3 test/pwa.py                      # manifest, service worker, offline, pulsante Installa su iPad e Android
python3 test/transfer.py                 # trasferimento dei progressi tra due dispositivi, file sbagliati rifiutati
python3 test/teacher.py                  # pagina per l'insegnante: conti per classe, file dei bambini, telefono
```

- Playwright con Chromium deve essere già installato: nelle sessioni cloud lo è.
- `ui.py` salva le schermate in `/tmp/mate-shots/`, oppure nella cartella indicata da `SHOTS=…`.
- Esito atteso:
  - `TUTTI I PASSAGGI CORRETTI`, `TUTTE GIUSTE` (coding) e `ERRORI: [] 0` in entrambe le lingue;
  - `PWA OK`;
  - `TRASFERIMENTO OK`;
  - `INSEGNANTE OK`.

---

## 6. Regole di lavoro dell'utente (importanti)

1. **Prima di aggiornare GitHub, fare una beta e fargliela controllare.** Ci sono due modi:
   - mandare in chat i file `dist/*-file.html` rinominati `matematica-BETA.html` e `maths-BETA.html`;
   - se serve provare l'app installabile, mettere il sito in una cartella `beta/` su `main`, con i manifest rinominati «(beta)».
   
   Solo dopo il suo «carica» si porta tutto nella radice e si cancella `beta/`.
2. **Ogni modifica va fatta nelle due versioni**, italiana e inglese, rispettando le convenzioni di ciascuna lingua.
3. Dopo una pubblicazione si aggiornano anche le **due pagine su claude.ai**, se la sessione può farlo:
   - IT: https://claude.ai/artifact/VtT6msaaCrtu4AS2DmaZJB (da `dist/matematica.html`);
   - EN: https://claude.ai/artifact/HrPxvKKwBVqu5beM5hYak6 (da `dist/maths.html`).
4. **Stile:** «carino ma non infantile: sono bambini ma non stupidi». Niente mascotte e niente animazioni continue.
5. L'utente scrive in italiano e non è un programmatore: spiegazioni semplici, niente gergo.

**Limiti noti delle sessioni:**
- non si possono creare Release né tag su GitHub: li crea l'utente dal sito;
- github.io non si raggiunge dalla sandbox, quindi il sito online non si può verificare da qui.

---

## 7. Decisioni didattiche già prese

- **Le operazioni sono sempre in colonna**, mostrate passo per passo con riporti e prestiti.
  - Divisione col **metodo italiano** in IT e con la **long division** in EN.
  - Decimali, divisore decimale «spostato», addizioni con più addendi.
- **I calcoli si fanno a mano sul quaderno**: nel gioco si scrive solo il risultato, e una nota lo dice ai bambini.
- **Colori dei mondi:** il testo bianco delle card deve avere contrasto almeno 4,5 (WCAG AA) su tutto il gradiente; scuriti il 12 novembre 2026.
- **Privacy:** il gioco non raccoglie dati; l'unico dato che esce è l'IP che GitHub Pages registra per sicurezza. Se si aggiunge qualcosa che manda dati (statistiche, servizi esterni, font online…), va aggiornata `pwa/privacy.html` e va chiesto all'utente.
- **Colori delle cifre:**
  - unità **blu**;
  - decine **rosse**;
  - centinaia e migliaia con i loro colori.
- **Separatori:**
  - IT: `1.234,5`;
  - EN: `1,234.5`.
- **Programma:**
  - segue le **Indicazioni nazionali del 2012**, ancora valide per le classi dalla 2ª alla 5ª;
  - le **Nuove Indicazioni nazionali** (DM 221 del 9 dicembre 2025) partono dalle classi prime nel 2026/27 e arrivano alla 5ª nel 2030/31. La novità principale per la matematica è l'**informatica** (coding, algoritmi, ripetizioni, «se… allora», variabili): c'è il modulo «Coding» in ogni classe, aggiunto il 12 novembre 2026;
  - niente *problem posing* (far inventare problemi ai bambini), altra novità delle Nuove Indicazioni: l'utente ha deciso di non aggiungerlo (12 novembre 2026);
  - dalla revisione «internazionale» è stato aggiunto **solo** «Traslazioni e rotazioni» (isometrie, 4ª);
  - gli altri argomenti in Italia si fanno alle medie, quindi non vanno aggiunti.
- **Orologio e soldi:** si trovano dalla 1ª alla 5ª, ripetuti in 3ª, 4ª e 5ª per tenerli allenati.
  - **IT:** orologio, 24 ore, durate, euro (monete e banconote disegnate), resto, prezzi.
  - **EN:** **euro anche in inglese**, come ha deciso l'utente il 5 novembre 2026: niente dollari. Orologio con **am/pm**.
    - Si scrive `€2.50`; si dice «note», non «bill», ed «eraser», non «rubber».
    - Il resto dell'inglese è **britannico** («Maths», «colour»); l'utente non ha chiesto di cambiarlo.
- **Moneta 🪙 dei premi:** è disegnata in CSS (`.coin`), perché su alcuni tablet l'emoji non si vede.
  - Evitare le emoji troppo recenti: sono già state sostituite 🪐, 🪨 e 🟰.
- **Guida «Cosa imparerai»:** per ogni classe, con definizioni. Compare da sola la prima volta che si entra nel mondo.
- **Trasferimento dei progressi** (⚙️ Impostazioni, `transferBox` in `game.js`):
  - si salva in un file `.txt`, perché su Android i file `.json` non si possono inviare con il pulsante di condivisione;
  - il file contiene i giocatori delle **due lingue**; non contiene le impostazioni né le domande recenti;
  - caricare **non cancella mai**: i giocatori si riconoscono dall'id e per ogni livello si tiene il risultato migliore; le monete prendono il valore più alto, senza sommarsi;
  - se cambia il formato del file, aumentare `BACKUP_VERSION`: i file vecchi devono continuare a caricarsi.
- **Progressi della classe** (⚙️ Impostazioni, `showTeacher` in `game.js`):
  - mostra i giocatori del dispositivo e i file dei progressi raccolti dall'insegnante, una lingua alla volta;
  - i file stanno in un elenco a parte (`mate-classe-v1`, `math-class-en-v1`): non diventano giocatori e non finiscono nel file dei progressi;
  - niente password: l'ha deciso l'utente.

---

## 8. Lavori in attesa

### Google Play (in corso dal 12 novembre 2026)

**Tutto è spiegato in `store/GOOGLE-PLAY.md`**: decisioni, com'è fatta l'app, testi della scheda, risposte ai questionari e passi in ordine. Leggerlo prima di toccare qualcosa.

In breve:
- una sola app per le due lingue, identificativo `io.github.rayukcreator.matematica`;
- è una «Trusted Web Activity», cioè un'app che apre il sito: aggiornando GitHub si aggiorna anche l'app;
- il progetto è in `android/`; il pacchetto lo costruisce GitHub e lo salva, senza firma, nel ramo `android-build`;
- la chiave di caricamento e la sua password le tiene **solo l'utente**: non vanno su GitHub.

**Fatto:**
- account sviluppatore creato dall'utente (12 novembre 2026);
- progetto Android, pacchetto v1 (versionCode 1) costruito, controllato e firmato;
- testi IT/EN, icona, grafica in evidenza, schermate telefono e tablet;
- verifica del dominio: repository `Rayuk-creator.github.io` creato, `assetlinks.json` pubblicato con le due impronte (copia in `store/dominio/`);
- app creata in Play Console e pacchetto `1 (1.0)` pubblicato nel **test interno**.

**Da fare:**
- l'utente prova l'app dal test interno (deve aprirsi a tutto schermo, senza barra dell'indirizzo);
- l'utente compila questionari e scheda dello store, poi apre il test chiuso;
- **test chiuso con almeno 12 tester per 14 giorni di fila**, poi richiesta di accesso alla produzione;
- prima della produzione: una riga sull'app Android in `pwa/privacy.html` (da far approvare all'utente).

### Altre idee, non richieste

Per ora nessuna.
