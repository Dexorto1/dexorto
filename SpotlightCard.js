/**
 * SpotlightCard component for interactive spotlight glow on hover.
 */
export function initSpotlightCard(element, options = {}) {
  if (!element) return;
  const spotlightColor = options.spotlightColor || 'rgba(0, 229, 255, 0.2)';
  const radius = options.radius || 280;

  element.style.setProperty('--spotlight-color', spotlightColor);
  element.style.setProperty('--spotlight-radius', `${radius}px`);

  const handleMouseMove = (e) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    element.style.setProperty('--mouse-x', `${x}px`);
    element.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseEnter = () => {
    element.classList.add('spotlight-active');
  };

  const handleMouseLeave = () => {
    element.classList.remove('spotlight-active');
  };

  element.addEventListener('mousemove', handleMouseMove, { passive: true });
  element.addEventListener('mouseenter', handleMouseEnter);
  element.addEventListener('mouseleave', handleMouseLeave);

  return {
    destroy: () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    }
  };
}

/**
 * Initializes all elements matching a selector with the Spotlight effect.
 */
export function initAllSpotlights(selector = '.custom-spotlight-card', options = {}) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => initSpotlightCard(el, options));
}

export default initSpotlightCard;
