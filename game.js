// game.js
// Use the global GAME_CONSTANTS object
const { INITIAL_STATE, TIMERS, MESSAGES, STORAGE_KEYS, GATHERING, SOLAR, LOG_CLASSES } = window.GAME_CONSTANTS;

// Define the game function and expose to window
window.game = function game() {
  return {
    // ----- State -----
    energy: INITIAL_STATE.ENERGY,
    energyCap: INITIAL_STATE.ENERGY_CAP,
    minerals: INITIAL_STATE.MINERALS,
    organics: INITIAL_STATE.ORGANICS,
    gatherMinerals: INITIAL_STATE.GATHER_MINERALS_RATE,
    gatherOrganics: INITIAL_STATE.GATHER_ORGANICS_RATE,
    items: {},
    built: { solarCollector: 0 },
    totalGathered: 0,
    gameOver: false,
    gameOverReason: '',
    stageComplete: false,
    logMessages: [],
    memoryShown: false,
    ariaWarn: false,
    finishShown: false,
    days: INITIAL_STATE.START_DAY, // Start at Day 1
    showSplash: false,
    showIntroVideo: false,
    paused: false,
    showComputerIntro: false, // Show after video, before splash
    computerIntroStep: 0, // 0: Wake up, 1: Memory loss/name, 2: Crash message
    computerName: '',
    computerNameInput: '',
    debugMode: false, // Toggle for debug button visibility
    solarInterval: null,
    energyInterval: null,
    hungerInterval: null,

    // ----- Craft Definitions -----
    crafts: [
      {id:'scavengingTools', name:'Scavenging Tools', cost:{minerals:10}, prereq:[], effect(){ this.gatherMinerals = 2; this.gatherOrganics = 2; this.log('The improvised tools speed up gathering.');}},
      {id:'emergencyBeacon', name:'Emergency Beacon', cost:{energy:15, minerals:5}, prereq:['scavengingTools'], effect(){ this.log('A faint signal pulses into the sky... will anyone hear it?');}},
      {id:'primitiveWeapons', name:'Primitive Weapons', cost:{minerals:20, organics:5}, prereq:['scavengingTools'], effect(){ this.log('Crude weapons fashioned. Wildlife encounters will be safer.');}},
      {id:'solarCollector', name:'Solar Collector', cost:{minerals:25}, prereq:[], effect(){ this.built.solarCollector++; this.log('Solar panels deployed. Passive energy begins to flow.');}},
      {id:'batteryBank', name:'Battery Bank', cost:{minerals:30, energy:20}, prereq:['solarCollector'], effect(){ this.energyCap += 100; this.log('Additional batteries increase energy storage.');}},
      {id:'recyclingStation', name:'Recycling Station', cost:{energy:20, minerals:10}, prereq:['solarCollector'], effect(){ this.gatherMinerals = 4; this.log('Debris processing enabled. Minerals production boosted.');}},
      {id:'basicAlloys', name:'Basic Alloys (Complete Stage 1)', cost:{energy:50, minerals:50, organics:25}, prereq:['recyclingStation','batteryBank'], effect(){ this.stageComplete = true; this.log('Alloys forged! Stage 1 complete – a settlement beckons...');}}
    ],

    // ----- Helper Methods -----
    log(text, cls=LOG_CLASSES.DEFAULT) {
      // Create a new array to ensure Alpine detects the change
      this.logMessages = [...this.logMessages, {text, cls}];
      this.$nextTick(() => {
        if (this.$refs.messages) {
          this.$refs.messages.scrollTop = this.$refs.messages.scrollHeight;
        }
      });
    },
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
      if (!this.canAfford(craft.cost)) { this.log('Not enough resources'); return; }
      this.pay(craft.cost);
      this.items[craft.id] = true;
      craft.effect.call(this);
      this.checkEvents();
    },
    wildlifeEncounter() {
      if (Math.random() < GATHERING.WILDLIFE_ENCOUNTER_CHANCE) {
        if (this.items.primitiveWeapons) {
          this.log('A predator lunges, but you drive it off with your weapons.');
        } else {
          const stolen = Math.min(this.organics, GATHERING.MAX_ORGANICS_STOLEN);
          this.organics -= stolen;
          this.log(`A predator steals ${stolen} food from your stores!`, LOG_CLASSES.DANGER);
        }
        return true;
      }
      return false;
    },
    gather(type) {
      if (this.gameOver) return;
      if (type === 'energy') {
        if (this.energy >= this.energyCap) { this.log(MESSAGES.ENERGY_FULL); return; }
        this.energy += 1;
      } else {
        if (this.wildlifeEncounter()) return;
        if (type === 'minerals') this.minerals += this.gatherMinerals;
        if (type === 'organics') this.organics += this.gatherOrganics;
      }
      this.totalGathered += 1;
      this.days += 1; // Increment day counter on each gather
      this.checkEvents();
    },
    gameOverFunc(reason) {
      if (this.gameOver) return;
      this.gameOver = true;
      this.gameOverReason = reason;
      this.finishShown = true;
      let name = this.computerName || localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || '';
      if (typeof umami !== 'undefined' && umami.track) {
        umami.track('game_over', { reason: reason, days: this.days, name: name });
      }
      if (typeof posthog !== 'undefined' && posthog.capture) {
        posthog.capture('game_over', { reason: reason, days: this.days, name: name });
      }
      console.log('Game over triggered:', reason); // Debug log
    },
    checkEvents() {
      if (this.totalGathered >= GATHERING.TOTAL_GATHERED_MEMORY_THRESHOLD && !this.memoryShown) {
        this.log(MESSAGES.MEMORY_FRAGMENT);
        this.memoryShown = true;
      }
      if (this.items.solarCollector && !this.ariaWarn) {
        this.log(MESSAGES.ARIA_ENERGY_WARNING);
        this.ariaWarn = true;
      }
      if (this.stageComplete && !this.finishShown) {
        this.log(MESSAGES.STAGE_COMPLETE, 'msg');
        this.finishShown = true;
        this.gameOver = true; // Prevent further countdowns and game over triggers
      }
    },

    // ----- Ship Computer Intro Methods -----
    startComputerIntro() {
      this.showIntroVideo = false;
      this.showComputerIntro = true;
      this.paused = true; // Ensure timers are paused during computer intro
      this.computerIntroStep = 0;
    },
    nextComputerIntro() {
      if (this.computerIntroStep === 0) {
        this.computerIntroStep = 1;
      } else if (this.computerIntroStep === 1) {
        if (this.computerNameInput.trim()) {
          this.computerName = this.computerNameInput.trim();
          localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, this.computerName);
          this.computerIntroStep = 2;
        }
      } else if (this.computerIntroStep === 2) {
        this.showComputerIntro = false;
        this.showSplash = true;
        // Keep paused state since we're moving to splash screen
      }
    },
    onComputerNameKey(e) {
      if (e.key === 'Enter') {
        this.nextComputerIntro();
      }
    },

    // ----- Init -----
    init() {
      // Only set initial state and variables, but don't start timers yet
      // Timers will be started in startGame()
      this.paused = true; // Start with everything paused
      
      console.log("[INIT] Game initialized, timers paused until game starts");
    },
    startGame() {
      this.showSplash = false;
      this.paused = false; // Unpause timers when Begin button is clicked
      
      // Start all game timers when the game actually begins
      
      // Passive solar generation
      this.solarInterval = setInterval(() => {
        if (this.gameOver || this.paused) return;
        if (this.built.solarCollector > 0) {
          const produced = SOLAR.ENERGY_PER_COLLECTOR * this.built.solarCollector;
          this.energy = Math.min(this.energyCap, this.energy + produced);
          console.log(`[SOLAR] Generated ${produced} energy, new total: ${this.energy}/${this.energyCap}`);
        }
      }, TIMERS.SOLAR_GENERATION);

      // Energy drain
      this.energyInterval = setInterval(() => {
        if (this.gameOver || this.paused) return;
        this.energy -= 1;
        console.log(`[ENERGY] Consumed 1 energy, remaining: ${this.energy}/${this.energyCap}`);
        if (this.energy < 0) this.gameOverFunc(MESSAGES.ENERGY_DEPLETED);
      }, TIMERS.ENERGY_DRAIN);

      // Hunger
      this.hungerInterval = setInterval(() => {
        if (this.gameOver || this.paused) return;
        if (this.organics > 0) {
          this.organics -= 1;
          this.days += 1; // Increment day counter when food is consumed
          console.log(`[DAY] Day ${this.days} begins. Consumed 1 organics, remaining: ${this.organics}`);
        } else {
          this.gameOverFunc(MESSAGES.STARVED);
        }
      }, TIMERS.HUNGER);
      
      console.log("[GAME] Game started, timers active");
      
      let name = this.computerName || localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || '';
      if (name) {
        this.log(`${name}! Gather food (Organics) and watch out for predators.`);
      } else {
        this.log('Gather food (Organics) and watch out for predators.');
      }
    },
    $init() {
      if (!localStorage.getItem(STORAGE_KEYS.INTRO_SHOWN)) {
        this.showIntroVideo = true;
        this.showSplash = false;
        localStorage.setItem(STORAGE_KEYS.INTRO_SHOWN, '1');
      } else {
        this.showIntroVideo = false;
        this.showSplash = true;
      }
      
      // Initialize game systems but timers will be paused by default if showing splash
      this.init();
      
      // Load debug mode setting from localStorage
      this.debugMode = localStorage.getItem(STORAGE_KEYS.DEBUG_MODE) === '1';
    },
    initAlpine() {
      this.$init();
    }
  }
}

// Make sure Alpine picks up the function
document.addEventListener('alpine:init', () => {
  window.game = window.game;
});
