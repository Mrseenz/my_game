import { initScene, scene, camera, renderer, world } from './scene.js';
import { initLights } from './lighting.js';
import { Player } from './player.js';
import { Vehicle } from './vehicle.js';
import { createCity } from './city.js';
import { initEventListeners, keys } from './events.js';
import { updateProgress, interactionPrompt, loadingScreen, loadingBar, loadingText, speedValue, modeIndicator, debugKeys } from './ui.js';

// Global variables (now managed in main.js and exported/imported as needed)
export { keys, interactionPrompt, loadingScreen, loadingBar, loadingText, speedValue, modeIndicator, debugKeys };

let player;
let vehicles = [];
let canInteractWithVehicle = false;
let closestVehicle = null;
let lastTime = 0;

import { scene, camera, renderer, world, groundMaterial, playerMaterial, vehicleMaterial } from './scene.js';

// --- GAME LOOP ---
function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const deltaTime = Math.min(0.1, (time - lastTime) / 1000);
    lastTime = time;

    // Physics step
    world.step(1 / 60, deltaTime, 3);

    // Update game objects
    if (player) player.update(deltaTime);
    vehicles.forEach(v => v.update(deltaTime));

    // Interaction check
    if (player && !player.isInVehicle) {
        canInteractWithVehicle = false;
        closestVehicle = null;
        let minDistance = 5;

        vehicles.forEach(v => {
            const distance = player.mesh.position.distanceTo(v.mesh.position);
            if (distance < minDistance) {
                canInteractWithVehicle = true;
                closestVehicle = v;
                minDistance = distance;
            }
        });

        interactionPrompt.style.display = canInteractWithVehicle ? 'block' : 'none';
    } else {
        interactionPrompt.style.display = 'none';
    }

    // Render
    renderer.render(scene, camera);
}

// --- INITIALIZATION ---
function initGame() {
    initScene();
    initLights();

    // Create player and city
    player = new Player();
    createCity();

    // Add player vehicle
    const playerVehicle = new Vehicle(new THREE.Vector3(15, 2, 15), 0x44aaff);
    vehicles.push(playerVehicle);

    // Add other vehicles
    for (let i = 0; i < 3; i++) {
        const x = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        const color = [0xff5555, 0x55ff55, 0x5555ff][Math.floor(Math.random() * 3)];
        vehicles.push(new Vehicle(new THREE.Vector3(x, 2, z), color));
    }

    initEventListeners();

    // Hide loading screen
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 1000);
    }, 500);

    // Start animation
    lastTime = performance.now();
    animate();
}

// Start the game
window.onload = initGame;

export { player, vehicles, canInteractWithVehicle, closestVehicle };
