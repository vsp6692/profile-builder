// Progressive enhancement: every professional record is already in the HTML.
(() => {
  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let paused = reduced.matches || root.dataset.motion === "off";
  root.classList.add("js");
  const feedback = (message) => {
    $("feedback").textContent = message;
    clearTimeout(feedback.timer);
    feedback.timer = setTimeout(() => ($("feedback").textContent = ""), 3500);
  };
  function theme() {
    const dark = root.dataset.theme === "dark";
    $("theme").textContent = dark ? "Light ☀" : "Dark ◐";
    $("theme").setAttribute(
      "aria-label",
      `Switch to ${dark ? "light" : "dark"} theme`,
    );
    $("theme").setAttribute("aria-pressed", String(dark));
    document.querySelector('meta[name="theme-color"]').content = dark
      ? "#101520"
      : "#f8f9fc";
  }
  $("theme").addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("profile-theme", root.dataset.theme);
    } catch {}
    theme();
  });
  theme();
  function motion() {
    root.dataset.motion = paused ? "off" : "on";
    $("motion").textContent = paused ? "Enable motion" : "Pause motion";
    $("motion").setAttribute("aria-pressed", String(paused));
  }
  $("motion").addEventListener("click", () => {
    paused = !paused;
    motion();
  });
  reduced.addEventListener("change", (e) => {
    paused = e.matches;
    motion();
  });
  motion();
  function view(mode) {
    root.dataset.view = mode;
    document
      .querySelectorAll("[data-view-button]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.viewButton === mode)),
      );
    $("view-description").textContent =
      mode === "engineering"
        ? "The systems, the decisions, the details."
        : "The story, the leadership, the impact.";
  }
  document
    .querySelectorAll("[data-view-button]")
    .forEach((b) =>
      b.addEventListener("click", () => view(b.dataset.viewButton)),
    );
  // Direct links to technical content always reveal their destination.
  const revealHash = () => {
    const el = document.getElementById(location.hash.slice(1));
    if (el?.closest(".technical")) {
      view("engineering");
      requestAnimationFrame(() => el.scrollIntoView());
    }
  };
  addEventListener("hashchange", revealHash);
  revealHash();
  const menu = $("menu"),
    nav = $("nav");
  const closeMenu = () => {
    menu.setAttribute("aria-expanded", "false");
    nav.classList.remove("open");
  };
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("open", open);
  });
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) closeMenu();
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      closeMenu();
      menu.focus();
    }
  });
  document.querySelectorAll("[data-filter]").forEach((button) =>
    button.addEventListener("click", () => {
      let count = 0;
      document
        .querySelectorAll("[data-filter]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      document.querySelectorAll("[data-category]").forEach((card) => {
        card.hidden =
          button.dataset.filter !== "All" &&
          card.dataset.category !== button.dataset.filter;
        if (!card.hidden) count++;
      });
      $("project-count").textContent =
        `${count} project${count === 1 ? "" : "s"}`;
    }),
  );
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      feedback("Copied to clipboard.");
    } catch {
      feedback("Copy unavailable. Select and copy the visible text.");
    }
  }
  $("copy-email")?.addEventListener("click", () =>
    copy($("copy-email").dataset.email),
  );
  document
    .querySelectorAll("[data-copy]")
    .forEach((b) =>
      b.addEventListener("click", () => copy($(b.dataset.copy).textContent)),
    );
  $("contact-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    location.href = `mailto:${$("copy-email").dataset.email}?subject=${encodeURIComponent("Hello from " + f.get("name"))}&body=${encodeURIComponent(f.get("message") + "\n\n" + f.get("name") + " · " + f.get("email"))}`;
  });
  let ticking = false;
  const progress = () => {
    const max = root.scrollHeight - innerHeight;
    document.querySelector(".progress").style.transform =
      `scaleX(${max > 0 ? Math.max(0, Math.min(1, scrollY / max)) : 0})`;
    ticking = false;
  };
  addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(progress);
      }
    },
    { passive: true },
  );
  addEventListener("resize", progress);
  progress();
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.remove("waiting");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.06 },
    );
    document
      .querySelectorAll(
        ".section-heading,.metric,.career,.project,.architecture-card,.skill",
      )
      .forEach((el) => {
        el.classList.add("reveal", "waiting");
        observer.observe(el);
      });
    const active = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            nav.querySelectorAll("a").forEach((a) => {
              if (a.hash === "#" + e.target.id)
                a.setAttribute("aria-current", "location");
              else a.removeAttribute("aria-current");
            });
          }
        }),
      { rootMargin: "-10% 0px -65% 0px" },
    );
    document
      .querySelectorAll("main section[id]")
      .forEach((el) => active.observe(el));
    const counts = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          counts.unobserve(e.target);
          const el = e.target,
            target = Number(el.dataset.count),
            start = performance.now();
          function frame(now) {
            const p = paused ? 1 : Math.min(1, (now - start) / 900);
            el.textContent =
              (el.dataset.prefix || "") +
              Math.round(target * (1 - Math.pow(1 - p, 3))) +
              (el.dataset.suffix || "");
            if (p < 1) requestAnimationFrame(frame);
          }
          if (!paused) requestAnimationFrame(frame);
        }),
      { threshold: 0.8 },
    );
    document
      .querySelectorAll("[data-count]")
      .forEach((el) => counts.observe(el));
  }
  if (matchMedia("(hover:hover) and (pointer:fine)").matches) {
    document.querySelectorAll(".magnetic").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        if (paused) return;
        const r = b.getBoundingClientRect();
        b.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.06}px ${(e.clientY - r.top - r.height / 2) * 0.06}px`;
      });
      b.addEventListener("pointerleave", () => (b.style.translate = ""));
    });
  }
})();
