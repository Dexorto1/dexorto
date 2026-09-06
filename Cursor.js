/**
 * Custom Interactive Cursor & Dynamic Background Integration
 * - Smooth lerp tracking for cursor ring
 * - Dynamic scaling/pulsing on interactive elements (links, buttons, inputs, cards)
 * - Controls background ambient spotlight lighting layer
 */
export function initCustomCursor() {
  // Gracefully disable custom cursor on touch/coarse pointer devices
  if (window.matchMedia('(pointer: coarse)').matches) {
    return;
  }

  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  const ambientBg = document.getElementById('cursor-ambient-bg');

  if (!dot || !ring) return;

  let mouseX = -200;
  let mouseY = -200;
  let ringX = -200;
  let ringY = -200;
  let isHovering = false;
  let isCardHovering = false;
  let isVisible = false;
  let isDown = false;

  // Smoothing interpolation helper
  const lerp = (start, end, factor) => start + (end - start) * factor;

  const onMouseMove = (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!isVisible) {
      isVisible = true;
      dot.style.opacity = '1';
      ring.style.opacity = '1';
      if (ambientBg) ambientBg.classList.add('active');
    }

    // Direct dot positioning for instantaneous tactile feedback
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)${
      isHovering ? ' scale(1.4)' : isDown ? ' scale(0.6)' : ''
    }`;

    // Update dynamic background lighting coordinates
    if (ambientBg) {
      ambientBg.style.setProperty('--cursor-client-x', `${mouseX}px`);
      ambientBg.style.setProperty('--cursor-client-y', `${mouseY}px`);
    }
  };

  const onMouseDown = () => {
    isDown = true;
    ring.classList.add('cursor-active');
    dot.classList.add('cursor-active');
    if (ambientBg) {
      ambientBg.classList.remove('pulse');
      void ambientBg.offsetWidth; // Trigger reflow for animation restart
      ambientBg.classList.add('pulse');
    }
  };

  const onMouseUp = () => {
    isDown = false;
    ring.classList.remove('cursor-active');
    dot.classList.remove('cursor-active');
  };

  const onMouseLeave = () => {
    isVisible = false;
    dot.style.opacity = '0';
    ring.style.opacity = '0';
    if (ambientBg) ambientBg.classList.remove('active');
  };

  const onMouseEnter = () => {
    isVisible = true;
    dot.style.opacity = '1';
    ring.style.opacity = '1';
    if (ambientBg) ambientBg.classList.add('active');
  };

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  document.addEventListener('mouseleave', onMouseLeave);
  document.addEventListener('mouseenter', onMouseEnter);

  // Bind interactive elements for cursor transformation
  const setupHoverTargets = () => {
    const clickableSelectors = 'a, button, input, textarea, .pill, [role="button"], .header-link, .scroll-cue';
    document.querySelectorAll(clickableSelectors).forEach((el) => {
      el.addEventListener('mouseenter', () => {
        isHovering = true;
        ring.classList.add('cursor-hover');
        dot.classList.add('cursor-hover');
      });
      el.addEventListener('mouseleave', () => {
        isHovering = false;
        ring.classList.remove('cursor-hover');
        dot.classList.remove('cursor-hover');
      });
    });

    const cardSelectors = '.custom-spotlight-card, .moment, .skill-card, .project-card';
    document.querySelectorAll(cardSelectors).forEach((card) => {
      card.addEventListener('mouseenter', () => {
        isCardHovering = true;
        ring.classList.add('cursor-card-hover');
      });
      card.addEventListener('mouseleave', () => {
        isCardHovering = false;
        ring.classList.remove('cursor-card-hover');
      });
    });
  };

  setupHoverTargets();

  // Animation render loop for smooth trailing follower ring
  let animId;
  const render = () => {
    ringX = lerp(ringX, mouseX, 0.18);
    ringY = lerp(ringY, mouseY, 0.18);

    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)${
      isCardHovering ? '' : isDown ? ' scale(0.75)' : ''
    }`;

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);

  return {
    destroy: () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      cancelAnimationFrame(animId);
    }
  };
}

export default initCustomCursor;
