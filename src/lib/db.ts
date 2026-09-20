import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:@localhost:5432/mra_summary_plan';

// A database on someone else's machine needs TLS; a local one does not offer it.
const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])/.test(connectionString);

// Supabase presents a self-signed chain, so the certificate itself is not checked. The traffic is
// encrypted, but this does not prove the server is Supabase; to get that, download their CA
// certificate and pass it here as ssl: { ca }.
const ssl = isLocal ? undefined : { rejectUnauthorized: false };

// On Vercel every request can land on a fresh instance, each with a pool of its own, so a large pool
// per instance would exhaust the database's connection budget. Queries name their schema (mra.), so
// nothing here depends on a search_path that a transaction-mode pooler may not carry over.
const serverless = Boolean(process.env.VERCEL);

const config = {
  connectionString,
  ssl,
  max: serverless ? 1 : 10,
  idleTimeoutMillis: serverless ? 10_000 : 30_000,
  connectionTimeoutMillis: 15_000,
};

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool(config);
} else {
  // Prevent multiple pool instances during Next.js hot reload
  const globalWithPg = global as typeof globalThis & { _pgPool?: Pool };
  if (!globalWithPg._pgPool) {
    globalWithPg._pgPool = new Pool(config);
  }
  pool = globalWithPg._pgPool;
}

export default pool;
