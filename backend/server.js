// server.js — Run: npm i express pg dotenv  |  node server.js
const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config(); // <-- loads .env

const app = express();
const port = 5000;

// Build SSL config from env
function getSslConfig() {
  const caFile = process.env.PG_CA_FILE; // e.g., ./DigiCertGlobalRootG2.crt.pem
  if (caFile) {
    const abs = path.resolve(caFile);
    if (fs.existsSync(abs)) {
      console.log('[TLS] Using CA file:', abs);
      return { ca: fs.readFileSync(abs, 'utf8'), rejectUnauthorized: true };
    }
    console.warn('[TLS] PG_CA_FILE set but file not found:', abs,
      '\n      Falling back to dev mode (rejectUnauthorized:false).');
  } else {
    console.warn('[TLS] PG_CA_FILE not set. Using dev fallback (rejectUnauthorized:false).');
  }
  // Dev-only fallback so you can connect locally while sorting CA
  return { rejectUnauthorized: false };
}

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: Number(process.env.PGPORT || 5432),
  ssl: getSslConfig(),
});

app.get('/test-db', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS now');
    res.json({ ok: true, now: rows[0].now });
  } catch (e) {
    console.error('DB error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(port, () => {
  console.log(`HTTP listening at http://localhost:${port}`);
  console.log('Tip: Allow your IP in Azure → PostgreSQL → Networking → Firewall rules.');
});
