# Google Play – Matematica in gioco · Maths at Play

Tutto quello che serve per pubblicare il gioco su Google Play. Preparato il 12 novembre 2026.

Chi fa cosa: **Claude** prepara pacchetto, testi, immagini e risposte; **l'utente** crea l'account, carica i file e fa il test con i 12 tester.

---

## 1. Decisioni prese (12 novembre 2026)

- **Una sola app** per le due lingue.
  - Sui dispositivi in italiano si apre `index.html`; su tutti gli altri `english.html`.
  - Dentro il gioco resta il pulsante IT/EN.
- **Due nomi**, uno per lingua: «Matematica in gioco» nella scheda italiana, «Maths at Play» in quella inglese. Anche sotto l'icona il nome segue la lingua del dispositivo.
- **Identificativo dell'app** (non si può più cambiare dopo la pubblicazione): `io.github.rayukcreator.matematica`.
- **Gratis**, senza pubblicità e senza acquisti.
- **Tipo e categoria:** App → Istruzione.

---

## 2. Com'è fatta l'app

È una «Trusted Web Activity»: una piccola app che apre il sito `https://rayuk-creator.github.io/matematic/` a tutto schermo, senza la barra del browser.

- **Aggiornando il sito si aggiorna anche l'app.** Il pacchetto va ricaricato su Google Play solo se cambiano nome, icona o regole di Google.
- **Non chiede nessun permesso** al dispositivo.
- **Progetto:** cartella `android/` del ramo `sorgenti`.
- **Costruzione:** la fa GitHub da solo (`.github/workflows/android.yml`) ogni volta che cambia qualcosa in `android/`. Il risultato finisce nel ramo `android-build`:
  - `app-release.aab`: il pacchetto, ancora senza firma;
  - `build.log` ed `ESITO.txt`: il registro, per capire eventuali errori.
- **Firma:** si fa fuori da GitHub, con la chiave di caricamento che tiene l'utente:

  ```sh
  git fetch origin android-build && git show FETCH_HEAD:app-release.aab > app.aab
  jarsigner -keystore chiave-caricamento.jks -sigalg SHA256withRSA -digestalg SHA-256 app.aab caricamento
  ```

- **Versione:** a ogni nuovo pacchetto da caricare aumentare di 1 `versionCode` in `android/app/build.gradle`.
- **Icone e immagine di avvio:** `python3 android/genera-risorse.py` le ricrea da `pwa/icon.svg`.
- **Requisito di Google:** dal 31 agosto 2026 le app nuove devono avere `targetSdk 36` (Android 16). Il pacchetto lo rispetta. Ogni anno Google alza il numero: allora basta cambiarlo e ricostruire.

### La chiave di caricamento

- File `chiave-caricamento.jks`, nome della chiave `caricamento`, valida fino al 2056.
- Impronta SHA-256: `9B:6D:72:00:82:98:68:EE:C3:08:34:92:56:50:A8:4E:59:B4:30:93:73:11:56:8A:24:86:81:10:0D:8C:22:0E`
- **La tiene solo l'utente**, insieme alla password: non va messa su GitHub (il repository è pubblico).
- Se si perde non è un disastro: con la «Firma dell'app di Google Play» se ne può chiedere una nuova all'assistenza di Play Console.

---

## 3. Verifica del dominio (per togliere la barra del browser)

L'app si apre a tutto schermo solo se il sito «riconosce» l'app. Serve il file

`https://rayuk-creator.github.io/.well-known/assetlinks.json`

che deve stare in un repository a parte, chiamato esattamente **`Rayuk-creator.github.io`** (pubblico). I file sono pronti in `store/dominio/`:

- `.well-known/assetlinks.json`: le impronte delle chiavi;
- `.nojekyll`: senza questo file GitHub Pages nasconde la cartella `.well-known`;
- `index.html`: manda al gioco chi apre `https://rayuk-creator.github.io/`.

Nel file vanno **due impronte**:

1. quella della **chiave di firma dell'app** creata da Google (aggiunta il 12 novembre 2026): `CD:91:BE:AD:67:DA:B2:71:EE:2C:4C:4D:0F:8C:CA:B8:39:53:99:20:76:BE:97:70:F1:22:4F:73:B5:FB:1B:03`. In Play Console si legge in *Protetto con Play → Protezione del Play Store → Firma dell'app di Play*;
2. quella della chiave di caricamento.

Le due impronte sono già nel file pubblicato. Se cambiano, vanno aggiornate sia in `store/dominio/` sia nel repository `Rayuk-creator.github.io`.

---

## 4. Scheda dello store

### Italiano (it-IT) – lingua predefinita

**Nome dell'app** (massimo 30 caratteri)

```
Matematica in gioco
```

**Descrizione breve** (massimo 80 caratteri)

```
Matematica per la primaria, dalla 1ª alla 5ª. Gratis e senza pubblicità.
```

**Descrizione completa** (massimo 4000 caratteri)

```
Matematica in gioco è un gioco per allenarsi in matematica alla scuola primaria, dalla 1ª alla 5ª. È gratuito, senza pubblicità e senza acquisti, e non raccoglie dati.

CINQUE MONDI, UNO PER CLASSE
• 1ª – Il Prato dei Numeri
• 2ª – Il Bosco delle Decine
• 3ª – Il Mare delle Centinaia
• 4ª – La Montagna delle Migliaia
• 5ª – Lo Spazio dei Milioni

In tutto 146 livelli che si sbloccano uno dopo l'altro. Ogni argomento finisce con una verifica di 10 domande senza aiuti.

CHE COSA SI IMPARA
• Numeri: contare, confrontare, ordinare, unità, decine, centinaia e migliaia, fino ai milioni
• Le quattro operazioni, a mente e in colonna
• Tabelline, multipli e divisori
• Frazioni, numeri decimali, percentuali
• Misure, orologio ed euro
• Geometria: figure, angoli, perimetro e area
• Dati, grafici e probabilità
• Coding: percorsi, ripetizioni, «se… allora», variabili

SI IMPARA DAGLI ERRORI
Dopo una risposta sbagliata il gioco mostra il perché. I calcoli in colonna vengono spiegati passo per passo, con riporti e prestiti, e con le cifre colorate: unità blu, decine rosse, centinaia verdi.
I calcoli si fanno a mano sul quaderno: nel gioco si scrive solo il risultato.

PENSATO PER LA SCUOLA
• Segue le Indicazioni nazionali per la scuola primaria
• Più giocatori sullo stesso dispositivo, ognuno con i suoi progressi
• Una guida «Cosa imparerai» per ogni classe, con le parole spiegate
• Una pagina per l'insegnante con i progressi della classe
• I progressi si possono trasferire da un dispositivo all'altro con un file
• Funziona su telefono, tablet e LIM; dopo la prima apertura anche senza connessione

NIENTE DATI, NIENTE PUBBLICITÀ
Non ci sono account, pubblicità o acquisti. I progressi restano sul dispositivo.

Il gioco è anche in inglese («Maths at Play»): la lingua si cambia con il pulsante EN/IT.
```

### Inglese (en-GB) – traduzione della scheda

Aggiungere la lingua «Inglese (Regno Unito) – en-GB» e, con gli stessi testi, anche «Inglese (Stati Uniti) – en-US», che è quella mostrata più spesso a chi ha il dispositivo in inglese.

**Nome dell'app**

```
Maths at Play
```

**Descrizione breve**

```
Primary-school maths game, Grades 1 to 5. Free, no ads, no data collected.
```

**Descrizione completa**

```
Maths at Play is a game for practising primary-school maths, from Grade 1 to Grade 5. It is free, has no ads and no purchases, and collects no data.

FIVE WORLDS, ONE FOR EACH GRADE
• Grade 1 – The Meadow of Numbers
• Grade 2 – The Forest of Tens
• Grade 3 – The Sea of Hundreds
• Grade 4 – The Mountain of Thousands
• Grade 5 – The Galaxy of Millions

146 levels in all, unlocked one after another. Each topic ends with a 10-question test with no hints.

WHAT CHILDREN LEARN
• Numbers: counting, comparing, ordering, place value up to millions
• The four operations, mentally and with column methods
• Times tables, multiples and factors
• Fractions, decimals, percentages
• Measures, telling the time and money (euros)
• Geometry: shapes, angles, perimeter and area
• Data, charts and probability
• Coding: paths, loops, “if… then”, variables

LEARNING FROM MISTAKES
After a wrong answer the game shows why. Column calculations are explained step by step, with carrying and borrowing, and with colour-coded digits: ones in blue, tens in red, hundreds in green.
Calculations are worked out by hand in an exercise book: in the game you only type the answer.

MADE FOR SCHOOL
• Follows the Italian national primary curriculum
• Several players on the same device, each with their own progress
• A “What you'll learn” guide for each grade, with key words explained
• A teacher page showing the class's progress
• Progress can be moved from one device to another with a file
• Works on phones, tablets and classroom whiteboards; after the first launch it also works offline

NO DATA, NO ADS
No accounts, no ads, no purchases. Progress stays on the device.

The game is also in Italian (“Matematica in gioco”): switch language with the EN/IT button.
```

### Immagini

Si creano con `sh build.sh && python3 store/schermate.py && python3 store/grafica.py`.

| Cosa | Misure | File |
|---|---|---|
| Icona dell'app | 512×512, PNG a 32 bit | `grafica/icona-512.png` (uguale per le due lingue) |
| Grafica in evidenza | 1024×500, PNG a 24 bit | `grafica/grafica-in-evidenza-it.png` e `-en.png` |
| Schermate telefono | 1080×1920, 8 per lingua | `schermate/it/telefono/` e `schermate/en/telefono/` |
| Schermate tablet 7" e 10" | 1920×1200, 8 per lingua | `schermate/it/tablet/` e `schermate/en/tablet/` |

Le stesse schermate «tablet» vanno caricate sia nella sezione dei tablet da 7 pollici sia in quella da 10.

### Altri dati della scheda

- **Tipo:** App. **Categoria:** Istruzione.
- **Tag:** Istruzione, Matematica (se proposti).
- **Email di contatto:** obbligatoria e pubblica: la sceglie l'utente.
- **Sito web:** `https://rayuk-creator.github.io/matematic/`
- **Norme sulla privacy:** `https://rayuk-creator.github.io/matematic/privacy.html`

---

## 5. Risposte ai questionari («Contenuti dell'app»)

| Sezione | Risposta |
|---|---|
| **Norme sulla privacy** | `https://rayuk-creator.github.io/matematic/privacy.html` |
| **Accesso all'app** | Tutte le funzioni sono disponibili senza limitazioni (non c'è login) |
| **Annunci** | No, l'app non contiene annunci |
| **Classificazione dei contenuti** | Categoria «Consultazione, notizie o istruzione»; rispondere **No** a tutte le domande (violenza, paura, sessualità, gioco d'azzardo, linguaggio, sostanze, interazione tra utenti, condivisione della posizione, acquisti). Risultato atteso: PEGI 3 / per tutti |
| **Pubblico di destinazione** | Fasce d'età **6-8** e **9-12**. Alla domanda se l'app può attirare involontariamente i bambini: non si applica, è proprio rivolta a loro |
| **Norme per le famiglie** | Confermare che l'app le rispetta: niente pubblicità, niente raccolta di dati, nessun SDK, nessun link a contenuti non adatti |
| **Sicurezza dei dati** | L'app **non raccoglie** e **non condivide** dati degli utenti. Vedi la nota qui sotto |
| **ID pubblicità** | No, l'app non usa l'ID pubblicità |
| **App governative** | No |
| **Funzionalità finanziarie** | Nessuna |
| **Salute** | Nessuna funzione relativa alla salute |
| **Notizie** | Non è un'app di notizie |

**Nota sulla sicurezza dei dati.** Il gioco non manda nulla a nessuno: i progressi restano in `localStorage` sul dispositivo. L'unica cosa che esce è l'indirizzo IP che GitHub Pages registra per motivi di sicurezza, come per ogni sito: è scritto nella pagina sulla privacy. Non è una raccolta di dati fatta dall'app, quindi la risposta è «nessun dato raccolto». Se in futuro si aggiunge qualcosa che manda dati, vanno aggiornate sia questa sezione sia `pwa/privacy.html`.

---

## 6. I passi, in ordine

1. **Account sviluppatore** (utente): creazione, 25 $, verifica dell'identità e del dispositivo Android.
2. **Repository del dominio** (utente, poi Claude): creare su GitHub il repository pubblico `Rayuk-creator.github.io`; Claude ci carica i file di `store/dominio/`.
3. **Creare l'app** in Play Console (utente): nome «Matematica in gioco», lingua predefinita italiano, tipo App, gratuita.
4. **Contenuti dell'app** (utente, con le risposte del punto 5).
5. **Scheda dello store** (utente, con testi e immagini del punto 4).
6. **Test chiuso** (utente): *Test e release → Test → Test chiuso*; caricare `matematica-in-gioco-v1b.aab`; accettare la «Firma dell'app di Google Play»; aggiungere le email dei tester; mandare in revisione.
7. **Seconda impronta** (utente, poi Claude): copiare l'impronta SHA-256 della chiave di firma dell'app e passarla a Claude, che aggiorna `assetlinks.json`.
8. **12 tester per 14 giorni di fila** (utente): obbligatorio per gli account personali creati dopo il 13 novembre 2023. I tester devono accettare l'invito dal link e restare iscritti per 14 giorni consecutivi.
9. **Richiesta di accesso alla produzione** (utente, con le risposte che prepara Claude): domande sul test, sull'app e su come si è capito che è pronta. La revisione dura di solito fino a 7 giorni.
10. **Pubblicazione in produzione** (utente).

### Note di versione del primo pacchetto

```
Prima versione.
```

---

## 7. Cose da ricordare

- **Non cambiare l'indirizzo del sito** né i nomi `index.html` ed `english.html`: l'app li apre direttamente.
- Se si aggiunge una pagina fuori da `https://rayuk-creator.github.io/matematic/`, nell'app si apre con la barra del browser.
- La pagina sulla privacy oggi parla del «sito»: prima della produzione conviene aggiungere una riga che nomina anche l'app Android (è una modifica al sito: beta e «carica» dell'utente, come sempre).
- L'app si apre nella lingua del dispositivo a ogni avvio: se un bambino ha il tablet in inglese ma gioca in italiano, deve premere IT ogni volta. Si può migliorare facendo ricordare al sito l'ultima lingua scelta (modifica al sito, non ancora richiesta).
