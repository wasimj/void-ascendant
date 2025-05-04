// game.js
// Use the global GAME_CONSTANTS object
const { INITIAL_STATE, TIMERS, MESSAGES, STORAGE_KEYS, GATHERING, SOLAR, LOG_CLASSES } = window.GAME_CONSTANTS;

// Define the game function and expose to window
window.game = function game() {
  return {
    //=====================================================================
    // STATE DEFINITIONS
    //=====================================================================
    
    // ----- Resources -----
    energy: INITIAL_STATE.ENERGY,
    energyCap: INITIAL_STATE.ENERGY_CAP,
    minerals: INITIAL_STATE.MINERALS,
    organics: INITIAL_STATE.ORGANICS,
    gatherMinerals: INITIAL_STATE.GATHER_MINERALS_RATE,
    gatherOrganics: INITIAL_STATE.GATHER_ORGANICS_RATE,
    
    // ----- Progress -----
    items: {},
    built: { solarCollector: 0 },
    totalGathered: 0,
    days: INITIAL_STATE.START_DAY,
    
    // ----- Game Status -----
    gameOver: false,
    gameOverReason: '',
    stageComplete: false,
    memoryShown: false,
    ariaWarn: false,
    finishShown: false,
    
    // ----- UI State -----
    logMessages: [],
    showSplash: false,
    showIntroVideo: false,
    paused: false,
    debugMode: false, // Toggle for debug button visibility
    
    // ----- Ship Computer Intro -----
    showComputerIntro: false, // Show after video, before splash
    computerIntroStep: 0, // 0: Wake up, 1: Memory loss/name, 2: Crash message
    computerName: '',
    computerNameInput: '',
    
    // ----- Timer Handles -----
    solarInterval: null,
    energyInterval: null,
    hungerInterval: null,

    //=====================================================================
    // GAME DEFINITIONS
    //=====================================================================
    
    // ----- Craft Definitions -----
    crafts: [
      {id:'scavengingTools', name:'Scavenging Tools', cost:{minerals:10}, prereq:[], effect(){ this.updateGatherRates(2, 2); this.displayMessage('The improvised tools speed up gathering.');}},
      {id:'emergencyBeacon', name:'Emergency Beacon', cost:{energy:15, minerals:5}, prereq:['scavengingTools'], effect(){ this.displayMessage('A faint signal pulses into the sky... will anyone hear it?');}},
      {id:'primitiveWeapons', name:'Primitive Weapons', cost:{minerals:20, organics:5}, prereq:['scavengingTools'], effect(){ this.displayMessage('Crude weapons fashioned. Wildlife encounters will be safer.');}},
      {id:'solarCollector', name:'Solar Collector', cost:{minerals:25}, prereq:[], effect(){ this.addSolarCollector(); this.displayMessage('Solar panels deployed. Passive energy begins to flow.');}},
      {id:'batteryBank', name:'Battery Bank', cost:{minerals:30, energy:20}, prereq:['solarCollector'], effect(){ this.increaseEnergyCap(100); this.displayMessage('Additional batteries increase energy storage.');}},
      {id:'recyclingStation', name:'Recycling Station', cost:{energy:20, minerals:10}, prereq:['solarCollector'], effect(){ this.updateGatherRates(4, this.gatherOrganics); this.displayMessage('Debris processing enabled. Minerals production boosted.');}},
      {id:'basicAlloys', name:'Basic Alloys (Complete Stage 1)', cost:{energy:50, minerals:50, organics:25}, prereq:['recyclingStation','batteryBank'], effect(){ this.completeStage(); this.displayMessage('Alloys forged! Stage 1 complete – a settlement beckons...');}}
    ],

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
      this.hideStartScreen();
      this.resumeGame(); // Unpause timers when Begin button is clicked
      
      // Start all game timers when the game actually begins
      this.startTimers();
      
      console.log("[GAME] Game started, timers active");
      
      // Display welcome message
      this.displayWelcomeMessage();
    },
    
    $init() {
      this.initializeUIState();
      
      // Initialize game systems but timers will be paused by default if showing splash
      this.init();
      
      // Load debug mode setting from localStorage
      this.loadDebugSetting();
    },
    
    initAlpine() {
      this.$init();
    },
    
    // ----- Timer Management -----
    startTimers() {
      // Passive solar generation
      this.solarInterval = setInterval(() => {
        if (this.shouldSkipTimerTick()) return;
        this.processSolarGeneration();
      }, TIMERS.SOLAR_GENERATION);

      // Energy drain
      this.energyInterval = setInterval(() => {
        if (this.shouldSkipTimerTick()) return;
        this.processEnergyDrain();
      }, TIMERS.ENERGY_DRAIN);

      // Hunger
      this.hungerInterval = setInterval(() => {
        if (this.shouldSkipTimerTick()) return;
        this.processHunger();
      }, TIMERS.HUNGER);
    },
    
    shouldSkipTimerTick() {
      return this.gameOver || this.paused;
    },
    
    // Process individual timer ticks
    processSolarGeneration() {
      if (this.built.solarCollector > 0) {
        const produced = SOLAR.ENERGY_PER_COLLECTOR * this.built.solarCollector;
        this.addEnergy(produced);
        console.log(`[SOLAR] Generated ${produced} energy, new total: ${this.energy}/${this.energyCap}`);
      }
    },
    
    processEnergyDrain() {
      this.consumeEnergy(1);
      console.log(`[ENERGY] Consumed 1 energy, remaining: ${this.energy}/${this.energyCap}`);
      if (this.energy < 0) {
        this.triggerGameOver(MESSAGES.ENERGY_DEPLETED);
      }
    },
    
    processHunger() {
      if (this.organics > 0) {
        this.consumeFood(1);
        this.incrementDay();
        console.log(`[DAY] Day ${this.days} begins. Consumed 1 organics, remaining: ${this.organics}`);
      } else {
        this.triggerGameOver(MESSAGES.STARVED);
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
      this.showGameOverScreen();
      
      // Analytics
      this.trackGameOver(reason);
      
      console.log('Game over triggered:', reason);
    },
    
    trackGameOver(reason) {
      let name = this.computerName || localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || '';
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
      if (this.totalGathered >= GATHERING.TOTAL_GATHERED_MEMORY_THRESHOLD && !this.memoryShown) {
        this.memoryShown = true;
        this.displayMessage(MESSAGES.MEMORY_FRAGMENT);
      }
    },
    
    checkAriaWarningEvent() {
      if (this.items.solarCollector && !this.ariaWarn) {
        this.ariaWarn = true;
        this.displayMessage(MESSAGES.ARIA_ENERGY_WARNING);
      }
    },
    
    checkStageCompleteEvent() {
      if (this.stageComplete && !this.finishShown) {
        this.finishShown = true;
        this.gameOver = true; // Prevent further countdowns and game over triggers
        this.displayMessage(MESSAGES.STAGE_COMPLETE, 'msg');
      }
    },
    
    //=====================================================================
    // PLAYER ACTIONS & RESOURCE MANAGEMENT
    //=====================================================================
    
    // ----- Resource Management -----
    gather(type) {
      if (this.gameOver) return;
      
      if (type === 'energy') {
        this.gatherEnergy();
      } else {
        this.gatherResource(type);
      }
      
      this.totalGathered += 1;
      this.checkEvents();
    },
    
    gatherEnergy() {
      if (this.energy >= this.energyCap) {
        this.displayMessage(MESSAGES.ENERGY_FULL);
        return;
      }
      this.addEnergy(1);
    },
    
    gatherResource(type) {
      if (this.handlePossibleWildlifeEncounter()) return;
      
      if (type === 'minerals') {
        this.minerals += this.gatherMinerals;
      } 
      else if (type === 'organics') {
        this.organics += this.gatherOrganics;
      }
    },
    
    handlePossibleWildlifeEncounter() {
      if (Math.random() < GATHERING.WILDLIFE_ENCOUNTER_CHANCE) {
        this.processWildlifeEncounter();
        return true;
      }
      return false;
    },
    
    processWildlifeEncounter() {
      if (this.items.primitiveWeapons) {
        this.displayMessage('A predator lunges, but you drive it off with your weapons.');
      } else {
        const stolen = Math.min(this.organics, GATHERING.MAX_ORGANICS_STOLEN);
        this.organics -= stolen;
        this.displayMessage(`A predator steals ${stolen} food from your stores!`, LOG_CLASSES.DANGER);
      }
    },
    
    // ----- Crafting System -----
    canAfford(cost) {
      return Object.entries(cost).every(([k,v]) => this[k] >= v);
    },
    
    pay(cost) {
      Object.entries(cost).forEach(([k,v]) => { this[k] -= v; });
    },
    
    hasPrereq(craft) {
      return craft.prereq.every(id => this.items[id]);
    },
    
    craftItem(craft) {
      if (this.gameOver) return;
      
      // Check requirements
      if (!this.canAfford(craft.cost)) {
        this.displayMessage(MESSAGES.RESOURCES_LOW);
        return;
      }
      
      // Process crafting
      this.pay(craft.cost);
      this.items[craft.id] = true;
      craft.effect.call(this);
      
      // Check for any triggered events
      this.checkEvents();
    },
    
    //=====================================================================
    // UI AND INTERACTION
    //=====================================================================
    
    // ----- UI State Management -----
    initializeUIState() {
      if (!localStorage.getItem(STORAGE_KEYS.INTRO_SHOWN)) {
        this.showIntroVideo = true;
        this.showSplash = false;
        localStorage.setItem(STORAGE_KEYS.INTRO_SHOWN, '1');
      } else {
        this.showIntroVideo = false;
        this.showSplash = true;
      }
    },
    
    loadDebugSetting() {
      this.debugMode = localStorage.getItem(STORAGE_KEYS.DEBUG_MODE) === '1';
    },
    
    hideStartScreen() {
      this.showSplash = false;
    },
    
    showGameOverScreen() {
      this.finishShown = true;
    },
    
    // ----- UI Messaging -----
    displayMessage(text, cls=LOG_CLASSES.DEFAULT) {
      this.log(text, cls);
    },
    
    displayWelcomeMessage() {
      let name = this.computerName || localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || '';
      if (name) {
        this.displayMessage(`${name}! Gather food (Organics) and watch out for predators.`);
      } else {
        this.displayMessage('Gather food (Organics) and watch out for predators.');
      }
    },
    
    // ----- Logging System -----
    log(text, cls=LOG_CLASSES.DEFAULT) {
      // Create a new array to ensure Alpine detects the change
      this.logMessages = [...this.logMessages, {text, cls}];
      this.$nextTick(() => {
        if (this.$refs.messages) {
          this.$refs.messages.scrollTop = this.$refs.messages.scrollHeight;
        }
      });
    },
    
    // ----- Ship Computer Intro UI -----
    startComputerIntro() {
      this.hideIntroVideo();
      this.showComputerIntroScreen();
      this.pauseGame();
      this.resetComputerIntroStep();
    },
    
    hideIntroVideo() {
      this.showIntroVideo = false;
    },
    
    showComputerIntroScreen() {
      this.showComputerIntro = true;
    },
    
    resetComputerIntroStep() {
      this.computerIntroStep = 0;
    },
    
    nextComputerIntro() {
      if (this.computerIntroStep === 0) {
        this.advanceToNameInput();
      } else if (this.computerIntroStep === 1) {
        this.processPossibleNameInput();
      } else if (this.computerIntroStep === 2) {
        this.finishComputerIntro();
      }
    },
    
    advanceToNameInput() {
      this.computerIntroStep = 1;
    },
    
    processPossibleNameInput() {
      if (this.computerNameInput.trim()) {
        this.savePlayerName(this.computerNameInput.trim());
        this.advanceToCrashMessage();
      }
    },
    
    savePlayerName(name) {
      this.computerName = name;
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name);
    },
    
    advanceToCrashMessage() {
      this.computerIntroStep = 2;
    },
    
    finishComputerIntro() {
      this.showComputerIntro = false;
      this.showSplash = true;
      // Keep paused state since we're moving to splash screen
    },
    
    onComputerNameKey(e) {
      if (e.key === 'Enter') {
        this.nextComputerIntro();
      }
    }
  }
}

// Make sure Alpine picks up the function
document.addEventListener('alpine:init', () => {
  window.game = window.game;
});
