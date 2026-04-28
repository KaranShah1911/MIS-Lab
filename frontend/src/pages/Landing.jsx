import { useNavigate } from 'react-router-dom';

const stats = [
  { label: 'Patients Managed', value: '300+', icon: '🧑‍🤝‍🧑', color: 'text-blue-600' },
  { label: 'Doctors On Record', value: '50+',  icon: '👨‍⚕️',   color: 'text-emerald-600' },
  { label: 'Appointments',      value: '1200+', icon: '📋',    color: 'text-violet-600' },
  { label: 'Revenue Tracked',   value: '₹1.4Cr', icon: '💰',  color: 'text-amber-600' },
];

const modules = [
  { icon: '📊', title: 'MIS Dashboard',      desc: 'Real-time KPIs, 14+ analytics charts, trends & filters.' },
  { icon: '🧠', title: 'Decision Support',   desc: 'DSS engine generates automated actionable insights.' },
  { icon: '🤖', title: 'Expert System',      desc: 'Rule-based alerts for occupancy, revenue & staffing.' },
  { icon: '👑', title: 'Executive Summary',  desc: 'Clean high-level view designed for leadership.' },
  { icon: '🏥', title: 'OPD / IPD',          desc: 'Appointments, admissions, beds & discharge workflows.' },
  { icon: '💰', title: 'Billing',            desc: 'Generate bills, track payments, mark as paid.' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Top Nav ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏥</span>
            <span className="text-xl font-bold text-gray-800">HIS <span className="text-emerald-600">Pro</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#features"  className="hover:text-gray-800 transition-colors">Features</a>
            <a href="#modules"   className="hover:text-gray-800 transition-colors">Modules</a>
            <a href="#analytics" className="hover:text-gray-800 transition-colors">Analytics</a>
          </nav>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            Open Dashboard →
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="pt-32 pb-24 px-6 bg-gradient-to-br from-gray-50 via-white to-emerald-50/40">
        <div className="max-w-5xl mx-auto text-center">

          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
            Hospital Information<br />
            <span className="text-emerald-600">System & Analytics</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            A complete operational HIS paired with an advanced MIS layer — featuring real-time analytics,
            decision support, expert system alerts, and an executive dashboard.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 text-sm"
            >
              📊 Open MIS Dashboard
            </button>
            <button
              onClick={() => navigate('/patients')}
              className="px-8 py-3.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-2xl transition-all shadow-sm border border-gray-200 text-sm"
            >
              🏥 Go to HIS Modules
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section id="features" className="py-16 px-6 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-md transition-shadow">
              <span className="text-3xl block mb-3">{s.icon}</span>
              <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-500 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Modules ── */}
      <section id="modules" className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">Everything in one system</h2>
            <p className="text-gray-400 mt-3 text-sm">Operational + analytical modules working together</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((m) => (
              <div key={m.title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                <span className="text-3xl block mb-4">{m.icon}</span>
                <h3 className="text-base font-semibold text-gray-800 mb-2">{m.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Analytics Highlight ── */}
      <section id="analytics" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 p-10 md:p-14 text-white text-center shadow-xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Analytics-first design</h2>
            <p className="text-emerald-100 text-base max-w-xl mx-auto mb-8 leading-relaxed">
              From peak-hours analysis to doctor utilization rates, every metric is computed live
              from SQLite using GROUP BY, JOIN, AVG, and COUNT queries — no external BI tools needed.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3.5 bg-white text-emerald-700 font-bold rounded-2xl hover:bg-emerald-50 transition-all shadow-md text-sm"
            >
              View Live Dashboard →
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-gray-100 text-center text-xs text-gray-400">
        <p>HIS Pro · Hospital Information System with MIS · Academic Project</p>
      </footer>
    </div>
  );
}
