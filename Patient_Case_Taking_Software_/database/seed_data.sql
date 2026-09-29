-- ============================================================================
-- SAARTHI AI HEALTHCARE - SEED DATA SCRIPT
-- Exactly matches UI Dashboard counters:
-- Total Patients: 24 | Pending: 8 | Verified: 14 | Priority Alerts: 2
-- ============================================================================

-- 1. DOCTORS DIRECTORY
INSERT INTO doctors (full_name, email, phone, specialization, license_number, is_active)
VALUES 
    ('Dr. Priya Nambiar', 'dr.priya@saarthi.ai', '+91 98765 43210', 'Chief Medical Officer', 'MCI-2018-984321', 1),
    ('Dr. Rajesh Kulkarni', 'dr.rajesh@saarthi.ai', '+91 98765 43211', 'Cardiologist', 'MCI-2015-112233', 1),
    ('Dr. Sneha Verma', 'dr.sneha@saarthi.ai', '+91 98765 43212', 'General Physician', 'MCI-2020-556677', 1);

-- 2. PATIENTS TABLE (24 Detailed Clinical Records)
INSERT INTO patients (id, name, age, gender, complaint, duration, medical_history, medications, allergies, investigation_report, status, is_priority, priority_reason, doctor_notes, language)
VALUES 
    -- 8 Pending cases
    (1, 'Rahul Sharma', '35', 'Male', 'Headache', '3 days', 'No significant past illness', 'Paracetamol 500mg PRN', 'None reported', 'Not uploaded', 'Pending', 0, NULL, NULL, 'en'),
    (2, 'Priya Patel', '29', 'Female', 'Migraine with aura', '2 days', 'Occasional sinusitis', 'None', 'None reported', 'Not uploaded', 'Pending', 0, NULL, NULL, 'en'),
    (3, 'Rajesh Verma', '50', 'Male', 'Lower back stiffness', '2 weeks', 'Sedentary desk work', 'Muscle relaxants', 'None reported', 'Not uploaded', 'Pending', 0, NULL, NULL, 'en'),
    (4, 'Neha Gupta', '24', 'Female', 'Sore throat and dry cough', '4 days', 'Mild seasonal pharyngitis', 'Cetirizine 10mg', 'Dust allergy', 'Not uploaded', 'Pending', 0, NULL, NULL, 'en'),
    (5, 'Suresh Rao', '61', 'Male', 'Joint stiffness in knees', '1 month', 'Mild osteoarthritis', 'Glucosamine 500mg', 'Sulfa drugs', 'Not uploaded', 'Pending', 0, NULL, NULL, 'en'),
    (6, 'Pooja Nair', '33', 'Female', 'Acid reflux & burning epigastrium', '5 days', 'GERD history', 'Pantoprazole 40mg', 'None reported', 'Not uploaded', 'Pending', 0, NULL, NULL, 'en'),
    (7, 'Deepak Joshi', '41', 'Male', 'Skin rash & itching on arms', '1 week', 'Contact dermatitis', 'Antihistamine cream', 'Penicillin', 'Not uploaded', 'Pending', 0, NULL, NULL, 'en'),
    (8, 'Kavita Mehta', '38', 'Female', 'Insomnia & persistent fatigue', '3 weeks', 'Mild generalized anxiety', 'Melatonin 3mg', 'None reported', 'Not uploaded', 'Pending', 0, NULL, NULL, 'en'),

    -- 14 Verified cases
    (9, 'Anjali Singh', '28', 'Female', 'Fever and mild body ache', '4 days', 'None', 'Paracetamol 650mg TDS', 'None reported', 'Document uploaded: CBC_Report.pdf (Analyzed ✓)', 'Verified', 0, NULL, 'Viral fever managed, resting advised.', 'en'),
    (10, 'Vikram Malhotra', '45', 'Male', 'Essential Hypertension routine review', '6 months', 'Hypertension', 'Amlodipine 5mg OD', 'None reported', 'Document uploaded: BP_Log.pdf (Analyzed ✓)', 'Verified', 0, NULL, 'BP within target range (128/82 mmHg).', 'en'),
    (11, 'Sneha Kapoor', '31', 'Female', 'Iron deficiency anemia follow-up', '2 months', 'Anemia', 'Ferrous ascorbate 100mg', 'None reported', 'Document uploaded: Serum_Ferritin.pdf (Analyzed ✓)', 'Verified', 0, NULL, 'Hemoglobin improved to 11.8 g/dL.', 'en'),
    (12, 'Amit Sharma', '52', 'Male', 'Type 2 Diabetes routine follow-up', '1 year', 'Diabetes Mellitus', 'Metformin 500mg BD', 'None reported', 'Document uploaded: HbA1c_Report.pdf (Analyzed ✓)', 'Verified', 0, NULL, 'HbA1c steady at 6.8%. Continue current dose.', 'en'),
    (13, 'Meera Sen', '26', 'Female', 'Allergic rhinitis and sneezing', '10 days', 'Allergic bronchitis', 'Montelukast 10mg', 'Pollen allergy', 'Document uploaded: Allergy_Test.png (Analyzed ✓)', 'Verified', 0, NULL, 'Seasonal prophylaxis initiated.', 'en'),
    (14, 'Rohan Das', '39', 'Male', 'Acute gastroenteritis recovery', '3 days', 'Mild food intolerance', 'ORS, Probiotics', 'None reported', 'Document uploaded: Stool_Report.pdf (Analyzed ✓)', 'Verified', 0, NULL, 'Hydration restored, symptoms resolved.', 'en'),
    (15, 'Ramesh Gupta', '58', 'Female', 'Bilateral knee pain', '6 months', 'Hypothyroidism', 'Thyroxine 50mcg, Calcium', 'None reported', 'Document uploaded: Knee_XRay.png (Analyzed ✓)', 'Verified', 0, NULL, 'Physiotherapy regimen prescribed.', 'en'),
    (16, 'Alok Mishra', '47', 'Male', 'Dyslipidemia lipid assessment', '3 months', 'Elevated LDL cholesterol', 'Atorvastatin 10mg', 'None reported', 'Document uploaded: Lipid_Panel.pdf (Analyzed ✓)', 'Verified', 0, NULL, 'Lipid profile improved; continue diet control.', 'en'),
    (17, 'Tina Fernandez', '22', 'Female', 'Grade 1 ankle sprain right leg', '2 days', 'None', 'Ice compression, Ace bandage', 'None reported', 'Document uploaded: Ankle_XRay.png (Analyzed ✓)', 'Verified', 0, NULL, 'No fracture evident on X-ray.', 'en'),
    (18, 'Sanjay Joshi', '54', 'Male', 'Hyperuricemia gout in right toe', '1 week', 'Gout attack', 'Colchicine 0.5mg', 'Aspirin', 'Document uploaded: Uric_Acid_Test.pdf (Analyzed ✓)', 'Verified', 0, NULL, 'Uric acid level 7.2 mg/dL. Diet counseling provided.', 'en'),
    (19, 'Anita Roy', '36', 'Female', 'Primary Hypothyroidism follow-up', '1 year', 'Hypothyroidism', 'Levothyroxine 75mcg', 'None reported', 'Document uploaded: Thyroid_Panel.pdf (Analyzed ✓)', 'Verified', 0, NULL, 'TSH within euthyroid limit (2.4 mIU/L).', 'en'),
    (20, 'Manish Yadav', '49', 'Male', 'Chronic maxillary sinusitis', '1 month', 'Deviated nasal septum', 'Saline nasal spray', 'None reported', 'Document uploaded: CT_Sinus.pdf (Analyzed ✓)', 'Verified', 0, NULL, 'Nasal mucosal congestion improving.', 'en'),
    (21, 'Divya Pillai', '27', 'Female', 'Uncomplicated urinary tract infection', '3 days', 'None', 'Nitrofurantoin 100mg BD', 'None reported', 'Document uploaded: Urine_Routine.pdf (Analyzed ✓)', 'Verified', 0, NULL, 'Urine culture negative at 48 hours.', 'en'),
    (22, 'Harish Bhat', '63', 'Male', 'Post-op cataract follow-up right eye', '2 weeks', 'Cataract surgery', 'Moxifloxacin eye drops', 'None reported', 'Document uploaded: Vision_Chart.pdf (Analyzed ✓)', 'Verified', 0, NULL, 'Visual acuity 6/9 pinhole 6/6.', 'en'),

    -- 2 Priority Alerts (Emergencies)
    (23, 'Aman Verma', '42', 'Male', 'Chest discomfort and sweating', '2 hours', 'Smoker, Family history of CAD', 'None', 'None reported', 'Document uploaded: ECG_Strip.pdf (Analyzed ✓)', 'Review', 1, 'Reported acute chest discomfort and sweating', 'URGENT: STAT ECG and cardiac enzyme panel sent. Monitored in ER triage.', 'en'),
    (24, 'Sunita Devi', '56', 'Female', 'सांस लेने में दिक्कत (Severe difficulty breathing)', '1 day', 'Bronchial asthma (severe)', 'Deriphyllin, Salbutamol inhaler', 'Dust, strong odours', 'Document uploaded: Chest_XRay.pdf (Analyzed ✓)', 'Review', 1, 'Reported acute severe breathlessness', 'URGENT: SpO2 91% on room air. Nebulization with Budecort + Duolin initiated.', 'hi');

-- 3. APPOINMENTS TABLE (Direct Frontend Compatibility)
INSERT INTO Appoinments (id, name, phone, date, message, status, is_emergency)
SELECT 
    id,
    name,
    '+91 98' || substr('00000000' || id, -8),
    DATE('now'),
    'Age: ' || age || '
Health Problem: ' || complaint || '
Duration: ' || duration || '
Medical History: ' || medical_history || '
Medicines: ' || medications,
    status,
    is_priority
FROM patients;

-- 4. EMERGENCY ALERTS
INSERT INTO emergency_alerts (patient_id, trigger_keyword, severity_level, is_acknowledged, acknowledged_by, acknowledged_at)
VALUES 
    (23, 'Chest discomfort', 'Critical', 1, 'Dr. Rajesh Kulkarni', DATETIME('now', '-1 hour')),
    (24, 'सांस लेने में दिक्कत', 'High', 1, 'Dr. Priya Nambiar', DATETIME('now', '-2 hours'));

-- 5. MEDICAL DOCUMENTS
INSERT INTO documents (patient_id, filename, original_filename, file_type, file_size, analysis_summary)
VALUES 
    (9, 'cbc_report_2026.pdf', 'CBC_Report.pdf', 'pdf', 245000, 'TLC: 11,200. Platelets: 240,000. Mild reactive leukocytosis consistent with viral fever.'),
    (10, 'bp_log_2026.pdf', 'BP_Log.pdf', 'pdf', 158000, '14-day ambulatory blood pressure average: 126/82 mmHg.'),
    (23, 'ecg_strip_emergency.pdf', 'ECG_Strip.pdf', 'pdf', 512000, 'Emergency triage: Sinus rhythm with mild ST depression in leads II, III, aVF.'),
    (24, 'chest_xray_sunita.pdf', 'Chest_XRay.pdf', 'pdf', 720000, 'Hyperinflated lung fields, no focal consolidation or pneumothorax.');
