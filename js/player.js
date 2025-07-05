import { scene, camera, world, playerMaterial } from './scene.js';
import { keys, canInteractWithVehicle, closestVehicle } from './main.js'; // Removed vehicle
import { modeIndicator, speedValue } from './ui.js';

/**
 * Player class representing the main character in the game.
 */
class Player {
    constructor() {
        // Visuals
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
        const material = new THREE.MeshStandardMaterial({
            color: 0x44aa88,
            metalness: 0.3,
            roughness: 0.7
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.position.set(0, 5, 10);
        scene.add(this.mesh);

        // Physics
        const radius = 0.5;
        const height = 1.5;
        this.body = new CANNON.Body({ mass: 70, material: playerMaterial });

        // Create a capsule shape
        const sphereShape = new CANNON.Sphere(radius);
        this.body.addShape(sphereShape, new CANNON.Vec3(0, height/2, 0));
        this.body.addShape(sphereShape, new CANNON.Vec3(0, -height/2, 0));

        this.body.position.copy(this.mesh.position);
        this.body.linearDamping = 0.1;
        this.body.angularDamping = 1.0;
        world.addBody(this.body);

        this.isOnGround = false;
        this.isInVehicle = false;
        this.sprinting = false;

        // Camera
        this.cameraOffset = new THREE.Vector3(0, 2.5, -5);
        camera.position.copy(this.mesh.position).add(this.cameraOffset);
        camera.lookAt(this.mesh.position);

        // Animation state
        this.walkCycle = 0;
    }

    update(deltaTime) {
        if (this.isInVehicle && closestVehicle) { // Added check for closestVehicle
            this.body.position.copy(closestVehicle.body.position);
            this.mesh.position.copy(this.body.position);
            this.mesh.visible = false;
            this.body.sleep();
            return;
        }

        this.mesh.visible = true;
        if (this.body.sleepState === CANNON.Body.SLEEPING) this.body.wakeUp();

        // Movement
        const speed = this.sprinting ? 60000 : 40000; // Increased speed by 10x
        const moveDirection = new THREE.Vector3();

        if (keys['w']) moveDirection.z -= 1;
        if (keys['s']) moveDirection.z += 1;
        if (keys['a']) moveDirection.x -= 1;
        if (keys['d']) moveDirection.x += 1;

        moveDirection.normalize();

        // Apply rotation from camera
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0;
        cameraDirection.normalize();

        const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), cameraDirection).normalize();

        const forward = cameraDirection.clone();
        const finalMove = new THREE.Vector3();
        finalMove.add(forward.multiplyScalar(moveDirection.z));
        finalMove.add(right.multiplyScalar(moveDirection.x));

        // Apply movement force
        this.body.applyForce(
            new CANNON.Vec3(finalMove.x * speed * deltaTime, 0, finalMove.z * speed * deltaTime),
            this.body.position
        );

        // Jump
        this.checkIfOnGround();
        if ((keys[' '] || keys['Spacebar']) && this.isOnGround) {
            this.body.velocity.y = 12;
            this.isOnGround = false;
        }

        // Sprint
        this.sprinting = keys['Shift'] || false;

        // Sync mesh to physics body
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);

        // Update camera
        const targetPosition = this.mesh.position.clone().add(this.cameraOffset);
        camera.position.lerp(targetPosition, 0.1);
        camera.lookAt(this.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0)));

        // Walking animation
        if (moveDirection.length() > 0 && this.isOnGround) {
            this.walkCycle += deltaTime * 10;
            this.mesh.rotation.z = Math.sin(this.walkCycle) * 0.05;
            this.mesh.position.y += Math.sin(this.walkCycle * 2) * 0.02;
        }
    }

    checkIfOnGround() {
        const from = this.body.position;
        const to = new CANNON.Vec3(from.x, from.y - 1.1, from.z);
        const result = new CANNON.RaycastResult();
        world.raycastClosest(from, to, {}, result);
        this.isOnGround = result.hasHit;
    }

    toggleVehicle() {
        if (this.isInVehicle && closestVehicle) { // Added check for closestVehicle
            this.isInVehicle = false;
            closestVehicle.isDriven = false; // Changed vehicle to closestVehicle
            this.body.position.x += 3;
            this.body.wakeUp();
            modeIndicator.textContent = "PEDESTRIAN MODE";
        } else if (canInteractWithVehicle && closestVehicle) {
            this.isInVehicle = true;
            // vehicle = closestVehicle; // This line is problematic, global vehicle is not used anymore.
            closestVehicle.isDriven = true; // Changed vehicle to closestVehicle
            modeIndicator.textContent = "VEHICLE MODE";
        }
    }
}

export { Player };
