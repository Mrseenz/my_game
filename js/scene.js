import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export let scene, camera, renderer, world;
export let groundMaterial, playerMaterial, vehicleMaterial;

export function initScene() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    // Renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Physics world
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);
    world.broadphase = new CANNON.SAPBroadphase(world);

    // Materials
    groundMaterial = new CANNON.Material('groundMaterial');
    playerMaterial = new CANNON.Material('playerMaterial');
    vehicleMaterial = new CANNON.Material('vehicleMaterial');

    const groundPlayerCM = new CANNON.ContactMaterial(groundMaterial, playerMaterial, {
        friction: 0.0,
        restitution: 0.0,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3
    });
    world.addContactMaterial(groundPlayerCM);

    const groundVehicleCM = new CANNON.ContactMaterial(groundMaterial, vehicleMaterial, {
        friction: 0.3,
        restitution: 0.1,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3
    });
    world.addContactMaterial(groundVehicleCM);

    const playerVehicleCM = new CANNON.ContactMaterial(playerMaterial, vehicleMaterial, {
        friction: 0.1,
        restitution: 0.0,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3
    });
    world.addContactMaterial(playerVehicleCM);

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
