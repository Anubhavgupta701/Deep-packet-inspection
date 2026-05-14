import { useState, useEffect } from 'react';
import {api} from './api';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './components/Dashboard.jsx';
import PacketStream from './components/PacketStream.jsx';
import SessionExplorer from './components/SessionExplorer.jsx';
import RulesManager from './components/RulesManager.jsx';
import EngineControl from './components/EngineControl.jsx';
import AiAssistant from './components/AiAssistant.jsx';

const NAV = [ 
  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
  { id: 'packets', label: 'Packets', icon: '⟐' },
  { id: 'sessions', label: 'Sessions', icon: '⊡' },
  { id: 'rules', label: 'Rules', icon: '⊘' },
  { id: 'engine', label: 'Engine', icon: '⏻' },
  { id: 'ai', label: 'AI Analyst', icon: '◎' },
];

const VIEWS = {
  dashboard: Dashboard,
  packets: PacketStream,
  sessions: SessionExplorer,
  rules: RulesManager,
  engine: EngineControl,
  ai: AiAssistant,
};

export default function App() {
  const [view, setView] = useState('dashboard');
  const [time, setTime] = useState(new Date());
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const ActiveView = VIEWS[view];

  return (
    <div className="flex h-screen overflow-hidden bg-graphite-950">
      {/* Sidebar */}
      <nav className={`${collapsed ? 'w-16' : 'w-56'} shrink-0 border-r border-graphite-700/30 flex flex-col transition-all duration-300`} style={{ backgroundColor: '#a3a3a3ff' }}>
        {/* Logo area */}
        <div className="px-4 py-4 border-b border-graphite-700/30 flex items-center justify-between">
          {!collapsed && (
            <div>
              <h1 className="text-base font-semibold text-black tracking-tight flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent shadow-lg shadow-accent/40" />
                DPI Analyzer
              </h1>
              <p className="text-[10px] text-black mt-0.5 font-mono tracking-wider uppercase">Analysis By Anubhav Gupta</p>
            </div>
          )}
          {collapsed && (
            <span className="w-2 h-2 rounded-full bg-accent shadow-lg shadow-accent/40 mx-auto" />
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="text-black hover:text-black text-xs transition-colors p-1">
            {collapsed ? '▸' : '◂'}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-3 px-2 space-y-0.5">
          {NAV.map((n, i) => (
            <motion.button key={n.id}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setView(n.id)}
              title={collapsed ? n.label : undefined}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 group ${
                view === n.id
                  ? 'bg-accent/10 text-accent font-medium shadow-sm shadow-accent/5'
                  : 'text-black hover:text-black hover:bg-black/10'
              }`}>
              <span className={`text-base transition-transform duration-200 ${view === n.id ? 'scale-110' : 'group-hover:scale-105'}`}>{n.icon}</span>
              {!collapsed && n.label}
            </motion.button>
          ))}
        </div>

        {/* Footer */}
        <div className={`px-4 py-3 border-t border-graphite-700/30 ${collapsed ? 'text-center' : ''}`}>
          {!collapsed && (
            <>
              <p className="text-[10px] text-black font-mono">dpi analysis using test data</p>
              <p className="text-[10px] text-black font-mono mt-0.5">
                {time.toLocaleTimeString('en-US', { hour12: false })}
              </p>
            </>
          )}
          {collapsed && (
            <p className="text-[10px] text-black font-mono">
              {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-graphite-950">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-graphite-700/20 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-graphite-300 capitalize">{view === 'ai' ? 'AI Analyst' : view}</h2>
            <span className="w-1 h-1 rounded-full bg-graphite-700" />
            <span className="text-xs text-graphite-600 font-mono">DPI Observability</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[11px] text-graphite-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
              Backend Connected
            </span>
          </div>
        </div>

        {/* View content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div key={view}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
              <ActiveView />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
