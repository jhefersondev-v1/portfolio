/* Local Scroll World adaptation: scroll drives a continuous procedural camera.
 * Uses the skill's weighted segments and monotonic linger mapping. There are no
 * generated videos, external services, WebGL dependencies, or paid assets.
 * Content stays in semantic HTML; this canvas is a decorative enhancement.
 */
(function () {
  'use strict';

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const lingerEase = (value, linger) => {
    const x = clamp(value), amount = clamp(linger, 0, 0.6), center = x - 0.5;
    return (1 - amount) * x + amount * (4 * center * center * center + 0.5);
  };

  function mountScrollWorld(container, config = {}) {
    if (!container) return null;
    const canvas = container.querySelector('#worldCanvas, canvas');
    const context = canvas && canvas.getContext('2d');
    if (!context) return { destroy() {}, getState: () => ({ available: false, running: false }) };
    canvas.setAttribute('aria-hidden', 'true');
    const chapters = Array.from(container.querySelectorAll('.world-chapter'));
    const phases = config.phases || [
      { id: 'software', weight: 1, linger: 0.22 },
      { id: 'data', weight: 1, linger: 0.22 },
      { id: 'vision', weight: 1, linger: 0.18 }
    ];
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const totalWeight = phases.reduce((sum, phase) => sum + (phase.weight || 1), 0);
    let width = 1, height = 1, lastWindowWidth = 0, progress = 0, target = 0;
    let active = 0, frame = 0, renderedFrames = 0, visible = true, destroyed = false;
    let reducedMotion = motion.matches, previousTime = 0;

    function measure() {
      const box = canvas.getBoundingClientRect();
      width = Math.max(1, box.width); height = Math.max(1, box.height);
      const ratio = Math.min(window.devicePixelRatio || 1, window.innerWidth <= 760 ? 1.5 : 2);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      lastWindowWidth = window.innerWidth;
    }

    function readProgress() {
      if (chapters.length) {
        const focus = window.innerHeight * 0.57;
        let distance = 0;
        chapters.forEach((chapter, index) => {
          const box = chapter.getBoundingClientRect();
          const phase = phases[Math.min(index, phases.length - 1)];
          distance += clamp((focus - box.top) / Math.max(1, box.height)) * (phase.weight || 1);
        });
        target = clamp(distance / totalWeight);
      } else {
        const box = container.getBoundingClientRect();
        target = clamp(-box.top / Math.max(1, box.height - window.innerHeight));
      }
      let cursor = 0;
      active = phases.length - 1;
      for (let index = 0; index < phases.length; index++) {
        cursor += (phases[index].weight || 1) / totalWeight;
        if (target < cursor) { active = index; break; }
      }
      container.dataset.worldPhase = phases[active].id || String(active);
      container.style.setProperty('--world-progress', target.toFixed(4));
      chapters.forEach((chapter, index) => chapter.classList.toggle('is-current', index === active));
    }

    function mappedProgress(value) {
      let cursor = 0;
      for (const phase of phases) {
        const segment = (phase.weight || 1) / totalWeight;
        if (value <= cursor + segment) return cursor + lingerEase((value - cursor) / segment, phase.linger || 0) * segment;
        cursor += segment;
      }
      return 1;
    }

    function draw(value) {
      renderedFrames++;
      context.clearRect(0, 0, width, height);
      const travel = mappedProgress(value), cameraZ = travel * 3600;
      const cameraX = Math.sin(travel * Math.PI * 1.25) * 55;
      const focal = Math.min(width * 0.86, height * 1.35);
      const originX = width * (width < 600 ? 0.5 : 0.54), originY = height * 0.47;
      const glow = context.createRadialGradient(originX, originY, 5, originX, originY, width * 0.58);
      glow.addColorStop(0, 'rgba(63,139,210,.14)');
      glow.addColorStop(0.5, 'rgba(51,91,146,.035)'); glow.addColorStop(1, 'rgba(21,34,56,0)');
      context.fillStyle = glow; context.fillRect(0, 0, width, height);

      function project(point) {
        const depth = point[2] - cameraZ;
        if (depth < 85 || depth > 4800) return null;
        return { x: originX + (point[0] - cameraX) * focal / depth,
          y: originY + point[1] * focal / depth, depth,
          alpha: clamp((depth - 85) / 280) * clamp((4800 - depth) / 1200) };
      }
      function line(a, b, opacity = 0.36, color = '153,202,239', stroke = 1) {
        const start = project(a), end = project(b);
        if (!start || !end) return;
        context.strokeStyle = `rgba(${color},${Math.min(start.alpha, end.alpha) * opacity})`;
        context.lineWidth = stroke;
        context.beginPath(); context.moveTo(start.x, start.y); context.lineTo(end.x, end.y); context.stroke();
      }
      function dot(point, size = 2, opacity = 0.8) {
        const screen = project(point);
        if (!screen) return;
        context.fillStyle = `rgba(190,225,255,${screen.alpha * opacity})`;
        context.beginPath(); context.arc(screen.x, screen.y, Math.max(0.7, size * focal / screen.depth), 0, Math.PI * 2); context.fill();
      }
      // The same spatial corridor connects every zone; the camera never jumps or reverses.
      for (let index = 13; index >= 0; index--) {
        const z = 450 + index * 390;
        const span = 340, floor = 205;
        line([-span, floor, z], [span, floor, z], 0.14);
        if (index < 13) {
          line([-span, floor, z], [-span, floor, z + 390], 0.17);
          line([span, floor, z], [span, floor, z + 390], 0.17);
        }
        for (let lane = -2; lane <= 2; lane++) line([lane * 110, floor, z], [lane * 110, floor, z + 390], 0.06);
      }
      // SOFTWARE: architectural panes and connected layers, rendered back to front.
      for (let index = 5; index >= 0; index--) {
        const z = 650 + index * 260, x = index % 2 ? 95 : -105;
        const corners = [[x - 190, -130, z], [x + 190, -130, z], [x + 190, 130, z], [x - 190, 130, z]];
        corners.forEach((point, corner) => line(point, corners[(corner + 1) % 4], 0.25, '170,209,241'));
        line([x - 190, -85, z], [x + 190, -85, z], 0.19);
        for (let row = 0; row < 4; row++) {
          const y = -40 + row * 34;
          line([x - 145, y, z], [x - 45 + (row % 3) * 58, y, z], 0.26);
          dot([x - 165, y, z], 2.5, 0.8);
        }
        for (let button = 0; button < 3; button++) dot([x - 164 + button * 18, -108, z], 2, 0.55);
      }
      // DATA: one deterministic graph, rather than random particles changing per frame.
      const nodes = [];
      for (let index = 0; index < 34; index++) {
        const angle = index * 2.399963;
        nodes.push([Math.cos(angle) * (120 + index % 4 * 45), Math.sin(angle) * 155, 2250 + index % 7 * 145]);
      }
      nodes.forEach((node, index) => {
        line(node, nodes[(index + 5) % nodes.length], 0.2, '115,187,238');
        if (index % 3 === 0) line(node, nodes[(index + 11) % nodes.length], 0.13);
        dot(node, index % 5 === 0 ? 5 : 3, 0.85);
      });
      // VISION: a sequence of sensor rings with a shared vanishing point.
      for (let ring = 6; ring >= 0; ring--) {
        const z = 3600 + ring * 250, radius = 175 + ring * 5, count = 48;
        for (let index = 0; index < count; index++) {
          const a = index / count * Math.PI * 2, b = (index + 1) / count * Math.PI * 2;
          line([Math.cos(a) * radius, Math.sin(a) * radius, z], [Math.cos(b) * radius, Math.sin(b) * radius, z], ring % 2 ? 0.16 : 0.38);
        }
        [-1, 1].forEach(sign => {
          line([sign * 225, -225, z], [sign * 165, -225, z], 0.5);
          line([sign * 225, -225, z], [sign * 225, -165, z], 0.5);
          line([sign * 225, 225, z], [sign * 165, 225, z], 0.5);
          line([sign * 225, 225, z], [sign * 225, 165, z], 0.5);
        });
      }
    }

    function cancel() {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0; previousTime = 0;
    }
    function tick(time) {
      frame = 0;
      if (destroyed || !visible || document.hidden || reducedMotion) return;
      const elapsed = previousTime ? Math.min(48, time - previousTime) : 16.7;
      previousTime = time;
      progress += (target - progress) * (1 - Math.exp(-elapsed / 105));
      if (Math.abs(target - progress) < 0.0002) progress = target;
      draw(progress);
      if (progress !== target) frame = window.requestAnimationFrame(tick);
      else previousTime = 0;
    }
    function schedule() {
      if (!destroyed && visible && !document.hidden && !reducedMotion && !frame) frame = window.requestAnimationFrame(tick);
    }
    function onScroll() { readProgress(); schedule(); }
    function onResize() {
      if (touch && window.innerWidth === lastWindowWidth) return;
      measure(); readProgress();
      if (reducedMotion) draw(0.13); else schedule();
    }
    function onMotion() {
      reducedMotion = motion.matches; cancel(); readProgress();
      container.dataset.worldMotion = reducedMotion ? 'reduced' : 'full';
      if (reducedMotion) { progress = target; draw(0.13); } else schedule();
    }
    function onVisibility() { if (document.hidden) cancel(); else { readProgress(); schedule(); } }
    const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) { readProgress(); schedule(); } else cancel();
    }, { rootMargin: '100px' }) : null;

    measure(); readProgress(); draw(reducedMotion ? 0.13 : target); progress = target;
    container.dataset.worldMotion = reducedMotion ? 'reduced' : 'full';
    container.classList.add('world-ready');
    if (observer) observer.observe(container);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    motion.addEventListener('change', onMotion);

    return {
      getState: () => ({ available: true, progress, target, active, renderedFrames, reducedMotion, running: !!frame, visible }),
      destroy() {
        destroyed = true; cancel(); if (observer) observer.disconnect();
        window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize);
        window.removeEventListener('orientationchange', onResize); document.removeEventListener('visibilitychange', onVisibility);
        motion.removeEventListener('change', onMotion); container.classList.remove('world-ready');
      }
    };
  }

  window.mountScrollWorld = mountScrollWorld;
  function initialize() {
    const container = document.getElementById('portfolioWorld');
    if (container && !window.portfolioWorld) window.portfolioWorld = mountScrollWorld(container);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
