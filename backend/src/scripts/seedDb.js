const { getDb } = require('../config/database');
const { initDatabase } = require('./initDb');

// ─── Helpers ───────────────────────────────────────────────
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
function formatDateTime(d) {
  return d.toISOString().slice(0, 19).replace('T', ' ');
}
function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

// ─── Data pools ────────────────────────────────────────────
const firstNames = [
  'Aarav','Vivaan','Aditya','Vihaan','Arjun','Sai','Reyansh','Ayaan','Krishna','Ishaan',
  'Ananya','Diya','Myra','Sara','Aadhya','Ira','Aanya','Navya','Avni','Kiara',
  'Rohan','Karan','Nikhil','Priya','Sneha','Pooja','Raj','Amit','Suresh','Meena',
  'Neha','Ravi','Deepak','Sunita','Anjali','Vikram','Gaurav','Sanjay','Rekha','Tanvi',
  'Manish','Pankaj','Swati','Komal','Rahul','Vishal','Akash','Nisha','Kavita','Mohit'
];
const lastNames = [
  'Sharma','Verma','Patel','Gupta','Singh','Kumar','Shah','Joshi','Mehta','Reddy',
  'Nair','Iyer','Chopra','Malhotra','Kapoor','Bansal','Saxena','Agarwal','Mishra','Rao',
  'Das','Chatterjee','Mukherjee','Pillai','Menon','Bhat','Desai','Kulkarni','Patil','Thakur'
];
const departmentList = [
  'Cardiology','Orthopedics','Neurology','Pediatrics','Dermatology',
  'Oncology','ENT','General Medicine','Gynecology','Psychiatry'
];
const specializations = {
  'Cardiology': ['Interventional Cardiologist','Clinical Cardiologist','Electrophysiologist'],
  'Orthopedics': ['Joint Replacement','Sports Medicine','Spine Surgeon'],
  'Neurology': ['Neurophysiologist','Stroke Specialist','Epileptologist'],
  'Pediatrics': ['Neonatologist','Pediatric Surgeon','General Pediatrician'],
  'Dermatology': ['Cosmetic Dermatologist','Clinical Dermatologist','Dermatopathologist'],
  'Oncology': ['Medical Oncologist','Surgical Oncologist','Radiation Oncologist'],
  'ENT': ['Otologist','Rhinologist','Laryngologist'],
  'General Medicine': ['Internal Medicine','Family Medicine','General Practitioner'],
  'Gynecology': ['Obstetrician','Reproductive Medicine','Gynecologic Oncologist'],
  'Psychiatry': ['Clinical Psychiatrist','Child Psychiatrist','Forensic Psychiatrist']
};
const wardTypes = ['General', 'Semi-Private', 'Private', 'ICU'];
const paymentMethods = ['Cash', 'Card', 'Insurance'];

function seedDatabase() {
  const db = getDb();

  // Clear existing data
  db.exec(`
    DELETE FROM billing;
    DELETE FROM admissions;
    DELETE FROM appointments;
    DELETE FROM beds;
    DELETE FROM patients;
    DELETE FROM doctors;
    DELETE FROM departments;
  `);

  // ─── 1. Departments ─────────────────────────────────────
  const insertDept = db.prepare('INSERT INTO departments (name) VALUES (?)');
  const deptIds = {};
  for (const dept of departmentList) {
    const info = insertDept.run(dept);
    deptIds[dept] = info.lastInsertRowid;
  }
  console.log(`✅ Inserted ${departmentList.length} departments`);

  // ─── 2. Doctors (50) ────────────────────────────────────
  const insertDoc = db.prepare('INSERT INTO doctors (name, department_id, specialization) VALUES (?, ?, ?)');
  const doctorIds = [];
  const doctorDepts = {};
  for (let i = 0; i < 50; i++) {
    const dept = departmentList[i % departmentList.length]; // distribute evenly
    const name = `Dr. ${pick(firstNames)} ${pick(lastNames)}`;
    const spec = pick(specializations[dept]);
    const info = insertDoc.run(name, deptIds[dept], spec);
    doctorIds.push(Number(info.lastInsertRowid));
    doctorDepts[Number(info.lastInsertRowid)] = deptIds[dept];
  }
  console.log(`✅ Inserted 50 doctors`);

  // ─── 3. Patients (300) ──────────────────────────────────
  const insertPat = db.prepare('INSERT INTO patients (name, age, gender, contact, registered_at) VALUES (?, ?, ?, ?, ?)');
  const patientIds = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  for (let i = 0; i < 300; i++) {
    const gender = Math.random() < 0.48 ? 'Male' : (Math.random() < 0.96 ? 'Female' : 'Other');
    const name = `${pick(firstNames)} ${pick(lastNames)}`;
    const age = rand(1, 90);
    const contact = `9${rand(100000000, 999999999)}`;
    const regDate = formatDateTime(randomDate(sixMonthsAgo, now));
    const info = insertPat.run(name, age, gender, contact, regDate);
    patientIds.push(Number(info.lastInsertRowid));
  }
  console.log(`✅ Inserted 300 patients`);

  // ─── 4. Beds (100) ──────────────────────────────────────
  const insertBed = db.prepare('INSERT INTO beds (ward_type, status, department_id) VALUES (?, ?, ?)');
  const bedIds = [];
  for (let i = 0; i < 100; i++) {
    const dept = pick(departmentList);
    const ward = pick(wardTypes);
    // Start all as Available; admissions will update status
    const info = insertBed.run(ward, 'Available', deptIds[dept]);
    bedIds.push(Number(info.lastInsertRowid));
  }
  console.log(`✅ Inserted 100 beds`);

  // ─── 5. Appointments (1200) with Peak Hours Logic ───────
  const insertAppt = db.prepare('INSERT INTO appointments (patient_id, doctor_id, appointment_date, status) VALUES (?, ?, ?, ?)');
  const appointmentData = []; // store for billing

  for (let i = 0; i < 1200; i++) {
    const patId = pick(patientIds);
    const docId = pick(doctorIds);
    const apptDate = randomDate(sixMonthsAgo, now);

    // Peak hours logic: 70% of appointments between 9 AM – 1 PM
    let hour;
    if (Math.random() < 0.7) {
      hour = rand(9, 13); // 9 AM to 1 PM
    } else {
      // off-peak: 8 AM or 2-5 PM
      hour = pick([8, 14, 15, 16, 17]);
    }
    apptDate.setHours(hour, rand(0, 59), rand(0, 59));

    // Weekdays > Weekends: 80% weekdays
    const day = apptDate.getDay();
    if (day === 0 || day === 6) {
      if (Math.random() < 0.6) {
        // shift to a weekday
        apptDate.setDate(apptDate.getDate() + (day === 0 ? 1 : 2));
      }
    }

    const status = Math.random() < 0.85 ? 'Completed' : (Math.random() < 0.5 ? 'Scheduled' : 'Cancelled');
    insertAppt.run(patId, docId, formatDateTime(apptDate), status);
    appointmentData.push({ patientId: patId, doctorId: docId, date: apptDate, status });
  }
  console.log(`✅ Inserted 1200 appointments`);

  // ─── 6. Admissions (250) ────────────────────────────────
  const insertAdm = db.prepare('INSERT INTO admissions (patient_id, bed_id, admission_date, discharge_date, status) VALUES (?, ?, ?, ?, ?)');
  const updateBed = db.prepare('UPDATE beds SET status = ? WHERE id = ?');
  const admissionData = [];
  const usedBeds = new Set();

  for (let i = 0; i < 250; i++) {
    const patId = pick(patientIds);
    let bedId;
    // Try to pick a unique bed first, then allow reuse for historical
    do {
      bedId = pick(bedIds);
    } while (usedBeds.has(bedId) && usedBeds.size < bedIds.length);

    const admDate = randomDate(sixMonthsAgo, now);
    const stayDays = rand(1, 14);
    const dischDate = new Date(admDate);
    dischDate.setDate(dischDate.getDate() + stayDays);

    // 80% discharged, 20% still admitted
    const isActive = i >= 230; // last 20 are active admissions
    const status = isActive ? 'Admitted' : 'Discharged';
    const finalDischargeDate = isActive ? null : formatDateTime(dischDate);

    if (isActive) {
      usedBeds.add(bedId);
      updateBed.run('Occupied', bedId);
    }

    insertAdm.run(patId, bedId, formatDateTime(admDate), finalDischargeDate, status);
    admissionData.push({
      patientId: patId,
      bedId,
      date: admDate,
      dischargeDate: isActive ? null : dischDate,
      status
    });
  }
  console.log(`✅ Inserted 250 admissions (20 active)`);

  // ─── 7. Billing ─────────────────────────────────────────
  const insertBill = db.prepare('INSERT INTO billing (patient_id, type, amount, department_id, billing_date, payment_status, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?)');
  let billCount = 0;

  // OPD billing (for completed appointments)
  for (const appt of appointmentData) {
    if (appt.status !== 'Completed') continue;
    const amount = rand(200, 2000); // ₹200 – ₹2000 for OPD
    const isPaid = Math.random() < 0.7; // 70% paid
    const method = isPaid ? pick(paymentMethods) : null;
    const deptId = doctorDepts[appt.doctorId];
    insertBill.run(appt.patientId, 'OPD', amount, deptId, formatDateTime(appt.date), isPaid ? 'Paid' : 'Pending', method);
    billCount++;
  }

  // IPD billing (for discharged admissions)
  for (const adm of admissionData) {
    const amount = rand(5000, 100000); // ₹5000 – ₹100000 for IPD
    const isPaid = adm.status === 'Discharged' ? Math.random() < 0.75 : false;
    const method = isPaid ? pick(paymentMethods) : null;
    const deptId = pick(Object.values(deptIds));
    const billDate = adm.dischargeDate || adm.date;
    insertBill.run(adm.patientId, 'IPD', amount, deptId, formatDateTime(billDate), isPaid ? 'Paid' : 'Pending', method);
    billCount++;
  }

  console.log(`✅ Inserted ${billCount} billing records`);
  console.log('\n🎉 Database seeded successfully!');
}

// Run
initDatabase();
seedDatabase();
process.exit(0);
