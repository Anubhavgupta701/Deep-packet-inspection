const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const dpi = require('../services/dpiConnector');

const SAMPLE_DATA_PATH = path.join(__dirname, '..', 'data', 'sample_packets.json');

// GET /api/engine/status — check if engine exe exists and is ready
router.get('/status', (_req, res) => {
  const engineExists = fs.existsSync(dpi.ENGINE_PATH);
  const inputExists = fs.existsSync(dpi.DEFAULT_INPUT_PCAP);
  const sampleDataExists = fs.existsSync(SAMPLE_DATA_PATH);

  // Engine is "available" if the real binary exists OR we have sample data for simulation
  res.json({
    engineAvailable: engineExists || sampleDataExists,
    inputPcapAvailable: inputExists || sampleDataExists,
    enginePath: engineExists ? dpi.ENGINE_PATH : '(simulation mode)',
    inputPcap: inputExists ? dpi.DEFAULT_INPUT_PCAP : '(sample data)',
    simulationMode: !engineExists,
  });
});

// POST /api/engine/run — run the engine with optional blocking args
router.post('/run', async (req, res) => {
  try {
    const { blockApps = [], blockIps = [], blockDomains = [] } = req.body;

    // If the real engine binary exists, use it
    if (fs.existsSync(dpi.ENGINE_PATH)) {
      const args = [];
      for (const app of blockApps) args.push('--block-app', app);
      for (const ip of blockIps) args.push('--block-ip', ip);
      for (const dom of blockDomains) args.push('--block-domain', dom);

      const result = await dpi.runEngine(null, null, args);
      return res.json(result);
    }

    // ── Simulation fallback (Render / no binary) ──────────────
    // Parse sample data and produce a simulated analysis report
    let packets = [];
    try {
      packets = dpi.parsePcapFile(null);
    } catch (_e) {
      // If PCAP parsing fails, try sample JSON directly
      if (fs.existsSync(SAMPLE_DATA_PATH)) {
        packets = JSON.parse(fs.readFileSync(SAMPLE_DATA_PATH, 'utf-8'));
      }
    }
    if (!packets.length) {
      return res.status(500).json({ error: 'No packet data available for analysis' });
    }

    // Apply blocking rules to simulate filtering
    let forwarded = 0;
    let dropped = 0;
    const appCounts = {};
    const sniSet = new Set();
    const droppedDetails = [];

    for (const pkt of packets) {
      const isBlockedApp = blockApps.some(a => 
        pkt.appType && pkt.appType.toLowerCase() === a.toLowerCase()
      );
      const isBlockedIp = blockIps.includes(pkt.srcIp) || blockIps.includes(pkt.dstIp);
      const isBlockedDomain = blockDomains.some(d => 
        pkt.sni && pkt.sni.toLowerCase().includes(d.toLowerCase())
      );

      if (isBlockedApp || isBlockedIp || isBlockedDomain) {
        dropped++;
        if (droppedDetails.length < 5) {
          droppedDetails.push(`Blocked: ${pkt.srcIp}:${pkt.srcPort} → ${pkt.dstIp}:${pkt.dstPort} [${pkt.appType}]${pkt.sni ? ' (' + pkt.sni + ')' : ''}`);
        }
      } else {
        forwarded++;
      }

      appCounts[pkt.appType] = (appCounts[pkt.appType] || 0) + 1;
      if (pkt.sni) sniSet.add(pkt.sni);
    }

    // Build a realistic stdout report matching what the C++ engine produces
    const total = packets.length;
    const appLines = Object.entries(appCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => {
        const pct = ((count / total) * 100).toFixed(1);
        return `║  ${name.padEnd(16)} ${String(count).padStart(5)}   ${pct}%`;
      })
      .join('\n');

    const sniLines = [...sniSet].slice(0, 20)
      .map(s => `  - ${s} -> ${dpi.sniToApp(s)}`)
      .join('\n');

    const stdout = [
      '╔══════════════════════════════════════════╗',
      '║     DPI Engine Analysis Report           ║',
      '║     (Simulation Mode)                    ║',
      '╚══════════════════════════════════════════╝',
      '',
      `  Input:  sample_packets.json (${total} packets)`,
      `  Mode:   Simulation (no native binary)`,
      '',
      '── Packet Summary ─────────────────────────',
      `  Total Packets: ${total}`,
      `  Forwarded:     ${forwarded}`,
      `  Dropped/Blocked: ${dropped}`,
      '',
      '── Application Breakdown ──────────────────',
      appLines,
      '',
      '── Detected SNI Domains ───────────────────',
      sniLines,
      '',
    ];

    if (droppedDetails.length) {
      stdout.push('── Blocked Packets (sample) ───────────────');
      stdout.push(...droppedDetails);
      stdout.push('');
    }

    stdout.push('── Analysis Complete ──────────────────────');
    stdout.push(`  Processed ${total} packets in simulation mode.`);
    stdout.push('  Note: This ran against pre-captured sample data.');

    const output = stdout.join('\n');

    res.json({
      stdout: output,
      stderr: '',
      exitCode: 0,
      simulationMode: true,
      parsedReport: {
        totalPackets: total,
        forwarded,
        dropped,
        apps: Object.fromEntries(
          Object.entries(appCounts).map(([k, v]) => [k, { count: v, pct: parseFloat(((v / total) * 100).toFixed(1)) }])
        ),
        snis: [...sniSet].map(s => ({ domain: s, app: dpi.sniToApp(s) })),
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
