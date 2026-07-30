import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer(); //zum sehen der welt
const controls = new OrbitControls(camera, renderer.domElement);
const clock = new THREE.Clock();
let mixer;
let ship;
let delta;

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


camera.position.z = 25;

const light = new THREE.AmbientLight(0xe8e8ff);
scene.add(light);

const gloader = new GLTFLoader();
gloader.load('models/Player/scene.gltf', (Player) =>{
  ship = Player.scene;
  mixer = new THREE.AnimationMixer(Player.scene);
  Player.animations.forEach((clip) => {
    mixer.clipAction(clip).play();
  });
  scene.add(Player.scene);
});

const loader = new THREE.CubeTextureLoader();
const textures = loader.load([
    './textures/space_ft.png',
    './textures/space_bk.png',
    './textures/space_up.png',
    './textures/space_dn.png',
    './textures/space_rt.png',
    './textures/space_lf.png'
]);
scene.background = textures;

function animate(time) {
  requestAnimationFrame(animate);
  delta = clock.getDelta();
  if(mixer){
    mixer.update(delta);
  }
  renderer.render(scene, camera);
}
animate();

let xSpeed = 0.2;
let ySpeed = 0.2;
let zSpeed = 0.2;

document.addEventListener("keydown", onDocumentKeyDown, false)

function onDocumentKeyDown(event) {
  if (!ship) return;
  let keyCode = event.which;
  if (keyCode == 87) {
    ship.position.z += ySpeed;
  } else if (keyCode == 83) {
    ship.position.z -= ySpeed;
  } else if (keyCode == 65) {
    ship.position.x -= xSpeed;
  } else if (keyCode == 68) {
    ship.position.x += xSpeed;
  } else if (keyCode == 40) {
    ship.position.y += ySpeed;
  } else if (keyCode == 38) {
    ship.position.y -= ySpeed;
  } else if (keyCode == 32) {
    ship.position.set(0, 0, 0);
  }
}
