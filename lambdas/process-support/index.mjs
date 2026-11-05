// RF-03 — Lambda process-support
// Disparada por S3 (ObjectCreated, prefijo supports/). Registra el documento en
// support_documents y marca la novedad como "soporte entregado".
// No consulta S3: el evento ya trae la clave y el tamaño, y el tipo sale de la
// extensión. Por eso solo necesita llegar al RDS (red privada de la VPC).
import pg from 'pg';
import { randomUUID } from 'node:crypto';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  max: 1,
});

// supports/novelty-<uuid>/<uuid>-<nombre-original>
const KEY_RE = /^supports\/novelty-([0-9a-f-]{36})\/(.+)$/i;
const TYPES = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };

const log = (level, data) => console[level](JSON.stringify(data));

export const handler = async (event) => {
  for (const record of event.Records ?? []) {
    // S3 codifica la clave en el evento (espacios como "+")
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const size = record.s3.object.size ?? 0;

    const match = key.match(KEY_RE);
    if (!match) {
      log('error', { msg: 'Clave fuera del patrón; se ignora', key });
      continue;
    }
    const noveltyId = match[1];
    const originalName = match[2].replace(/^[0-9a-f-]{36}-/i, '');
    const ext = originalName.split('.').pop()?.toLowerCase() ?? '';
    const contentType = TYPES[ext] ?? 'application/octet-stream';

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const found = await client.query('SELECT 1 FROM novelties WHERE id = $1', [noveltyId]);
      if (found.rowCount === 0) {
        await client.query('ROLLBACK');
        log('error', { msg: 'Novedad inexistente; no se altera nada', noveltyId, key });
        continue;
      }

      // Idempotente: si S3 entrega el mismo evento dos veces, no se duplica
      const inserted = await client.query(
        `INSERT INTO support_documents (id, novelty_id, s3_key, original_name, content_type, size_bytes)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (s3_key) DO NOTHING`,
        [randomUUID(), noveltyId, key, originalName, contentType, size],
      );
      await client.query(
        'UPDATE novelties SET support_submitted = true, updated_at = NOW() WHERE id = $1',
        [noveltyId],
      );
      await client.query('COMMIT');

      log('log', {
        msg: inserted.rowCount ? 'Soporte registrado' : 'Soporte ya registrado (evento repetido)',
        noveltyId, key, originalName, contentType, size,
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      log('error', { msg: 'Error registrando el soporte', noveltyId, key, error: err.message });
      throw err; // S3 reintenta la invocación
    } finally {
      client.release();
    }
  }
};
