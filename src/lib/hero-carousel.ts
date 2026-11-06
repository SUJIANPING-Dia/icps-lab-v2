export function initHeroCarousel() {
  const slider = document.querySelector<HTMLElement>("#hero-slider");
  const images = Array.from(slider?.querySelectorAll<HTMLElement>(".slider-img") ?? []);
  const previous = slider?.querySelector<HTMLButtonElement>("#prev-btn");
  const next = slider?.querySelector<HTMLButtonElement>("#next-btn");
  const pause = slider?.querySelector<HTMLButtonElement>("#pause-btn");
  if (!slider || images.length < 2 || !pause) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let currentIndex = 0;
  let userPaused = reducedMotion.matches;
  let hovered = false;
  let focused = false;
  let timer: ReturnType<typeof setInterval> | undefined;

  const showImage = (index: number) => {
    currentIndex = (index + images.length) % images.length;
    images.forEach((image, imageIndex) => {
      const active = imageIndex === currentIndex;
      image.classList.toggle("opacity-100", active);
      image.classList.toggle("opacity-0", !active);
      image.setAttribute("aria-hidden", String(!active));
    });
  };

  const syncPlayback = () => {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
    pause.setAttribute("aria-pressed", String(userPaused));
    pause.textContent = userPaused ? pause.dataset.resumeLabel ?? "Resume" : pause.dataset.pauseLabel ?? "Pause";
    if (!userPaused && !hovered && !focused && !document.hidden) {
      timer = setInterval(() => showImage(currentIndex + 1), 6000);
    }
  };

  previous?.addEventListener("click", () => { showImage(currentIndex - 1); syncPlayback(); });
  next?.addEventListener("click", () => { showImage(currentIndex + 1); syncPlayback(); });
  pause.addEventListener("click", () => { userPaused = !userPaused; syncPlayback(); });
  slider.addEventListener("mouseenter", () => { hovered = true; syncPlayback(); });
  slider.addEventListener("mouseleave", () => { hovered = false; syncPlayback(); });
  slider.addEventListener("focusin", () => { focused = true; syncPlayback(); });
  slider.addEventListener("focusout", (event) => {
    focused = event.relatedTarget instanceof Node && slider.contains(event.relatedTarget);
    syncPlayback();
  });
  document.addEventListener("visibilitychange", syncPlayback);
  reducedMotion.addEventListener("change", () => { userPaused = reducedMotion.matches; syncPlayback(); });
  window.addEventListener("pagehide", () => { if (timer !== undefined) clearInterval(timer); }, { once: true });
  showImage(0);
  syncPlayback();
}
