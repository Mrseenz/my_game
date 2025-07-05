// Import composer from scene.js
import { initScene, scene, camera, renderer, world, composer } from './scene.js';
import { initLights } from './lighting.js';
import { Player } from './player.js';
import { Vehicle, preLoadCarModels, carModelPaths, loadedCarModels } from './vehicle.js';
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
            if (v.mesh && player.mesh) {
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

    // Use composer.render() if composer is available, otherwise fallback to renderer.render()
    if (composer) {
        composer.render(deltaTime); // Pass deltaTime if your passes need it (some do)
    } else if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// --- INITIALIZATION ---
function initGame() {
    initScene(); // This now also initializes the composer
    initLights();
    initEventListeners();

    player = new Player();

    preLoadCarModels(() => {
        createCity((parkedCars) => {
            vehicles.push(...parkedCars);

            const playerCarModelPath = loadedCarModels[carModelPaths[0]] ? carModelPaths[0] : 0x44aaff;
            const playerVehicle = new Vehicle(new THREE.Vector3(15, 0.5, 15), playerCarModelPath);
            vehicles.push(playerVehicle);

            for (let i = 0; i < 3; i++) {
                const x = (Math.random() - 0.5) * 200;
                const z = (Math.random() - 0.5) * 200;
                const randomCarModelPath = carModelPaths.length > 0 ? carModelPaths[Math.floor(Math.random() * carModelPaths.length)] : [0xff5555, 0x55ff55, 0x5555ff][i % 3];
                vehicles.push(new Vehicle(new THREE.Vector3(x, 0.5, z), randomCarModelPath));
            }

            if (loadingScreen) {
                 setTimeout(() => {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadingScreen.classList.add('hidden');
                    }, 1000);
                }, 500);
            }

            lastTime = performance.now();
            animate();
        });
    });
}

window.onload = initGame;

export { player, canInteractWithVehicle, closestVehicle };
