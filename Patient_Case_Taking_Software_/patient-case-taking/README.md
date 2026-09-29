# MediCase Care - Patient Case-Taking Software 🏥

A complete, full-stack Patient Case-Taking and Clinical Anamnesis Management Web Application built with **Python Flask**, **SQLite**, and modern **HTML5, CSS3, and JavaScript**.

---

## 📌 Technology Stack

- **Backend:** Python 3 (Flask RESTful APIs)
- **Database:** SQLite 3 (`database.db`)
- **Frontend:** Vanilla HTML5, CSS3 (Medical Design System), and JavaScript (ES6+ Asynchronous Fetch)
- **UI & UX:** Responsive layout, real-time validation, modal dialogs, search filter, and toast feedback.

---

## 📁 Project Structure

```
patient-case-taking/
│
├── app.py                  # Flask backend server, REST APIs, & SQLite database management
├── database.db             # SQLite database file (auto-created on startup)
├── requirements.txt        # Python dependency manifest (Flask)
├── README.md               # Complete setup, API documentation, & security guide
│
├── templates/
│   ├── index.html          # Patient Case-Taking / Registration intake form
│   └── dashboard.html      # Doctor & Admin Dashboard (search, view, edit, delete, stats)
│
└── static/
    ├── style.css           # Clean, responsive clinical medical design system
    └── script.js           # Client-side validation, async REST API calls, modals, toasts
```

---

## 🩺 Patient Case-Taking Form (9 Required Clinical Attributes)

1. **Patient Name** (`name`) — Full legal name of the patient.
2. **Age** (`age`) — Chronological age (0 to 130).
3. **Gender** (`gender`) — Male, Female, Other, or Prefer not to say.
4. **Phone Number** (`phone`) — Primary contact or emergency reachable phone number.
5. **Main Symptoms** (`symptoms`) — Presenting chief complaints, onset, duration, and severity.
6. **Medical History** (`medical_history`) — Prior illnesses, surgeries, or chronic conditions.
7. **Known Allergies** (`allergies`) — Crucial for clinical medication safety (e.g., Penicillin, Latex, NKDA).
8. **Current Medications** (`medications`) — Current prescriptions, dosages, or OTC supplements.
9. **Additional Notes** (`notes`) — Triage vitals, physician observations, or special care requests.

---

## 🚀 Quickstart Guide: Running the Application Locally

### Step 1: Open a terminal inside the project directory

```bash
cd patient-case-taking
```

### Step 2: (Optional but Recommended) Create a Virtual Environment

```bash
# On Windows:
python -m venv venv
venv\Scripts\activate

# On macOS / Linux:
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Run the Flask Application

```bash
# Windows (standard or py launcher):
py app.py
# or:
python app.py
```

### Step 5: Open in Your Web Browser

Open your browser and navigate to:
- **Case Intake Form:** [http://127.0.0.1:5000/](http://127.0.0.1:5000/)
- **Doctor Dashboard:** [http://127.0.0.1:5000/dashboard](http://127.0.0.1:5000/dashboard)

---

## 📡 REST API Documentation

| Method | Endpoint | Description | Request Body / Query | Success Status |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/patients` | Register / save a new patient case | JSON object with 9 fields | `201 Created` |
| `GET` | `/patients` | Retrieve all patient cases | Optional `?search=<keyword>` | `200 OK` |
| `GET` | `/patients/<id>` | Retrieve full details of a specific case | None | `200 OK` (or `404`) |
| `PUT` | `/patients/<id>` | Update an existing patient case record | JSON object with updated fields | `200 OK` (or `404`) |
| `DELETE` | `/patients/<id>`| Permanently delete a patient case | None | `200 OK` (or `404`) |
| `GET` | `/api/stats` | Dashboard statistics (total count, avg age) | None | `200 OK` |
| `POST` | `/api/reset-demo` | Restore original dummy test records | None | `200 OK` |

### Sample JSON Payload (`POST /patients` or `PUT /patients/<id>`):

```json
{
  "name": "Eleanor Vance",
  "age": 34,
  "gender": "Female",
  "phone": "+1-555-0142",
  "symptoms": "Episodic severe migraine with visual aura and nausea for 3 days.",
  "medical_history": "Recurrent tension headaches, childhood eczema.",
  "allergies": "Penicillin (skin rash), Sulfa drugs",
  "medications": "Ibuprofen 400mg PRN, Sumatriptan 50mg PRN",
  "notes": "Prefers non-drowsy alternatives. BP 120/78 mmHg at triage."
}
```

---

## 🔒 Security & Medical Compliance Notice

> **IMPORTANT DISCLAIMER FOR CLINICAL & HEALTHCARE ENVIRONMENTS:**
> 
> This web application is an **educational and clinical demonstration prototype**. It uses entirely **fictitious dummy data** for testing.
>
> Before handling **Protected Health Information (PHI)** or real patient data in a real hospital or clinic:
> 1. **Authentication & Authorization:** Integrate multi-factor authentication (MFA) and strict Role-Based Access Control (RBAC) so only authorized clinicians can view or edit records.
> 2. **Encryption:** Enforce TLS 1.3 encryption for all network traffic and AES-256 database column encryption at rest for sensitive health identifiers.
> 3. **Audit Trails:** Implement immutable audit logging to track all record access, edits, and deletions.
> 4. **Regulatory Standards:** Verify compliance with regional and global regulations including **HIPAA** (Health Insurance Portability and Accountability Act), **GDPR** (General Data Protection Regulation), and **ISO 27799**.
> 5. **Security Audits:** Perform automated SAST/DAST scans, input sanitization auditing, and professional penetration testing.

---

## 🧪 Testing and Verification

- The backend automatically seeds 4 realistic, fictitious patient cases on first startup if the database is empty.
- You can click **"⚡ Fill Sample Data"** on the registration form to populate the fields with sample cases in one click.
- Use the **Doctor Dashboard** to search by patient name, view clinical summary sheets, edit records, or delete records.
- You can reset the sample data at any time by clicking the **"🔄 Reset Demo Data"** button on the dashboard.
