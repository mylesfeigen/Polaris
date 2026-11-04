import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createRifle } from './rifle-model.js';

const section = document.querySelector('#technology');
const pin = section.querySelector('.reveal-pin');
const mount = document.querySelector('#reveal-stage');
const poster = document.querySelector('#reveal-poster');
const steps = [...document.querySelectorAll('.reveal-step')];
const panels = [...document.querySelectorAll('.reveal-panel')];
const motionButton = document.querySelector('#reveal-motion');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const FOLLOW_MS = 160;
const SETTLE_EPSILON = .001;
let staticMode = preference.matches;
let renderer, scene, camera, model;
let request = null, previousTime = 0;
let manualStep = 0, activeStep = -1;
let displayedProgress = null;
let snapNext = true, inView = true;
let captionAnimation;
let assemblies = [], poseTargets = [];
const cameraTarget = new THREE.Vector3();
const viewOffset = new THREE.Vector3(.2, 1.1, 15);

// Swap createRifle() for a grouped Echo/Chrono GLB and update these poses later.
const separated = { stock: [-.6, -.7, 0], barrel: [.75, .4, 0], optic: [0, 1.65, 0] };
const assembled = { stock: [0, 0, 0], barrel: [0, 0, 0], optic: [0, 0, 0] };
const poses = [
  { offsets: assembled, focus: null, zoom: 1, rotation: -.32 },
  { offsets: separated, focus: 'optic', zoom: 2.45, rotation: -.45 },
  { offsets: separated, focus: 'barrel', zoom: 1.7, rotation: -.27 },
  { offsets: separated, focus: 'stock', zoom: 1.65, rotation: -.22 },
  { offsets: assembled, focus: null, zoom: 1, rotation: -.32 },
];
// Zero velocity and acceleration at each end avoids sharp camera/part starts.
const smoother = value => value * value * value * (value * (value * 6 - 15) + 10);
const mix = (a, b, t) => a + (b - a) * t;
function setCaption(index, immediate = false) {
  if (index === activeStep) return;
  const hadCaption = activeStep >= 0;
  const currentPanel = panels[index];
  const captionless = currentPanel.hasAttribute('data-captionless');
  activeStep = index;
  captionAnimation?.cancel();
  section.dataset.step = String(index);
  section.dataset.captionless = String(captionless);
  panels.forEach((panel, i) => {
    const current = i === index && !captionless;
    panel.hidden = !current;
    panel.classList.toggle('is-current', current);
  });
  steps.forEach((step, i) => step.setAttribute('aria-current', i === index ? 'step' : 'false'));
  // Keep only one accessible caption at a time; a brief entrance softens the swap.
  if (!captionless && hadCaption && !immediate && !staticMode && !preference.matches && currentPanel.animate) {
    captionAnimation = currentPanel.animate([
      { opacity: .15, transform: 'translateY(6px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 280, easing: 'cubic-bezier(.22, 1, .36, 1)' });
  }
  if (!staticMode) section.dataset.scrollStep = String(index);
}
function progress() {
  if (staticMode) return manualStep;
  const bounds = section.getBoundingClientRect();
  const travel = section.offsetHeight - pin.offsetHeight;
  return THREE.MathUtils.clamp(-bounds.top / Math.max(1, travel), 0, 1) * (poses.length - 1);
}
function renderPose(value, immediate) {
  const i = Math.min(poses.length - 2, Math.floor(value));
  // Brief reading rests with long, eased travel between the five views.
  const t = smoother(THREE.MathUtils.clamp((value - i - .06) / .88, 0, 1));
  const a = poses[i], b = poses[i + 1];
  setCaption(Math.round(value), immediate);
  section.style.setProperty('--reveal-progress', String(value / (poses.length - 1)));
  mount.dataset.progress = value.toFixed(3);
  mount.dataset.zoom = mix(a.zoom, b.zoom, t).toFixed(3);
  mount.dataset.focus = poses[activeStep].focus || 'whole';
  if (!renderer || !model) return;
  for (const assembly of assemblies) {
    const { name, part, centre, materials } = assembly;
    const from = a.offsets[name], to = b.offsets[name];
    part.position.set(
      centre.x + mix(from[0], to[0], t),
      centre.y + mix(from[1], to[1], t),
      centre.z + mix(from[2], to[2], t),
    );
    const opacityA = !a.focus || a.focus === name ? 1 : .1;
    const opacityB = !b.focus || b.focus === name ? 1 : .1;
    const opacity = mix(opacityA, opacityB, t);
    if (opacity !== assembly.opacity) {
      assembly.opacity = opacity;
      for (const material of materials) {
        material.opacity = opacity;
        material.depthWrite = opacity > .5;
      }
    }
  }
  model.root.rotation.set(.04, mix(a.rotation, b.rotation, t), -.025);
  cameraTarget.copy(poseTargets[i]).lerp(poseTargets[i + 1], t);
  camera.position.copy(cameraTarget).add(viewOffset);
  camera.lookAt(cameraTarget);
  const zoom = mix(a.zoom, b.zoom, t);
  if (camera.zoom !== zoom) {
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
  }
  renderer.render(scene, camera);
}
function stop() {
  if (request !== null) cancelAnimationFrame(request);
  request = null;
  previousTime = 0;
  mount.dataset.motion = 'idle';
}
function draw(time) {
  request = null;
  if (document.hidden || !inView) { stop(); return; }
  const target = progress();
  const immediate = snapNext || staticMode || preference.matches || displayedProgress === null;
  const delta = previousTime ? Math.min(time - previousTime, 64) : 1000 / 60;
  snapNext = false;
  if (immediate) displayedProgress = target;
  else displayedProgress += (target - displayedProgress) * (1 - Math.exp(-delta / FOLLOW_MS));
  const settling = Math.abs(target - displayedProgress) > SETTLE_EPSILON;
  if (!settling) displayedProgress = target;
  mount.dataset.targetProgress = target.toFixed(3);
  mount.dataset.motion = settling ? 'settling' : 'idle';
  renderPose(displayedProgress, immediate);
  if (settling && !staticMode) {
    previousTime = time;
    request = requestAnimationFrame(draw);
  } else previousTime = 0;
}
function schedule(snap = false) {
  snapNext ||= snap;
  if (document.hidden || !inView || request !== null) return;
  request = requestAnimationFrame(draw);
}
function updateMode() {
  captionAnimation?.cancel();
  section.classList.toggle('reveal-static', staticMode);
  motionButton.setAttribute('aria-pressed', String(staticMode));
  motionButton.textContent = staticMode ? 'Enable scroll animation' : 'Use still views';
  const instruction = document.querySelector('#reveal-instruction');
  if (instruction) instruction.textContent = staticMode ? 'Select a part to explore' : 'Scroll to explore';
  schedule(true);
}
function scrollToStep(index, behavior = 'smooth') {
  const top = section.getBoundingClientRect().top + scrollY;
  const distance = section.offsetHeight - pin.offsetHeight;
  scrollTo({ top: top + distance * index / (poses.length - 1), behavior });
}
steps.forEach((button, index) => button.addEventListener('click', () => {
  manualStep = index;
  if (staticMode) schedule(true);
  else scrollToStep(index, preference.matches ? 'instant' : 'smooth');
}));
motionButton.addEventListener('click', () => {
  manualStep = Math.round(displayedProgress ?? progress());
  staticMode = !staticMode;
  updateMode();
  if (staticMode) section.scrollIntoView({ behavior: 'instant', block: 'start' });
  else scrollToStep(manualStep, 'instant');
});
preference.addEventListener('change', event => {
  manualStep = Math.round(displayedProgress ?? progress());
  staticMode = event.matches;
  updateMode();
});
addEventListener('scroll', () => schedule(), { passive: true });
addEventListener('resize', () => schedule(true), { passive: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { captionAnimation?.cancel(); stop(); }
  else schedule(true);
});
if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (inView) schedule(true);
    else { captionAnimation?.cancel(); stop(); }
  }, { rootMargin: '100px 0px' }).observe(section);
}

try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0xf3f2ef, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  mount.append(renderer.domElement);
  scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 1.1;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb6b6b6, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 3.5); key.position.set(-3, 7, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 2); rim.position.set(2, 3, -5); scene.add(rim);
  model = createRifle(); scene.add(model.root);
  assemblies = Object.entries(model.parts).map(([name, part]) => {
    const materials = new Set();
    part.traverse(child => {
      if (child.isMesh) (Array.isArray(child.material) ? child.material : [child.material]).forEach(material => materials.add(material));
    });
    return { name, part, centre: model.centres[name], materials, opacity: null };
  });
  poseTargets = poses.map(pose => {
    if (!pose.focus) return new THREE.Vector3(-.15, .15, 0);
    const point = model.centres[pose.focus].clone().add(new THREE.Vector3(...pose.offsets[pose.focus]));
    return point.applyEuler(new THREE.Euler(.04, pose.rotation, -.025));
  });
  camera = new THREE.OrthographicCamera(-5.5, 5.5, 3, -3, .1, 100);
  function resize() {
    if (!renderer) return;
    const width = mount.clientWidth, height = mount.clientHeight;
    const aspect = width / Math.max(height, 1);
    const halfWidth = 5.65;
    camera.left = -halfWidth; camera.right = halfWidth;
    camera.top = halfWidth / aspect; camera.bottom = -halfWidth / aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    schedule(true);
  }
  new ResizeObserver(resize).observe(mount);
  resize();
  poster.hidden = true;
  mount.dataset.renderState = 'ready';
  renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); fallback(); });
} catch { fallback(); }
function fallback() {
  renderer?.domElement.remove(); renderer = null;
  poster.hidden = false;
  mount.dataset.renderState = 'fallback';
  staticMode = true;
  motionButton.disabled = true;
  updateMode();
  motionButton.textContent = 'Still views';
}
updateMode();
