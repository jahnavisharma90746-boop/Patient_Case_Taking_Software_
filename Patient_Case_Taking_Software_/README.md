# SAARTHI AI Healthcare — Flask & SQLite Database System

An intelligent AI healthcare patient case-taking system powered by **Python Flask** and **SQLite3**. This system collects patient responses through text and voice, performs triage and emergency keyword detection, handles medical report document uploads, and generates doctor-ready structured case summaries stored persistently in a database.

---

## 🌟 Key Features

1. **AI Patient Assessment (Chat & Voice)**:
   - Multilingual support (English & Hindi).
   - Voice-enabled speech input (`SpeechRecognition`).
   - Collects Name, Age, Chief Complaint, Duration, Medical History, and Medications.
   - Automatically saves completed cases into the database via Flask REST API.

2. **Automated Emergency Detection & Triage**:
   - Detects critical conditions in real time (e.g., chest pain, shortness of breath, severe bleeding, stroke).
   - Automatically routes emergency cases into **Priority Review** (`is_priority = 1`, `status = 'Review'`).

3. **Medical Document Upload & Clinical Analysis**:
   - Accepts PDF, JPG, PNG, and medical document formats.
   - Stores documents securely in the `uploads/` directory.
   - Intelligent analyzer parses medical reports (CBC Blood Tests, 12-lead ECG strips, Chest X-Rays, Lipid Panels, Urinalysis).
   - Links uploaded reports directly to the patient's database record.

4. **Doctor Portal & Real-time Dashboard**:
   - Dynamic live counters: **Total Patients**, **Pending Cases**, **Verified Cases**, **Priority Alerts**.
   - Searchable patient case directory with live filtering.
   - One-click **Case Verification** updating the case status to `Verified` in the database.
   - Case summary editor allowing attending physicians to update chief complaints.

---

## 🗄️ Database Architecture (`saarthi.db`)

The database is built on **SQLite3** with relational schema and views:

### 1. `patients` Table
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Unique patient case ID |
| `name` | TEXT | Patient full name |
| `age` | TEXT | Age of patient |
| `gender` | TEXT | Gender (default: 'Not specified') |
| `complaint` | TEXT | Primary clinical complaint |
| `duration` | TEXT | Duration of symptoms |
| `medical_history` | TEXT | Pre-existing medical conditions |
| `medications` | TEXT | Current medications |
| `allergies` | TEXT | Known allergies (default: 'None reported') |
| `investigation_report` | TEXT | Uploaded document status |
| `status` | TEXT | `'Pending'`, `'Verified'`, `'Review'` |
| `is_priority` | INTEGER | `1` for priority alert, `0` for normal |
| `priority_reason` | TEXT | Clinical trigger explanation |
| `doctor_notes` | TEXT | Notes entered by doctor |
| `language` | TEXT | Assessment language (`'en'` or `'hi'`) |
| `created_at` | TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### 2. `documents` Table
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Unique document ID |
| `patient_id` | INTEGER | Foreign key referencing `patients.id` |
| `filename` | TEXT | Stored filename in `uploads/` |
| `original_filename` | TEXT | Original uploaded filename |
| `file_type` | TEXT | MIME type |
| `file_size` | INTEGER | File size in bytes |
| `analysis_summary` | TEXT | Extracted clinical analysis |
| `uploaded_at` | TIMESTAMP | Upload timestamp |

### 3. `doctor_reviews` Table
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Review log ID |
| `patient_id` | INTEGER | Foreign key referencing `patients.id` |
| `action` | TEXT | Action performed (`'Verified'`, `'Edited'`) |
| `doctor_name` | TEXT | Name of verifying doctor |
| `notes` | TEXT | Clinical verification notes |
| `created_at` | TIMESTAMP | Verification timestamp |

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+ installed on your system.

### 2. Install Dependencies
```bash
py -m pip install -r requirements.txt
```
*(Dependencies: `Flask`, `flask-cors`)*

### 3. Run the Flask Web Application
```bash
py app.py
```
Open your browser and navigate to:
```
http://127.0.0.1:5000/
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Serves the web interface (`index.html`) |
| `GET` | `/api/stats` | Returns real-time counts for doctor dashboard widgets |
| `GET` | `/api/patients` | Lists all patient cases (supports `?search=...&status=...`) |
| `GET` | `/api/patients/<id>` | Retrieves full patient record with documents and reviews |
| `POST` | `/api/patients` | Creates a new patient case from assessment answers |
| `PUT` | `/api/patients/<id>` | Updates patient fields (e.g. Chief Complaint) |
| `POST` | `/api/patients/<id>/verify` | Verifies a patient case and logs physician review |
| `DELETE` | `/api/patients/<id>` | Deletes a patient case record |
| `POST` | `/api/upload` | Uploads and analyzes a medical report file |
| `GET` | `/uploads/<filename>` | Serves uploaded medical files |

---

## 🧪 Running the Automated Test Suite

A complete test suite is provided in `test_saarthi.py` covering all routes, database operations, triage detection, and file uploads:

```bash
py test_saarthi.py
```

Expected output:
```
Ran 10 tests in 0.294s
OK
```

---

## 📁 Project Structure

```
test 4/
├── app.py                  # Main Flask application and REST API
├── saarthi.db              # SQLite3 database
├── requirements.txt        # Python package dependencies
├── test_saarthi.py         # Automated unit test suite
├── README.md               # Documentation and API guide
├── templates/
│   └── index.html          # SAARTHI AI Healthcare HTML portal
├── static/
│   ├── style.css           # Responsive stylesheet
│   └── script.js           # Frontend interactive & API integration
├── uploads/                # Directory for uploaded medical files
└── database/               # SQL schemas, views, and migration scripts
```
