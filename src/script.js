import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Pane } from 'tweakpane';
import { AdditiveBlending } from 'three';
import { GraphCursor } from '@tweakpane/core/dist/cjs/monitor-binding/number/model/graph-cursor';
import { gsap } from 'gsap';
import SplitType from 'split-type';

const galaxyGroup = new THREE.Group();
const galaxyGroupScrollContainer = new THREE.Group();

document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('.main-text');
  main.style = 'opacity: 1;';
});

/**
 * Base
 */

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Galaxy
 */
const params = {};
params.count = 85000;
params.size = 0.012;
params.radius = 5;
params.branches = 3;
params.spin = 1;
params.randomness = 0.2;
params.falloff = 1.5;
params.insideColor = '#8630ff';
params.outsideColor = '#004c0b';
let geometry = null;
let material = null;
let points = null;

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
  galaxyGroupScrollContainer.add(galaxyGroup);
  scene.add(galaxyGroupScrollContainer);
};
generateGalaxy();

// Debug
const monitor = {};
monitor.fps = 0;

const isMobile = window.innerWidth < 678;
console.log(isMobile);

const gui = new Pane({
  title: 'Galaxy Generator Controls',
  expanded: false,
});

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

const cursor = {
  x: 0,
  y: 0,
};
window.addEventListener('mousemove', (e) => {
  cursor.x = e.clientX / sizes.width - 0.5;
  cursor.y = e.clientY / sizes.height - 0.5;
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
);

const centre = new THREE.Vector3(0, -2, 0);
camera.position.x = 3;
camera.position.y = 1.5;
camera.position.z = 7;
camera.lookAt(centre);
scene.add(camera);

// Controls
// const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();
const times = [];

const splitTitle = new SplitType('.main-heading', { type: 'words' });
const splitText = new SplitType('.sub-text', { type: 'words' });
const splitIntro = new SplitType('#intro-text', { type: 'words' });
const line = document.querySelectorAll('.line');
line.forEach((element) => {
  element.style = 'overflow: hidden;';
});
splitTitle.lines[1].classList.add('is-a');
const tl = gsap.timeline();
tl.from(splitIntro.words, {
  ease: 'power2.out',
  opacity: 0,
  y: 80,
  duration: 0.85,
  stagger: { amount: 0.4 },
});
tl.to(
  splitIntro.words,
  {
    ease: 'power2.in',
    opacity: 0,
    y: -80,
    duration: 0.85,
    stagger: { amount: 0.4 },
  },
  '>0.5'
);
tl.to(
  galaxyGroupScrollContainer.position,
  {
    x: 5,
    duration: 4,
    ease: 'power3.inOut',
  },
  '<-0.5'
);
tl.from(
  camera.position,
  {
    y: 5,
    z: -3,
    duration: 4,
    ease: 'power2.inOut',
  },
  '<'
);
tl.from(
  splitTitle.words,
  {
    ease: 'expo.out',
    opacity: 1,
    y: 180,
    duration: 1,
    stagger: { amount: 0.3 },
  },
  '<1.8'
);
tl.from(
  splitText.words,
  {
    ease: 'power2.inOut',
    opacity: 1,
    y: 104,
    duration: 1.5,
    stagger: { amount: 0.3 },
  },
  '<'
);

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  //controls.update();

  monitor.windowWidth = window.innerWidth;

  // Rotate galaxy
  galaxyGroup.rotation.y += 0.001;

  gsap.to(galaxyGroupScrollContainer.rotation, {
    z: 0.2 + -cursor.x * 0.25,
    duration: 1,
  });
  gsap.to(galaxyGroupScrollContainer.rotation, {
    x: cursor.y * 0.25,
    duration: 1,
  });

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
