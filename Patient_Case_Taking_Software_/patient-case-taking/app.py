"""
Patient Case-Taking System - Backend
====================================
Framework: Python Flask
Database: SQLite3

SECURITY & COMPLIANCE NOTICE:
-----------------------------
This web application is a clinical prototype and educational demonstration.
Before handling actual protected health information (PHI) in a real-world clinical
environment, this system must implement:
1. Strict user authentication (MFA) and Role-Based Access Control (RBAC).
2. End-to-end TLS encryption (HTTPS) in transit and AES-256 database encryption at rest.
3. Full audit logging of all patient record access, modifications, and deletions.
4. Compliance with healthcare privacy regulations such as HIPAA, GDPR, and ISO 27799.
5. Regular vulnerability assessments and third-party security audits.
"""

import os
import re
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify, render_template, abort

# Initialize Flask application
app = Flask(__name__)

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, "database.db")
app.config["SECRET_KEY"] = os.urandom(24).hex()


def get_db_connection():
    """
    Establish and return a connection to the SQLite database.
    Row factory is enabled to allow dictionary-style access to columns.
    """
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """
    Initialize the database schema and populate with fictitious dummy data
    if the database is newly created or empty.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create the patients table as specified in requirements
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            age INTEGER NOT NULL,
            gender TEXT NOT NULL,
            phone TEXT NOT NULL,
            symptoms TEXT NOT NULL,
            medical_history TEXT,
            allergies TEXT,
            medications TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()

    # Check if table already contains records; if empty, seed dummy records for testing
    cursor.execute("SELECT COUNT(*) FROM patients")
    count = cursor.fetchone()[0]

    if count == 0:
        seed_sample_patients(conn)

    conn.close()


def seed_sample_patients(conn):
    """
    Seeds initial realistic, fictitious patient cases for demonstration and testing.
    NOTE: All patient details below are completely fictitious dummy data.
    """
    cursor = conn.cursor()
    sample_patients = [
        (
            "Eleanor Vance",
            34,
            "Female",
            "+1-555-0142",
            "Severe episodic migraine with visual aura and photophobia for 3 days. Accompanied by mild nausea.",
            "Recurrent tension headaches, childhood eczema.",
            "Penicillin (skin rash), Sulfa drugs",
            "Ibuprofen 400mg PRN, Sumatriptan 50mg PRN",
            "Patient prefers non-drowsy abortive treatments. Blood pressure recorded at 120/78 mmHg. Advised lifestyle modifications."
        ),
        (
            "Marcus Holloway",
            45,
            "Male",
            "+1-555-0187",
            "Persistent dry cough for two weeks and mild exertional dyspnea. No chest tightness.",
            "Mild persistent asthma, seasonal allergic rhinitis.",
            "Latex, Tree nuts (anaphylaxis - carries EpiPen)",
            "Albuterol HFA 90mcg 2 puffs q4h PRN, Fluticasone nasal spray daily",
            "Lungs clear to auscultation bilaterally. SpO2 98% on room air. Referred for peak expiratory flow test."
        ),
        (
            "Amara Okafor",
            28,
            "Female",
            "+1-555-0239",
            "Acute mechanical lower back strain following lifting heavy boxes 48 hours ago.",
            "No prior chronic spinal or musculoskeletal conditions.",
            "No known drug allergies (NKDA)",
            "Acetaminophen 500mg PRN",
            "Good lower extremity neurological signs intact. Recommend gentle core physical therapy and heat therapy."
        ),
        (
            "David Chen",
            62,
            "Male",
            "+1-555-0311",
            "Routine quarterly management review for Type-2 Diabetes and hypertension; mild bilateral knee stiffness.",
            "Type-2 Diabetes Mellitus (10 years), Essential Hypertension (8 years), Mild Osteoarthritis.",
            "Aspirin (gastric discomfort/heartburn)",
            "Metformin 850mg BID, Lisinopril 10mg PO daily",
            "Fasting glucose: 128 mg/dL. Ordered HbA1c panel and comprehensive metabolic panel (CMP)."
        ),
    ]

    cursor.executemany("""
        INSERT INTO patients (name, age, gender, phone, symptoms, medical_history, allergies, medications, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, sample_patients)
    conn.commit()


def validate_patient_payload(data):
    """
    Sanitize and validate patient form inputs.
    Returns: (cleaned_dict, error_message)
    """
    if not isinstance(data, dict):
        return None, "Invalid request payload format. Expected JSON object."

    name = str(data.get("name", "")).strip()
    age_raw = data.get("age")
    gender = str(data.get("gender", "")).strip()
    phone = str(data.get("phone", "")).strip()
    symptoms = str(data.get("symptoms", "")).strip()

    # Optional fields
    medical_history = str(data.get("medical_history", "")).strip()
    allergies = str(data.get("allergies", "")).strip()
    medications = str(data.get("medications", "")).strip()
    notes = str(data.get("notes", "")).strip()

    # Name validation
    if not name:
        return None, "Patient Name is required."
    if len(name) < 2 or len(name) > 100:
        return None, "Patient Name must be between 2 and 100 characters."

    # Age validation
    if age_raw is None or age_raw == "":
        return None, "Patient Age is required."
    try:
        age = int(age_raw)
        if age < 0 or age > 130:
            return None, "Age must be a valid number between 0 and 130."
    except (ValueError, TypeError):
        return None, "Age must be a valid integer."

    # Gender validation
    valid_genders = ["Male", "Female", "Other", "Prefer not to say"]
    # Case-insensitive match
    matched_gender = None
    for g in valid_genders:
        if gender.lower() == g.lower():
            matched_gender = g
            break
    if not matched_gender:
        return None, f"Gender must be one of: {', '.join(valid_genders)}."

    # Phone validation
    if not phone:
        return None, "Phone number is required."
    # Allow digits, +, -, (, ), and spaces, minimum 7 characters
    cleaned_phone = re.sub(r"[\s\-\(\)\+]", "", phone)
    if not cleaned_phone.isdigit() or len(cleaned_phone) < 7 or len(cleaned_phone) > 16:
        return None, "Phone number must be valid and contain between 7 and 16 digits."

    # Symptoms validation
    if not symptoms:
        return None, "Main Symptoms / Chief Complaint is required."
    if len(symptoms) < 3:
        return None, "Main symptoms must be at least 3 characters long."

    cleaned_data = {
        "name": name,
        "age": age,
        "gender": matched_gender,
        "phone": phone,
        "symptoms": symptoms,
        "medical_history": medical_history or "None reported",
        "allergies": allergies or "No known allergies",
        "medications": medications or "None",
        "notes": notes or "No additional notes",
    }

    return cleaned_data, None


# ==========================================
# PAGE ROUTES (HTML FRONTEND)
# ==========================================

@app.route("/")
def index():
    """Renders the Patient Case-Taking / Registration Form."""
    return render_template("index.html")


@app.route("/dashboard")
def dashboard():
    """Renders the Doctor / Admin Patient Case Dashboard."""
    return render_template("dashboard.html")


# ==========================================
# REST API ENDPOINTS
# ==========================================

@app.route("/patients", methods=["POST"])
def create_patient():
    """
    POST /patients — Save a new patient case.
    Expects JSON body with required fields:
    name, age, gender, phone, symptoms
    and optional: medical_history, allergies, medications, notes
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "error": "Invalid JSON body provided."}), 400

    cleaned, err = validate_patient_payload(data)
    if err:
        return jsonify({"success": False, "error": err}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO patients (name, age, gender, phone, symptoms, medical_history, allergies, medications, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            cleaned["name"],
            cleaned["age"],
            cleaned["gender"],
            cleaned["phone"],
            cleaned["symptoms"],
            cleaned["medical_history"],
            cleaned["allergies"],
            cleaned["medications"],
            cleaned["notes"]
        ))
        conn.commit()
        new_id = cursor.lastrowid

        # Fetch the newly created record
        cursor.execute("SELECT * FROM patients WHERE id = ?", (new_id,))
        patient = dict(cursor.fetchone())

        return jsonify({
            "success": True,
            "message": f"Patient case for '{patient['name']}' saved successfully.",
            "patient": patient
        }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()


@app.route("/patients", methods=["GET"])
def get_patients():
    """
    GET /patients — Retrieve patient cases.
    Optional query parameter:
    - ?search=<keyword> : Filters patients by name, symptoms, or phone.
    """
    search_query = request.args.get("search", "").strip()

    conn = get_db_connection()
    cursor = conn.cursor()

    if search_query:
        param = f"%{search_query}%"
        cursor.execute("""
            SELECT * FROM patients 
            WHERE name LIKE ? OR symptoms LIKE ? OR phone LIKE ?
            ORDER BY created_at DESC, id DESC
        """, (param, param, param))
    else:
        cursor.execute("SELECT * FROM patients ORDER BY created_at DESC, id DESC")

    patients = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return jsonify({
        "success": True,
        "count": len(patients),
        "patients": patients
    }), 200


@app.route("/patients/<int:patient_id>", methods=["GET"])
def get_patient(patient_id):
    """
    GET /patients/<id> — Get full details of a particular patient.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patients WHERE id = ?", (patient_id,))
    row = cursor.fetchone()
    conn.close()

    if row is None:
        return jsonify({"success": False, "error": f"Patient with ID {patient_id} not found."}), 404

    return jsonify({
        "success": True,
        "patient": dict(row)
    }), 200


@app.route("/patients/<int:patient_id>", methods=["PUT"])
def update_patient(patient_id):
    """
    PUT /patients/<id> — Update existing patient information.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "error": "Invalid JSON body provided."}), 400

    cleaned, err = validate_patient_payload(data)
    if err:
        return jsonify({"success": False, "error": err}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Verify patient exists
    cursor.execute("SELECT id FROM patients WHERE id = ?", (patient_id,))
    if cursor.fetchone() is None:
        conn.close()
        return jsonify({"success": False, "error": f"Patient with ID {patient_id} not found."}), 404

    try:
        cursor.execute("""
            UPDATE patients
            SET name = ?, age = ?, gender = ?, phone = ?, symptoms = ?,
                medical_history = ?, allergies = ?, medications = ?, notes = ?
            WHERE id = ?
        """, (
            cleaned["name"],
            cleaned["age"],
            cleaned["gender"],
            cleaned["phone"],
            cleaned["symptoms"],
            cleaned["medical_history"],
            cleaned["allergies"],
            cleaned["medications"],
            cleaned["notes"],
            patient_id
        ))
        conn.commit()

        cursor.execute("SELECT * FROM patients WHERE id = ?", (patient_id,))
        updated_patient = dict(cursor.fetchone())

        return jsonify({
            "success": True,
            "message": f"Patient case #{patient_id} updated successfully.",
            "patient": updated_patient
        }), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()


@app.route("/patients/<int:patient_id>", methods=["DELETE"])
def delete_patient(patient_id):
    """
    DELETE /patients/<id> — Delete a patient case.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM patients WHERE id = ?", (patient_id,))
    row = cursor.fetchone()
    if row is None:
        conn.close()
        return jsonify({"success": False, "error": f"Patient with ID {patient_id} not found."}), 404

    patient_name = row["name"]
    try:
        cursor.execute("DELETE FROM patients WHERE id = ?", (patient_id,))
        conn.commit()
        return jsonify({
            "success": True,
            "message": f"Patient case #{patient_id} ({patient_name}) has been deleted."
        }), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()


@app.route("/api/stats", methods=["GET"])
def get_stats():
    """
    GET /api/stats — Get dashboard summary metrics (total cases, demographics, recent counts).
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM patients")
    total_patients = cursor.fetchone()[0]

    cursor.execute("SELECT AVG(age) FROM patients")
    avg_age = cursor.fetchone()[0]
    avg_age = round(avg_age, 1) if avg_age else 0

    cursor.execute("SELECT gender, COUNT(*) FROM patients GROUP BY gender")
    gender_counts = dict(cursor.fetchall())

    conn.close()

    return jsonify({
        "success": True,
        "total_patients": total_patients,
        "average_age": avg_age,
        "gender_breakdown": gender_counts
    }), 200


@app.route("/api/reset-demo", methods=["POST"])
def reset_demo_data():
    """
    POST /api/reset-demo — Reset the database and repopulate with initial dummy records.
    Useful for testing and resetting demo state.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM patients")
    conn.commit()
    seed_sample_patients(conn)
    conn.close()

    return jsonify({
        "success": True,
        "message": "Database re-seeded with demo test patients."
    }), 200


# Application entry point
if __name__ == "__main__":
    init_db()
    # Run development server on port 5000
    print("=" * 65)
    print(" PATIENT CASE-TAKING SYSTEM - FLASK SERVER")
    print(" Database:", DATABASE_PATH)
    print(" Local URL: http://127.0.0.1:5000")
    print("=" * 65)
    app.run(debug=True, host="127.0.0.1", port=5000)
