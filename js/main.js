(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = motionQuery.matches;
  const body = document.body;

  const getStorage = (storage, key, fallback = null) => {
    try {
      const value = storage.getItem(key);
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  };

  const setStorage = (storage, key, value) => {
    try { storage.setItem(key, value); } catch {}
  };

  function year() {
    const el = $("#currentYear");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function navigation() {
    const toggle = $("#navToggle");
    const nav = $("#siteNav");
    if (!toggle || !nav) return;

    const close = () => {
      nav.classList.remove("is-open");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation");
      body.classList.remove("nav-open");
    };

    toggle.addEventListener("click", () => {
      const open = !nav.classList.contains("is-open");
      if (open) {
        nav.classList.add("is-open");
        toggle.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Close navigation");
        body.classList.add("nav-open");
      } else {
        close();
      }
    });

    $$('a', nav).forEach((link) => link.addEventListener("click", close));
    window.addEventListener("resize", () => {
      if (window.innerWidth > 767) close();
    }, { passive: true });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
  }

  function header() {
    const header = $(".site-header");
    if (!header) return;

    let ticking = false;
    const update = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
      ticking = false;
    };

    update();
    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
  }

  function anchors() {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const raw = link.getAttribute("href");
        if (!raw || raw === "#") return;
        const target = document.getElementById(raw.slice(1));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
        history.replaceState(null, "", raw);
      });
    });
  }

  function pageTransitions() {
    const overlay = $("#pageTransition");
    if (!overlay || reduced) return;

    requestAnimationFrame(() => overlay.classList.add("is-leaving"));

    $$('a[href]').forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        link.target === "_blank" ||
        link.hasAttribute("download")
      ) return;

      link.addEventListener("click", (event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          link.closest(".lightbox") ||
          link.closest(".surprise-stage")
        ) return;
        event.preventDefault();
        overlay.classList.remove("is-leaving");
        overlay.classList.add("is-entering");
        window.setTimeout(() => { window.location.assign(link.href); }, 460);
      });
    });
  }

  function countdown() {
    const root = $("#birthdayCountdown");
    if (!root) return;

    const units = {
      days: $('[data-unit="days"]', root),
      hours: $('[data-unit="hours"]', root),
      minutes: $('[data-unit="minutes"]', root),
      seconds: $('[data-unit="seconds"]', root)
    };
    const note = $("#countdownNote");
    const target = new Date(root.dataset.birthday || "");

    if (Number.isNaN(target.getTime())) {
      if (note) note.textContent = "Set a valid birthday date to activate the countdown.";
      return;
    }

    const pad = (value) => String(Math.max(0, value)).padStart(2, "0");
    let timer = null;

    const update = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        Object.values(units).forEach((element) => { if (element) element.textContent = "00"; });
        if (note) note.textContent = "Today is the day. Happy Birthday, Khushi!";
        if (timer !== null) window.clearInterval(timer);
        timer = null;
        return;
      }

      const seconds = Math.floor(diff / 1000);
      if (units.days) units.days.textContent = pad(Math.floor(seconds / 86400));
      if (units.hours) units.hours.textContent = pad(Math.floor((seconds % 86400) / 3600));
      if (units.minutes) units.minutes.textContent = pad(Math.floor((seconds % 3600) / 60));
      if (units.seconds) units.seconds.textContent = pad(seconds % 60);
    };

    update();
    if (target.getTime() > Date.now()) timer = window.setInterval(update, 1000);
  }

  function music() {
    const audio = $("#birthdayAudio");
    const player = $("#musicPlayer");
    if (!audio || !player) return;

    const toggle = $("#musicToggle");
    const mute = $("#musicMute");
    const volume = $("#musicVolume");
    const progress = $("#musicProgress");
    const time = $("#musicTime");
    const status = $("#musicStatus");
    const close = $("#musicClose");
    const storageKey = "khushiMusic";
    const audioSource = audio.dataset.src || "";

    const ensureSource = () => {
      if (!audio.src && audioSource) audio.src = audioSource;
      return Boolean(audio.src);
    };

    let userVolume = Number(getStorage(localStorage, `${storageKey}:volume`, "0.8"));
    if (!Number.isFinite(userVolume) || userVolume < 0 || userVolume > 1) userVolume = 0.8;

    audio.volume = userVolume;
    audio.muted = getStorage(localStorage, `${storageKey}:muted`, "0") === "1";
    if (volume) volume.value = String(userVolume);

    const savedTime = Number(getStorage(sessionStorage, `${storageKey}:time`, "0"));
    if (Number.isFinite(savedTime) && savedTime > 0) {
      audio.addEventListener("loadedmetadata", () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          audio.currentTime = Math.min(savedTime, audio.duration - 0.01);
        }
      }, { once: true });
    }

    const fmt = (seconds) => {
      if (!Number.isFinite(seconds)) return "00:00";
      const total = Math.max(0, Math.floor(seconds));
      return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
    };

    const sync = () => {
      const playing = !audio.paused && !audio.ended;
      player.classList.toggle("is-playing", playing);
      if (toggle) {
        toggle.setAttribute("aria-pressed", String(playing));
        toggle.setAttribute("aria-label", playing ? "Pause birthday music" : "Play birthday music");
      }
      if (status) {
        status.textContent = audio.error
          ? "Add music/birthday.mp3"
          : playing
            ? "Playing"
            : (audio.currentTime > 0 ? "Ready to resume" : "Tap to play");
      }
      if (time) time.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
      if (progress) progress.value = audio.duration ? String((audio.currentTime / audio.duration) * 100) : "0";
      if (mute) {
        mute.textContent = audio.muted ? "U" : "M";
        mute.setAttribute("aria-label", audio.muted ? "Unmute music" : "Mute music");
      }
    };

    toggle?.addEventListener("click", async () => {
      if (!ensureSource()) {
        if (status) status.textContent = "Audio source is not configured";
        return;
      }
      if (audio.error) {
        if (status) status.textContent = "Add music/birthday.mp3 to enable audio";
        return;
      }

      try {
        if (audio.paused) await audio.play();
        else audio.pause();
      } catch {
        if (status) status.textContent = "Tap again to start audio";
      }
      sync();
    });

    audio.addEventListener("play", sync);
    audio.addEventListener("pause", sync);
    audio.addEventListener("loadedmetadata", sync);
    audio.addEventListener("timeupdate", sync);
    audio.addEventListener("volumechange", sync);
    audio.addEventListener("ended", () => {
      try { sessionStorage.removeItem(`${storageKey}:time`); } catch {}
      sync();
    });
    audio.addEventListener("error", () => {
      if (status) status.textContent = "Add music/birthday.mp3";
      sync();
    });

    window.addEventListener("pagehide", () => {
      if (Number.isFinite(audio.currentTime) && audio.currentTime > 0) {
        setStorage(sessionStorage, `${storageKey}:time`, String(audio.currentTime));
      }
    });

    volume?.addEventListener("input", () => {
      const nextVolume = Number(volume.value);
      if (!Number.isFinite(nextVolume)) return;
      userVolume = Math.min(1, Math.max(0, nextVolume));
      audio.volume = userVolume;
      audio.muted = false;
      setStorage(localStorage, `${storageKey}:volume`, String(userVolume));
      setStorage(localStorage, `${storageKey}:muted`, "0");
    });

    mute?.addEventListener("click", () => {
      audio.muted = !audio.muted;
      if (!audio.muted && audio.volume === 0) audio.volume = userVolume || 0.8;
      setStorage(localStorage, `${storageKey}:muted`, audio.muted ? "1" : "0");
      sync();
    });

    progress?.addEventListener("input", () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        const percent = Number(progress.value);
        audio.currentTime = Math.min(100, Math.max(0, percent)) / 100 * audio.duration;
      }
    });

    close?.addEventListener("click", () => {
      const minimized = player.classList.toggle("is-minimized");
      close.setAttribute("aria-label", minimized ? "Expand music player" : "Minimize music player");
    });

    sync();
  }

  async function fetchCsrfToken(signal) {
    const response = await fetch("php/auth.php?action=csrf", {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success || typeof data.csrf !== "string") {
      throw new Error(data.error || "Security token could not be loaded.");
    }
    return data.csrf;
  }

  function unicodeLength(value) {
    return Array.from(value).length;
  }

  function messageForm() {
    const form = $("#birthdayMessageForm");
    if (!form) return;

    const name = $("#messageName");
    const message = $("#messageText");
    const csrfField = $("#messageCsrf");
    const submit = $("#messageSubmit");
    const status = $("#messageFormStatus");
    const nameCount = $("#messageNameCount");
    const messageCount = $("#messageMessageCount");
    let token = "";

    const setStatus = (text, state = "") => {
      if (!status) return;
      status.textContent = text;
      status.dataset.state = state;
    };

    const setBusy = (busy) => {
      if (!submit) return;
      submit.disabled = busy;
      submit.setAttribute("aria-busy", String(busy));
    };

    const updateCounts = () => {
      if (nameCount && name) nameCount.textContent = `${unicodeLength(name.value)}/80`;
      if (messageCount && message) messageCount.textContent = `${unicodeLength(message.value)}/3000`;
    };

    const loadToken = async () => {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 10000);
      try {
        token = await fetchCsrfToken(controller.signal);
        if (csrfField) csrfField.value = token;
        setStatus("");
        if (submit) submit.disabled = false;
      } catch (error) {
        const text = error?.name === "AbortError"
          ? "Security token request timed out. Please retry."
          : error instanceof Error
            ? error.message
            : "Security token could not be loaded.";
        setStatus(text, "error");
        if (submit) submit.disabled = true;
      } finally {
        window.clearTimeout(timer);
      }
    };

    [name, message].forEach((field) => field?.addEventListener("input", updateCounts));
    updateCounts();
    loadToken();

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!name || !message || !token) return;

      const nameValue = name.value.trim();
      const messageValue = message.value.trim();
      const nameLength = unicodeLength(nameValue);
      const messageLength = unicodeLength(messageValue);

      if (!nameValue || !messageValue) {
        setStatus("Please enter your name and message.", "error");
        return;
      }
      if (nameLength > 80) {
        setStatus("Name is too long.", "error");
        return;
      }
      if (messageLength > 3000) {
        setStatus("Message is too long.", "error");
        return;
      }

      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 12000);
      setBusy(true);
      setStatus("Sending…");

      try {
        const response = await fetch("php/save-message.php", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-CSRF-Token": token
          },
          body: JSON.stringify({ name: nameValue, message: messageValue }),
          signal: controller.signal
        });
        const data = await response.json().catch(() => ({}));

        if (response.status === 403) {
          await loadToken();
          throw new Error("Your security token expired. Please press send again.");
        }
        if (!response.ok || !data.success) {
          throw new Error(data.error || "The message could not be saved.");
        }

        form.reset();
        if (csrfField) csrfField.value = token;
        updateCounts();
        setStatus("Your message was saved. Thank you!", "success");
      } catch (error) {
        const text = error?.name === "AbortError"
          ? "The request timed out. Please try again."
          : error instanceof Error
            ? error.message
            : "The message could not be saved.";
        setStatus(text, "error");
      } finally {
        window.clearTimeout(timer);
        setBusy(false);
        if (!token) loadToken();
      }
    });
  }

  function loader() {
    const loader = $("#siteLoader");
    if (!loader) return;

    const progress = $("#loaderProgress");
    const reveal = () => {
      body.classList.remove("is-loading");
      body.classList.add("page-loaded");
      if (loader) {
        loader.classList.add("is-hidden");
        window.setTimeout(() => loader.remove(), 700);
      }
    };

    if (reduced || document.readyState === "complete") {
      reveal();
      return;
    }

    if (progress) progress.style.width = "100%";
    window.addEventListener("load", () => window.setTimeout(reveal, 240), { once: true });
    window.setTimeout(reveal, 1800);
  }

  function init() {
    year();
    navigation();
    header();
    anchors();
    pageTransitions();
    countdown();
    music();
    messageForm();
    loader();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
