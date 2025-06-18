// Piano Learning App JavaScript

class PianoLearningApp {
    constructor() {
        this.audioContext = null;
        this.currentMode = 'freePlay';
        this.volume = 0.7; // Increased volume (0.7 instead of default 0.3)
        this.isMuted = false;
        this.currentMelody = null;
        this.currentStep = 0;
        this.expectedNotes = [];
        this.userInput = [];
        this.isLearningActive = false;
        
        // Note frequencies
        this.frequencies = {
            "C": 261.63, "C#": 277.18, "D": 293.66, "D#": 311.13, 
            "E": 329.63, "F": 349.23, "F#": 369.99, "G": 392.00, 
            "G#": 415.30, "A": 440.00, "A#": 466.16, "B": 493.88
        };
        
        // Keyboard mapping
        this.keyMapping = {
            "A": "C", "W": "C#", "S": "D", "E": "D#", "D": "E", "F": "F", 
            "T": "F#", "G": "G", "Y": "G#", "H": "A", "U": "A#", "J": "B"
        };
        
        // 15 Melodies data
        this.melodies = [
            {"name": "Twinkle Twinkle Little Star", "steps": [["C","C","G","G"], ["A","A","G"], ["F","F","E","E"], ["D","D","C"]]},
            {"name": "Mary Had a Little Lamb", "steps": [["E","D","C","D"], ["E","E","E"], ["D","D","D"], ["E","G","G"]]},
            {"name": "Happy Birthday", "steps": [["G","G","A","G"], ["C","B"], ["G","G","A","G"], ["D","C"]]},
            {"name": "Row Row Row Your Boat", "steps": [["C","C","C","D"], ["E"], ["E","D","E","F"], ["G"]]},
            {"name": "Jingle Bells", "steps": [["E","E","E"], ["E","E","E"], ["E","G","C","D"], ["E"]]},
            {"name": "Old MacDonald", "steps": [["G","G","G","D"], ["E","E","D"], ["B","B","A","A"], ["G"]]},
            {"name": "London Bridge", "steps": [["G","A","G","F"], ["E","F","G"], ["D","E","F"], ["E","F","G"]]},
            {"name": "Hot Cross Buns", "steps": [["E","D","C"], ["E","D","C"], ["C","C","C","C"], ["E","D","C"]]},
            {"name": "Three Blind Mice", "steps": [["E","D","C"], ["E","D","C"], ["G","F#","F#","E"], ["G","F#","F#","E"]]},
            {"name": "Itsy Bitsy Spider", "steps": [["G","C","C","C"], ["D","E","E","E"], ["D","C","D","E"], ["C"]]},
            {"name": "Мишка Косолапый", "steps": [["C","D","E","F"], ["G","G"], ["F","E","D"], ["C"]]},
            {"name": "Калинка", "steps": [["E","E","E","E"], ["D","C"], ["D","D","D","D"], ["C","B"]]},
            {"name": "АРАМ ЗАМ ЗАМ", "steps": [["C","C","D","E"], ["F","F"], ["E","D"], ["C"]]},
            {"name": "Ладушки", "steps": [["C","D","E","F"], ["G"], ["G","F","E","D"], ["C"]]},
            {"name": "Каравай", "steps": [["G","G","A","B"], ["C"], ["C","B","A"], ["G"]]}
        ];
    }
    
    async init() {
        await this.initAudio();
        this.populateMelodySelect(); // Move this before setupEventListeners
        this.setupEventListeners();
        this.updateVolumeDisplay();
    }
    
    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.error('Audio context initialization failed:', error);
        }
    }
    
    populateMelodySelect() {
        const select = document.getElementById('melodySelect');
        if (!select) {
            console.error('Melody select element not found');
            return;
        }
        
        // Clear existing options except the first one
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // Add melody options
        this.melodies.forEach((melody, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = melody.name;
            select.appendChild(option);
        });
        
        console.log(`Added ${this.melodies.length} melodies to select`);
    }
    
    setupEventListeners() {
        // Mode switching
        const freePlayBtn = document.getElementById('freePlayBtn');
        const learningBtn = document.getElementById('learningBtn');
        
        if (freePlayBtn) freePlayBtn.addEventListener('click', () => this.switchMode('freePlay'));
        if (learningBtn) learningBtn.addEventListener('click', () => this.switchMode('learning'));
        
        // Volume controls
        const volumeSlider = document.getElementById('volumeSlider');
        const muteBtn = document.getElementById('muteBtn');
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.volume = parseInt(e.target.value) / 100 * 0.8; // Max volume 0.8 for increased loudness
                this.updateVolumeDisplay();
            });
        }
        
        if (muteBtn) muteBtn.addEventListener('click', () => this.toggleMute());
        
        // Piano keys - mouse events
        document.querySelectorAll('.white-key, .black-key').forEach(key => {
            key.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.playNote(e.target.dataset.note);
            });
            key.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.releaseNote(e.target.dataset.note);
            });
            key.addEventListener('mouseleave', (e) => {
                this.releaseNote(e.target.dataset.note);
            });
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Learning mode controls
        const melodySelect = document.getElementById('melodySelect');
        const playDemoBtn = document.getElementById('playDemoBtn');
        const repeatStepBtn = document.getElementById('repeatStepBtn');
        const nextStepBtn = document.getElementById('nextStepBtn');
        
        if (melodySelect) melodySelect.addEventListener('change', (e) => this.selectMelody(e.target.value));
        if (playDemoBtn) playDemoBtn.addEventListener('click', () => this.playDemo());
        if (repeatStepBtn) repeatStepBtn.addEventListener('click', () => this.repeatStep());
        if (nextStepBtn) nextStepBtn.addEventListener('click', () => this.nextStep());
    }
    
    switchMode(mode) {
        this.currentMode = mode;
        
        // Update button states
        const freePlayBtn = document.getElementById('freePlayBtn');
        const learningBtn = document.getElementById('learningBtn');
        const learningPanel = document.getElementById('learningPanel');
        
        if (freePlayBtn) freePlayBtn.classList.toggle('active', mode === 'freePlay');
        if (learningBtn) learningBtn.classList.toggle('active', mode === 'learning');
        
        // Show/hide learning panel
        if (learningPanel) learningPanel.classList.toggle('hidden', mode === 'freePlay');
        
        // Reset learning state
        if (mode === 'freePlay') {
            this.resetLearning();
        }
    }
    
    updateVolumeDisplay() {
        const displayValue = Math.round(this.volume / 0.8 * 100);
        const volumeValue = document.getElementById('volumeValue');
        const volumeSlider = document.getElementById('volumeSlider');
        
        if (volumeValue) volumeValue.textContent = `${displayValue}%`;
        if (volumeSlider) volumeSlider.value = displayValue;
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            muteBtn.textContent = this.isMuted ? '🔊 Увімкнути' : '🔇 Вимкнути';
            muteBtn.classList.toggle('btn--primary', this.isMuted);
            muteBtn.classList.toggle('btn--outline', !this.isMuted);
        }
    }
    
    async playNote(note) {
        if (!this.audioContext || this.isMuted || !note) return;
        
        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        
        // Visual feedback
        this.showKeyPress(note);
        
        // Play sound with increased volume
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(this.frequencies[note], this.audioContext.currentTime);
        
        // Increased volume: 0.6-0.8 range instead of 0.2-0.3
        const actualVolume = Math.max(0.6, this.volume);
        gainNode.gain.setValueAtTime(actualVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
        
        // Handle learning mode input
        if (this.currentMode === 'learning' && this.isLearningActive) {
            this.handleLearningInput(note);
        }
    }
    
    releaseNote(note) {
        this.hideKeyPress(note);
    }
    
    showKeyPress(note) {
        const key = document.querySelector(`[data-note="${note}"]`);
        if (key) {
            key.classList.add('active');
        }
    }
    
    hideKeyPress(note) {
        const key = document.querySelector(`[data-note="${note}"]`);
        if (key) {
            key.classList.remove('active');
        }
    }
    
    handleKeyDown(e) {
        const note = this.keyMapping[e.key.toUpperCase()];
        if (note && !e.repeat) {
            this.playNote(note);
        }
    }
    
    handleKeyUp(e) {
        const note = this.keyMapping[e.key.toUpperCase()];
        if (note) {
            this.releaseNote(note);
        }
    }
    
    selectMelody(index) {
        if (index === '' || index === null || index === undefined) {
            this.resetLearning();
            return;
        }
        
        const melodyIndex = parseInt(index);
        if (melodyIndex < 0 || melodyIndex >= this.melodies.length) {
            console.error('Invalid melody index:', melodyIndex);
            return;
        }
        
        this.currentMelody = this.melodies[melodyIndex];
        this.currentStep = 0;
        this.userInput = [];
        this.isLearningActive = false;
        
        const learningContent = document.getElementById('learningContent');
        const currentMelody = document.getElementById('currentMelody');
        
        if (learningContent) learningContent.classList.remove('hidden');
        if (currentMelody) currentMelody.textContent = this.currentMelody.name;
        
        this.updateLearningUI();
    }
    
    updateLearningUI() {
        if (!this.currentMelody) return;
        
        const totalSteps = this.currentMelody.steps.length;
        const progress = ((this.currentStep) / totalSteps) * 100;
        
        const stepProgress = document.getElementById('stepProgress');
        const progressFill = document.getElementById('progressFill');
        const instructionText = document.getElementById('instructionText');
        const nextStepBtn = document.getElementById('nextStepBtn');
        
        if (stepProgress) stepProgress.textContent = `Етап ${this.currentStep + 1} з ${totalSteps}`;
        if (progressFill) progressFill.style.width = `${progress}%`;
        
        const currentStepNotes = this.currentMelody.steps[this.currentStep];
        if (instructionText) {
            instructionText.textContent = `Етап ${this.currentStep + 1}: Зіграйте ноти: ${currentStepNotes.join(' - ')}`;
        }
        
        this.expectedNotes = [...currentStepNotes];
        this.userInput = [];
        this.isLearningActive = false;
        
        // Update button states
        if (nextStepBtn) nextStepBtn.disabled = true;
        
        // Highlight expected keys
        this.highlightExpectedKeys();
    }
    
    highlightExpectedKeys() {
        // Clear previous highlights
        document.querySelectorAll('.expected').forEach(key => {
            key.classList.remove('expected');
        });
        
        // Highlight current expected note
        if (this.userInput.length < this.expectedNotes.length) {
            const nextNote = this.expectedNotes[this.userInput.length];
            const key = document.querySelector(`[data-note="${nextNote}"]`);
            if (key) {
                key.classList.add('expected');
            }
        }
    }
    
    async playDemo() {
        if (!this.currentMelody || !this.audioContext) return;
        
        this.isLearningActive = false;
        const notes = this.currentMelody.steps[this.currentStep];
        
        const instructionText = document.getElementById('instructionText');
        if (instructionText) instructionText.textContent = 'Слухайте демонстрацію...';
        
        for (let i = 0; i < notes.length; i++) {
            await this.sleep(200);
            this.playNote(notes[i]);
            await this.sleep(600);
            this.releaseNote(notes[i]);
        }
        
        await this.sleep(500);
        if (instructionText) {
            instructionText.textContent = `Тепер спробуйте повторити: ${notes.join(' - ')}`;
        }
        this.isLearningActive = true;
    }
    
    handleLearningInput(note) {
        if (!this.isLearningActive || !this.expectedNotes.length) return;
        
        const expectedNote = this.expectedNotes[this.userInput.length];
        const instructionText = document.getElementById('instructionText');
        const nextStepBtn = document.getElementById('nextStepBtn');
        
        if (note === expectedNote) {
            this.userInput.push(note);
            this.highlightExpectedKeys();
            
            if (this.userInput.length === this.expectedNotes.length) {
                // Step completed
                if (instructionText) instructionText.textContent = '✅ Відмінно! Етап завершено!';
                if (nextStepBtn) nextStepBtn.disabled = false;
                this.isLearningActive = false;
                
                // Clear highlights
                document.querySelectorAll('.expected').forEach(key => {
                    key.classList.remove('expected');
                });
            }
        } else {
            // Wrong note
            if (instructionText) {
                instructionText.textContent = `❌ Неправильно. Спробуйте ще раз: ${this.expectedNotes.join(' - ')}`;
            }
            this.userInput = [];
            this.highlightExpectedKeys();
        }
    }
    
    repeatStep() {
        this.updateLearningUI();
    }
    
    nextStep() {
        if (!this.currentMelody) return;
        
        this.currentStep++;
        
        const instructionText = document.getElementById('instructionText');
        const stepProgress = document.getElementById('stepProgress');
        const progressFill = document.getElementById('progressFill');
        const nextStepBtn = document.getElementById('nextStepBtn');
        
        if (this.currentStep >= this.currentMelody.steps.length) {
            // Melody completed
            if (instructionText) {
                instructionText.textContent = '🎉 Вітаємо! Ви завершили мелодію! Оберіть іншу для продовження навчання.';
            }
            if (stepProgress) stepProgress.textContent = 'Завершено!';
            if (progressFill) progressFill.style.width = '100%';
            if (nextStepBtn) nextStepBtn.disabled = true;
            this.isLearningActive = false;
        } else {
            this.updateLearningUI();
        }
    }
    
    resetLearning() {
        this.currentMelody = null;
        this.currentStep = 0;
        this.userInput = [];
        this.expectedNotes = [];
        this.isLearningActive = false;
        
        const melodySelect = document.getElementById('melodySelect');
        const learningContent = document.getElementById('learningContent');
        
        if (melodySelect) melodySelect.value = '';
        if (learningContent) learningContent.classList.add('hidden');
        
        // Clear highlights
        document.querySelectorAll('.expected').forEach(key => {
            key.classList.remove('expected');
        });
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Piano Learning App...');
    const app = new PianoLearningApp();
    app.init().then(() => {
        console.log('Piano Learning App initialized successfully');
    }).catch(error => {
        console.error('Failed to initialize Piano Learning App:', error);
    });
});