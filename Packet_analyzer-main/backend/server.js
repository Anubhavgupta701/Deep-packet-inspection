const express = require('express');
const cors = require('cors');

const statsRoutes = require('./routes/stats');
const packetsRoutes = require('./routes/packets');
const sessionsRoutes = require('./routes/sessions');
const rulesRoutes = require('./routes/rules');
const engineRoutes = require('./routes/engine');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/stats', statsRoutes);
app.use('/api/packets', packetsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/engine', engineRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`DPI Observability Backend on http://localhost:${PORT}`);
});
