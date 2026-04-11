/* Thanjai Tech Studio - minimal vanilla JS interactions */

const qs = (sel, parent = document) => parent.querySelector(sel);
const qsa = (sel, parent = document) => [...parent.querySelectorAll(sel)];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function setYear() {
  const yearEl = qs("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

function launchConfettiBurst() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const colors = ["#22d3ee", "#3b82f6", "#f472b6", "#f59e0b", "#4ade80", "#a78bfa"];
  const pieces = [];
  const count = 300;
  const gravity = 0.2;
  const drag = 0.994;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "99999";
  document.body.appendChild(canvas);

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();

  // Dual cannon origin (left + right bottom)
  for (let i = 0; i < count; i += 1) {
    const fromLeft = i % 2 === 0;
    const x = fromLeft ? canvas.width * 0.12 : canvas.width * 0.88;
    const y = canvas.height * 0.9;
    // Strong upward cone from both bottom corners
    const angle = fromLeft
      ? (-78 + Math.random() * 20) * (Math.PI / 180)
      : (-102 + Math.random() * 20) * (Math.PI / 180);
    const speed = 11 + Math.random() * 9;
    pieces.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 7,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.32,
      shape: Math.random() > 0.3 ? "rect" : "circle",
      life: 0,
      maxLife: 155 + Math.random() * 45,
    });
  }

  let rafId = 0;
  const start = performance.now();
  const durationMs = 3400;

  const frame = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of pieces) {
      p.vx *= drag;
      p.vy = p.vy * drag + gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rotV;
      p.life += 1;

      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.68);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.globalAlpha = 1;

    const elapsed = performance.now() - start;
    const active = pieces.some((p) => p.life < p.maxLife && p.y < canvas.height + 40);
    if (elapsed < durationMs && active) {
      rafId = window.requestAnimationFrame(frame);
    } else {
      window.cancelAnimationFrame(rafId);
      canvas.remove();
    }
  };

  rafId = window.requestAnimationFrame(frame);
}

function setupTypingNote() {
  const typingEl = qs("#siteTypingText");
  if (!typingEl) return;

  const fullText = String(typingEl.dataset.typingText || "")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "  ")
    .trim();
  if (!fullText) return;

  const colorizeHtmlLikeCode = (input) => {
    const escaped = input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return escaped
      .replace(
        /(&lt;\/?)([a-zA-Z0-9-]+)([^&]*?)(&gt;)/g,
        (_m, p1, p2, p3, p4) => {
          let attrs = p3.replace(
            /([a-zA-Z-:]+)=('.*?'|".*?")/g,
            '<span class="typing-code__attr">$1</span><span class="typing-code__symbol">=</span><span class="typing-code__value">$2</span>'
          );
          return `<span class="typing-code__symbol">${p1}</span><span class="typing-code__tag">${p2}</span>${attrs}<span class="typing-code__symbol">${p4}</span>`;
        }
      )
      .replace(/&amp;[a-zA-Z]+;/g, '<span class="typing-code__entity">$&</span>');
  };

  const applyIndentation = (html) => {
    const withBreaks = html.replace(/\n/g, "<br>");
    return withBreaks.replace(/(^|<br>)( +)/g, (_m, p1, p2) => {
      return `${p1}${"&nbsp;".repeat(p2.length)}`;
    });
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    typingEl.innerHTML = applyIndentation(colorizeHtmlLikeCode(fullText));
    return;
  }

  let i = 0;
  let isDeleting = false;

  const tick = () => {
    const currentText = fullText.slice(0, i);
    typingEl.innerHTML = applyIndentation(colorizeHtmlLikeCode(currentText));

    if (!isDeleting) {
      i += 1;
      if (i > fullText.length) {
        isDeleting = true;
        window.setTimeout(tick, 1400);
        return;
      }
      window.setTimeout(tick, 26);
      return;
    }

    i -= 1;
    if (i < 0) {
      i = 0;
      isDeleting = false;
      window.setTimeout(tick, 380);
      return;
    }
    window.setTimeout(tick, 16);
  };

  tick();
}

function setupStickyHeader() {
  const header = qs(".site-header");
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function setupMobileMenu() {
  const toggle = qs(".nav__toggle");
  const menu = qs("#navMenu");
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (open) {
      const firstLink = qs(".nav__link", menu);
      firstLink?.focus?.();
    } else {
      toggle.focus?.();
    }
  };

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    setOpen(!open);
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    if (!isOpen) return;
    if (menu.contains(e.target) || toggle.contains(e.target)) return;
    setOpen(false);
  });

  // Close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    if (!isOpen) return;
    setOpen(false);
  });

  // Close after clicking a link (mobile)
  menu.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    if (isOpen) setOpen(false);
  });
}

function setupActiveNavLinks() {
  const links = qsa('.nav__link[href^="#"]');
  const sections = links
    .map((a) => {
      const id = a.getAttribute("href");
      const el = id ? qs(id) : null;
      return el ? { a, el } : null;
    })
    .filter(Boolean);

  if (!sections.length) return;

  const setActive = (id) => {
    for (const { a } of sections) {
      a.classList.toggle("is-active", a.getAttribute("href") === id);
    }
  };

  const obs = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      setActive(`#${visible.target.id}`);
    },
    {
      root: null,
      threshold: [0.2, 0.35, 0.5],
      rootMargin: "-30% 0px -60% 0px",
    }
  );

  for (const { el } of sections) obs.observe(el);
}

function setupRevealOnScroll() {
  const nodes = qsa(".reveal");
  if (!nodes.length) return;

  const obs = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("is-in");
        obs.unobserve(e.target);
      }
    },
    { threshold: 0.14 }
  );

  nodes.forEach((n) => obs.observe(n));
}

function setupCarousel() {
  const track = qs(".carousel__track");
  if (!track) return;

  const step = () => Math.round(track.clientWidth * 0.85);

  const scrollByX = (dir) => {
    track.scrollBy({ left: dir * step(), behavior: "smooth" });
  };

  // Drag to scroll (pointer)
  let isDown = false;
  let startX = 0;
  let startLeft = 0;

  track.addEventListener("pointerdown", (e) => {
    isDown = true;
    track.setPointerCapture(e.pointerId);
    startX = e.clientX;
    startLeft = track.scrollLeft;
  });

  track.addEventListener("pointermove", (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    track.scrollLeft = startLeft - dx;
  });

  const end = () => {
    isDown = false;
  };

  track.addEventListener("pointerup", end);
  track.addEventListener("pointercancel", end);

  // Keyboard assist
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") scrollByX(1);
    if (e.key === "ArrowLeft") scrollByX(-1);
  });

  // Auto-scroll (pauses on interaction). No manual click controls.
  let autoTimer = null;
  let pausedUntil = 0;

  const stopAuto = () => {
    window.clearInterval(autoTimer);
    autoTimer = null;
  };

  const startAuto = () => {
    stopAuto();

    autoTimer = window.setInterval(() => {
      if (document.hidden) return;
      if (Date.now() < pausedUntil) return;

      const maxLeft = track.scrollWidth - track.clientWidth;
      const atEnd = track.scrollLeft >= maxLeft - 4;
      if (atEnd) {
        track.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        track.scrollBy({
          left: Math.max(180, Math.round(track.clientWidth * 0.42)),
          behavior: "smooth",
        });
      }
    }, 2200);
  };

  const pause = (ms = 3500) => {
    pausedUntil = Date.now() + ms;
  };

  // Pause on user intent
  ["pointerdown", "touchstart", "mouseenter", "focusin", "wheel"].forEach((evt) => {
    track.addEventListener(evt, () => pause(), { passive: true });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAuto();
    else startAuto();
  });

  window.addEventListener("resize", () => startAuto(), { passive: true });

  startAuto();
}

function setupContactForm() {
  const form = qs("#contactForm");
  if (!form) return;

  const toast = qs("#toast");
  const nameInput = qs('input[name="name"]', form);
  const emailInput = qs('input[name="email"]', form);
  const phoneInput = qs('input[name="phone"]', form);
  const messageInput = qs('textarea[name="message"]', form);
  let toastTimer = null;
  let isSending = false;
  const API_BASE = "https://startup-backend-vq8w.onrender.com";

  // Name: letters + spaces only, max 50
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      nameInput.value = nameInput.value
        .replace(/[^A-Za-z ]/g, "")
        .replace(/\s{2,}/g, " ")
        .slice(0, 50);
    });
  }

  // Email: lowercase + no spaces
  if (emailInput) {
    emailInput.addEventListener("input", () => {
      emailInput.value = emailInput.value.replace(/\s+/g, "").toLowerCase();
    });
  }

  // Enforce digits-only typing for mobile field (max 10)
  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
    });

    phoneInput.addEventListener("paste", (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, 10);
      phoneInput.value = pasted;
    });
  }

  // Message: trim leading spaces, soft max length
  if (messageInput) {
    messageInput.addEventListener("input", () => {
      messageInput.value = messageInput.value.replace(/^\s+/, "").slice(0, 1000);
    });
  }

  const showToast = (msg, type = "info") => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove("toast--info", "toast--error", "toast--success");
    toast.classList.add(`toast--${type}`);
    if (type === "error") {
      toast.setAttribute("role", "alert");
      toast.setAttribute("aria-live", "assertive");
    } else {
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
    }
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3600);
  };

  const getValue = (name) => String(new FormData(form).get(name) ?? "").trim();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (isSending) return;

    const name = getValue("name").replace(/\s+/g, " ");
    const email = getValue("email").toLowerCase();
    const phone = getValue("phone").replace(/\D/g, "");
    const message = getValue("message");

    const errors = [];
    if (!/^[A-Za-z ]{2,50}$/.test(name)) {
      errors.push("Name must contain only letters and spaces.");
    }
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
      errors.push("Email must be a valid @gmail.com address.");
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      errors.push("Mobile number must be exactly 10 digits.");
    }
    if (message.length < 10) errors.push("Please enter a longer message.");

    if (errors.length) {
      showToast(`Fix: ${errors[0]}`, "error");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const prevBtnText = submitBtn?.innerHTML ?? "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = "<span>Sending...</span>";
    }

    isSending = true;

    // Prevent indefinite "Sending..." state when the server is slow/unavailable.
    const controller = new AbortController();
    const requestTimeoutMs = 15000;
    const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);

    fetch(`${API_BASE}/api/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        name,
        email,
        phone,
        message,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        return res.json();
      })
      .then(() => {
        showToast("Sent: Message delivered to your email.", "success");
        launchConfettiBurst();
        form.reset();
      })
      .catch((err) => {
        if (err?.name === "AbortError") {
          showToast("Fix: Server timeout. Please try again.", "error");
          return;
        }
        showToast("Fix: Could not send now. Try again.", "error");
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        isSending = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = prevBtnText;
        }
      });
  });
}

function setupSmartOffsetScroll() {
  // Improves anchor jumps with sticky header (keyboard-friendly).
  const header = qs(".site-header");
  if (!header) return;

  const offset = () => header.getBoundingClientRect().height + 14;

  const scrollToHash = (hash, behavior = "smooth") => {
    const el = qs(hash);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - offset();
    window.scrollTo({ top: clamp(top, 0, Number.MAX_SAFE_INTEGER), behavior });
    el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
    window.setTimeout(() => el.removeAttribute("tabindex"), 800);
  };

  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute("href");
    if (!hash || hash === "#") return;
    const target = qs(hash);
    if (!target) return;
    e.preventDefault();
    history.pushState(null, "", hash);
    scrollToHash(hash, "smooth");
  });

  window.addEventListener("hashchange", () => {
    if (!location.hash) return;
    scrollToHash(location.hash, "auto");
  });

  // Initial hash on load
  if (location.hash) scrollToHash(location.hash, "auto");
}

setYear();
setupTypingNote();
setupStickyHeader();
setupMobileMenu();
setupSmartOffsetScroll();
setupRevealOnScroll();
setupActiveNavLinks();
setupCarousel();
setupContactForm();

