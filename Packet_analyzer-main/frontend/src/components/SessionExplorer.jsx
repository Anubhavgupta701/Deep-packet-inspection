import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api.js';

const STATE_COLORS = { NEW: '#3b82f6', ESTABLISHED: '#10b981', CLOSED: '#5a6370', BLOCKED: '#f43f5e' };
const STATE_BG = { NEW: 'bg-blue-500/8', ESTABLISHED: 'bg-emerald/8', CLOSED: 'bg-graphite-600/8', BLOCKED: 'bg-rose/8' };

export default function SessionExplorer() {
  const [sessions, setSessions] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('packets');

  useEffect(() => {
    api.getSessions().then(d => setSessions(d.sessions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = sessions
    .filter(s => {
      if (!filter) return true;
      const q = filter.toLowerCase();
      return s.srcIp.includes(q) || s.dstIp.includes(q) || (s.sni || '').toLowerCase().includes(q)
        || s.appType.toLowerCase().includes(q) || s.protocol.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortKey === 'packets') return b.packetCount - a.packetCount;
      if (sortKey === 'bytes') return b.totalBytes - a.totalBytes;
      return 0;
    });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-graphite-500">Loading sessions…</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-graphite-200 tracking-tight">Session Explorer</h2>
          <p className="text-xs sm:text-sm text-graphite-500">{sessions.length} flows grouped by five-tuple</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Sort selector */}
          <div className="flex bg-graphite-800 border border-graphite-700/40 rounded-lg overflow-hidden">
            {['packets', 'bytes'].map(k => (
              <button key={k} onClick={() => setSortKey(k)}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-[11px] transition-colors ${
                  sortKey === k ? 'bg-accent/10 text-accent font-medium' : 'text-graphite-500 hover:text-graphite-400'
                }`}>
                By {k}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite-600 text-xs">⌕</span>
            <input value={filter} onChange={e => setFilter(e.target.value)}
              placeholder="Filter sessions…"
              className="bg-graphite-800 border border-graphite-700/40 rounded-lg pl-8 pr-3 py-1.5 text-sm text-graphite-300 placeholder:text-graphite-600 w-full sm:w-56 outline-none focus:border-accent/40 transition-colors" />
          </div>
        </div>
      </div>

      {/* Sessions list */}
      <div className="space-y-2">
        {filtered.map((s, i) => (
          <motion.div key={s.id}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.015, 0.3) }}
            className={`bg-graphite-900 border rounded-xl overflow-hidden transition-colors duration-200 ${
              expanded === s.id ? 'border-accent/30 shadow-lg shadow-accent/5' : 'border-graphite-700/30 hover:border-graphite-600/40'
            }`}>
            <button onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              className="w-full px-3 sm:px-4 py-3 text-left transition-colors">
              {/* Mobile layout: stacked */}
              <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                {/* State indicator */}
                <div className="relative shrink-0 mt-1 sm:mt-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 block" style={{ background: STATE_COLORS[s.state] || '#5a6370' }} />
                  {s.state === 'ESTABLISHED' && (
                    <span className="absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping opacity-30" style={{ background: STATE_COLORS.ESTABLISHED }} />
                  )}
                </div>

                {/* Flow — wraps on mobile */}
                <span className="font-mono text-xs text-graphite-300 shrink-0 break-all sm:break-normal">
                  {s.srcIp}<span className="text-graphite-600">:{s.srcPort}</span>
                  <span className="text-graphite-600 mx-1.5">→</span>
                  {s.dstIp}<span className="text-graphite-600">:{s.dstPort}</span>
                </span>

                {/* Protocol badge */}
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                  s.protocol === 'TCP' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald/10 text-emerald'
                }`}>{s.protocol}</span>

                {/* SNI — hidden on very small screens, shown inline on sm+ */}
                {s.sni && (
                  <span className="font-mono text-xs text-graphite-400 truncate max-w-[120px] sm:max-w-[160px] hidden sm:inline">{s.sni}</span>
                )}

                {/* Spacer + meta — wrap to next line on mobile */}
                <span className="w-full sm:w-auto sm:ml-auto flex items-center gap-2 sm:gap-3 shrink-0 mt-1.5 sm:mt-0 flex-wrap sm:flex-nowrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${STATE_BG[s.state] || ''}`}
                    style={{ color: STATE_COLORS[s.state] || '#5a6370' }}>
                    {s.state}
                  </span>
                  <span className="text-xs text-graphite-500">{s.appType}</span>
                  <span className="font-mono text-xs text-graphite-600 tabular-nums">{s.packetCount} pkts</span>
                  <span className="font-mono text-xs text-graphite-600 tabular-nums">{s.totalBytes} B</span>
                  <span className={`text-graphite-600 transition-transform duration-200 ${expanded === s.id ? 'rotate-180' : ''}`}>▾</span>
                </span>
              </div>

              {/* SNI on mobile (below main row) */}
              {s.sni && (
                <div className="sm:hidden mt-1.5 ml-5">
                  <span className="font-mono text-[11px] text-graphite-400 truncate block">{s.sni}</span>
                </div>
              )}
            </button>

            {/* Expanded detail */}
            <AnimatePresence>
              {expanded === s.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden">
                  <div className="border-t border-graphite-800/60 px-3 sm:px-4 py-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 text-xs bg-graphite-950/30">
                    {[
                      ['State', s.state, STATE_COLORS[s.state]],
                      ['Protocol', s.protocol],
                      ['Application', s.appType],
                      ['Packets', s.packetCount],
                      ['Total Bytes', s.totalBytes],
                      ['Direction', `${s.srcIp} → ${s.dstIp}`],
                    ].map(([label, val, color]) => (
                      <div key={label}>
                        <p className="text-[10px] uppercase tracking-wider text-graphite-600 mb-0.5">{label}</p>
                        <p className="font-medium font-mono break-all" style={{ color: color || '#b0b8c4' }}>{val}</p>
                      </div>
                    ))}
                    {s.sni && (
                      <div className="col-span-2">
                        <p className="text-[10px] uppercase tracking-wider text-graphite-600 mb-0.5">SNI Domain</p>
                        <p className="text-accent font-mono break-all">{s.sni}</p>
                      </div>
                    )}
                    <div className="col-span-2 md:col-span-4 lg:col-span-6">
                      <p className="text-[10px] uppercase tracking-wider text-graphite-600 mb-1">Packet IDs</p>
                      <div className="flex flex-wrap gap-1">
                        {(s.packets || []).map(pid => (
                          <span key={pid} className="px-1.5 py-0.5 text-[10px] font-mono bg-graphite-800 border border-graphite-700/30 rounded text-graphite-500">
                            #{pid}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-graphite-600 text-sm">No sessions match filter</p>
          <button onClick={() => setFilter('')} className="text-accent text-xs mt-2 hover:underline">Clear filter</button>
        </div>
      )}
    </div>
  );
}
