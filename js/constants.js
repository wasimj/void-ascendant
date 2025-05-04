// Game Constants

// Attach constants to window object for global access
window.GAME_CONSTANTS = {
  // Initial State
  INITIAL_STATE: {
    ENERGY: 10,
    ENERGY_CAP: 50,
    MINERALS: 0,
    ORGANICS: 3,
    GATHER_MINERALS_RATE: 1,
    GATHER_ORGANICS_RATE: 1,
    START_DAY: 1
  },

  // Timer Intervals (in milliseconds)
  TIMERS: {
    SOLAR_GENERATION: 1000,  // 1 second
    ENERGY_DRAIN: 5000,      // 5 seconds
    HUNGER: 10000            // 10 seconds
  },

  // Game Messages
  MESSAGES: {
    // Game Over Messages
    ENERGY_DEPLETED: 'Life‑support failed after energy depletion.',
    STARVED: 'You starved to death.',
    
    // Game Progress Messages
    MEMORY_FRAGMENT: 'Memory Fragment: A flash – the Athena breaking apart above the planet...',
    ARIA_ENERGY_WARNING: 'ARIA: "Unexplained energy signature detected nearby..."',
    STAGE_COMPLETE: 'Congratulations. You survived the wilds and laid the foundations for a future colony!',
    
    // Player Action Messages
    RESOURCES_LOW: 'Not enough resources',
    ENERGY_FULL: 'Energy stores full.'
  },

  // Local Storage Keys
  STORAGE_KEYS: {
    INTRO_SHOWN: 'voidascendant_intro_shown',
    PLAYER_NAME: 'voidascendant_player_name',
    DEBUG_MODE: 'voidascendant_debug_mode'
  },

  // Resource Gathering
  GATHERING: {
    WILDLIFE_ENCOUNTER_CHANCE: 0.05, // 5% chance
    MAX_ORGANICS_STOLEN: 3,
    TOTAL_GATHERED_MEMORY_THRESHOLD: 50
  },

  // Solar Collection
  SOLAR: {
    ENERGY_PER_COLLECTOR: 2
  },

  // CSS Classes for Log Messages
  LOG_CLASSES: {
    DEFAULT: 'msg',
    DANGER: 'danger',
    NARRATIVE: 'narrative',
    GAMEOVER: 'gameover'
  }
};
