import { useState, useEffect } from 'react';
import { billingApi } from '../services/api';

export default function Billing() {
  const [bills, setBills] = useState([]);
  const [message, setMessage] = useState('');
  const [payingId, setPayingId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const fetchBills = async () => {
    try {
      const res = await billingApi.getAll();
      setBills(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchBills(); }, []);

  const handlePay = async (id) => {
    try {
      await billingApi.markPaid(id, paymentMethod);
      setMessage('✅ Bill marked as paid');
      setPayingId(null);
      fetchBills();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Failed'));
    }
  };

  const formatCurrency = (v) => `₹${Number(v).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">💰 Billing</h1>
        <p className="text-sm text-gray-400 mt-1">Manage patient bills and payments</p>
      </div>

      {message && (
        <div className="px-4 py-3 rounded-xl bg-white border border-gray-200 shadow-sm text-sm text-gray-700">{message}</div>
      )}

      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['ID', 'Patient', 'Type', 'Department', 'Amount', 'Date', 'Status', 'Method', 'Actions'].map(h => (
                  <th key={h} className={`py-3 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wide ${h === 'Amount' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-400 text-xs">{b.id}</td>
                  <td className="py-3 px-4 text-gray-800 font-medium">{b.patient_name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      b.type === 'OPD' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
                    }`}>
                      {b.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{b.department_name}</td>
                  <td className="py-3 px-4 text-right text-emerald-600 font-semibold">{formatCurrency(b.amount)}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{b.billing_date}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      b.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {b.payment_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-xs">{b.payment_method || '—'}</td>
                  <td className="py-3 px-4">
                    {b.payment_status === 'Pending' && (
                      <>
                        {payingId === b.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-gray-700 text-xs focus:outline-none"
                            >
                              <option>Cash</option>
                              <option>Card</option>
                              <option>Insurance</option>
                            </select>
                            <button onClick={() => handlePay(b.id)}
                              className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs rounded-lg transition-colors font-medium">
                              Confirm
                            </button>
                            <button onClick={() => setPayingId(null)}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded-lg transition-colors">
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setPayingId(b.id); setPaymentMethod('Cash'); }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg transition-colors font-medium shadow-sm"
                          >
                            Mark as Paid
                          </button>
                        )}
                      </>
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
