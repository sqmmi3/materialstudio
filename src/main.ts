import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PMREMGenerator } from 'three';
import { Cabinet } from './Cabinet';

let chairModel: THREE.Group;
let currentView: 'chair' | 'cabinet' = 'chair';
const cabinetControls = document.getElementById('cabinet-controls') as HTMLDivElement;

// 1. Setup Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#app') as HTMLCanvasElement,
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;

// 2. Environment (Studio Lighting)
const pmremGenerator = new PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

// 3. Define Material
const material = new THREE.MeshStandardMaterial({
  color: 0x8b5a2b,
  roughness: 0.7,
  metalness: 0.1
});

// 4. Load Model
const cabinet = new Cabinet(material);
const loader = new GLTFLoader();
const chairUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenChair/glTF-Binary/SheenChair.glb';

loader.load(chairUrl, (gltf) => {
  chairModel = gltf.scene;
  chairModel.scale.set(3, 3, 3);
  chairModel.position.set(0, -1, 0);

  chairModel.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const m = child as THREE.Mesh;
      m.castShadow = true;
      m.receiveShadow = true;
      m.material = material;
    }
  });
  setView('chair');
}, undefined, (error) => {
  console.error('Error loading chair:', error);
});

function setView(view: 'chair' | 'cabinet') {
  currentView = view;

  if (view === 'chair') {
    if (chairModel) scene.add(chairModel);
    scene.remove(cabinet.mesh);
    cabinetControls.style.display = 'none';
  } else {
    scene.remove(chairModel);
    scene.add(cabinet.mesh);
    cabinetControls.style.display = 'block';
    onSliderChange();
  }
}

document.getElementById('view-chair')?.addEventListener('click', () => setView('chair'));
document.getElementById('view-cabinet')?.addEventListener('click', () => setView('cabinet'));

// 5. Floor & Lights
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.2 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1;
floor.receiveShadow = true;
scene.add(floor);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.bias = -0.0001;
// Increase the "box" so shadows don't get cut off
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
scene.add(directionalLight);

const helper = new THREE.DirectionalLightHelper(directionalLight, 1);
scene.add(helper);

// 6. Controls & UI
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
camera.position.set(0, 2, 7);

document.querySelector('#btn-oak')?.addEventListener('click', () => {
  material.color.set(0x8b5a2b);
  material.roughness = 0.7;
  material.metalness = 0.1;
});

document.querySelector('#btn-steel')?.addEventListener('click', () => {
  material.color.set(0xaaaaaa);
  material.roughness = 0.2;
  material.metalness = 1.0;
});

// 7. Animation Loop
function updateSun(light: THREE.DirectionalLight) {
  const now = new Date();
  const hours = now.getHours() + now.getMinutes() / 60;
  const angle = (hours - 6) * (Math.PI / 12);
  const radius = 10;

  light.position.x = Math.cos(angle) * radius;
  light.position.y = Math.sin(angle) * radius;
  light.position.z = 3;

  const noonDist = Math.abs(12 - hours) / 6;
  const color = new THREE.Color().lerpColors(
    new THREE.Color(0xffffff),
    new THREE.Color(0xffa500),
    Math.min(noonDist, 1)
  );
  light.color = color;
  light.intensity = hours > 6 && hours < 20 ? 1.5 : 0.0;
  
  helper.update();
}

function animate() {
  requestAnimationFrame(animate);
  updateSun(directionalLight);
  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

const sliderWidth = document.getElementById('slider-w') as HTMLInputElement;
const sliderHeight = document.getElementById('slider-h') as HTMLInputElement;
const sliderDepth = document.getElementById('slider-d') as HTMLInputElement;

function onSliderChange() {
  if (currentView !== 'cabinet') return;

  const width = parseFloat(sliderWidth.value);
  const height = parseFloat(sliderHeight.value);
  const depth = parseFloat(sliderDepth.value);

  document.getElementById('val-w')!.innerText = width.toFixed(1);
  document.getElementById('val-h')!.innerText = height.toFixed(1);
  document.getElementById('val-d')!.innerText = depth.toFixed(1);

  cabinet.update(width, height, depth);
}

sliderWidth.addEventListener('input', onSliderChange);
sliderHeight.addEventListener('input', onSliderChange);
sliderDepth.addEventListener('input', onSliderChange);