/* Runtime lifecycle checks without a browser. This does not validate visual output. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/scroll-world.js'), 'utf8');

function eventTarget(extra = {}) {
  const listeners = new Map();
  return Object.assign(extra, {
    addEventListener(name, fn) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(fn);
    },
    removeEventListener(name, fn) { listeners.get(name)?.delete(fn); },
    emit(name) { for (const fn of listeners.get(name) || []) fn(); },
    listenerCount() { return [...listeners.values()].reduce((sum, group) => sum + group.size, 0); }
  });
}

function fixture({ reduced = false, touch = false, width = 1440, canvasAvailable = true } = {}) {
  const motion = eventTarget({ matches: reduced });
  const callbacks = new Map();
  let nextId = 0, time = 0, scrollY = 0, measurements = 0, observer;
  const context = {
    setTransform() {}, clearRect() {}, fillRect() {}, beginPath() {}, moveTo() {},
    lineTo() {}, stroke() {}, arc() {}, fill() {},
    createRadialGradient: () => ({ addColorStop() {} })
  };
  const canvas = {
    getContext: () => canvasAvailable ? context : null,
    setAttribute() {},
    getBoundingClientRect() { measurements++; return { width: 600, height: 600 }; }
  };
  const classList = () => {
    const names = new Set();
    return { add: name => names.add(name), remove: name => names.delete(name),
      toggle(name, enabled) { enabled ? names.add(name) : names.delete(name); },
      contains: name => names.has(name) };
  };
  const chapters = Array.from({ length: 3 }, (_, index) => ({
    classList: classList(),
    getBoundingClientRect: () => ({ top: 1200 + index * 600 - scrollY, height: 600 })
  }));
  const container = {
    dataset: {}, style: { setProperty() {} }, classList: classList(),
    querySelector: () => canvas, querySelectorAll: () => chapters
  };
  const window = eventTarget({
    innerWidth: width, innerHeight: 800, devicePixelRatio: 3,
    matchMedia: query => query.includes('reduced-motion') ? motion : { matches: touch },
    requestAnimationFrame(fn) { const id = ++nextId; callbacks.set(id, fn); return id; },
    cancelAnimationFrame: id => callbacks.delete(id)
  });
  const document = eventTarget({ hidden: false, readyState: 'complete', getElementById: () => null });
  class IntersectionObserver {
    constructor(callback) { this.callback = callback; observer = this; }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  vm.runInNewContext(source, { window, document, IntersectionObserver });
  const api = window.mountScrollWorld(container);
  return {
    api, window, document, motion, container, canvas,
    get measurements() { return measurements; },
    get pending() { return callbacks.size; },
    scroll(value) { scrollY = value; window.emit('scroll'); },
    visible(value) { observer.callback([{ isIntersecting: value }]); },
    settle() {
      let count = 0;
      while (callbacks.size && count++ < 300) {
        const batch = [...callbacks.values()]; callbacks.clear(); time += 16.667;
        batch.forEach(callback => callback(time));
      }
      assert.equal(callbacks.size, 0, 'animation must stop after reaching its target');
      return count;
    }
  };
}

const run = fixture();
assert.equal(run.api.getState().available, true);
assert.equal(run.api.getState().running, false, 'initial static frame needs no idle rAF');
assert.equal(run.canvas.width, 1200, 'desktop DPR is capped at two');
let previous = 0;
for (let y = 744; y <= 2544; y += 30) {
  run.scroll(y); run.settle();
  const state = run.api.getState();
  assert.ok(state.progress >= previous, 'forward scroll must never reverse the camera');
  assert.ok(Math.abs(state.target - state.progress) < 0.0002);
  previous = state.progress;
}
assert.equal(run.api.getState().progress, 1, 'last section must complete');
assert.equal(run.container.dataset.worldPhase, 'vision');
for (const boundary of [1344, 1944]) {
  run.scroll(boundary - 0.1); run.settle(); const before = run.api.getState().target;
  run.scroll(boundary + 0.1); run.settle(); const after = run.api.getState().target;
  assert.ok(after > before && after - before < 0.001, 'section boundaries preserve continuous progress');
}
previous = run.api.getState().progress;
for (let y = 1900; y >= 700; y -= 60) {
  run.scroll(y); run.settle(); const current = run.api.getState().progress;
  assert.ok(current <= previous, 'reverse scrolling must reverse continuously'); previous = current;
}

run.scroll(1600);
assert.equal(run.pending, 1, 'scroll schedules only one frame');
run.visible(false);
assert.equal(run.pending, 0, 'leaving viewport cancels work immediately');
const stoppedFrames = run.api.getState().renderedFrames;
run.scroll(2000); run.settle();
assert.equal(run.api.getState().renderedFrames, stoppedFrames);
run.visible(true); run.settle();
assert.ok(run.api.getState().renderedFrames > stoppedFrames);

run.document.hidden = true; run.document.emit('visibilitychange');
run.scroll(2100); assert.equal(run.pending, 0, 'hidden tabs do not render');
run.document.hidden = false; run.document.emit('visibilitychange'); run.settle();
run.motion.matches = true; run.motion.emit('change');
const reducedFrames = run.api.getState().renderedFrames;
run.scroll(2300); run.settle();
assert.equal(run.api.getState().renderedFrames, reducedFrames, 'reduced motion remains static on scroll');
assert.equal(run.container.dataset.worldMotion, 'reduced');
run.motion.matches = false; run.motion.emit('change'); run.settle();
assert.equal(run.container.dataset.worldMotion, 'full');

run.api.destroy();
assert.equal(run.pending, 0);
assert.equal(run.window.listenerCount() + run.document.listenerCount() + run.motion.listenerCount(), 0);
assert.equal(run.container.classList.contains('world-ready'), false, 'destroy restores the CSS fallback');
run.scroll(1000); assert.equal(run.pending, 0);

const mobile = fixture({ width: 390, touch: true });
assert.equal(mobile.canvas.width, 900, 'mobile DPR is capped at 1.5');
const beforeResize = mobile.measurements;
mobile.window.innerHeight = 740; mobile.window.emit('resize');
assert.equal(mobile.measurements, beforeResize, 'URL-bar-only resize does not remeasure');
mobile.window.innerWidth = 844; mobile.window.emit('orientationchange');
assert.ok(mobile.measurements > beforeResize, 'orientation change recomposes the canvas');
mobile.settle(); mobile.api.destroy();

const initialReduced = fixture({ reduced: true });
assert.equal(initialReduced.pending, 0);
assert.equal(initialReduced.api.getState().renderedFrames, 1);
initialReduced.api.destroy();
const fallback = fixture({ canvasAvailable: false });
assert.equal(fallback.api.getState().available, false);
assert.equal(fallback.container.classList.contains('world-ready'), false);
fallback.api.destroy();
console.log('PASS: scroll direction and seam progress, settling, offscreen/hidden pause, motion preferences, cleanup, mobile resize, static fallback.');
