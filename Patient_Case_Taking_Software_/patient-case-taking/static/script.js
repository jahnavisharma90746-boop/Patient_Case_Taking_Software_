/**
 * Patient Case-Taking System - Client Application JavaScript
 * ==========================================================
 * Handles form validation, asynchronous REST API communication (POST, GET, PUT, DELETE),
 * modal dialogs, real-time search filtering, and toast feedback.
 */

// Global State
let currentPatients = [];
let pendingDeleteId = null;

// Initialize when DOM content is ready
document.addEventListener("DOMContentLoaded", () => {
  initToasts();
  initFormPage();
  initDashboardPage();
  initModalListeners();
});

/* ==========================================================================
   TOAST NOTIFICATION ENGINE
   ========================================================================== */
function initToasts() {
  if (!document.getElementById("toastContainer")) {
    const container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
}

function showToast(message, type = "success", duration = 4500) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ"
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || "•"}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
    <button class="toast-close" title="Dismiss">&times;</button>
  `;

  const closeBtn = toast.querySelector(".toast-close");
  closeBtn.addEventListener("click", () => removeToast(toast));

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      removeToast(toast);
    }, duration);
  }
}

function removeToast(toast) {
  if (!toast) return;
  toast.style.opacity = "0";
  toast.style.transform = "translateX(100%)";
  setTimeout(() => {
    if (toast.parentElement) {
      toast.parentElement.removeChild(toast);
    }
  }, 250);
}

/* ==========================================================================
   CASE-TAKING FORM PAGE (index.html)
   ========================================================================== */
function initFormPage() {
  const patientForm = document.getElementById("patientCaseForm");
  if (!patientForm) return;

  // Real-time input validation on blur / input
  const inputs = patientForm.querySelectorAll("input, select, textarea");
  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      if (input.classList.contains("is-invalid")) {
        validateField(input);
      }
    });
  });

  // Submit Handler
  patientForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validateEntireForm(patientForm)) {
      showToast("Please correct the highlighted fields before saving.", "error");
      return;
    }

    const submitBtn = patientForm.querySelector("button[type='submit']");
    const originalBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Saving Case Record...</span>`;

    const payload = getFormData(patientForm);

    try {
      const response = await fetch("/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showToast(result.message || "Patient case registered successfully!", "success");
        patientForm.reset();
        clearValidationMarks(patientForm);
        
        // Refresh recent patients preview if present on page
        loadRecentPatientsPreview();
      } else {
        showToast(result.error || "Failed to save patient case.", "error");
      }
    } catch (err) {
      console.error("API error:", err);
      showToast("Network error: Could not reach Flask backend server.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
  });

  // Clear Form Handler
  const clearBtn = document.getElementById("clearFormBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      patientForm.reset();
      clearValidationMarks(patientForm);
      showToast("Form fields cleared.", "info", 2000);
      const firstInput = patientForm.querySelector("#name");
      if (firstInput) firstInput.focus();
    });
  }

  // Quick Demo Dummy Data Generator Button
  const demoBtn = document.getElementById("fillDemoBtn");
  if (demoBtn) {
    demoBtn.addEventListener("click", () => {
      fillSamplePatientData(patientForm);
    });
  }

  // Load preview cases on index page
  loadRecentPatientsPreview();
}

/**
 * Fills the form with realistic dummy clinical data for fast testing.
 */
function fillSamplePatientData(form) {
  const dummySamples = [
    {
      name: "Arthur Pendelton",
      age: 52,
      gender: "Male",
      phone: "+1-555-0892",
      symptoms: "Epigastric burning pain radiating to retrosternal area after meals for 3 weeks; mild dysphagia.",
      medical_history: "Mild Gastroesophageal Reflux Disease (GERD), Hyperlipidemia.",
      allergies: "Amoxicillin (mild urticaria)",
      medications: "Atorvastatin 20mg daily, Omeprazole 20mg daily",
      notes: "Symptoms worsen with spicy food and coffee. Recommended upper endoscopy if no improvement in 4 weeks."
    },
    {
      name: "Sophia Martinez",
      age: 31,
      gender: "Female",
      phone: "+1-555-0744",
      symptoms: "Bilateral frontotemporal throbbing headache with nausea and light sensitivity for 24 hours.",
      medical_history: "Episodic migraine with aura since adolescence.",
      allergies: "Sulfa antibiotics (hives)",
      medications: "Oral contraceptive pill, Naproxen 500mg PRN",
      notes: "Triage vitals: BP 118/74, Pulse 76 bpm, Temp 98.4F. Prescribed Zolmitriptan nasal spray."
    },
    {
      name: "Rajesh Sharma",
      age: 64,
      gender: "Male",
      phone: "+1-555-0419",
      symptoms: "Progressive bilateral knee joint pain, morning stiffness lasting 20 minutes, worse after standing.",
      medical_history: "Primary bilateral knee osteoarthritis, controlled hypertension.",
      allergies: "No known drug allergies (NKDA)",
      medications: "Amlodipine 5mg daily, Glucosamine supplement",
      notes: "X-ray shows medial joint space narrowing. Referred to physical rehabilitation therapy."
    }
  ];

  // Pick random sample
  const sample = dummySamples[Math.floor(Math.random() * dummySamples.length)];

  form.querySelector("#name").value = sample.name;
  form.querySelector("#age").value = sample.age;
  form.querySelector("#gender").value = sample.gender;
  form.querySelector("#phone").value = sample.phone;
  form.querySelector("#symptoms").value = sample.symptoms;
  form.querySelector("#medical_history").value = sample.medical_history;
  form.querySelector("#allergies").value = sample.allergies;
  form.querySelector("#medications").value = sample.medications;
  form.querySelector("#notes").value = sample.notes;

  clearValidationMarks(form);
  showToast("Loaded sample test case: " + sample.name, "info");
}

/* ==========================================================================
   DASHBOARD PAGE (dashboard.html)
   ========================================================================== */
function initDashboardPage() {
  const dashboardTable = document.getElementById("patientsTableBody");
  if (!dashboardTable) return;

  // Fetch initial patient cases and metrics
  loadDashboardData();

  // Search Input live handler with debounce
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = e.target.value.trim();
        loadDashboardData(query);
      }, 250);
    });

    const clearSearchBtn = document.getElementById("clearSearchBtn");
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener("click", () => {
        searchInput.value = "";
        loadDashboardData("");
      });
    }
  }

  // Reset Demo Data Button
  const resetDemoBtn = document.getElementById("resetDemoBtn");
  if (resetDemoBtn) {
    resetDemoBtn.addEventListener("click", async () => {
      if (confirm("Restore original dummy patient cases for demonstration?")) {
        try {
          const res = await fetch("/api/reset-demo", { method: "POST" });
          const data = await res.json();
          if (res.ok) {
            showToast(data.message, "success");
            loadDashboardData();
          } else {
            showToast(data.error || "Failed to reset demo data.", "error");
          }
        } catch (err) {
          showToast("Network error while resetting demo data.", "error");
        }
      }
    });
  }

  // Edit Patient Form Submit Handler (Inside Modal)
  const editForm = document.getElementById("editPatientForm");
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validateEntireForm(editForm)) {
        showToast("Please correct the form fields.", "error");
        return;
      }

      const patientId = editForm.dataset.patientId;
      if (!patientId) return;

      const payload = getFormData(editForm);
      const saveBtn = editForm.querySelector("button[type='submit']");
      const originalText = saveBtn.innerHTML;
      saveBtn.disabled = true;
      saveBtn.innerHTML = "Saving...";

      try {
        const response = await fetch(`/patients/${patientId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (response.ok && result.success) {
          showToast(result.message || "Patient updated successfully!", "success");
          closeModal("editModal");
          loadDashboardData();
        } else {
          showToast(result.error || "Failed to update patient.", "error");
        }
      } catch (err) {
        showToast("Network error: Could not update patient.", "error");
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
      }
    });
  }

  // Confirm Delete Button Handler
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async () => {
      if (!pendingDeleteId) return;

      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.innerHTML = "Deleting...";

      try {
        const response = await fetch(`/patients/${pendingDeleteId}`, {
          method: "DELETE"
        });

        const result = await response.json();
        if (response.ok && result.success) {
          showToast(result.message || "Patient case deleted.", "success");
          closeModal("deleteModal");
          pendingDeleteId = null;
          loadDashboardData();
        } else {
          showToast(result.error || "Failed to delete patient case.", "error");
        }
      } catch (err) {
        showToast("Network error: Could not delete patient.", "error");
      } finally {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.innerHTML = "Delete Record";
      }
    });
  }
}

/**
 * Loads patients list and stats from Flask REST APIs.
 */
async function loadDashboardData(searchQuery = "") {
  const tableBody = document.getElementById("patientsTableBody");
  if (!tableBody) return;

  const url = searchQuery ? `/patients?search=${encodeURIComponent(searchQuery)}` : "/patients";

  try {
    const [patientsRes, statsRes] = await Promise.all([
      fetch(url),
      fetch("/api/stats")
    ]);

    const patientsData = await patientsRes.json();
    const statsData = await statsRes.json();

    if (patientsRes.ok && patientsData.success) {
      currentPatients = patientsData.patients;
      renderPatientTable(currentPatients, searchQuery);
    } else {
      showToast(patientsData.error || "Failed to fetch patients list.", "error");
    }

    if (statsRes.ok && statsData.success) {
      updateDashboardStats(statsData, currentPatients);
    }
  } catch (err) {
    console.error("Dashboard load error:", err);
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <h4>Connection Error</h4>
          <p>Could not load patient cases from the backend server. Please check that Flask is running.</p>
        </td>
      </tr>
    `;
  }
}

/**
 * Renders patient rows into the dashboard table.
 */
function renderPatientTable(patients, searchActive = false) {
  const tableBody = document.getElementById("patientsTableBody");
  if (!tableBody) return;

  if (!patients || patients.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <h4>${searchActive ? "No matching patients found" : "No patient cases registered yet"}</h4>
            <p>${searchActive ? "Try adjusting your search query or clear the filter." : "Start by registering a new patient case record."}</p>
            ${!searchActive ? `<a href="/" class="btn btn-primary btn-sm">Take New Case</a>` : ""}
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = patients.map((p) => {
    const formattedDate = formatDate(p.created_at);
    const genderBadgeClass = p.gender === "Female" ? "badge-teal" : p.gender === "Male" ? "badge-blue" : "badge-gray";
    const hasAllergy = p.allergies && !p.allergies.toLowerCase().includes("no known") && p.allergies.toLowerCase() !== "none";

    return `
      <tr data-patient-id="${p.id}">
        <td><strong>#${p.id}</strong></td>
        <td>
          <div class="patient-name-cell">${escapeHtml(p.name)}</div>
          ${hasAllergy ? `<span class="badge badge-amber" title="${escapeHtml(p.allergies)}">⚠️ Allergy Alert</span>` : ""}
        </td>
        <td>
          <span>${p.age} yrs</span> / 
          <span class="badge ${genderBadgeClass}">${escapeHtml(p.gender)}</span>
        </td>
        <td>${escapeHtml(p.phone)}</td>
        <td>
          <div class="patient-symptoms-cell" title="${escapeHtml(p.symptoms)}">
            ${escapeHtml(p.symptoms)}
          </div>
        </td>
        <td><small class="text-muted">${formattedDate}</small></td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="viewPatientDetails(${p.id})" title="View Complete Clinical Case">
              👁 View
            </button>
            <button class="btn btn-secondary btn-sm" onclick="openEditPatientModal(${p.id})" title="Edit Patient Information">
              ✏️ Edit
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="openDeletePatientModal(${p.id}, '${escapeJsString(p.name)}')" title="Delete Patient Record">
              🗑 Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

/**
 * Updates top dashboard stat widgets.
 */
function updateDashboardStats(stats, patientsList) {
  const totalElem = document.getElementById("statTotalPatients");
  if (totalElem) totalElem.textContent = stats.total_patients || 0;

  const avgAgeElem = document.getElementById("statAvgAge");
  if (avgAgeElem) avgAgeElem.textContent = stats.average_age ? `${stats.average_age} yrs` : "N/A";

  const allergyCountElem = document.getElementById("statAllergyCount");
  if (allergyCountElem && patientsList) {
    const count = patientsList.filter(p => 
      p.allergies && 
      !p.allergies.toLowerCase().includes("no known") && 
      p.allergies.toLowerCase() !== "none"
    ).length;
    allergyCountElem.textContent = count;
  }
}

/**
 * Loads preview of recent patients on the Case-Taking index page.
 */
async function loadRecentPatientsPreview() {
  const previewContainer = document.getElementById("recentPatientsList");
  if (!previewContainer) return;

  try {
    const response = await fetch("/patients");
    const data = await response.json();

    if (response.ok && data.success) {
      const recent = data.patients.slice(0, 3);
      if (recent.length === 0) {
        previewContainer.innerHTML = `<p class="text-muted" style="padding: 1rem 0;">No patients registered yet.</p>`;
        return;
      }

      previewContainer.innerHTML = recent.map(p => `
        <div class="card" style="margin-bottom: 0.75rem; padding: 1rem; border: 1px solid var(--border);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
            <div>
              <strong style="color: var(--text-main); font-size: 1rem;">${escapeHtml(p.name)}</strong>
              <span class="text-muted" style="font-size: 0.8rem; margin-left: 0.4rem;">(${p.age} yrs, ${escapeHtml(p.gender)})</span>
            </div>
            <span class="badge badge-blue">Case #${p.id}</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            <strong>Chief Complaint:</strong> ${escapeHtml(p.symptoms)}
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-subtle);">
            <span>📞 ${escapeHtml(p.phone)}</span>
            <span>${formatDate(p.created_at)}</span>
          </div>
        </div>
      `).join("");
    }
  } catch (err) {
    console.error("Error loading recent cases preview:", err);
  }
}

/* ==========================================================================
   VIEW PATIENT DETAILS MODAL
   ========================================================================== */
async function viewPatientDetails(patientId) {
  try {
    const response = await fetch(`/patients/${patientId}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      showToast(data.error || "Could not retrieve patient case details.", "error");
      return;
    }

    const p = data.patient;
    const modalBody = document.getElementById("viewModalBody");
    if (!modalBody) return;

    const formattedDate = formatDate(p.created_at, true);
    const hasAllergy = p.allergies && !p.allergies.toLowerCase().includes("no known") && p.allergies.toLowerCase() !== "none";

    modalBody.innerHTML = `
      <div class="case-sheet-card">
        <div class="case-sheet-header">
          <div class="case-patient-title">
            <h4>${escapeHtml(p.name)}</h4>
            <p>Case File #${p.id} • Registered on ${formattedDate}</p>
          </div>
          <span class="badge badge-blue" style="font-size: 0.85rem; padding: 0.35rem 0.75rem;">
            Clinical Case
          </span>
        </div>

        <div class="case-meta-grid">
          <div class="case-meta-item">
            <span>Age</span>
            <strong>${p.age} years</strong>
          </div>
          <div class="case-meta-item">
            <span>Gender</span>
            <strong>${escapeHtml(p.gender)}</strong>
          </div>
          <div class="case-meta-item">
            <span>Contact Phone</span>
            <strong>${escapeHtml(p.phone)}</strong>
          </div>
          <div class="case-meta-item">
            <span>Record Status</span>
            <strong style="color: var(--teal);">Active Case</strong>
          </div>
        </div>

        <div class="case-section">
          <div class="case-section-label">🩺 1. Main Symptoms / Chief Complaints</div>
          <div class="case-section-box symptoms-highlight">
            ${escapeHtml(p.symptoms)}
          </div>
        </div>

        <div class="case-section">
          <div class="case-section-label">📋 2. Past Medical History</div>
          <div class="case-section-box">
            ${escapeHtml(p.medical_history || "None reported")}
          </div>
        </div>

        <div class="case-section">
          <div class="case-section-label">⚠️ 3. Known Allergies</div>
          <div class="case-section-box ${hasAllergy ? "allergy-alert" : ""}">
            ${escapeHtml(p.allergies || "No known allergies (NKDA)")}
          </div>
        </div>

        <div class="case-section">
          <div class="case-section-label">💊 4. Current Medications</div>
          <div class="case-section-box">
            ${escapeHtml(p.medications || "None")}
          </div>
        </div>

        <div class="case-section">
          <div class="case-section-label">📝 5. Clinical & Additional Notes</div>
          <div class="case-section-box">
            ${escapeHtml(p.notes || "No additional notes")}
          </div>
        </div>
      </div>
    `;

    // Configure Edit button in View Modal footer
    const viewModalEditBtn = document.getElementById("viewModalEditBtn");
    if (viewModalEditBtn) {
      viewModalEditBtn.onclick = () => {
        closeModal("viewModal");
        openEditPatientModal(p.id);
      };
    }

    openModal("viewModal");
  } catch (err) {
    console.error("View modal fetch error:", err);
    showToast("Error retrieving patient details.", "error");
  }
}

/* ==========================================================================
   EDIT PATIENT MODAL
   ========================================================================== */
async function openEditPatientModal(patientId) {
  try {
    const response = await fetch(`/patients/${patientId}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      showToast(data.error || "Failed to load patient data for editing.", "error");
      return;
    }

    const p = data.patient;
    const form = document.getElementById("editPatientForm");
    if (!form) return;

    form.dataset.patientId = p.id;
    form.querySelector("#edit_name").value = p.name;
    form.querySelector("#edit_age").value = p.age;
    form.querySelector("#edit_gender").value = p.gender;
    form.querySelector("#edit_phone").value = p.phone;
    form.querySelector("#edit_symptoms").value = p.symptoms;
    form.querySelector("#edit_medical_history").value = p.medical_history || "";
    form.querySelector("#edit_allergies").value = p.allergies || "";
    form.querySelector("#edit_medications").value = p.medications || "";
    form.querySelector("#edit_notes").value = p.notes || "";

    const titleElem = document.getElementById("editModalTitle");
    if (titleElem) titleElem.textContent = `Edit Patient Case #${p.id} (${p.name})`;

    clearValidationMarks(form);
    openModal("editModal");
  } catch (err) {
    console.error("Error opening edit modal:", err);
    showToast("Error loading patient for edit.", "error");
  }
}

/* ==========================================================================
   DELETE MODAL
   ========================================================================== */
function openDeletePatientModal(patientId, patientName) {
  pendingDeleteId = patientId;
  const msgElem = document.getElementById("deleteModalMessage");
  if (msgElem) {
    msgElem.innerHTML = `Are you sure you want to permanently delete the case record for <strong>${escapeHtml(patientName)}</strong> (Case #${patientId})?<br><small class="text-muted">This action cannot be undone.</small>`;
  }
  openModal("deleteModal");
}

/* ==========================================================================
   MODAL MANAGEMENT
   ========================================================================== */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove("active");
  document.body.style.overflow = "";
}

function initModalListeners() {
  // Close buttons with data-dismiss="modal" or .modal-close-btn
  document.querySelectorAll("[data-dismiss='modal'], .modal-close-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal-overlay");
      if (modal) closeModal(modal.id);
    });
  });

  // Click outside modal container to dismiss
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });

  // ESC key to dismiss active modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const activeModal = document.querySelector(".modal-overlay.active");
      if (activeModal) closeModal(activeModal.id);
    }
  });

  // Print Case Record button handler
  const printCaseBtn = document.getElementById("printCaseBtn");
  if (printCaseBtn) {
    printCaseBtn.addEventListener("click", () => {
      window.print();
    });
  }
}

/* ==========================================================================
   FORM VALIDATION & EXTRACTION HELPERS
   ========================================================================== */
function getFormData(form) {
  const prefix = form.id === "editPatientForm" ? "edit_" : "";
  return {
    name: form.querySelector(`#${prefix}name`).value.trim(),
    age: form.querySelector(`#${prefix}age`).value.trim(),
    gender: form.querySelector(`#${prefix}gender`).value,
    phone: form.querySelector(`#${prefix}phone`).value.trim(),
    symptoms: form.querySelector(`#${prefix}symptoms`).value.trim(),
    medical_history: form.querySelector(`#${prefix}medical_history`).value.trim(),
    allergies: form.querySelector(`#${prefix}allergies`).value.trim(),
    medications: form.querySelector(`#${prefix}medications`).value.trim(),
    notes: form.querySelector(`#${prefix}notes`).value.trim()
  };
}

function validateField(field) {
  const val = field.value.trim();
  const id = field.id.replace("edit_", "");
  let isValid = true;
  let errorMsg = "";

  if (id === "name") {
    if (!val) {
      isValid = false;
      errorMsg = "Patient name is required.";
    } else if (val.length < 2) {
      isValid = false;
      errorMsg = "Name must have at least 2 characters.";
    }
  } else if (id === "age") {
    const ageNum = parseInt(val, 10);
    if (val === "" || isNaN(ageNum)) {
      isValid = false;
      errorMsg = "Valid age is required.";
    } else if (ageNum < 0 || ageNum > 130) {
      isValid = false;
      errorMsg = "Age must be between 0 and 130.";
    }
  } else if (id === "gender") {
    if (!val || val === "") {
      isValid = false;
      errorMsg = "Please select a gender.";
    }
  } else if (id === "phone") {
    const digits = val.replace(/[\s\-\(\)\+]/g, "");
    if (!val) {
      isValid = false;
      errorMsg = "Phone number is required.";
    } else if (digits.length < 7 || digits.length > 16 || !/^\d+$/.test(digits)) {
      isValid = false;
      errorMsg = "Please enter a valid phone number (7-16 digits).";
    }
  } else if (id === "symptoms") {
    if (!val) {
      isValid = false;
      errorMsg = "Main symptoms / chief complaint is required.";
    } else if (val.length < 3) {
      isValid = false;
      errorMsg = "Please describe symptoms (at least 3 characters).";
    }
  }

  // Update UI classes
  const feedbackElem = field.parentElement.querySelector(".invalid-feedback");
  if (!isValid) {
    field.classList.add("is-invalid");
    if (feedbackElem) feedbackElem.textContent = errorMsg;
  } else {
    field.classList.remove("is-invalid");
    if (feedbackElem) feedbackElem.textContent = "";
  }

  return isValid;
}

function validateEntireForm(form) {
  const fields = form.querySelectorAll("input[required], select[required], textarea[required]");
  let allValid = true;
  fields.forEach((f) => {
    const ok = validateField(f);
    if (!ok) allValid = false;
  });
  return allValid;
}

function clearValidationMarks(form) {
  const invalidFields = form.querySelectorAll(".is-invalid");
  invalidFields.forEach(f => f.classList.remove("is-invalid"));
}

/* ==========================================================================
   SANITIZATION & FORMATTING UTILITIES
   ========================================================================== */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeJsString(str) {
  if (!str) return "";
  return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function formatDate(isoString, includeTime = false) {
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {})
    };
    return date.toLocaleDateString(undefined, options);
  } catch {
    return isoString;
  }
}
