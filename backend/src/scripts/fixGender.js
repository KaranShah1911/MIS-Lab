/**
 * fixGender.js — Smart Gender Data Correction Script
 * 
 * Uses a dictionary of ~100 common Indian first names to intelligently
 * fix incorrect gender values in the patients table.
 * 
 * Usage:  node backend/src/scripts/fixGender.js
 * Safety: Only updates records where the first-name matches AND the
 *         current gender value is different. Skips unknown names.
 */

const { getDb } = require('../config/database');

// ─── Name → Gender Dictionary (100+ entries) ───────────────
const genderMap = {
  // Male names
  aarav: 'Male', aditya: 'Male', ajay: 'Male', akash: 'Male', akshat: 'Male',
  aman: 'Male', amit: 'Male', amol: 'Male', anand: 'Male', aniket: 'Male',
  anil: 'Male', ankit: 'Male', arjun: 'Male', arun: 'Male', ashish: 'Male',
  ashok: 'Male', bharat: 'Male', chirag: 'Male', darshan: 'Male', deepak: 'Male',
  dhruv: 'Male', dinesh: 'Male', gaurav: 'Male', girish: 'Male', gopal: 'Male',
  harsh: 'Male', hemant: 'Male', hitesh: 'Male', ishaan: 'Male', jatin: 'Male',
  jay: 'Male', karan: 'Male', kartik: 'Male', kunal: 'Male', lalit: 'Male',
  lokesh: 'Male', mahesh: 'Male', manish: 'Male', manoj: 'Male', mayank: 'Male',
  mohit: 'Male', mukesh: 'Male', naman: 'Male', naveen: 'Male', nikhil: 'Male',
  nitin: 'Male', pankaj: 'Male', paresh: 'Male', piyush: 'Male', pradeep: 'Male',
  pranav: 'Male', pratik: 'Male', raj: 'Male', rajat: 'Male', rajesh: 'Male',
  rakesh: 'Male', ram: 'Male', raman: 'Male', ravi: 'Male', rohit: 'Male',
  sachin: 'Male', sahil: 'Male', sanjay: 'Male', saurabh: 'Male', shivam: 'Male',
  shyam: 'Male', sunil: 'Male', suresh: 'Male', tarun: 'Male', tushar: 'Male',
  umesh: 'Male', varun: 'Male', vijay: 'Male', vikram: 'Male', vinay: 'Male',
  vishal: 'Male', vivek: 'Male', yash: 'Male', yogesh: 'Male', rahul: 'Male',

  // Female names
  aanya: 'Female', aadhya: 'Female', aditi: 'Female', alia: 'Female', amisha: 'Female',
  anjali: 'Female', ananya: 'Female', ankita: 'Female', anu: 'Female', aparna: 'Female',
  archana: 'Female', avni: 'Female', bhavna: 'Female', chitra: 'Female', deepa: 'Female',
  disha: 'Female', divya: 'Female', ekta: 'Female', gauri: 'Female', gita: 'Female',
  heena: 'Female', isha: 'Female', jaya: 'Female', juhi: 'Female', kajal: 'Female',
  kavita: 'Female', kiran: 'Female', komal: 'Female', kriti: 'Female', lata: 'Female',
  madhuri: 'Female', mamta: 'Female', meera: 'Female', megha: 'Female', mira: 'Female',
  monika: 'Female', nandini: 'Female', neha: 'Female', nikita: 'Female', nisha: 'Female',
  pallavi: 'Female', pooja: 'Female', preeti: 'Female', priya: 'Female', radha: 'Female',
  rashmi: 'Female', ritu: 'Female', riya: 'Female', sakshi: 'Female', sangeeta: 'Female',
  sapna: 'Female', sarita: 'Female', seema: 'Female', shikha: 'Female', shilpa: 'Female',
  shreya: 'Female', simran: 'Female', sneha: 'Female', sonal: 'Female', sonali: 'Female',
  srishti: 'Female', sunita: 'Female', surbhi: 'Female', swati: 'Female', tanvi: 'Female',
  tanya: 'Female', uma: 'Female', vaishali: 'Female', vandana: 'Female', varsha: 'Female',
  vidya: 'Female', vrinda: 'Female',
};

// ─── Main ───────────────────────────────────────────────────
function fixGenders() {
  const db = getDb();
  const patients = db.prepare('SELECT id, name, gender FROM patients').all();

  let updated = 0;
  let skipped = 0;
  let unchanged = 0;

  const updateStmt = db.prepare('UPDATE patients SET gender = ? WHERE id = ?');

  for (const p of patients) {
    const firstName = p.name.split(' ')[0].toLowerCase().replace(/^dr\.?\s*/i, '');
    const correctGender = genderMap[firstName];

    if (!correctGender) {
      skipped++;
      continue;
    }

    if (p.gender !== correctGender) {
      updateStmt.run(correctGender, p.id);
      console.log(`  ✅ ID ${p.id}: "${p.name}" — ${p.gender} → ${correctGender}`);
      updated++;
    } else {
      unchanged++;
    }
  }

  console.log(`\n─── Summary ───`);
  console.log(`  Total patients : ${patients.length}`);
  console.log(`  Updated        : ${updated}`);
  console.log(`  Already correct: ${unchanged}`);
  console.log(`  Skipped (unknown name): ${skipped}`);
  console.log(`  Done.\n`);
}

fixGenders();
