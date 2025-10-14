import { particlesCursor } from 'https://unpkg.com/threejs-toys@0.0.8/build/threejs-toys.module.cdn.min.js'

const baseColors = [0x00ff00, 0x0000ff, 0x00ffff, 0xffff00, 0x8000ff, 0xff8000];

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
  gpgpuSize: 512,
  colors: baseColors,
  color: baseColors[0],
  coordScale: 0.5,
  noiseIntensity: 0.001,
  noiseTimeCoeff: 0.0001,
  pointSize: 5,
  pointDecay: 0.0025,
  sleepRadiusX: 250,
  sleepRadiusY: 250,
  sleepTimeCoefX: 0.001,
  sleepTimeCoefY: 0.002
})

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
  pc.uniforms.uCoordScale.value = 0.001 + Math.random() * 2
  pc.uniforms.uNoiseIntensity.value = 0.0001 + Math.random() * 0.01
  pc.uniforms.uPointSize.value = 1 + Math.random() * 10
})
