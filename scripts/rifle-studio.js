import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createRifle } from '../src/rifle-model.js';

// Offline studio scene. The website plays the resulting MP4; this renderer is
// never included in the production bundle. Angles are deterministic for export.
export function createStudio(width = 3840, height = 2160) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(1);
  renderer.setClearColor(0xffffff, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  document.body.style.margin = '0';
  document.body.append(renderer.domElement);

  const scene = new THREE.Scene();
  const room = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 1.1;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb6b6b6, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 3.5);
  key.position.set(-3, 7, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 2);
  rim.position.set(2, 3, -5);
  scene.add(rim);

  const { root } = createRifle();
  // All hero surfaces are opaque; transparency is only used in the scroll study.
  root.traverse(child => {
    if (child.isMesh) child.material.transparent = false;
  });
  scene.add(root);
  const halfWidth = 5.05;
  const halfHeight = halfWidth * height / width;
  const camera = new THREE.OrthographicCamera(-halfWidth, halfWidth, halfHeight, -halfHeight, .1, 100);
  camera.position.set(0, 2.8, 15);
  camera.lookAt(0, -.05, 0);

  return {
    frame(turn) {
      root.rotation.set(.04, -.28 + turn * Math.PI * 2, -.065);
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL('image/jpeg', .98).split(',')[1];
    },
  };
}
