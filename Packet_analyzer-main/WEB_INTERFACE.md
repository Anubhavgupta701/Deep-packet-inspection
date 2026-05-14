# DPI Analyzer - Observability Layer

This directory contains a polished frontend and backend designed to interface with the C++ DPI engine.

## Structure

- `frontend/`: React + Tailwind + Vite web interface.
- `backend/`: Node.js + Express integration layer.

## Quick Start

### 1. Start the Backend
```bash
cd backend
npm install
npm start
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

## Integration with C++ Engine

The backend interfaces with the C++ engine in two ways:
1. **Live Stats**: It captures the engine's console output (STDOUT) to get real-time packet counts and drop rates.
2. **Packet Analysis**: It parses the engine's output PCAP files to provide the "Packet Stream" and "Session Explorer" views.
3. **Blocking Rules**: It can generate and manage the rules file consumed by the engine.

## Features

- **Operational Dashboard**: Real-time traffic charts and protocol distribution.
- **Packet Stream**: Live view of every intercepted packet with SNI detection.
- **Session Explorer**: Deep dive into flows, identifying applications and traffic volume.
- **AI Assistant**: Contextual explanation of packets and sessions for easier analysis.
- **Engine Control**: Start/Stop the C++ engine directly from the web UI.
