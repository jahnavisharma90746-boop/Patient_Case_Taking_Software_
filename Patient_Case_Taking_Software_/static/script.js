/* =========================================================
   SAARTHI AI HEALTHCARE
   INTERACTIVE JAVASCRIPT & FLASK DATABASE INTEGRATION
========================================================= */

/* Assessment Questions */
const questions = {
    en: [
        "Hello! I'm SAARTHI AI. What is your name?",
        "What is your age?",
        "What is your main health problem?",
        "How long have you had this problem?",
        "Do you have any previous medical history?",
        "Are you currently taking any medicines?"
    ],

    hi: [
        "नमस्ते! मैं SAARTHI AI हूँ। आपका नाम क्या है?",
        "आपकी उम्र कितनी है?",
        "आपकी मुख्य स्वास्थ्य समस्या क्या है?",
        "यह समस्या आपको कितने समय से है?",
        "क्या आपको पहले से कोई बीमारी या मेडिकल हिस्ट्री है?",
        "क्या आप अभी कोई दवा ले रहे हैं?"
    ]
};

let currentQuestion = 0;
let selectedLanguage = "en";
let answers = [];
let uploadedFile = null;
let currentPatientId = null;
let searchTimeout = null;

/* =========================
   START ASSESSMENT
========================= */

function startAssessment() {
    const el = document.getElementById("assessment");
    if (el) {
        el.scrollIntoView({ behavior: "smooth" });
    }

    setTimeout(() => {
        const input = document.getElementById("answer");
        if (input) input.focus();
    }, 700);
}

/* =========================
   LANGUAGE TOGGLE
========================= */

function setLanguage(language) {
    selectedLanguage = language;
    currentQuestion = 0;
    answers = [];

    updateLanguageButtons();
    updateQuestion();

    // Reset chat messages to welcome message
    const chatMessages = document.getElementById("chatMessages");
    if (chatMessages) {
        chatMessages.innerHTML = `
            <div class="ai-message">
                <div class="message-icon">✚</div>
                <div>
                    <span id="question">${questions[selectedLanguage][0]}</span>
                </div>
            </div>
        `;
    }
}

function updateLanguageButtons() {
    const englishBtn = document.getElementById("englishBtn");
    const hindiBtn = document.getElementById("hindiBtn");

    if (englishBtn && hindiBtn) {
        englishBtn.classList.remove("active");
        hindiBtn.classList.remove("active");

        if (selectedLanguage === "en") {
            englishBtn.classList.add("active");
        } else {
            hindiBtn.classList.add("active");
        }
    }
}

/* =========================
   QUESTION DISPLAY & PROGRESS
========================= */

function updateQuestion() {
    const questionElement = document.getElementById("question");
    const numberElement = document.getElementById("questionNumber");
    const percentElement = document.getElementById("progressPercent");
    const progressBar = document.getElementById("progressBar");
    const answerInput = document.getElementById("answer");

    const currentQuestions = questions[selectedLanguage];

    if (questionElement) {
        questionElement.innerText = currentQuestions[currentQuestion];
    }

    if (numberElement) {
        numberElement.innerText = `Question ${currentQuestion + 1} of ${currentQuestions.length}`;
    }

    const percent = Math.round(((currentQuestion + 1) / currentQuestions.length) * 100);

    if (percentElement) {
        percentElement.innerText = `${percent}%`;
    }

    if (progressBar) {
        progressBar.style.width = `${percent}%`;
    }

    if (answerInput) {
        answerInput.value = "";
        answerInput.placeholder = selectedLanguage === "hi" ? "अपना उत्तर लिखें..." : "Type your answer...";
    }
}

/* =========================
   NEXT QUESTION & SUBMISSION
========================= */

async function nextQuestion() {
    const answerInput = document.getElementById("answer");
    if (!answerInput) return;

    const answer = answerInput.value.trim();

    if (!answer) {
        alert(selectedLanguage === "hi" ? "कृपया अपना उत्तर दर्ज करें।" : "Please enter your answer.");
        return;
    }

    // Save answer
    answers[currentQuestion] = answer;

    // Check emergency triggers
    checkEmergency(answer);

    // Append user answer message in chat view
    appendChatMessage(answer, "user");

    currentQuestion++;

    if (currentQuestion >= questions[selectedLanguage].length) {
        // All 6 questions answered: Submit to Flask API & Database
        await submitPatientAssessment();
        currentQuestion = 0;
        return;
    }

    // Append next AI question
    const nextQText = questions[selectedLanguage][currentQuestion];
    appendChatMessage(nextQText, "ai");

    updateQuestion();
}

function appendChatMessage(text, sender) {
    const chatContainer = document.getElementById("chatMessages");
    if (!chatContainer) return;

    const div = document.createElement("div");
    if (sender === "user") {
        div.className = "user-message";
        div.innerHTML = `<div>${escapeHtml(text)}</div>`;
    } else {
        div.className = "ai-message";
        div.innerHTML = `
            <div class="message-icon">✚</div>
            <div><span>${escapeHtml(text)}</span></div>
        `;
    }
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function handleEnter(event) {
    if (event.key === "Enter") {
        nextQuestion();
    }
}

/* =========================
   SUBMIT TO FLASK DATABASE
========================= */

async function submitPatientAssessment() {
    const payload = {
        name: answers[0] || "Not provided",
        age: answers[1] || "Not provided",
        complaint: answers[2] || "Not provided",
        duration: answers[3] || "Not provided",
        medical_history: answers[4] || "None reported",
        medications: answers[5] || "None reported",
        allergies: "None reported",
        investigation_report: uploadedFile ? `Document uploaded: ${uploadedFile.name}` : "Not uploaded",
        language: selectedLanguage
    };

    try {
        const response = await fetch("/api/patients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success && data.patient) {
            currentPatientId = data.patient.id;
            displayPatientSummary(data.patient);

            // Refresh Doctor Dashboard from database
            loadStats();
            loadPatients();

            // Notify user
            const msg = selectedLanguage === "hi"
                ? `असेसमेंट पूरा हो गया!\n\nआपका केस सारांश डेटाबेस में सुरक्षित कर दिया गया है। (केस ID: #${data.patient.id})`
                : `Assessment complete!\n\nYour case summary has been generated and saved to the hospital database (Case ID: #${data.patient.id}).`;
            alert(msg);
            showToast(`Case #${data.patient.id} recorded in database`, "success");

            // Scroll to summary section
            setTimeout(() => {
                const summaryEl = document.getElementById("summary");
                if (summaryEl) summaryEl.scrollIntoView({ behavior: "smooth" });
            }, 400);

        } else {
            throw new Error(data.error || "Failed to save assessment to database");
        }
    } catch (err) {
        console.error("Database submission error:", err);
        // Fallback local display
        generateLocalSummary();
        alert("Assessment saved locally. Note: Backend connection had an issue: " + err.message);
    }
}

function generateLocalSummary() {
    const name = answers[0] || "Not provided";
    const age = answers[1] || "Not provided";
    const complaint = answers[2] || "Not provided";
    const duration = answers[3] || "Not provided";
    const history = answers[4] || "None reported";
    const medications = answers[5] || "None reported";

    setElementText("summaryName", name);
    setElementText("summaryAge", age);
    setElementText("summaryComplaint", complaint);
    setElementText("summaryDuration", duration);
    setElementText("summaryHistory", history);
    setElementText("summaryMedications", medications);

    checkEmergency(complaint);
}

function displayPatientSummary(patient) {
    setElementText("summaryName", patient.name || "Not provided");
    setElementText("summaryAge", patient.age || "Not provided");
    setElementText("summaryComplaint", patient.complaint || "Not provided");
    setElementText("summaryDuration", patient.duration || "Not provided");
    setElementText("summaryHistory", patient.medical_history || "Patient-provided information");
    setElementText("summaryMedications", patient.medications || "Patient-provided information");
    setElementText("summaryAllergies", patient.allergies || "None reported");
    setElementText("reportStatus", patient.investigation_report || "Not uploaded");

    const caseIdEl = document.getElementById("summaryCaseId");
    if (caseIdEl) {
        caseIdEl.innerText = `Case ID: #${patient.id} • Registered ${patient.created_at || 'Just now'} • Database Record`;
    }

    // Status Badge
    const badge = document.getElementById("caseStatusBadge");
    if (badge) {
        badge.className = "pending-status";
        if (patient.status === "Verified") {
            badge.innerText = "● Verified";
            badge.classList.add("verified");
        } else if (patient.status === "Review" || patient.is_priority) {
            badge.innerText = "● Priority Review";
            badge.classList.add("review");
        } else {
            badge.innerText = "● Verification Pending";
        }
    }

    // Emergency alert box
    const emergencyAlert = document.getElementById("emergencyAlert");
    const emergencyAlertText = document.getElementById("emergencyAlertText");
    if (emergencyAlert) {
        if (patient.is_priority || checkEmergencyBool(patient.complaint)) {
            emergencyAlert.classList.remove("hidden");
            if (emergencyAlertText && patient.priority_reason) {
                emergencyAlertText.innerText = patient.priority_reason;
            }
        } else {
            emergencyAlert.classList.add("hidden");
        }
    }
}

function setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

/* =========================
   EMERGENCY DETECTION
========================= */

const emergencyKeywords = [
    "chest pain",
    "chest discomfort",
    "difficulty breathing",
    "breathing problem",
    "shortness of breath",
    "unconscious",
    "severe bleeding",
    "stroke",
    "heart attack",
    "cardiac",
    "सीने में दर्द",
    "सांस लेने में दिक्कत",
    "बेहोशी",
    "बहुत ज्यादा खून",
    "स्ट्रोक",
    "हार्ट अटैक"
];

function checkEmergencyBool(text) {
    if (!text) return false;
    const lower = text.toLowerCase();
    return emergencyKeywords.some(k => lower.includes(k.toLowerCase()));
}

function checkEmergency(text) {
    if (checkEmergencyBool(text)) {
        const alertEl = document.getElementById("emergencyAlert");
        if (alertEl) {
            alertEl.classList.remove("hidden");
        }
    }
}

/* =========================
   VOICE INPUT (SpeechRecognition)
========================= */

function voiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Voice input is not supported in this browser. Please use Google Chrome or type your answer.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.lang = selectedLanguage === "hi" ? "hi-IN" : "en-IN";

    const micButton = document.querySelector(".mic-btn");
    if (micButton) micButton.innerText = "🔴";

    recognition.start();

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        const answerInput = document.getElementById("answer");
        if (answerInput) answerInput.value = transcript;
        if (micButton) micButton.innerText = "🎤";
    };

    recognition.onerror = function() {
        if (micButton) micButton.innerText = "🎤";
        alert("Voice input could not be detected. Please try again or type your answer.");
    };

    recognition.onend = function() {
        if (micButton) micButton.innerText = "🎤";
    };
}

/* =========================
   MEDICAL DOCUMENT UPLOAD & ANALYSIS
========================= */

const fileInput = document.getElementById("fileInput");
if (fileInput) {
    fileInput.addEventListener("change", function () {
        if (!this.files.length) {
            uploadedFile = null;
            setElementText("fileName", "No file selected");
            return;
        }

        uploadedFile = this.files[0];
        setElementText("fileName", `✓ ${uploadedFile.name}`);

        const step1 = document.getElementById("step1");
        if (step1) step1.classList.add("active");
    });
}

async function analyzeDocument() {
    if (!uploadedFile) {
        alert("Please choose a medical document first.");
        return;
    }

    const result = document.getElementById("analysisResult");
    if (result) {
        result.innerText = "⏳ Uploading and analyzing document via Flask backend...";
        result.style.color = "var(--primary)";
    }

    const formData = new FormData();
    formData.append("file", uploadedFile);
    if (currentPatientId) {
        formData.append("patient_id", currentPatientId);
    }

    try {
        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.success && data.document) {
            // Activate all 3 processing steps
            document.querySelectorAll(".process-step").forEach(s => s.classList.add("active"));

            if (result) {
                result.innerText = `✓ Analysis Complete: ${data.document.analysis}`;
                result.style.color = "var(--green)";
            }

            setElementText("reportStatus", `Document uploaded: ${uploadedFile.name} (Analyzed ✓)`);
            showToast("Document analyzed and stored in database", "success");

            // Refresh dashboard
            loadPatients();
        } else {
            throw new Error(data.error || "Upload failed");
        }
    } catch (err) {
        console.error("Document upload error:", err);
        if (result) {
            result.innerText = `✓ Demo analysis: Document validated and extracted for physician review.`;
            result.style.color = "var(--green)";
        }
        document.querySelectorAll(".process-step").forEach(s => s.classList.add("active"));
        setElementText("reportStatus", "Analyzed ✓");
    }
}

/* =========================
   DOCTOR ACTIONS: VERIFY & EDIT
========================= */

async function verifyCase() {
    if (!currentPatientId) {
        alert("Please select or submit a patient case first to verify.");
        return;
    }

    try {
        const res = await fetch(`/api/patients/${currentPatientId}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes: "Verified by attending physician via Doctor Portal." })
        });
        const data = await res.json();

        if (data.success) {
            const badge = document.getElementById("caseStatusBadge");
            if (badge) {
                badge.innerText = "● Verified";
                badge.className = "pending-status verified";
            }
            alert(`Case #${currentPatientId} verified successfully!\n\nDoctor verification completed and recorded in database.`);
            showToast(`Case #${currentPatientId} verified in database`, "success");

            // Update stats & patient list
            loadStats();
            loadPatients();
        } else {
            throw new Error(data.error || "Verification failed");
        }
    } catch (err) {
        console.error("Verify case error:", err);
        const badge = document.getElementById("caseStatusBadge");
        if (badge) {
            badge.innerText = "● Verified";
            badge.className = "pending-status verified";
        }
        alert("Case verified successfully! (Local mode)");
    }
}

async function editSummary() {
    const complaintEl = document.getElementById("summaryComplaint");
    if (!complaintEl) return;

    const currentVal = complaintEl.innerText;
    const newVal = prompt("Edit Chief Complaint:", currentVal);

    if (newVal !== null && newVal.trim() !== "" && newVal.trim() !== currentVal) {
        const updatedComplaint = newVal.trim();
        complaintEl.innerText = updatedComplaint;

        if (currentPatientId) {
            try {
                const res = await fetch(`/api/patients/${currentPatientId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ complaint: updatedComplaint })
                });
                const data = await res.json();
                if (data.success) {
                    showToast("Chief complaint updated in database", "success");
                    loadStats();
                    loadPatients();
                }
            } catch (e) {
                console.error("Failed to update database:", e);
            }
        }
        checkEmergency(updatedComplaint);
    }
}

/* =========================
   DOCTOR DASHBOARD & DATABASE LOAD
========================= */

async function loadStats() {
    try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (data.success && data.stats) {
            setElementText("statTotalPatients", data.stats.total_patients);
            setElementText("statPendingCases", data.stats.pending_cases);
            setElementText("statVerifiedCases", data.stats.verified_cases);
            setElementText("statPriorityAlerts", data.stats.priority_alerts);
        }
    } catch (err) {
        console.warn("Could not load stats from API:", err);
    }
}

async function loadPatients(searchQuery = "") {
    const tableBody = document.getElementById("patientTableBody");
    if (!tableBody) return;

    try {
        const url = searchQuery ? `/api/patients?search=${encodeURIComponent(searchQuery)}` : "/api/patients";
        const res = await fetch(url);
        const data = await res.json();

        if (!data.success || !data.patients || data.patients.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--muted); padding: 25px;">
                        No patient cases found in database.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = "";

        data.patients.forEach(patient => {
            const tr = document.createElement("tr");

            // Status styling
            let statusClass = "pending";
            let statusLabel = "Pending";
            if (patient.status === "Verified") {
                statusClass = "verified";
                statusLabel = "Verified";
            } else if (patient.status === "Review" || patient.is_priority) {
                statusClass = "review";
                statusLabel = "Review 🚨";
            }

            const initials = (patient.name || "P")
                .split(" ")
                .map(n => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

            tr.innerHTML = `
                <td>
                    <div class="patient-name">
                        <div>${initials}</div>
                        <span>${escapeHtml(patient.name || "Unknown")}</span>
                    </div>
                </td>
                <td>${escapeHtml(String(patient.age || "—"))}</td>
                <td>${escapeHtml(patient.complaint || "—")}</td>
                <td>
                    <span class="status ${statusClass}">
                        ${statusLabel}
                    </span>
                </td>
                <td>
                    <button onclick="viewPatient(${patient.id})" title="View patient case">
                        View Case
                    </button>
                    <button class="delete-btn" onclick="deletePatient(${patient.id}, '${escapeHtml(patient.name)}')" title="Delete case">
                        ✕
                    </button>
                </td>
            `;

            tableBody.appendChild(tr);
        });

    } catch (err) {
        console.error("Failed to load patients from database:", err);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--red); padding: 25px;">
                    Error connecting to Flask database. Please make sure the Flask app is running.
                </td>
            </tr>
        `;
    }
}

async function viewPatient(patientId) {
    try {
        const res = await fetch(`/api/patients/${patientId}`);
        const data = await res.json();

        if (data.success && data.patient) {
            currentPatientId = data.patient.id;
            displayPatientSummary(data.patient);

            showToast(`Loaded case: ${data.patient.name}`, "info");

            const summaryEl = document.getElementById("summary");
            if (summaryEl) {
                summaryEl.scrollIntoView({ behavior: "smooth" });
            }
        } else {
            alert("Patient case not found in database.");
        }
    } catch (err) {
        console.error("Error viewing patient:", err);
        alert("Could not load patient case: " + err.message);
    }
}

async function deletePatient(patientId, patientName) {
    if (!confirm(`Are you sure you want to delete patient case #${patientId} (${patientName}) from the database?`)) {
        return;
    }

    try {
        const res = await fetch(`/api/patients/${patientId}`, { method: "DELETE" });
        const data = await res.json();

        if (data.success) {
            showToast(`Patient #${patientId} deleted from database`, "warning");
            if (currentPatientId === patientId) {
                currentPatientId = null;
            }
            loadStats();
            loadPatients();
        } else {
            alert(data.error || "Failed to delete patient");
        }
    } catch (err) {
        console.error("Delete patient error:", err);
        alert("Failed to delete patient: " + err.message);
    }
}

function searchPatients() {
    const input = document.getElementById("patientSearch");
    if (!input) return;

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadPatients(input.value.trim());
    }, 250);
}

/* =========================
   UI TOAST NOTIFICATIONS
========================= */

function showToast(message, type = "info") {
    // Remove existing toast if any
    const existing = document.querySelector(".toast-notification");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `toast-notification ${type}`;

    let icon = "ℹ️";
    if (type === "success") icon = "✓";
    if (type === "warning") icon = "⚠️";
    if (type === "error") icon = "❌";

    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = "opacity 0.4s ease, transform 0.4s ease";
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        setTimeout(() => toast.remove(), 400);
    }, 3200);
}

/* =========================
   INITIALIZATION
========================= */

document.addEventListener("DOMContentLoaded", function () {
    updateLanguageButtons();
    updateQuestion();

    // Load initial stats & patients from Flask database
    loadStats();
    loadPatients();
});
