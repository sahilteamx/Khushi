(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const stage = $("#surpriseStage");
  const start = $("#surpriseButton");
  const replay = $("#replaySurprise");
  const exit = $("#surpriseExit");
  if (!stage || !start) return;

  const kicker = $("#surpriseKicker");
  const title = $("#surpriseTitle");
  const frame = $(".surprise-photo-frame");
  const photo = $("#surprisePhoto");
  const message = $("#surpriseMessage");
  const actions = $(".surprise-actions");
  const actionLinks = actions ? [...actions.querySelectorAll('button, a[href]')] : [];
  const particles = $("#surpriseParticles");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let running = false;
  let lastFocused = null;
  let activeTimeline = null;

  function makeParticles() {
    particles?.replaceChildren();
    if (!particles || reduced) return;

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 18; i += 1) {
      const particle = document.createElement("span");
      particle.className = "surprise-particle";
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.transform = `scale(${0.65 + Math.random() * 0.7})`;
      fragment.appendChild(particle);
    }
    particles.appendChild(fragment);
  }

  function burstConfetti() {
    if (reduced) return;

    const fragment = document.createDocumentFragment();
    const pieces = 48;
    for (let i = 0; i < pieces; i += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.setProperty("--confetti-hue", String(Math.floor(Math.random() * 45 + 25)));
      piece.style.setProperty("--confetti-x", `${(Math.random() - 0.5) * 180}px`);
      piece.style.setProperty("--confetti-r", `${Math.random() * 900 - 450}deg`);
      piece.style.animationDelay = `${i * 7}ms`;
      fragment.appendChild(piece);
    }
    document.body.appendChild(fragment);
    window.setTimeout(() => {
      document.querySelectorAll(".confetti-piece").forEach((piece) => piece.remove());
    }, 3600);
  }

  function revealPhoto() {
    return new Promise((resolve) => {
      if (!photo) return resolve(false);
      const src = photo.dataset.src || "";
      if (!src) return resolve(false);

      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        photo.src = image.src;
        frame?.classList.add("has-image");
        resolve(true);
      };
      image.onerror = () => resolve(false);
      image.src = src;
    });
  }

  function close() {
    activeTimeline?.kill();
    activeTimeline = null;
    stage.classList.remove("is-active");
    stage.setAttribute("aria-hidden", "true");
    document.body.classList.remove("nav-open");
    running = false;
    frame?.classList.remove("has-image");
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  }

  function play() {
    if (running) return;
    running = true;
    lastFocused = document.activeElement;
    stage.classList.add("is-active");
    stage.setAttribute("aria-hidden", "false");
    document.body.classList.add("nav-open");
    makeParticles();
    frame?.classList.remove("has-image");
    window.setTimeout(() => exit?.focus(), 0);

    const begin = () => {
      [kicker, title, frame, message, actions].forEach((element) => {
        if (!element) return;
        element.style.opacity = "0";
        element.style.transform = "translateY(18px) scale(.98)";
      });

      if (reduced || typeof window.gsap === "undefined") {
        [kicker, title, frame, message, actions].forEach((element) => {
          if (!element) return;
          element.style.opacity = "1";
          element.style.transform = "none";
        });
        burstConfetti();
        running = false;
        return;
      }

      activeTimeline = window.gsap.timeline({ defaults: { ease: "power3.out" } });
      activeTimeline
        .to(kicker, { opacity: 1, y: 0, duration: 0.45 })
        .to(title, { opacity: 1, y: 0, duration: 0.7 }, "-=.12")
        .to(frame, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "back.out(1.4)" }, "-=.18")
        .to(message, { opacity: 1, y: 0, duration: 0.55 }, "-=.12")
        .to(actions, { opacity: 1, y: 0, duration: 0.45 }, "-=.08")
        .add(burstConfetti);

      activeTimeline.eventCallback("onComplete", () => { running = false; activeTimeline = null; });
    };

    revealPhoto().then(begin);
  }

  start.addEventListener("click", play);
  replay?.addEventListener("click", play);
  exit?.addEventListener("click", close);

  stage.addEventListener("click", (event) => {
    if (event.target === stage) close();
  });

  document.addEventListener("keydown", (event) => {
    if (!stage.classList.contains("is-active")) return;
    if (event.key === "Escape") close();
    if (event.key === "Tab") {
      const focusable = [exit, ...actionLinks].filter((element) => element instanceof HTMLElement && !element.disabled && element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
})();
