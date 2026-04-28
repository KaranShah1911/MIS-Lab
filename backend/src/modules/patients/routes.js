const express = require('express');
const router = express.Router();
const { getDb } = require('../../config/database');

// GET all patients (with optional search)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { search } = req.query;
    let patients;
    if (search) {
      patients = db.prepare("SELECT * FROM patients WHERE name LIKE ? ORDER BY id DESC").all(`%${search}%`);
    } else {
      patients = db.prepare("SELECT * FROM patients ORDER BY id DESC LIMIT 100").all();
    }
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single patient
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const patient = db.prepare("SELECT * FROM patients WHERE id = ?").get(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add patient
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { name, age, gender, contact } = req.body;
    if (!name || !age || !gender || !contact) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const result = db.prepare(
      "INSERT INTO patients (name, age, gender, contact) VALUES (?, ?, ?, ?)"
    ).run(name, age, gender, contact);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Patient added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
