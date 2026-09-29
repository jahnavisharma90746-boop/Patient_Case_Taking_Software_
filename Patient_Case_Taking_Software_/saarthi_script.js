const supabaseUrl = "https://ihwhbfkucocbwmaxnobd.supabase.co";
const supabaseKey = "sb_publishable_vFA7NdiYzfpYgBmqRRC4Wg_9GN57zzg";

const db = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
);
/* =========================================================
   SAARTHI AI HEALTHCARE
   INTERACTIVE JAVASCRIPT
========================================================= */


/* =========================================================
   SUPABASE CONNECTION
========================================================= */



/* =========================================================
   PATIENT ASSESSMENT QUESTIONS
========================================================= */

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


/* =========================================================
   VARIABLES
========================================================= */

let currentQuestion = 0;
let selectedLanguage = "en";
let answers = [];
let uploadedFile = null;


/* =========================================================
   IMPACT CARD INTERACTION
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const impactCards =
        document.querySelectorAll(".impact-card");

    impactCards.forEach((card) => {

        card.addEventListener("mouseenter", () => {
            card.style.transform = "translateY(-7px)";
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = "translateY(0)";
        });

    });

    updateLanguageButtons();
    updateQuestion();

});


/* =========================================================
   START ASSESSMENT
========================================================= */

function startAssessment() {

    const assessment =
        document.getElementById("assessment");

    if (assessment) {

        assessment.scrollIntoView({
            behavior: "smooth"
        });

    }

    setTimeout(() => {

        const answer =
            document.getElementById("answer");

        if (answer) {
            answer.focus();
        }

    }, 700);

}


/* =========================================================
   LANGUAGE
========================================================= */

function setLanguage(language) {

    selectedLanguage = language;

    currentQuestion = 0;

    answers = [];

    updateLanguageButtons();

    updateQuestion();

}


/* =========================================================
   LANGUAGE BUTTONS
========================================================= */

function updateLanguageButtons() {

    const englishBtn =
        document.getElementById("englishBtn");

    const hindiBtn =
        document.getElementById("hindiBtn");


    if (!englishBtn || !hindiBtn) {
        return;
    }


    englishBtn.classList.remove("active");

    hindiBtn.classList.remove("active");


    if (selectedLanguage === "en") {

        englishBtn.classList.add("active");

    } else {

        hindiBtn.classList.add("active");

    }

}


/* =========================================================
   UPDATE QUESTION
========================================================= */

function updateQuestion() {

    const questionElement =
        document.getElementById("question");

    const numberElement =
        document.getElementById("questionNumber");

    const percentElement =
        document.getElementById("progressPercent");

    const progressBar =
        document.getElementById("progressBar");

    const answerInput =
        document.getElementById("answer");


    if (
        !questionElement ||
        !numberElement ||
        !percentElement ||
        !progressBar ||
        !answerInput
    ) {
        return;
    }


    const currentQuestions =
        questions[selectedLanguage];


    questionElement.innerText =
        currentQuestions[currentQuestion];


    numberElement.innerText =
        `Question ${currentQuestion + 1} of ${currentQuestions.length}`;


    const percent =
        Math.round(
            ((currentQuestion + 1) /
                currentQuestions.length) * 100
        );


    percentElement.innerText =
        `${percent}%`;


    progressBar.style.width =
        `${percent}%`;


    answerInput.value = "";


    if (selectedLanguage === "hi") {

        answerInput.placeholder =
            "अपना उत्तर लिखें...";

    } else {

        answerInput.placeholder =
            "Type your answer...";

    }

}


/* =========================================================
   NEXT QUESTION
========================================================= */

function nextQuestion() {

    const answerInput =
        document.getElementById("answer");


    if (!answerInput) {
        return;
    }


    const answer =
        answerInput.value.trim();


    if (!answer) {

        if (selectedLanguage === "hi") {

            alert(
                "कृपया अपना उत्तर दर्ज करें।"
            );

        } else {

            alert(
                "Please enter your answer."
            );

        }

        return;
    }


    answers[currentQuestion] =
        answer;


    checkEmergency(answer);


    currentQuestion++;


    if (
        currentQuestion >=
        questions[selectedLanguage].length
    ) {

        generateSummary();

        showCompletionMessage();


        setTimeout(() => {

            const summary =
                document.getElementById("summary");

            if (summary) {

                summary.scrollIntoView({
                    behavior: "smooth"
                });

            }

        }, 500);


        currentQuestion = 0;

        return;

    }


    updateQuestion();

}


/* =========================================================
   ENTER KEY
========================================================= */

function handleEnter(event) {

    if (event.key === "Enter") {

        nextQuestion();

    }

}


/* =========================================================
   VOICE INPUT
========================================================= */

function voiceInput() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        alert(
            "Voice input is not supported in this browser. Please use Chrome or type your answer."
        );

        return;

    }


    const recognition =
        new SpeechRecognition();


    recognition.continuous = false;

    recognition.interimResults = false;

    recognition.maxAlternatives = 1;


    if (selectedLanguage === "hi") {

        recognition.lang = "hi-IN";

    } else {

        recognition.lang = "en-IN";

    }


    const micButton =
        document.querySelector(".mic-btn");


    if (micButton) {
        micButton.innerText = "🔴";
    }


    recognition.start();


    recognition.onresult =
        function (event) {

            const transcript =
                event.results[0][0].transcript;


            const answer =
                document.getElementById("answer");


            if (answer) {
                answer.value = transcript;
            }


            if (micButton) {
                micButton.innerText = "🎤";
            }

        };


    recognition.onerror =
        function () {

            if (micButton) {
                micButton.innerText = "🎤";
            }

            alert(
                "Voice input could not be detected. Please try again or type your answer."
            );

        };


    recognition.onend =
        function () {

            if (micButton) {
                micButton.innerText = "🎤";
            }

        };

}


/* =========================================================
   COMPLETION MESSAGE
========================================================= */

function showCompletionMessage() {

    if (selectedLanguage === "hi") {

        alert(
            "Assessment complete!\n\n" +
            "Aapka case summary generate ho gaya hai."
        );

    } else {

        alert(
            "Assessment complete!\n\n" +
            "Your case summary has been generated."
        );

    }

}
/* =========================================================
   GENERATE CASE SUMMARY
========================================================= */

function generateSummary() {

    const name =
        answers[0] || "Not provided";

    const age =
        answers[1] || "Not provided";

    const complaint =
        answers[2] || "Not provided";

    const duration =
        answers[3] || "Not provided";


    const summaryName =
        document.getElementById("summaryName");

    const summaryAge =
        document.getElementById("summaryAge");

    const summaryComplaint =
        document.getElementById("summaryComplaint");

    const summaryDuration =
        document.getElementById("summaryDuration");


    if (summaryName) {
        summaryName.innerText = name;
    }

    if (summaryAge) {
        summaryAge.innerText = age;
    }

    if (summaryComplaint) {
        summaryComplaint.innerText = complaint;
    }

    if (summaryDuration) {
        summaryDuration.innerText = duration;
    }


    if (uploadedFile) {

        const reportStatus =
            document.getElementById("reportStatus");

        if (reportStatus) {
            reportStatus.innerText =
                "Document uploaded ✓";
        }

    }


    checkEmergency(complaint);

    // Save patient data to Supabase
    savePatientData();
    console.log("SAVE FUNCTION CALLED");

}


/* =========================================================
   EMERGENCY DETECTION
========================================================= */

function checkEmergency(text) {

    if (!text) {
        return;
    }

    const emergencyKeywords = [

        "chest pain",
        "difficulty breathing",
        "breathing problem",
        "unconscious",
        "severe bleeding",
        "stroke",
        "heart attack",

        "सीने में दर्द",
        "सांस लेने में दिक्कत",
        "बेहोशी",
        "बहुत ज्यादा खून",
        "स्ट्रोक",
        "हार्ट अटैक"

    ];


    const lowerText =
        text.toLowerCase();


    const found =
        emergencyKeywords.some(
            keyword =>
                lowerText.includes(
                    keyword.toLowerCase()
                )
        );


    if (found) {

        const emergencyAlert =
            document.getElementById(
                "emergencyAlert"
            );

        if (emergencyAlert) {

            emergencyAlert.classList.remove(
                "hidden"
            );

        }

    }

}


/* =========================================================
   SAVE PATIENT DATA TO SUPABASE
========================================================= */

async function savePatientData() {

    const patientData = {

        name: answers[0] || "Not provided",

        phone: "",

        date:
            new Date()
                .toISOString()
                .split("T")[0],

        message:

            "Age: " +
            (answers[1] || "Not provided") +

            "\nHealth Problem: " +
            (answers[2] || "Not provided") +

            "\nDuration: " +
            (answers[3] || "Not provided") +

            "\nMedical History: " +
            (answers[4] || "Not provided") +

            "\nMedicines: " +
            (answers[5] || "Not provided")

    };


    const { data, error } =
        await db
        .from("Appoinments")
        .insert([patientData]);


    if (error) {

        console.error(
            "Patient data save error:",
            error
        );

        return;

    }


    console.log(
        "Patient data saved successfully:",
        data
    );

}


/* =========================================================
   FILE UPLOAD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const fileInput =
            document.getElementById(
                "fileInput"
            );


        if (!fileInput) {
            return;
        }


        fileInput.addEventListener(
            "change",
            function () {

                if (!this.files.length) {

                    uploadedFile = null;


                    const fileName =
                        document.getElementById(
                            "fileName"
                        );


                    if (fileName) {

                        fileName.innerText =
                            "No file selected";

                    }

                    return;

                }


                uploadedFile =
                    this.files[0];


                const fileName =
                    document.getElementById(
                        "fileName"
                    );


                if (fileName) {

                    fileName.innerText =
                        `✓ ${uploadedFile.name}`;

                }


                const reportStatus =
                    document.getElementById(
                        "reportStatus"
                    );


                if (reportStatus) {

                    reportStatus.innerText =
                        "Document uploaded ✓";

                }

            }
        );

    }
);


/* =========================================================
   DOCUMENT ANALYSIS
========================================================= */

function analyzeDocument() {

    if (!uploadedFile) {

        alert(
            "Please choose a medical document first."
        );

        return;

    }


    const result =
        document.getElementById(
            "analysisResult"
        );


    if (!result) {
        return;
    }


    result.innerText =
        "⏳ Analyzing document...";


    setTimeout(() => {

        result.innerText =
            "✓ Demo analysis completed successfully.";


        const steps =
            document.querySelectorAll(
                ".process-step"
            );


        steps.forEach(step => {

            step.classList.add("active");

        });


        const reportStatus =
            document.getElementById(
                "reportStatus"
            );


        if (reportStatus) {

            reportStatus.innerText =
                "Analyzed ✓";

        }

    }, 1800);

}


/* =========================================================
   VERIFY CASE
========================================================= */

function verifyCase() {

    const status =
        document.querySelector(
            ".pending-status"
        );


    if (status) {

        status.innerText =
            "● Verified";


        status.style.background =
            "#e3f6e9";


        status.style.color =
            "#16834b";

    }


    alert(
        "Case verified successfully!\n\nDoctor verification completed."
    );

}


/* =========================================================
   EDIT SUMMARY
========================================================= */

function editSummary() {

    const complaint =
        document.getElementById(
            "summaryComplaint"
        );


    if (!complaint) {
        return;
    }


    const newValue =
        prompt(
            "Edit Chief Complaint:",
            complaint.innerText
        );


    if (
        newValue !== null &&
        newValue.trim() !== ""
    ) {

        complaint.innerText =
            newValue.trim();

    }

}


/* =========================================================
   PATIENT SEARCH
========================================================= */

function searchPatients() {

    const searchInput =
        document.getElementById(
            "patientSearch"
        );


    if (!searchInput) {
        return;
    }


    const searchValue =
        searchInput.value.toLowerCase();


    const rows =
        document.querySelectorAll(
            "#patientTable tbody tr"
        );


    rows.forEach(row => {

        const text =
            row.innerText.toLowerCase();


        if (text.includes(searchValue)) {

            row.style.display = "";

        } else {

            row.style.display = "none";

        }

    });

}


/* =========================================================
   VIEW PATIENT
========================================================= */

function viewPatient(name) {

    alert(
        "Patient Case\n\n" +
        "Name: " + name +
        "\n\nOpening detailed medical case..."
    );


    const summary =
        document.getElementById(
            "summary"
        );


    if (summary) {

        summary.scrollIntoView({
            behavior: "smooth"
        });

    }
    /* =========================================================
   LOAD PATIENTS FROM SUPABASE
========================================================= */

async function loadPatients() {

    const tableBody =
        document.querySelector("#patientTable tbody");

    if (!tableBody) return;

    const { data, error } = await db
        .from("Appoinments")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        console.error("Patient loading error:", error);
        return;
    }

    if (!data || data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    No patient cases found.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = "";

    data.forEach(patient => {

        const message = patient.message || "";

        const age =
            message.match(/Age:\s*(.*)/)?.[1] || "—";

        const complaint =
            message.match(/Health Problem:\s*(.*)/)?.[1] || "—";

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <div class="patient-name">
                    <div>${(patient.name || "P").charAt(0)}</div>
                    ${patient.name || "Unknown"}
                </div>
            </td>

            <td>${age}</td>

            <td>${complaint}</td>

            <td>
                <span class="status pending">
                    Pending
                </span>
            </td>

            <td>
                <button onclick="viewPatient('${patient.name || "Patient"}')">
                    View Case
                </button>
            </td>
        `;

        tableBody.appendChild(row);

    });

}

}
/* =========================================================
   LOAD PATIENTS FROM SUPABASE
========================================================= */

async function loadPatients() {

    console.log("LOAD PATIENTS STARTED");

    const tableBody =
        document.querySelector("#patientTable tbody");

    if (!tableBody) {
        console.log("Patient table not found");
        return;
    }

    const { data, error } = await db
        .from("Appoinments")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        console.error("Patient loading error:", error);
        return;
    }

    console.log("Patients received:", data);

    if (!data || data.length === 0) {
        console.log("No patients found");
        return;
    }

    tableBody.innerHTML = "";

    data.forEach(patient => {

        const message = patient.message || "";

        const age =
            message.match(/Age:\s*(.*)/)?.[1] || "—";

        const complaint =
            message.match(/Health Problem:\s*(.*)/)?.[1] || "—";

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <div class="patient-name">
                    <div>${(patient.name || "P").charAt(0)}</div>
                    ${patient.name || "Unknown"}
                </div>
            </td>

            <td>${age}</td>

            <td>${complaint}</td>

            <td>
                <span class="status pending">
                    Pending
                </span>
            </td>

            <td>
                <button onclick="viewPatient('${patient.name || "Patient"}')">
                    View Case
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}


/* LOAD PATIENTS WHEN PAGE OPENS */

document.addEventListener("DOMContentLoaded", function () {
    loadPatients();
});

