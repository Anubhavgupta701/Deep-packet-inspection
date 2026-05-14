const router = require('express').Router();
const dpi = require('../services/dpiConnector');

/**
 * AI Assistant endpoint.
 * Provides contextual explanations for packets, sessions, and protocols.
 * This is a local, rule-based assistant — NOT a cloud AI call.
 * It uses the engine's own data structures to generate helpful explanations.
 */

const PROTO_EXPLANATIONS = {
  TCP: 'TCP (Transmission Control Protocol) provides reliable, ordered delivery of data. It uses a three-way handshake (SYN → SYN-ACK → ACK) to establish connections.',
  UDP: 'UDP (User Datagram Protocol) is a connectionless protocol. It is faster than TCP but does not guarantee delivery. Commonly used for DNS queries and real-time streaming.',
  DNS: 'DNS (Domain Name System) translates human-readable domain names into IP addresses. Queries typically use UDP port 53.',
  HTTP: 'HTTP (Hypertext Transfer Protocol) is the foundation of web communication. Traffic on port 80 is unencrypted — the Host header reveals the destination domain.',
  HTTPS: 'HTTPS uses TLS encryption over TCP port 443. The Server Name Indication (SNI) in the TLS Client Hello reveals the target domain before encryption begins.',
  TLS: 'TLS (Transport Layer Security) encrypts data between client and server. The DPI engine extracts the SNI from the Client Hello to identify the destination without decrypting traffic.',
};

const APP_EXPLANATIONS = {
  YouTube: 'YouTube traffic identified via SNI containing "youtube" or "ytimg". Classified as AppType::YOUTUBE by sniToAppType().',
  Google: 'Google services detected via patterns like "google", "gstatic", "googleapis". Many Google sub-services share these CDN domains.',
  Facebook: 'Facebook/Meta traffic detected via "facebook", "fbcdn", "meta.com". Instagram and WhatsApp are separate classifications.',
  Netflix: 'Netflix streaming traffic identified via "netflix", "nflxvideo". Typically high-bandwidth HTTPS connections.',
  Discord: 'Discord traffic detected via "discord" or "discordapp" domains. Uses WebSocket connections over HTTPS for real-time chat.',
  GitHub: 'GitHub traffic identified via "github" or "githubusercontent" SNI patterns.',
};

function explainTcpFlags(flags) {
  if (!flags) return '';
  if (flags === 'SYN') return 'This is a TCP SYN packet — the first step of the three-way handshake. The client is initiating a new connection.';
  if (flags === 'SYN,ACK') return 'This is a SYN-ACK response — the server is acknowledging the connection request and completing the second step of the handshake.';
  if (flags === 'ACK') return 'This is a TCP ACK (acknowledgment). It confirms receipt of data or completes the three-way handshake.';
  if (flags.includes('PSH')) return 'The PSH (Push) flag indicates this packet carries application data that should be delivered immediately — likely a TLS Client Hello or HTTP request.';
  if (flags.includes('FIN')) return 'The FIN flag indicates the sender is closing the connection gracefully.';
  if (flags.includes('RST')) return 'The RST flag forcefully terminates the connection — this could indicate a rejected connection or a blocked flow.';
  return `TCP flags: ${flags}`;
}

// POST /api/ai/explain-packet
router.post('/explain-packet', (req, res) => {
  const { packetId } = req.body;
  try {
    const packets = dpi.parsePcapFile();
    const pkt = packets[packetId];
    if (!pkt) return res.status(404).json({ error: 'Packet not found' });

    const lines = [];
    lines.push(`**Packet #${pkt.id}** — ${pkt.srcIp}:${pkt.srcPort} → ${pkt.dstIp}:${pkt.dstPort}`);
    lines.push(PROTO_EXPLANATIONS[pkt.protocol] || '');
    lines.push(explainTcpFlags(pkt.tcpFlags));
    if (pkt.sni) lines.push(`**SNI detected:** \`${pkt.sni}\` → classified as **${pkt.appType}** by the DPI engine's sniToAppType() function.`);
    if (pkt.dstPort === 443 && !pkt.sni) lines.push('This packet is headed to port 443 (HTTPS) but no SNI was extracted — it may not be a Client Hello packet.');
    lines.push(`Packet size: ${pkt.length} bytes, Payload: ${pkt.payloadLength} bytes, TTL: ${pkt.ttl}`);

    res.json({ explanation: lines.filter(Boolean).join('\n\n') });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ai/explain-session
router.post('/explain-session', (req, res) => {
  const { sessionId } = req.body;
  try {
    const packets = dpi.parsePcapFile();
    const sessions = dpi.buildSessions(packets);
    const sess = sessions[sessionId];
    if (!sess) return res.status(404).json({ error: 'Session not found' });

    const lines = [];
    lines.push(`**Session** — ${sess.srcIp}:${sess.srcPort} → ${sess.dstIp}:${sess.dstPort} (${sess.protocol})`);
    lines.push(`This flow contains **${sess.packetCount} packets** totaling **${sess.totalBytes} bytes**.`);
    lines.push(`Connection state: **${sess.state}**`);
    if (sess.sni) {
      lines.push(`The DPI engine classified this flow as **${sess.appType}** based on the SNI: \`${sess.sni}\`.`);
      lines.push(APP_EXPLANATIONS[sess.appType] || '');
    }
    const duration = sess.lastSeen - sess.firstSeen;
    if (duration > 0) lines.push(`Session duration: ${duration.toFixed(1)}s`);

    res.json({ explanation: lines.filter(Boolean).join('\n\n') });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ai/ask — free-form question about DPI concepts
router.post('/ask', (req, res) => {
  const { question } = req.body;
  const q = (question || '').toLowerCase();

  let answer = 'I can explain packets, sessions, protocols, SNI extraction, and blocking rules from your DPI engine. Try asking about a specific packet or session.';

  if (q.includes('sni')) answer = PROTO_EXPLANATIONS.TLS + '\n\nThe SNI is extracted from the first bytes of a TLS connection before encryption begins. This is how the DPI engine identifies HTTPS traffic without decrypting it.';
  else if (q.includes('block')) answer = 'The engine supports blocking by IP address, application type, and domain pattern. When a flow is blocked, all subsequent packets of that connection are dropped. The first few packets (SYN, SYN-ACK, ACK) may pass before the SNI is seen.';
  else if (q.includes('five-tuple') || q.includes('5-tuple') || q.includes('flow')) answer = 'A five-tuple (src_ip, dst_ip, src_port, dst_port, protocol) uniquely identifies a network connection. The engine uses consistent hashing on the five-tuple to distribute packets to Fast Path threads, ensuring all packets of the same flow are processed by the same thread.';
  else if (q.includes('thread') || q.includes('fast path') || q.includes('load balancer')) answer = 'The multi-threaded engine uses a Reader → Load Balancers → Fast Path architecture. LBs distribute packets via consistent hashing. Each FP thread has its own connection tracker and performs SNI extraction, rule checking, and forwarding decisions independently.';
  else if (q.includes('pcap')) answer = 'PCAP files are binary captures of network traffic. The engine reads a 24-byte global header followed by packet records (16-byte header + variable-length data). Each packet contains Ethernet → IP → TCP/UDP → Payload layers.';

  res.json({ answer });
});

module.exports = router;
