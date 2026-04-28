import { useState, useEffect } from 'react';
import { ipdApi, patientsApi } from '../services/api';

export default function IPD() {
  const [admissions, setAdmissions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [beds, setBeds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_id: '', bed_id: '' });
  const [message, setMessage] = useState('');

  const fetchData = async () => {
    try {
      const [aRes, pRes, bRes] = await Promise.all([
        ipdApi.getAll(),
        patientsApi.getAll(),
        ipdApi.getBeds(),
      ]);
      setAdmissions(aRes.data);
      setPatients(pRes.data);
      setBeds(bRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdmit = async (e) => {
    e.preventDefault();
    try {
      await ipdApi.admit(form);
      setMessage('✅ Patient admitted & bill generated');
      setForm({ patient_id: '', bed_id: '' });
      setShowForm(false);
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Failed'));
    }
  };

  const handleDischarge = async (id) => {
    try {
      await ipdApi.discharge(id);
      setMessage('✅ Patient discharged');
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Failed'));
    }
  };

  const selectCls = "w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 text-sm focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 focus:outline-none";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🛏️ IPD — Admissions</h1>
          <p className="text-sm text-gray-400 mt-1">Inpatient department management</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md"
        >
          {showForm ? 'Cancel' : '+ Admit Patient'}
        </button>
      </div>

      {message && (
        <div className="px-4 py-3 rounded-xl bg-white border border-gray-200 shadow-sm text-sm text-gray-700">{message}</div>
      )}

      {showForm && (
        <form onSubmit={handleAdmit} className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">New Admission</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Patient</label>
              <select required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className={selectCls}>
                <option value="">Select patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Available Bed</label>
              <select required value={form.bed_id} onChange={(e) => setForm({ ...form, bed_id: e.target.value })} className={selectCls}>
                <option value="">Select bed</option>
                {beds.map(b => <option key={b.id} value={b.id}>Bed #{b.id} — {b.ward_type} ({b.department_name})</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
            Admit Patient
          </button>
        </form>
      )}

      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['ID', 'Patient', 'Ward', 'Department', 'Admitted', 'Discharged', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {admissions.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-400 text-xs">{a.id}</td>
                  <td className="py-3 px-4 text-gray-800 font-medium">{a.patient_name}</td>
                  <td className="py-3 px-4 text-gray-600">{a.ward_type}</td>
                  <td className="py-3 px-4 text-gray-600">{a.department_name}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{a.admission_date}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{a.discharge_date || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      a.status === 'Admitted' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {a.status === 'Admitted' && (
                      <button onClick={() => handleDischarge(a.id)}
                        className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs rounded-lg transition-colors font-medium">
                        Discharge
                      </button>
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
