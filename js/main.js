import { initScene, scene, camera, renderer, world, composer } from './scene.js';
import { initLights } from './lighting.js';
import { Player } from './player.js';
// Import only Vehicle class, no pre-loading functions or model paths from vehicle.js
import { Vehicle } from './vehicle.js';
import { createCity } from './city.js';
import { initEventListeners, keys } from './events.js';
import { updateProgress, interactionPrompt, loadingScreen, loadingBar, loadingText, speedValue, modeIndicator, debugKeys } from './ui.js';

// Global variables
export { keys, vehicles };

let player;
let vehicles = [];
let canInteractWithVehicle = false;
let closestVehicle = null;
let lastTime = 0;

// --- GAME LOOP ---
function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const deltaTime = Math.min(0.1, (time - lastTime) / 1000);
    lastTime = time;

    if (world) {
        world.step(1 / 60, deltaTime, 3);
    }

    if (player) player.update(deltaTime);
    vehicles.forEach(v => v.update(deltaTime));

    if (player && !player.isInVehicle) {
        canInteractWithVehicle = false;
        closestVehicle = null;
        let minDistance = 5;

        vehicles.forEach(v => {
            if (v.mesh && player.mesh) { // Check meshes exist
                const distance = player.mesh.position.distanceTo(v.mesh.position);
                if (distance < minDistance) {
                    canInteractWithVehicle = true;
                    closestVehicle = v;
                    minDistance = distance;
                }
            }
        });
        if(interactionPrompt) interactionPrompt.style.display = canInteractWithVehicle ? 'block' : 'none';
    } else {
        if(interactionPrompt) interactionPrompt.style.display = 'none';
    }

    if (composer) {
        composer.render(deltaTime);
    } else if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// --- INITIALIZATION ---
function initGame() {
    initScene();
    initLights();
    initEventListeners();

    player = new Player();

    // Directly call createCity, as it no longer depends on car models being pre-loaded by main.js
    // createCity itself is synchronous now (or its async part is self-contained if any remains for other assets, but not for this plan)
    createCity((parkedCars) => {
        vehicles.push(...parkedCars); // Add parked cars from city generation

        // Player vehicle - uses default color or specified color
        const playerVehicle = new Vehicle(new THREE.Vector3(15, 0.1, 15), 0x44aaff); // Y pos adjusted for box
        vehicles.push(playerVehicle);

        // Other AI vehicles - use random colors
        const aiCarColors = [0xff5555, 0x55ff55, 0x5555ff, 0xffaa00, 0x00aaff];
        for (let i = 0; i < 3; i++) {
            const x = (Math.random() - 0.5) * 200;
            const z = (Math.random() - 0.5) * 200;
            vehicles.push(new Vehicle(new THREE.Vector3(x, 0.1, z), aiCarColors[i % aiCarColors.length])); // Y pos adjusted
        }

        if (loadingScreen) {
             setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                }, 1000);
            }, 200); // Reduced delay as loading should be faster
        }

        lastTime = performance.now();
        animate();
    });
}

window.onload = initGame;

export { player, canInteractWithVehicle, closestVehicle };
