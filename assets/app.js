(function () {
  'use strict';

  /* ---------- sequenza ---------- */
  var SHEETS = 5, COLS = 5, ROWS = 4, PER = COLS * ROWS;
  var TOTAL = SHEETS * PER;              // 100 frame
  var CW = 960, CH = 540;                // dimensione cella
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var canvas = document.getElementById('seq');
  var ctx = canvas.getContext('2d', { alpha: false });
  var sheets = new Array(SHEETS);
  var ready = new Array(SHEETS).fill(false);
  var loadedCount = 0;

  var loader = document.getElementById('loader');
  var loaderFill = document.getElementById('loaderFill');
  var hdr = document.getElementById('hdr');
  var progressFill = document.getElementById('progressFill');
  var hint = document.getElementById('scrollhint');
  var cinema = document.getElementById('cinema');
  var beats = Array.prototype.slice.call(document.querySelectorAll('.beat')).map(function (el) {
    return { el: el, from: parseFloat(el.dataset.from), to: parseFloat(el.dataset.to), last: -1 };
  });

  /* poster immediato, così non si vede mai il nero vuoto */
  var poster = new Image();
  poster.onload = function () { if (!ready[0]) drawImageCover(poster, 0, 0, poster.width, poster.height); };
  poster.src = 'assets/poster.jpg';

  for (var s = 0; s < SHEETS; s++) (function (i) {
    var img = new Image();
    img.decoding = 'async';
    img.onload = function () {
      ready[i] = true; loadedCount++;
      loaderFill.style.width = Math.round(loadedCount / SHEETS * 100) + '%';
      if (i === 0 || (reduce && i === SHEETS - 1)) hideLoader();
      if (loadedCount === SHEETS) hideLoader();
      render(true);
    };
    img.onerror = function () { loadedCount++; if (loadedCount >= 1) hideLoader(); };
    img.src = 'assets/seq' + i + '.jpg';
    sheets[i] = img;
  })(s);

  var loaderHidden = false;
  function hideLoader() {
    if (loaderHidden) return;
    loaderHidden = true;
    loader.classList.add('is-out');
    setTimeout(function () { loader.style.display = 'none'; }, 800);
  }
  setTimeout(hideLoader, 4000); // fallback

  /* ---------- canvas ---------- */
  var vw = 0, vh = 0, dpr = 1;
  function sizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    vw = canvas.clientWidth; vh = canvas.clientHeight;
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawImageCover(img, sx, sy, sw, sh) {
    if (!vw || !vh) return;
    var scale = Math.max(vw / sw, vh / sh);
    var dw = sw * scale, dh = sh * scale;
    ctx.drawImage(img, sx, sy, sw, sh, (vw - dw) / 2, (vh - dh) / 2, dw, dh);
  }

  var currentFrame = -1;
  function drawFrame(n) {
    var si = Math.floor(n / PER);
    if (!ready[si]) {                       // sheet non pronto: tieni l'ultimo valido
      for (var k = si; k >= 0; k--) { if (ready[k]) { si = k; n = k * PER + (PER - 1); break; } }
      if (!ready[si]) return;
    }
    var k2 = n % PER;
    drawImageCover(sheets[si], (k2 % COLS) * CW, Math.floor(k2 / COLS) * CH, CW, CH);
    currentFrame = n;
  }

  /* ---------- scroll ---------- */
  /* la barra degli indirizzi mobile cambia window.innerHeight durante lo scroll:
     misuro sullo sticky, che è l'altezza davvero occupata, così il frame non salta */
  var sticky = cinema.querySelector('.cinema__sticky');
  function progress() {
    var rect = cinema.getBoundingClientRect();
    var span = cinema.offsetHeight - sticky.offsetHeight;
    if (span <= 0) return 0;
    return Math.min(1, Math.max(0, -rect.top / span));
  }

  function easeBeat(t) { // 0→1→0 con plateau
    if (t < 0 || t > 1) return 0;
    if (t < 0.22) return t / 0.22;
    if (t > 0.82) return (1 - t) / 0.18;
    return 1;
  }

  var pending = false, forced = false;
  function render(force) {
    forced = forced || !!force;
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () {
      pending = false;
      var p = progress();

      var frame = reduce ? TOTAL - 1 : Math.min(TOTAL - 1, Math.round(p * (TOTAL - 1)));
      if (frame !== currentFrame || forced) drawFrame(frame);
      forced = false;

      for (var i = 0; i < beats.length; i++) {
        var b = beats[i];
        var t = (p - b.from) / (b.to - b.from);
        var o = easeBeat(t);
        if (Math.abs(o - b.last) > 0.01 || (o === 0 && b.last !== 0)) {
          b.el.style.opacity = o;
          var off = (1 - o) * 26;
          var base = b.el.className.indexOf('beat--center') > -1 ? 'translate(-50%,-50%)'
                   : b.el.className.indexOf('beat--final') > -1 ? 'translateX(-50%)'
                   : (window.innerWidth > 760 ? 'translateY(-50%)' : '');
          b.el.style.transform = base + ' translate3d(0,' + off + 'px,0)';
          b.last = o;
        }
      }

      var doc = document.documentElement;
      var total = doc.scrollHeight - window.innerHeight;
      progressFill.style.width = (total > 0 ? (window.scrollY / total) * 100 : 0) + '%';
      hdr.classList.toggle('is-stuck', window.scrollY > 40);
      hint.classList.toggle('is-hidden', p > 0.04);
    });
  }

  window.addEventListener('scroll', function () { render(); }, { passive: true });
  window.addEventListener('resize', function () { sizeCanvas(); render(true); });
  window.addEventListener('orientationchange', function () { setTimeout(function () { sizeCanvas(); render(true); }, 200); });

  sizeCanvas();
  render(true);

  /* ---------- form richiesta informazioni ---------- */
  /* INVIO REALE — compila UNA delle due righe qui sotto e il form spedisce da solo.
     A) Web3Forms: chiave gratuita da web3forms.com (nessun account, la chiave arriva
        via mail all'indirizzo che indichi: usa info@giupponimoto.net).
     B) Formspree: incolla l'URL completo del form (https://formspree.io/f/xxxxxxx).
     Finché restano vuote, il form apre il programma di posta del visitatore. */
  var WEB3FORMS_KEY = '';
  var FORM_ENDPOINT = '';

  var DESTINATARIO = 'info@giupponimoto.net';
  var TELEFONO = '0331 587767';

  var form = document.getElementById('infoForm');
  var feedback = document.getElementById('formFeedback');

  /* i bottoni che portano al form preimpostano il tipo di richiesta */
  Array.prototype.forEach.call(document.querySelectorAll('a[href="#informazioni"][data-tipo]'), function (a) {
    a.addEventListener('click', function () {
      var sel = form && form.elements['tipo'];
      if (!sel) return;
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].text === a.dataset.tipo) { sel.selectedIndex = i; break; }
      }
    });
  });

  if (form) {
    var btn = form.querySelector('.form__send');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var campi = form.querySelectorAll('[required]');
      var primo = null;
      for (var i = 0; i < campi.length; i++) {
        var f = campi[i];
        var vuoto = f.type === 'checkbox' ? !f.checked : !f.value.trim();
        var errato = !vuoto && f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value.trim());
        f.classList.toggle('is-invalid', vuoto || errato);
        if ((vuoto || errato) && !primo) primo = f;
      }
      if (primo) {
        messaggio(primo.type === 'checkbox'
          ? 'Serve il consenso al trattamento dei dati per poterti rispondere.'
          : 'Controlla i campi evidenziati: manca qualcosa.', true);
        primo.focus();
        return;
      }

      var v = function (n) { var el = form.elements[n]; return el ? el.value.trim() : ''; };
      var d = {
        nome: v('nome'), email: v('email'), telefono: v('telefono'),
        tipo: v('tipo'), messaggio: v('messaggio')
      };
      var corpo = [
        'Nome: ' + d.nome,
        'Email: ' + d.email,
        'Telefono: ' + (d.telefono || '—'),
        'Richiesta: ' + d.tipo,
        '',
        d.messaggio,
        '',
        '— Inviato dal sito giupponimoto.net'
      ].join('\n');

      if (WEB3FORMS_KEY || FORM_ENDPOINT) spedisci(d, corpo);
      else apriPosta(d, corpo);
    });

    form.addEventListener('input', function (e) {
      if (e.target.classList) e.target.classList.remove('is-invalid');
    });
  }

  function messaggio(testo, errore) {
    if (!feedback) return;
    feedback.className = 'form__feedback' + (errore ? ' is-error' : '');
    feedback.textContent = testo;
  }

  function spedisci(d, corpo) {
    var etichetta = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Invio in corso…';
    messaggio('');

    var url, dati;
    if (WEB3FORMS_KEY) {
      url = 'https://api.web3forms.com/submit';
      dati = {
        access_key: WEB3FORMS_KEY,
        subject: 'Richiesta informazioni dal sito — ' + d.nome,
        from_name: d.nome,
        email: d.email,
        telefono: d.telefono || '—',
        tipo_richiesta: d.tipo,
        message: corpo
      };
    } else {
      url = FORM_ENDPOINT;
      dati = {
        _subject: 'Richiesta informazioni dal sito — ' + d.nome,
        nome: d.nome, email: d.email, telefono: d.telefono || '—',
        tipo_richiesta: d.tipo, messaggio: d.messaggio
      };
    }

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(dati)
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok || j.success === false) throw new Error(j.message || 'errore');
          return j;
        });
      })
      .then(function () {
        form.reset();
        messaggio('Richiesta inviata, grazie. Ti rispondiamo al più presto. Se hai fretta, chiama lo ' + TELEFONO + '.');
      })
      .catch(function () {
        messaggio('Invio non riuscito. Riprova tra poco, oppure scrivici a ' + DESTINATARIO + ' o chiama lo ' + TELEFONO + '.', true);
      })
      .then(function () {
        btn.disabled = false;
        btn.textContent = etichetta;
      });
  }

  function apriPosta(d, corpo) {
    window.location.href = 'mailto:' + DESTINATARIO
      + '?subject=' + encodeURIComponent('Richiesta informazioni dal sito — ' + d.nome)
      + '&body=' + encodeURIComponent(corpo);
    messaggio('Si apre il tuo programma di posta con la richiesta già scritta: premi invia per mandarla. Se non si apre, scrivici a ' + DESTINATARIO + ' o chiama lo ' + TELEFONO + '.');
  }
})();
