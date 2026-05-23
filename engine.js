// Simple branching question engine

// Your question tree
const questions = {
    start: {
        text: "What type of issue are you experiencing?",
        options: [
            { label: "Hydraulic", next: "hydraulic" },
            { label: "Electrical", next: "electrical" },
            { label: "Mechanical", next: "mechanical" }
        ]
    },

    hydraulic: {
        text: "Is the hydraulic pressure low?",
        options: [
            { label: "Yes", next: "hydraulic_low" },
            { label: "No", next: "hydraulic_ok" }
        ]
    },

    hydraulic_low: {
        text: "Check pump, filters, and fluid level. Did this resolve the issue?",
        options: [
            { label: "Yes", next: "resolved" },
            { label: "No", next: "unresolved" }
        ]
    },

    hydraulic_ok: {
        text: "Is there a leak present?",
        options: [
            { label: "Yes", next: "leak" },
            { label: "No", next: "unresolved" }
        ]
    },

    electrical: {
        text: "Is there power to the system?",
        options: [
            { label: "Yes", next: "electrical_yes" },
            { label: "No", next: "electrical_no" }
        ]
    },

    electrical_yes: {
        text: "Check fuses and wiring continuity. Did this resolve the issue?",
        options: [
            { label: "Yes", next: "resolved" },
            { label: "No", next: "unresolved" }
        ]
    },

    electrical_no: {
        text: "Restore power supply. Did this resolve the issue?",
        options: [
            { label: "Yes", next: "resolved" },
            { label: "No", next: "unresolved" }
        ]
    },

    mechanical: {
        text: "Is there abnormal noise or vibration?",
        options: [
            { label: "Yes", next: "mechanical_noise" },
            { label: "No", next: "unresolved" }
        ]
    },

    mechanical_noise: {
        text: "Inspect bearings, gears, and alignment. Did this resolve the issue?",
        options: [
            { label: "Yes", next: "resolved" },
            { label: "No", next: "unresolved" }
        ]
    },

    leak: {
        text: "Repair or replace leaking components. Did this resolve the issue?",
        options: [
            { label: "Yes", next: "resolved" },
            { label: "No", next: "unresolved" }
        ]
    },

    resolved: {
        text: "Great! The issue has been resolved.",
        options: []
    },

    unresolved: {
        text: "The issue requires further diagnosis. Contact support.",
        options: []
    }
};

// DOM elements
const questionContainer = document.getElementById("question");
const optionsContainer = document.getElementById("options");

// Load a question by key
function loadQuestion(key) {
    const q = questions[key];

    questionContainer.textContent = q.text;
    optionsContainer.innerHTML = "";

    q.options.forEach(option => {
        const btn = document.createElement("button");
        btn.textContent = option.label;
        btn.onclick = () => loadQuestion(option.next);
        optionsContainer.appendChild(btn);
    });
}

// Start the engine
function start() {
    loadQuestion("start");
}
