import { useState, useEffect } from 'react';
import { opdApi, patientsApi, doctorsApi } from '../services/api';

export default function OPD() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_id: '', doctor_id: '', appointment_date: '' });
  const [message, setMessage] = useState('');

  const fetchData = async () => {
    try {
      const [aRes, pRes, dRes] = await Promise.all([
        opdApi.getAll(),
        patientsApi.getAll(),
        doctorsApi.getAll(),
      ]);
      setAppointments(aRes.data);
      setPatients(pRes.data);
      setDoctors(dRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      await opdApi.book(form);
      setMessage('✅ Appointment booked & bill generated');
      setForm({ patient_id: '', doctor_id: '', appointment_date: '' });
      setShowForm(false);
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Failed'));
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await opdApi.updateStatus(id, status);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const selectCls = "w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 text-sm focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 focus:outline-none";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📋 OPD — Appointments</h1>
          <p className="text-sm text-gray-400 mt-1">Outpatient department management</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md"
        >
          {showForm ? 'Cancel' : '+ Book Appointment'}
        </button>
      </div>

      {message && (
        <div className="px-4 py-3 rounded-xl bg-white border border-gray-200 shadow-sm text-sm text-gray-700">{message}</div>
      )}

      {showForm && (
        <form onSubmit={handleBook} className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">New Appointment</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Patient</label>
              <select required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className={selectCls}>
                <option value="">Select patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Doctor</label>
              <select required value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })} className={selectCls}>
                <option value="">Select doctor</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name} — {d.department_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date & Time</label>
              <input
                type="datetime-local" required value={form.appointment_date}
                onChange={(e) => setForm({ ...form, appointment_date: e.target.value.replace('T', ' ') })}
                className={selectCls}
              />
            </div>
          </div>
          <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
            Book Appointment
          </button>
        </form>
      )}

      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['ID', 'Patient', 'Doctor', 'Department', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-400 text-xs">{a.id}</td>
                  <td className="py-3 px-4 text-gray-800 font-medium">{a.patient_name}</td>
                  <td className="py-3 px-4 text-gray-600">{a.doctor_name}</td>
                  <td className="py-3 px-4 text-gray-600">{a.department_name}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{a.appointment_date}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      a.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                      a.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                                                  'bg-rose-100 text-rose-700'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {a.status === 'Scheduled' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleStatusUpdate(a.id, 'Completed')}
                          className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs rounded-lg transition-colors font-medium">
                          Complete
                        </button>
                        <button onClick={() => handleStatusUpdate(a.id, 'Cancelled')}
                          className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs rounded-lg transition-colors font-medium">
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
