const express = require('express');
const router = express.Router();
const { getDb } = require('../../config/database');

// GET all doctors (with department info)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const doctors = db.prepare(`
      SELECT d.*, dep.name as department_name 
      FROM doctors d 
      JOIN departments dep ON d.department_id = dep.id 
      ORDER BY d.name
    `).all();
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all departments
router.get('/departments', (req, res) => {
  try {
    const db = getDb();
    const departments = db.prepare("SELECT * FROM departments ORDER BY name").all();
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
