import * as THREE from 'three'; // Added for THREE namespace
import { scene } from './scene.js';
import { updateProgress } from './ui.js';

/**
 * Initializes the lighting for the game environment.
 */
export function initLights() { // Added export
    // Ambient Light: Provides a base level of light, less directional.
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Slightly reduced intensity
    scene.add(ambientLight);

    // Directional Light (Sun): Simulates sunlight.
    const sun = new THREE.DirectionalLight(0xfff0e0, 0.9); // Slightly warmer color, slightly increased intensity
    sun.position.set(75, 150, 60); // Adjusted position for potentially different shadow angles
    sun.castShadow = true;

    // Shadow properties
    sun.shadow.mapSize.width = 2048; // Increased shadow map resolution
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;    // Default is 0.5
    sun.shadow.camera.far = 500;     // Default is 500, ensure it covers the scene
    sun.shadow.camera.left = -250;   // Increased frustum size slightly
    sun.shadow.camera.right = 250;
    sun.shadow.camera.top = 250;
    sun.shadow.camera.bottom = -250;
    sun.shadow.bias = -0.0005;       // Helps prevent shadow acne
    // sun.shadow.radius = 1;        // Softens shadow edges (PCFSoftShadowMap helps too)

    scene.add(sun);
    // Optional: Add a target for the directional light if needed, though it defaults to (0,0,0)
    // const sunTarget = new THREE.Object3D();
    // sunTarget.position.set(0, 0, 0);
    // scene.add(sunTarget);
    // sun.target = sunTarget;

    // Hemisphere Light: Provides light from sky and ground, good for outdoor scenes.
    const hemiLight = new THREE.HemisphereLight(
        0x708090, // Sky color (e.g., slate gray, more neutral than bright blue)
        0x4a4a4a, // Ground color (e.g., dark gray for general ground reflection)
        0.5       // Increased intensity for better fill
    );
    scene.add(hemiLight);

    updateProgress(1); // Assuming this is a step in a larger loading process
}
