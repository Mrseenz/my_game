import { camera, renderer } from './scene.js';
import { updateProgress, updateDebugDisplay } from './ui.js';
import { player } from './main.js';

export const keys = {};

export function initEventListeners() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        keys[key] = true;

        if (key === 'f') {
            player.toggleVehicle();
        }

        if (key === 'r') {
            player.body.position.set(0, 5, 10);
            player.body.velocity.set(0, 0, 0);
        }

        // Sprint
        if (key === 'shift') {
            player.sprinting = true;
        }

        // Debug key display
        updateDebugDisplay();
    });

    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        keys[key] = false;

        if (key === 'shift') {
            player.sprinting = false;
        }

        // Debug key display
        updateDebugDisplay();
    });

    // Mouse
    let isPointerLocked = false;
    document.addEventListener('click', () => {
        if (!isPointerLocked) {
            renderer.domElement.requestPointerLock();
        }
    });

    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = document.pointerLockElement === renderer.domElement;
    });

    document.addEventListener('mousemove', (e) => {
        if (isPointerLocked && player && !player.isInVehicle) {
            camera.rotation.y -= e.movementX * 0.002;
            camera.rotation.x -= e.movementY * 0.002;
            camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
        }
    });

    updateProgress(1);
}
