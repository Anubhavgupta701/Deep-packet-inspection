const router = require('express').Router();
const fs = require('fs');
const dpi = require('../services/dpiConnector');

// GET /api/engine/status — check if engine exe exists and is ready
router.get('/status', (_req, res) => {
  const engineExists = fs.existsSync(dpi.ENGINE_PATH);
  const inputExists = fs.existsSync(dpi.DEFAULT_INPUT_PCAP);
  res.json({
    engineAvailable: engineExists,
    inputPcapAvailable: inputExists,
    enginePath: dpi.ENGINE_PATH,
    inputPcap: dpi.DEFAULT_INPUT_PCAP,
  });
});

// POST /api/engine/run — run the engine with optional blocking args
router.post('/run', async (req, res) => {
  try {
    const { blockApps = [], blockIps = [], blockDomains = [] } = req.body;
    const args = [];
    for (const app of blockApps) args.push('--block-app', app);
    for (const ip of blockIps) args.push('--block-ip', ip);
    for (const dom of blockDomains) args.push('--block-domain', dom);

    const result = await dpi.runEngine(null, null, args);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
