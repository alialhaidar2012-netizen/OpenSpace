import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer(); //zum sehen der welt
const clock = new THREE.Clock();
let spielerMixer = null;
let gegnerMixer = null;
let spieler = null;
let gegner = null;
let delta;
let speed = 0;
let enemySpeed = 3;
let maxSpeed = 10;
let beschleunigung = 0.2;
let bremse = 0.995;
let richtung = new  THREE.Vector3(0, 0, 1);
let makeSpeed = false;
let makeBrake = false;
let mausX = 0;
let mausY = 0;
let spielerContainer = new THREE.Group();
let enemyAlive = false;
let playerRocketSpeed = 100;
let enemyRocketSpeed = 100;
let rocketTemplate = null;
const setBetween = new THREE.Vector3(350, 0, 100);
let enemySpawned = false;

let playerRockets = [];
let enemyRockets = [];

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 25;

// 1. Stärkeres Umgebungslicht (Grundhelligkeit erhöhen)
const ambientLight = new THREE.AmbientLight(0x445588, 0.8); // heller & bläulicher
scene.add(ambientLight);

// 2. Hauptlicht - heller & wärmer (wie ein Stern)
const sunLight = new THREE.DirectionalLight(0xfff5e0, 2.5); // heller & wärmer
sunLight.position.set(10, 15, 10);
scene.add(sunLight);

// 3. Stärkeres Fülllicht von der Seite (für Konturen)
const fillLight = new THREE.DirectionalLight(0x88aaff, 1.2); // stärker
fillLight.position.set(-10, 5, -5);
scene.add(fillLight);

// 4. Bläuliches Licht von unten (für Atmosphäre)
const blueLight = new THREE.DirectionalLight(0x4488ff, 0.8);
blueLight.position.set(-5, -10, 5);
scene.add(blueLight);

// 5. Zusätzliches warmes Licht von hinten (Rim-Light)
const rimLight = new THREE.DirectionalLight(0xffaa66, 1.0);
rimLight.position.set(0, 5, -15);
scene.add(rimLight);

// 6. Punktlicht für Glow-Effekt (stärker)
const glowLight = new THREE.PointLight(0xaaccff, 1.5, 100); // stärker & größere Reichweite
glowLight.position.set(0, 0, 0);
scene.add(glowLight);


const loadPlayer = new GLTFLoader();
loadPlayer.load('models/Player/scene.gltf', (gltf) =>{
  spieler = gltf.scene;  // wichtig speichert spieler ab damit es überall benutzt werden kann
  spielerMixer = new THREE.AnimationMixer(gltf.scene);
  gltf.animations.forEach((clip) => {
    spielerMixer.clipAction(clip).play();
  });
  spieler.rotation.y = -Math.PI / 2;
  
  spielerContainer.add(spieler);
  scene.add(spielerContainer);
  
  spielerContainer.position.set(0, 0, 0);
  spielerMixer.timeScale = 0.5;
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

function spawnEnemy() {
  if(enemySpawned) rn;
  enemySpawned = true;
  const loadEnemy = new GLTFLoader();
loadEnemy.load('models/Enemy/scene.gltf', (gltf) => {
  gegner = gltf.scene;
  gegnerMixer = new THREE.AnimationMixer(gegner);
  
  if (gltf.animations && gltf.animations.length > 0) {
    gltf.animations.forEach((clip) => {
      gegnerMixer.clipAction(clip).play();
    });
  }
  
  scene.add(gegner);
  gegner.position.copy(spielerContainer.position).add(setBetween);
  
});
enemyAlive = true;
}
function flyEnemy() {
  if(!gegner || !spielerContainer)return;

const dir = new THREE.Vector3();
dir.subVectors(spielerContainer.position, gegner.position)

const distance = dir.length();

if (distance > 30){
  dir.normalize();
  gegner.position.x += dir.x * enemySpeed * delta;
  gegner.position.y += dir.y * enemySpeed * delta; 
  gegner.position.z += dir.z * enemySpeed * delta; 
}
gegner.lookAt(spielerContainer.position);
if (Math.random() < 0.003){
  shootEnemy();
}
}
function shootEnemy() {
  const dir = new THREE.Vector3(0, 0, 1);
  dir.applyQuaternion(gegner.quaternion);
  dir.normalize();
  
  const rocket = createRocket(
    gegner.position,
    dir,
    gegner.quaternion,
    enemyRocketSpeed
  );
  enemyRockets.push(rocket);
}
function shootPlayer() {
  const dir = new THREE.Vector3(0,0,1);
  dir.applyQuaternion(spielerContainer.quaternion);
  dir.normalize();
  
  const rocket = createRocket(spielerContainer.position,
  dir,
  spielerContainer.quaternion,
  playerRocketSpeed
  );
playerRockets.push(rocket);
}
function createRocket(startPosition, direction, quaternion, speed){
  if (!rocketTemplate) return null; 
  const rocket = rocketTemplate.clone();
  
  rocket.position.copy(startPosition);
  rocket.position.x += direction.x * 5;
  rocket.position.y += direction.y * 5;
  rocket.position.z += direction.z * 5;
  
  rocket.quaternion.copy(quaternion);
  scene.add(rocket);
  
  return {
    mesh: rocket,
    richtung: direction.clone(),
    speed: speed,
    lebenszeit: 3
  }
}
function updateRockets(rockets, ziel, zielRadius, callback) {
  for (let i = rockets.length -1; i >= 0; i--){
    const r = rockets[i];
    
    r.mesh.position.x += r.richtung.x * r.speed * delta;
    r.mesh.position.y += r.richtung.y * r.speed * delta;
    r.mesh.position.z += r.richtung.z * r.speed * delta;
    
    r.lebenszeit -= delta;
    
    if (ziel) {
      const distanz = r.mesh.position.distanceTo(ziel);
      if (distanz <= zielRadius) {
        scene.remove(r.mesh);
        rockets.splice(i,1)
        if(callback) callback();
        continue;
      }
    }
    if (r.lebenszeit <= 0){
      scene.remove(r.mesh);
      rockets.splice(i,1);
    }
  }
}
function checkCollisions() {
  updateRockets(enemyRockets, spielerContainer.position, 20, () => {alert('Game Over');
  });
  if (gegner && enemyAlive){
    updateRockets(playerRockets, gegner.position, 10, () => {alert('Victory');
    scene.remove(gegner);
    enemyAlive = false;
  });
  } else {
    updateRockets(playerRockets,null, 0, null);
  }
}
document.addEventListener('click', () => {
  renderer.domElement.requestPointerLock();
  mausX = 0;
  mausY = 0;
});

document.addEventListener("keydown", (event) => {
  if (event.which === 87) makeSpeed = true;
  if (event.which === 83) makeBrake = true;
  if (event.which === 32) shootPlayer();
}, false);

document.addEventListener("keyup", (event) => {
  if (event.which === 87) makeSpeed = false;
  if (event.which === 83) makeBrake = false;
}, false);

document.addEventListener('mousemove', (event) => {
  if(document.pointerLockElement === renderer.domElement){
    mausX = event.movementX * 0.002;
    mausY = event.movementY * 0.002;
    
  }
});

 if (!rocketTemplate) {
   const rocketLoader = new GLTFLoader();
   rocketLoader.load('models/Rocket/scene.gltf', (gltf) =>
   {
      const rocketModel = gltf.scene;
      
       rocketModel.rotation.x = Math.PI / 2;

       rocketTemplate = new THREE.Group();
       rocketTemplate.add(rocketModel);
         });
   }
   
function animate(time) {
  requestAnimationFrame(animate);
  delta = clock.getDelta();
  
  // Gas / Bremse
  if (makeSpeed) {
    speed += beschleunigung * delta * 60;
    if (speed > maxSpeed) speed = maxSpeed;
  }
  if (makeBrake) {
    speed -= beschleunigung * delta * 60;
    if (speed < 0) speed = 0;
  }
  
  if (spielerContainer) {
    // 1. Rotation (links/rechts + hoch/runter)
    spielerContainer.rotateY(-mausX);
    spielerContainer.rotateX(-mausY);
    
    mausX = 0;
    mausY = 0;
    
    // 2. Blickrichtung (Container!)
    richtung.set(0, 0, 1);
    richtung.applyQuaternion(spielerContainer.quaternion);
    richtung.normalize();
    
    // 3. Reibung
    speed *= bremse;
    if (speed < 0.001) speed = 0;
    
    // 4. Bewegung (Container!)
    spielerContainer.position.x += richtung.x * speed * delta;
    spielerContainer.position.y += richtung.y * speed * delta;
    spielerContainer.position.z += richtung.z * speed * delta;
  }
  
  // 5. Animation
  if (spielerMixer) {
    spielerMixer.timeScale = 0.3 + speed * 0.001;
    spielerMixer.update(delta);
  }
  if (gegnerMixer) gegnerMixer.update(delta);
           
  // 6. Kamera (Container!)
  if (spielerContainer) {
    const offset = new THREE.Vector3(0, 10, -50)
    offset.applyQuaternion(spielerContainer.quaternion);
    camera.position.copy(spielerContainer.position).add(offset);
    camera.up.set(0,1,0).applyQuaternion(spielerContainer.quaternion);
    camera.lookAt(spielerContainer.position);
  }
  // 7.gegner fliegen lassen
  if (enemyAlive) flyEnemy();
  if (!enemyAlive) spawnEnemy();

//7a Kollisionen überprüfen
checkCollisions();
  // 8. Rendern
  renderer.render(scene, camera);
}
animate();
