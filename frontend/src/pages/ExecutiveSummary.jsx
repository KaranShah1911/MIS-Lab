import { useState, useEffect } from 'react';
import { misApi } from '../services/api';
import KpiCard from '../components/Dashboard/KpiCard';

export default function ExecutiveSummary() {
  const [kpis, setKpis] = useState(null);
  const [insights, setInsights] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kRes, iRes, rRes] = await Promise.all([
          misApi.getKpis(),
          misApi.getInsights(),
          misApi.getRevenue(),
        ]);
        setKpis(kRes.data);
        setInsights(iRes.data);
        setRevenue(rRes.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (v) => `₹${Number(v).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">👑 Executive Summary</h1>
        <p className="text-sm text-gray-400 mt-1">High-level overview for executive leadership</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Total Patients"     value={kpis?.totalPatients}                    icon="🧑‍🤝‍🧑" color="blue"   />
        <KpiCard title="Revenue Generated"  value={formatCurrency(kpis?.revenueGenerated)} icon="💰"    color="emerald"/>
        <KpiCard title="Revenue Collected"  value={formatCurrency(kpis?.revenueCollected)} icon="✅"    color="cyan"  />
        <KpiCard title="Revenue Pending"    value={formatCurrency(kpis?.revenuePending)}   icon="⏳"    color="amber" />
        <KpiCard title="Bed Occupancy"      value={`${kpis?.bedOccupancy}%`}               icon="🛏️"   color="violet" subtitle={`${kpis?.occupiedBeds}/${kpis?.totalBeds} beds`} />
        <KpiCard title="Avg Stay"           value={`${kpis?.avgStayDuration} days`}        icon="📅"    color="rose"  />
      </div>

      {/* Alerts Section */}
      {insights?.alerts?.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">🚨 Key Alerts</h2>
          <div className="space-y-3">
            {insights.alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-5 py-4 rounded-xl border text-sm font-medium ${
                  alert.severity === 'critical'
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : alert.severity === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}
              >
                <span className="text-xl">{alert.icon}</span>
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend Summaries */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 Key Trends</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights?.insights?.map((insight, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-4 rounded-xl text-sm border ${
                insight.type === 'positive'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : insight.type === 'negative'
                  ? 'bg-rose-50 text-rose-700 border-rose-100'
                  : insight.type === 'warning'
                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                  : 'bg-blue-50 text-blue-700 border-blue-100'
              }`}
            >
              <span className="text-xl">{insight.icon}</span>
              <span className="leading-relaxed">{insight.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Summary Table */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🏢 Department Revenue Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-gray-500 font-semibold">Department</th>
                <th className="text-right py-3 px-4 text-gray-500 font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {revenue?.revenueByDept?.map((dept, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-700">{dept.department}</td>
                  <td className="py-3 px-4 text-right text-emerald-600 font-semibold">{formatCurrency(dept.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
