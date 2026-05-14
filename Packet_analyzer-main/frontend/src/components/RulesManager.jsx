import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api.js';

const RULE_TYPES = [
  { key: 'ip', label: 'Block IP', placeholder: '192.168.1.100', icon: '⊘', color: '#f43f5e' },
  { key: 'app', label: 'Block App', placeholder: 'YOUTUBE', icon: '⊗', color: '#f59e0b' },
  { key: 'domain', label: 'Block Domain', placeholder: 'example.com', icon: '⊝', color: '#8b5cf6' },
];

function RuleTag({ type, value, onRemove }) {
  const colors = { ip: '#f43f5e', app: '#f59e0b', domain: '#8b5cf6' };
  const c = colors[type] || '#5a6370';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
      className="group flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 hover:shadow-lg"
      style={{ background: c + '08', borderColor: c + '25' }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c }} />
      <span className="text-xs uppercase tracking-wider font-medium" style={{ color: c + 'aa' }}>{type}</span>
      <span className="font-mono text-sm text-graphite-300 break-all min-w-0">{value}</span>
      <button onClick={onRemove}
        className="ml-auto w-5 h-5 rounded flex items-center justify-center text-graphite-600 opacity-0 group-hover:opacity-100 hover:text-rose hover:bg-rose/10 transition-all text-xs shrink-0">
        ✕
      </button>
    </motion.div>
  );
}

export default function RulesManager() {
  const [rules, setRules] = useState({ blockedIps: [], blockedApps: [], blockedDomains: [], blockedPorts: [] });
  const [activeType, setActiveType] = useState('ip');
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api.getRules().then(setRules).catch(() => {});
  }, []);

  const totalRules = rules.blockedIps.length + rules.blockedApps.length + rules.blockedDomains.length;

  async function addRule() {
    if (!inputVal.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      let result;
      if (activeType === 'ip') result = await api.blockIp(inputVal.trim());
      else if (activeType === 'app') result = await api.blockApp(inputVal.trim().toUpperCase());
      else if (activeType === 'domain') result = await api.blockDomain(inputVal.trim().toLowerCase());
      setRules(result);
      setInputVal('');
      setStatus({ type: 'success', msg: `Added ${activeType} rule: ${inputVal.trim()}` });
    } catch (e) {
      setStatus({ type: 'error', msg: e.message });
    }
    setLoading(false);
  }

  async function removeRule(type, value) {
    try {
      const result = await api.unblock(type, value);
      setRules(result);
      setStatus({ type: 'success', msg: `Removed ${type} rule: ${value}` });
    } catch (e) {
      setStatus({ type: 'error', msg: e.message });
    }
  }

  const activeConfig = RULE_TYPES.find(r => r.key === activeType);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-graphite-200">Rule Manager</h2>
        <p className="text-xs sm:text-sm text-graphite-500">
          Manage blocking rules — {totalRules} active rule{totalRules !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Add Rule Panel */}
      <div className="bg-graphite-900 border border-graphite-700/40 rounded-lg p-4 sm:p-5">
        <h3 className="text-sm font-medium text-graphite-300 mb-3 sm:mb-4">Add New Rule</h3>

        {/* Rule type selector */}
        <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
          {RULE_TYPES.map(rt => (
            <button key={rt.key} onClick={() => { setActiveType(rt.key); setInputVal(''); }}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
                activeType === rt.key
                  ? 'border-opacity-40 shadow-lg'
                  : 'bg-graphite-800 border-graphite-700/40 text-graphite-500 hover:text-graphite-300 hover:border-graphite-600'
              }`}
              style={activeType === rt.key ? {
                background: rt.color + '12', borderColor: rt.color + '40', color: rt.color
              } : {}}>
              <span className="text-sm sm:text-base">{rt.icon}</span>
              <span className="hidden xs:inline">{rt.label}</span>
              <span className="xs:hidden">{rt.key.toUpperCase()}</span>
            </button>
          ))}
        </div>

        {/* Input row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input value={inputVal} onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRule()}
              placeholder={activeConfig.placeholder}
              className="w-full bg-graphite-800 border border-graphite-700/50 rounded-lg px-4 py-2.5 text-sm text-graphite-300 placeholder:text-graphite-600 outline-none focus:border-accent/50 font-mono transition-colors" />
          </div>
          <button onClick={addRule} disabled={loading || !inputVal.trim()}
            className="px-5 py-2.5 bg-accent hover:bg-accent-dim text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-accent/20 hover:shadow-accent/30 shrink-0">
            {loading ? 'Adding…' : 'Add Rule'}
          </button>
        </div>

        {/* Status feedback */}
        <AnimatePresence>
          {status && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`mt-3 text-xs px-3 py-2 rounded-md ${
                status.type === 'success' ? 'bg-emerald/10 text-emerald border border-emerald/20' : 'bg-rose/10 text-rose border border-rose/20'
              }`}>
              {status.msg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Blocked IPs */}
        <div className="bg-graphite-900 border border-graphite-700/40 rounded-lg p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-graphite-300">Blocked IPs</h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose/10 text-rose">{rules.blockedIps.length}</span>
          </div>
          <div className="space-y-1.5">
            <AnimatePresence>
              {rules.blockedIps.map(ip => (
                <RuleTag key={ip} type="ip" value={ip} onRemove={() => removeRule('ip', ip)} />
              ))}
            </AnimatePresence>
            {rules.blockedIps.length === 0 && (
              <p className="text-xs text-graphite-600 py-4 text-center">No blocked IPs</p>
            )}
          </div>
        </div>

        {/* Blocked Apps */}
        <div className="bg-graphite-900 border border-graphite-700/40 rounded-lg p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-graphite-300">Blocked Apps</h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber/10 text-amber">{rules.blockedApps.length}</span>
          </div>
          <div className="space-y-1.5">
            <AnimatePresence>
              {rules.blockedApps.map(app => (
                <RuleTag key={app} type="app" value={app} onRemove={() => removeRule('app', app)} />
              ))}
            </AnimatePresence>
            {rules.blockedApps.length === 0 && (
              <p className="text-xs text-graphite-600 py-4 text-center">No blocked apps</p>
            )}
          </div>
        </div>

        {/* Blocked Domains */}
        <div className="bg-graphite-900 border border-graphite-700/40 rounded-lg p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-graphite-300">Blocked Domains</h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">{rules.blockedDomains.length}</span>
          </div>
          <div className="space-y-1.5">
            <AnimatePresence>
              {rules.blockedDomains.map(d => (
                <RuleTag key={d} type="domain" value={d} onRemove={() => removeRule('domain', d)} />
              ))}
            </AnimatePresence>
            {rules.blockedDomains.length === 0 && (
              <p className="text-xs text-graphite-600 py-4 text-center">No blocked domains</p>
            )}
          </div>
        </div>
      </div>

      {/* Info panel */}
      <div className="bg-graphite-900/50 border border-graphite-700/20 rounded-lg px-4 sm:px-5 py-3 sm:py-4">
        <p className="text-xs text-graphite-500 leading-relaxed">
          <span className="text-graphite-400 font-medium">How it works:</span> Rules correspond to the C++ DPI engine's
          RuleManager — blocking by IP (exact match), application type (e.g. YOUTUBE, NETFLIX), or SNI domain.
          When the engine runs with these rules, matching packets are dropped before being written to the output PCAP.
        </p>
      </div>
    </div>
  );
}
