export function initFaq() {
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>(".faq-tab-btn"));
  const groups = Array.from(document.querySelectorAll<HTMLElement>(".faq-category-group"));
  const input = document.querySelector<HTMLInputElement>("#faq-search-input");
  const clear = document.querySelector<HTMLButtonElement>("#clear-search");
  const reset = document.querySelector<HTMLButtonElement>("#search-reset-inline");
  const noResults = document.querySelector<HTMLElement>("#no-results-msg");
  const sidebar = document.querySelector<HTMLElement>("#faq-sidebar");
  const searchState = document.querySelector<HTMLElement>("#search-state");
  const count = document.querySelector<HTMLElement>("#search-count");
  const keyword = document.querySelector<HTMLElement>("#search-keyword");
  const english = document.documentElement.lang === "en";
  let activeCategory = "category-0";

  const updateGroupButton = (group: HTMLElement) => {
    const button = group.querySelector<HTMLButtonElement>(".open-all-btn");
    const items = Array.from(group.querySelectorAll<HTMLDetailsElement>(".faq-item:not(.hidden)"));
    const allOpen = items.length > 0 && items.every(item => item.open);
    if (!button) return;
    button.setAttribute("aria-expanded", String(allOpen));
    const label = button.querySelector(".open-all-label");
    if (label) label.textContent = english
      ? allOpen ? "Collapse This Category" : "Expand This Category"
      : allOpen ? "收合本分類" : "展開本分類";
  };

  const switchCategory = (id: string) => {
    activeCategory = id;
    tabs.forEach(tab => {
      const active = tab.dataset.target === id;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-pressed", String(active));
    });
    groups.forEach(group => {
      group.classList.toggle("is-active", group.id === id);
      if (group.id !== id) group.querySelectorAll<HTMLDetailsElement>(".faq-item").forEach(item => { item.open = false; });
      updateGroupButton(group);
    });
  };

  function resetSearch(focus = true) {
    if (input) input.value = "";
    clear?.classList.add("hidden");
    searchState?.classList.add("hidden");
    noResults?.classList.add("hidden");
    sidebar?.classList.remove("opacity-60");
    document.querySelectorAll<HTMLDetailsElement>(".faq-item").forEach(item => {
      item.classList.remove("hidden");
      item.open = false;
    });
    switchCategory(activeCategory);
    if (focus) input?.focus();
  }

  tabs.forEach(tab => tab.addEventListener("click", () => {
    if (input?.value.trim()) resetSearch(false);
    if (tab.dataset.target) switchCategory(tab.dataset.target);
    document.querySelector("main")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }));

  document.querySelectorAll<HTMLElement>(".faq-btn").forEach(button => button.addEventListener("click", event => {
    const item = button.closest<HTMLDetailsElement>(".faq-item");
    const group = button.closest<HTMLElement>(".faq-category-group");
    if (!item || !group) return;
    event.preventDefault();
    const open = !item.open;
    group.querySelectorAll<HTMLDetailsElement>(".faq-item").forEach(other => { other.open = other === item && open; });
    updateGroupButton(group);
  }));

  document.querySelectorAll<HTMLButtonElement>(".open-all-btn").forEach(button => button.addEventListener("click", () => {
    const group = document.getElementById(button.dataset.group ?? "");
    if (!group) return;
    const items = Array.from(group.querySelectorAll<HTMLDetailsElement>(".faq-item:not(.hidden)"));
    const open = items.some(item => !item.open);
    items.forEach(item => { item.open = open; });
    updateGroupButton(group);
  }));

  input?.addEventListener("input", () => {
    const term = input.value.toLowerCase().trim();
    if (!term) { resetSearch(false); return; }
    let matches = 0;
    clear?.classList.remove("hidden");
    searchState?.classList.remove("hidden");
    sidebar?.classList.add("opacity-60");
    if (keyword) keyword.textContent = term;
    tabs.forEach(tab => tab.setAttribute("aria-pressed", "false"));
    groups.forEach(group => {
      let groupMatches = false;
      group.querySelectorAll<HTMLDetailsElement>(".faq-item").forEach(item => {
        const matched = (item.dataset.question ?? "").includes(term) || (item.dataset.answer ?? "").includes(term);
        item.classList.toggle("hidden", !matched);
        item.open = false;
        if (matched) { matches += 1; groupMatches = true; }
      });
      group.classList.toggle("is-active", groupMatches);
      updateGroupButton(group);
    });
    if (count) count.textContent = String(matches);
    noResults?.classList.toggle("hidden", matches > 0);
  });

  clear?.addEventListener("click", () => resetSearch());
  reset?.addEventListener("click", () => resetSearch());
  document.documentElement.classList.add("faq-enhanced");
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); currentObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -50px 0px" });
  document.querySelectorAll("[data-reveal]").forEach(element => observer.observe(element));
}
