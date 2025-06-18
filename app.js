// Application data
const melodies = [
    {
        name: "Twinkle Twinkle Little Star",
        notes: ["C", "C", "G", "G", "A", "A", "G", "F", "F", "E", "E", "D", "D", "C"],
        stages: [
            ["C", "C", "G", "G"],
            ["A", "A", "G"],
            ["F", "F", "E", "E"],
            ["D", "D", "C"]
        ]
    },
    {
        name: "Mary Had a Little Lamb", 
        notes: ["E", "D", "C", "D", "E", "E", "E", "D", "D", "D", "E", "G", "G"],
        stages: [
            ["E", "D", "C", "D"],
            ["E", "E", "E"],
            ["D", "D", "D"],
            ["E", "G", "G"]
        ]
    },
    {
        name: "Happy Birthday",
        notes: ["G", "G", "A", "G", "C", "B", "G", "G", "A", "G", "D", "C"],
        stages: [
            ["G", "G", "A", "G"],
            ["C", "B"],
            ["G", "G", "A", "G"],
            ["D", "C"]
        ]
    },
    {
        name: "Old MacDonald",
        notes: ["G", "G", "G", "D", "E", "E", "D", "B", "B", "A", "A", "G"],
        stages: [
            ["G", "G", "G", "D"],
            ["E", "E", "D"],
            ["B", "B", "A", "A"],
            ["G"]
        ]
    },
    {
        name: "Row Row Row Your Boat",
        notes: ["C", "C", "C", "D", "E", "E", "D", "E", "F", "G"],
        stages: [
            ["C", "C", "C", "D"],
            ["E", "E", "D"],
            ["E", "F", "G"]
        ]
    }
];

const noteFrequencies = {
    "C": 261.63,
    "C#": 277.18,
    "D": 293.66,
    "D#": 311.13,
    "E": 329.63,
    "F": 349.23,
    "F#": 369.99,
    "G": 392.00,
    "G#": 415.30,
    "A": 440.00,
    "A#": 466.16,
    "B": 493.88
};

const keyMapping = {
    "A": "C",
    "S": "C#", 
    "D": "D",
    "F": "D#",
    "G": "E",
    "H": "F",
    "J": "F#",
    "K": "G",
    "L": "G#",
    ";": "A",
    "'": "A#",
    "Enter": "B"
};

// Application state
let currentMode = 'free';
let audioContext = null;
let volume = 0.5;
let soundEnabled = true;

// Learning mode state
let currentMelody = null;
let currentStage = 0;
let expectedNotes = [];
let userInput = [];
let awaitingInput = false;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeAudio();
    setupEventListeners();
    switchMode('free');
});

// Audio initialization
function initializeAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
        console.error('Не вдалося ініціалізувати аудіо контекст:', error);
        soundEnabled = false;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Mode switching
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mode = e.target.dataset.mode;
            switchMode(mode);
        });
    });

    // Piano keys
    document.querySelectorAll('.key').forEach(key => {
        key.addEventListener('click', () => {
            const note = key.dataset.note;
            playNote(note);
            handleNoteInput(note);
        });
    });

    // Keyboard events
    document.addEventListener('keydown', (e) => {
        const key = e.key.toUpperCase();
        const note = keyMapping[key];
        if (note) {
            e.preventDefault();
            playNote(note);
            handleNoteInput(note);
        }
    });

    // Volume control
    const volumeSlider = document.getElementById('volume');
    const volumeValue = document.getElementById('volume-value');
    
    volumeSlider.addEventListener('input', (e) => {
        volume = e.target.value / 100;
        volumeValue.textContent = e.target.value + '%';
    });

    // Sound toggle
    document.getElementById('sound-toggle').addEventListener('click', (e) => {
        soundEnabled = !soundEnabled;
        e.target.textContent = soundEnabled ? '🔊 Звук увімкнено' : '🔇 Звук вимкнено';
    });

    // Learning mode controls
    setupLearningControls();
}

function setupLearningControls() {
    // Melody selection
    document.querySelectorAll('.melody-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const melodyIndex = parseInt(e.target.dataset.melody);
            selectMelody(melodyIndex);
        });
    });

    // Learning controls
    document.getElementById('play-stage').addEventListener('click', playCurrentStage);
    document.getElementById('next-stage').addEventListener('click', nextStage);
    document.getElementById('restart-melody').addEventListener('click', restartMelody);
    document.getElementById('back-to-selection').addEventListener('click', backToSelection);
}

// Mode switching
function switchMode(mode) {
    currentMode = mode;
    
    // Update mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
            btn.classList.remove('btn--outline');
            btn.classList.add('btn--primary');
        } else {
            btn.classList.remove('active');
            btn.classList.remove('btn--primary');
            btn.classList.add('btn--outline');
        }
    });

    // Show/hide mode panels
    document.getElementById('free-mode').classList.toggle('hidden', mode !== 'free');
    document.getElementById('learning-mode').classList.toggle('hidden', mode !== 'learning');
    
    // Clear any highlights
    clearKeyHighlights();
    
    if (mode === 'learning') {
        backToSelection();
    }
}

// Audio functions
function playNote(note) {
    if (!soundEnabled || !audioContext) return;

    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const frequency = noteFrequencies[note];
        if (!frequency) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';

        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume * 0.3, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        oscillator.start(now);
        oscillator.stop(now + 0.5);

        // Visual feedback
        const keyElement = document.querySelector(`[data-note="${note}"]`);
        if (keyElement) {
            keyElement.classList.add('active');
            keyElement.classList.add('animate-press');
            setTimeout(() => {
                keyElement.classList.remove('active');
                keyElement.classList.remove('animate-press');
            }, 200);
        }

    } catch (error) {
        console.error('Помилка при відтворенні ноти:', error);
    }
}

// Learning mode functions
function selectMelody(melodyIndex) {
    currentMelody = melodies[melodyIndex];
    currentStage = 0;
    userInput = [];
    awaitingInput = false;
    
    document.getElementById('melody-selection').classList.add('hidden');
    document.getElementById('learning-panel').classList.remove('hidden');
    
    updateLearningUI();
    highlightCurrentStage();
}

function updateLearningUI() {
    if (!currentMelody) return;
    
    document.getElementById('current-melody-name').textContent = currentMelody.name;
    document.getElementById('current-stage').textContent = currentStage + 1;
    document.getElementById('total-stages').textContent = currentMelody.stages.length;
    
    const progress = ((currentStage) / currentMelody.stages.length) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
    
    const currentNotes = currentMelody.stages[currentStage].join(' - ');
    document.getElementById('current-notes').textContent = currentNotes;
    
    document.getElementById('next-stage').disabled = true;
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').className = 'feedback';
}

function highlightCurrentStage() {
    clearKeyHighlights();
    
    if (!currentMelody || currentStage >= currentMelody.stages.length) return;
    
    const stageNotes = currentMelody.stages[currentStage];
    stageNotes.forEach(note => {
        const keyElement = document.querySelector(`[data-note="${note}"]`);
        if (keyElement) {
            keyElement.classList.add('highlight');
        }
    });
}

function clearKeyHighlights() {
    document.querySelectorAll('.key').forEach(key => {
        key.classList.remove('highlight', 'correct', 'wrong');
    });
}

function playCurrentStage() {
    if (!currentMelody || currentStage >= currentMelody.stages.length) return;
    
    const stageNotes = currentMelody.stages[currentStage];
    expectedNotes = [...stageNotes];
    userInput = [];
    awaitingInput = false;
    
    showFeedback('Слухайте і запам\'ятовуйте...', 'info');
    
    let noteIndex = 0;
    const playNextNote = () => {
        if (noteIndex < stageNotes.length) {
            playNote(stageNotes[noteIndex]);
            noteIndex++;
            setTimeout(playNextNote, 600);
        } else {
            setTimeout(() => {
                showFeedback('Тепер повторіть цю послідовність', 'info');
                awaitingInput = true;
            }, 500);
        }
    };
    
    playNextNote();
}

function handleNoteInput(note) {
    if (currentMode !== 'learning' || !awaitingInput || !expectedNotes.length) return;
    
    userInput.push(note);
    
    const expectedNote = expectedNotes[userInput.length - 1];
    const keyElement = document.querySelector(`[data-note="${note}"]`);
    
    if (note === expectedNote) {
        if (keyElement) {
            keyElement.classList.add('correct');
            setTimeout(() => keyElement.classList.remove('correct'), 500);
        }
        
        if (userInput.length === expectedNotes.length) {
            // Stage completed successfully
            awaitingInput = false;
            showFeedback('Чудово! Етап завершено!', 'success');
            document.getElementById('next-stage').disabled = false;
            
            if (currentStage === currentMelody.stages.length - 1) {
                setTimeout(() => {
                    showFeedback('🎉 Вітаємо! Ви вивчили всю мелодію!', 'success');
                }, 1000);
            }
        }
    } else {
        // Wrong note
        if (keyElement) {
            keyElement.classList.add('wrong');
            setTimeout(() => keyElement.classList.remove('wrong'), 500);
        }
        
        showFeedback('Спробуйте ще раз. Натисніть "Програти етап" для повторення', 'error');
        userInput = [];
    }
}

function nextStage() {
    if (!currentMelody || currentStage >= currentMelody.stages.length - 1) return;
    
    currentStage++;
    userInput = [];
    awaitingInput = false;
    
    updateLearningUI();
    highlightCurrentStage();
}

function restartMelody() {
    if (!currentMelody) return;
    
    currentStage = 0;
    userInput = [];
    awaitingInput = false;
    
    updateLearningUI();
    highlightCurrentStage();
}

function backToSelection() {
    document.getElementById('melody-selection').classList.remove('hidden');
    document.getElementById('learning-panel').classList.add('hidden');
    
    currentMelody = null;
    currentStage = 0;
    userInput = [];
    awaitingInput = false;
    
    clearKeyHighlights();
}

function showFeedback(message, type) {
    const feedbackElement = document.getElementById('feedback');
    feedbackElement.textContent = message;
    feedbackElement.className = `feedback ${type}`;
    
    if (type === 'success') {
        feedbackElement.classList.add('animate-success');
        setTimeout(() => feedbackElement.classList.remove('animate-success'), 500);
    }
}