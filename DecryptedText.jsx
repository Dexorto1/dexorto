import React, { useState, useEffect, useRef } from 'react';

const defaultCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+~|}{[]:;?><,./-=0123456789';

const DecryptedText = ({
  text = '',
  speed = 50,
  maxIterations = 15,
  characters = defaultCharacters,
  className = 'revealed',
  parentClassName = 'all-letters',
  encryptedClassName = 'encrypted',
  animateOn = 'hover', // 'hover', 'view', 'click'
  revealDirection = 'start', // 'start', 'end', 'center'
  clickMode = 'toggle',
  style = {}
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState(new Set());
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

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

  const triggerDecrypt = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsScrambling(true);

    const len = text.length;
    const revealOrder = getRevealOrder(len, revealDirection);
    const settled = new Set();
    let currentStep = 0;
    let iterationCount = 0;

    intervalRef.current = setInterval(() => {
      iterationCount++;

      // Progressively reveal indices
      const revealIndex = Math.min(
        Math.floor((iterationCount / maxIterations) * len),
        len
      );
      for (let i = 0; i < revealIndex; i++) {
        settled.add(revealOrder[i]);
      }

      setRevealedIndices(new Set(settled));

      const newChars = text.split('').map((origChar, idx) => {
        if (origChar === ' ' || origChar === '\n' || settled.has(idx)) {
          return origChar;
        }
        return characters[Math.floor(Math.random() * characters.length)];
      });

      setDisplayText(newChars.join(''));

      if (settled.size >= len) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsScrambling(false);
        setDisplayText(text);
      }
    }, speed);
  };

  useEffect(() => {
    if (animateOn === 'view') {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            triggerDecrypt();
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      if (containerRef.current) observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [animateOn]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (animateOn === 'hover') {
      triggerDecrypt();
    }
  };

  const handleClick = () => {
    if (animateOn === 'click') {
      triggerDecrypt();
    }
  };

  return (
    <span
      ref={containerRef}
      className={`decrypted-text-container ${parentClassName}`}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      style={{ display: 'inline-block', ...style }}
    >
      {displayText.split('').map((char, index) => {
        const isRevealed = revealedIndices.has(index) || !isScrambling;
        return (
          <span
            key={index}
            className={isRevealed ? className : encryptedClassName}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
};

export default DecryptedText;
