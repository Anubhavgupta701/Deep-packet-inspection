import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { api } from '../api.js';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#f43f5e','#8b5cf6','#06b6d4','#ec4899','#84cc16','#f97316','#6366f1'];

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

function Metric({ label, value, sub, icon, delay = 0, accent }) {
  return (
    <motion.div {...fadeUp} transition={{ delay, duration: 0.4 }}
      className="relative bg-graphite-900 border border-graphite-700/30 rounded-xl px-5 py-4 overflow-hidden group hover:border-graphite-600/40 transition-colors duration-300">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-5 -translate-y-6 translate-x-6"
        style={{ background: accent || '#3b82f6' }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-graphite-500 mb-1.5 font-medium">{label}</p>
          <p className="text-2xl font-semibold text-graphite-200 font-mono tracking-tight">{value}</p>
          {sub && <p className="text-[11px] text-graphite-500 mt-1">{sub}</p>}
        </div>
        {icon && <span className="text-2xl opacity-20 group-hover:opacity-30 transition-opacity">{icon}</span>}
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-graphite-700/60 rounded-lg px-3 py-2 shadow-xl shadow-black/10">
      <p className="text-xs font-medium text-graphite-300 mb-0.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-mono" style={{ color: p.color || '#b0b8c4' }}>
          {p.name}: {p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(e => setErr(e.message));
    api.getTimeline().then(setTimeline).catch(() => {});
  }, []);

  if (err) return (
    <div className="flex items-center gap-3 px-4 py-3 bg-rose/5 border border-rose/20 rounded-xl text-sm text-rose">
      <span className="text-lg">⚠</span> {err}
    </div>
  );

  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-graphite-500">Loading engine data…</p>
      </div>
    </div>
  );

  const appData = Object.entries(stats.applicationBreakdown || {})
    .map(([name, count]) => ({ name, value: count }))
    .sort((a, b) => b.value - a.value);

  const protoData = Object.entries(stats.protocolDistribution || {})
    .map(([name, count]) => ({ name, count }));

  const totalBytes = stats.totalBytes || 0;
  const bytesDisplay = totalBytes > 1048576
    ? `${(totalBytes / 1048576).toFixed(2)} MB`
    : `${(totalBytes / 1024).toFixed(1)} KB`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div {...fadeUp} className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold text-graphite-200 tracking-tight">Dashboard</h2>
          <p className="text-sm text-graphite-500 mt-0.5">Information Extracted from PCAP data</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-graphite-900 border border-graphite-700/30 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald" />
          <span className="text-[11px] font-mono text-graphite-500">
            {stats.totalPackets} packets analyzed
          </span>
        </div>
      </motion.div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric label="Total Packets" value={stats.totalPackets.toLocaleString()} icon="⟐" delay={0.05} accent="#3b82f6" />
        <Metric label="Total Bytes" value={bytesDisplay} icon="◆" delay={0.1} accent="#10b981" />
        <Metric label="Active Sessions" value={stats.totalSessions} icon="⊡" delay={0.15} accent="#f59e0b" />
        <Metric label="SNIs Detected" value={stats.topSnis?.length || 0} icon="◎" delay={0.2} accent="#8b5cf6" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Protocol Distribution */}
        <motion.div {...fadeUp} transition={{ delay: 0.25 }}
          className="bg-graphite-900 border border-graphite-700/30 rounded-xl p-5">
          <h3 className="text-sm font-medium text-graphite-300 mb-4 flex items-center gap-2">
            <span className="w-1 h-3 rounded-full bg-accent" />
            Protocol Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={protoData} barSize={36}>
              <XAxis dataKey="name" tick={{ fill: '#ff0000ff', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#000000ff', fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(205, 208, 208, 0.6)' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {protoData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* App Classification */}
        <motion.div {...fadeUp} transition={{ delay: 0.3 }}
          className="bg-graphite-900 border border-graphite-700/30 rounded-xl p-5">
          <h3 className="text-sm font-medium text-graphite-300 mb-4 flex items-center gap-2">
            <span className="w-1 h-3 rounded-full bg-emerald" />
            Application Classification
          </h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={appData} dataKey="value" cx="50%" cy="50%"
                  innerRadius={50} outerRadius={78} paddingAngle={2} strokeWidth={0}>
                  {appData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5 max-h-[180px] overflow-y-auto pr-2">
              {appData.slice(0, 10).map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs group">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-graphite-400 group-hover:text-graphite-300 transition-colors">{d.name}</span>
                  </span>
                  <span className="font-mono text-graphite-500 tabular-nums">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Traffic Timeline */}
      {timeline.length > 0 && (
        <motion.div {...fadeUp} transition={{ delay: 0.35 }}
          className="bg-graphite-900 border border-graphite-700/30 rounded-xl p-5">
          <h3 className="text-sm font-medium text-graphite-300 mb-4 flex items-center gap-2">
            <span className="w-1 h-3 rounded-full bg-amber" />
            Traffic Timeline
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={timeline}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="timestamp" tick={false} axisLine={false} />
              <YAxis tick={{ fill: 'black', fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#areaGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Detected SNIs */}
      <motion.div {...fadeUp} transition={{ delay: 0.4 }}
        className="bg-graphite-900 border border-graphite-700/30 rounded-xl p-5">
        <h3 className="text-sm font-medium text-graphite-300 mb-3 flex items-center gap-2">
          <span className="w-1 h-3 rounded-full bg-purple-500" />
          Detected SNI Domains
          <span className="text-[10px] font-mono text-graphite-600 ml-auto">{(stats.topSnis || []).length} domains</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {(stats.topSnis || []).map((sni, i) => (
            <motion.span key={sni}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.02 }}
              className="px-3 py-1.5 text-xs font-mono bg-graphite-800 border border-graphite-700/30 rounded-lg text-graphite-400 hover:text-accent hover:border-accent/30 transition-colors cursor-default">
              {sni}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
