import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Pane } from 'tweakpane';
import { AdditiveBlending } from 'three';
import { GraphCursor } from '@tweakpane/core/dist/cjs/monitor-binding/number/model/graph-cursor';

/**
 * Base
 */
// Debug
const gui = new Pane({ title: 'Galaxy Generator Controls' });

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Galaxy
 */
const params = {};
params.count = 50000;
params.size = 0.01;
params.radius = 5;
params.branches = 3;
params.spin = 1;
params.randomness = 0.2;
params.falloff = 1.5;
params.insideColor = '#ff6030';
params.outsideColor = '#003f7c';
let geometry = null;
let material = null;
let points = null;
const galaxyGroup = new THREE.Group();

const generateGalaxy = () => {
  if (points !== null) {
    geometry.dispose();
    material.dispose();
    galaxyGroup.remove(points);
  }
  // Geometry
  geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(params.count * 3);
  const colors = new Float32Array(params.count * 3);
  const insideColor = new THREE.Color(params.insideColor);
  const outsideColor = new THREE.Color(params.outsideColor);

  for (let i = 0; i < params.count; i++) {
    const i3 = i * 3;

    // Position
    const radius = Math.random() * params.radius;
    const spinAngle = radius * params.spin;
    const branchAngle = ((i % params.branches) / params.branches) * Math.PI * 2;

    const randomX =
      Math.pow(Math.random(), params.falloff) * (Math.random() < 0.5 ? 1 : -1);
    const randomY =
      Math.pow(Math.random(), params.falloff * 10) *
      (Math.random() < 0.5 ? 1 : -1);
    const randomZ =
      Math.pow(Math.random(), params.falloff) * (Math.random() < 0.5 ? 1 : -1);

    positions[i3 + 0] = Math.cos(branchAngle + spinAngle) * radius + randomX;
    positions[i3 + 1] = randomY;
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

    // Colors
    const mixedColor = insideColor.clone();
    mixedColor.lerp(outsideColor, radius / params.radius);
    colors[i3 + 0] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Material
  material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: params.size,
    sizeAttenuation: true,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexColors: true,
  });

  // Points
  points = new THREE.Points(geometry, material);

  galaxyGroup.add(points);
  scene.add(galaxyGroup);
};
generateGalaxy();

// Debug
const monitor = {};
monitor.fps = 0;

const particleControls = gui.addFolder({
  title: 'Particles',
});
const galaxyControls = gui.addFolder({
  title: 'Galaxy',
});
const colorControls = gui.addFolder({
  title: 'Color',
});
const performanceMonitor = gui.addFolder({
  title: 'Performance monitor',
});
const github = gui.addFolder({
  title: 'Github',
  expanded: false,
});

particleControls.addInput(params, 'count', {
  label: 'Count',
  min: 100,
  max: 100000,
  step: 100,
});
particleControls.addInput(params, 'size', {
  label: 'Size',
  min: 0.001,
  max: 0.1,
  step: 0.001,
});

galaxyControls.addInput(params, 'radius', {
  label: 'Radius',
  min: 0.01,
  max: 20,
  step: 0.01,
});
galaxyControls.addInput(params, 'branches', {
  label: 'Branches',
  min: 2,
  max: 20,
  step: 1,
});
galaxyControls.addInput(params, 'spin', {
  label: 'Spin',
  min: -5,
  max: 5,
  step: 0.1,
});
galaxyControls.addInput(params, 'randomness', {
  label: 'Randomness',
  min: 1,
  max: 10,
  step: 0.25,
});
galaxyControls.addInput(params, 'falloff', {
  label: 'Falloff',
  min: 1,
  max: 10,
  step: 0.25,
});

colorControls.addInput(params, 'insideColor', { label: 'Inner color' });
colorControls.addInput(params, 'outsideColor', { label: 'Outer color' });

performanceMonitor.addMonitor(monitor, 'fps', { label: 'FPS' });
performanceMonitor.addMonitor(monitor, 'fps', {
  label: 'Graph',
  view: 'graph',
});

const ghButton = github.addButton({ title: 'Visit the repo' });
ghButton.on('click', () => {
  window.open('https://github.com/sekeidesign/Galaxy-Generator', '_blank');
});

gui.on('change', (ev) => {
  generateGalaxy();
});

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 3;
camera.position.y = 1.5;
camera.position.z = 7;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();
const times = [];

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Rotate galaxy
  galaxyGroup.rotation.y += 0.001;

  // Render
  renderer.render(scene, camera);

  // FPS
  const now = performance.now();
  while (times.length > 0 && times[0] <= now - 1000) {
    times.shift();
  }
  times.push(now);
  monitor.fps = times.length;

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
