"""
SAARTHI AI HEALTHCARE - DATABASE INITIALIZATION & VERIFICATION
Website: https://divya-sharma-82.github.io/saarthi-healthcare/
"""

import sqlite3
import os
import sys
import re

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(DB_DIR, "saarthi.db")
SCHEMA_FILE = os.path.join(DB_DIR, "schema_sqlite.sql")
SEED_FILE = os.path.join(DB_DIR, "seed_data.sql")

def initialize_database():
    print(f"[*] Initializing database at: {DB_FILE}")
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
        print("    -> Removed existing database file.")

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Execute schema
    print(f"[*] Executing schema: {SCHEMA_FILE}")
    with open(SCHEMA_FILE, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    cursor.executescript(schema_sql)

    # Execute seed data
    print(f"[*] Executing seed data: {SEED_FILE}")
    with open(SEED_FILE, "r", encoding="utf-8") as f:
        seed_sql = f.read()
    cursor.executescript(seed_sql)

    conn.commit()
    print("[+] Database initialized successfully with tables and seed records!\n")
    return conn

def verify_database(conn):
    cursor = conn.cursor()

    print("=================================================================")
    print(" 1. DOCTOR DASHBOARD STATS (Matching Saarthi UI Stat Cards)")
    print("=================================================================")
    cursor.execute("SELECT * FROM v_dashboard_stats")
    stats = cursor.fetchone()
    print(f"    - Total Patients  : {stats[0]}")
    print(f"    - Pending Cases   : {stats[1]}")
    print(f"    - Verified Cases  : {stats[2]}")
    print(f"    - Priority Alerts : {stats[3]}")

    print("\n=================================================================")
    print(" 2. DOCTOR DASHBOARD PATIENTS TABLE (v_doctor_dashboard)")
    print("=================================================================")
    cursor.execute("SELECT id, name, date, status, is_emergency, message FROM Appoinments ORDER BY id DESC")
    rows = cursor.fetchall()
    for row in rows:
        pid, name, date_val, status, is_emerg, msg = row
        # Parse age and complaint like script.js does
        age_match = re.search(r"Age:\s*([^\n\r]+)", msg or "")
        age = age_match.group(1).strip() if age_match else "—"
        comp_match = re.search(r"Health Problem:\s*([^\n\r]+)", msg or "")
        complaint = comp_match.group(1).strip() if comp_match else "—"
        emerg_tag = " [🚨 PRIORITY ALERT]" if is_emerg else ""
        print(f"    ID {pid:2d} | {name:<18} | Age: {age:<3} | Complaint: {complaint[:30]:<30} | Status: {status:<8}{emerg_tag}")

    print("\n=================================================================")
    print(" 3. NORMALIZED TABLES COUNT")
    print("=================================================================")
    tables = [
        "Appoinments",
        "patients",
        "doctors",
        "documents",
        "doctor_reviews",
        "emergency_alerts"
    ]
    for tbl in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {tbl}")
        cnt = cursor.fetchone()[0]
        print(f"    - Table '{tbl:<22}': {cnt} records")

    print("\n=================================================================")
    print(" 4. SIMULATING NEW PATIENT ASSESSMENT (Like frontend nextQuestion())")
    print("=================================================================")
    new_patient = {
        "name": "Meera Joshi",
        "phone": "+91 99000 11223",
        "date": "2026-09-29",
        "message": "Age: 38\nHealth Problem: Chest pain and dizziness\nDuration: 2 hours\nMedical History: None\nMedicines: None",
        "status": "Review",
        "is_emergency": 1
    }
    cursor.execute("""
        INSERT INTO Appoinments (name, phone, date, message, status, is_emergency)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        new_patient["name"],
        new_patient["phone"],
        new_patient["date"],
        new_patient["message"],
        new_patient["status"],
        new_patient["is_emergency"]
    ))
    new_id = cursor.lastrowid
    conn.commit()
    print(f"    [+] Successfully inserted patient '{new_patient['name']}' with ID {new_id}!")

    cursor.execute("SELECT id, name, status, is_emergency FROM Appoinments WHERE id = ?", (new_id,))
    inserted = cursor.fetchone()
    print(f"    -> Query result: ID={inserted[0]}, Name={inserted[1]}, Status={inserted[2]}, Emergency={inserted[3]}")
    print("=================================================================\n")

if __name__ == "__main__":
    conn = initialize_database()
    verify_database(conn)
    conn.close()
