/**
 * cleanupFutureDates.js — Remove all entries dated after 2026-04-28
 */
const { getDb } = require('../config/database');

const db = getDb();
const cutoff = '2026-04-28 23:59:59';

console.log('--- Before cleanup ---');
console.log('Appointments after cutoff:', db.prepare("SELECT COUNT(*) as c FROM appointments WHERE appointment_date > ?").get(cutoff).c);
console.log('Admissions after cutoff:', db.prepare("SELECT COUNT(*) as c FROM admissions WHERE admission_date > ?").get(cutoff).c);
console.log('Billing after cutoff:', db.prepare("SELECT COUNT(*) as c FROM billing WHERE billing_date > ?").get(cutoff).c);
console.log('Patients after cutoff:', db.prepare("SELECT COUNT(*) as c FROM patients WHERE registered_at > ?").get(cutoff).c);

// Delete in correct order (foreign key safety)
const billingDel = db.prepare("DELETE FROM billing WHERE billing_date > ?").run(cutoff);
console.log(`\nDeleted ${billingDel.changes} billing records`);

// Free beds for deleted admissions
const futureAdmissions = db.prepare("SELECT bed_id FROM admissions WHERE admission_date > ? AND status = 'Admitted'").all(cutoff);
for (const a of futureAdmissions) {
  db.prepare("UPDATE beds SET status = 'Available' WHERE id = ?").run(a.bed_id);
}
const admissionDel = db.prepare("DELETE FROM admissions WHERE admission_date > ?").run(cutoff);
console.log(`Deleted ${admissionDel.changes} admissions (freed ${futureAdmissions.length} beds)`);

const apptDel = db.prepare("DELETE FROM appointments WHERE appointment_date > ?").run(cutoff);
console.log(`Deleted ${apptDel.changes} appointments`);

const patientDel = db.prepare("DELETE FROM patients WHERE registered_at > ?").run(cutoff);
console.log(`Deleted ${patientDel.changes} patients`);

console.log('\n--- After cleanup ---');
console.log('Total appointments:', db.prepare("SELECT COUNT(*) as c FROM appointments").get().c);
console.log('Total admissions:', db.prepare("SELECT COUNT(*) as c FROM admissions").get().c);
console.log('Total billing:', db.prepare("SELECT COUNT(*) as c FROM billing").get().c);
console.log('Total patients:', db.prepare("SELECT COUNT(*) as c FROM patients").get().c);
console.log('\nDone ✅');
