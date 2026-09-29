"""
Automated Test Suite for Patient Case-Taking Software
===================================================
Tests database creation, all REST API endpoints (GET, POST, PUT, DELETE),
validation constraints, search queries, and HTML template routes.
"""

import os
import unittest
import json

# Set test environment
from app import app, init_db, get_db_connection, DATABASE_PATH


class PatientCaseTakingTestCase(unittest.TestCase):

    def setUp(self):
        """Set up test client and ensure fresh database state."""
        app.config["TESTING"] = True
        self.client = app.test_client()
        init_db()

    def test_01_database_and_seed_data(self):
        """Verify database exists and initial dummy patient records are seeded."""
        self.assertTrue(os.path.exists(DATABASE_PATH), "database.db must exist.")
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM patients")
        count = cursor.fetchone()[0]
        conn.close()
        self.assertGreaterEqual(count, 4, "Database should contain at least 4 seed patients.")
        print(f"[PASS] test_01_database_and_seed_data: Found {count} seeded patient records.")

    def test_02_get_all_patients(self):
        """Test GET /patients returns 200 OK and valid JSON array."""
        res = self.client.get("/patients")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("patients", data)
        self.assertIsInstance(data["patients"], list)
        print(f"[PASS] test_02_get_all_patients: Returned {len(data['patients'])} patient records.")

    def test_03_create_new_patient(self):
        """Test POST /patients creates a new patient case record."""
        payload = {
            "name": "Sarah Jenkins",
            "age": 29,
            "gender": "Female",
            "phone": "+1-555-9012",
            "symptoms": "Acute sore throat, low-grade fever (100.2F), and fatigue for 2 days.",
            "medical_history": "Seasonal allergies",
            "allergies": "Erythromycin",
            "medications": "Cetirizine 10mg daily",
            "notes": "Throat swab taken for rapid strep test."
        }
        res = self.client.post("/patients", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("patient", data)
        new_patient = data["patient"]
        self.assertEqual(new_patient["name"], "Sarah Jenkins")
        self.assertEqual(new_patient["age"], 29)
        self.assertEqual(new_patient["gender"], "Female")
        self.assertEqual(new_patient["phone"], "+1-555-9012")
        print(f"[PASS] test_03_create_new_patient: Created patient ID #{new_patient['id']}.")

    def test_04_validation_rejection(self):
        """Test POST /patients rejects invalid input data with appropriate 400 error."""
        # 1. Missing name
        res = self.client.post("/patients", json={"name": "", "age": 30, "gender": "Male", "phone": "555-1234", "symptoms": "Fever"})
        self.assertEqual(res.status_code, 400)
        self.assertIn("Name is required", res.get_json().get("error", ""))

        # 2. Invalid age
        res = self.client.post("/patients", json={"name": "Bob", "age": 250, "gender": "Male", "phone": "555-1234", "symptoms": "Fever"})
        self.assertEqual(res.status_code, 400)
        self.assertIn("between 0 and 130", res.get_json().get("error", ""))

        # 3. Invalid phone number
        res = self.client.post("/patients", json={"name": "Bob", "age": 35, "gender": "Male", "phone": "abc", "symptoms": "Fever"})
        self.assertEqual(res.status_code, 400)
        self.assertIn("Phone number must be valid", res.get_json().get("error", ""))

        # 4. Missing symptoms
        res = self.client.post("/patients", json={"name": "Bob", "age": 35, "gender": "Male", "phone": "555-1234567", "symptoms": ""})
        self.assertEqual(res.status_code, 400)
        self.assertIn("symptoms", res.get_json().get("error", "").lower())

        print("[PASS] test_04_validation_rejection: All invalid inputs correctly rejected.")

    def test_05_get_single_patient(self):
        """Test GET /patients/<id> returns single patient and 404 for non-existent."""
        # Fetch list to get first valid ID
        res_list = self.client.get("/patients")
        first_id = res_list.get_json()["patients"][0]["id"]

        res = self.client.get(f"/patients/{first_id}")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["patient"]["id"], first_id)

        # Non-existent ID
        res_404 = self.client.get("/patients/999999")
        self.assertEqual(res_404.status_code, 404)
        print(f"[PASS] test_05_get_single_patient: Successfully retrieved ID #{first_id} and verified 404.")

    def test_06_update_patient(self):
        """Test PUT /patients/<id> updates patient record."""
        # Fetch a patient
        res_list = self.client.get("/patients")
        target_patient = res_list.get_json()["patients"][0]
        target_id = target_patient["id"]

        update_payload = {
            "name": target_patient["name"],
            "age": target_patient["age"],
            "gender": target_patient["gender"],
            "phone": target_patient["phone"],
            "symptoms": "Symptoms resolved after prescribed treatment course.",
            "medical_history": target_patient["medical_history"],
            "allergies": target_patient["allergies"],
            "medications": target_patient["medications"],
            "notes": "Follow-up visit: Patient is feeling much better. Case marked stable."
        }

        res = self.client.put(f"/patients/{target_id}", json=update_payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data["patient"]["symptoms"], "Symptoms resolved after prescribed treatment course.")
        print(f"[PASS] test_06_update_patient: Successfully updated patient ID #{target_id}.")

    def test_07_delete_patient(self):
        """Test DELETE /patients/<id> deletes a patient case record."""
        # Create a temporary patient to delete
        temp_payload = {
            "name": "Temporary Test Patient",
            "age": 40,
            "gender": "Other",
            "phone": "555-998877",
            "symptoms": "Temporary symptoms for deletion test.",
            "medical_history": "None",
            "allergies": "None",
            "medications": "None",
            "notes": "To be deleted."
        }
        create_res = self.client.post("/patients", json=temp_payload)
        temp_id = create_res.get_json()["patient"]["id"]

        # Delete it
        del_res = self.client.delete(f"/patients/{temp_id}")
        self.assertEqual(del_res.status_code, 200)
        self.assertTrue(del_res.get_json().get("success"))

        # Confirm 404 afterwards
        check_res = self.client.get(f"/patients/{temp_id}")
        self.assertEqual(check_res.status_code, 404)
        print(f"[PASS] test_07_delete_patient: Successfully deleted patient ID #{temp_id} and verified removal.")

    def test_08_search_patients(self):
        """Test GET /patients?search=<keyword> queries matching records."""
        res = self.client.get("/patients?search=Eleanor")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(any("Eleanor" in p["name"] for p in data["patients"]))
        print(f"[PASS] test_08_search_patients: Search query returned {len(data['patients'])} matches.")

    def test_09_html_pages(self):
        """Test GET / and GET /dashboard render HTML with HTTP 200."""
        res_index = self.client.get("/")
        self.assertEqual(res_index.status_code, 200)
        self.assertIn(b"Patient Case-Taking", res_index.data)
        self.assertIn(b"Clinical Intake Questionnaire", res_index.data)

        res_dashboard = self.client.get("/dashboard")
        self.assertEqual(res_dashboard.status_code, 200)
        self.assertIn(b"Doctor &amp; Clinical Dashboard", res_dashboard.data)
        self.assertIn(b"Total Patients", res_dashboard.data)
        print("[PASS] test_09_html_pages: Both HTML pages rendered successfully.")


if __name__ == "__main__":
    unittest.main()
