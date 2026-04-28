export default function KpiCard({ title, value, icon, color = 'emerald', subtitle }) {
  const colorMap = {
    emerald: 'from-emerald-50 to-white border-emerald-200 text-emerald-700 shadow-emerald-100',
    blue:    'from-blue-50 to-white border-blue-200 text-blue-700 shadow-blue-100',
    amber:   'from-amber-50 to-white border-amber-200 text-amber-700 shadow-amber-100',
    rose:    'from-rose-50 to-white border-rose-200 text-rose-700 shadow-rose-100',
    violet:  'from-violet-50 to-white border-violet-200 text-violet-700 shadow-violet-100',
    cyan:    'from-cyan-50 to-white border-cyan-200 text-cyan-700 shadow-cyan-100',
  };

  const iconBgMap = {
    emerald: 'bg-emerald-100',
    blue:    'bg-blue-100',
    amber:   'bg-amber-100',
    rose:    'bg-rose-100',
    violet:  'bg-violet-100',
    cyan:    'bg-cyan-100',
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorMap[color]} border shadow-sm p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <span className={`text-2xl p-2 rounded-xl ${iconBgMap[color]}`}>{icon}</span>
      </div>
    </div>
  );
}
