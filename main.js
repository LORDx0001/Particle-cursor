import { particlesCursor } from 'https://unpkg.com/threejs-toys@0.0.8/build/threejs-toys.module.cdn.min.js'

// Только синий и фиолетовый цвета
const baseColors = [0x0000ff, 0x191970, 0x483d8b, 0x6a5acd, 0x8a2be2, 0x8000ff, 0x4b0082];

function hexToRgb(hex) {
  return [
    (hex >> 16) & 0xff,
    (hex >> 8) & 0xff,
    hex & 0xff
  ];
}

function rgbToHex([r, g, b]) {
  return (r << 16) | (g << 8) | b;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// --- Адаптивные функции ---
function isMobile() {
  return window.innerWidth <= 600;
}
function isTablet() {
  return window.innerWidth > 600 && window.innerWidth <= 900;
}

// --- Создаём два хвоста ---
let pc = particlesCursor({
  el: document.getElementById('app'),
  gpgpuSize: window.innerWidth > 900 ? 600 : 256,
  colors: baseColors,
  color: baseColors[0],
  coordScale: window.innerWidth > 900 ? 0.18 : 0.25,
  noiseIntensity: 0.0005,
  noiseTimeCoeff: 0.00005,
  pointSize: window.innerWidth > 900 ? 6 : 4,
  pointDecay: 0.0009,
  sleepRadiusX: 1000,
  sleepRadiusY: 1001,
  sleepTimeCoefX: 0.0007 + Math.random() * 0.00001,
  sleepTimeCoefY: 0.0009 + Math.random() * 0.00004
})

let pc2 = particlesCursor({
  el: document.getElementById('app'),
  gpgpuSize: window.innerWidth > 900 ? 256 : 128,
  colors: baseColors,
  color: baseColors[2],
  coordScale: window.innerWidth > 900 ? 0.22 : 0.3,
  noiseIntensity: 0.001,
  noiseTimeCoeff: 0.00008,
  pointSize: window.innerWidth > 900 ? 5 : 3,
  pointDecay: 0.002,
  sleepRadiusX: 900,
  sleepRadiusY: 900,
  sleepTimeCoefX: 0.0008 + Math.random() * 0.00001,
  sleepTimeCoefY: 0.001 + Math.random() * 0.00004
});

// --- Адаптивная подстройка при изменении размера окна ---
function resizeParticles() {
  pc.uniforms.uCoordScale.value = window.innerWidth > 900 ? 0.18 : 0.25;
  pc.uniforms.uPointSize.value = window.innerWidth > 900 ? 7 : 4;
  pc2.uniforms.uCoordScale.value = window.innerWidth > 900 ? 0.22 : 0.3;
  pc2.uniforms.uPointSize.value = window.innerWidth > 900 ? 5 : 3;
}
window.addEventListener('resize', resizeParticles);

// --- Анимация sleepRadius только для первой линии ---
function animateSleepRadius() {
  if (pc.uniforms && pc.uniforms.uSleepRadiusX && pc.uniforms.uSleepRadiusY) {
    const t = performance.now() / 1000;
    const base = 120 + Math.sin(t * 0.7) * 80;
    const randX = base + Math.sin(t * 1.3 + Math.random()) * 60 + Math.random() * 40;
    const randY = base + Math.cos(t * 1.1 + Math.random()) * 60 + Math.random() * 40;
    pc.uniforms.uSleepRadiusX.value = randX;
    pc.uniforms.uSleepRadiusY.value = randY;
  }
  requestAnimationFrame(animateSleepRadius);
}
animateSleepRadius();

// --- Два указателя и цели ---
let lastMove = Date.now();
let autoMove = false;
let pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let target = { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight };

let pointer2 = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let target2 = { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight };

window.addEventListener('mousemove', (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  lastMove = Date.now();
  autoMove = false;
  // Смещение второй линии адаптивно
  let offset = 60;
  if (isMobile()) offset = 18;
  else if (isTablet()) offset = 32;
  pointer2.x = e.clientX + offset * Math.sin(Date.now()/400);
  pointer2.y = e.clientY + offset * Math.cos(Date.now()/400);
});

function pickNewTarget() {
  const angle = Math.random() * Math.PI * 2;
  // Радиус цели адаптивно: меньше и ближе к центру на мобильных
  let radiusBase = 40;
  if (isMobile()) radiusBase = 10;
  else if (isTablet()) radiusBase = 20;
  const maxRadius = Math.min(window.innerWidth, window.innerHeight) / 3;
  const radius = radiusBase + Math.random() * (maxRadius - radiusBase);
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  target.x = cx + Math.cos(angle) * radius;
  target.y = cy + Math.sin(angle) * radius;
}

function pickNewTarget2() {
  const angle = Math.random() * Math.PI * 2;
  let radiusBase = 50;
  if (isMobile()) radiusBase = 15;
  else if (isTablet()) radiusBase = 25;
  const maxRadius = Math.min(window.innerWidth, window.innerHeight) / 3;
  const radius = radiusBase + Math.random() * (maxRadius - radiusBase);
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  target2.x = cx + Math.cos(angle) * radius;
  target2.y = cy + Math.sin(angle) * radius;
}

function animatePointer() {
  const now = Date.now();
  if (now - lastMove > 1200) {
    autoMove = true;
  }
  // Медленнее на мобильных и планшетах
  let speed = 0.03;
  if (isMobile()) speed = 0.012;
  else if (isTablet()) speed = 0.018;
  if (autoMove) {
    pointer.x += (target.x - pointer.x) * speed;
    pointer.y += (target.y - pointer.y) * speed;
    if (Math.hypot(pointer.x - target.x, pointer.y - target.y) < 18) {
      pickNewTarget();
    }
  }
  if (pc.uniforms && pc.uniforms.uPointer) {
    pc.uniforms.uPointer.value.x = pointer.x;
    pc.uniforms.uPointer.value.y = pointer.y;
  }
  requestAnimationFrame(animatePointer);
}
animatePointer();

function animatePointer2() {
  let speed = 0.03;
  if (isMobile()) speed = 0.012;
  else if (isTablet()) speed = 0.018;
  const now = Date.now();
  if (now - lastMove > 1200) {
    pointer2.x += (target2.x - pointer2.x) * speed;
    pointer2.y += (target2.y - pointer2.y) * speed;
    if (Math.hypot(pointer2.x - target2.x, pointer2.y - target2.y) < 18) {
      pickNewTarget2();
    }
  }
  if (pc2.uniforms && pc2.uniforms.uPointer) {
    pc2.uniforms.uPointer.value.x = pointer2.x;
    pc2.uniforms.uPointer.value.y = pointer2.y;
  }
  requestAnimationFrame(animatePointer2);
}
animatePointer2();

// --- Цвета только для первой линии ---
let colorTargets = pc.uniforms.uColors.value.map((c, i) => {
  const hex = c.getHex();
  return {
    current: hexToRgb(hex),
    target: hexToRgb(baseColors[Math.floor(Math.random() * baseColors.length)]),
    obj: c
  };
});

function updateColorsLerp() {
  for (let i = 0; i < colorTargets.length; i++) {
    let c = colorTargets[i];
    if (c.current[0] === c.target[0] && c.current[1] === c.target[1] && c.current[2] === c.target[2]) {
      c.target = hexToRgb(baseColors[Math.floor(Math.random() * baseColors.length)]);
    }
    for (let j = 0; j < 3; j++) {
      c.current[j] = Math.round(lerp(c.current[j], c.target[j], 0.04));
    }
    if (c.obj && c.obj.setRGB) {
      c.obj.setRGB(c.current[0]/255, c.current[1]/255, c.current[2]/255);
    }
  }
  if (pc.uniforms && pc.uniforms.uColors && typeof pc.uniforms.uColors.needsUpdate !== 'undefined') {
    pc.uniforms.uColors.needsUpdate = true;
  }
  requestAnimationFrame(updateColorsLerp);
}
updateColorsLerp();

document.body.addEventListener('click', () => {
  colorTargets.forEach(c => c.target = hexToRgb(baseColors[Math.floor(Math.random() * baseColors.length)]));
  pc.uniforms.uCoordScale.value = window.innerWidth > 900 ? 0.18 : 0.25;
  pc.uniforms.uNoiseIntensity.value = 0.0001 + Math.random() * 0.01;
  pc.uniforms.uPointSize.value = window.innerWidth > 900 ? (1 + Math.random() * 10) : (1 + Math.random() * 5);
})