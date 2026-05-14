const BASE = import.meta.env.VITE_API_URL || '/api';

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function del(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export const api = {
  getStats: () => get('/stats'),
  getTimeline: () => get('/stats/timeline'),
  getPackets: (limit = 200, offset = 0) => get(`/packets?limit=${limit}&offset=${offset}`),
  getPacket: (id) => get(`/packets/${id}`),
  getSessions: () => get('/sessions'),
  getSession: (id) => get(`/sessions/${id}`),
  getRules: () => get('/rules'),
  blockIp: (ip) => post('/rules/block-ip', { ip }),
  blockApp: (app) => post('/rules/block-app', { app }),
  blockDomain: (domain) => post('/rules/block-domain', { domain }),
  unblock: (type, value) => del('/rules/unblock', { type, value }),
  getEngineStatus: () => get('/engine/status'),
  runEngine: (opts) => post('/engine/run', opts),
  explainPacket: (packetId) => post('/ai/explain-packet', { packetId }),
  explainSession: (sessionId) => post('/ai/explain-session', { sessionId }),
  askAi: (question) => post('/ai/ask', { question }),
};
