import './site.js';
import './technology-story.js';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const stage = document.querySelector('#rifle-stage');
const poster = document.querySelector('#rifle-poster');
const toggle = document.querySelector('#rotation-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reducedMotion.matches;
let visible = true;
let contextAvailable = true;
let renderer;
let rifle;
let lastTime = 0;
let renderFrame;
// Adjustable art direction: one complete turn every 60 seconds.
const ROTATION_SECONDS = 60;

function updateControl() {
  if (!contextAvailable) return;
  toggle.setAttribute('aria-pressed', String(paused));
  toggle.setAttribute('aria-label', paused ? 'Play rifle rotation' : 'Pause rifle rotation');
  toggle.querySelector('.rotation-label').textContent = paused ? 'Play rotation' : 'Pause rotation';
  toggle.querySelector('.rotation-symbol').textContent = paused ? '▷' : 'Ⅱ';
}
function synchronizeMotion() {
  if (!renderer || !contextAvailable) return;
  lastTime = 0;
  renderer.setAnimationLoop(!paused && visible && !document.hidden ? renderFrame : null);
}
function showFallback() {
  contextAvailable = false;
  renderer?.setAnimationLoop(null);
  if (renderer) renderer.domElement.style.display = 'none';
  poster.hidden = false;
  stage.dataset.renderState = 'fallback';
  stage.setAttribute('aria-label', 'A static illustration of a black hunting rifle. Hunting context for Echo and Chrono, not a Polaris product.');
  toggle.disabled = true;
  toggle.querySelector('.rotation-symbol').textContent = '—';
  toggle.querySelector('.rotation-label').textContent = 'Static view';
  toggle.setAttribute('aria-label', 'Static rifle illustration');
}

try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0xffffff, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  stage.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  const camera = new THREE.OrthographicCamera(-6, 6, 3, -3, .1, 100);
  camera.position.set(.5, 2.4, 13);
  camera.lookAt(0, -.1, 0);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  scene.environmentIntensity = .85;
  room.dispose();
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb6b6b6, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 3.5);
  key.position.set(-3, 7, 5);
  key.castShadow = false;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -7, right: 7, top: 5, bottom: -5, near: .1, far: 30 });
  key.shadow.bias = -.0003;
  key.shadow.normalBias = .02;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 2);
  rim.position.set(2, 3, -5);
  scene.add(rim);

  const polymer = new THREE.MeshStandardMaterial({ color: 0x0b0c0d, roughness: .75, metalness: .08 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x151719, roughness: .31, metalness: .85 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x101010, roughness: .95 });
  const edge = new THREE.MeshStandardMaterial({ color: 0x303236, roughness: .4, metalness: .65 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x111a20, metalness: .6, roughness: .12 });

  rifle = new THREE.Group();
  scene.add(rifle);
  rifle.rotation.set(.02, -.28, .065);
  // Non-functional exterior artwork in arbitrary scene units; no internal parts.
  function mesh(geometry, material, x, y, z = 0) {
    const part = new THREE.Mesh(geometry, material);
    part.position.set(x, y, z);
    part.castShadow = true;
    part.receiveShadow = true;
    rifle.add(part);
    return part;
  }
  function cylinder(radiusStart, radiusEnd, length, x, y, z = 0, material = metal) {
    const part = mesh(new THREE.CylinderGeometry(radiusEnd, radiusStart, length, 48), material, x, y, z);
    part.rotation.z = -Math.PI / 2;
    return part;
  }
  function block(w, h, d, x, y, z = 0, material = metal) {
    return mesh(new THREE.BoxGeometry(w, h, d), material, x, y, z);
  }
  function contour(points, depth, material, bevel = .045) {
    const shape = new THREE.Shape();
    const roundness = .17;
    points.forEach((point, index) => {
      const previous = points[(index - 1 + points.length) % points.length];
      const next = points[(index + 1) % points.length];
      const before = point.map((value, axis) => value + (previous[axis] - value) * roundness);
      const after = point.map((value, axis) => value + (next[axis] - value) * roundness);
      if (index === 0) shape.moveTo(...before); else shape.lineTo(...before);
      shape.quadraticCurveTo(...point, ...after);
    });
    shape.closePath();
    return mesh(new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: true, bevelThickness: bevel,
      bevelSize: bevel, bevelSegments: 5, steps: 1, curveSegments: 24,
    }), material, 0, 0, -depth / 2);
  }
  contour([
    [-4.35, -.08], [-3.85, -.04], [-3.20, .03], [-2.65, -.02],
    [-2.12, -.13], [-1.72, -.06], [-1.25, .07], [.65, .07],
    [1.14, .04], [1.32, -.04], [1.25, -.20], [.35, -.26],
    [-.72, -.30], [-1.26, -.28], [-1.63, -.92], [-1.92, -.85],
    [-1.78, -.33], [-2.22, -.31], [-3.02, -.53], [-4.31, -.68],
  ], .34, polymer, .055);
  contour([[-4.37,-.07],[-4.28,-.07],[-4.23,-.68],[-4.34,-.71]],.38,rubber,.018);
  // Raised comb and moulded panels provide soft changes of surface.
  contour([[-3.8,.00],[-3.25,.09],[-2.73,.07],[-2.4,-.02],[-2.64,-.09],[-3.8,-.09]],.30,polymer,.025);
  for (const side of [-1, 1]) {
    const panel = contour([[-3.90,-.20],[-3.15,-.12],[-2.48,-.18],[-3.12,-.33],[-3.97,-.48]],.015,rubber,.01);
    panel.position.z = side * .215;
    const gripPanel = contour([[-1.69,-.35],[-1.49,-.35],[-1.70,-.78],[-1.82,-.75]],.012,rubber,.012);
    gripPanel.position.z = side * .215;
  }
  cylinder(.135, .135, 1.45, -.43, .13);
  cylinder(.125, .068, 3.63, 2.06, .14);
  cylinder(.075, .075, .10, 3.92, .14, 0, edge);
  cylinder(.052, .052, .005, 3.974, .14, 0, rubber);
  block(1.47, .08, .20, -.48, .285);
  block(.38, .13, .23, -.72, -.25, 0, polymer);
  const guardPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.30,-.27,0),new THREE.Vector3(-1.15,-.55,0),
    new THREE.Vector3(-.65,-.53,0),new THREE.Vector3(-.53,-.27,0),
  ]);
  mesh(new THREE.TubeGeometry(guardPath,32,.028,10,false),metal,0,0);
  const visualLever = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.96,-.26,0),new THREE.Vector3(-.93,-.37,0),new THREE.Vector3(-1.02,-.43,0),
  ]);
  mesh(new THREE.TubeGeometry(visualLever,12,.018,8,false),metal,0,0);
  // A simple hunting optic silhouette, with rings and subtle lens reflections.
  for (const x of [-.88, .12]) {
    block(.13,.25,.13,x,.40);
    const ring=mesh(new THREE.TorusGeometry(.124,.031,12,48),edge,x,.57);
    ring.rotation.y=Math.PI/2;
  }
  cylinder(.11,.11,1.93,-.25,.57);
  cylinder(.15,.15,.41,-1.36,.57);
  cylinder(.17,.17,.08,-1.60,.57,0,edge);
  cylinder(.11,.25,.37,.80,.57);
  cylinder(.25,.25,.46,1.21,.57);
  cylinder(.26,.26,.06,1.46,.57,0,edge);
  cylinder(.22,.22,.006,1.494,.57,0,glass);
  cylinder(.125,.125,.006,-1.644,.57,0,glass);
  const dial=mesh(new THREE.CylinderGeometry(.10,.10,.12,32),edge,-.20,.745);
  const sideDial=mesh(new THREE.CylinderGeometry(.09,.09,.12,32),metal,-.20,.57,.16);
  sideDial.rotation.x=Math.PI/2;
  for(const x of [-1.52,-1.47,-1.42,1.33,1.38]) {
    const ring=mesh(new THREE.TorusGeometry(x<0?.153:.253,.008,6,48),edge,x,.57);
    ring.rotation.y=Math.PI/2;
  }
  // An external handle and restrained material accents complete the silhouette.
  const handle=mesh(new THREE.CylinderGeometry(.025,.025,.24,12),metal,-.81,.07,.23);
  handle.rotation.x=-.65;
  mesh(new THREE.SphereGeometry(.065,20,16),polymer,-.81,-.025,.305);
  for(const x of [.3,.52,.74]) block(.012,.04,.355,x,-.11,0,rubber);

  function draw() {
    renderer.render(scene, camera);
    stage.dataset.rotation = rifle.rotation.y.toFixed(4);
  }
  function resize() {
    const width=stage.clientWidth, height=stage.clientHeight;
    const aspect=width/height;
    // Fit the whole exterior at every angle without cropping on narrow screens.
    const halfWidth=Math.max(5.45, 2.25*aspect);
    camera.left=-halfWidth; camera.right=halfWidth;
    camera.top=halfWidth/aspect; camera.bottom=-halfWidth/aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width,height,false);
    if(contextAvailable) draw();
  }
  renderFrame = time => {
    const delta=lastTime ? Math.max(0,(time-lastTime)/1000) : 0;
    lastTime=time;
    rifle.rotation.y=(rifle.rotation.y+delta*Math.PI*2/ROTATION_SECONDS)%(Math.PI*2);
    draw();
  };
  new ResizeObserver(resize).observe(stage);
  resize();
  poster.hidden=true;
  stage.dataset.renderState='ready';
  toggle.disabled=false;
  updateControl();
  synchronizeMotion();
  new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;
    synchronizeMotion();
  },{threshold:0}).observe(stage);
  renderer.domElement.addEventListener('webglcontextlost', event=>{
    event.preventDefault();
    showFallback();
  });
} catch {
  // A crisp illustration remains available when WebGL is unsupported.
  showFallback();
}
toggle.addEventListener('click',()=>{
  paused=!paused;
  updateControl();
  synchronizeMotion();
});
reducedMotion.addEventListener('change',event=>{
  paused=event.matches;
  updateControl();
  synchronizeMotion();
});
document.addEventListener('visibilitychange',synchronizeMotion);
