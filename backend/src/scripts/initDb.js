const { getDb } = require('../config/database');

function initDatabase() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      department_id INTEGER NOT NULL,
      specialization TEXT NOT NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL CHECK(gender IN ('Male', 'Female', 'Other')),
      contact TEXT NOT NULL,
      registered_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      appointment_date DATETIME NOT NULL,
      status TEXT NOT NULL DEFAULT 'Scheduled' CHECK(status IN ('Scheduled', 'Completed', 'Cancelled')),
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );

    CREATE TABLE IF NOT EXISTS beds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ward_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Available' CHECK(status IN ('Available', 'Occupied')),
      department_id INTEGER NOT NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS admissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      bed_id INTEGER NOT NULL,
      admission_date DATETIME NOT NULL,
      discharge_date DATETIME,
      status TEXT NOT NULL DEFAULT 'Admitted' CHECK(status IN ('Admitted', 'Discharged')),
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (bed_id) REFERENCES beds(id)
    );

    CREATE TABLE IF NOT EXISTS billing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('OPD', 'IPD')),
      amount REAL NOT NULL,
      department_id INTEGER NOT NULL,
      billing_date DATETIME NOT NULL,
      payment_date DATETIME,
      payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK(payment_status IN ('Paid', 'Pending')),
      payment_method TEXT CHECK(payment_method IN ('Cash', 'Card', 'Insurance', NULL)),
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );
  `);

  const billingInfo = db.prepare("PRAGMA table_info('billing')").all();
  if (!billingInfo.some(col => col.name === 'payment_date')) {
    db.prepare("ALTER TABLE billing ADD COLUMN payment_date DATETIME").run();
    console.log('✅ Added missing billing.payment_date column');
  }

  console.log('✅ Database schema initialized successfully.');
}

// Run if called directly
if (require.main === module) {
  initDatabase();
  process.exit(0);
}

module.exports = { initDatabase };
