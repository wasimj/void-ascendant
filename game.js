// game.js
// Use the global GAME_CONSTANTS object
const { INITIAL_STATE, TIMERS, MESSAGES, STORAGE_KEYS, GATHERING, SOLAR, LOG_CLASSES } = window.GAME_CONSTANTS;

// Define the game function and expose to window
window.game = function game() {
  // Create a merged object with core functionality, UI functionality, and remaining game systems
  const gameObject = {
    // Import core functionality
    ...window.gameCore,
    
    // Import UI functionality
    ...window.gameUI,
    
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
