const express = require('express');
const router = express.Router();
const { getDb } = require('../../config/database');

// GET all appointments
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const appointments = db.prepare(`
      SELECT a.*, p.name as patient_name, d.name as doctor_name, dep.name as department_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN departments dep ON d.department_id = dep.id
      ORDER BY a.appointment_date DESC
      LIMIT 200
    `).all();
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST book appointment — generates a Pending OPD bill (can be manually marked Paid)
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { patient_id, doctor_id, appointment_date } = req.body;
    if (!patient_id || !doctor_id || !appointment_date) {
      return res.status(400).json({ error: 'patient_id, doctor_id, and appointment_date are required' });
    }
    const result = db.prepare(
      "INSERT INTO appointments (patient_id, doctor_id, appointment_date, status) VALUES (?, ?, ?, 'Scheduled')"
    ).run(patient_id, doctor_id, appointment_date);

    // Auto-generate OPD billing (Pending — user can Mark as Paid from Billing page)
    const doctor = db.prepare("SELECT department_id FROM doctors WHERE id = ?").get(doctor_id);
    const amount = Math.floor(Math.random() * 1800) + 200;
    db.prepare(
      "INSERT INTO billing (patient_id, type, amount, department_id, billing_date, payment_status) VALUES (?, 'OPD', ?, ?, ?, 'Pending')"
    ).run(patient_id, amount, doctor.department_id, appointment_date);

    res.status(201).json({ id: result.lastInsertRowid, message: 'Appointment booked & bill generated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update appointment status — only update the appointment; billing remains pending until explicitly paid
router.patch('/:id', (req, res) => {
  try {
    const db = getDb();
    const { status } = req.body;

    const appointment = db.prepare(
      `SELECT a.*, d.department_id FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.id = ?`
    ).get(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    db.prepare("UPDATE appointments SET status = ? WHERE id = ?").run(status, req.params.id);

    // Do not auto-mark OPD bills as Paid on completion. Payment should be handled explicitly via Billing.
    res.json({ message: `Appointment ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
