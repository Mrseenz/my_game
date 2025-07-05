import { scene, world, vehicleMaterial } from './scene.js';
import { keys, speedValue } from './main.js';

class Vehicle {
    constructor(position, color = 0xff4444) {
        // Visuals
        const geometry = new THREE.BoxGeometry(2.5, 1.2, 4.5);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.5,
            roughness: 0.4
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.position.copy(position);
        scene.add(this.mesh);

        // Physics
        const chassisShape = new CANNON.Box(new CANNON.Vec3(1.25, 0.6, 2.25));
        this.body = new CANNON.Body({ mass: 800, material: vehicleMaterial });
        this.body.addShape(chassisShape);
        this.body.position.copy(this.mesh.position);
        world.addBody(this.body);

        this.isDriven = false;
        this.steering = 0;
        this.speed = 0;
    }

    update(deltaTime) {
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);

        if (this.isDriven) {
            const maxSteerVal = 0.8;
            const acceleration = 1800;
            const brakingForce = 2000;

            // Steering
            this.steering *= 0.9; // Natural steering return
            if (keys['a']) this.steering += maxSteerVal * deltaTime * 5;
            if (keys['d']) this.steering -= maxSteerVal * deltaTime * 5;
            this.steering = Math.max(-maxSteerVal, Math.min(maxSteerVal, this.steering));

            // Apply steering rotation
            this.body.angularVelocity.y = this.steering * 4;

            // Acceleration/Braking
            let engineForce = 0;
            if (keys['w']) engineForce = -acceleration; // Forward
            if (keys['s']) engineForce = brakingForce; // Brake/Reverse

            // Calculate forward direction
            const forward = new CANNON.Vec3(0, 0, -1);
            this.body.vectorToWorldFrame(forward, forward);
            forward.normalize();

            // Apply force
            this.body.applyForce(forward.mult(engineForce), this.body.position);

            // Calculate speed in km/h
            const velocity = this.body.velocity;
            this.speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z) * 3.6;
            speedValue.textContent = Math.abs(Math.round(this.speed));

            // Update camera to follow vehicle
            const cameraOffset = new THREE.Vector3(0, 4, -10);
            const rotatedOffset = cameraOffset.clone().applyQuaternion(this.mesh.quaternion);
            const targetPosition = this.mesh.position.clone().add(rotatedOffset);
            camera.position.lerp(targetPosition, 0.1);
            camera.lookAt(this.mesh.position);
        }
    }
}

export { Vehicle };
