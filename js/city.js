import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { scene, world } from './scene.js';
import { updateProgress } from './ui.js';
import { Vehicle } from './vehicle.js';

// --- Asset Paths ---
const buildingModelPaths = [
    'models/buildings/KenneyCityKitCommercial/building_A.gltf',
    'models/buildings/KenneyCityKitCommercial/building_B.gltf',
    'models/buildings/KenneyCityKitSuburban/house_A.gltf',
];
const natureModelPaths = {
    tree: [
        'models/nature/KenneyNatureKit/tree_pineDefaultA.gltf',
        'models/nature/KenneyNatureKit/tree_oakDefaultB.gltf',
    ],
    bench: ['models/props/KenneyCityProps/bench.gltf']
};
const roadModelPaths = { // Placeholder paths for modular road pieces
    straight: 'models/roads/KenneyCityRoads/road_straight.gltf',
    intersection: 'models/roads/KenneyCityRoads/road_intersection.gltf',
    curve: 'models/roads/KenneyCityRoads/road_curve.gltf',
};
const texturePaths = {
    grass: 'models/textures/KenneyGroundTextures/grass_01.png',
    road: 'models/textures/KenneyRoadTextures/asphalt_01.png' // Placeholder road texture
};

// --- Loaded Assets ---
const loadedBuildingModels = [];
const loadedNatureModels = { tree: [], bench: [] };
const loadedRoadModels = { straight: null, intersection: null, curve: null }; // Store loaded road pieces
const loadedTextures = { grass: null, road: null };

// --- Loading Managers and Loaders ---
const generalLoadingManager = new THREE.LoadingManager();
const gltfLoader = new GLTFLoader(generalLoadingManager); // Single GLTF loader for all models
const textureLoader = new THREE.TextureLoader(generalLoadingManager);

let assetsFullyLoaded = false;

// --- Asset Pre-loading Functions ---
function preLoadAllAssets(callback) {
    let itemsToLoad = buildingModelPaths.length +
                      natureModelPaths.tree.length +
                      natureModelPaths.bench.length +
                      (texturePaths.grass ? 1 : 0) +
                      (texturePaths.road ? 1 : 0) +
                      Object.values(roadModelPaths).filter(p => p).length; // Count valid road model paths
    let itemsLoaded = 0;

    if (itemsToLoad === 0) {
        assetsFullyLoaded = true;
        callback();
        return;
    }

    generalLoadingManager.onError = (url) => console.error('Error loading asset:', url);
    const assetLoadCallback = () => { // Renamed for clarity
        itemsLoaded++;
        if (itemsLoaded === itemsToLoad) {
            assetsFullyLoaded = true;
            callback();
        }
    };

    buildingModelPaths.forEach(path => gltfLoader.load(path, gltf => { loadedBuildingModels.push(gltf.scene); assetLoadCallback(); }, undefined, assetLoadCallback));
    natureModelPaths.tree.forEach(path => gltfLoader.load(path, gltf => { loadedNatureModels.tree.push(gltf.scene); assetLoadCallback(); }, undefined, assetLoadCallback));
    natureModelPaths.bench.forEach(path => gltfLoader.load(path, gltf => { loadedNatureModels.bench.push(gltf.scene); assetLoadCallback(); }, undefined, assetLoadCallback));

    // Load road models
    for (const type in roadModelPaths) {
        if (roadModelPaths[type]) {
            gltfLoader.load(roadModelPaths[type], gltf => { loadedRoadModels[type] = gltf.scene; assetLoadCallback(); }, undefined, assetLoadCallback);
        }
    }

    if (texturePaths.grass) {
        textureLoader.load(texturePaths.grass, texture => {
            loadedTextures.grass = texture;
            loadedTextures.grass.wrapS = loadedTextures.grass.wrapT = THREE.RepeatWrapping;
            assetLoadCallback();
        }, undefined, assetLoadCallback);
    }
    if (texturePaths.road) {
        textureLoader.load(texturePaths.road, texture => {
            loadedTextures.road = texture;
            loadedTextures.road.wrapS = loadedTextures.road.wrapT = THREE.RepeatWrapping;
            assetLoadCallback();
        }, undefined, assetLoadCallback);
    }
}

const parkZones = [
    { x: -150, z: -150, width: 80, depth: 120, name: "SouthWestPark" },
    { x: 100, z: 120, width: 100, depth: 70, name: "NorthEastPark" },
];

export function createCity(onCityCreated) {
    if (assetsFullyLoaded) {
        if (onCityCreated) onCityCreated(createRoadSystem());
        return;
    }
    preLoadAllAssets(() => {
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

        const parkedCars = createRoadSystem();
        createParkAreas();

        const buildingCount = 50;
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
            if (inPark || (Math.abs(xPos) < 60 && Math.abs(zPos) < 60)) continue;

            if (loadedBuildingModels.length > 0) {
                const modelIndex = Math.floor(Math.random() * loadedBuildingModels.length);
                const buildingMesh = loadedBuildingModels[modelIndex].clone();
                const scale = 8 + Math.random() * 12;
                buildingMesh.scale.set(scale, scale, scale);
                const box = new THREE.Box3().setFromObject(buildingMesh);
                const size = new THREE.Vector3(); box.getSize(size);
                buildingMesh.position.set(xPos, 0, zPos);
                buildingMesh.traverse(node => { if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; } });
                buildingMesh.rotation.y = Math.random() * Math.PI * 2;
                scene.add(buildingMesh);
                const shape = new CANNON.Box(new CANNON.Vec3(size.x/2, size.y/2, size.z/2));
                const body = new CANNON.Body({ mass: 0 }); body.addShape(shape);
                body.position.set(xPos, size.y/2, zPos);
                body.quaternion.copy(buildingMesh.quaternion);
                world.addBody(body);
            } else {
                const w = Math.random()*20+10; const h = Math.random()*60+20; const d = Math.random()*20+10;
                const mat = new THREE.MeshStandardMaterial({color: 0x777777}); const geo = new THREE.BoxGeometry(w,h,d);
                const mesh = new THREE.Mesh(geo,mat); mesh.position.set(xPos,h/2,zPos); scene.add(mesh);
                const shape = new CANNON.Box(new CANNON.Vec3(w/2,h/2,d/2)); const body = new CANNON.Body({mass:0});
                body.addShape(shape); body.position.copy(mesh.position); world.addBody(body);
            }
        }
        updateProgress(4); // Increment progress step
        if (onCityCreated) onCityCreated(parkedCars);
    });
}

function createParkAreas() {
    if (loadedTextures.grass) {
        parkZones.forEach(zone => {
            const grassGeo = new THREE.PlaneGeometry(zone.width, zone.depth);
            const grassMat = new THREE.MeshStandardMaterial({ map: loadedTextures.grass });
            grassMat.map.repeat.set(zone.width / 10, zone.depth / 10);
            const grassMesh = new THREE.Mesh(grassGeo, grassMat);
            grassMesh.rotation.x = -Math.PI / 2;
            grassMesh.position.set(zone.x, 0.06, zone.z);
            grassMesh.receiveShadow = true;
            scene.add(grassMesh);

            if (loadedNatureModels.tree.length > 0) {
                const treeCount = Math.floor((zone.width * zone.depth) / 100);
                for (let i = 0; i < treeCount; i++) {
                    const treeModel = loadedNatureModels.tree[Math.floor(Math.random()*loadedNatureModels.tree.length)].clone();
                    const treeScale = 2 + Math.random() * 3;
                    treeModel.scale.set(treeScale, treeScale, treeScale);
                    const treeX = zone.x + (Math.random() - 0.5) * zone.width;
                    const treeZ = zone.z + (Math.random() - 0.5) * zone.depth;
                    treeModel.position.set(treeX, 0, treeZ);
                    treeModel.traverse(n => { if (n.isMesh) n.castShadow = true; });
                    scene.add(treeModel);
                }
            }
            if (loadedNatureModels.bench.length > 0) {
                const benchCount = Math.floor((zone.width * zone.depth) / 200);
                for (let i = 0; i < benchCount; i++) {
                    const benchModel = loadedNatureModels.bench[0].clone();
                    const benchScale = 1.5 + Math.random() * 0.5;
                    benchModel.scale.set(benchScale, benchScale, benchScale);
                    const benchX = zone.x + (Math.random() - 0.5) * zone.width * 0.8;
                    const benchZ = zone.z + (Math.random() - 0.5) * zone.depth * 0.8;
                    benchModel.position.set(benchX, 0, benchZ);
                    benchModel.rotation.y = Math.random() * Math.PI * 2;
                    benchModel.traverse(n => { if (n.isMesh) n.castShadow = true; });
                    scene.add(benchModel);
                }
            }
        });
    } else console.warn("Grass texture not loaded.");
}

function createRoadSystem() {
    let roadMaterial;
    if (loadedTextures.road) {
        roadMaterial = new THREE.MeshStandardMaterial({ map: loadedTextures.road });
    } else {
        console.warn("Road texture not loaded, using fallback color.");
        roadMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    }

    const roadHeight = 0.05; // Common height for roads
    const roadSegmentWidth = 15; // Standard width of a road segment

    // --- Placeholder for modular road system ---
    // if (loadedRoadModels.straight && loadedRoadModels.intersection && loadedRoadModels.curve) {
    //    console.log("Modular road models loaded, but system not yet implemented. Using planes.");
    // }
    // --- End placeholder ---

    for (let i = -200; i <= 200; i += 100) { // Main grid lines
        // Horizontal road
        const roadGeoH = new THREE.PlaneGeometry(500, roadSegmentWidth);
        const roadMeshH = new THREE.Mesh(roadGeoH, roadMaterial);
        roadMeshH.rotation.x = -Math.PI / 2;
        roadMeshH.position.y = roadHeight;
        roadMeshH.position.z = i;
        roadMeshH.receiveShadow = true;
        if (loadedTextures.road) { // Apply texture repeat
            roadMeshH.material.map.repeat.set(500 / (roadSegmentWidth * 2), 1); // Adjust U/V repeat
            roadMeshH.material.map.wrapS = THREE.RepeatWrapping;
            roadMeshH.material.map.wrapT = THREE.RepeatWrapping;
        }
        scene.add(roadMeshH);

        // Vertical road
        if (Math.abs(i) < 200) {
            const roadGeoV = new THREE.PlaneGeometry(roadSegmentWidth, 485); // Length was 485
            const roadMeshV = new THREE.Mesh(roadGeoV, roadMaterial);
            roadMeshV.rotation.x = -Math.PI / 2;
            roadMeshV.position.y = roadHeight;
            roadMeshV.position.x = i;
            roadMeshV.receiveShadow = true;
            if (loadedTextures.road) { // Apply texture repeat
                 roadMeshV.material.map.repeat.set(1, 485 / (roadSegmentWidth * 2)); // Adjust U/V repeat
                 roadMeshV.material.map.wrapS = THREE.RepeatWrapping;
                 roadMeshV.material.map.wrapT = THREE.RepeatWrapping;
            }
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
        const parkedCar = new Vehicle(new THREE.Vector3(x, 0.5, z));
        if(parkedCar.mesh) parkedCar.mesh.rotation.y = Math.random() * Math.PI * 2;
        parkedCars.push(parkedCar);
    }
    return parkedCars;
}

export { createCity };
