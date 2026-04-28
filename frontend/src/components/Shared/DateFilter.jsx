import { useState, useEffect } from 'react';

export default function DateFilter({ onFilter, from: initialFrom = '', to: initialTo = '' }) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  const handleApply = () => {
    onFilter({ from: from || undefined, to: to || undefined });
  };

  const handleClear = () => {
    setFrom('');
    setTo('');
    onFilter({});
  };

  useEffect(() => {
    setFrom(initialFrom);
  }, [initialFrom]);

  useEffect(() => {
    setTo(initialTo);
  }, [initialTo]);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 font-medium">From</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 font-medium">To</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400"
        />
      </div>
      <button
        onClick={handleApply}
        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors font-medium shadow-sm"
      >
        Apply
      </button>
      <button
        onClick={handleClear}
        className="px-4 py-1.5 bg-white hover:bg-gray-100 text-gray-600 text-sm rounded-lg transition-colors border border-gray-300"
      >
        Clear
      </button>
    </div>
  );
}
