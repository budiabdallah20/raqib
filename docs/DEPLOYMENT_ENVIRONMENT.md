# Environment and release operations

Use `.env.example` as the key inventory; it contains no usable secrets. Local `.env` and `.env.local`, certificates, databases, upload storage, review artifacts and backups stay ignored. Next.js local overrides can differ from standalone scripts, which use dotenv/.env; keep shared database settings consistent.

Production is the existing Vercel `raqib` project in `mohamedabdallahs-projects`, canonical URL https://raqibdev.vercel.app. Production uses the existing Neon database. Preserve the PII encryption key for this database. Do not rotate it independently of a reviewed data re-encryption plan. Keep the existing JWT and administrator hash unless intentionally rotating authentication credentials.

Required production settings: DATABASE_URL, DATABASE_URL_UNPOOLED (direct schema-tool URL), JWT_SECRET, PII_ENCRYPTION_KEY, ADMIN_ACCESS_CODE_HASH, NEXT_PUBLIC_APP_URL=https://raqibdev.vercel.app, PASSKEY_RP_ID=raqibdev.vercel.app, PASSKEY_ORIGIN=https://raqibdev.vercel.app, TRUST_PROXY=1, SHOW_DEV_RESET_CODE=0. Secret values belong in Vercel, never Git or NEXT_PUBLIC variables. Do not set plaintext ADMIN_ACCESS_CODE.

Email recovery requires RESEND_API_KEY and a verified MAIL_FROM. Drive REST storage requires GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, GDRIVE_REFRESH_TOKEN and the intended root folder. A local rclone login is not a serverless deployment credential. These optional services must be verified before announcing them as operational.

The build runs Prisma client generation and Next.js build only; it does not seed, migrate or reset a database. Review a read-only schema diff before applying any separately authorized schema update. On 2026-11-13 four previously absent exam tables were added transactionally; the resulting schema diff was empty.

Before release: typecheck, lint, unit tests, production build, responsive and authentication UI smoke checks. After release: confirm the exact Git commit, Vercel READY state, HTTPS routes, asset rendering, health response and unauthorized redirects. Do not use real academic records as test fixtures.
