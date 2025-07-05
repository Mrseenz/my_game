import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { scene, world, vehicleMaterial, camera } from './scene.js';
import { keys } from './main.js';
import { speedValue } from './ui.js';

// Placeholder car model paths - adjust these to your actual file paths
const carModelPaths = [
    'models/vehicles/KenneyToyCarKit/car_sedan.gltf',
    'models/vehicles/KenneyToyCarKit/car_suv.gltf',
    'models/vehicles/KenneyToyCarKit/car_van.gltf',
];
const loadedCarModels = {}; // Use an object to store by path for easy lookup
let carModelsLoadedCount = 0;
let allCarModelsAttemptedLoad = false;

const carLoadingManager = new THREE.LoadingManager();
const carGltfLoader = new GLTFLoader(carLoadingManager);

// Function to call when all car models are processed (loaded or failed)
let onAllCarModelsLoadedCallback = null;

carLoadingManager.onLoad = () => {
    // This is called when all models in the manager have successfully loaded.
    // However, we also need to handle individual load errors.
    // The check for allCarModelsAttemptedLoad combined with modelsLoadedCount handles this.
};

function preLoadCarModels(callback) {
    onAllCarModelsLoadedCallback = callback;
    if (carModelPaths.length === 0) {
        console.warn("No car model paths defined.");
        allCarModelsAttemptedLoad = true;
        if (onAllCarModelsLoadedCallback) onAllCarModelsLoadedCallback();
        return;
    }

    carModelPaths.forEach(path => {
        carGltfLoader.load(path, (gltf) => {
            loadedCarModels[path] = gltf.scene;
            carModelsLoadedCount++;
            checkAllCarModelsProcessed();
        }, undefined, (error) => {
            console.error(`Error loading car model: ${path}`, error);
            carModelsLoadedCount++; // Still count as processed
            checkAllCarModelsProcessed();
        });
    });
}

function checkAllCarModelsProcessed() {
    if (carModelsLoadedCount === carModelPaths.length) {
        allCarModelsAttemptedLoad = true;
        if (onAllCarModelsLoadedCallback) {
            onAllCarModelsLoadedCallback();
        }
    }
}


class Vehicle {
    // Constructor now takes a modelPath (optional)
    constructor(position, modelPathOrColor = 0xff4444) {
        this.isDriven = false;
        this.steering = 0;
        this.speed = 0;
        this.mesh = null; // Initialize mesh as null

        const chosenModelPath = typeof modelPathOrColor === 'string' ? modelPathOrColor : carModelPaths[Math.floor(Math.random() * carModelPaths.length)];

        if (loadedCarModels[chosenModelPath]) {
            this.mesh = loadedCarModels[chosenModelPath].clone();
            this.mesh.traverse(node => {
                if (node.isMesh) {
                    node.castShadow = true;
                    // node.receiveShadow = true; // Optional for cars
                }
            });
            // --- Scale and Physics Dimensions (CRITICAL - NEEDS USER ADJUSTMENT) ---
            // Kenney car models are often small, scale them up.
            const scale = 1.5; // Example scale, adjust as needed!
            this.mesh.scale.set(scale, scale, scale);

            // Estimate dimensions for physics AFTER scaling
            const boundingBox = new THREE.Box3().setFromObject(this.mesh);
            const size = new THREE.Vector3();
            boundingBox.getSize(size);

            this.chassisWidth = size.x;
            this.chassisHeight = size.y;
            this.chassisDepth = size.z;
            // --- End Critical Adjustment Section ---

        } else {
            // Fallback to box geometry if model fails or not specified
            console.warn(`Vehicle model ${chosenModelPath} not loaded or specified, using fallback box.`);
            const color = typeof modelPathOrColor === 'number' ? modelPathOrColor : 0xff4444;
            const geometry = new THREE.BoxGeometry(2.5, 1.2, 4.5); // Original dimensions
            const material = new THREE.MeshStandardMaterial({
                color: color,
                metalness: 0.5,
                roughness: 0.4
            });
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.castShadow = true;
            this.chassisWidth = 2.5;
            this.chassisHeight = 1.2;
            this.chassisDepth = 4.5;
        }

        this.mesh.position.copy(position);
        scene.add(this.mesh);

        // Physics
        // Adjust Y position of shape if model pivot isn't at its center.
        // For Cannon, Box shape dimensions are half-extents.
        const chassisShape = new CANNON.Box(new CANNON.Vec3(this.chassisWidth / 2, this.chassisHeight / 2, this.chassisDepth / 2));
        this.body = new CANNON.Body({ mass: 350, material: vehicleMaterial }); // Reduced mass a bit

        // If car model's pivot point is at its base, offset the shape upwards
        // Example: new CANNON.Vec3(0, this.chassisHeight / 2, 0)
        // If car model's pivot point is at its center, no offset for the shape needed.
        // Assuming pivot at base for now, like many Kenney models after import.
        this.body.addShape(chassisShape, new CANNON.Vec3(0, this.chassisHeight / 2, 0));
        this.body.position.copy(this.mesh.position);
        // Adjust y if mesh is not at ground level due to model pivot
        this.body.position.y += this.chassisHeight / 2;


        world.addBody(this.body);
    }

    update(deltaTime) {
        if (!this.mesh || !this.body) return;

        this.mesh.position.copy(this.body.position);
        // Adjust visual mesh position if physics body has an offset (e.g. due to shape offset)
        this.mesh.position.y -= this.chassisHeight / 2; // Counteract the physics body y offset for visual
        this.mesh.quaternion.copy(this.body.quaternion);


        if (this.isDriven) {
            const maxSteerVal = 0.6; // Adjusted for potentially more responsive steering
            const acceleration = 2200; // Adjusted
            const brakingForce = 2500; // Adjusted

            // Steering
            this.steering *= 0.85;
            if (keys['a']) this.steering += maxSteerVal * deltaTime * 6; // Faster steering input
            if (keys['d']) this.steering -= maxSteerVal * deltaTime * 6;
            this.steering = Math.max(-maxSteerVal, Math.min(maxSteerVal, this.steering));

            this.body.angularVelocity.y = this.steering * this.body.velocity.length() * 0.2; // Velocity dependent steering

            // Acceleration/Braking
            let engineForce = 0;
            const currentSpeed = this.body.velocity.length();

            if (keys['w']) {
                 engineForce = -acceleration;
            }
            if (keys['s']) {
                if (currentSpeed > 0.1) engineForce = brakingForce; // Brake if moving forward
                else engineForce = acceleration * 0.7; // Reverse
            }

            const forward = new CANNON.Vec3();
            this.body.vectorToWorldFrame(new CANNON.Vec3(0,0,-1), forward); // Z is forward in local space for Cannon.js vehicle

            // Only apply force if there's input
            if (Math.abs(engineForce) > 0) {
                 this.body.applyLocalForce(new CANNON.Vec3(0, 0, engineForce * deltaTime * 100), new CANNON.Vec3(0,0,0));
            }


            // Calculate speed in km/h for UI
            const velocityVec = this.body.velocity;
            this.speed = Math.sqrt(velocityVec.x * velocityVec.x + velocityVec.z * velocityVec.z) * 3.6;
            if (speedValue) speedValue.textContent = Math.abs(Math.round(this.speed));

            // Update camera to follow vehicle
            if (camera && this.mesh) {
                const cameraOffset = new THREE.Vector3(0, 3, 7); // Adjusted camera offset
                const rotatedOffset = cameraOffset.clone().applyQuaternion(this.mesh.quaternion);
                const targetPosition = this.mesh.position.clone().add(rotatedOffset);
                targetPosition.y += 1.0; // Look slightly above the car center
                camera.position.lerp(targetPosition, 0.08); // Smoother lerp
                camera.lookAt(this.mesh.position.clone().add(new THREE.Vector3(0,1,0)));
            }
        }
    }
}

// Export preLoadCarModels to be called from main.js
export { Vehicle, preLoadCarModels, allCarModelsAttemptedLoad, loadedCarModels };
