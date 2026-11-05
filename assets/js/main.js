/* KONTIVOCARD – Navigation (Mobilmenü) und Kontaktformular */
(function () {
  'use strict';

  /* ===== Mobilmenü ===== */
  var navToggle = document.getElementById('navToggle');
  var menu = document.getElementById('menu');

  function setMenu(open) {
    menu.classList.toggle('open', open);
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  }

  if (navToggle && menu) {
    navToggle.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); navToggle.focus(); }
    });
  }

  /* ===== Kontaktformular per AJAX (Formspree), damit die Seite nie verlassen wird ===== */
  var form = document.getElementById('kontaktform');
  var status = document.getElementById('form-status');
  if (!form || !status) return;

  var GENERIC_ERROR = 'Es gab ein Problem beim Senden Ihrer Nachricht. Bitte schreiben Sie uns direkt an kontakt@kontivocard.de.';

  function showStatus(text, isError) {
    status.textContent = text;
    status.classList.toggle('error', !!isError);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    showStatus('Wird gesendet ...', false);

    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (response) {
        if (response.ok) {
          showStatus('Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet.', false);
          form.reset();
          return;
        }
        return response.json().then(function (data) {
          var msg = data && Array.isArray(data.errors)
            ? data.errors.map(function (err) { return err.message; }).join(', ')
            : GENERIC_ERROR;
          showStatus(msg, true);
        }, function () { showStatus(GENERIC_ERROR, true); });
      })
      .catch(function () { showStatus(GENERIC_ERROR, true); })
      .then(function () { button.disabled = false; });
  });
})();
