import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { misApi } from '../services/api';
import KpiCard from '../components/Dashboard/KpiCard';
import ChartCard from '../components/Dashboard/ChartCard';
import DateFilter from '../components/Shared/DateFilter';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler
);

// Light-friendly chart defaults
ChartJS.defaults.color = '#6b7280';
ChartJS.defaults.borderColor = 'rgba(229, 231, 235, 1)';

const chartColors = {
  emerald: 'rgba(16, 185, 129, 0.8)',
  blue:    'rgba(59, 130, 246, 0.8)',
  amber:   'rgba(245, 158, 11, 0.8)',
  rose:    'rgba(244, 63, 94, 0.8)',
  violet:  'rgba(139, 92, 246, 0.8)',
  cyan:    'rgba(6, 182, 212, 0.8)',
  pink:    'rgba(236, 72, 153, 0.8)',
  lime:    'rgba(132, 204, 22, 0.8)',
  orange:  'rgba(249, 115, 22, 0.8)',
  teal:    'rgba(20, 184, 166, 0.8)',
};

const chartColorsArray = Object.values(chartColors);

export default function AdminDashboard() {
  const [kpis, setKpis] = useState(null);
  const [patientStats, setPatientStats] = useState(null);
  const [doctorPerf, setDoctorPerf] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [peakHours, setPeakHours] = useState(null);
  const [insights, setInsights] = useState(null);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = async (f = filters) => {
    setLoading(true);
    try {
      const [kRes, pRes, dRes, rRes, pmRes, oRes, phRes, iRes] = await Promise.all([
        misApi.getKpis(f),
        misApi.getPatientStats(f),
        misApi.getDoctorPerformance(f),
        misApi.getRevenue(f),
        misApi.getPaymentSummary(f),
        misApi.getOccupancy(f),
        misApi.getPeakHours(f),
        misApi.getInsights(),
      ]);
      setKpis(kRes.data);
      setPatientStats(pRes.data);
      setDoctorPerf(dRes.data);
      setRevenue(rRes.data);
      setPaymentSummary(pmRes.data);
      setOccupancy(oRes.data);
      setPeakHours(phRes.data);
      setInsights(iRes.data);
    } catch (err) {
      console.error('Failed to fetch MIS data:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleFilter = (f) => {
    setFilters(f);
    fetchData(f);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (v) => `₹${Number(v).toLocaleString('en-IN')}`;

  const baseChartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#9ca3af' } },
      y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#9ca3af' } },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">MIS Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Analytics · Decision Support · Expert System</p>
        </div>
        <DateFilter onFilter={handleFilter} from={filters.from} to={filters.to} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Total Patients"      value={kpis?.totalPatients}                     icon="🧑‍🤝‍🧑" color="blue"   />
        <KpiCard title="Revenue Generated"  value={formatCurrency(kpis?.revenueGenerated)}  icon="💰"    color="emerald"/>
        <KpiCard title="Revenue Collected"  value={formatCurrency(kpis?.revenueCollected)}  icon="✅"    color="cyan"  />
        <KpiCard title="Revenue Pending"    value={formatCurrency(kpis?.revenuePending)}    icon="⏳"    color="amber" />
        <KpiCard title="Bed Occupancy"      value={`${kpis?.bedOccupancy}%`}                icon="🛏️"   color="violet" subtitle={`${kpis?.occupiedBeds}/${kpis?.totalBeds} beds`} />
        <KpiCard title="Avg Stay"           value={`${kpis?.avgStayDuration} days`}         icon="📅"    color="rose"  />
      </div>

      {/* Expert System Alerts */}
      {insights?.alerts?.length > 0 && (
        <div className="space-y-2">
          {insights.alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
                alert.severity === 'critical'
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : alert.severity === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}
            >
              <span className="text-lg">{alert.icon}</span>
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Patient Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="📈 Monthly Patient Trends">
          <Line
            data={{
              labels: patientStats?.monthlyTrends?.map(d => d.month) || [],
              datasets: [{
                label: 'Registrations',
                data: patientStats?.monthlyTrends?.map(d => d.count) || [],
                borderColor: chartColors.emerald,
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: chartColors.emerald,
                pointRadius: 4,
              }],
            }}
            options={baseChartOptions}
          />
        </ChartCard>

        <ChartCard title="📊 OPD vs IPD Distribution">
          <Doughnut
            data={{
              labels: ['OPD', 'IPD'],
              datasets: [{
                data: [patientStats?.opdVsIpd?.opd || 0, patientStats?.opdVsIpd?.ipd || 0],
                backgroundColor: [chartColors.blue, chartColors.amber],
                borderWidth: 2,
                borderColor: '#fff',
              }],
            }}
            options={{ responsive: true, cutout: '65%', plugins: { legend: { display: true, position: 'bottom', labels: { color: '#6b7280', padding: 16 } } } }}
          />
        </ChartCard>

        <ChartCard title="👥 Age Group Distribution">
          <Bar
            data={{
              labels: patientStats?.ageGroups?.map(d => d.age_group) || [],
              datasets: [{
                label: 'Patients',
                data: patientStats?.ageGroups?.map(d => d.count) || [],
                backgroundColor: chartColorsArray.slice(0, 5),
                borderRadius: 8,
                borderSkipped: false,
              }],
            }}
            options={baseChartOptions}
          />
        </ChartCard>

        <ChartCard title="⚧ Gender Distribution">
          <Pie
            data={{
              labels: patientStats?.genderDist?.map(d => d.gender) || [],
              datasets: [{
                data: patientStats?.genderDist?.map(d => d.count) || [],
                backgroundColor: [chartColors.blue, chartColors.rose, chartColors.violet],
                borderWidth: 2,
                borderColor: '#fff',
              }],
            }}
            options={{ responsive: true, plugins: { legend: { display: true, position: 'bottom', labels: { color: '#6b7280', padding: 16 } } } }}
          />
        </ChartCard>
      </div>

      {/* Doctor Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="👨‍⚕️ Top Doctors by Patient Count">
          <Bar
            data={{
              labels: doctorPerf?.patientsPerDoctor?.map(d => d.name.replace('Dr. ', '')) || [],
              datasets: [{
                label: 'Patients',
                data: doctorPerf?.patientsPerDoctor?.map(d => d.patient_count) || [],
                backgroundColor: chartColors.cyan,
                borderRadius: 6,
              }],
            }}
            options={{ ...baseChartOptions, indexAxis: 'y' }}
          />
        </ChartCard>

        <ChartCard title="💵 Revenue per Doctor (Top 15)">
          <Bar
            data={{
              labels: doctorPerf?.revenuePerDoctor?.map(d => d.name.replace('Dr. ', '')) || [],
              datasets: [{
                label: 'Revenue (₹)',
                data: doctorPerf?.revenuePerDoctor?.map(d => d.revenue) || [],
                backgroundColor: chartColors.emerald,
                borderRadius: 6,
              }],
            }}
            options={{ ...baseChartOptions, indexAxis: 'y' }}
          />
        </ChartCard>
      </div>

      {/* Financial Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="📈 Monthly Revenue Trends">
          <Line
            data={{
              labels: revenue?.monthlyRevenue?.map(d => d.month) || [],
              datasets: [{
                label: 'Revenue (₹)',
                data: revenue?.monthlyRevenue?.map(d => d.revenue) || [],
                borderColor: chartColors.emerald,
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: chartColors.emerald,
                pointRadius: 4,
              }],
            }}
            options={baseChartOptions}
          />
        </ChartCard>

        <ChartCard title="💳 Paid vs Pending">
          <Doughnut
            data={{
              labels: paymentSummary?.paidVsPending?.map(d => d.payment_status) || [],
              datasets: [{
                data: paymentSummary?.paidVsPending?.map(d => d.total) || [],
                backgroundColor: [chartColors.emerald, chartColors.amber],
                borderWidth: 2,
                borderColor: '#fff',
              }],
            }}
            options={{ responsive: true, cutout: '65%', plugins: { legend: { display: true, position: 'bottom', labels: { color: '#6b7280', padding: 16 } } } }}
          />
        </ChartCard>

        <ChartCard title="💵 Payment Method Distribution">
          <Pie
            data={{
              labels: paymentSummary?.methodDist?.map(d => d.payment_method) || [],
              datasets: [{
                data: paymentSummary?.methodDist?.map(d => d.total) || [],
                backgroundColor: [chartColors.blue, chartColors.violet, chartColors.cyan],
                borderWidth: 2,
                borderColor: '#fff',
              }],
            }}
            options={{ responsive: true, plugins: { legend: { display: true, position: 'bottom', labels: { color: '#6b7280', padding: 16 } } } }}
          />
        </ChartCard>
      </div>

      {/* Revenue by Dept + OPD/IPD Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="🏢 Revenue by Department">
          <Bar
            data={{
              labels: revenue?.revenueByDept?.map(d => d.department) || [],
              datasets: [{
                label: 'Revenue (₹)',
                data: revenue?.revenueByDept?.map(d => d.revenue) || [],
                backgroundColor: chartColorsArray,
                borderRadius: 8,
                borderSkipped: false,
              }],
            }}
            options={baseChartOptions}
          />
        </ChartCard>

        <ChartCard title="📊 OPD vs IPD Revenue">
          <Doughnut
            data={{
              labels: revenue?.revenueByType?.map(d => d.type) || [],
              datasets: [{
                data: revenue?.revenueByType?.map(d => d.revenue) || [],
                backgroundColor: [chartColors.blue, chartColors.rose],
                borderWidth: 2,
                borderColor: '#fff',
              }],
            }}
            options={{ responsive: true, cutout: '65%', plugins: { legend: { display: true, position: 'bottom', labels: { color: '#6b7280', padding: 16 } } } }}
          />
        </ChartCard>
      </div>

      {/* Hospital Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="🛏️ Admission vs Discharge Trends">
          <Line
            data={{
              labels: occupancy?.admissionTrends?.map(d => d.month) || [],
              datasets: [
                {
                  label: 'Admissions',
                  data: occupancy?.admissionTrends?.map(d => d.admissions) || [],
                  borderColor: chartColors.blue,
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  fill: true,
                  tension: 0.4,
                  pointBackgroundColor: chartColors.blue,
                  pointRadius: 4,
                },
                {
                  label: 'Discharges',
                  data: occupancy?.dischargeTrends?.map(d => d.discharges) || [],
                  borderColor: chartColors.emerald,
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  fill: true,
                  tension: 0.4,
                  pointBackgroundColor: chartColors.emerald,
                  pointRadius: 4,
                },
              ],
            }}
            options={{ ...baseChartOptions, plugins: { legend: { display: true, position: 'top', labels: { color: '#6b7280' } } } }}
          />
        </ChartCard>

        <ChartCard title="🏥 Department-wise Active Patients">
          <Bar
            data={{
              labels: occupancy?.deptLoad?.map(d => d.department) || [],
              datasets: [{
                label: 'Active Patients',
                data: occupancy?.deptLoad?.map(d => d.active_patients) || [],
                backgroundColor: chartColors.violet,
                borderRadius: 8,
                borderSkipped: false,
              }],
            }}
            options={baseChartOptions}
          />
        </ChartCard>
      </div>

      {/* Peak Hours Analysis */}
      <ChartCard title="⏰ Peak Hours Analysis (Hour vs Patient Count)">
        <Bar
          data={{
            labels: peakHours?.map(d => `${d.hour}:00`) || [],
            datasets: [{
              label: 'Patients',
              data: peakHours?.map(d => d.patient_count) || [],
              backgroundColor: peakHours?.map(d =>
                d.hour >= 9 && d.hour <= 13 ? chartColors.rose : chartColors.blue
              ) || [],
              borderRadius: 6,
              borderSkipped: false,
            }],
          }}
          options={{
            ...baseChartOptions,
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y} patients at ${ctx.label}` } },
            },
          }}
        />
      </ChartCard>

      {/* DSS Insights */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">🧠 Decision Support System — Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights?.insights?.map((insight, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl text-sm border ${
                insight.type === 'positive'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : insight.type === 'negative'
                  ? 'bg-rose-50 text-rose-700 border-rose-100'
                  : insight.type === 'warning'
                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                  : 'bg-blue-50 text-blue-700 border-blue-100'
              }`}
            >
              <span className="text-lg mt-0.5">{insight.icon}</span>
              <span>{insight.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
