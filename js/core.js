// core.js - Core game state and functionality
// Uses the global GAME_CONSTANTS object

/**
 * Core game module providing the essential game mechanics and state
 * This will be used by the main game.js file
 */
window.gameCore = {
    //=====================================================================
    // STATE DEFINITIONS
    //=====================================================================
    
    // ----- Resources -----
    energy: window.GAME_CONSTANTS.INITIAL_STATE.ENERGY,
    energyCap: window.GAME_CONSTANTS.INITIAL_STATE.ENERGY_CAP,
    minerals: window.GAME_CONSTANTS.INITIAL_STATE.MINERALS,
    organics: window.GAME_CONSTANTS.INITIAL_STATE.ORGANICS,
    gatherMinerals: window.GAME_CONSTANTS.INITIAL_STATE.GATHER_MINERALS_RATE,
    gatherOrganics: window.GAME_CONSTANTS.INITIAL_STATE.GATHER_ORGANICS_RATE,
    
    // ----- Progress -----
    items: {},
    built: { solarCollector: 0 },
    totalGathered: 0,
    days: window.GAME_CONSTANTS.INITIAL_STATE.START_DAY,
    
    // ----- Game Status -----
    gameOver: false,
    gameOverReason: '',
    stageComplete: false,
    memoryShown: false,
    ariaWarn: false,
    finishShown: false,
    paused: false,
    
    // ----- Timer Handles -----
    solarInterval: null,
    energyInterval: null,
    hungerInterval: null,

    //=====================================================================
    // CORE GAME FUNCTIONS
    //=====================================================================
    
    // ----- Initialization -----
    init() {
        // Only set initial state and variables, but don't start timers yet
        // Timers will be started in startGame()
        this.pauseGame(); // Start with everything paused
        
        console.log("[INIT] Game initialized, timers paused until game starts");
    },
    
    startGame() {
        if (typeof this.hideStartScreen === 'function') {
            this.hideStartScreen();
        }
        this.resumeGame(); // Unpause timers when Begin button is clicked
        
        // Start all game timers when the game actually begins
        this.startTimers();
        
        console.log("[GAME] Game started, timers active");
        
        // Display welcome message if the function exists
        if (typeof this.displayWelcomeMessage === 'function') {
            this.displayWelcomeMessage();
        }
    },
    
    // ----- Timer Management -----
    startTimers() {
        // Clear any existing intervals to prevent doubling up
        if (this.solarInterval) clearInterval(this.solarInterval);
        if (this.energyInterval) clearInterval(this.energyInterval);
        if (this.hungerInterval) clearInterval(this.hungerInterval);
        
        // Set new intervals
        this.solarInterval = setInterval(() => {
            if (this.shouldSkipTimerTick()) return;
            this.processSolarGeneration();
        }, window.GAME_CONSTANTS.TIMERS.SOLAR_GENERATION);
        
        this.energyInterval = setInterval(() => {
            if (this.shouldSkipTimerTick()) return;
            this.processEnergyDrain();
        }, window.GAME_CONSTANTS.TIMERS.ENERGY_DRAIN);
        
        this.hungerInterval = setInterval(() => {
            if (this.shouldSkipTimerTick()) return;
            this.processHunger();
        }, window.GAME_CONSTANTS.TIMERS.HUNGER);
    },
    
    shouldSkipTimerTick() {
        return this.gameOver || this.paused;
    },
    
    // Process individual timer ticks
    processSolarGeneration() {
        if (this.built.solarCollector > 0) {
            const produced = window.GAME_CONSTANTS.SOLAR.ENERGY_PER_COLLECTOR * this.built.solarCollector;
            this.addEnergy(produced);
            console.log(`[SOLAR] Generated ${produced} energy, new total: ${this.energy}/${this.energyCap}`);
        }
    },
    
    processEnergyDrain() {
        this.consumeEnergy(1);
        console.log(`[ENERGY] Consumed 1 energy, remaining: ${this.energy}/${this.energyCap}`);
        if (this.energy < 0) {
            this.triggerGameOver(window.GAME_CONSTANTS.MESSAGES.ENERGY_DEPLETED);
        }
    },
    
    processHunger() {
        if (this.organics > 0) {
            this.consumeFood(1);
            this.incrementDay();
            console.log(`[DAY] Day ${this.days} begins. Consumed 1 organics, remaining: ${this.organics}`);
        } else {
            this.triggerGameOver(window.GAME_CONSTANTS.MESSAGES.STARVED);
        }
    },
    
    // ----- Game State Changes -----
    pauseGame() {
        this.paused = true;
    },
    
    resumeGame() {
        this.paused = false;
    },
    
    addEnergy(amount) {
        this.energy = Math.min(this.energyCap, this.energy + amount);
    },
    
    consumeEnergy(amount) {
        this.energy -= amount;
    },
    
    consumeFood(amount) {
        this.organics -= amount;
    },
    
    incrementDay() {
        this.days += 1;
    },
    
    updateGatherRates(mineralsRate, organicsRate) {
        this.gatherMinerals = mineralsRate;
        this.gatherOrganics = organicsRate;
    },
    
    addSolarCollector() {
        this.built.solarCollector++;
    },
    
    increaseEnergyCap(amount) {
        this.energyCap += amount;
    },
    
    completeStage() {
        this.stageComplete = true;
    },
    
    // ----- Game State Management -----
    triggerGameOver(reason) {
        if (this.gameOver) return;
        
        // Update game state
        this.gameOver = true;
        this.gameOverReason = reason;
        
        // Update UI
        if (typeof this.showGameOverScreen === 'function') {
            this.showGameOverScreen();
        }
        
        // Analytics
        this.trackGameOver(reason);
        
        console.log('Game over triggered:', reason);
    },
    
    trackGameOver(reason) {
        let name = this.computerName || localStorage.getItem(window.GAME_CONSTANTS.STORAGE_KEYS.PLAYER_NAME) || '';
        if (typeof umami !== 'undefined' && umami.track) {
            umami.track('game_over', { reason: reason, days: this.days, name: name });
        }
        if (typeof posthog !== 'undefined' && posthog.capture) {
            posthog.capture('game_over', { reason: reason, days: this.days, name: name });
        }
    },
    
    checkEvents() {
        this.checkMemoryEvent();
        this.checkAriaWarningEvent();
        this.checkStageCompleteEvent();
    },
    
    checkMemoryEvent() {
        if (this.totalGathered >= window.GAME_CONSTANTS.GATHERING.TOTAL_GATHERED_MEMORY_THRESHOLD && !this.memoryShown) {
            this.memoryShown = true;
            if (typeof this.displayMessage === 'function') {
                this.displayMessage(window.GAME_CONSTANTS.MESSAGES.MEMORY_FRAGMENT);
            }
        }
    },
    
    checkAriaWarningEvent() {
        if (this.items.solarCollector && !this.ariaWarn) {
            this.ariaWarn = true;
            if (typeof this.displayMessage === 'function') {
                this.displayMessage(window.GAME_CONSTANTS.MESSAGES.ARIA_ENERGY_WARNING);
            }
        }
    },
    
    checkStageCompleteEvent() {
        if (this.stageComplete && !this.finishShown) {
            this.finishShown = true;
            this.gameOver = true; // Prevent further countdowns and game over triggers
            if (typeof this.displayMessage === 'function') {
                this.displayMessage(window.GAME_CONSTANTS.MESSAGES.STAGE_COMPLETE, 'msg');
            }
        }
    },
    
    /**
     * Reset game completely and show intro video again
     * This is used for "New Game" functionality from any screen
     */
    resetGame() {
        // Clear all game-related localStorage items
        localStorage.removeItem(window.GAME_CONSTANTS.STORAGE_KEYS.INTRO_SHOWN);
        localStorage.removeItem(window.GAME_CONSTANTS.STORAGE_KEYS.PLAYER_NAME);
        // Don't clear debug mode setting as that's a preference
        
        console.log("[CORE] Game reset - localStorage cleaned for fresh start");
        
        // Redirect to index.html with a cache-busting parameter
        window.location.href = "index.html?reset=" + Date.now();
    }
};
