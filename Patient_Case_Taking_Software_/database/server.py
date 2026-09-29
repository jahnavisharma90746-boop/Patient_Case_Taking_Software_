"""
SAARTHI AI HEALTHCARE - LOCAL REST API SERVER & STATIC SERVER
Provides Supabase-compatible PostgREST mock endpoints and REST API for saarthi.db
Zero external dependencies (uses standard library http.server and sqlite3).

Usage:
    python server.py [port] (default port: 8000)
"""

import sys
import os
import json
import sqlite3
import re
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Set UTF-8
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "saarthi.db")
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

class SaarthiApiHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def _send_json(self, status_code, payload):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, apikey, Authorization")
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, apikey, Authorization")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        # 1. Supabase PostgREST compatibility endpoint: /rest/v1/Appoinments
        if path.rstrip("/") in ("/rest/v1/Appoinments", "/api/appointments", "/api/Appoinments"):
            conn = get_db()
            cursor = conn.cursor()
            order_param = query.get("order", ["id.desc"])[0]
            order_dir = "DESC" if "desc" in order_param.lower() else "ASC"

            cursor.execute(f"SELECT * FROM Appoinments ORDER BY id {order_dir}")
            rows = [dict(row) for row in cursor.fetchall()]
            conn.close()
            return self._send_json(200, rows)

        # 2. Doctor Dashboard Stats endpoint: /api/stats
        if path.rstrip("/") == "/api/stats":
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM v_dashboard_stats")
            stats = cursor.fetchone()
            conn.close()
            return self._send_json(200, {
                "total_patients": stats["total_patients"] or 0,
                "pending_cases": stats["pending_cases"] or 0,
                "verified_cases": stats["verified_cases"] or 0,
                "priority_alerts": stats["priority_alerts"] or 0
            })

        # 3. Normalized Patients endpoint: /api/patients
        if path.rstrip("/") == "/api/patients":
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT p.patient_id, p.full_name, p.age, p.phone, p.preferred_language,
                       c.case_id, c.status, c.is_priority_alert, c.urgency_level,
                       ca.chief_complaint, ca.duration, ca.medical_history, ca.current_medications
                FROM patients p
                LEFT JOIN patient_cases c ON c.patient_id = p.patient_id
                LEFT JOIN clinical_assessments ca ON ca.case_id = c.case_id
                ORDER BY p.patient_id DESC
            """)
            rows = [dict(row) for row in cursor.fetchall()]
            conn.close()
            return self._send_json(200, rows)

        # Fallback to static files
        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path.rstrip("/") in ("/rest/v1/Appoinments", "/api/appointments", "/api/Appoinments"):
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            try:
                payload = json.loads(body)
            except Exception as e:
                return self._send_json(400, {"error": "Invalid JSON", "details": str(e)})

            if isinstance(payload, list):
                item = payload[0] if len(payload) > 0 else {}
            else:
                item = payload

            name = item.get("name", "Unknown")
            phone = item.get("phone", "")
            date_val = item.get("date", "")
            message = item.get("message", "")

            # Emergency check
            emergency_keywords = [
                "chest pain", "difficulty breathing", "breathing problem",
                "unconscious", "severe bleeding", "stroke", "heart attack",
                "सीने में दर्द", "सांस लेने में दिक्कत", "बेहोशी", "बहुत ज्यादा खून", "हार्ट अटैक"
            ]
            is_emergency = 1 if any(kw in message.lower() for kw in emergency_keywords) else 0
            status = "Review" if is_emergency else "Pending"

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO Appoinments (name, phone, date, message, status, is_emergency)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (name, phone, date_val, message, status, is_emergency))
            new_id = cursor.lastrowid
            conn.commit()

            cursor.execute("SELECT * FROM Appoinments WHERE id = ?", (new_id,))
            created_row = dict(cursor.fetchone())
            conn.close()

            return self._send_json(201, [created_row])

        return self._send_json(404, {"error": "Endpoint not found"})

def run_server(port=8000):
    server_address = ("", port)
    httpd = HTTPServer(server_address, SaarthiApiHandler)
    print(f"[*] Saarthi Healthcare Database API running on http://localhost:{port}/")
    print(f"[*] PostgREST / Supabase compatible endpoint: http://localhost:{port}/rest/v1/Appoinments")
    print(f"[*] Stats endpoint: http://localhost:{port}/api/stats")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[!] Server stopped.")

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port)
