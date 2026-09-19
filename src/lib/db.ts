import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:@localhost:5432/mra_summary_plan';

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({ connectionString });
} else {
  // Prevent multiple pool instances during Next.js hot reload
  const globalWithPg = global as typeof globalThis & { _pgPool?: Pool };
  if (!globalWithPg._pgPool) {
    globalWithPg._pgPool = new Pool({ connectionString });
  }
  pool = globalWithPg._pgPool;
}

export default pool;
