import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';


export let scene, camera, renderer, world, composer; // Added composer
export let groundMaterial, playerMaterial, vehicleMaterial;

export function initScene() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Light blue sky

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    // Renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true // Antialiasing can also be handled by a post-processing pass (FXAA/SMAA)
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
    // renderer.toneMapping = THREE.ACESFilmicToneMapping; // For more cinematic look, if using HDR
    // renderer.toneMappingExposure = 1.0;
    document.body.appendChild(renderer.domElement);

    // Post-processing Composer
    composer = new EffectComposer(renderer);

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
    ssaoPass.kernelRadius = 0.8; // Default 0.5. Adjust for effect strength/spread.
    ssaoPass.minDistance = 0.001; // Default 0.001
    ssaoPass.maxDistance = 0.1;  // Default 0.1. Adjust based on scene scale.
                                  // Might need to be larger for a city scene, e.g., 10 or 50.
    // ssaoPass.output = SSAOPass.OUTPUT.SSAO; // For debugging SSAO effect itself
    composer.addPass(ssaoPass);

    const outputPass = new OutputPass(); // Handles output encoding, etc.
    composer.addPass(outputPass);


    // Physics world
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0); // Standard gravity
    world.broadphase = new CANNON.SAPBroadphase(world); // Efficient broadphase for many objects
    // world.solver.iterations = 10; // Default is 10, can increase for stability

    // Materials for physics interactions
    groundMaterial = new CANNON.Material('groundMaterial');
    playerMaterial = new CANNON.Material('playerMaterial');
    vehicleMaterial = new CANNON.Material('vehicleMaterial');

    // Contact materials define friction and restitution between physics materials
    const groundPlayerCM = new CANNON.ContactMaterial(groundMaterial, playerMaterial, {
        friction: 0.1, // Low friction for player on ground
        restitution: 0.0,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3
    });
    world.addContactMaterial(groundPlayerCM);

    const groundVehicleCM = new CANNON.ContactMaterial(groundMaterial, vehicleMaterial, {
        friction: 0.3, // Higher friction for vehicles on ground
        restitution: 0.0, // No bounce
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3
    });
    world.addContactMaterial(groundVehicleCM);

    const playerVehicleCM = new CANNON.ContactMaterial(playerMaterial, vehicleMaterial, {
        friction: 0.1,
        restitution: 0.0
    });
    world.addContactMaterial(playerVehicleCM);

    // Handle window resize for renderer, camera, and composer
    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
        composer.setSize(width, height);
        ssaoPass.setSize(width, height); // Ensure SSAOPass also resizes
    });
}
