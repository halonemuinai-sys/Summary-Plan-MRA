# Deploying to Vercel

The app is a single Next.js project that talks to PostgreSQL (Supabase) directly. Nothing else
needs hosting.

## 1. Prepare the database once

The tables live in their own `mra` schema, which Supabase does **not** expose through its generated
REST API. Create them with:

```bash
npm run db:setup
```

It is safe to run again: it only creates what is missing, and it never overwrites saved figures.

## 2. Set the environment variable in Vercel

Project > Settings > Environment Variables:

| Name | Value | Environments |
| --- | --- | --- |
| `DATABASE_URL` | the Supabase **transaction pooler** string, port `6543` | Production, Preview |

Take the string from Supabase > Project Settings > Database > Connection string > Transaction pooler.
Two things to watch:

- Use a pooler host (`aws-0-<region>.pooler.supabase.com`), not `db.<ref>.supabase.co`. The direct
  host publishes an IPv6 address only, which most networks cannot reach.
- The user name carries the project ref: `postgres.<project-ref>`.

Port 6543 pools per transaction, which suits serverless: every request may land on a fresh instance.
Each instance keeps at most one connection (see `src/lib/db.ts`).

## 3. Deploy

Push to the connected Git branch, or run `vercel --prod`. The build is a plain `next build`.

`vercel.json` pins the functions to `sin1` (Singapore) so they sit next to a Supabase project in
`ap-southeast-1`. Change it if the database lives elsewhere.

## Notes

- `.env.local` holds the local connection string and is ignored by git. Never commit it.
- TLS is on for any non-local database, but the certificate is not verified, because Supabase
  presents a self-signed chain. To verify it properly, download their CA certificate and pass it as
  `ssl: { ca }` in `src/lib/db.ts`.
- If the database is unreachable the app quietly falls back to the baseline figures in
  `src/lib/initial-data.ts`, and saving fails. Watch the function logs for `PostgreSQL Error`.
