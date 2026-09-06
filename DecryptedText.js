const defaultCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+~|}{[]:;?><,./-=0123456789';

const getRevealOrder = (len, dir) => {
  const indices = Array.from({ length: len }, (_, i) => i);
  if (dir === 'end') {
    return indices.reverse();
  }
  if (dir === 'center') {
    const mid = Math.floor(len / 2);
    const order = [];
    for (let i = 0; i <= mid; i++) {
      if (mid + i < len) order.push(mid + i);
      if (i > 0 && mid - i >= 0) order.push(mid - i);
    }
    return order;
  }
  return indices;
};

/**
 * Initializes DecryptedText animation on a target DOM element.
 */
export function initDecryptedText(element, options = {}) {
  if (!element) return null;

  const originalHTML = element.innerHTML;
  const originalText = options.text || element.innerText.trim();
  const speed = options.speed || 40;
  const maxIterations = options.maxIterations || 18;
  const characters = options.characters || defaultCharacters;
  const revealDirection = options.revealDirection || 'start';
  const animateOn = options.animateOn || 'view'; // 'view', 'hover', 'both'
  const className = options.className || 'revealed';
  const encryptedClassName = options.encryptedClassName || 'encrypted';

  let isRunning = false;
  let hasRun = false;
  let timer = null;

  const runDecryption = () => {
    if (hasRun && animateOn === 'view') return;
    hasRun = true;
    if (isRunning) clearInterval(timer);
    isRunning = true;

    const len = originalText.length;
    const revealOrder = getRevealOrder(len, revealDirection);
    const settled = new Set();
    let iteration = 0;

    timer = setInterval(() => {
      iteration++;
      const revealCount = Math.min(
        Math.floor((iteration / maxIterations) * len),
        len
      );

      for (let i = 0; i < revealCount; i++) {
        settled.add(revealOrder[i]);
      }

      // Build scrambled display
      const outputHTML = originalText
        .split('')
        .map((char, index) => {
          if (char === ' ') return ' ';
          if (char === '\n') return '<br />';

          if (settled.has(index)) {
            return `<span class="${className}">${char}</span>`;
          }

          const randChar = characters[Math.floor(Math.random() * characters.length)];
          return `<span class="${encryptedClassName}">${randChar}</span>`;
        })
        .join('');

      element.innerHTML = outputHTML;

      if (settled.size >= len) {
        clearInterval(timer);
        timer = null;
        isRunning = false;
        // Restore original HTML (retaining <em> or <strong> markup cleanly)
        element.innerHTML = originalHTML;
      }
    }, speed);
  };

  if (animateOn === 'view' || animateOn === 'both') {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          runDecryption();
          if (animateOn !== 'both') observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(element);
  }

  if (animateOn === 'hover' || animateOn === 'both') {
    element.addEventListener('mouseenter', () => {
      if (!isRunning) runDecryption();
    });
  }

  return {
    trigger: runDecryption,
    destroy: () => {
      if (timer) clearInterval(timer);
      element.innerHTML = originalHTML;
    }
  };
}

export default initDecryptedText;
