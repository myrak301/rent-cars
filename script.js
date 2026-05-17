/* ============================================================
   RentCars Toulouse — Script unifié (toutes les pages)
   ============================================================ */
(function () {
  'use strict';

  var WA_NUMBER = '33651001854';

  /* ---- Tarifs (source unique de vérité) ---- */
  var DAY_RATES = {
    Citadine: 39, Compacte: 49, Berline: 65,
    SUV: 79, Utilitaire: 69, Premium: 119
  };
  var OPT_PER_DAY = { 'Siège enfant': 8, 'Assurance renforcée': 19 };
  var OPT_FLAT = { 'Conducteur additionnel': 15, 'Livraison + récupération': 30 };

  var euro = function (n) { return '≈ ' + n + ' €'; };

  /* ---- Header : état au scroll + barre de progression ---- */
  var header = document.querySelector('.site-header');
  var progress = document.querySelector('.scroll-progress');

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('scrolled', y > 40);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Menu mobile ---- */
  var burger = document.querySelector('.nav-burger');
  var drawer = document.querySelector('.nav-drawer');
  if (burger && drawer) {
    var setMenu = function (open) {
      burger.classList.toggle('open', open);
      drawer.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', function () {
      setMenu(!drawer.classList.contains('open'));
    });
    drawer.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  /* ---- Apparition au scroll ---- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('in'); });
    }
  }

  /* ---- Accordéon FAQ ---- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var btn = item.querySelector('.faq-q');
    var panel = item.querySelector('.faq-a');
    if (!btn || !panel) return;
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var open = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (other) {
        other.classList.remove('open');
        var oa = other.querySelector('.faq-a');
        var ob = other.querySelector('.faq-q');
        if (oa) oa.style.maxHeight = null;
        if (ob) ob.setAttribute('aria-expanded', 'false');
      });
      if (!open) {
        item.classList.add('open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---- Moteur de réservation / estimation ---- */
  function val(form, name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? el.value.trim() : '';
  }

  function estimate(form) {
    var dep = val(form, 'pickupDate');
    var ret = val(form, 'returnDate');
    var cat = val(form, 'category') || 'Citadine';
    var opt = val(form, 'option');

    if (!dep || !ret) {
      return { ok: false, days: 0, total: 0,
        duration: 'Choisissez vos dates', price: '— €',
        note: 'Le tarif final est confirmé par WhatsApp selon les disponibilités.' };
    }
    var diff = new Date(ret + 'T00:00:00') - new Date(dep + 'T00:00:00');
    if (diff < 0) {
      return { ok: false, days: 0, total: 0,
        duration: 'Dates à corriger', price: '— €',
        note: 'La date de retour doit être après la date de départ.' };
    }
    var days = Math.max(1, Math.ceil(diff / 86400000) || 1);
    var perDay = (DAY_RATES[cat] || DAY_RATES.Citadine) + (OPT_PER_DAY[opt] || 0);
    var total = perDay * days + (OPT_FLAT[opt] || 0);
    return {
      ok: true, days: days, total: total,
      duration: days + (days > 1 ? ' jours' : ' jour'),
      price: euro(total),
      note: cat + ' à partir de ' + (DAY_RATES[cat] || DAY_RATES.Citadine) + ' €/jour. Estimation indicative.'
    };
  }

  function refreshSummary(form) {
    var est = estimate(form);
    var d = form.querySelector('[data-duration]');
    var p = form.querySelector('[data-price]');
    var n = form.querySelector('[data-note]');
    if (d) d.textContent = est.duration;
    if (p) p.textContent = est.price;
    if (n) {
      n.textContent = est.note;
      n.classList.toggle('warn', !est.ok && (val(form, 'pickupDate') && val(form, 'returnDate')));
    }
    return est;
  }

  function buildMessage(form, est) {
    var dropoff = val(form, 'dropoff') || 'Identique au départ';
    var lines = ['Bonjour RentCars, je souhaite réserver un véhicule.', ''];
    var name = val(form, 'name');
    var phone = val(form, 'phone');
    if (name) lines.push('👤 Nom : ' + name);
    if (phone) lines.push('📞 Téléphone : ' + phone);
    lines.push('📍 Départ : ' + (val(form, 'pickup') || 'Non précisé'));
    lines.push('📍 Retour : ' + dropoff);
    lines.push('📅 Du : ' + (val(form, 'pickupDate') || 'Non précisé') +
      (val(form, 'pickupTime') ? ' ' + val(form, 'pickupTime') : ''));
    lines.push('📅 Au : ' + (val(form, 'returnDate') || 'Non précisé') +
      (val(form, 'returnTime') ? ' ' + val(form, 'returnTime') : ''));
    lines.push('🚗 Catégorie : ' + (val(form, 'category') || 'Non précisé'));
    if (val(form, 'option')) lines.push('➕ Option : ' + val(form, 'option'));
    if (est.ok) {
      lines.push('⏱ Durée : ' + est.duration);
      lines.push('💶 Estimation : ' + est.price);
    }
    if (val(form, 'message')) lines.push('📝 Message : ' + val(form, 'message'));
    lines.push('', 'Pouvez-vous confirmer la disponibilité ? Merci.');
    return lines.join('\n');
  }

  var todayStr = new Date().toISOString().slice(0, 10);

  document.querySelectorAll('.booking-engine').forEach(function (form) {
    var dep = form.querySelector('[name="pickupDate"]');
    var ret = form.querySelector('[name="returnDate"]');
    if (dep) dep.min = todayStr;
    if (ret) ret.min = todayStr;

    // Pré-remplissage de la catégorie via ?cat=...
    var cat = new URLSearchParams(window.location.search).get('cat');
    if (cat) {
      var sel = form.querySelector('[name="category"]');
      if (sel) {
        Array.prototype.forEach.call(sel.options, function (o) {
          if (o.value.toLowerCase() === cat.toLowerCase()) sel.value = o.value;
        });
      }
    }

    refreshSummary(form);

    form.addEventListener('input', function () { refreshSummary(form); });
    form.addEventListener('change', function () {
      if (dep && ret && dep.value) ret.min = dep.value;
      refreshSummary(form);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var est = refreshSummary(form);
      if (!est.ok) {
        var first = form.querySelector('[name="pickupDate"]');
        if (first) first.focus();
        return;
      }
      var btn = form.querySelector('[type="submit"]');
      if (btn) {
        btn.disabled = true;
        var label = btn.textContent;
        btn.textContent = 'Ouverture de WhatsApp…';
        setTimeout(function () { btn.disabled = false; btn.textContent = label; }, 2500);
      }
      window.open(
        'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(buildMessage(form, est)),
        '_blank', 'noopener'
      );
    });
  });

  /* ---- Année du footer ---- */
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
