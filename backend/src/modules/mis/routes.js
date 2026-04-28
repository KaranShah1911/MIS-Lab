const express = require('express');
const router = express.Router();
const { getDb } = require('../../config/database');

// ─── Helper: Build date filter clause ─────────────────────
function dateFilter(column, from, to) {
  const clauses = [];
  const params = [];
  if (from) { clauses.push(`${column} >= ?`); params.push(from); }
  if (to) { clauses.push(`${column} <= ?`); params.push(to + ' 23:59:59'); }
  return { where: clauses.length ? ' AND ' + clauses.join(' AND ') : '', params };
}

// ═══════════════════════════════════════════════════════════
// GET /api/mis/kpis
// ═══════════════════════════════════════════════════════════
router.get('/kpis', (req, res) => {
  try {
    const db = getDb();
    const { from, to } = req.query;
    const paymentFilter = dateFilter('payment_date', from, to);
    const billingFilter = dateFilter('billing_date', from, to);

    const totalPatients = db.prepare("SELECT COUNT(*) as count FROM patients").get().count;
    
    const revenueCollected = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total FROM billing WHERE payment_status = 'Paid' ${paymentFilter.where}`
    ).get(...paymentFilter.params).total;

    const revenuePending = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total FROM billing WHERE payment_status = 'Pending' ${billingFilter.where}`
    ).get(...billingFilter.params).total;

    const revenueGenerated = revenueCollected + revenuePending;

    const totalBeds = db.prepare("SELECT COUNT(*) as count FROM beds").get().count;
    const occupiedBeds = db.prepare(
      "SELECT COUNT(*) as count FROM admissions WHERE discharge_date IS NULL AND status = 'Admitted'"
    ).get().count;
    const bedOccupancy = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const avgStay = db.prepare(`
      SELECT COALESCE(AVG(julianday(discharge_date) - julianday(admission_date)), 0) as avg_days
      FROM admissions WHERE status = 'Discharged'
    `).get().avg_days;

    res.json({
      totalPatients,
      revenueGenerated: Math.round(revenueGenerated),
      revenueCollected: Math.round(revenueCollected),
      revenuePending: Math.round(revenuePending),
      bedOccupancy,
      occupiedBeds,
      totalBeds,
      avgStayDuration: Math.round(avgStay * 10) / 10
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/mis/patient-stats
// ═══════════════════════════════════════════════════════════
router.get('/patient-stats', (req, res) => {
  try {
    const db = getDb();
    const { from, to } = req.query;

    // Monthly patient registration trends
    const pf = dateFilter('registered_at', from, to);
    const monthlyTrends = db.prepare(`
      SELECT strftime('%Y-%m', registered_at) as month, COUNT(*) as count
      FROM patients WHERE 1=1 ${pf.where}
      GROUP BY month ORDER BY month
    `).all(...pf.params);

    // Daily trends (respects date filter, or defaults to last 30 days)
    const df = dateFilter('registered_at', from, to);
    const dailyTrends = db.prepare(`
      SELECT strftime('%Y-%m-%d', registered_at) as day, COUNT(*) as count
      FROM patients 
      WHERE ${from ? '1=1' : "registered_at >= date('now', '-30 days')"} ${df.where}
      GROUP BY day ORDER BY day
    `).all(...df.params);

    // OPD vs IPD count (filtered)
    const af = dateFilter('appointment_date', from, to);
    const adf = dateFilter('admission_date', from, to);
    const opdCount = db.prepare(`SELECT COUNT(*) as count FROM appointments WHERE 1=1 ${af.where}`).get(...af.params).count;
    const ipdCount = db.prepare(`SELECT COUNT(*) as count FROM admissions WHERE 1=1 ${adf.where}`).get(...adf.params).count;

    // Age distribution
    const ageGroups = db.prepare(`
      SELECT 
        CASE 
          WHEN age <= 12 THEN '0-12'
          WHEN age <= 25 THEN '13-25'
          WHEN age <= 40 THEN '26-40'
          WHEN age <= 60 THEN '41-60'
          ELSE '60+'
        END as age_group,
        COUNT(*) as count
      FROM patients GROUP BY age_group ORDER BY age_group
    `).all();

    // Gender distribution
    const genderDist = db.prepare(`
      SELECT gender, COUNT(*) as count FROM patients GROUP BY gender
    `).all();

    res.json({ monthlyTrends, dailyTrends, opdVsIpd: { opd: opdCount, ipd: ipdCount }, ageGroups, genderDist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/mis/doctor-performance
// ═══════════════════════════════════════════════════════════
router.get('/doctor-performance', (req, res) => {
  try {
    const db = getDb();
    const { from, to } = req.query;
    const af = dateFilter('appointment_date', from, to);
    const pf = dateFilter('payment_date', from, to);

    // Patients per doctor (top 15)
    const patientsPerDoctor = db.prepare(`
      SELECT d.name, dep.name as department, COUNT(a.id) as patient_count
      FROM doctors d
      LEFT JOIN appointments a ON d.id = a.doctor_id
      JOIN departments dep ON d.department_id = dep.id
      WHERE 1=1 ${af.where}
      GROUP BY d.id
      ORDER BY patient_count DESC
      LIMIT 15
    `).all(...af.params);

    // Revenue per doctor (top 15) — only paid revenue by payment date
    const revenuePerDoctor = db.prepare(`
      SELECT d.name, COALESCE(SUM(b.amount), 0) as revenue
      FROM doctors d
      LEFT JOIN appointments a ON d.id = a.doctor_id
      LEFT JOIN billing b ON b.patient_id = a.patient_id AND b.type = 'OPD' AND b.payment_status = 'Paid'
      WHERE 1=1 ${pf.where}
      GROUP BY d.id
      ORDER BY revenue DESC
      LIMIT 15
    `).all(...pf.params);

    // Utilization rate
    const maxAppts = db.prepare(`
      SELECT MAX(cnt) as max_count FROM (
        SELECT COUNT(*) as cnt FROM appointments WHERE 1=1 ${af.where} GROUP BY doctor_id
      )
    `).get(...af.params);
    const maxCount = maxAppts?.max_count || 1;

    const utilization = db.prepare(`
      SELECT d.name, COUNT(a.id) as appts,
        ROUND(CAST(COUNT(a.id) AS REAL) / ? * 100, 1) as utilization_rate
      FROM doctors d
      LEFT JOIN appointments a ON d.id = a.doctor_id
      WHERE 1=1 ${af.where}
      GROUP BY d.id
      ORDER BY utilization_rate DESC
      LIMIT 15
    `).all(maxCount, ...af.params);

    res.json({ patientsPerDoctor, revenuePerDoctor, utilization });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/mis/revenue
// ═══════════════════════════════════════════════════════════
router.get('/revenue', (req, res) => {
  try {
    const db = getDb();
    const { from, to } = req.query;
  const pf = dateFilter('payment_date', from, to);

  // Monthly revenue trends (recorded on payment date)
  const monthlyRevenue = db.prepare(`
    SELECT strftime('%Y-%m', payment_date) as month, SUM(amount) as revenue
    FROM billing WHERE payment_status = 'Paid' ${pf.where}
    GROUP BY month ORDER BY month
  `).all(...pf.params);

  // OPD vs IPD revenue (paid only)
  const revenueByType = db.prepare(`
    SELECT type, SUM(amount) as revenue
    FROM billing WHERE payment_status = 'Paid' ${pf.where}
    GROUP BY type
  `).all(...pf.params);

  // Top earning departments (paid only)
  const revenueByDept = db.prepare(`
    SELECT dep.name as department, SUM(b.amount) as revenue
    FROM billing b
    JOIN departments dep ON b.department_id = dep.id
    WHERE b.payment_status = 'Paid' ${pf.where}
    GROUP BY dep.name
    ORDER BY revenue DESC
  `).all(...pf.params);
    res.json({ monthlyRevenue, revenueByType, revenueByDept });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/mis/payment-summary
// ═══════════════════════════════════════════════════════════
router.get('/payment-summary', (req, res) => {
  try {
    const db = getDb();
    const { from, to } = req.query;
    const paidFilter = dateFilter('payment_date', from, to);
    const pendingFilter = dateFilter('billing_date', from, to);

    // Paid vs Pending (use payment_date for Paid bills, billing_date for Pending bills)
    const paidVsPending = [];
    const paidRow = db.prepare(`
      SELECT 'Paid' as payment_status, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
      FROM billing WHERE payment_status = 'Paid' ${paidFilter.where}
    `).get(...paidFilter.params);
    const pendingRow = db.prepare(`
      SELECT 'Pending' as payment_status, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
      FROM billing WHERE payment_status = 'Pending' ${pendingFilter.where}
    `).get(...pendingFilter.params);
    paidVsPending.push(paidRow, pendingRow);

    // Payment method distribution
    const methodDist = db.prepare(`
      SELECT payment_method, SUM(amount) as total, COUNT(*) as count
      FROM billing WHERE payment_status = 'Paid' AND payment_method IS NOT NULL ${paidFilter.where}
      GROUP BY payment_method
    `).all(...paidFilter.params);

    res.json({ paidVsPending, methodDist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/mis/occupancy
// ═══════════════════════════════════════════════════════════
router.get('/occupancy', (req, res) => {
  try {
    const db = getDb();
    const { from, to } = req.query;
    const adf = dateFilter('admission_date', from, to);
    const ddf = dateFilter('discharge_date', from, to);

    // Current bed status summary
    const bedStatus = db.prepare(`
      SELECT status, COUNT(*) as count FROM beds GROUP BY status
    `).all();

    // Ward-wise occupancy
    const wardOccupancy = db.prepare(`
      SELECT ward_type, status, COUNT(*) as count 
      FROM beds GROUP BY ward_type, status
    `).all();

    // Monthly admission vs discharge trends (filtered)
    const admissionTrends = db.prepare(`
      SELECT strftime('%Y-%m', admission_date) as month, COUNT(*) as admissions
      FROM admissions WHERE 1=1 ${adf.where} GROUP BY month ORDER BY month
    `).all(...adf.params);
    const dischargeTrends = db.prepare(`
      SELECT strftime('%Y-%m', discharge_date) as month, COUNT(*) as discharges
      FROM admissions WHERE status = 'Discharged' ${ddf.where} GROUP BY month ORDER BY month
    `).all(...ddf.params);

    // Department-wise patient load
    const deptLoad = db.prepare(`
      SELECT dep.name as department, COUNT(ad.id) as active_patients
      FROM admissions ad
      JOIN beds b ON ad.bed_id = b.id
      JOIN departments dep ON b.department_id = dep.id
      WHERE ad.status = 'Admitted'
      GROUP BY dep.name
      ORDER BY active_patients DESC
    `).all();

    res.json({ bedStatus, wardOccupancy, admissionTrends, dischargeTrends, deptLoad });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/mis/peak-hours
// ═══════════════════════════════════════════════════════════
router.get('/peak-hours', (req, res) => {
  try {
    const db = getDb();
    const { from, to } = req.query;
    const af = dateFilter('appointment_date', from, to);

    const peakHours = db.prepare(`
      SELECT 
        CAST(strftime('%H', appointment_date) AS INTEGER) as hour,
        COUNT(*) as patient_count
      FROM appointments
      WHERE 1=1 ${af.where}
      GROUP BY hour
      ORDER BY hour
    `).all(...af.params);

    res.json(peakHours);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/mis/insights  (DSS + Expert System)
// ═══════════════════════════════════════════════════════════
router.get('/insights', (req, res) => {
  try {
    const db = getDb();
    const insights = [];
    const alerts = [];

    // ─── DSS INSIGHTS ──────────────────────────────────────

    // 1. Patient inflow comparison (this week vs last week)
    const thisWeek = db.prepare(`
      SELECT COUNT(*) as count FROM patients 
      WHERE registered_at >= date('now', '-7 days')
    `).get().count;
    const lastWeek = db.prepare(`
      SELECT COUNT(*) as count FROM patients 
      WHERE registered_at >= date('now', '-14 days') AND registered_at < date('now', '-7 days')
    `).get().count;

    if (lastWeek > 0) {
      const change = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
      insights.push({
        type: change >= 0 ? 'positive' : 'negative',
        icon: change >= 0 ? '📈' : '📉',
        message: `Patient inflow ${change >= 0 ? 'increased' : 'decreased'} by ${Math.abs(change)}% this week (${thisWeek} vs ${lastWeek})`
      });
    }

    // 2. Revenue comparison (this month vs last month)
    const thisMonthRev = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM billing 
      WHERE payment_status = 'Paid' AND payment_date >= date('now', 'start of month')
    `).get().total;
    const lastMonthRev = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM billing 
      WHERE payment_status = 'Paid' AND payment_date >= date('now', 'start of month', '-1 month') 
      AND payment_date < date('now', 'start of month')
    `).get().total;

    if (lastMonthRev > 0) {
      const revChange = Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100);
      insights.push({
        type: revChange >= 0 ? 'positive' : 'negative',
        icon: revChange >= 0 ? '💰' : '⚠️',
        message: `Revenue ${revChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(revChange)}% this month`
      });
    }

    // 3. Pending revenue
    const pending = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM billing WHERE payment_status = 'Pending'").get().total;
    if (pending > 0) {
      insights.push({
        type: 'warning',
        icon: '💳',
        message: `₹${Math.round(pending).toLocaleString('en-IN')} amount is pending collection`
      });
    }

    // 4. Department load analysis
    const deptLoads = db.prepare(`
      SELECT dep.name, COUNT(a.id) as load
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN departments dep ON d.department_id = dep.id
      WHERE a.appointment_date >= date('now', '-30 days')
      GROUP BY dep.name
      ORDER BY load DESC
    `).all();
    const avgLoad = deptLoads.reduce((s, d) => s + d.load, 0) / (deptLoads.length || 1);
    const overloaded = deptLoads.filter(d => d.load > avgLoad * 1.3);
    for (const dept of overloaded) {
      insights.push({
        type: 'warning',
        icon: '🏥',
        message: `${dept.name} is overloaded (${Math.round(((dept.load - avgLoad) / avgLoad) * 100)}% above average)`
      });
    }

    // 5. Top doctor
    const topDoc = db.prepare(`
      SELECT d.name, COUNT(a.id) as count
      FROM doctors d
      JOIN appointments a ON d.id = a.doctor_id
      WHERE a.appointment_date >= date('now', '-30 days')
      GROUP BY d.id ORDER BY count DESC LIMIT 1
    `).get();
    if (topDoc) {
      insights.push({
        type: 'positive',
        icon: '👨‍⚕️',
        message: `${topDoc.name} has the highest utilization (${topDoc.count} patients this month)`
      });
    }

    // 6. Peak hours insight
    const peakHour = db.prepare(`
      SELECT CAST(strftime('%H', appointment_date) AS INTEGER) as hour, COUNT(*) as cnt
      FROM appointments GROUP BY hour ORDER BY cnt DESC LIMIT 1
    `).get();
    if (peakHour) {
      insights.push({
        type: 'info',
        icon: '⏰',
        message: `Peak patient inflow occurs at ${peakHour.hour}:00 (${peakHour.cnt} appointments)`
      });
    }

    // ─── EXPERT SYSTEM ALERTS ──────────────────────────────

    // Rule 1: Bed occupancy > 85%
    const totalBeds = db.prepare("SELECT COUNT(*) as count FROM beds").get().count;
    const occupiedBeds = db.prepare("SELECT COUNT(*) as count FROM beds WHERE status = 'Occupied'").get().count;
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
    if (occupancyRate > 85) {
      alerts.push({ severity: 'critical', icon: '🚨', message: `Critical: Bed occupancy at ${Math.round(occupancyRate)}%! Exceeds 85% threshold.` });
    } else if (occupancyRate > 70) {
      alerts.push({ severity: 'warning', icon: '⚠️', message: `Warning: Bed occupancy at ${Math.round(occupancyRate)}%. Approaching capacity.` });
    }

    // Rule 2: Revenue drop
    if (lastMonthRev > 0 && thisMonthRev < lastMonthRev) {
      alerts.push({ severity: 'warning', icon: '📉', message: `Warning: Revenue declined by ${Math.round(((lastMonthRev - thisMonthRev) / lastMonthRev) * 100)}% compared to last month.` });
    }

    // Rule 3: High pending payments
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM billing").get().total;
    if (totalRevenue > 0 && (pending / totalRevenue) > 0.3) {
      alerts.push({ severity: 'warning', icon: '💸', message: `High pending revenue: ${Math.round((pending / totalRevenue) * 100)}% of total revenue is uncollected.` });
    }

    // Rule 4: Patient surge
    const todayPatients = db.prepare(`
      SELECT COUNT(*) as count FROM appointments 
      WHERE date(appointment_date) = date('now')
    `).get().count;
    const avgDaily = db.prepare(`
      SELECT COALESCE(AVG(cnt), 0) as avg FROM (
        SELECT COUNT(*) as cnt FROM appointments 
        WHERE appointment_date >= date('now', '-30 days')
        GROUP BY date(appointment_date)
      )
    `).get().avg;
    if (avgDaily > 0 && todayPatients > avgDaily * 1.5) {
      alerts.push({ severity: 'critical', icon: '🏃', message: `Overcapacity Warning: Today's patient volume (${todayPatients}) exceeds daily average by ${Math.round(((todayPatients - avgDaily) / avgDaily) * 100)}%.` });
    }

    // Rule 5: Peak hour staffing
    const peakHourData = db.prepare(`
      SELECT CAST(strftime('%H', appointment_date) AS INTEGER) as hour, COUNT(*) as cnt
      FROM appointments 
      WHERE appointment_date >= date('now', '-7 days')
      GROUP BY hour ORDER BY cnt DESC LIMIT 1
    `).get();
    if (peakHourData && peakHourData.cnt > 20) {
      alerts.push({ severity: 'info', icon: '👥', message: `Staffing Alert: Peak hour ${peakHourData.hour}:00 had ${peakHourData.cnt} patients this week. Consider additional staffing.` });
    }

    res.json({ insights, alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
