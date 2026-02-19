import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PMREMGenerator } from 'three';
import { Cabinet } from './Cabinet';
import { Showroom } from './Showroom';

let chairModel: THREE.Group;
let currentView: 'chair' | 'cabinet' = 'chair';
const cabinetControls = document.getElementById('cabinet-controls') as HTMLDivElement;

// 1. Setup Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#app') as HTMLCanvasElement,
  antialias: true,
  preserveDrawingBuffer: true
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

const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 4096;
directionalLight.shadow.mapSize.height = 4096;
directionalLight.shadow.bias = -0.0001;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 100;
directionalLight.shadow.camera.left = -15;
directionalLight.shadow.camera.right = 15;
directionalLight.shadow.camera.top = 15;
directionalLight.shadow.camera.bottom = -15;
directionalLight.shadow.radius = 4;
directionalLight.shadow.blurSamples = 25;
scene.add(directionalLight);

const helper = new THREE.DirectionalLightHelper(directionalLight, 1);
scene.add(helper);

let lampOn = false;
document.getElementById('btn-lamp')?.addEventListener('click', () => {
  lampOn = !lampOn;
  pointLight.intensity = lampOn ? 50 : 0;  
  const btn = document.getElementById('btn-lamp');
  if (btn) btn.style.background = lampOn ? '#ffc107' : '#444';
});

const pointLight = new THREE.PointLight(0xfff0dd, 0, 10);
pointLight.position.set(0, 5, 0); 
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.bias = -0.001;

scene.add(pointLight);

// 6. Controls & UI
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);
camera.position.set(8, 5, 10);

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

const sliderTime = document.getElementById('slider-time') as HTMLInputElement;

const showroom = new Showroom();
scene.add(showroom.mesh);

// 7. Animation Loop
function updateSun(light: THREE.DirectionalLight) {
  const hours = parseFloat(sliderTime.value);
  document.getElementById('val-time')!.innerText = Math.floor(hours).toString();
  const angle = (hours - 6) * (Math.PI / 12);
  const radius = 20;

  light.position.x = Math.cos(angle) * radius;
  light.position.y = Math.sin(angle) * radius;
  light.position.z = 2;

  const noonDist = Math.abs(12 - hours) / 6;
  const color = new THREE.Color().lerpColors(
    new THREE.Color(0xffffff),
    new THREE.Color(0xffa500),
    Math.min(noonDist, 1)
  );
  light.color = color;
  
  let daylightFactor = 0.0;
  const isDay = hours > 4 && hours < 22;
  if (isDay) {
    daylightFactor = THREE.MathUtils.smoothstep(hours, 4, 8) - THREE.MathUtils.smoothstep(hours, 18, 22);
  }

  light.intensity = daylightFactor * 3.0;
  scene.environmentIntensity = daylightFactor * 0.5;
  ambientLight.intensity = (daylightFactor * 0.05) + 0.2;
  
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

document.getElementById('btn-screenshot')?.addEventListener('click', () => {
  helper.visible = false;
  
  renderer.render(scene, camera);
  
  const dataURL = renderer.domElement.toDataURL('image/png');
  
  const link = document.createElement('a');
  link.download = `flux-design-${Date.now()}.png`;
  link.href = dataURL;
  link.click();

  helper.visible = true;
});

document.getElementById('btn-specs')?.addEventListener('click', () => {
  const matName = material.metalness > 0.5 ? "Brushed Steel" : "Oak Wood";
  const viewName = currentView.toUpperCase();
  
  const content = `
    CONFIGURATOR EXPORT
    ------------------------
    Item: ${viewName}
    Material: ${matName}
    Dimensions: ${sliderWidth.value}m x ${sliderHeight.value}m x ${sliderDepth.value}m
    Date: ${new Date().toLocaleString()}
  `;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'config-specs.txt';
  link.href = url;
  link.click();
});