import { useEffect, useState } from 'react';
import Icon from './Icon';
import OrderCard from './OrderCard';

interface Result {
  id: string;
  order: string;
  postcode?: string;
}

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [suggest, setSuggest] = useState<string[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [report, setReport] = useState<any | null>(null);

  useEffect(() => {
    if (!q) {
      setResults([]);
      setSuggest([]);
      setSelectedIndex(-1);
      return;
    }
    const controller = new AbortController();
    const lower = q.toLowerCase();
    if (lower.includes('report')) {
      fetch(`/api/nl-report?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
          setReport(data.report || null);
          setResults([]);
          setSuggest([]);
          setSelectedIndex(-1);
        })
        .catch(() => {});
    } else {
      setReport(null);
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
          setResults(data.items || []);
          setSuggest(data.suggest || []);
          setSelectedIndex(-1);
        })
        .catch(() => {});
    }
    return () => controller.abort();
  }, [q]);

  const selectResult = async (id: string) => {
    const res = await fetch(`/api/items?table=copy_of_tomorrow_trips&id=${id}`);
    if (res.ok) {
      const data = await res.json();
      setSelected(data.item?.data || null);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        selectResult(results[selectedIndex].id);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, selectedIndex, results]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQ('');
      setResults([]);
      setSuggest([]);
      setSelected(null);
      setSelectedIndex(-1);
      setReport(null);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="w-full max-w-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          animation: open ? 'spotlight-in 0.2s ease-out' : 'spotlight-out 0.15s ease-in'
        }}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200/50">
          <div className="w-5 h-5 mr-3 text-gray-400">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Spotlight Search"
            className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 outline-none text-lg font-medium"

          />
          <button 
            onClick={onClose}
            className="ml-3 w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Report Results */}
        {report && (
          <div className="border-b border-gray-200/50 p-4 space-y-2 text-sm">
            <h3 className="font-semibold">Report Summary</h3>
            <p>Total: {report.summary.total}</p>
            <p>Completed: {report.summary.complete}</p>
            <p>Failed: {report.summary.failed}</p>
            {report.topDrivers && (
              <div>
                <p className="font-semibold mt-2">Top Drivers</p>
                <ul className="list-disc ml-5">
                  {report.topDrivers.map((d: any) => (
                    <li key={d.driver}>{d.driver} ({d.count})</li>
                  ))}
                </ul>
              </div>
            )}
            {report.topPostcodes && (
              <div>
                <p className="font-semibold mt-2">Top Postcodes</p>
                <ul className="list-disc ml-5">
                  {report.topPostcodes.map((p: any) => (
                    <li key={p.postcode}>{p.postcode} ({p.count})</li>
                  ))}
                </ul>
              </div>
            )}
            {report.startTimes && (
              <p className="mt-2">Start: {report.startTimes.first} • Last: {report.startTimes.last}</p>
            )}
          </div>
        )}

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 && q && (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No results found for "{q}"
            </div>
          )}
          
          {results.map((r, index) => (
            <div
              key={r.id}
              className={`px-4 py-3 cursor-pointer transition-all duration-150 ${
                selectedIndex === index
                  ? 'bg-primary text-primary-content'
                  : 'hover:bg-gray-100/70 text-gray-900'
              }`}
              onClick={() => selectResult(r.id)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
                <div className="flex-1">
                <div className="font-medium">{r.order}</div>
                {r.postcode && (
                  <div className={`text-sm ${selectedIndex === index ? 'text-primary-content' : 'text-gray-500'}`}>
                    {r.postcode}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Order Detail */}
        {selected && (
          <div className="border-t border-gray-200/50 p-4">
            <OrderCard data={selected} />
          </div>
        )}

        {/* Suggestions */}
        {suggest.length > 0 && !selected && (
          <div className="border-t border-gray-200/50 px-4 py-3">
            <div className="text-sm text-gray-500 mb-2">Did you mean:</div>
            <div className="space-y-1">
              {suggest.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setQ(s)}
                  className="block text-left text-primary hover:text-primary/80 text-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Keyboard hints */}
        {results.length > 0 && !selected && (
          <div className="border-t border-gray-200/50 px-4 py-2 text-xs text-gray-400 text-center">
            ↑↓ navigate • ↵ select • esc close
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spotlight-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes spotlight-out {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}