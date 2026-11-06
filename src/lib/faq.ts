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

  const setOpen = (item: HTMLElement, open: boolean) => {
    item.classList.toggle("is-open", open);
    item.querySelector(".faq-btn")?.setAttribute("aria-expanded", String(open));
    const answer = item.querySelector<HTMLElement>(".faq-answer-content");
    if (answer) answer.hidden = !open;
  };

  const updateGroupButton = (group: HTMLElement) => {
    const button = group.querySelector<HTMLButtonElement>(".open-all-btn");
    const items = Array.from(group.querySelectorAll<HTMLElement>(".faq-item:not(.hidden)"));
    const allOpen = items.length > 0 && items.every(item => item.classList.contains("is-open"));
    if (!button) return;
    button.setAttribute("aria-expanded", String(allOpen));
    if (button.firstChild) button.firstChild.textContent = english
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
      if (group.id !== id) group.querySelectorAll<HTMLElement>(".faq-item").forEach(item => setOpen(item, false));
      updateGroupButton(group);
    });
  };

  function resetSearch(focus = true) {
    if (input) input.value = "";
    clear?.classList.add("hidden");
    searchState?.classList.add("hidden");
    noResults?.classList.add("hidden");
    sidebar?.classList.remove("opacity-60");
    document.querySelectorAll<HTMLElement>(".faq-item").forEach(item => {
      item.classList.remove("hidden");
      setOpen(item, false);
    });
    switchCategory(activeCategory);
    if (focus) input?.focus();
  }

  tabs.forEach(tab => tab.addEventListener("click", () => {
    if (input?.value.trim()) resetSearch(false);
    if (tab.dataset.target) switchCategory(tab.dataset.target);
    document.querySelector("main")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }));

  document.querySelectorAll<HTMLButtonElement>(".faq-btn").forEach(button => button.addEventListener("click", () => {
    const item = button.closest<HTMLElement>(".faq-item");
    const group = button.closest<HTMLElement>(".faq-category-group");
    if (!item || !group) return;
    const open = !item.classList.contains("is-open");
    group.querySelectorAll<HTMLElement>(".faq-item").forEach(other => setOpen(other, other === item && open));
    updateGroupButton(group);
  }));

  document.querySelectorAll<HTMLButtonElement>(".open-all-btn").forEach(button => button.addEventListener("click", () => {
    const group = document.getElementById(button.dataset.group ?? "");
    if (!group) return;
    const items = Array.from(group.querySelectorAll<HTMLElement>(".faq-item:not(.hidden)"));
    const open = items.some(item => !item.classList.contains("is-open"));
    items.forEach(item => setOpen(item, open));
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
      group.querySelectorAll<HTMLElement>(".faq-item").forEach(item => {
        const matched = (item.dataset.question ?? "").includes(term) || (item.dataset.answer ?? "").includes(term);
        item.classList.toggle("hidden", !matched);
        setOpen(item, false);
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
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); currentObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -50px 0px" });
  document.querySelectorAll("[data-reveal]").forEach(element => observer.observe(element));
}
