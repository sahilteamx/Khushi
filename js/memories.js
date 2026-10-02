(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const cards = $$(".memory-card");
  const lightbox = $("#lightbox");
  if (!cards.length || !lightbox) return;

  const image = $("#lightboxImage");
  const placeholder = $("#lightboxPlaceholder");
  const title = $("#lightboxTitle");
  const caption = $("#lightboxCaption");
  const counter = $("#lightboxCounter");
  const media = $(".lightbox-media");
  const close = $("#lightboxClose");
  const prev = $("#lightboxPrev");
  const next = $("#lightboxNext");
  const count = $("#galleryCount");
  const figure = $(".lightbox-figure");
  const cache = new Map();

  const items = cards.map((card) => ({
    card,
    opener: $(".memory-open", card),
    cardImage: $("img", card),
    src: card.dataset.photo || $("img", card)?.dataset.src || "",
    title: card.dataset.title || "Memory",
    caption: card.dataset.caption || ""
  }));

  let index = 0;
  let startX = 0;
  let startY = 0;
  let lastFocused = null;

  const imageAvailability = (src) => {
    if (!src) return Promise.resolve(false);
    if (cache.has(src)) return cache.get(src);
    const promise = new Promise((resolve) => {
      const test = new Image();
      test.onload = () => resolve(true);
      test.onerror = () => resolve(false);
      test.src = src;
    });
    cache.set(src, promise);
    return promise;
  };

  const render = async (nextIndex) => {
    index = (nextIndex + items.length) % items.length;
    const item = items[index];

    title.textContent = item.title;
    caption.textContent = item.caption;
    counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
    image.classList.remove("is-ready");
    media.classList.remove("has-image");
    image.removeAttribute("src");
    image.alt = "";

    const available = await imageAvailability(item.src);
    if (items[index] !== item) return;

    if (available) {
      image.src = item.src;
      image.alt = item.title.replace(/^\[|\]$/g, "") || "Memory";
      image.classList.add("is-ready");
      media.classList.add("has-image");
    }
  };

  const open = (nextIndex) => {
    lastFocused = document.activeElement;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("nav-open");
    render(nextIndex);
    close?.focus();
  };

  const shut = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    media.classList.remove("has-image");
    document.body.classList.remove("nav-open");
    image.removeAttribute("src");
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  };

  const attachImage = (img) => {
    if (!img || img.src || !img.dataset.src) return;
    img.src = img.dataset.src;
  };

  cards.forEach((card, cardIndex) => {
    const img = $("img", card);
    img?.addEventListener("load", () => {
      $(".memory-placeholder", card)?.classList.add("has-image");
    });
    img?.addEventListener("error", () => {
      $(".memory-placeholder", card)?.classList.remove("has-image");
    });
    $(".memory-open", card)?.addEventListener("click", () => open(cardIndex));
  });

  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        attachImage($("img", entry.target));
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "160px 0px" });
    cards.forEach((card) => imageObserver.observe(card));
  } else {
    cards.forEach((card) => attachImage($("img", card)));
  }

  prev?.addEventListener("click", () => render(index - 1));
  next?.addEventListener("click", () => render(index + 1));
  close?.addEventListener("click", shut);
  lightbox.addEventListener("click", (event) => { if (event.target === lightbox) shut(); });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") shut();
    if (event.key === "ArrowLeft") render(index - 1);
    if (event.key === "ArrowRight") render(index + 1);
    if (event.key === "Tab") {
      const focusable = [close, prev, next].filter((node) => node instanceof HTMLElement && !node.disabled);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  lightbox.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    startX = touch.clientX;
    startY = touch.clientY;
  }, { passive: true });

  lightbox.addEventListener("touchend", (event) => {
    const touch = event.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
      render(dx < 0 ? index + 1 : index - 1);
    }
  }, { passive: true });

  if (figure) figure.setAttribute("tabindex", "-1");
  if (count) count.textContent = `${items.length} photos`;

  items.forEach((item) => {
    if (item.cardImage?.complete && item.cardImage.naturalWidth > 0) {
      $(".memory-placeholder", item.card)?.classList.add("has-image");
    }
  });
})();
