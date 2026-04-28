import { useState, useEffect } from 'react';
import { patientsApi } from '../services/api';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', age: '', gender: 'Male', contact: '' });
  const [message, setMessage] = useState('');

  const fetchPatients = async (q) => {
    try {
      const res = await patientsApi.getAll(q || undefined);
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Debounced search — fires 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await patientsApi.create({ ...form, age: parseInt(form.age) });
      setMessage('✅ Patient added successfully');
      setForm({ name: '', age: '', gender: 'Male', contact: '' });
      setShowForm(false);
      fetchPatients(search);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Failed to add patient'));
    }
  };

  const inputCls = "w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 text-sm focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 focus:outline-none";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🧑‍🤝‍🧑 Patients</h1>
          <p className="text-sm text-gray-400 mt-1">Manage patient records</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md"
        >
          {showForm ? 'Cancel' : '+ Add Patient'}
        </button>
      </div>

      {message && (
        <div className="px-4 py-3 rounded-xl bg-white border border-gray-200 shadow-sm text-sm text-gray-700">{message}</div>
      )}

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">New Patient Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Full name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Age</label>
              <input type="number" required min="0" max="120" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className={inputCls} placeholder="Age" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inputCls}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Contact</label>
              <input type="text" required value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className={inputCls} placeholder="Phone number" />
            </div>
          </div>
          <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
            Add Patient
          </button>
        </form>
      )}

      {/* Search — debounced, fires automatically */}
      <div className="flex gap-3">
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 text-sm focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-500 rounded-lg text-sm transition-colors border border-gray-300 shadow-sm">
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wide">ID</th>
                <th className="text-left py-3 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wide">Name</th>
                <th className="text-left py-3 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wide">Age</th>
                <th className="text-left py-3 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wide">Gender</th>
                <th className="text-left py-3 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wide">Contact</th>
                <th className="text-left py-3 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wide">Registered</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-400 text-xs">{p.id}</td>
                  <td className="py-3 px-4 text-gray-800 font-medium">{p.name}</td>
                  <td className="py-3 px-4 text-gray-600">{p.age}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      p.gender === 'Male'   ? 'bg-blue-100 text-blue-700' :
                      p.gender === 'Female' ? 'bg-pink-100 text-pink-700' :
                                              'bg-violet-100 text-violet-700'
                    }`}>
                      {p.gender}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{p.contact}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{p.registered_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
