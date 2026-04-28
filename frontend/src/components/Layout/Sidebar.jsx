import { NavLink, Link } from 'react-router-dom';

const navItems = [
  { path: '/dashboard',  label: 'Dashboard',         icon: '📊', section: 'MIS' },
  { path: '/executive',  label: 'Executive Summary',  icon: '👑', section: 'MIS' },
  { path: '/patients',   label: 'Patients',           icon: '🧑‍🤝‍🧑', section: 'HIS' },
  { path: '/opd',        label: 'OPD (Appointments)', icon: '📋', section: 'HIS' },
  { path: '/ipd',        label: 'IPD (Admissions)',   icon: '🛏️', section: 'HIS' },
  { path: '/billing',    label: 'Billing',            icon: '💰', section: 'HIS' },
];

export default function Sidebar() {
  const sections = [...new Set(navItems.map(i => i.section))];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col min-h-screen fixed left-0 top-0 z-50 shadow-lg">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link to="/" className="group block">
          <h1 className="text-xl font-bold tracking-tight text-gray-800 group-hover:text-emerald-600 transition-colors">
            <span className="text-emerald-600">🏥</span> HIS
            <span className="text-emerald-600 ml-1">Pro</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Hospital Information System</p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {sections.map((section) => (
          <div key={section} className="mb-2">
            <p className="px-6 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              {section}
            </p>
            {navItems
              .filter((item) => item.section === section)
              .map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-6 py-2.5 mx-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <Link to="/" className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-emerald-600 transition-colors">
          <span>←</span> Back to Home
        </Link>
      </div>
    </aside>
  );
}
