// game.js
// Use the global GAME_CONSTANTS object
const { INITIAL_STATE, TIMERS, MESSAGES, STORAGE_KEYS, GATHERING, SOLAR, LOG_CLASSES } = window.GAME_CONSTANTS;

// Define the game function and expose to window
window.game = function game() {
  // Create a merged object with core functionality and remaining game systems
  const gameObject = {
    // Import core functionality
    ...window.gameCore,
    
    //=====================================================================
    // UI STATE
    //=====================================================================
    
    // ----- UI State -----
    logMessages: [],
    showSplash: false,
    showIntroVideo: false,
    debugMode: false, // Toggle for debug button visibility
    
    // ----- Ship Computer Intro -----
    showComputerIntro: false, // Show after video, before splash
    computerIntroStep: 0, // 0: Wake up, 1: Memory loss/name, 2: Crash message
    computerName: '',
    computerNameInput: '',
    
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
    },
    
    //=====================================================================
    // ALPINE INITIALIZATION
    //=====================================================================
    
    $init() {
      // Initialize UI state
      this.initializeUIState();
      
      // Initialize game systems but timers will be paused by default if showing splash
      this.init();
      
      // Load debug mode setting from localStorage
      this.loadDebugSetting();
    },
    
    initAlpine() {
      // Initialize Alpine.js
      this.$init();
    }
  };
  
  return gameObject;
};

// Make sure Alpine picks up the function
document.addEventListener('alpine:init', () => {
  window.game = window.game;
});
