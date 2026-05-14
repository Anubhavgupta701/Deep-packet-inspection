const router = require('express').Router();
const dpi = require('../services/dpiConnector');

// GET /api/stats — overview stats from the most recent engine run
router.get('/', (_req, res) => {
  try {
    const packets = dpi.parsePcapFile(dpi.DEFAULT_INPUT_PCAP);
    const sessions = dpi.buildSessions(packets);

    const protoCounts = { TCP: 0, UDP: 0, Other: 0 };
    const appCounts = {};
    let totalBytes = 0;

    for (const p of packets) {
      protoCounts[p.protocol] = (protoCounts[p.protocol] || 0) + 1;
      appCounts[p.appType] = (appCounts[p.appType] || 0) + 1;
      totalBytes += p.length;
    }

    res.json({
      totalPackets: packets.length,
      totalBytes,
      totalSessions: sessions.length,
      protocolDistribution: protoCounts,
      applicationBreakdown: appCounts,
      topSnis: [...new Set(packets.filter(p => p.sni).map(p => p.sni))].slice(0, 20),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/stats/timeline — packet counts bucketed by timestamp
router.get('/timeline', (_req, res) => {
  try {
    const packets = dpi.parsePcapFile();
    const buckets = {};
    for (const p of packets) {
      const sec = Math.floor(p.timestamp);
      buckets[sec] = (buckets[sec] || 0) + 1;
    }
    const timeline = Object.entries(buckets)
      .map(([ts, count]) => ({ timestamp: Number(ts), count }))
      .sort((a, b) => a.timestamp - b.timestamp);
    res.json(timeline);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
