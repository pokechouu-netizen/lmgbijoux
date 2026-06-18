/* ============================================
   LMG BIJOUX — Main JavaScript
   Concept : "L'or dort dans la pierre — le bijoutier le réveille."
   ============================================ */

(function () {
  'use strict';

  // ==========================
  // CONFIG — À MODIFIER
  // ==========================
  const CONFIG = {
    // Google Sheet ID (publié en CSV)
    // 1. Créer le Google Sheet "LMG_BIJOUX_SITE"
    // 2. Publier : Fichier > Partager > Publier sur le Web > CSV
    // 3. Copier l'ID du sheet dans l'URL
    GOOGLE_SHEET_ID: '', // ex: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms'

    // Noms des onglets Google Sheet
    SHEET_AVIS: 'AVIS_CLIENTS',
    SHEET_BIJOUX: 'BIJOUX',

    // Instagram (optionnel — nécessite un token d'accès)
    // Utiliser l'API Instagram Graph via Facebook Developer
    INSTAGRAM_TOKEN: '',
    INSTAGRAM_USER_ID: '',

    // Formspree endpoint pour le formulaire de contact
    // Créer un compte sur formspree.io et remplacer l'ID
    FORMSPREE_ID: 'YOUR_FORM_ID'
  };

  // Numéro de téléphone brut (mis à jour depuis data/infos.json)
  let phoneRaw = '0781081467';

  // ==========================
  // LOADER
  // ==========================
  const loader = document.getElementById('loader');
  const loaderText = document.getElementById('loaderText');
  const loaderChars = 'LMG Bijoux';

  if (loaderText) {
    loaderChars.split('').forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.animationDelay = `${i * 0.07}s`;
      loaderText.appendChild(span);
    });
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      if (loader) {
        loader.classList.add('done');
        setTimeout(() => loader.remove(), 800);
      }
    }, 1200);
  });

  // ==========================
  // CUSTOM CURSOR (optimisé — transform GPU, arrêt auto)
  // ==========================
  const cursorRing = document.getElementById('cursorRing');
  const cursorDot = document.getElementById('cursorDot');
  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;
  let cursorRAF = 0;
  let cursorMoving = false;

  if (window.matchMedia('(pointer: fine)').matches && cursorRing && cursorDot) {
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
      if (!cursorMoving) {
        cursorMoving = true;
        cursorRAF = requestAnimationFrame(animateCursor);
      }
    });

    function animateCursor() {
      const dx = mouseX - ringX;
      const dy = mouseY - ringY;
      ringX += dx * 0.15;
      ringY += dy * 0.15;
      cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      // Arrêter la boucle quand le ring a rattrapé la souris
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        cursorRAF = requestAnimationFrame(animateCursor);
      } else {
        cursorMoving = false;
      }
    }

    const interactiveEls = 'a, button, .btn-cta, .btn-outline, .creation-card, .avis-card, .service-card, input, textarea';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactiveEls)) cursorRing.classList.add('hover');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(interactiveEls)) cursorRing.classList.remove('hover');
    });
  }

  // ==========================
  // NAVIGATION + SCROLL HANDLER UNIFIÉ
  // ==========================
  const nav = document.getElementById('nav');
  let lastScroll = 0;
  let scrollTicking = false;

  // ==========================
  // MOBILE MENU
  // ==========================
  const burger = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('navMobile');

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const isOpen = burger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      burger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('open');
        mobileMenu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // ==========================
  // CTA OVERLAY
  // ==========================
  const ctaOverlay = document.getElementById('ctaOverlay');
  const ctaClose = document.getElementById('ctaClose');
  const ctaTriggers = document.querySelectorAll('.cta-trigger');
  let lastFocused = null;

  function openOverlay() {
    lastFocused = document.activeElement;
    ctaOverlay.classList.add('open');
    ctaOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => { if (ctaClose) ctaClose.focus(); }, 100);
  }

  function closeOverlay() {
    ctaOverlay.classList.remove('open');
    ctaOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  ctaTriggers.forEach(btn => btn.addEventListener('click', openOverlay));
  if (ctaClose) ctaClose.addEventListener('click', closeOverlay);
  if (ctaOverlay) {
    ctaOverlay.addEventListener('click', (e) => {
      if (e.target === ctaOverlay) closeOverlay();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ctaOverlay && ctaOverlay.classList.contains('open')) closeOverlay();
  });

  // ==========================
  // COPY PHONE
  // ==========================
  const copyBtn = document.getElementById('copyPhone');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(phoneRaw).then(() => {
        const span = copyBtn.querySelector('span');
        if (span) {
          const original = span.textContent;
          span.textContent = currentLang === 'en' ? 'Copied!' : 'Copié !';
          copyBtn.style.borderColor = '#C9A84C';
          copyBtn.style.color = '#C9A84C';
          setTimeout(() => {
            span.textContent = original;
            copyBtn.style.borderColor = '';
            copyBtn.style.color = '';
          }, 2000);
        }
      });
    });
  }

  // ==========================
  // SCROLL REVEAL
  // ==========================
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  revealEls.forEach(el => revealObserver.observe(el));

  // ==========================
  // HIGHLIGHT TODAY
  // ==========================
  const today = new Date().getDay();
  const todayRow = document.querySelector(`tr[data-day="${today}"]`);
  if (todayRow) todayRow.classList.add('today');

  // ==========================
  // PARALLAX (intégré au scroll unifié)
  // ==========================
  const parallaxEls = document.querySelectorAll('.parallax-el');

  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      const currentScroll = window.scrollY;

      // Nav show/hide
      if (nav) {
        nav.classList.toggle('scrolled', currentScroll > 100);
        nav.classList.toggle('hidden', currentScroll > lastScroll && currentScroll > 300);
        if (currentScroll <= lastScroll) nav.classList.remove('hidden');
      }
      lastScroll = currentScroll;

      // Parallax
      parallaxEls.forEach(el => {
        const speed = parseFloat(el.dataset.parallaxSpeed) || 0.1;
        const parent = el.closest('.hero__bg') || el.closest('.parallax-sun') || el.parentElement;
        if (parent) {
          const rect = parent.getBoundingClientRect();
          el.style.transform = `translateY(${rect.top * speed}px)`;
        }
      });

      scrollTicking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ==========================
  // SMOOTH SCROLL
  // ==========================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ==========================
  // LANGUAGE TOGGLE (FR / EN)
  // ==========================
  let currentLang = localStorage.getItem('lmg-lang') || 'fr';

  const langToggle = document.getElementById('langToggle');
  const langToggleMobile = document.getElementById('langToggleMobile');

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lmg-lang', lang);

    document.documentElement.lang = lang;

    // Update all elements with data-fr / data-en
    document.querySelectorAll('[data-fr][data-en]').forEach(el => {
      const text = el.getAttribute(`data-${lang}`);
      if (text) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = text;
        } else {
          el.innerHTML = text;
        }
      }
    });

    // Update active state on FR/EN buttons
    document.querySelectorAll('.nav__lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  // Desktop: click on FR or EN button
  if (langToggle) {
    langToggle.querySelectorAll('.nav__lang-btn').forEach(btn => {
      btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
    });
  }

  // Mobile toggle
  if (langToggleMobile) {
    langToggleMobile.addEventListener('click', () => {
      applyLanguage(currentLang === 'fr' ? 'en' : 'fr');
    });
  }

  // Apply saved language on load
  if (currentLang !== 'fr') {
    applyLanguage(currentLang);
  }

  // ==========================
  // CMS — DONNÉES data/*.json (remplace Google Sheets)
  // ==========================
  function sanitize(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  // Échappe une valeur destinée à un attribut HTML (data-fr/data-en, href…)
  function attr(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }
  function fetchJSON(path) {
    return fetch(path, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null);
  }

  // --- Textes bilingues : pose data-fr / data-en puis applyLanguage les affiche ---
  const TEXT_TARGETS = {
    hero_tag: '#hero .hero__tag', hero_title: '#hero .hero__title', hero_sub: '#hero .hero__sub',
    artisan_tag: '#artisan .section-tag', artisan_title: '#artisan .section-title', artisan_desc: '#artisan .artisan__desc', artisan_detail: '#artisan .artisan__detail',
    vision_tag: '#vision .section-tag', vision_title: '#vision .section-title', vision_text: '#vision .vision__text',
    boutique_tag: '#boutique .section-tag', boutique_title: '#boutique .section-title', boutique_desc: '#boutique .boutique__desc',
    services_tag: '#services .section-tag', services_title: '#services .section-title',
    service1_title: '#services .service-card:nth-of-type(1) .service-card__title', service1_desc: '#services .service-card:nth-of-type(1) .service-card__desc',
    service2_title: '#services .service-card:nth-of-type(2) .service-card__title', service2_desc: '#services .service-card:nth-of-type(2) .service-card__desc',
    service3_title: '#services .service-card:nth-of-type(3) .service-card__title', service3_desc: '#services .service-card:nth-of-type(3) .service-card__desc',
    service4_title: '#services .service-card:nth-of-type(4) .service-card__title', service4_desc: '#services .service-card:nth-of-type(4) .service-card__desc',
    creations_tag: '#creations .section-tag', creations_title: '#creations .section-title',
    avis_tag: '#avis .section-tag', avis_title: '#avis .section-title',
    instagram_tag: '#instagram .section-tag', instagram_title: '#instagram .section-title', instagram_intro: '#instagram .instagram-section__intro',
    infos_tag: '#infos .section-tag', infos_title: '#infos .section-title', horaires_note: '#infos .horaires__note span',
    acces_tag: '#acces .section-tag', acces_title: '#acces .section-title'
  };
  // Titres à accent doré : le dernier mot est automatiquement mis en <em> (doré).
  const TITLE_KEYS = ['hero_title', 'artisan_title', 'vision_title', 'boutique_title', 'services_title', 'creations_title', 'avis_title', 'instagram_title', 'infos_title', 'acces_title'];
  // Texte saisi (propre) → HTML d'affichage : échappe, dernier mot doré (titres), retours à la ligne → <br>.
  function htmlFromText(text, isTitle) {
    let s = String(text == null ? '' : text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (isTitle) s = s.replace(/(\S+)(\s*)$/, '<em>$1</em>$2');
    return s.replace(/\r?\n/g, '<br>');
  }
  function applyTextes(textes) {
    if (!textes) return;
    Object.keys(TEXT_TARGETS).forEach(key => {
      const t = textes[key]; if (!t) return;
      const el = document.querySelector(TEXT_TARGETS[key]); if (!el) return;
      const isTitle = TITLE_KEYS.indexOf(key) !== -1;
      if (t.fr != null) el.setAttribute('data-fr', htmlFromText(t.fr, isTitle));
      if (t.en != null) el.setAttribute('data-en', htmlFromText(t.en, isTitle));
    });
  }

  // --- Photos clés ---
  const PHOTO_TARGETS = { logo: '#nav .nav__logo-img', hero: '#hero .hero__img', artisan: '#artisan .artisan__photo', boutique: '#boutique .boutique__img' };
  function applyPhotos(photos) {
    if (!photos) return;
    Object.keys(PHOTO_TARGETS).forEach(key => {
      if (!photos[key]) return;
      const el = document.querySelector(PHOTO_TARGETS[key]); if (el) el.src = photos[key];
    });
  }

  // --- Galerie / créations ---
  function renderCreations(creations) {
    const grid = document.getElementById('galerieGrid');
    if (!grid || !Array.isArray(creations)) return;
    const visible = creations.filter(c => c.visible !== false);
    if (!visible.length) return; // garde le contenu statique si rien à afficher
    grid.innerHTML = '';
    visible.forEach((c, i) => {
      const card = document.createElement('div');
      card.className = 'creation-card reveal visible';
      card.style.transitionDelay = `${i * 0.05}s`;
      const img = c.image ? `<img class="creation-card__img" src="${sanitize(c.image)}" alt="${attr(c.nom)}" loading="lazy">` : '';
      card.innerHTML = `${img}
        <div class="creation-card__content">
          <h3 class="creation-card__title">${sanitize(c.nom)}</h3>
          <p class="creation-card__desc" data-fr="${attr(c.desc_fr)}" data-en="${attr(c.desc_en || c.desc_fr)}">${sanitize(c.desc_fr)}</p>
        </div>`;
      grid.appendChild(card);
    });
  }

  // --- Avis clients ---
  function renderAvis(avis) {
    const grid = document.getElementById('avisGrid');
    if (!grid || !Array.isArray(avis) || !avis.length) return;
    grid.innerHTML = '';
    avis.forEach((a, i) => {
      const n = Math.max(1, Math.min(5, parseInt(a.note) || 5));
      const stars = '★'.repeat(n) + '☆'.repeat(5 - n);
      const card = document.createElement('div');
      card.className = 'avis-card reveal visible';
      card.style.transitionDelay = `${(i + 1) * 0.1}s`;
      const photo = a.photo ? `<img class="avis-card__photo" src="${sanitize(a.photo)}" alt="${attr(a.auteur)}" loading="lazy">` : '';
      card.innerHTML = `
        <div class="avis-card__quote">&ldquo;</div>
        <p class="avis-card__text" data-fr="${attr(a.texte_fr)}" data-en="${attr(a.texte_en || a.texte_fr)}">${sanitize(a.texte_fr)}</p>
        ${photo}
        <p class="avis-card__author">${sanitize(a.auteur)}</p>
        <div class="avis-card__stars">${stars}</div>`;
      grid.appendChild(card);
    });
  }

  // --- Infos : téléphone, adresse, réseaux, horaires ---
  const DAY_KEYS = { 1: 'lundi', 2: 'mardi', 3: 'mercredi', 4: 'jeudi', 5: 'vendredi', 6: 'samedi', 0: 'dimanche' };
  function applyInfos(infos) {
    if (!infos) return;
    if (infos.telephone_raw) phoneRaw = infos.telephone_raw;
    if (infos.telephone) {
      document.querySelectorAll('.cta-overlay__phone, .acces__phone, [data-info="phone"]').forEach(el => { el.textContent = infos.telephone; });
    }
    document.querySelectorAll('a[href^="tel:"]').forEach(a => { a.href = 'tel:' + phoneRaw; });
    if (infos.adresse) {
      const addr = sanitize(infos.adresse) + '<br>' + sanitize(((infos.code_postal || '') + ' ' + (infos.ville || '')).trim());
      document.querySelectorAll('[data-info="address"]').forEach(el => { el.innerHTML = addr; });
    }
    if (infos.instagram) document.querySelectorAll('a[href*="instagram.com"]').forEach(a => { a.href = infos.instagram; });
    if (infos.facebook) document.querySelectorAll('a[href*="facebook.com"]').forEach(a => { a.href = infos.facebook; });
    if (infos.horaires) {
      Object.keys(DAY_KEYS).forEach(num => {
        const val = infos.horaires[DAY_KEYS[num]]; if (val == null) return;
        const row = document.querySelector(`tr[data-day="${num}"]`); if (!row) return;
        const cell = row.querySelector('td:last-child'); if (!cell) return;
        const isClosed = /^ferm/i.test(String(val).trim());
        const fr = String(val).replace(/\s*\/\s*/g, ' <span class="horaires__sep">/</span> ');
        cell.setAttribute('data-fr', fr);
        cell.setAttribute('data-en', isClosed ? 'Closed' : fr);
        row.classList.toggle('horaires__closed', isClosed);
      });
    }
  }

  // --- Popup promotionnel ---
  function initPopup(popup) {
    if (!popup || !popup.actif || !(popup.message_fr || popup.message_en)) return;
    if (!document.getElementById('cmsPopupStyle')) {
      const st = document.createElement('style');
      st.id = 'cmsPopupStyle';
      st.textContent = '.cms-popup{position:fixed;left:50%;bottom:24px;transform:translate(-50%,140%);background:#0A0A0A;color:#F5F0E8;border:1px solid rgba(201,168,76,.4);border-radius:14px;padding:1rem 2.6rem 1rem 1.2rem;max-width:92vw;width:380px;box-shadow:0 16px 48px rgba(0,0,0,.5);z-index:9999;transition:transform .4s cubic-bezier(.2,.8,.2,1);font-family:inherit}.cms-popup.show{transform:translateX(-50%)}.cms-popup__msg{font-size:.9rem;line-height:1.5;margin:0 0 .6rem}.cms-popup__cta{display:inline-block;background:#C9A84C;color:#0A0A0A;text-decoration:none;font-weight:600;font-size:.82rem;padding:.45rem 1rem;border-radius:8px}.cms-popup__close{position:absolute;top:.5rem;right:.7rem;background:none;border:none;color:#C9A84C;font-size:1.5rem;line-height:1;cursor:pointer}';
      document.head.appendChild(st);
    }
    const delay = (parseInt(popup.delai_secondes) || 0) * 1000;
    setTimeout(() => {
      if (document.getElementById('cmsPopup')) return;
      const msg = currentLang === 'en' ? (popup.message_en || popup.message_fr) : (popup.message_fr || popup.message_en);
      const cta = currentLang === 'en' ? (popup.cta_label_en || popup.cta_label_fr) : (popup.cta_label_fr || popup.cta_label_en);
      const wrap = document.createElement('div');
      wrap.id = 'cmsPopup'; wrap.className = 'cms-popup';
      wrap.innerHTML = '<button class="cms-popup__close" aria-label="Fermer">&times;</button>' +
        `<p class="cms-popup__msg" data-fr="${attr(popup.message_fr)}" data-en="${attr(popup.message_en || popup.message_fr)}">${sanitize(msg)}</p>` +
        (cta ? `<a class="cms-popup__cta" href="${attr(popup.cta_url || '#')}" data-fr="${attr(popup.cta_label_fr || '')}" data-en="${attr(popup.cta_label_en || popup.cta_label_fr || '')}">${sanitize(cta)}</a>` : '');
      document.body.appendChild(wrap);
      requestAnimationFrame(() => wrap.classList.add('show'));
      wrap.querySelector('.cms-popup__close').addEventListener('click', () => {
        wrap.style.transform = 'translate(-50%,140%)';
        setTimeout(() => wrap.remove(), 400);
      });
    }, delay);
  }

  // --- Orchestration : charge tout puis applique la langue ---
  Promise.all([
    fetchJSON('data/contenu.json'),
    fetchJSON('data/creations.json'),
    fetchJSON('data/infos.json')
  ]).then(res => {
    const contenu = res[0] || {}, creationsData = res[1] || {}, infos = res[2] || {};
    applyTextes(contenu.textes);
    applyPhotos(contenu.photos);
    if (creationsData.creations) renderCreations(creationsData.creations);
    if (contenu.avis) renderAvis(contenu.avis);
    applyInfos(infos);
    applyLanguage(currentLang); // ré-applique FR/EN au contenu statique + injecté
    initPopup(infos.popup);
  });

  // ==========================
  // INSTAGRAM FEED
  // ==========================
  function fetchInstagramFeed() {
    if (!CONFIG.INSTAGRAM_TOKEN || !CONFIG.INSTAGRAM_USER_ID) return;

    const url = `https://graph.instagram.com/${CONFIG.INSTAGRAM_USER_ID}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url&limit=8&access_token=${CONFIG.INSTAGRAM_TOKEN}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!data.data) return;
        renderInstagramFeed(data.data);
      })
      .catch(err => console.warn('Instagram fetch error:', err));
  }

  function renderInstagramFeed(posts) {
    const feed = document.getElementById('instagramFeed');
    if (!feed) return;

    feed.innerHTML = '';

    posts.forEach(post => {
      if (post.media_type === 'VIDEO' && !post.thumbnail_url) return;

      const imgUrl = post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url;
      const caption = post.caption ? post.caption.substring(0, 120) : '';

      const item = document.createElement('a');
      item.href = post.permalink;
      item.target = '_blank';
      item.rel = 'noopener noreferrer';
      item.className = 'instagram-feed__item';

      item.innerHTML = `
        <img src="${imgUrl}" alt="${sanitize(caption)}" loading="lazy">
        <div class="instagram-feed__item-overlay">
          <p class="instagram-feed__item-text">${sanitize(caption)}</p>
        </div>
      `;

      feed.appendChild(item);
    });
  }

  fetchInstagramFeed();

  // ==========================
  // CONTACT FORM
  // ==========================
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  if (contactForm) {
    // Update form action with config
    if (CONFIG.FORMSPREE_ID && CONFIG.FORMSPREE_ID !== 'YOUR_FORM_ID') {
      contactForm.action = `https://formspree.io/f/${CONFIG.FORMSPREE_ID}`;
    }

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const formData = new FormData(contactForm);

      // Basic validation
      const name = formData.get('name');
      const email = formData.get('email');
      const message = formData.get('message');

      if (!name || !email || !message) {
        formStatus.textContent = currentLang === 'en'
          ? 'Please fill in all required fields.'
          : 'Veuillez remplir tous les champs obligatoires.';
        return;
      }

      formStatus.textContent = currentLang === 'en' ? 'Sending...' : 'Envoi en cours...';

      fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      })
        .then(res => {
          if (res.ok) {
            formStatus.textContent = currentLang === 'en'
              ? 'Message sent! We will get back to you soon.'
              : 'Message envoyé ! Nous vous répondrons rapidement.';
            contactForm.reset();
          } else {
            throw new Error('Form error');
          }
        })
        .catch(() => {
          formStatus.textContent = currentLang === 'en'
            ? 'Error. Please try again or call us directly.'
            : 'Erreur. Veuillez réessayer ou nous appeler directement.';
        });
    });
  }

  // ==========================
  // EASTER EGG
  // ==========================
  const easterEgg = document.getElementById('easterEgg');
  const easterPopup = document.getElementById('easterPopup');
  const easterSvg = document.getElementById('easterSvg');
  let easterClicks = 0;
  let easterTimeout;

  if (easterSvg) {
    easterSvg.innerHTML = `
      <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 80 L20 50 L35 35 L50 25 L60 20 L70 25 L85 35 L100 50 L120 80 Z" fill="rgba(201,168,76,0.15)" stroke="rgba(201,168,76,0.4)" stroke-width="0.5"/>
        <rect x="52" y="8" width="16" height="12" fill="rgba(201,168,76,0.3)" stroke="rgba(201,168,76,0.5)" stroke-width="0.5"/>
        <polygon points="60,0 54,8 66,8" fill="rgba(201,168,76,0.3)" stroke="rgba(201,168,76,0.5)" stroke-width="0.5"/>
      </svg>
    `;
  }

  if (easterEgg && easterPopup) {
    easterEgg.addEventListener('click', () => {
      easterClicks++;
      clearTimeout(easterTimeout);
      easterTimeout = setTimeout(() => { easterClicks = 0; }, 3000);

      if (easterClicks >= 5) {
        easterPopup.classList.add('show');
        easterPopup.setAttribute('aria-hidden', 'false');
        easterClicks = 0;
        setTimeout(() => {
          easterPopup.classList.remove('show');
          easterPopup.setAttribute('aria-hidden', 'true');
        }, 5000);
      }
    });
  }

})();
