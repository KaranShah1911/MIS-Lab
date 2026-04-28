const express = require('express');
const router = express.Router();
const { getDb } = require('../../config/database');

// GET all admissions
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const admissions = db.prepare(`
      SELECT ad.*, p.name as patient_name, b.ward_type, dep.name as department_name
      FROM admissions ad
      JOIN patients p ON ad.patient_id = p.id
      JOIN beds b ON ad.bed_id = b.id
      JOIN departments dep ON b.department_id = dep.id
      ORDER BY ad.admission_date DESC
      LIMIT 200
    `).all();
    res.json(admissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET available beds
router.get('/beds', (req, res) => {
  try {
    const db = getDb();
    const beds = db.prepare(`
      SELECT b.*, dep.name as department_name 
      FROM beds b 
      JOIN departments dep ON b.department_id = dep.id
      WHERE b.status = 'Available'
      ORDER BY b.id
    `).all();
    res.json(beds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST admit patient
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { patient_id, bed_id } = req.body;
    if (!patient_id || !bed_id) {
      return res.status(400).json({ error: 'patient_id and bed_id are required' });
    }

    // Check bed availability
    const bed = db.prepare("SELECT * FROM beds WHERE id = ? AND status = 'Available'").get(bed_id);
    if (!bed) return res.status(400).json({ error: 'Bed not available' });

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const result = db.prepare(
      "INSERT INTO admissions (patient_id, bed_id, admission_date, status) VALUES (?, ?, ?, 'Admitted')"
    ).run(patient_id, bed_id, now);

    // Mark bed as occupied
    db.prepare("UPDATE beds SET status = 'Occupied' WHERE id = ?").run(bed_id);

    res.status(201).json({ id: result.lastInsertRowid, message: 'Patient admitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH discharge patient
router.patch('/:id/discharge', (req, res) => {
  try {
    const db = getDb();
    const admission = db.prepare("SELECT * FROM admissions WHERE id = ? AND status = 'Admitted'").get(req.params.id);
    if (!admission) return res.status(404).json({ error: 'Active admission not found' });

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    db.prepare("UPDATE admissions SET status = 'Discharged', discharge_date = ? WHERE id = ?").run(now, req.params.id);
    db.prepare("UPDATE beds SET status = 'Available' WHERE id = ?").run(admission.bed_id);

    // Generate IPD bill on discharge (Pending — can be marked Paid from Billing page)
    const bed = db.prepare("SELECT department_id FROM beds WHERE id = ?").get(admission.bed_id);
    const amount = Math.floor(Math.random() * 95000) + 5000;
    db.prepare(
      "INSERT INTO billing (patient_id, type, amount, department_id, billing_date, payment_status) VALUES (?, 'IPD', ?, ?, ?, 'Pending')"
    ).run(admission.patient_id, amount, bed.department_id, now);

    res.json({ message: 'Patient discharged & bill generated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
