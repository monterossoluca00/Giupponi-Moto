# Moto Giupponi — sito

Sito one-page per **02 Ruote di Giupponi Enzo** — concessionaria multimarca e officina
a Nerviano (MI). Hero cinematica pilotata dallo scroll, in stile Apple.

**Sito statico puro**: nessuna build, nessuna dipendenza. Si apre `index.html` e funziona.

## Struttura

```
index.html            pagina unica
assets/
  style.css           tutti gli stili, token colore in :root
  app.js              hero a scorrimento + validazione form
  seq0–4.jpg          5 sprite sheet, 20 fotogrammi ciascuno (100 totali)
  poster.jpg          primo fotogramma, mostrato subito
  logo.png            logo Giupponi ricolorato per fondo scuro
  nuovo|usato|officina.jpg   foto delle sezioni
  marchi/*.png        gli 8 loghi dei marchi trattati
```

## Come funziona la hero

Il video originale (Benelli TRK 902, 6,6 s) è stato scomposto in **100 fotogrammi da
960×540**, impaginati in 5 sprite sheet 5×4. Lo scroll pilota l'indice del fotogramma,
che viene disegnato su `<canvas>` con `drawImage` in cover fit, dentro un
`requestAnimationFrame`.

Non si usa `<video>` con `currentTime`: il seek è troppo lento e a scatti.

Dettagli che contano se ci metti mano:

- `.cinema` è alto `470vh` (`340vh` sotto i 760px). È quello a dare la lunghezza dello scroll.
- Il progresso si misura **sull'altezza dello sticky**, non su `window.innerHeight`:
  su mobile la barra degli indirizzi cambia `innerHeight` durante lo scroll e
  l'animazione salterebbe indietro.
- I 5 blocchi di testo hanno `data-from` / `data-to` in unità di progresso (0–1).
  L'ultimo arriva a `1.32` di proposito, così resta a piena opacità fino in fondo.
- Loading screen: sparisce appena il primo sprite sheet è pronto, con fallback a 4 s.
- Con `prefers-reduced-motion` la sequenza si ferma sull'ultimo fotogramma.

## Design system

| ruolo | colore |
|---|---|
| nero fondo | `#070809` |
| superfici | `#101418` · `#161B21` |
| blu del logo | `#28387D` |
| blu operativo (testi, bottoni) | `#4A7BFF` |
| grigio nichel | `#8E979E` |
| bianco | `#F3F5F7` |
| stelle recensioni | `#F5B301` |
| verde WhatsApp | `#25D366` |

Caratteri, da Google Fonts: **Space Grotesk** (titoli, etichette, nomi dei marchi) e
**Instrument Sans** (testo corrente). Niente monospazio da nessuna parte.

## Il form

Il form in fondo alla pagina **apre il client di posta del visitatore** con la richiesta
già compilata (`mailto:` verso info@giupponimoto.net). È l'unica cosa che un sito
statico può fare senza backend, e perde chi naviga da telefono senza app di posta
configurata.

Per un invio vero servono poche righe: una serverless function su Vercel
(`api/contatti.js` + un servizio SMTP) oppure un endpoint tipo Formspree / Web3Works.
Il punto da modificare è in `assets/app.js`, nel gestore `submit` di `#infoForm`.

## Da completare prima di andare online

1. **Informativa privacy e cookie banner** — obbligatori: il form raccoglie dati
   personali e la checkbox di consenso non punta ancora a nessuna pagina.
2. **Invio reale del form** (vedi sopra).
3. **Logo vettoriale** — quello attuale è ricavato da uno screenshot 544×170
   ingrandito 3×, con i colori invertiti per il fondo scuro.
4. **Verifiche con il titolare**: civico 9 o 11, e le promesse nei testi (controllo
   completo dell'usato prima della consegna, permuta valutata sul posto, pratiche
   gestite internamente, recupero veicoli).
5. **"Moto in pronta consegna"** punta al catalogo generale su dealer.moto.it, non a
   una lista filtrata per disponibilità immediata.

## Dati dell'attività

02 Ruote di Giupponi Enzo — P.IVA 13976030968
Via Marzorati 9, 20014 Nerviano (MI)
Tel 0331 587767 · WhatsApp 340 521 3455 · info@giupponimoto.net
Lun 15–19 · Mar–Ven 9–12.30 / 15–19 · Sab 9–12.30 / 15–18 · Dom chiuso

Marchi: Benelli, Fantic Motor, Keeway, Morbidelli (MBP), Benda, Cyclone, TM Racing,
Zontes. Officina autorizzata MV Agusta.

Le tre recensioni in pagina sono reali, riprese da Google e trascritte alla lettera.

## Deploy

Qualsiasi hosting statico. Su Vercel: importa il repo, framework *Other*, nessun
comando di build, output directory la radice.
