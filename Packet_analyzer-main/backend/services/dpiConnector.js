/**
 * DPI Connector Service
 *
 * This is the central integration point between the Node.js backend
 * and the C++ DPI engine. All engine data enters through here.
 *
 * HOW IT WORKS:
 * 1. parsePcapFile()    — Reads a .pcap file produced by Wireshark or the engine
 *                         and returns an array of parsed packet objects.
 * 2. parseEngineOutput()— Parses the STDOUT text report from the C++ engine
 *                         (total packets, forwarded, dropped, app breakdown).
 * 3. runEngine()        — Spawns the dpi_engine.exe process with arguments,
 *                         captures its STDOUT, and returns the result.
 * 4. buildSessions()    — Groups parsed packets by their five-tuple into
 *                         session/flow objects matching the engine's Connection struct.
 *
 * FUTURE REALTIME INTEGRATION:
 * - Replace parsePcapFile with a streaming reader that tails a live PCAP.
 * - Replace runEngine with a long-running child process that emits stats
 *   via a named pipe or TCP socket, which this service listens to.
 * - Add a WebSocket layer that pushes live packet/session updates to the frontend.
 */

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

// The project root is one level above backend/
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// Default PCAP paths (match the engine's defaults)
const DEFAULT_INPUT_PCAP = path.join(PROJECT_ROOT, 'test_dpi.pcap');
const DEFAULT_OUTPUT_PCAP = path.join(PROJECT_ROOT, 'output.pcap');
const ENGINE_PATH = path.join(PROJECT_ROOT, 'dpi_engine.exe');

// Fallback sample data for when PCAP files are unavailable (e.g. on Render)
const SAMPLE_DATA_PATH = path.join(__dirname, '..', 'data', 'sample_packets.json');
let _cachedSamplePackets = null;

function getSamplePackets() {
  if (_cachedSamplePackets) return _cachedSamplePackets;
  try {
    if (fs.existsSync(SAMPLE_DATA_PATH)) {
      _cachedSamplePackets = JSON.parse(fs.readFileSync(SAMPLE_DATA_PATH, 'utf-8'));
      console.log(`[dpiConnector] Loaded ${_cachedSamplePackets.length} sample packets from JSON fallback`);
      return _cachedSamplePackets;
    }
  } catch (e) {
    console.error('[dpiConnector] Failed to load sample data:', e.message);
  }
  return [];
}

// ─── PCAP binary constants ──────────────────────────────────
const PCAP_MAGIC = 0xa1b2c3d4;
const PCAP_GLOBAL_HEADER_LEN = 24;
const PCAP_PKT_HEADER_LEN = 16;
const ETHERNET_HEADER_LEN = 14;

// ─── AppType mapping (mirrors types.cpp sniToAppType) ───────
const SNI_APP_MAP = [
  { pattern: /youtube|ytimg|youtu\.be/i, app: 'YouTube' },
  { pattern: /google|gstatic|googleapis|ggpht|gvt1/i, app: 'Google' },
  { pattern: /facebook|fbcdn|fb\.com|fbsbx|meta\.com/i, app: 'Facebook' },
  { pattern: /instagram|cdninstagram/i, app: 'Instagram' },
  { pattern: /whatsapp|wa\.me/i, app: 'WhatsApp' },
  { pattern: /twitter|twimg|x\.com|t\.co/i, app: 'Twitter/X' },
  { pattern: /netflix|nflxvideo|nflximg/i, app: 'Netflix' },
  { pattern: /amazon|amazonaws|cloudfront|aws/i, app: 'Amazon' },
  { pattern: /microsoft|msn\.com|office|azure|live\.com|outlook|bing/i, app: 'Microsoft' },
  { pattern: /apple|icloud|mzstatic|itunes/i, app: 'Apple' },
  { pattern: /telegram|t\.me/i, app: 'Telegram' },
  { pattern: /tiktok|tiktokcdn|musical\.ly|bytedance/i, app: 'TikTok' },
  { pattern: /spotify|scdn\.co/i, app: 'Spotify' },
  { pattern: /zoom/i, app: 'Zoom' },
  { pattern: /discord|discordapp/i, app: 'Discord' },
  { pattern: /github|githubusercontent/i, app: 'GitHub' },
  { pattern: /cloudflare|cf-/i, app: 'Cloudflare' },
];

function sniToApp(sni) {
  if (!sni) return 'Unknown';
  for (const entry of SNI_APP_MAP) {
    if (entry.pattern.test(sni)) return entry.app;
  }
  return 'HTTPS';
}

// ─── PCAP Parser ─────────────────────────────────────────────
// Mirrors what pcap_reader.cpp + packet_parser.cpp do in the engine

function parsePcapFile(filePath) {
  if (!filePath) filePath = DEFAULT_INPUT_PCAP;
  if (!fs.existsSync(filePath)) return getSamplePackets();

  const buf = fs.readFileSync(filePath);
  if (buf.length < PCAP_GLOBAL_HEADER_LEN) return [];

  const magic = buf.readUInt32LE(0);
  if (magic !== PCAP_MAGIC) return [];

  const packets = [];
  let offset = PCAP_GLOBAL_HEADER_LEN;

  while (offset + PCAP_PKT_HEADER_LEN <= buf.length) {
    const tsSec = buf.readUInt32LE(offset);
    const tsUsec = buf.readUInt32LE(offset + 4);
    const inclLen = buf.readUInt32LE(offset + 8);
    offset += PCAP_PKT_HEADER_LEN;

    if (offset + inclLen > buf.length) break;

    const pktData = buf.slice(offset, offset + inclLen);
    offset += inclLen;

    const parsed = parsePacketBytes(pktData, tsSec, tsUsec, packets.length);
    if (parsed) packets.push(parsed);
  }
  return packets;
}

function parsePacketBytes(data, tsSec, tsUsec, id) {
  if (data.length < ETHERNET_HEADER_LEN) return null;

  // Ethernet
  const etherType = data.readUInt16BE(12);
  if (etherType !== 0x0800) return null; // only IPv4

  const ipStart = 14;
  if (data.length < ipStart + 20) return null;

  const versionIhl = data[ipStart];
  const ihl = (versionIhl & 0x0f) * 4;
  const protocol = data[ipStart + 9];
  const srcIp = formatIp(data, ipStart + 12);
  const dstIp = formatIp(data, ipStart + 16);
  const ttl = data[ipStart + 8];
  const totalLen = data.readUInt16BE(ipStart + 2);

  const transportStart = ipStart + ihl;
  let srcPort = 0, dstPort = 0, tcpFlags = 0;
  let protoName = protocol === 6 ? 'TCP' : protocol === 17 ? 'UDP' : 'Other';
  let payloadOffset = transportStart;

  if (protocol === 6 && data.length >= transportStart + 20) {
    srcPort = data.readUInt16BE(transportStart);
    dstPort = data.readUInt16BE(transportStart + 2);
    tcpFlags = data[transportStart + 13];
    const dataOff = (data[transportStart + 12] >> 4) * 4;
    payloadOffset = transportStart + dataOff;
  } else if (protocol === 17 && data.length >= transportStart + 8) {
    srcPort = data.readUInt16BE(transportStart);
    dstPort = data.readUInt16BE(transportStart + 2);
    payloadOffset = transportStart + 8;
  }

  // SNI extraction (mirrors sni_extractor.cpp)
  let sni = null;
  let appType = 'Unknown';
  const payloadLen = data.length - payloadOffset;

  if (protocol === 6 && dstPort === 443 && payloadLen > 10) {
    sni = extractSni(data, payloadOffset, payloadLen);
  }
  if (protocol === 6 && dstPort === 80 && payloadLen > 10) {
    sni = extractHttpHost(data, payloadOffset, payloadLen);
  }
  if (dstPort === 53 || srcPort === 53) appType = 'DNS';

  if (sni) appType = sniToApp(sni);
  else if (dstPort === 443) appType = 'HTTPS';
  else if (dstPort === 80) appType = 'HTTP';

  return {
    id,
    timestamp: tsSec + tsUsec / 1e6,
    srcIp, dstIp, srcPort, dstPort,
    protocol: protoName,
    protocolNum: protocol,
    tcpFlags: formatTcpFlags(tcpFlags),
    ttl,
    length: data.length,
    payloadLength: payloadLen > 0 ? payloadLen : 0,
    sni: sni || '',
    appType,
  };
}

function formatIp(buf, offset) {
  return `${buf[offset]}.${buf[offset+1]}.${buf[offset+2]}.${buf[offset+3]}`;
}

function formatTcpFlags(f) {
  const flags = [];
  if (f & 0x02) flags.push('SYN');
  if (f & 0x10) flags.push('ACK');
  if (f & 0x08) flags.push('PSH');
  if (f & 0x01) flags.push('FIN');
  if (f & 0x04) flags.push('RST');
  if (f & 0x20) flags.push('URG');
  return flags.join(',') || '—';
}

// Mirrors SNIExtractor::extract from sni_extractor.cpp
function extractSni(data, offset, len) {
  if (len < 10) return null;
  if (data[offset] !== 0x16) return null; // not handshake
  if (data[offset + 5] !== 0x01) return null; // not Client Hello

  let pos = offset + 43; // skip to session ID
  if (pos >= data.length) return null;
  const sessLen = data[pos]; pos += 1 + sessLen;
  if (pos + 2 > data.length) return null;
  const cipherLen = data.readUInt16BE(pos); pos += 2 + cipherLen;
  if (pos >= data.length) return null;
  const compLen = data[pos]; pos += 1 + compLen;
  if (pos + 2 > data.length) return null;
  const extLen = data.readUInt16BE(pos); pos += 2;

  const extEnd = Math.min(pos + extLen, data.length);
  while (pos + 4 <= extEnd) {
    const eType = data.readUInt16BE(pos);
    const eLen = data.readUInt16BE(pos + 2);
    pos += 4;
    if (eType === 0x0000 && eLen >= 5) {
      const sniLen = data.readUInt16BE(pos + 3);
      if (pos + 5 + sniLen <= data.length) {
        return data.slice(pos + 5, pos + 5 + sniLen).toString('ascii');
      }
    }
    pos += eLen;
  }
  return null;
}

function extractHttpHost(data, offset, len) {
  if (len < 16) return null;
  const payload = data.slice(offset, offset + Math.min(len, 2000)).toString('ascii');
  if (!/^(GET|POST|PUT|HEAD|DELETE|PATCH|OPTIONS) /i.test(payload)) return null;
  const match = payload.match(/Host:\s*([^\r\n:]+)/i);
  return match ? match[1].trim() : null;
}

// ─── Session Builder ─────────────────────────────────────────
// Groups packets by five-tuple into sessions, mirroring Connection struct

function buildSessions(packets) {
  const map = {};
  for (const pkt of packets) {
    const key = [pkt.srcIp, pkt.dstIp, pkt.srcPort, pkt.dstPort, pkt.protocol].join('|');
    if (!map[key]) {
      map[key] = {
        id: Object.keys(map).length,
        srcIp: pkt.srcIp, dstIp: pkt.dstIp,
        srcPort: pkt.srcPort, dstPort: pkt.dstPort,
        protocol: pkt.protocol,
        sni: pkt.sni,
        appType: pkt.appType,
        state: 'NEW',
        packetCount: 0,
        totalBytes: 0,
        firstSeen: pkt.timestamp,
        lastSeen: pkt.timestamp,
        packets: [],
      };
    }
    const sess = map[key];
    sess.packetCount++;
    sess.totalBytes += pkt.length;
    sess.lastSeen = pkt.timestamp;
    if (pkt.sni && !sess.sni) { sess.sni = pkt.sni; sess.appType = pkt.appType; }
    if (pkt.tcpFlags.includes('SYN') && pkt.tcpFlags.includes('ACK')) sess.state = 'ESTABLISHED';
    if (pkt.tcpFlags.includes('FIN')) sess.state = 'CLOSED';
    sess.packets.push(pkt.id);
  }
  return Object.values(map);
}

// ─── Engine Runner ───────────────────────────────────────────
// Spawns the C++ engine process. Matches CLI from README.

function runEngine(inputPcap, outputPcap, args = []) {
  return new Promise((resolve, reject) => {
    const engineExe = fs.existsSync(ENGINE_PATH) ? ENGINE_PATH : null;
    if (!engineExe) return reject(new Error('Engine executable not found'));

    const allArgs = [inputPcap || DEFAULT_INPUT_PCAP, outputPcap || DEFAULT_OUTPUT_PCAP, ...args];
    execFile(engineExe, allArgs, { cwd: PROJECT_ROOT, timeout: 30000 }, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve({ stdout, stderr, parsedReport: parseEngineOutput(stdout) });
    });
  });
}

// ─── Engine STDOUT Parser ────────────────────────────────────
// Parses the text report the engine prints to console

function parseEngineOutput(text) {
  const result = { totalPackets: 0, forwarded: 0, dropped: 0, apps: {}, snis: [] };
  if (!text) return result;

  const totalMatch = text.match(/Total Packets:\s*(\d+)/);
  if (totalMatch) result.totalPackets = parseInt(totalMatch[1]);
  const fwdMatch = text.match(/Forwarded:\s*(\d+)/);
  if (fwdMatch) result.forwarded = parseInt(fwdMatch[1]);
  const dropMatch = text.match(/Dropped(?:\/Blocked)?:\s*(\d+)/);
  if (dropMatch) result.dropped = parseInt(dropMatch[1]);

  const appRegex = /║\s+(\S+)\s+(\d+)\s+([\d.]+)%/g;
  let m;
  while ((m = appRegex.exec(text)) !== null) {
    result.apps[m[1]] = { count: parseInt(m[2]), pct: parseFloat(m[3]) };
  }

  const sniRegex = /- ([\w.]+) -> (\w+)/g;
  while ((m = sniRegex.exec(text)) !== null) {
    result.snis.push({ domain: m[1], app: m[2] });
  }
  return result;
}

module.exports = {
  parsePcapFile,
  buildSessions,
  runEngine,
  parseEngineOutput,
  sniToApp,
  DEFAULT_INPUT_PCAP,
  DEFAULT_OUTPUT_PCAP,
  ENGINE_PATH,
  PROJECT_ROOT,
};
