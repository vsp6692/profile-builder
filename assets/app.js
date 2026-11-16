// Native scroll, native dialogs, and a small illustrated companion. No scroll hijacking.
(() => {
  const root = document.documentElement,
    $ = (id) => document.getElementById(id),
    media = matchMedia("(prefers-reduced-motion: reduce)");
  let paused = media.matches || root.dataset.motion === "off",
    lastScroll = scrollY,
    framePending = false,
    walkTimer,
    returnFocus = null;
  const scenes = [...document.querySelectorAll("[data-scene]")],
    traveler = $("traveler");
  const theme = () => {
    const dark = root.dataset.theme === "dark";
    $("theme-toggle").textContent = dark ? "Day ☀" : "Night ◐";
    $("theme-toggle").setAttribute(
      "aria-label",
      `${dark ? "Day" : "Night"}: switch to ${dark ? "light" : "dark"} theme`,
    );
    $("theme-toggle").setAttribute("aria-pressed", String(dark));
    document.querySelector('meta[name="theme-color"]').content =
      getComputedStyle(root).getPropertyValue("--scene-sky").trim();
  };
  $("theme-toggle").addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("profile-theme", root.dataset.theme);
    } catch {}
    theme();
  });
  theme();
  const motion = () => {
    root.dataset.motion = paused ? "off" : "on";
    $("motion-toggle").textContent = paused ? "Play motion" : "Pause motion";
    $("motion-toggle").setAttribute("aria-pressed", String(paused));
    if (paused) {
      clearTimeout(walkTimer);
      traveler.classList.remove("walking");
    }
    update();
  };
  $("motion-toggle").addEventListener("click", () => {
    paused = !paused;
    motion();
  });
  media.addEventListener("change", (event) => {
    paused = event.matches;
    motion();
  });
  const closeDialog = (dialog) => {
    dialog.close();
  };
  document.querySelectorAll("[data-open]").forEach((button) =>
    button.addEventListener("click", () => {
      const target = $(button.dataset.open);
      if (!target) return;
      returnFocus = button;
      target.showModal();
      document.body.classList.add("modal-open");
    }),
  );
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog
      .querySelector("[data-close]")
      .addEventListener("click", () => closeDialog(dialog));
    dialog.addEventListener("close", () => {
      document.body.classList.remove("modal-open");
      returnFocus?.focus({ preventScroll: true });
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (
          event.clientX < r.left ||
          event.clientX > r.right ||
          event.clientY < r.top ||
          event.clientY > r.bottom
        )
          closeDialog(dialog);
      }
    });
  });
  document.querySelectorAll("[data-map-link]").forEach((a) =>
    a.addEventListener("click", () => {
      a.closest("dialog").close();
    }),
  );
  let toastTimer;
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      $("feedback").textContent = "Copied. Let’s start a conversation.";
    } catch {
      $("feedback").textContent = "Please select and copy the visible text.";
    }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ($("feedback").textContent = ""), 3500);
  }
  $("copy-email")?.addEventListener("click", () =>
    copy($("copy-email").dataset.email),
  );
  document
    .querySelectorAll("[data-copy]")
    .forEach((b) =>
      b.addEventListener("click", () => copy($(b.dataset.copy).textContent)),
    );
  function update() {
    framePending = false;
    const max = root.scrollHeight - innerHeight,
      progress = max ? scrollY / max : 0;
    document.querySelector(".journey-progress span").style.transform =
      `scaleX(${Math.max(0, Math.min(1, progress))})`;
    let active = scenes[0];
    for (const scene of scenes)
      if (scene.getBoundingClientRect().top < innerHeight * 0.5) active = scene;
    const index = scenes.indexOf(active),
      local = (scrollY - active.offsetTop) / Math.max(1, active.offsetHeight);
    $("current-stop").textContent =
      String(index).padStart(2, "0") +
      " / " +
      active.getAttribute("aria-label");
    traveler.classList.toggle("visible", index > 0);
    if (!paused) {
      const x =
        innerWidth *
        (0.12 + 0.64 * ((Math.sin((index + local) * 1.5) + 1) / 2));
      traveler.style.transform = `translate3d(${Math.min(innerWidth - 85, x)}px,${Math.sin(local * Math.PI) * -10}px,0)`;
      traveler.classList.toggle("back", scrollY < lastScroll);
    }
    active.style.setProperty(
      "--parallax",
      paused ? "0px" : `${Math.max(-18, Math.min(18, local * 32))}px`,
    );
    lastScroll = scrollY;
  }
  addEventListener(
    "scroll",
    () => {
      if (!framePending) {
        framePending = true;
        requestAnimationFrame(update);
      }
      if (!paused) {
        traveler.classList.add("walking");
        clearTimeout(walkTimer);
        walkTimer = setTimeout(() => traveler.classList.remove("walking"), 150);
      }
    },
    { passive: true },
  );
  addEventListener("resize", () => {
    if (!framePending) {
      framePending = true;
      requestAnimationFrame(update);
    }
  });
  motion();
  // Only the visible scene animates. Offscreen scenery stays still.
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) =>
          entry.target.classList.toggle("in-view", entry.isIntersecting),
        ),
      { rootMargin: "100px" },
    );
    scenes.forEach((scene) => observer.observe(scene));
  }
})();
