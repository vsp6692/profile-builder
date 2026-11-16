// Native scroll, native dialogs, and a small illustrated companion. No scroll hijacking.
(() => {
  const root = document.documentElement,
    $ = (id) => document.getElementById(id),
    media = matchMedia("(prefers-reduced-motion: reduce)");
  let paused = media.matches || root.dataset.motion === "off",
    lastScroll = scrollY,
    framePending = false,
    walkTimer;
  const dialogOrigins = new WeakMap();
  const dialogStack = [];
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
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-open]");
    if (!button) return;
    const target = $(button.dataset.open);
    if (!target) return;
    if (target.open) {
      // A guide result can lead back to the Quick Profile beneath it.
      for (const dialog of dialogStack
        .slice(dialogStack.indexOf(target) + 1)
        .reverse()) {
        dialogOrigins.set(dialog, target.querySelector("[data-close]"));
        dialog.close();
      }
      target.querySelector("[data-close]")?.focus();
      return;
    }
    dialogOrigins.set(target, button);
    target.showModal();
    dialogStack.push(target);
    target.scrollTop = 0;
    document.body.classList.add("modal-open");
  });
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog
      .querySelector("[data-close]")
      .addEventListener("click", () => closeDialog(dialog));
    dialog.addEventListener("close", () => {
      const index = dialogStack.indexOf(dialog);
      if (index !== -1) dialogStack.splice(index, 1);
      document.body.classList.toggle(
        "modal-open",
        Boolean(document.querySelector("dialog[open]")),
      );
      dialogOrigins.get(dialog)?.focus({ preventScroll: true });
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
  async function copy(text, button, message) {
    const feedback =
      button.closest("dialog")?.querySelector("[data-copy-status]") ||
      $("feedback");
    try {
      await navigator.clipboard.writeText(text);
      feedback.textContent = message;
    } catch {
      feedback.textContent = `Copy unavailable. Select and copy: ${text}`;
    }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (feedback.textContent = ""), 8000);
  }
  document
    .querySelectorAll("[data-email]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        copy(
          button.dataset.email,
          button,
          "Email copied. Ready for your introduction.",
        ),
      ),
    );
  document
    .querySelectorAll("[data-copy]")
    .forEach((b) =>
      b.addEventListener("click", () =>
        copy($(b.dataset.copy).textContent, b, "Engineering brief copied."),
      ),
    );
  document.querySelectorAll("[data-architecture]").forEach((explorer) => {
    const buttons = [...explorer.querySelectorAll("[data-node-target]")];
    const select = (button) => {
      buttons.forEach((node) => {
        const selected = node === button;
        node.setAttribute("aria-expanded", String(selected));
        $(node.dataset.nodeTarget).hidden = !selected;
      });
    };
    buttons.forEach((button, i) => {
      button.addEventListener("click", () => select(button));
      button.addEventListener("keydown", (event) => {
        const offset = {
          ArrowRight: 1,
          ArrowDown: 1,
          ArrowLeft: -1,
          ArrowUp: -1,
        }[event.key];
        if (offset === undefined && event.key !== "Home" && event.key !== "End")
          return;
        event.preventDefault();
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? buttons.length - 1
              : (i + offset + buttons.length) % buttons.length;
        select(buttons[next]);
        buttons[next].focus();
      });
    });
    if (buttons.length) select(buttons[0]);
  });
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
