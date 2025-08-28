// APOCAT Game - Main Game Logic
// Game initialization
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Chat system
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
let chatHistory = [];

function addChatMessage(username, message, isSystem = false) {
    const timestamp = new Date().toLocaleTimeString();
    const messageDiv = document.createElement('div');
    messageDiv.style.marginBottom = '5px';
    messageDiv.style.wordWrap = 'break-word';
    
    if (isSystem) {
        messageDiv.style.color = '#ffaa44';
        messageDiv.innerHTML = `<span style="color: #666;">[${timestamp}]</span> <strong>🤖 SYSTEM:</strong> ${message}`;
    } else {
        messageDiv.innerHTML = `<span style="color: #666;">[${timestamp}]</span> <span style="color: #ff6600;">${username}:</span> ${message}`;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Keep only last 50 messages
    while (chatMessages.children.length > 50) {
        chatMessages.removeChild(chatMessages.firstChild);
    }
}

function sendChatMessage() {
    const message = chatInput.value.trim();
    if (message && message.length > 0) {
        const username = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Anonymous';
        addChatMessage(username, message);
        chatInput.value = '';
        
        // Simulate other players (for demo)
        if (Math.random() < 0.3) {
            setTimeout(() => {
                const responses = [
                    "Nice score! 🔥",
                    "APOCAT to the moon! 🚀",
                    "Just got rekt by the boss 😅",
                    "This game is addictive!",
                    "Anyone else farming tokens? 💰",
                    "GG everyone! 🎮"
                ];
                const randomUser = `0x${Math.random().toString(16).substr(2, 4)}...${Math.random().toString(16).substr(2, 4)}`;
                addChatMessage(randomUser, responses[Math.floor(Math.random() * responses.length)]);
            }, 1000 + Math.random() * 3000);
        }
    }
}

chatSend.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
});

// Add welcome message
addChatMessage('', 'Welcome to APOCAT! Share your scores and strategies! 🐱⚔️', true);

// Game state
let gameState = 'menu';
let assetsLoaded = true; // No external assets needed

// Game variables
let score = 0;
let round = 1;
let roundTimer = 30;
let roundStartTime = 0;
let zombies = [];
let catFood = [];
let particles = [];
let pawSwipes = [];
let mouse = { x: 400, y: 300 };
let zombieSpawnTimer = 0;
let foodSpawnTimer = 0;
let foodSpawnInterval = 8000; // Food spawns every 8 seconds (less frequent)
let zombiesSurvived = 0;
let maxSurvivors = 3;
let baseLives = 3;
let extraLives = 0;
let zombiesKilled = 0;
let totalPaws = 0;
let hits = 0;
let missStreak = 0;
let perfectHits = 0;
let comboCount = 0;
let comboTimer = 0;
let lastHitTime = 0;

// Enhanced Stamina system (much harder)
let stamina = 60;
let maxStamina = 60;
let staminaRegenRate = 3; // Much slower regen
let staminaCost = 20; // Higher cost per click
let staminaBoostActive = false;
let staminaBoostTimer = 0;

// Boss system
let currentBoss = null;
let bossSpawned = false;

// Coins and upgrades
let coins = 0; // Currency for upgrades
let upgrades = {
    biggerPaw: { level: 0, maxLevel: 5, cost: 50, name: "Bigger Paw", description: "Larger hit radius" },
    strongerPaw: { level: 0, maxLevel: 5, cost: 75, name: "Stronger Paw", description: "More damage per hit" },
    moreEnergy: { level: 0, maxLevel: 5, cost: 100, name: "More Energy", description: "Increased max stamina" },
    energyRegen: { level: 0, maxLevel: 5, cost: 125, name: "Energy Regen", description: "Faster stamina recovery" }
};

// Apocalyptic wasteland obstacles
let collisionZones = [
    { 
        x: 120, y: 400, width: 100, height: 140, type: 'ruins',
        occlusionHeight: 90, shadowOffset: 20
    },
    { 
        x: 380, y: 360, width: 80, height: 160, type: 'debris',
        occlusionHeight: 110, shadowOffset: 25
    },
    { 
        x: 620, y: 420, width: 110, height: 120, type: 'wreckage',
        occlusionHeight: 80, shadowOffset: 18
    }
];

// Color scheme
const APOCAT_COLORS = {
    catOrange: '#ff6600',
    energyGreen: '#00ff88',
    warningYellow: '#ffdd44',
    glowBlue: '#4da6ff',
    skyDark: '#2c3e50',
    skyMid: '#34495e',
    skyLight: '#7f8c8d',
    ground: '#8b7355',
    buildingLight: '#95a5a6',
    buildingMid: '#7f8c8d',
    buildingDark: '#34495e',
    windowOn: '#f1c40f',
    windowOff: '#2c3e50',
    zombieGreen: '#27ae60',
    zombieGreenDark: '#1e8449',
    zombiePurple: '#8e44ad',
    zombiePurpleDark: '#6c3483',
    zombieRed: '#e74c3c',
    zombieRedDark: '#c0392b'
};

// Animation system
let animations = [];

function addAnimation(type, x, y, options = {}) {
    animations.push({
        type: type,
        x: x,
        y: y,
        time: 0,
        duration: options.duration || 1000,
        ...options
    });
}

function updateAnimations(deltaTime) {
    for (let i = animations.length - 1; i >= 0; i--) {
        animations[i].time += deltaTime;
        if (animations[i].time >= animations[i].duration) {
            animations.splice(i, 1);
        }
    }
}

// Particle system
function createExplosion(x, y) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            life: 1,
            color: `hsl(${Math.random() * 60 + 15}, 100%, 50%)`
        });
    }
}

function updateParticles(deltaTime) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.vx * (deltaTime / 1000);
        particle.y += particle.vy * (deltaTime / 1000);
        particle.life -= deltaTime / 1000;
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updatePawSwipes(deltaTime) {
    for (let i = pawSwipes.length - 1; i >= 0; i--) {
        pawSwipes[i].life -= deltaTime / 1000;
        if (pawSwipes[i].life <= 0) {
            pawSwipes.splice(i, 1);
        }
    }
}

function createPawSwipe(x, y) {
    const hitRadius = getHitRadius();
    pawSwipes.push({
        x: x,
        y: y,
        size: hitRadius * 2, // Make paw as big as hit circle
        life: 0.5
    });
}

function submitScore() {
    const accuracy = totalPaws > 0 ? Math.round((hits / totalPaws) * 100) : 0;
    
    scoreboard.addScore({
        walletAddress: walletAddress || 'Anonymous',
        score: score,
        wave: round - 1,
        zombiesKilled: zombiesKilled,
        accuracy: accuracy
    });
    
    // Simulate token distribution
    if (typeof simulateTokenDistribution === 'function') {
        simulateTokenDistribution(score);
    }
}

// Scoreboard system
const scoreboard = {
    scores: JSON.parse(localStorage.getItem('apocatScores') || '[]'),
    
    addScore(scoreData) {
        this.scores.push({
            ...scoreData,
            date: new Date().toLocaleDateString(),
            timestamp: Date.now()
        });
        
        this.scores.sort((a, b) => b.score - a.score);
        this.scores = this.scores.slice(0, 100); // Keep top 100
        
        localStorage.setItem('apocatScores', JSON.stringify(this.scores));
    },
    
    getTopScores(limit = 10) {
        return this.scores.slice(0, limit);
    }
};

function activateStaminaBoost(duration) {
    staminaBoostActive = true;
    staminaBoostTimer = duration;
    console.log('⚡ Stamina boost activated!');
}

function spawnBoss() {
    if (currentBoss || bossSpawned) return;

    const bossTypes = ['warlord', 'mothership', 'titan'];
    const bossType = bossTypes[Math.floor(Math.random() * bossTypes.length)];

    let bossEmoji, bossSize;
    if (bossType === 'warlord') {
        bossEmoji = '👹'; // Apocalyptic warlord
        bossSize = 120;
    } else if (bossType === 'mothership') {
        bossEmoji = '🛸'; // Alien mothership
        bossSize = 140;
    } else { // titan
        bossEmoji = '🤖'; // Giant mech titan
        bossSize = 160;
    }

    currentBoss = {
        x: canvas.width + 100,
        y: canvas.height / 2,
        vx: -25, // Slower than regular enemies
        vy: 0,
        size: bossSize,
        points: 100 + (round * 25), // More points
        type: bossType,
        layer: 'foreground',
        alpha: 1,
        emoji: bossEmoji,
        layerMultiplier: 2,
        health: 15, // Requires 15 hits
        maxHealth: 15,
        isHurt: false,
        hurtTimer: 0,
        isBoss: true
    };

    bossSpawned = true;
    console.log(`👹 BOSS SPAWNED! ${bossType} boss with ${currentBoss.health} HP!`);
}

function spawnZombie() {
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const types = ['raider', 'drone', 'mech'];
    const type = types[Math.floor(Math.random() * types.length)];
    const layers = ['background', 'middle', 'foreground'];
    const layer = layers[Math.floor(Math.random() * layers.length)];

    let speed = 60 + (round - 1) * 15;
    let points = 10;
    let size = 50;
    let emoji = '🤖';

    if (type === 'raider') {
        speed *= 1.0;
        points = 10;
        emoji = '👹'; // Apocalyptic raider
    } else if (type === 'drone') {
        speed *= 1.8;
        points = 15;
        emoji = '🛸'; // Flying drone
    } else if (type === 'mech') {
        speed *= 0.7;
        points = 25;
        size = 60;
        emoji = '🤖'; // Heavy mech
    }

    let layerMultiplier = 1;
    let alpha = 1;
    let yRange = { min: 100, max: canvas.height - 200 };

    if (layer === 'background') {
        layerMultiplier = 0.6;
        alpha = 0.7;
        yRange = { min: 80, max: canvas.height * 0.4 };
    } else if (layer === 'middle') {
        layerMultiplier = 0.8;
        alpha = 0.85;
        yRange = { min: 120, max: canvas.height * 0.6 };
    } else {
        layerMultiplier = 1.2;
        alpha = 1;
        yRange = { min: 200, max: canvas.height * 0.85 };
    }

    // Base health increases every 5 rounds
    let baseHealth = 1 + Math.floor((round - 1) / 5);
    let health = baseHealth;
    let maxHealth = baseHealth;

    if (layerMultiplier >= 1.2) {
        health = baseHealth + 1; // Foreground enemies get +1 HP
        maxHealth = baseHealth + 1;
        points = Math.floor(points * layerMultiplier * 1.5);
    }

    const zombie = {
        x: side === 'left' ? -size : canvas.width + size,
        y: Math.random() * (yRange.max - yRange.min) + yRange.min,
        vx: (side === 'left' ? 1 : -1) * speed * layerMultiplier,
        vy: (Math.random() - 0.5) * 15,
        size: size * layerMultiplier,
        points: Math.floor(points * layerMultiplier),
        type: type,
        layer: layer,
        alpha: alpha,
        emoji: emoji,
        layerMultiplier: layerMultiplier,
        health: health,
        maxHealth: maxHealth,
        isHurt: false,
        hurtTimer: 0
    };

    zombies.push(zombie);
    console.log(`⚔️ Spawned ${type} invader (${layer} layer) with ${health} HP`);
}

function spawnCatFood() {
    const food = {
        x: Math.random() * (canvas.width - 100) + 50,
        y: Math.random() * (canvas.height - 200) + 100,
        size: 40,
        lifeTime: 5000, // 5 seconds (shorter duration)
        emoji: '🍖'
    };
    catFood.push(food);
    console.log('🍖 Cat food spawned!');
}

function isInCollisionZone(x, y) {
    return collisionZones.some(zone =>
        x >= zone.x && x <= zone.x + zone.width &&
        y >= zone.y && y <= zone.y + zone.height
    );
}

function getHitRadius() {
    return 30 + (upgrades.biggerPaw.level * 8);
}

function getDamageMultiplier() {
    return 1 + (upgrades.strongerPaw.level * 0.5);
}

function getMaxStamina() {
    return maxStamina + (upgrades.moreEnergy.level * 20);
}

function getStaminaRegenRate() {
    return staminaRegenRate + (upgrades.energyRegen.level * 2);
}

function applyUpgrades() {
    maxStamina = getMaxStamina();
    stamina = Math.min(stamina, maxStamina);
    staminaRegenRate = getStaminaRegenRate();
}

// Drawing functions
function drawBackground() {
    // Apocalyptic sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#2F1B14'); // Dark brown
    skyGradient.addColorStop(0.3, '#8B4513'); // Saddle brown
    skyGradient.addColorStop(0.6, '#CD853F'); // Peru
    skyGradient.addColorStop(1, '#D2691E'); // Chocolate
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Wasteland ground with cracks
    const groundGradient = ctx.createLinearGradient(0, canvas.height - 150, 0, canvas.height);
    groundGradient.addColorStop(0, '#8B4513'); // Saddle brown
    groundGradient.addColorStop(0.5, '#A0522D'); // Sienna
    groundGradient.addColorStop(1, '#654321'); // Dark brown
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height - 150, canvas.width, 150);

    // Cracked wasteland surface
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(0, canvas.height - 120, canvas.width, 20);

    // Ground cracks and debris
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
        const x = (i * canvas.width / 8) + Math.random() * 50;
        ctx.beginPath();
        ctx.moveTo(x, canvas.height - 100);
        ctx.lineTo(x + Math.random() * 40 - 20, canvas.height - 60);
        ctx.stroke();
    }

    // Distant ruins silhouette
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.4);
    for (let x = 0; x <= canvas.width; x += 50) {
        const height = canvas.height * (0.4 + Math.sin(x * 0.01) * 0.1);
        ctx.lineTo(x, height);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();

    // Floating ash particles
    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
    for (let i = 0; i < 15; i++) {
        const x = (Date.now() * 0.02 + i * 50) % (canvas.width + 20);
        const y = 50 + Math.sin(Date.now() * 0.001 + i) * 30;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Embers floating up
    ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
    for (let i = 0; i < 8; i++) {
        const x = Math.random() * canvas.width;
        const y = (canvas.height - Date.now() * 0.05 + i * 100) % canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    // drawCollisionZones(); // Removed for cleaner background
}

function drawZombie(zombie) {
    ctx.globalAlpha = zombie.alpha;

    if (zombie.isHurt && zombie.hurtTimer > 0) {
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = '#ff6666';
        ctx.beginPath();
        ctx.arc(zombie.x, zombie.y, zombie.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }

    drawStylizedZombie(zombie);

    if (zombie.maxHealth > 1) {
        drawZombieHealthBar(zombie);
    }

    if (zombie.layer === 'foreground') {
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.arc(zombie.x, zombie.y, zombie.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }

    ctx.globalAlpha = 1;
}

function drawStylizedZombie(zombie) {
    const halfSize = zombie.size / 2;
    const centerX = zombie.x;
    const centerY = zombie.y;

    // Goofy apocalyptic invader colors
    let bodyColor, accentColor, eyeColor;
    if (zombie.type === 'raider') {
        bodyColor = '#8B4513'; // Brown
        accentColor = '#654321'; // Dark brown
        eyeColor = '#FF6600'; // Orange
    } else if (zombie.type === 'drone') {
        bodyColor = '#666666'; // Gray
        accentColor = '#444444'; // Dark gray
        eyeColor = '#00FF00'; // Green
    } else { // mech
        bodyColor = '#444444'; // Dark gray
        accentColor = '#222222'; // Very dark gray
        eyeColor = '#FF0000'; // Red
    }

    if (zombie.type === 'raider') {
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX + 3, centerY + halfSize + 5, halfSize * 0.8, halfSize * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Goofy raider body
        const bodyGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, halfSize);
        bodyGradient.addColorStop(0, bodyColor);
        bodyGradient.addColorStop(1, accentColor);
        ctx.fillStyle = bodyGradient;

        // Main body (oval)
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, halfSize * 0.7, halfSize * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Goggles
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(centerX - halfSize * 0.3, centerY - halfSize * 0.4, halfSize * 0.15, 0, Math.PI * 2);
        ctx.arc(centerX + halfSize * 0.3, centerY - halfSize * 0.4, halfSize * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // Goggle straps
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY - halfSize * 0.4, halfSize * 0.6, 0, Math.PI);
        ctx.stroke();

        // Bandana/scarf
        ctx.fillStyle = '#DC143C';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + halfSize * 0.2, halfSize * 0.5, halfSize * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

    } else if (zombie.type === 'drone') {
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX + 3, centerY + halfSize + 5, halfSize * 0.8, halfSize * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Flying drone body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(centerX - halfSize * 0.6, centerY - halfSize * 0.3, halfSize * 1.2, halfSize * 0.6);

        // Drone details
        ctx.fillStyle = accentColor;
        ctx.fillRect(centerX - halfSize * 0.4, centerY - halfSize * 0.2, halfSize * 0.8, halfSize * 0.4);

        // Propellers (spinning animation)
        const spin = Date.now() * 0.02;
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 3;

        // Four propellers
        const propPositions = [
            {x: centerX - halfSize * 0.8, y: centerY - halfSize * 0.6},
            {x: centerX + halfSize * 0.8, y: centerY - halfSize * 0.6},
            {x: centerX - halfSize * 0.8, y: centerY + halfSize * 0.6},
            {x: centerX + halfSize * 0.8, y: centerY + halfSize * 0.6}
        ];

        propPositions.forEach((prop, i) => {
            const angle = spin + (i * Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(prop.x - Math.cos(angle) * halfSize * 0.3, prop.y);
            ctx.lineTo(prop.x + Math.cos(angle) * halfSize * 0.3, prop.y);
            ctx.stroke();
        });

        // Antenna
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - halfSize * 0.3);
        ctx.lineTo(centerX, centerY - halfSize * 0.8);
        ctx.stroke();

        // Antenna tip
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(centerX, centerY - halfSize * 0.8, 3, 0, Math.PI * 2);
        ctx.fill();

    } else { // mech
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX + 3, centerY + halfSize + 5, halfSize * 0.8, halfSize * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Chunky mech body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(centerX - halfSize * 0.8, centerY - halfSize * 0.9, halfSize * 1.6, halfSize * 1.8);

        // Mech chest panel
        ctx.fillStyle = accentColor;
        ctx.fillRect(centerX - halfSize * 0.6, centerY - halfSize * 0.7, halfSize * 1.2, halfSize * 0.8);

        // Mech arms
        ctx.fillStyle = bodyColor;
        ctx.fillRect(centerX - halfSize * 1.2, centerY - halfSize * 0.5, halfSize * 0.3, halfSize * 1.0);
        ctx.fillRect(centerX + halfSize * 0.9, centerY - halfSize * 0.5, halfSize * 0.3, halfSize * 1.0);

        // Mech legs
        ctx.fillRect(centerX - halfSize * 0.4, centerY + halfSize * 0.5, halfSize * 0.3, halfSize * 0.6);
        ctx.fillRect(centerX + halfSize * 0.1, centerY + halfSize * 0.5, halfSize * 0.3, halfSize * 0.6);

        // Mech details - vents
        ctx.fillStyle = '#FF6600';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(centerX - halfSize * 0.5 + i * halfSize * 0.2, centerY - halfSize * 0.6, halfSize * 0.1, halfSize * 0.2);
        }

        // Shoulder pads
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.arc(centerX - halfSize * 0.9, centerY - halfSize * 0.6, halfSize * 0.2, 0, Math.PI * 2);
        ctx.arc(centerX + halfSize * 0.9, centerY - halfSize * 0.6, halfSize * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw glowing eyes for all types
    ctx.fillStyle = eyeColor;
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = 8 * zombie.layerMultiplier;

    const eyeSize = 5 * zombie.layerMultiplier;
    let eyeOffset, eyeY;

    if (zombie.type === 'raider') {
        eyeOffset = 12 * zombie.layerMultiplier;
        eyeY = centerY - halfSize * 0.4; // Behind goggles
    } else if (zombie.type === 'drone') {
        eyeOffset = 0; // Single center eye
        eyeY = centerY;
        ctx.beginPath();
        ctx.arc(centerX, eyeY, eyeSize * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        return; // Skip the two-eye drawing below
    } else { // mech
        eyeOffset = 15 * zombie.layerMultiplier;
        eyeY = centerY - halfSize * 0.5;
    }

    // Draw two eyes for raider and mech
    ctx.beginPath();
    ctx.arc(centerX - eyeOffset, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.arc(centerX + eyeOffset, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
}
