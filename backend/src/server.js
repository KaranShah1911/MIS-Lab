const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./scripts/initDb');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database on startup
initDatabase();

// ─── HIS Module Routes (Operational) ──────────────────────
app.use('/api/patients', require('./modules/patients/routes'));
app.use('/api/doctors', require('./modules/doctors/routes'));
app.use('/api/opd', require('./modules/opd/routes'));
app.use('/api/ipd', require('./modules/ipd/routes'));
app.use('/api/billing', require('./modules/billing/routes'));

// ─── MIS Module Routes (Analytics) ───────────────────────
app.use('/api/mis', require('./modules/mis/routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🏥 HIS Backend running on http://localhost:${PORT}`);
  console.log(`📊 MIS APIs available at http://localhost:${PORT}/api/mis`);
  console.log(`🔌 Health check: http://localhost:${PORT}/api/health\n`);
});
