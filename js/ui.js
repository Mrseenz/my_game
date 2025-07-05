// UI Elements
const interactionPrompt = document.getElementById('interaction-prompt');
const loadingScreen = document.getElementById('loading-screen');
const loadingBar = document.getElementById('loading-bar');
const loadingText = document.getElementById('loading-subtext');
const speedValue = document.getElementById('speed-value');
const modeIndicator = document.getElementById('mode-indicator');
const debugKeys = document.getElementById('debug-keys');

// Progress simulation
let assetsLoaded = 0;
const totalAssets = 10;

/**
 * Updates the loading progress bar and text.
 * @param {number} step - The step to increment the progress by.
 */
function updateProgress(step) {
    assetsLoaded += step;
    const progress = Math.min(100, Math.floor((assetsLoaded / totalAssets) * 100));
    loadingBar.style.width = `${progress}%`;
    
    if (progress < 30) loadingText.textContent = "Initializing physics engine...";
    else if (progress < 60) loadingText.textContent = "Generating city landscape...";
    else if (progress < 90) loadingText.textContent = "Loading vehicles and characters...";
    else loadingText.textContent = "Finalizing simulation...";
}

/**
 * Updates the debug display with current key states.
 */
function updateDebugDisplay() {
    debugKeys.textContent = `W:${keys['w'] ? 1 : 0} A:${keys['a'] ? 1 : 0} S:${keys['s'] ? 1 : 0} D:${keys['d'] ? 1 : 0} SPACE:${keys[' '] ? 1 : 0}`;
}
