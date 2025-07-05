import * as THREE from 'three';
// Removed GLTFLoader and model-specific imports/variables
import { scene, world, vehicleMaterial, camera } from './scene.js';
import { keys } from './main.js'; // Assuming keys is still needed from main for controls
import { speedValue } from './ui.js';

// Removed carModelPaths, loadedCarModels, preLoadCarModels, etc.

class Vehicle {
    constructor(position, color = 0xff4444) { // modelPathOrColor changed back to just color
        this.isDriven = false;
        this.steering = 0;
        this.speed = 0;

        // Default procedural box for vehicle
        const chassisWidth = 2.5;
        const chassisHeight = 1.2;
        const chassisDepth = 4.5;

        const geometry = new THREE.BoxGeometry(chassisWidth, chassisHeight, chassisDepth);
        const material = new THREE.MeshStandardMaterial({
            color: color, // Use the passed color
            metalness: 0.3, // Adjusted for a more car-like look
            roughness: 0.6  // Adjusted
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.position.copy(position);
        // Ensure vehicle mesh is placed appropriately on the ground if position.y is its center
        this.mesh.position.y = position.y + chassisHeight / 2;
        scene.add(this.mesh);

        // Physics
        const chassisShape = new CANNON.Box(new CANNON.Vec3(chassisWidth / 2, chassisHeight / 2, chassisDepth / 2));
        this.body = new CANNON.Body({ mass: 400, material: vehicleMaterial }); // Mass can be tuned
        this.body.addShape(chassisShape); // Shape is centered in the body by default
        this.body.position.copy(this.mesh.position); // Physics body also centered at mesh position

        // Dampening helps stabilize physics
        this.body.linearDamping = 0.1;
        this.body.angularDamping = 0.5;

        world.addBody(this.body);

        // Store chassis dimensions for later use if needed (e.g. camera offset)
        this.chassisHeight = chassisHeight;
    }

    update(deltaTime) {
        if (!this.mesh || !this.body) return;

        // Sync mesh to physics body
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);

        if (this.isDriven) {
            const maxSteerVal = 0.5;
            const accelerationForce = 800; // Tuned force value
            const brakingForce = 1200;   // Tuned force value
            const friction = 0.5; // Custom friction/drag factor

            // Steering: Apply torque for rotation
            let steerInput = 0;
            if (keys['a']) steerInput = maxSteerVal;
            if (keys['d']) steerInput = -maxSteerVal;

            // More realistic steering: reduce torque at high speeds, increase at low.
            const speedFactor = Math.max(0.1, 1 - this.body.velocity.length() / 10); // Example speed factor
            this.body.angularVelocity.y = steerInput * speedFactor * 5 ; // Apply torque directly related to input and speed


            // Acceleration/Braking: Apply force along vehicle's local Z-axis
            let engineForce = 0;
            if (keys['w']) {
                engineForce = -accelerationForce; // Negative Z is forward for vehicle model
            }
            if (keys['s']) {
                // If moving forward, brake; otherwise, reverse
                const localVelocity = new CANNON.Vec3();
                this.body.vectorToLocalFrame(this.body.velocity, localVelocity);
                if (localVelocity.z < -0.1) { // Moving forward
                    engineForce = brakingForce;
                } else {
                    engineForce = accelerationForce * 0.7; // Reverse force
                }
            }

            const forceDirection = new CANNON.Vec3(0, 0, engineForce);
            this.body.applyLocalForce(forceDirection, new CANNON.Vec3(0, 0, 0)); // Apply at center of mass

            // Custom Drag/Friction (simple model)
            const dragForce = this.body.velocity.clone().scale(-friction);
            this.body.applyForce(dragForce, this.body.position);


            // Update UI Speedometer
            const linearVelocity = this.body.velocity;
            this.speed = Math.sqrt(linearVelocity.x * linearVelocity.x + linearVelocity.z * linearVelocity.z) * 3.6; // km/h
            if (speedValue) speedValue.textContent = Math.abs(Math.round(this.speed));

            // Camera follow logic
            if (camera && this.mesh) {
                const cameraOffset = new THREE.Vector3(0, 4, 8); // Adjusted offset Y and Z
                const worldOffset = this.mesh.localToWorld(cameraOffset.clone());
                camera.position.lerp(worldOffset, 0.1); // Smoother lerp

                const lookAtPosition = this.mesh.position.clone().add(new THREE.Vector3(0, this.chassisHeight * 0.5 ,0)); // Look at center of car mass
                camera.lookAt(lookAtPosition);
            }
        }
    }
}

// Export only the Vehicle class, no pre-loading functions needed for procedural version
export { Vehicle };
