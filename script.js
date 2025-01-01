// Constants
const GAME_WIDTH = 500; // Should match the max-width of #game-container in CSS
const GAME_HEIGHT = window.innerHeight * 0.8; // 80vh
const ROUTER_WIDTH = 60;
const ROUTER_SPEED = 20;
const INITIAL_PACKET_SPEED = 3;
const INITIAL_VIRUS_SPEED = 4;
const PACKET_SPAWN_INTERVAL = 1500; // in milliseconds
const VIRUS_SPAWN_INTERVAL = 2000; // in milliseconds
const MAX_PACKETS = 5;
const MAX_VIRUSES = 5;

// DOM Elements
const router = document.getElementById("router");
const gameContainer = document.getElementById("game-container");
const scoreDisplay = document.getElementById("score");
const startScreen = document.getElementById("start-screen");
const startButton = document.getElementById("start-button");
const gameOverScreen = document.getElementById("game-over-screen");
const restartButton = document.getElementById("restart-button");
const finalScore = document.getElementById("final-score");

// Game Variables
let routerPosition = (GAME_WIDTH - ROUTER_WIDTH) / 2;
let score = 0;
let level = 1;
let highScore = parseInt(localStorage.getItem('highScore')) || 0;
let animationFrameId;
let packetIntervalId;
let virusIntervalId;
let packets = [];
let viruses = [];

// Sound Effects (Optional)
// Uncomment and ensure sound files are in the correct directory if you wish to use them
// const catchSound = new Audio('sounds/catch.mp3');
// const gameOverSound = new Audio('sounds/gameover.mp3');
// const backgroundMusic = new Audio('sounds/background.mp3');
// backgroundMusic.loop = true;

// Initialize Router Position
router.style.left = `${routerPosition}px`;

// Update Initial Score Display
updateScore();

// Event Listeners
document.addEventListener("keydown", moveRouter);
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);

/**
 * Moves the router left or right based on arrow key presses.
 * @param {KeyboardEvent} event
 */
function moveRouter(event) {
    if (event.key === "ArrowLeft" && routerPosition > 0) {
        routerPosition -= ROUTER_SPEED;
        if (routerPosition < 0) routerPosition = 0; // Prevent moving out of bounds
    } else if (event.key === "ArrowRight" && routerPosition < GAME_WIDTH - ROUTER_WIDTH) {
        routerPosition += ROUTER_SPEED;
        if (routerPosition > GAME_WIDTH - ROUTER_WIDTH) routerPosition = GAME_WIDTH - ROUTER_WIDTH; // Prevent moving out of bounds
    }
    router.style.left = `${routerPosition}px`;
}

/**
 * Starts the game by hiding the start screen, initializing game variables, and starting the game loop.
 */
function startGame() {
    startScreen.classList.add("hidden");
    // backgroundMusic.play(); // Uncomment if sound is enabled
    spawnPackets();
    spawnViruses();
    animationFrameId = requestAnimationFrame(updateGame);
}

/**
 * Updates the game state, including moving objects and checking for collisions.
 */
function updateGame() {
    moveObjects(packets);
    moveObjects(viruses);
    checkCollisions();
    animationFrameId = requestAnimationFrame(updateGame);
}

/**
 * Moves all objects in the provided array and removes those that have moved off-screen.
 * @param {Array} objects - Array of DOM elements (packets or viruses).
 */
function moveObjects(objects) {
    objects.forEach((obj, index) => {
        let currentTop = parseInt(obj.style.top);
        currentTop += parseInt(obj.getAttribute('data-speed'));
        obj.style.top = `${currentTop}px`;

        // Remove object if it moves beyond the game container
        if (currentTop > GAME_HEIGHT) {
            gameContainer.removeChild(obj);
            objects.splice(index, 1);
        }
    });
}

/**
 * Checks for collisions between the router and all packets/viruses.
 */
function checkCollisions() {
    // Check Packets
    packets.forEach((packet, index) => {
        if (isColliding(packet, router)) {
            // catchSound.play(); // Uncomment if sound is enabled
            score += 1;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('highScore', highScore);
            }
            if (score % 10 === 0) {
                level += 1;
                increaseDifficulty();
            }
            updateScore();
            // Remove the caught packet
            gameContainer.removeChild(packet);
            packets.splice(index, 1);
        }
    });

    // Check Viruses
    viruses.forEach((virus, index) => {
        if (isColliding(virus, router)) {
            // gameOverSound.play(); // Uncomment if sound is enabled
            endGame();
        }
    });
}

/**
 * Determines if two DOM elements are colliding using their bounding rectangles.
 * @param {HTMLElement} obj1 
 * @param {HTMLElement} obj2 
 * @returns {boolean}
 */
function isColliding(obj1, obj2) {
    const rect1 = obj1.getBoundingClientRect();
    const rect2 = obj2.getBoundingClientRect();
    return !(
        rect1.top > rect2.bottom ||
        rect1.bottom < rect2.top ||
        rect1.right < rect2.left ||
        rect1.left > rect2.right
    );
}

/**
 * Ends the game by stopping the game loop, clearing intervals, showing the game-over screen, and updating high score.
 */
function endGame() {
    cancelAnimationFrame(animationFrameId);
    clearInterval(packetIntervalId);
    clearInterval(virusIntervalId);
    // backgroundMusic.pause(); // Uncomment if sound is enabled
    finalScore.textContent = score;
    gameOverScreen.classList.remove("hidden");
}

/**
 * Restarts the game by hiding the game-over screen, resetting variables, and starting the game loop again.
 */
function restartGame() {
    gameOverScreen.classList.add("hidden");
    resetGame();
    startGame();
}

/**
 * Resets game variables and clears all existing packets and viruses from the game container.
 */
function resetGame() {
    score = 0;
    level = 1;
    updateScore();
    routerPosition = (GAME_WIDTH - ROUTER_WIDTH) / 2;
    router.style.left = `${routerPosition}px`;

    // Remove all packets
    packets.forEach(packet => gameContainer.removeChild(packet));
    packets = [];

    // Remove all viruses
    viruses.forEach(virus => gameContainer.removeChild(virus));
    viruses = [];

    // Reset difficulty
    resetDifficulty();
}

/**
 * Updates the score display, including high score.
 */
function updateScore() {
    scoreDisplay.textContent = `Score: ${score} | Level: ${level} | High Score: ${highScore}`;
}

/**
 * Spawns packets at random intervals.
 */
function spawnPackets() {
    packetIntervalId = setInterval(() => {
        if (packets.length < MAX_PACKETS) {
            const packet = document.createElement('div');
            packet.classList.add('packet');
            const xPos = Math.random() * (GAME_WIDTH - 40);
            packet.style.left = `${xPos}px`;
            packet.style.top = `-40px`;
            packet.setAttribute('data-speed', INITIAL_PACKET_SPEED + level);
            gameContainer.appendChild(packet);
            packets.push(packet);
        }
    }, PACKET_SPAWN_INTERVAL);
}

/**
 * Spawns viruses at random intervals.
 */
function spawnViruses() {
    virusIntervalId = setInterval(() => {
        if (viruses.length < MAX_VIRUSES) {
            const virus = document.createElement('div');
            virus.classList.add('virus');
            const xPos = Math.random() * (GAME_WIDTH - 40);
            virus.style.left = `${xPos}px`;
            virus.style.top = `-40px`;
            virus.setAttribute('data-speed', INITIAL_VIRUS_SPEED + level);
            gameContainer.appendChild(virus);
            viruses.push(virus);
        }
    }, VIRUS_SPAWN_INTERVAL);
}

/**
 * Increases the difficulty by increasing the speed of packets and viruses.
 */
function increaseDifficulty() {
    packets.forEach(packet => {
        let speed = parseInt(packet.getAttribute('data-speed'));
        packet.setAttribute('data-speed', speed + 1);
    });

    viruses.forEach(virus => {
        let speed = parseInt(virus.getAttribute('data-speed'));
        virus.setAttribute('data-speed', speed + 1);
    });
}

/**
 * Resets the difficulty by setting the speed of packets and viruses back to initial values.
 */
function resetDifficulty() {
    packets.forEach(packet => {
        packet.setAttribute('data-speed', INITIAL_PACKET_SPEED);
    });

    viruses.forEach(virus => {
        virus.setAttribute('data-speed', INITIAL_VIRUS_SPEED);
    });
}
