// Backend/index.js
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// TODO: להחליף בשאילתות אמיתיות ל־DB שלך
async function getCoreMetrics() {
  // כאן בעתיד תעשה SELECT מה־Postgres / DB אחר
  return {
    totalLeads: 128,
    totalMeetings: 42,
    totalSales: 17,
    lastUpdated: new Date().toISOString(),
  };
}

app.get('/api/home/summary', async (req, res) => {
  try {
    const metrics = await getCoreMetrics();
    res.json(metrics);
  } catch (err) {
    console.error('Failed to load metrics', err);
    res.status(500).json({ message: 'Failed to load metrics' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
