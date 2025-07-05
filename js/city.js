import * as THREE from 'three';
// GLTFLoader and model/texture specific paths are removed
import { scene, world } from './scene.js';
import { updateProgress } from './ui.js';
import { Vehicle } from './vehicle.js'; // Still needed for parked cars

// Removed all asset path definitions (buildingModelPaths, natureModelPaths, etc.)
// Removed all loaded asset stores (loadedBuildingModels, loadedNatureModels, etc.)
// Removed all loading managers and GLTF/Texture loaders

let cityFullyInitialized = false; // Keep this to prevent re-initialization if structure demands

// Removed preLoadAllAssets function

const parkZones = [ // Keep park zone definitions for layout purposes
    { x: -150, z: -150, width: 80, depth: 120, name: "SouthWestPark" },
    { x: 100, z: 120, width: 100, depth: 70, name: "NorthEastPark" },
];

export function createCity(onCityCreated) {
    if (cityFullyInitialized) {
        if (onCityCreated) onCityCreated(createRoadSystem()); // Pass parked cars from road system
        return;
    }

    // No more pre-loading here, directly create city elements
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, side: THREE.DoubleSide });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);
    const groundBody = new CANNON.Body({ mass: 0 });
    const groundShape = new CANNON.Plane();
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    const parkedCars = createRoadSystem(); // Roads and parked cars
    createParkAreas(); // Simple colored parks

    // Building Generation - Reverted to procedural boxes
    const buildingCount = 50;
    const buildingColors = [0x8c7b6b, 0x7d8a8a, 0x9d7a7a, 0x6b8c7b, 0xA0A0A0, 0x606060];
    for (let i = 0; i < buildingCount; i++) {
        const xPos = (Math.random() - 0.5) * 400;
        const zPos = (Math.random() - 0.5) * 400;

        let inPark = false;
        for (const park of parkZones) {
            if (xPos > park.x - park.width / 2 && xPos < park.x + park.width / 2 &&
                zPos > park.z - park.depth / 2 && zPos < park.z + park.depth / 2) {
                inPark = true; break;
            }
        }
        if (inPark || (Math.abs(xPos) < 60 && Math.abs(zPos) < 60)) continue; // Skip parks and center

        const w = Math.random() * 20 + 10;
        const h = Math.random() * 60 + 20;
        const d = Math.random() * 20 + 10;
        const mat = new THREE.MeshStandardMaterial({ color: buildingColors[Math.floor(Math.random() * buildingColors.length)], metalness: 0.1, roughness: 0.8 });
        const geo = new THREE.BoxGeometry(w, h, d);
        const buildingMesh = new THREE.Mesh(geo, mat);
        buildingMesh.position.set(xPos, h / 2, zPos);
        buildingMesh.castShadow = true;
        buildingMesh.receiveShadow = true;
        scene.add(buildingMesh);
        const shape = new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2));
        const body = new CANNON.Body({ mass: 0 });
        body.addShape(shape);
        body.position.copy(buildingMesh.position);
        world.addBody(body);
    }

    updateProgress(2); // Adjusted progress step, assuming less loading now
    cityFullyInitialized = true;
    if (onCityCreated) onCityCreated(parkedCars);
}

function createParkAreas() {
    // Simplified parks: just colored planes
    const parkMaterial = new THREE.MeshStandardMaterial({ color: 0x33691e, side: THREE.DoubleSide }); // Dark green
    parkZones.forEach(zone => {
        const parkGeo = new THREE.PlaneGeometry(zone.width, zone.depth);
        const parkMesh = new THREE.Mesh(parkGeo, parkMaterial);
        parkMesh.rotation.x = -Math.PI / 2;
        parkMesh.position.set(zone.x, 0.06, zone.z); // Slightly above ground
        parkMesh.receiveShadow = true; // Parks can receive shadows
        scene.add(parkMesh);

        // Optional: Add a few simple cube "trees/benches" if desired
        const itemCount = Math.floor((zone.width * zone.depth) / 200);
        const itemMaterial = new THREE.MeshStandardMaterial({color: 0x8B4513}); // Brown for "tree trunks" or "benches"
        for(let i=0; i < itemCount; i++) {
            const itemWidth = 1 + Math.random()*2;
            const itemHeight = 2 + Math.random()*5;
            const itemDepth = 1 + Math.random()*2;
            const itemGeo = new THREE.BoxGeometry(itemWidth, itemHeight, itemDepth);
            const itemMesh = new THREE.Mesh(itemGeo, itemMaterial);
            const itemX = zone.x + (Math.random() - 0.5) * zone.width * 0.9;
            const itemZ = zone.z + (Math.random() - 0.5) * zone.depth * 0.9;
            itemMesh.position.set(itemX, itemHeight/2, itemZ);
            itemMesh.castShadow = true;
            scene.add(itemMesh);
        }
    });
}

function createRoadSystem() {
    // Reverted to simple colored roads
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const roadHeight = 0.05;
    const roadSegmentWidth = 15;

    for (let i = -200; i <= 200; i += 100) {
        const roadGeoH = new THREE.PlaneGeometry(500, roadSegmentWidth);
        const roadMeshH = new THREE.Mesh(roadGeoH, roadMaterial);
        roadMeshH.rotation.x = -Math.PI / 2;
        roadMeshH.position.y = roadHeight;
        roadMeshH.position.z = i;
        roadMeshH.receiveShadow = true;
        scene.add(roadMeshH);

        if (Math.abs(i) < 200) {
            const roadGeoV = new THREE.PlaneGeometry(roadSegmentWidth, 485);
            const roadMeshV = new THREE.Mesh(roadGeoV, roadMaterial);
            roadMeshV.rotation.x = -Math.PI / 2;
            roadMeshV.position.y = roadHeight;
            roadMeshV.position.x = i;
            roadMeshV.receiveShadow = true;
            scene.add(roadMeshV);
        }
    }

    const parkedCars = [];
    for (let i = 0; i < 10; i++) {
        const x = (Math.random() - 0.5) * 350;
        const z = (Math.random() - 0.5) * 350;
        if (Math.abs(x) < 70 && Math.abs(z) < 70) continue;
        let inPark = false;
        for (const park of parkZones) {
            if (x > park.x - park.width/2 && x < park.x + park.width/2 && z > park.z - park.depth/2 && z < park.z + park.depth/2) {
                inPark = true; break;
            }
        }
        if (inPark) continue;
        // Vehicle constructor will now use procedural box by default
        const parkedCar = new Vehicle(new THREE.Vector3(x, 0.6, z)); // Y pos might need slight adjustment for box vehicle
        if(parkedCar.mesh) parkedCar.mesh.rotation.y = Math.random() * Math.PI * 2;
        parkedCars.push(parkedCar);
    }
    return parkedCars;
}

export { createCity };
