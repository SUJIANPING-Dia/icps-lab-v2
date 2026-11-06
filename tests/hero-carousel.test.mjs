import test from 'node:test';
import assert from 'node:assert/strict';
import { initHeroCarousel } from '../src/lib/hero-carousel.ts';

function fixture(reduced, run) {
  const saved = Object.fromEntries(['document', 'window', 'setInterval', 'clearInterval'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const element = () => ({
    listeners: {}, attributes: {}, classes: new Set(), dataset: {}, textContent: '',
    addEventListener(name, fn) { this.listeners[name] = fn; },
    setAttribute(name, value) { this.attributes[name] = value; },
  });
  const images = [element(), element()];
  images.forEach(image => { image.classList = { toggle: (name, enabled) => enabled ? image.classes.add(name) : image.classes.delete(name) }; });
  const pause = element();
  pause.dataset = { resumeLabel: 'Resume', pauseLabel: 'Pause' };
  const next = element(), previous = element(), slider = element();
  slider.querySelectorAll = () => images;
  slider.querySelector = name => ({ '#pause-btn': pause, '#next-btn': next, '#prev-btn': previous })[name];
  const preference = { matches: reduced, listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; } };
  const doc = { ...element(), hidden: false, querySelector: () => slider };
  const timers = new Map();
  let sequence = 0;
  Object.assign(globalThis, {
    document: doc, window: { ...element(), matchMedia: () => preference },
    setInterval: fn => { const id = ++sequence; timers.set(id, fn); return id; },
    clearInterval: id => timers.delete(id),
  });
  try { initHeroCarousel(); run({ images, pause, next, slider, preference, doc, timers }); }
  finally {
    for (const [key, descriptor] of Object.entries(saved)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}

test('reduced motion starts paused while manual navigation remains usable', () => {
  fixture(true, ({ timers, pause, next, images }) => {
    assert.equal(timers.size, 0);
    assert.equal(pause.attributes['aria-pressed'], 'true');
    next.listeners.click();
    assert.equal(images[1].attributes['aria-hidden'], 'false');
    assert.equal(timers.size, 0);
  });
});

test('pause persists after hover and hidden-page interruptions', () => {
  fixture(false, ({ timers, pause, slider, doc }) => {
    assert.equal(timers.size, 1);
    slider.listeners.mouseenter();
    assert.equal(timers.size, 0);
    slider.listeners.mouseleave();
    assert.equal(timers.size, 1);
    pause.listeners.click();
    assert.equal(timers.size, 0);
    doc.hidden = true; doc.listeners.visibilitychange();
    doc.hidden = false; doc.listeners.visibilitychange();
    assert.equal(timers.size, 0);
    assert.equal(pause.textContent, 'Resume');
  });
});
