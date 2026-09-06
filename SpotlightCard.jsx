import React, { useRef, useState } from 'react';
import './SpotlightCard.css';

const SpotlightCard = ({
  children,
  className = '',
  spotlightColor = 'rgba(0, 229, 255, 0.2)'
}) => {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`custom-spotlight-card ${className}`}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <div
        className="spotlight-overlay"
        style={{
          opacity,
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
          transition: 'opacity 0.35s ease',
          background: `radial-gradient(circle 260px at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      <div style={{ position: 'relative', zIndex: 2, height: '100%' }}>
        {children}
      </div>
    </div>
  );
};

export default SpotlightCard;
