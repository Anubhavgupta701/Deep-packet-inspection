const router = require('express').Router();
const dpi = require('../services/dpiConnector');

// GET /api/packets — list all parsed packets (with optional limit/offset)
router.get('/', (req, res) => {
  try {
    const packets = dpi.parsePcapFile();
    const limit = parseInt(req.query.limit) || 200;
    const offset = parseInt(req.query.offset) || 0;
    res.json({
      total: packets.length,
      packets: packets.slice(offset, offset + limit),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/packets/:id — single packet detail
router.get('/:id', (req, res) => {
  try {
    const packets = dpi.parsePcapFile();
    const pkt = packets[parseInt(req.params.id)];
    if (!pkt) return res.status(404).json({ error: 'Packet not found' });
    res.json(pkt);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
