-- ============================================================================
-- SAARTHI AI HEALTHCARE - COMPLETE SQLITE SCHEMA
-- Website: https://divya-sharma-82.github.io/saarthi-healthcare/
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ============================================================================
-- 1. PRIMARY APP TABLE ("Appoinments")
-- Matches the frontend JS query interface:
--   db.from("Appoinments").insert([patientData])
--   db.from("Appoinments").select("*").order("id", { ascending: false })
-- ============================================================================

CREATE TABLE IF NOT EXISTS Appoinments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    date TEXT DEFAULT (DATE('now')),
    message TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Verified', 'Review', 'Completed')),
    is_emergency INTEGER DEFAULT 0 CHECK (is_emergency IN (0, 1)),
    created_at TEXT DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_appoinments_id_desc ON Appoinments (id DESC);
CREATE INDEX IF NOT EXISTS idx_appoinments_status ON Appoinments (status);

-- ============================================================================
-- 2. PATIENTS TABLE (Structured Clinical Patient Intake)
-- Matches Flask backend & enterprise health records
-- ============================================================================

CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age TEXT NOT NULL,
    gender TEXT DEFAULT 'Not specified',
    complaint TEXT NOT NULL,
    duration TEXT,
    medical_history TEXT,
    medications TEXT,
    allergies TEXT DEFAULT 'None reported',
    investigation_report TEXT DEFAULT 'Not uploaded',
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Verified', 'Review', 'Completed', 'Cancelled')),
    is_priority INTEGER DEFAULT 0 CHECK (is_priority IN (0, 1)),
    priority_reason TEXT,
    doctor_notes TEXT,
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'hi')),
    created_at TEXT DEFAULT (DATETIME('now')),
    updated_at TEXT DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_patients_status ON patients (status);
CREATE INDEX IF NOT EXISTS idx_patients_priority ON patients (is_priority);

-- ============================================================================
-- 3. MEDICAL DOCUMENTS TABLE
-- Prescriptions, Lab Reports, X-Rays, ECGs
-- ============================================================================

CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    analysis_summary TEXT,
    uploaded_at TEXT DEFAULT (DATETIME('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
);

-- ============================================================================
-- 4. DOCTOR REVIEWS & CLINICAL VERIFICATION LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS doctor_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    doctor_name TEXT DEFAULT 'Dr. Verified',
    notes TEXT,
    created_at TEXT DEFAULT (DATETIME('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- ============================================================================
-- 5. DOCTORS DIRECTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS doctors (
    doctor_id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    specialization TEXT DEFAULT 'General Physician',
    license_number TEXT UNIQUE,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (DATETIME('now'))
);

-- ============================================================================
-- 6. EMERGENCY TRIAGE ALERTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS emergency_alerts (
    alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    trigger_keyword TEXT NOT NULL,
    severity_level TEXT DEFAULT 'High' CHECK (severity_level IN ('Moderate', 'High', 'Critical')),
    is_acknowledged INTEGER DEFAULT 0,
    acknowledged_by TEXT,
    acknowledged_at TEXT,
    created_at TEXT DEFAULT (DATETIME('now'))
);

-- ============================================================================
-- 7. DASHBOARD STATS VIEWS (Real-time aggregation)
-- ============================================================================

CREATE VIEW IF NOT EXISTS v_dashboard_stats AS
SELECT
    COUNT(*) AS total_patients,
    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_cases,
    SUM(CASE WHEN status = 'Verified' THEN 1 ELSE 0 END) AS verified_cases,
    SUM(CASE WHEN is_priority = 1 OR status = 'Review' THEN 1 ELSE 0 END) AS priority_alerts
FROM patients;

CREATE VIEW IF NOT EXISTS v_doctor_dashboard AS
SELECT 
    id,
    name,
    age,
    complaint,
    status,
    is_priority,
    priority_reason,
    doctor_notes,
    created_at
FROM patients
ORDER BY id DESC;
