const router = require('express').Router();
const dpi = require('../services/dpiConnector');

// GET /api/sessions — all sessions (flows grouped by five-tuple)
router.get('/', (_req, res) => {
  try {
    const packets = dpi.parsePcapFile();
    const sessions = dpi.buildSessions(packets);
    res.json({ total: sessions.length, sessions });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/sessions/:id — single session with its packet IDs
router.get('/:id', (req, res) => {
  try {
    const packets = dpi.parsePcapFile();
    const sessions = dpi.buildSessions(packets);
    const sess = sessions[parseInt(req.params.id)];
    if (!sess) return res.status(404).json({ error: 'Session not found' });
    // Attach full packet objects for the session detail view
    sess.packetDetails = sess.packets.map(pid => packets[pid]).filter(Boolean);
    res.json(sess);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
