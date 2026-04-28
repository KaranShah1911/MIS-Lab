export default function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`rounded-2xl bg-white border border-gray-200 shadow-sm p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      <div className="relative">{children}</div>
    </div>
  );
}
