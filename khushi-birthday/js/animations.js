(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = [...document.querySelectorAll(".reveal")];

  function reveal() {
    if (!revealItems.length) return;
    if (reduced || !("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        instance.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });

    revealItems.forEach((item) => observer.observe(item));
  }

  function gsapEntrance() {
    if (reduced || typeof window.gsap === "undefined") return;

    const visual = document.querySelector(".hero-visual");
    if (visual) {
      window.gsap.fromTo(visual,
        { autoAlpha: 0, scale: 0.92, y: 12 },
        { autoAlpha: 1, scale: 1, y: 0, duration: 1.15, ease: "power3.out", delay: 0.1, overwrite: true }
      );
    }

    if (window.innerWidth < 768) return;

    document.querySelectorAll(".preview-card").forEach((card) => {
      const reset = () => window.gsap.to(card, { rotationX: 0, rotationY: 0, duration: 0.45, ease: "power2.out", overwrite: true });
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        window.gsap.to(card, {
          rotationY: x * 3,
          rotationX: y * -3,
          duration: 0.28,
          ease: "power2.out",
          overwrite: true
        });
      }, { passive: true });
      card.addEventListener("pointerleave", reset);
    });
  }

  function parallax() {
    if (reduced) return;
    const visual = document.querySelector(".hero-visual");
    if (!visual || window.matchMedia("(max-width: 767px)").matches) return;

    let ticking = false;
    const update = () => {
      const shift = Math.min(window.scrollY, window.innerHeight * 1.2) * 0.035;
      visual.style.setProperty("--scroll-shift", `${shift}px`);
      ticking = false;
    };

    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  function init() {
    reveal();
    gsapEntrance();
    parallax();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
