// ui.js - UI-related functionality
// Uses the global GAME_CONSTANTS object and the window.gameCore functionality

/**
 * UI module providing UI state management, messaging, logging, and intro sequence functionality
 */
window.gameUI = {
    //=====================================================================
    // UI STATE
    //=====================================================================
    
    // ----- UI State -----
    logMessages: [],
    showSplash: false,
    showIntroVideo: false,
    debugMode: false, // Toggle for debug button visibility
    finishShown: false, // Game over state
    
    // ----- Ship Computer Intro -----
    showComputerIntro: false, // Show after video, before splash
    computerIntroStep: 0, // 0: Wake up, 1: Memory loss/name, 2: Crash message
    computerName: '',
    computerNameInput: '',
    
    //=====================================================================
    // UI STATE MANAGEMENT
    //=====================================================================
    
    initializeUIState() {
        if (!localStorage.getItem(window.GAME_CONSTANTS.STORAGE_KEYS.INTRO_SHOWN)) {
            this.showIntroVideo = true;
            this.showSplash = false;
            localStorage.setItem(window.GAME_CONSTANTS.STORAGE_KEYS.INTRO_SHOWN, '1');
        } else {
            this.showIntroVideo = false;
            this.showSplash = true;
        }
    },
    
    loadDebugSetting() {
        this.debugMode = localStorage.getItem(window.GAME_CONSTANTS.STORAGE_KEYS.DEBUG_MODE) === '1';
    },
    
    hideStartScreen() {
        this.showSplash = false;
    },
    
    showGameOverScreen() {
        this.finishShown = true;
    },
    
    //=====================================================================
    // UI MESSAGING
    //=====================================================================
    
    displayMessage(text, cls = window.GAME_CONSTANTS.LOG_CLASSES.DEFAULT) {
        this.log(text, cls);
    },
    
    displayWelcomeMessage() {
        let name = this.computerName || localStorage.getItem(window.GAME_CONSTANTS.STORAGE_KEYS.PLAYER_NAME) || '';
        if (name) {
            this.displayMessage(`${name}! Gather food (Organics) and watch out for predators.`);
        } else {
            this.displayMessage('Gather food (Organics) and watch out for predators.');
        }
    },
    
    //=====================================================================
    // LOGGING SYSTEM
    //=====================================================================
    
    log(text, cls = window.GAME_CONSTANTS.LOG_CLASSES.DEFAULT) {
        // Create a new array to ensure Alpine detects the change
        this.logMessages = [...this.logMessages, {text, cls}];
        this.$nextTick(() => {
            if (this.$refs.messages) {
                this.$refs.messages.scrollTop = this.$refs.messages.scrollHeight;
            }
        });
    },
    
    //=====================================================================
    // SHIP COMPUTER INTRO UI
    //=====================================================================
    
    startComputerIntro() {
        this.hideIntroVideo();
        this.showComputerIntroScreen();
        window.gameCore.pauseGame();
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
        localStorage.setItem(window.GAME_CONSTANTS.STORAGE_KEYS.PLAYER_NAME, name);
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
    
    initAlpine() {
        // No direct initialization here since this will be merged into the game object
    }
};
