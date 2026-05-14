import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api.js';

const FLAG_COLORS = { SYN: '#3b82f6', ACK: '#10b981', PSH: '#f59e0b', FIN: '#f43f5e', RST: '#ef4444', URG: '#8b5cf6' };

export default function PacketStream() {
  const [packets, setPackets] = useState([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPackets(300).then(d => { setPackets(d.packets); setTotal(d.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = packets.filter(p => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return p.srcIp.includes(q) || p.dstIp.includes(q) || p.sni.toLowerCase().includes(q)
      || p.appType.toLowerCase().includes(q) || p.protocol.toLowerCase().includes(q);
  });

  const selectedPacket = selected ? packets.find(p => p.id === selected) : null;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-graphite-500">Loading packets…</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-graphite-200 tracking-tight">Packet Stream</h2>
          <p className="text-xs sm:text-sm text-graphite-500">
            {total} packets parsed • showing {Math.min(filtered.length, 150)} of {filtered.length} filtered
          </p>
        </div>
        <div className="relative w-full sm:w-auto">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite-600 text-xs">⌕</span>
          <input value={filter} onChange={e => setFilter(e.target.value)}
            placeholder="Filter by IP, SNI, protocol…"
            className="bg-graphite-800 border border-graphite-700/40 rounded-lg pl-8 pr-3 py-2 text-sm text-graphite-300 placeholder:text-graphite-600 w-full sm:w-72 outline-none focus:border-accent/40 transition-colors" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Table */}
        <div className="flex-1 bg-graphite-900 border border-graphite-700/30 rounded-xl overflow-hidden min-w-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="text-left text-[10px] text-graphite-500 uppercase tracking-[0.12em] border-b border-graphite-700/30 bg-graphite-900/80">
                  <th className="px-3 py-3 w-10">#</th>
                  <th className="px-3 py-3">Source</th>
                  <th className="px-3 py-3">Destination</th>
                  <th className="px-3 py-3 w-16">Proto</th>
                  <th className="px-3 py-3 w-24">Flags</th>
                  <th className="px-3 py-3">SNI / Host</th>
                  <th className="px-3 py-3 w-20">App</th>
                  <th className="px-3 py-3 w-16 text-right">Len</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 150).map((p) => (
                  <tr key={p.id} onClick={() => setSelected(selected === p.id ? null : p.id)}
                    className={`border-b border-graphite-800/40 cursor-pointer transition-colors duration-150 ${
                      selected === p.id
                        ? 'bg-accent/5 border-l-2 border-l-accent'
                        : 'hover:bg-graphite-800/30'
                    }`}>
                    <td className="px-3 py-2 font-mono text-graphite-600">{p.id}</td>
                    <td className="px-3 py-2 font-mono text-graphite-300">
                      {p.srcIp}<span className="text-graphite-600">:{p.srcPort}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-graphite-300">
                      {p.dstIp}<span className="text-graphite-600">:{p.dstPort}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        p.protocol === 'TCP' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald/10 text-emerald'
                      }`}>{p.protocol}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-0.5 flex-wrap">
                        {p.tcpFlags && p.tcpFlags !== '—' && p.tcpFlags.split(',').map(f => (
                          <span key={f} className="px-1 py-0.5 rounded text-[9px] font-bold" style={{
                            background: (FLAG_COLORS[f] || '#5a6370') + '15', color: FLAG_COLORS[f] || '#5a6370'
                          }}>{f}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono text-graphite-400 truncate max-w-[180px]">{p.sni || '—'}</td>
                    <td className="px-3 py-2 text-graphite-400">{p.appType}</td>
                    <td className="px-3 py-2 font-mono text-graphite-500 text-right tabular-nums">{p.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel — full-width below table on mobile, side panel on lg+ */}
        <AnimatePresence>
          {selectedPacket && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.25 }}
              className="w-full lg:w-[280px] shrink-0 bg-graphite-900 border border-graphite-700/30 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-graphite-700/30 flex items-center justify-between">
                <h3 className="text-xs font-medium text-graphite-300">Packet #{selectedPacket.id}</h3>
                <button onClick={() => setSelected(null)} className="text-graphite-600 hover:text-graphite-400 text-xs">✕</button>
              </div>
              <div className="px-4 py-3 space-y-3 text-xs">
                {[
                  ['Source', `${selectedPacket.srcIp}:${selectedPacket.srcPort}`],
                  ['Destination', `${selectedPacket.dstIp}:${selectedPacket.dstPort}`],
                  ['Protocol', selectedPacket.protocol],
                  ['Length', `${selectedPacket.length} bytes`],
                  ['TCP Flags', selectedPacket.tcpFlags || '—'],
                  ['SNI', selectedPacket.sni || '—'],
                  ['Application', selectedPacket.appType],
                  ['Timestamp', selectedPacket.timestamp || '—'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-[10px] uppercase tracking-wider text-graphite-600 mb-0.5">{label}</p>
                    <p className="font-mono text-graphite-300 break-all">{val}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-graphite-600 text-sm">No packets match filter</p>
          <button onClick={() => setFilter('')} className="text-accent text-xs mt-2 hover:underline">Clear filter</button>
        </div>
      )}
    </div>
  );
}
