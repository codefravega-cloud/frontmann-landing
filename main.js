(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ---------- WhatsApp links from manifest ---------- */
  function mountWhatsapp() {
    if (!data.whatsappNumber) return;
    $$("[data-whatsapp-link]").forEach(function (a) {
      a.href = "https://wa.me/" + data.whatsappNumber;
    });
  }

  /* ---------- Sticky nav ---------- */
  function initNav() {
    var nav = $("[data-nav]");
    if (!nav) return;
    var onScroll = function () {
      if (window.scrollY > 60) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  function initMobileNav() {
    var burger = $("[data-nav-burger]");
    var panel = $("[data-nav-mobile]");
    if (!burger || !panel) return;
    var open = false;
    function set(state) {
      open = state;
      panel.setAttribute("data-open", String(open));
      panel.setAttribute("aria-hidden", String(!open));
      burger.setAttribute("aria-expanded", String(open));
      document.documentElement.style.overflow = open ? "hidden" : "";
    }
    burger.addEventListener("click", function () { set(!open); });
    $$("a", panel).forEach(function (a) { a.addEventListener("click", function () { set(false); }); });
  }

  /* ---------- Smooth anchors (native) ---------- */
  function initSmoothAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var navOffset = 76;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - navOffset,
        behavior: reduced ? "auto" : "smooth",
      });
    });
  }

  /* ---------- Scroll progress bar ---------- */
  function initScrollProgress() {
    var bar = $("[data-scroll-progress]");
    if (!bar) return;
    var raf = null;
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = "scaleX(" + pct + ")";
      raf = null;
    }
    window.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    update();
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveals() {
    var els = $$("[data-reveal]");
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-revealed");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
    els.forEach(function (el) { io.observe(el); });

    setTimeout(function () {
      $$("[data-reveal]:not(.is-revealed)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-revealed");
      });
    }, 6000);
  }

  /* ---------- Tilt + cursor halo on cards ---------- */
  function initTilt() {
    if (!fineHover) return;
    $$(".card").forEach(function (card) {
      var MAX = 6, tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        tx = -py * MAX; ty = px * MAX;
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
        if (!raf) raf = requestAnimationFrame(loop);
      });
      card.addEventListener("mouseleave", function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
      function loop() {
        cx += (tx - cx) * 0.15; cy += (ty - cy) * 0.15;
        card.style.setProperty("--rx", cx.toFixed(2) + "deg");
        card.style.setProperty("--ry", cy.toFixed(2) + "deg");
        raf = (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) ? requestAnimationFrame(loop) : null;
      }
    });
  }

  /* ---------- Count-up numbers ---------- */
  function initCountUp() {
    $$("[data-count-to]").forEach(function (el) {
      var target = parseFloat(el.dataset.countTo);
      var suffix = el.dataset.countSuffix || "";
      var trigger = function () {
        if (window.gsap) {
          var obj = { v: 0 };
          gsap.to(obj, {
            v: target, duration: 1.3, ease: "power2.out",
            onUpdate: function () { el.textContent = Math.round(obj.v) + suffix; },
          });
        } else {
          el.textContent = target + suffix;
        }
      };
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { trigger(); io.unobserve(e.target); } });
      }, { threshold: 0.5 });
      io.observe(el);
    });
  }

  /* ---------- Seguimiento timeline: scroll-scrub fill + active dot ---------- */
  function initTimeline() {
    var wrap = $("[data-timeline]");
    var fill = $("[data-timeline-fill]");
    if (!wrap || !fill) return;
    var steps = $$(".timeline-step", wrap);

    function setProgress(pct) {
      pct = Math.max(0, Math.min(1, pct));
      var isStacked = window.innerWidth <= 900;
      fill.style.transform = (isStacked ? "scaleY(" : "scaleX(") + pct + ")";
      var activeIndex = Math.floor(pct * steps.length);
      steps.forEach(function (step, i) {
        step.classList.toggle("is-active", i < activeIndex || (i === 0 && pct > 0.02));
      });
    }

    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.create({
        trigger: wrap,
        start: "top 78%",
        end: "bottom 55%",
        scrub: 0.4,
        onUpdate: function (self) { setProgress(self.progress); },
      });
    } else {
      // Fallback without GSAP: reveal all stages once visible.
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { setProgress(1); io.unobserve(e.target); } });
      }, { threshold: 0.3 });
      io.observe(wrap);
    }
  }

  /* ---------- Seguimiento tracker demo (visual only) ---------- */
  function setupTrackerDemo() {
    var form = $("[data-tracker-form]");
    var result = $("[data-tracker-result]");
    if (!form || !result) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = $("input", form);
      var code = (input.value || "").trim();
      if (!code) { input.focus(); return; }
      var pill = $(".pill", result);
      var stageLabels = { recibido: "Recibido", proceso: "En proceso", secado: "En secado", calidad: "Control de calidad", listo: "Listo", entregado: "Entregado" };
      var stage = (data.trackerDemoStage && stageLabels[data.trackerDemoStage]) || "En secado";
      if (pill) pill.textContent = stage;
      result.setAttribute("data-visible", "true");
    });
  }

  /* ---------- FAQ accordion ---------- */
  function initFaq() {
    $$("[data-faq-item]").forEach(function (item) {
      var trigger = $("[data-faq-trigger]", item);
      var answer = $(".faq-a", item);
      if (!trigger || !answer) return;
      trigger.addEventListener("click", function () {
        var isOpen = item.getAttribute("data-open") === "true";
        // Close siblings for a clean single-open accordion.
        $$("[data-faq-item]").forEach(function (other) {
          if (other !== item) {
            other.setAttribute("data-open", "false");
            $("[data-faq-trigger]", other).setAttribute("aria-expanded", "false");
            $(".faq-a", other).style.maxHeight = "";
          }
        });
        var next = !isOpen;
        item.setAttribute("data-open", String(next));
        trigger.setAttribute("aria-expanded", String(next));
        answer.style.maxHeight = next ? answer.scrollHeight + "px" : "";
      });
    });
  }

  /* ---------- Contact form: realistic simulated submit ---------- */
  function setupContactForm() {
    var form = $("[data-contact-form]");
    var success = $("[data-contact-success]");
    if (!form || !success) return;
    var msg = $("[data-contact-success-msg]");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.classList.contains("is-sending")) return;
      if (!form.reportValidity()) return;

      form.classList.add("is-sending");

      setTimeout(function () {
        var firstName = (form.elements.name.value || "").trim().split(/\s+/)[0] || "Hola";
        var tipo = form.elements.tipo && form.elements.tipo.value === "dojo" ? "tu dojo" : "tu equipo";
        if (msg) msg.textContent = firstName + ", recibimos tu consulta sobre " + tipo + ". Te escribimos a la brevedad.";
        form.classList.remove("is-sending");
        form.classList.add("is-sent");
        success.setAttribute("aria-hidden", "false");
        success.setAttribute("data-visible", "true");
      }, 700 + Math.random() * 500);
    });
  }

  function boot() {
    safe(mountWhatsapp, "mountWhatsapp");
    safe(initNav, "initNav");
    safe(initMobileNav, "initMobileNav");
    safe(initSmoothAnchors, "initSmoothAnchors");
    safe(initScrollProgress, "initScrollProgress");
    safe(initReveals, "initReveals");
    safe(initTilt, "initTilt");
    safe(initCountUp, "initCountUp");
    safe(initTimeline, "initTimeline");
    safe(setupTrackerDemo, "setupTrackerDemo");
    safe(initFaq, "initFaq");
    safe(setupContactForm, "setupContactForm");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
