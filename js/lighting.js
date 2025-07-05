/**
 * Initializes the lighting for the game environment.
 */
function initLights() {
    // Ambient
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    // Sun
    const sun = new THREE.DirectionalLight(0xfff9e6, 0.8);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.left = -200;
    sun.shadow.camera.right = 200;
    sun.shadow.camera.top = 200;
    sun.shadow.camera.bottom = -200;
    scene.add(sun);
    
    // Hemisphere
    const hemiLight = new THREE.HemisphereLight(0x5577dd, 0x224422, 0.2);
    scene.add(hemiLight);
    
    updateProgress(1);
}
