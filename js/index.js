// ^ Write your JavaScript code here


const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const html = document.documentElement;

const safeStorage = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch {}
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  },
};

(function scrollSpy() {
  const header = $("#header");
  const links = $$(".nav-links a[href^='#']");
  const sections = links
    .map((link) => $(link.getAttribute("href")))
    .filter(Boolean);

  const ACTIVE = ["text-primary", "font-bold"];
  const INACTIVE = ["text-slate-600", "dark:text-slate-300"];

  function setActive(id) {
    links.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${id}`;
      link.classList.toggle(ACTIVE[0], isActive);
      link.classList.toggle(ACTIVE[1], isActive);
      INACTIVE.forEach((c) => link.classList.toggle(c, !isActive));
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function onScroll() {
    const offset = header.offsetHeight + 120;
    const scrollPos = window.scrollY + offset;
    let currentId = sections[0].id;

    sections.forEach((section) => {
      if (section.offsetTop <= scrollPos) currentId = section.id;
    });

    const atBottom =
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 4;
    if (atBottom) currentId = sections[sections.length - 1].id;

    setActive(currentId);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
})();

(function themeSwitcher() {
  const btn = $("#theme-toggle-button");

  function applyTheme(theme) {
    html.classList.toggle("dark", theme === "dark");
    btn.setAttribute("aria-pressed", String(theme === "dark"));
  }

  const saved = safeStorage.get("theme");
  applyTheme(saved || (html.classList.contains("dark") ? "dark" : "light"));

  btn.addEventListener("click", () => {
    const next = html.classList.contains("dark") ? "light" : "dark";
    applyTheme(next);
    safeStorage.set("theme", next);
  });
})();

(function portfolioTabs() {
  const buttons = $$(".portfolio-filter");
  const items = $$(".portfolio-item");

  const ACTIVE = [
    "active", "bg-linear-to-r", "from-primary", "to-secondary",
    "text-white", "hover:shadow-lg", "hover:shadow-primary/50",
  ];
  const INACTIVE = [
    "bg-white", "dark:bg-slate-800", "text-slate-600", "dark:text-slate-300",
    "hover:bg-slate-100", "dark:hover:bg-slate-700", "border",
    "border-slate-300", "dark:border-slate-700",
  ];

  function setButtonState(btn, isActive) {
    btn.classList.remove(...ACTIVE, ...INACTIVE);
    btn.classList.add(...(isActive ? ACTIVE : INACTIVE));
    btn.setAttribute("aria-pressed", String(isActive));
  }

  function filterItems(filter) {
    items.forEach((item) => {
      const show = filter === "all" || item.dataset.category === filter;
      if (show) {
        item.classList.remove("hidden");
        item.animate(
          [
            { opacity: 0, transform: "scale(0.95)" },
            { opacity: 1, transform: "scale(1)" },
          ],
          { duration: 300, easing: "ease-out" }
        );
      } else {
        item.classList.add("hidden");
      }
    });
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => setButtonState(b, b === btn));
      filterItems(btn.dataset.filter);
    });
  });
})();

(function testimonialsCarousel() {
  const track = $("#testimonials-carousel");
  const cards = $$(".testimonial-card", track);
  const nextBtn = $("#next-testimonial");
  const prevBtn = $("#prev-testimonial");
  const dotsWrap = $(".carousel-indicator").parentElement;

  const DOT_BASE =
    "carousel-indicator w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 cursor-pointer";
  const DOT_ON = "bg-accent";
  const DOT_OFF = ["bg-slate-400", "dark:bg-slate-600"];

  let index = 0;
  let timer = null;
  const AUTOPLAY_MS = 4000;

  const perView = () =>
    window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;
  const maxIndex = () => Math.max(0, cards.length - perView());

  function buildDots() {
    dotsWrap.innerHTML = "";
    for (let i = 0; i <= maxIndex(); i++) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = DOT_BASE;
      dot.dataset.index = i;
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `التوصية ${i + 1}`);
      dot.addEventListener("click", () => {
        goTo(i);
        restartAutoplay();
      });
      dotsWrap.appendChild(dot);
    }
  }

  function updateDots() {
    $$(".carousel-indicator", dotsWrap).forEach((dot, i) => {
      const active = i === index;
      dot.classList.toggle(DOT_ON, active);
      DOT_OFF.forEach((c) => dot.classList.toggle(c, !active));
      dot.setAttribute("aria-selected", String(active));
    });
  }

  function render() {
    const shift = cards[0].offsetWidth * index;
    track.style.transform = `translateX(${shift}px)`;
    updateDots();
  }

  function goTo(i) {
    const max = maxIndex();
    index = i > max ? 0 : i < 0 ? max : i; // loop
    render();
  }

  function startAutoplay() {
    stopAutoplay();
    timer = setInterval(() => goTo(index + 1), AUTOPLAY_MS);
  }
  function stopAutoplay() {
    clearInterval(timer);
  }
  function restartAutoplay() {
    startAutoplay();
  }

  nextBtn.addEventListener("click", () => { goTo(index + 1); restartAutoplay(); });
  prevBtn.addEventListener("click", () => { goTo(index - 1); restartAutoplay(); });

  const wrapper = track.parentElement.parentElement;
  wrapper.addEventListener("mouseenter", stopAutoplay);
  wrapper.addEventListener("mouseleave", startAutoplay);
  wrapper.addEventListener("focusin", stopAutoplay);
  wrapper.addEventListener("focusout", startAutoplay);

  let startX = 0;
  track.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    stopAutoplay();
  }, { passive: true });
  track.addEventListener("touchend", (e) => {
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 50) {
      goTo(diff < 0 ? index + 1 : index - 1);
    }
    startAutoplay();
  });

  window.addEventListener("resize", () => {
    buildDots();
    goTo(Math.min(index, maxIndex()));
  });

  buildDots();
  render();
  startAutoplay();
})();

(function settingsSidebar() {
  const toggleBtn = $("#settings-toggle");
  const sidebar = $("#settings-sidebar");
  const closeBtn = $("#close-settings");
  const resetBtn = $("#reset-settings");
  const colorsGrid = $("#theme-colors-grid");
  const fontBtns = $$(".font-option");
  const metaTheme = $('meta[name="theme-color"]');

  const STORAGE_KEY = "site-settings";

  const FONTS = {
    alexandria: "'Alexandria', sans-serif",
    tajawal: "'Tajawal', sans-serif",
    cairo: "'Cairo', sans-serif",
  };
  const DEFAULT_FONT = "tajawal";

  const PALETTES = [
    { name: "افتراضي", primary: null, secondary: null, accent: null },
    { name: "أزرق",    primary: "#3b82f6", secondary: "#06b6d4", accent: "#8b5cf6" },
    { name: "أخضر",    primary: "#10b981", secondary: "#14b8a6", accent: "#84cc16" },
    { name: "وردي",    primary: "#ec4899", secondary: "#f43f5e", accent: "#a855f7" },
    { name: "برتقالي", primary: "#f97316", secondary: "#f59e0b", accent: "#ef4444" },
    { name: "أحمر",    primary: "#ef4444", secondary: "#f97316", accent: "#ec4899" },
    { name: "بنفسجي",  primary: "#8b5cf6", secondary: "#d946ef", accent: "#6366f1" },
    { name: "سماوي",   primary: "#0ea5e9", secondary: "#2dd4bf", accent: "#6366f1" },
  ];

  const cs = getComputedStyle(html);
  const defaults = {
    primary: cs.getPropertyValue("--color-primary").trim() || "#6366f1",
    secondary: cs.getPropertyValue("--color-secondary").trim() || "#8b5cf6",
    accent: cs.getPropertyValue("--color-accent").trim() || "#ec4899",
  };

  let state = { font: DEFAULT_FONT, palette: 0 };

  function openSidebar() {
    sidebar.classList.remove("translate-x-full");
    sidebar.setAttribute("aria-hidden", "false");
    toggleBtn.setAttribute("aria-expanded", "true");
    toggleBtn.style.right = "20rem"; // عرض الـ sidebar (w-80)
  }
  function closeSidebar() {
    sidebar.classList.add("translate-x-full");
    sidebar.setAttribute("aria-hidden", "true");
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.style.right = "";
  }
  const isOpen = () => !sidebar.classList.contains("translate-x-full");

  toggleBtn.addEventListener("click", () => (isOpen() ? closeSidebar() : openSidebar()));
  closeBtn.addEventListener("click", closeSidebar);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) closeSidebar();
  });
  document.addEventListener("click", (e) => {
    if (isOpen() && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
      closeSidebar();
    }
  });

  function applyFont(key) {
    document.body.style.fontFamily = FONTS[key];
    fontBtns.forEach((btn) => {
      const active = btn.dataset.font === key;
      btn.classList.toggle("active", active);
      btn.classList.toggle("border-primary", active);
      btn.setAttribute("aria-checked", String(active));
    });
    state.font = key;
  }

  fontBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      applyFont(btn.dataset.font);
      save();
    })
  );


  function buildPalettes() {
    colorsGrid.innerHTML = "";
    PALETTES.forEach((p, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.title = p.name;
      btn.setAttribute("aria-label", `لون ${p.name}`);
      btn.dataset.index = i;
      btn.className =
        "palette-option w-full aspect-square rounded-xl border-2 border-transparent transition-all hover:scale-110 flex items-center justify-center text-white";
      const c1 = p.primary || defaults.primary;
      const c2 = p.secondary || defaults.secondary;
      btn.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
      btn.innerHTML = '<i class="fa-solid fa-check opacity-0 transition-opacity" aria-hidden="true"></i>';
      btn.addEventListener("click", () => {
        applyPalette(i);
        save();
      });
      colorsGrid.appendChild(btn);
    });
  }

  function applyPalette(i) {
    const p = PALETTES[i];
    ["primary", "secondary", "accent"].forEach((name) => {
      if (p[name]) html.style.setProperty(`--color-${name}`, p[name]);
      else html.style.removeProperty(`--color-${name}`);
    });
    if (metaTheme) metaTheme.setAttribute("content", p.primary || defaults.primary);

    $$(".palette-option", colorsGrid).forEach((btn, idx) => {
      const active = idx === i;
      btn.classList.toggle("border-slate-900", active);
      btn.classList.toggle("dark:border-white", active);
      btn.classList.toggle("scale-110", active);
      $("i", btn).classList.toggle("opacity-0", !active);
      $("i", btn).classList.toggle("opacity-100", active);
    });
    state.palette = i;
  }


  function save() {
    safeStorage.set(STORAGE_KEY, JSON.stringify(state));
  }

  function load() {
    try {
      const saved = JSON.parse(safeStorage.get(STORAGE_KEY));
      if (saved) state = { ...state, ...saved };
    } catch {}
    if (!FONTS[state.font]) state.font = DEFAULT_FONT;
    if (!PALETTES[state.palette]) state.palette = 0;
  }

  resetBtn.addEventListener("click", () => {
    safeStorage.remove(STORAGE_KEY);
    document.body.style.fontFamily = "";
    applyFont(DEFAULT_FONT);
    applyPalette(0);
  });

  buildPalettes();
  load();
  applyFont(state.font);
  applyPalette(state.palette);
})();


(function scrollToTop() {
  const btn = $("#scroll-to-top");
  const SHOW = ["opacity-100", "visible"];
  const HIDE = ["opacity-0", "invisible"];

  function toggle() {
    const show = window.scrollY > 400;
    btn.classList.remove(...(show ? HIDE : SHOW));
    btn.classList.add(...(show ? SHOW : HIDE));
  }

  window.addEventListener("scroll", toggle, { passive: true });
  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );
  toggle();
})();

(function customSelects() {
  const wrappers = $$(".custom-select-wrapper");

  function closeAll(except = null) {
    wrappers.forEach((w) => {
      if (w === except) return;
      $(".custom-options", w).classList.add("hidden");
      $(".custom-select", w).setAttribute("aria-expanded", "false");
      $(".fa-chevron-down", w).classList.remove("rotate-180");
    });
  }

  wrappers.forEach((wrapper) => {
    const select = $(".custom-select", wrapper);
    const options = $(".custom-options", wrapper);
    const label = $(".selected-text", wrapper);
    const arrow = $(".fa-chevron-down", wrapper);
    const items = $$(".custom-option", wrapper);

    const defaultText = label.textContent;

    function open() {
      closeAll(wrapper);
      options.classList.remove("hidden");
      select.setAttribute("aria-expanded", "true");
      arrow.classList.add("rotate-180");
    }
    function close() {
      options.classList.add("hidden");
      select.setAttribute("aria-expanded", "false");
      arrow.classList.remove("rotate-180");
    }
    const isOpen = () => !options.classList.contains("hidden");

    function choose(item) {
      const value = item.dataset.value;
      label.textContent = value;
      label.classList.remove("text-slate-500", "dark:text-slate-400");
      select.dataset.value = value;
      items.forEach((i) => i.setAttribute("aria-selected", String(i === item)));
      close();
    }

    select.addEventListener("click", (e) => {
      e.stopPropagation();
      isOpen() ? close() : open();
    });

    items.forEach((item) =>
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        choose(item);
      })
    );

    select.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        isOpen() ? close() : open();
      } else if (e.key === "Escape") {
        close();
      }
    });

    select.closest("form")?.addEventListener("reset", () => {
      label.textContent = defaultText;
      label.classList.add("text-slate-500", "dark:text-slate-400");
      delete select.dataset.value;
    });
  });

  document.addEventListener("click", () => closeAll());
})();