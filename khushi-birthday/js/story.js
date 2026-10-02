(() => {
  "use strict";

  const items = [...document.querySelectorAll(".timeline-item")];
  const progress = document.querySelector(".story-progress span");
  if (!items.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  items.forEach((item) => {
    const marker = item.querySelector(".timeline-marker");
    if (!marker) return;

    marker.addEventListener("click", () => {
      const open = !item.classList.contains("is-open");
      item.classList.toggle("is-open", open);
      item.classList.toggle("is-active", open);
      marker.setAttribute("aria-expanded", String(open));

      if (open) {
        item.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      }
    });
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-active");
      });
    }, { threshold: 0.35 });
    items.forEach((item) => observer.observe(item));
  }

  let ticking = false;
  const update = () => {
    if (!progress) return;
    const section = document.querySelector(".story-timeline");
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const total = Math.max(1, rect.height - window.innerHeight * 0.35);
    const passed = Math.min(total, Math.max(0, window.innerHeight * 0.65 - rect.top));
    progress.style.width = `${Math.min(100, passed / total * 100)}%`;
    ticking = false;
  };

  const schedule = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  update();
})();
