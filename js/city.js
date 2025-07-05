/**
 * Creates the city environment including ground, roads, and buildings.
 */
function createCity() {
    // Ground
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    const groundMat = new THREE.MeshStandardMaterial({ 
        color: 0x3a4a5a, 
        side: THREE.DoubleSide
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);
    
    // Ground physics
    const groundBody = new CANNON.Body({ mass: 0 });
    const groundShape = new CANNON.Plane();
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);
    
    // Roads
    createRoadSystem();
    
    // Optimized building generation
    const buildingColors = [0x8c7b6b, 0x7d8a8a, 0x9d7a7a, 0x6b8c7b];
    const buildingCount = 50;
    
    // Create buildings
    for (let i = 0; i < buildingCount; i++) {
        const w = Math.random() * 30 + 15;
        const h = Math.random() * 80 + 30;
        const d = Math.random() * 30 + 15;
        const x = (Math.random() - 0.5) * 400;
        const z = (Math.random() - 0.5) * 400;
        
        // Skip buildings near center
        if (Math.abs(x) < 100 && Math.abs(z) < 100) continue;
        
        const buildingMat = new THREE.MeshStandardMaterial({
            color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
            metalness: 0.2,
            roughness: 0.7
        });
        
        const buildingGeo = new THREE.BoxGeometry(w, h, d);
        const buildingMesh = new THREE.Mesh(buildingGeo, buildingMat);
        buildingMesh.position.set(x, h / 2, z);
        buildingMesh.castShadow = true;
        buildingMesh.receiveShadow = true;
        scene.add(buildingMesh);
        
        // Physics
        const buildingShape = new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2));
        const buildingBody = new CANNON.Body({ mass: 0 });
        buildingBody.addShape(buildingShape);
        buildingBody.position.copy(buildingMesh.position);
        world.addBody(buildingBody);
    }
    
    updateProgress(3);
}

/**
 * Creates the road system and adds parked cars.
 */
function createRoadSystem() {
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    
    // Main roads
    for (let i = -200; i <= 200; i += 100) {
        // Horizontal road
        const roadGeoH = new THREE.PlaneGeometry(500, 15);
        const roadMeshH = new THREE.Mesh(roadGeoH, roadMat);
        roadMeshH.rotation.x = -Math.PI / 2;
        roadMeshH.position.y = 0.1;
        roadMeshH.position.z = i;
        roadMeshH.receiveShadow = true;
        scene.add(roadMeshH);
        
        // Vertical road
        if (Math.abs(i) < 200) {
            const roadGeoV = new THREE.PlaneGeometry(15, 500);
            const roadMeshV = new THREE.Mesh(roadGeoV, roadMat);
            roadMeshV.rotation.x = -Math.PI / 2;
            roadMeshV.position.y = 0.1;
            roadMeshV.position.x = i;
            roadMeshV.receiveShadow = true;
            scene.add(roadMeshV);
        }
    }
    
    // Add some parked cars
    const carColors = [0xff4444, 0x4444ff, 0x44ff44, 0xffff44];
    for (let i = 0; i < 10; i++) {
        const x = (Math.random() - 0.5) * 400;
        const z = (Math.random() - 0.5) * 400;
        
        const color = carColors[Math.floor(Math.random() * carColors.length)];
        const parkedCar = new Vehicle(new THREE.Vector3(x, 1, z), color);
        parkedCar.mesh.rotation.y = Math.random() * Math.PI * 2;
        vehicles.push(parkedCar);
    }
}
