import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api.js';

const SUGGESTIONS = [
  { q: 'What is SNI and how does the engine extract it?', icon: '🔐' },
  { q: 'How does five-tuple flow tracking work?', icon: '⟐' },
  { q: 'Explain the multi-threaded architecture', icon: '⚡' },
  { q: 'How does the blocking system work?', icon: '⊘' },
  { q: 'What protocols can the engine classify?', icon: '◈' },
];

export default function AiAssistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Welcome to the DPI Analysis Assistant. I can explain packets, sessions, protocols, and how the engine works. Try asking a question or use the quick actions below.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function send(question) {
    const q = question || input;
    if (!q.trim()) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const data = await api.askAi(q);
      setMessages(m => [...m, { role: 'assistant', text: data.answer }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'Could not reach the backend. Make sure the server is running on port 4000.', error: true }]);
    }
    setLoading(false);
  }

  async function explainPacket() {
    const id = prompt('Enter packet ID (number):');
    if (id === null || id === '') return;
    setMessages(m => [...m, { role: 'user', text: `Explain packet #${id}` }]);
    setLoading(true);
    try {
      const data = await api.explainPacket(parseInt(id));
      setMessages(m => [...m, { role: 'assistant', text: data.explanation }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'Packet not found or backend unreachable.', error: true }]);
    }
    setLoading(false);
  }

  async function explainSession() {
    const id = prompt('Enter session ID (number):');
    if (id === null || id === '') return;
    setMessages(m => [...m, { role: 'user', text: `Explain session #${id}` }]);
    setLoading(true);
    try {
      const data = await api.explainSession(parseInt(id));
      setMessages(m => [...m, { role: 'assistant', text: data.explanation }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'Session not found or backend unreachable.', error: true }]);
    }
    setLoading(false);
  }

  function clearChat() {
    setMessages([{ role: 'assistant', text: 'Chat cleared. Ask me anything about your DPI engine data.' }]);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-graphite-200 tracking-tight">AI Analyst</h2>
          <p className="text-xs sm:text-sm text-graphite-500">Contextual explanations for packets, sessions, and DPI concepts</p>
        </div>
        <button onClick={clearChat}
          className="px-3 py-1.5 text-xs bg-graphite-800 border border-graphite-700/40 rounded-lg text-graphite-500 hover:text-graphite-300 hover:border-graphite-600 transition-colors shrink-0">
          Clear Chat
        </button>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        <button onClick={explainPacket}
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs bg-graphite-900 border border-graphite-700/40 rounded-lg text-graphite-400 hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all duration-200 shrink-0">
          <span className="text-sm">⟐</span> Explain Packet
        </button>
        <button onClick={explainSession}
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs bg-graphite-900 border border-graphite-700/40 rounded-lg text-graphite-400 hover:text-emerald hover:border-emerald/30 hover:bg-emerald/5 transition-all duration-200 shrink-0">
          <span className="text-sm">⊡</span> Explain Session
        </button>
      </div>

      {/* Chat area */}
      <div ref={chatRef}
        className="flex-1 overflow-y-auto bg-graphite-900 border border-graphite-700/30 rounded-xl p-3 sm:p-5 space-y-3 sm:space-y-4 mb-3 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] sm:max-w-[75%] rounded-xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-accent/10 text-accent border border-accent/15 px-3 sm:px-4 py-2 sm:py-3'
                  : msg.error
                    ? 'bg-rose/5 text-rose/80 border border-rose/15 px-3 sm:px-4 py-2 sm:py-3'
                    : 'bg-graphite-800/80 text-graphite-300 border border-graphite-700/30 px-3 sm:px-4 py-2 sm:py-3'
              }`}>
                {msg.role === 'assistant' && !msg.error && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-[10px] uppercase tracking-wider text-graphite-500 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    DPI Analyst
                  </div>
                )}
                <div className="whitespace-pre-wrap break-words">{msg.text}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-graphite-800/80 border border-graphite-700/30 rounded-xl px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-graphite-500 ml-1">Analyzing…</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Suggestions — horizontally scrollable on mobile */}
      <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1 -mx-1 px-1">
        {SUGGESTIONS.map(s => (
          <button key={s.q} onClick={() => send(s.q)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] bg-graphite-900 border border-graphite-700/30 rounded-lg text-graphite-500 hover:text-graphite-300 hover:border-graphite-600/50 transition-all duration-200 shrink-0 max-w-[220px] sm:max-w-[260px]">
            <span className="shrink-0">{s.icon}</span>
            <span className="truncate">{s.q}</span>
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about packets, sessions, protocols…"
          className="flex-1 bg-graphite-800 border border-graphite-700/40 rounded-xl px-3 sm:px-4 py-2.5 text-sm text-graphite-300 placeholder:text-graphite-600 outline-none focus:border-accent/40 transition-colors min-w-0" />
        <button onClick={() => send()} disabled={loading || !input.trim()}
          className="px-4 sm:px-5 py-2.5 bg-accent hover:bg-accent-dim text-white text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-accent/10 hover:shadow-accent/20 shrink-0">
          Send
        </button>
      </div>
    </div>
  );
}
