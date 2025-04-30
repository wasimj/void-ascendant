// game.js
window.game = function game() {
  return {
    // ----- State -----
    energy: 10,
    energyCap: 50,
    minerals: 0,
    organics: 3,
    gatherMinerals: 1,
    gatherOrganics: 1,
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
    days: 1, // Start at Day 1
    showSplash: false,
    showIntroVideo: false,
    paused: false,

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
    log(text, cls='msg') {
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
      if (Math.random() < 0.05) {
        if (this.items.primitiveWeapons) {
          this.log('A predator lunges, but you drive it off with your weapons.');
        } else {
          const stolen = Math.min(this.organics, 3);
          this.organics -= stolen;
          this.log(`A predator steals ${stolen} food from your stores!`, 'danger');
        }
        return true;
      }
      return false;
    },
    gather(type) {
      if (this.gameOver) return;
      if (type === 'energy') {
        if (this.energy >= this.energyCap) { this.log('Energy stores full.'); return; }
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
      if (typeof umami !== 'undefined' && umami.track) {
        umami.track('game_over', { reason: reason, days: this.days });
        umami.track('reason', { days: this.days });
      }
      console.log('Game over triggered:', reason); // Debug log
    },
    checkEvents() {
      if (this.totalGathered >= 50 && !this.memoryShown) {
        this.log('Memory Fragment: A flash – the Athena breaking apart above the planet...');
        this.memoryShown = true;
      }
      if (this.items.solarCollector && !this.ariaWarn) {
        this.log('ARIA: "Unexplained energy signature detected nearby..."');
        this.ariaWarn = true;
      }
      if (this.stageComplete && !this.finishShown) {
        this.log('Congratulations. You survived the wilds and laid the foundations for a future colony!', 'msg');
        this.finishShown = true;
        this.gameOver = true; // Prevent further countdowns and game over triggers
      }
    },

    // ----- Init -----
    init() {
      // Passive solar generation
      setInterval(() => {
        if (this.gameOver || this.paused) return;
        if (this.built.solarCollector > 0) {
          const produced = 2 * this.built.solarCollector;
          this.energy = Math.min(this.energyCap, this.energy + produced);
        }
      }, 1000);

      // Energy drain
      setInterval(() => {
        if (this.gameOver || this.paused) return;
        this.energy -= 1;
        if (this.energy < 0) this.gameOverFunc('Life‑support failed after energy depletion.');
      }, 5000);

      // Hunger
      setInterval(() => {
        if (this.gameOver || this.paused) return;
        if (this.organics > 0) {
          this.organics -= 1;
          this.days += 1; // Increment day counter when food is consumed
        } else {
          this.gameOverFunc('You starved to death.');
        }
      }, 10000);
    },
    startGame() {
      this.showSplash = false;
      this.init();
      this.log('Gather food (Organics) and watch out for predators.');
    },
    $init() {
      if (!localStorage.getItem('voidascendant_intro_shown')) {
        this.showIntroVideo = true;
        this.showSplash = false;
        localStorage.setItem('voidascendant_intro_shown', '1');
      } else {
        this.showIntroVideo = false;
        this.showSplash = true;
      }
    },
    initAlpine() {
      this.$init();
    }
  }
}

// Ensure Alpine picks up the function after script load
document.addEventListener('alpine:init', () => {
  window.game = window.game;
});
