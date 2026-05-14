import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api.js';

function StatusDot({ active, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`relative w-2.5 h-2.5 rounded-full ${active ? 'bg-emerald' : 'bg-graphite-600'}`}>
        {active && (
          <span className="absolute inset-0 rounded-full bg-emerald animate-ping opacity-30" />
        )}
      </span>
      <span className="text-xs text-graphite-400">{label}</span>
    </div>
  );
}

export default function EngineControl() {
  const [status, setStatus] = useState(null);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState(null);
  const [err, setErr] = useState(null);
  const [rules, setRules] = useState(null);
  const outputRef = useRef(null);

  useEffect(() => {
    api.getEngineStatus().then(setStatus).catch(e => setErr(e.message));
    api.getRules().then(setRules).catch(() => {});
  }, []);

  async function runEngine() {
    setRunning(true);
    setOutput(null);
    setErr(null);
    try {
      const blockArgs = {};
      if (rules) {
        if (rules.blockedApps.length) blockArgs.blockApps = rules.blockedApps;
        if (rules.blockedIps.length) blockArgs.blockIps = rules.blockedIps;
        if (rules.blockedDomains.length) blockArgs.blockDomains = rules.blockedDomains;
      }
      const result = await api.runEngine(blockArgs);
      setOutput(result);
    } catch (e) {
      setErr(e.message);
    }
    setRunning(false);
  }

  useEffect(() => {
    if (output && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const totalRuleCount = rules
    ? rules.blockedIps.length + rules.blockedApps.length + rules.blockedDomains.length
    : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-graphite-200">Engine Control</h2>
        <p className="text-xs sm:text-sm text-graphite-500">Monitor and run the C++ DPI engine</p>
      </div>

      {/* Status Panel */}
      <div className="bg-graphite-900 border border-graphite-700/40 rounded-lg p-4 sm:p-5">
        <h3 className="text-sm font-medium text-graphite-300 mb-3 sm:mb-4">Engine Status</h3>
        {err && !status && (
          <div className="text-xs text-rose bg-rose/10 border border-rose/20 rounded-md px-3 py-2 mb-3">
            {err}
          </div>
        )}
        {status ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-2">
              <StatusDot active={status.engineAvailable} label={status.simulationMode ? 'Simulation Mode' : 'Engine Binary'} />
              <p className="text-[10px] font-mono text-graphite-600 truncate pl-5" title={status.enginePath}>
                {status.simulationMode ? 'sample data' : (status.enginePath?.split(/[/\\]/).pop() || '—')}
              </p>
            </div>
            <div className="space-y-2">
              <StatusDot active={status.inputPcapAvailable} label="Input Data" />
              <p className="text-[10px] font-mono text-graphite-600 truncate pl-5" title={status.inputPcap}>
                {status.simulationMode ? 'sample_packets.json' : (status.inputPcap?.split(/[/\\]/).pop() || '—')}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                <span className="text-xs text-graphite-400">Active Rules</span>
              </div>
              <p className="text-[10px] font-mono text-graphite-600 pl-5">
                {totalRuleCount} rule{totalRuleCount !== 1 ? 's' : ''} configured
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${running ? 'bg-amber animate-pulse' : 'bg-graphite-600'}`} />
                <span className="text-xs text-graphite-400">Run State</span>
              </div>
              <p className="text-[10px] font-mono text-graphite-600 pl-5">
                {running ? 'Processing…' : 'Idle'}
              </p>
            </div>
          </div>
        ) : !err ? (
          <div className="text-graphite-500 text-sm animate-pulse">Checking engine status…</div>
        ) : null}
      </div>

      {/* Run Panel */}
      <div className="bg-graphite-900 border border-graphite-700/40 rounded-lg p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-medium text-graphite-300">
              Run Engine
              {status?.simulationMode && (
                <span className="ml-2 px-2 py-0.5 text-[10px] font-mono bg-amber/10 text-amber border border-amber/20 rounded">
                  simulation
                </span>
              )}
            </h3>
            <p className="text-xs text-graphite-500 mt-0.5">
              {status?.simulationMode
                ? 'Analyze sample packet data with current blocking rules'
                : 'Execute the DPI engine with current blocking rules applied'}
            </p>
          </div>
          <button onClick={runEngine}
            disabled={running || !status?.engineAvailable}
            className={`relative px-5 sm:px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 shrink-0 w-full sm:w-auto ${
              running
                ? 'bg-amber/20 text-amber border border-amber/30 cursor-wait'
                : status?.engineAvailable
                  ? 'bg-gradient-to-r from-accent to-accent-dim text-white shadow-lg shadow-accent/20 hover:shadow-accent/30 hover:scale-[1.02]'
                  : 'bg-graphite-800 text-graphite-600 border border-graphite-700/40 cursor-not-allowed'
            }`}>
            {running && (
              <span className="absolute inset-0 rounded-lg bg-amber/10 animate-pulse" />
            )}
            <span className="relative flex items-center justify-center gap-2">
              {running ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                      strokeDasharray="31.416" strokeDashoffset="10" />
                  </svg>
                  Running…
                </>
              ) : '▶ Run Analysis'}
            </span>
          </button>
        </div>

        {/* Rules summary for this run */}
        {totalRuleCount > 0 && (
          <div className="mb-4 px-3 py-2.5 bg-graphite-800/60 rounded-lg border border-graphite-700/30">
            <p className="text-[11px] text-graphite-500 mb-1.5 uppercase tracking-wider font-medium">Rules Applied</p>
            <div className="flex flex-wrap gap-1.5">
              {(rules?.blockedIps || []).map(ip => (
                <span key={ip} className="px-2 py-0.5 text-[10px] font-mono bg-rose/8 text-rose/80 border border-rose/15 rounded">
                  IP: {ip}
                </span>
              ))}
              {(rules?.blockedApps || []).map(app => (
                <span key={app} className="px-2 py-0.5 text-[10px] font-mono bg-amber/8 text-amber/80 border border-amber/15 rounded">
                  APP: {app}
                </span>
              ))}
              {(rules?.blockedDomains || []).map(d => (
                <span key={d} className="px-2 py-0.5 text-[10px] font-mono bg-purple-500/8 text-purple-400/80 border border-purple-500/15 rounded">
                  SNI: {d}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Output Panel */}
      <AnimatePresence>
        {output && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-graphite-900 border border-graphite-700/40 rounded-lg overflow-hidden">
            <div className="px-4 sm:px-5 py-3 border-b border-graphite-700/40 flex items-center justify-between">
              <h3 className="text-sm font-medium text-graphite-300">Engine Output</h3>
              {output.exitCode !== undefined && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  output.exitCode === 0 ? 'bg-emerald/10 text-emerald' : 'bg-rose/10 text-rose'
                }`}>
                  exit: {output.exitCode}
                </span>
              )}
            </div>
            <div ref={outputRef}
              className="p-3 sm:p-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto font-mono text-xs text-graphite-400 whitespace-pre-wrap leading-relaxed bg-graphite-950/50 break-all">
              {output.stdout || output.output || JSON.stringify(output, null, 2)}
            </div>
            {output.stderr && (
              <div className="px-3 sm:px-4 py-3 border-t border-graphite-700/40 font-mono text-xs text-rose/80 whitespace-pre-wrap break-all">
                {output.stderr}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {err && output === null && (
        <div className="bg-rose/5 border border-rose/20 rounded-lg px-4 sm:px-5 py-3 sm:py-4 text-sm text-rose">
          {err}
        </div>
      )}

      {/* Info */}
      <div className="bg-graphite-900/50 border border-graphite-700/20 rounded-lg px-4 sm:px-5 py-3 sm:py-4">
        <p className="text-xs text-graphite-500 leading-relaxed">
          <span className="text-graphite-400 font-medium">How it works:</span>{' '}
          {status?.simulationMode ? (
            <>This panel runs a simulated DPI analysis against pre-captured sample packet data.
            Your configured blocking rules are applied to classify and filter packets.
            Results include application breakdown, SNI detection, and blocked packet details.
            <span className="text-amber/60 ml-1">(Simulation mode — no native engine binary on this server)</span></>
          ) : (
            <>This panel spawns the C++ DPI engine binary
            (<code className="text-graphite-400 text-[11px]">dpi_engine.exe</code>) with your configured blocking rules as CLI arguments.
            The engine reads the input PCAP, applies DPI classification and rule matching, then produces filtered output.
            Results are displayed in real-time after processing completes.</>
          )}
        </p>
      </div>
    </div>
  );
}
