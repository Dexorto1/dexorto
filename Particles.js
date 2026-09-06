import { Renderer, Camera, Geometry, Program, Mesh } from './ogl.js';

const defaultColors = ['#ffffff', '#ffffff', '#ffffff'];

const hexToRgb = (hex) => {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const int = parseInt(hex.slice(0, 6), 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  return [r, g, b];
};

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec4 random;
  attribute vec3 color;
  
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uSpread;
  uniform float uBaseSize;
  uniform float uSizeRandomness;
  
  varying vec4 vRandom;
  varying vec3 vColor;
  
  void main() {
    vRandom = random;
    vColor = color;
    
    vec3 pos = position * uSpread;
    pos.z *= 10.0;
    
    vec4 mPos = modelMatrix * vec4(pos, 1.0);
    float t = uTime;
    mPos.x += sin(t * random.z + 6.28 * random.w) * mix(0.1, 1.5, random.x);
    mPos.y += sin(t * random.y + 6.28 * random.x) * mix(0.1, 1.5, random.w);
    mPos.z += sin(t * random.w + 6.28 * random.y) * mix(0.1, 1.5, random.z);
    
    vec4 mvPos = viewMatrix * mPos;

    if (uSizeRandomness == 0.0) {
      gl_PointSize = uBaseSize;
    } else {
      gl_PointSize = (uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5))) / length(mvPos.xyz);
    }

    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  
  uniform float uTime;
  uniform float uAlphaParticles;
  varying vec4 vRandom;
  varying vec3 vColor;
  
  void main() {
    vec2 uv = gl_PointCoord.xy;
    float d = length(uv - vec2(0.5));
    
    if(uAlphaParticles < 0.5) {
      if(d > 0.5) {
        discard;
      }
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), 1.0);
    } else {
      float circle = smoothstep(0.5, 0.4, d) * 0.8;
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), circle);
    }
  }
`;

/**
 * Initializes interactive 3D WebGL Particles inside a container element.
 */
export function initParticles(container, options = {}) {
  if (!container) return null;

  const {
    particleCount = 200,
    particleSpread = 10,
    speed = 0.1,
    particleColors = ['#F97316'],
    moveParticlesOnHover = true,
    particleHoverFactor = 1,
    alphaParticles = false,
    particleBaseSize = 100,
    sizeRandomness = 1,
    cameraDistance = 20,
    disableRotation = false,
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  } = options;

  let renderer;
  try {
    renderer = new Renderer({
      dpr: pixelRatio,
      depth: false,
      alpha: true
    });
  } catch (err) {
    console.warn('[Particles] WebGL initialization failed:', err);
    return null;
  }

  const gl = renderer.gl;
  if (!gl) return null;

  container.appendChild(gl.canvas);
  gl.clearColor(0, 0, 0, 0);

  const camera = new Camera(gl, { fov: 15 });
  camera.position.set(0, 0, cameraDistance);

  const resize = () => {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setSize(width, height);
    camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
  };

  window.addEventListener('resize', resize, false);
  resize();

  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let clickImpulse = 0;

  const handleMouseMove = (e) => {
    const rect = container.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || window.innerHeight;
    const x = ((e.clientX - rect.left) / width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / height) * 2 - 1);
    mouse.targetX = x;
    mouse.targetY = y;
  };

  const handleMouseDown = () => {
    clickImpulse = 1.0;
  };

  if (moveParticlesOnHover) {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
  }

  const count = particleCount;
  const positions = new Float32Array(count * 3);
  const randoms = new Float32Array(count * 4);
  const colors = new Float32Array(count * 3);
  const palette = particleColors && particleColors.length > 0 ? particleColors : defaultColors;

  for (let i = 0; i < count; i++) {
    let x, y, z, len;
    do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      z = Math.random() * 2 - 1;
      len = x * x + y * y + z * z;
    } while (len > 1 || len === 0);

    const r = Math.cbrt(Math.random());
    positions.set([x * r, y * r, z * r], i * 3);
    randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);

    const col = hexToRgb(palette[Math.floor(Math.random() * palette.length)]);
    colors.set(col, i * 3);
  }

  const geometry = new Geometry(gl, {
    position: { size: 3, data: positions },
    random: { size: 4, data: randoms },
    color: { size: 3, data: colors }
  });

  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      uTime: { value: 0 },
      uSpread: { value: particleSpread },
      uBaseSize: { value: particleBaseSize * pixelRatio },
      uSizeRandomness: { value: sizeRandomness },
      uAlphaParticles: { value: alphaParticles ? 1 : 0 }
    },
    transparent: true,
    depthTest: false
  });

  const particles = new Mesh(gl, { mode: gl.POINTS, geometry, program });

  let animationFrameId;
  let lastTime = performance.now();
  let elapsed = 0;

  const update = (t) => {
    animationFrameId = requestAnimationFrame(update);
    const delta = t - lastTime;
    lastTime = t;
    elapsed += delta * speed;

    program.uniforms.uTime.value = elapsed * 0.001;

    // Smooth lerp mouse tracking
    mouse.x += (mouse.targetX - mouse.x) * 0.08;
    mouse.y += (mouse.targetY - mouse.y) * 0.08;
    clickImpulse *= 0.93;

    if (moveParticlesOnHover) {
      particles.position.x = -mouse.x * particleHoverFactor;
      particles.position.y = -mouse.y * particleHoverFactor;
      particles.position.z = Math.sin(elapsed * 0.001) * 0.15 + clickImpulse * 0.6;
    } else {
      particles.position.x = 0;
      particles.position.y = 0;
    }

    if (!disableRotation) {
      particles.rotation.x = Math.sin(elapsed * 0.0002) * 0.1 + (moveParticlesOnHover ? mouse.y * 0.2 : 0);
      particles.rotation.y = Math.cos(elapsed * 0.0005) * 0.15 - (moveParticlesOnHover ? mouse.x * 0.25 : 0);
      particles.rotation.z += 0.01 * speed;
    }

    renderer.render({ scene: particles, camera });
  };

  animationFrameId = requestAnimationFrame(update);

  return {
    destroy: () => {
      window.removeEventListener('resize', resize);
      if (moveParticlesOnHover) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mousedown', handleMouseDown);
      }
      cancelAnimationFrame(animationFrameId);
      if (container.contains(gl.canvas)) {
        container.removeChild(gl.canvas);
      }
    }
  };
}

export default initParticles;
