// RF-04 — Lambda report-hours-by-client
// GET /api/reports/hours-by-client?month=YYYY-MM  (API Gateway HTTP API, payload 2.0)
// Turnos y horas programadas por cliente y puesto, calculados con JOIN + GROUP BY.
import pg from 'pg';
import jwt from 'jsonwebtoken';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  max: 1,
});

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

// Un turno que cruza la medianoche (17:00–05:00) da -12 h; se suman 24 h → 12 h.
const SQL = `
  SELECT c.id   AS client_id,
         c.name AS client,
         p.code AS post_code,
         p.name AS post,
         COUNT(s.id) AS shifts,
         ROUND(SUM(
           EXTRACT(EPOCH FROM (sc.end_time::time - sc.start_time::time)) / 3600
           + CASE WHEN sc.crosses_midnight THEN 24 ELSE 0 END
         )::numeric, 1) AS hours
  FROM clients c
  JOIN posts         p  ON p.client_id       = c.id
  JOIN shift_configs sc ON sc.post_id        = p.id
  JOIN schedules     s  ON s.shift_config_id = sc.id
  WHERE s.date >= $1::date
    AND s.date <  ($1::date + INTERVAL '1 month')
    AND s.status <> 'rest'
  GROUP BY c.id, c.name, p.id, p.code, p.name
  ORDER BY c.name, p.name`;

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/** Valida el mismo JWT del backend solo si JWT_SECRET está configurado (ADR-09). */
function isAuthorized(event) {
  const secret = process.env.JWT_SECRET;
  if (!secret) return true;
  const header = event.headers?.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  try {
    const payload = jwt.verify(token, secret);
    return ['admin', 'coordinator'].includes(payload.role);
  } catch {
    return false;
  }
}

export const handler = async (event) => {
  if (!isAuthorized(event)) return json(401, { message: 'No autorizado' });

  const month = event.queryStringParameters?.month;
  if (!month || !MONTH_RE.test(month))
    return json(400, { message: 'Parámetro month inválido. Use el formato YYYY-MM' });

  try {
    const { rows } = await pool.query(SQL, [`${month}-01`]);
    const data = rows.map((r) => ({
      client_id: r.client_id,
      client: r.client,
      post_code: r.post_code,
      post: r.post,
      shifts: Number(r.shifts),
      hours: Number(r.hours),
    }));
    console.log(JSON.stringify({ msg: 'Informe generado', month, rows: data.length }));
    return json(200, data);
  } catch (err) {
    console.error(JSON.stringify({ msg: 'Error generando el informe', month, error: err.message }));
    return json(500, { message: 'Error generando el informe' });
  }
};
