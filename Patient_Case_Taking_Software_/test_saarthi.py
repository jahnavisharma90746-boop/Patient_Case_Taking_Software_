"""
Test Suite for SAARTHI AI Healthcare Flask & Database Application
==================================================================
Tests:
- Database initialization and seeding (24 initial records)
- Webpage routing and static asset delivery
- REST API stats endpoint (/api/stats)
- Patient CRUD operations (/api/patients)
- Emergency keyword detection & priority triage
- Case verification endpoint (/api/patients/<id>/verify)
- Chief complaint updates (/api/patients/<id>)
- Document upload and clinical analysis (/api/upload)
"""

import os
import io
import json
import unittest
from app import app, init_db, DATABASE_PATH, get_db

class SaarthiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Ensure fresh database setup
        if os.path.exists(DATABASE_PATH):
            try:
                os.remove(DATABASE_PATH)
            except Exception:
                pass
        init_db()

    def setUp(self):
        self.app = app
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_01_index_page(self):
        """Test home page renders successfully"""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"SAARTHI", response.data)
        self.assertIn(b"AI Healthcare", response.data)

    def test_02_static_assets(self):
        """Test style.css and script.js endpoints"""
        css_res = self.client.get("/style.css")
        self.assertEqual(css_res.status_code, 200)
        self.assertIn(b"--primary", css_res.data)

        js_res = self.client.get("/script.js")
        self.assertEqual(js_res.status_code, 200)
        self.assertIn(b"submitPatientAssessment", js_res.data)

    def test_03_stats_endpoint(self):
        """Test stats counts from seeded database"""
        response = self.client.get("/api/stats")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        stats = data["stats"]
        self.assertEqual(stats["total_patients"], 24)
        self.assertEqual(stats["pending_cases"], 8)
        self.assertEqual(stats["verified_cases"], 14)
        self.assertEqual(stats["priority_alerts"], 2)

    def test_04_get_patients_and_search(self):
        """Test fetching patient list and search query filtering"""
        response = self.client.get("/api/patients")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        self.assertEqual(data["count"], 24)

        # Search for Rahul
        search_res = self.client.get("/api/patients?search=Rahul")
        self.assertEqual(search_res.status_code, 200)
        search_data = json.loads(search_res.data)
        self.assertEqual(len(search_data["patients"]), 1)
        self.assertEqual(search_data["patients"][0]["name"], "Rahul Sharma")

    def test_05_create_standard_patient(self):
        """Test creating a standard non-emergency patient"""
        payload = {
            "name": "Karan Mehra",
            "age": "30",
            "complaint": "Mild tension headache",
            "duration": "1 day",
            "medical_history": "None",
            "medications": "None",
            "language": "en"
        }
        response = self.client.post(
            "/api/patients",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        patient = data["patient"]
        self.assertEqual(patient["name"], "Karan Mehra")
        self.assertEqual(patient["status"], "Pending")
        self.assertEqual(patient["is_priority"], 0)

    def test_06_create_emergency_patient(self):
        """Test automatic priority triage when emergency keywords are present"""
        payload = {
            "name": "Ramesh Kumar",
            "age": "55",
            "complaint": "Sudden severe chest pain and breathlessness",
            "duration": "30 minutes",
            "medical_history": "Hypertension",
            "medications": "Aspirin",
            "language": "en"
        }
        response = self.client.post(
            "/api/patients",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        patient = data["patient"]
        self.assertEqual(patient["name"], "Ramesh Kumar")
        self.assertEqual(patient["status"], "Review")
        self.assertEqual(patient["is_priority"], 1)
        self.assertIsNotNone(patient["priority_reason"])

    def test_07_verify_patient(self):
        """Test doctor verification endpoint"""
        # Create a pending patient
        create_res = self.client.post(
            "/api/patients",
            data=json.dumps({
                "name": "Siddharth Roy",
                "age": "27",
                "complaint": "Mild stomach ache",
                "duration": "2 days"
            }),
            content_type="application/json"
        )
        patient_id = json.loads(create_res.data)["patient"]["id"]

        # Verify
        verify_res = self.client.post(
            f"/api/patients/{patient_id}/verify",
            data=json.dumps({"doctor_name": "Dr. Sharma", "notes": "Prescribed antacid, recovery expected."}),
            content_type="application/json"
        )
        self.assertEqual(verify_res.status_code, 200)
        verify_data = json.loads(verify_res.data)
        self.assertTrue(verify_data["success"])
        self.assertEqual(verify_data["patient"]["status"], "Verified")

    def test_08_update_patient_complaint(self):
        """Test updating patient chief complaint"""
        # Fetch first patient
        patients = json.loads(self.client.get("/api/patients").data)["patients"]
        pid = patients[0]["id"]

        update_res = self.client.put(
            f"/api/patients/{pid}",
            data=json.dumps({"complaint": "Updated complaint after consultation"}),
            content_type="application/json"
        )
        self.assertEqual(update_res.status_code, 200)
        updated_data = json.loads(update_res.data)
        self.assertEqual(updated_data["patient"]["complaint"], "Updated complaint after consultation")

    def test_09_upload_document(self):
        """Test uploading a medical document and clinical extraction"""
        file_content = b"%PDF-1.4 Mock Blood Test Report for Complete Blood Count..."
        data = {
            "file": (io.BytesIO(file_content), "blood_test_report.pdf"),
            "patient_id": "1"
        }
        res = self.client.post(
            "/api/upload",
            data=data,
            content_type="multipart/form-data"
        )
        self.assertEqual(res.status_code, 201)
        doc_data = json.loads(res.data)
        self.assertTrue(doc_data["success"])
        self.assertIn("Complete Blood Count", doc_data["document"]["analysis"])

    def test_10_delete_patient(self):
        """Test deleting a patient record"""
        create_res = self.client.post(
            "/api/patients",
            data=json.dumps({"name": "Temporary Test Patient", "age": "20", "complaint": "Temporary test"}),
            content_type="application/json"
        )
        pid = json.loads(create_res.data)["patient"]["id"]

        del_res = self.client.delete(f"/api/patients/{pid}")
        self.assertEqual(del_res.status_code, 200)
        del_data = json.loads(del_res.data)
        self.assertTrue(del_data["success"])

        # Confirm not found
        get_res = self.client.get(f"/api/patients/{pid}")
        self.assertEqual(get_res.status_code, 404)

if __name__ == "__main__":
    unittest.main()
