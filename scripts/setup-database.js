/**
 * Creates the tables this app needs and, when they are empty, puts the baseline figures in.
 * Reads DATABASE_URL from .env.local. Run it with: npm run db:setup
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const root = path.join(__dirname, '..');

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const file = path.join(root, '.env.local');
  if (!fs.existsSync(file)) throw new Error('No DATABASE_URL and no .env.local to read it from.');
  const match = fs.readFileSync(file, 'utf8').match(/^DATABASE_URL=(.+)$/m);
  if (!match) throw new Error('.env.local has no DATABASE_URL line.');
  return match[1].trim();
}

/** The connection string with the password blanked out, for printing */
const withoutPassword = (url) => url.replace(/:\/\/([^:/@]+):[^@]*@/, '://$1:***@');

/** Loads a TypeScript module from src/lib without a build step */
function loadFromSource(name) {
  const ts = require(path.join(root, 'node_modules/typescript'));
  const out = path.join(root, '.db-setup-cache');
  fs.mkdirSync(out, { recursive: true });
  const source = fs.readFileSync(path.join(root, 'src/lib', name + '.ts'), 'utf8');
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  }).outputText;
  const file = path.join(out, name + '.js');
  fs.writeFileSync(file, js);
  return require(file);
}

(async () => {
  const connectionString = readDatabaseUrl();
  const local = /@(localhost|127\.0\.0\.1)/.test(connectionString);
  console.log('database :', withoutPassword(connectionString));

  const pool = new Pool({
    connectionString,
    ssl: local ? undefined : { rejectUnauthorized: false },
    options: '-c search_path=mra,public',
    connectionTimeoutMillis: 15000,
  });

  try {
    const who = await pool.query('select current_database() as db, current_user as usr');
    console.log('connected:', who.rows[0].db, 'as', who.rows[0].usr);

    console.log('\napplying scripts/schema.sql');
    await pool.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
    const tables = await pool.query(
      "select table_name from information_schema.tables where table_schema='mra' and table_name in ('scenarios','financial_highlights') order by 1"
    );
    console.log('  tables ready:', tables.rows.map((r) => r.table_name).join(', '));

    // Baseline figures, only when there is nothing saved yet: never overwrite real work
    const { INITIAL_DATASET } = loadFromSource('initial-data');
    const { INITIAL_HIGHLIGHTS_DATA } = loadFromSource('highlights-data');

    const scenarioCount = (await pool.query('select count(*)::int as n from mra.scenarios')).rows[0].n;
    if (scenarioCount === 0) {
      await pool.query(
        `insert into mra.scenarios (id, slug, title, description, years, items, brand_breakdown, is_locked, created_at, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())`,
        [
          INITIAL_DATASET.id,
          INITIAL_DATASET.slug,
          INITIAL_DATASET.title,
          INITIAL_DATASET.description || '',
          JSON.stringify(INITIAL_DATASET.years),
          JSON.stringify(INITIAL_DATASET.items),
          JSON.stringify(INITIAL_DATASET.brandBreakdown || []),
          false,
        ]
      );
      console.log('  seeded the baseline scenario:', INITIAL_DATASET.slug);
    } else {
      console.log(`  scenarios already hold ${scenarioCount} row(s), left untouched`);
    }

    const highlightCount = (await pool.query('select count(*)::int as n from mra.financial_highlights')).rows[0].n;
    if (highlightCount === 0) {
      await pool.query('insert into mra.financial_highlights (id, data, updated_at) values ($1, $2, now())', [
        'main',
        JSON.stringify(INITIAL_HIGHLIGHTS_DATA),
      ]);
      console.log('  seeded the highlights slide');
    } else {
      console.log(`  financial_highlights already holds ${highlightCount} row(s), left untouched`);
    }

    const summary = await pool.query(
      'select slug, title, jsonb_array_length(brand_breakdown) as brands, (select count(*) from jsonb_object_keys(items)) as pl_rows from mra.scenarios order by updated_at desc'
    );
    console.log('\nscenarios now in the database:');
    for (const row of summary.rows) console.log(`  ${row.slug} — ${row.pl_rows} P&L rows, ${row.brands} brand rows`);
    console.log('\ndone.');
  } finally {
    await pool.end();
    fs.rmSync(path.join(root, '.db-setup-cache'), { recursive: true, force: true });
  }
})().catch((error) => {
  console.error('\nsetup failed:', error.message);
  process.exit(1);
});
