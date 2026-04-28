const express = require('express');
const router = express.Router();
const { getDb } = require('../../config/database');

// GET all bills
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const bills = db.prepare(`
      SELECT b.*, p.name as patient_name, dep.name as department_name
      FROM billing b
      JOIN patients p ON b.patient_id = p.id
      JOIN departments dep ON b.department_id = dep.id
      ORDER BY b.billing_date DESC
      LIMIT 200
    `).all();
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH mark bill as paid
router.patch('/:id/pay', (req, res) => {
  try {
    const db = getDb();
    const { payment_method } = req.body;
    if (!payment_method) {
      return res.status(400).json({ error: 'payment_method is required (Cash, Card, Insurance)' });
    }
    const bill = db.prepare("SELECT * FROM billing WHERE id = ? AND payment_status = 'Pending'").get(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Pending bill not found' });

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    db.prepare("UPDATE billing SET payment_status = 'Paid', payment_method = ?, payment_date = ? WHERE id = ?").run(payment_method, now, req.params.id);
    res.json({ message: 'Bill marked as paid' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
