const scene = document.querySelector('.experience');
const phaseTabs = [...document.querySelectorAll('[role="tab"]')];
const descriptions = [
  ['Listen beyond what you can see.', 'Echo is an attachable microphone being developed to pick up distant animal sounds in the field.'],
  ['Give the sound more meaning.', 'We plan to use AI, supported by carefully labelled and quality-checked R&D data, to help distinguish relevant animal calls from background noise.'],
  ['A glance. A clearer direction.', 'Chrono is a wearable concept designed to translate directional information into simple LED cues. Explore a simulated direction using the slider.'],
];
let currentPhase = 0;
function selectPhase(index, focus = false) {
  currentPhase = index;
  scene.dataset.phase = String(index);
  phaseTabs.forEach((tab, i) => {
    tab.setAttribute('aria-selected', String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
  });
  document.querySelector('#phase-panel').setAttribute('aria-labelledby', `phase-${index}`);
  document.querySelector('#phase-title').textContent = descriptions[index][0];
  document.querySelector('#phase-description').textContent = descriptions[index][1];
  if (focus) phaseTabs[index].focus();
  drawWave(elapsed / 1000);
}
phaseTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectPhase(index));
  tab.addEventListener('keydown', event => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % 3;
    else if (event.key === 'ArrowLeft') next = (index + 2) % 3;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = 2;
    else return;
    event.preventDefault(); selectPhase(next, true);
  });
});
const slider = document.querySelector('#direction-range');
const directions = ['North', 'North-east', 'East', 'South-east', 'South', 'South-west', 'West', 'North-west'];
const shortDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
function updateDirection() {
  const angle = Number(slider.value);
  const index = Math.round(angle / 45) % 8;
  document.querySelector('#scene-needle').setAttribute('transform', `rotate(${angle})`);
  document.querySelector('#direction-output').textContent = `${angle}° · ${directions[index]}`;
  document.querySelector('.scene-bearing').textContent = `${angle}° / ${shortDirections[index]}`;
  slider.setAttribute('aria-valuetext', `${angle} degrees, ${directions[index]}`);
}
slider.addEventListener('input', updateDirection);
updateDirection();

const wave = document.querySelector('#sound-wave');
const backWave = document.querySelector('#sound-wave-back');
const pulse = document.querySelector('#signal-pulse');
const motion = document.querySelector('#signal-motion');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
let paused = preference.matches;
let inView = true;
let frame = null;
let lastFrame = null;
let elapsed = 0;
function drawWave(time) {
  const segments = 140;
  const front = [], back = [];
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const x = 150 + u * 650;
    const envelope = Math.sin(Math.PI * u) ** 2;
    const phase = u * 35 - time * 1.15;
    const amplitude = currentPhase === 1 ? 55 : currentPhase === 2 ? 32 : 90;
    const y = 230 + Math.sin(phase) * envelope * amplitude;
    const y2 = 230 + Math.sin(phase + .6) * envelope * amplitude * .65;
    front.push(`${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`);
    back.push(`${i ? 'L' : 'M'}${x.toFixed(1)},${y2.toFixed(1)}`);
  }
  wave.setAttribute('d', front.join(' '));
  backWave.setAttribute('d', back.join(' '));
  const u = (time * .12) % 1;
  pulse.setAttribute('cx', (150 + u * 650).toFixed(1));
  pulse.setAttribute('cy', (230 + Math.sin(u * 35 - time * 1.15) * Math.sin(Math.PI * u) ** 2 * (currentPhase === 1 ? 55 : currentPhase === 2 ? 32 : 90)).toFixed(1));
}
function tick(time) {
  if (lastFrame !== null) elapsed += time - lastFrame;
  lastFrame = time;
  drawWave(elapsed / 1000);
  frame = requestAnimationFrame(tick);
}
function updateMotion() {
  cancelAnimationFrame(frame); frame = null; lastFrame = null;
  motion.setAttribute('aria-pressed', String(paused));
  motion.textContent = paused ? 'Play animation' : 'Pause animation';
  scene.dataset.motionState = paused ? 'paused' : !inView ? 'offscreen' : document.hidden ? 'hidden' : 'running';
  if (!paused && inView && !document.hidden) frame = requestAnimationFrame(tick);
}
motion.addEventListener('click', () => { paused = !paused; updateMotion(); });
preference.addEventListener('change', event => { paused = event.matches; updateMotion(); });
document.addEventListener('visibilitychange', updateMotion);
new IntersectionObserver(entries => { inView = entries[0].isIntersecting; updateMotion(); }).observe(scene);
drawWave(0);
updateMotion();
