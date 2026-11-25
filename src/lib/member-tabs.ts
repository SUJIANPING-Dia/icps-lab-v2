export function initMemberTabs() {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(".tab-btn"));
  const defaultTab = buttons.find(button => button.getAttribute("aria-selected") === "true");
  if (!defaultTab) return;

  function selectTab(selected: HTMLButtonElement) {
    for (const button of buttons) {
      const active = button === selected;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
      button.classList.toggle("tab-active-style", active);
      button.classList.toggle("text-blue-700", active);
      button.classList.toggle("border-blue-700", active);
      button.classList.toggle("text-slate-500", !active);
      button.classList.toggle("border-transparent", !active);
      const badge = button.querySelector("span");
      badge?.classList.toggle("bg-blue-100", active);
      badge?.classList.toggle("text-blue-700", active);
      badge?.classList.toggle("bg-slate-100", !active);
      badge?.classList.toggle("text-slate-500", !active);
      const panel = document.getElementById(button.dataset.target ?? "");
      if (panel) {
        panel.hidden = !active;
        panel.classList.toggle("tab-active", active);
      }
    }
  }

  const tabForHash = () => buttons.find(button => button.dataset.target === window.location.hash.slice(1));
  const restoreFragment = () => {
    const selected = tabForHash();
    if (selected) {
      selectTab(selected);
      document.getElementById(selected.dataset.target ?? "")?.scrollIntoView({ block: "start", behavior: "instant" });
    } else if (!window.location.hash) {
      selectTab(defaultTab);
    }
  };

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => {
      selectTab(button);
      const hash = "#" + button.dataset.target;
      if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    });
    button.addEventListener("keydown", event => {
      let next: number;
      switch (event.key) {
        case "ArrowRight": next = (index + 1) % buttons.length; break;
        case "ArrowLeft": next = (index + buttons.length - 1) % buttons.length; break;
        case "Home": next = 0; break;
        case "End": next = buttons.length - 1; break;
        default: return;
      }
      event.preventDefault();
      buttons[next].click();
      buttons[next].focus();
      buttons[next].scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  });

  // Reveal the destination before the browser follows the native fragment link.
  document.querySelectorAll<HTMLAnchorElement>('.quick-nav a[href^="#tab-"]').forEach(link => {
    link.addEventListener("click", event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const selected = buttons.find(button => button.dataset.target === link.hash.slice(1));
      if (selected) selectTab(selected);
    });
  });
  window.addEventListener("hashchange", restoreFragment);
  restoreFragment();

  const observer = new IntersectionObserver((entries, currentObserver) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("rv-visible");
        currentObserver.unobserve(entry.target);
      }
    }
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll("[data-rv]").forEach(element => observer.observe(element));
}
