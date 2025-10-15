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

let pc = particlesCursor({
  el: document.getElementById('app'),
  gpgpuSize: 512, // меньше, чтобы частицы были плотнее
  colors: baseColors,
  color: baseColors[0],
  coordScale: 0.18, // плотнее к курсору
  noiseIntensity: 0.0005, // мягче движение
  noiseTimeCoeff: 0.00005, // плавнее
  pointSize: 7, // крупнее частицы
  pointDecay: 0.0015, // дольше "живут"
  sleepRadiusX: 1000,
  sleepRadiusY: 1001,
  sleepTimeCoefX: 0.0007 + Math.random() * 0.00001, // рандомное направление X
  sleepTimeCoefY: 0.0009 + Math.random() * 0.00004 // рандомное направление Y
})

// Плавно и рандомно меняем sleepRadiusX/Y для динамики
function animateSleepRadius() {
  if (pc.uniforms && pc.uniforms.uSleepRadiusX && pc.uniforms.uSleepRadiusY) {
    // Плавная синусоида + рандом
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



// Движение линии как у "дракона": плавно лететь к случайной цели
let lastMove = Date.now();
let autoMove = false;
let pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let target = { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight };

window.addEventListener('mousemove', (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  lastMove = Date.now();
  autoMove = false;
});

function pickNewTarget() {
  const margin = 40;
  // Случайная точка и случайный угол
  const angle = Math.random() * Math.PI * 2;
  const radius = 100 + Math.random() * (Math.min(window.innerWidth, window.innerHeight) / 2 - 100);
  const cx = margin + Math.random() * (window.innerWidth - margin * 2);
  const cy = margin + Math.random() * (window.innerHeight - margin * 2);
  target.x = cx + Math.cos(angle) * radius;
  target.y = cy + Math.sin(angle) * radius;
}

function animatePointer() {
  const now = Date.now();
  if (now - lastMove > 1200) {
    autoMove = true;
  }
  if (autoMove) {
    // Плавно летим к цели
    pointer.x += (target.x - pointer.x) * 0.04;
    pointer.y += (target.y - pointer.y) * 0.04;
    // Если близко к цели — новая цель
    if (Math.hypot(pointer.x - target.x, pointer.y - target.y) < 24) {
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
  pc.uniforms.uCoordScale.value = 0.001 + Math.random() * 2;
  pc.uniforms.uNoiseIntensity.value = 0.0001 + Math.random() * 0.01;
  pc.uniforms.uPointSize.value = 1 + Math.random() * 10;
})
