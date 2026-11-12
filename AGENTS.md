# RAQEEB agent instructions

Read `RAQEEB_MASTER_AGENTS.md` before starting. Its Agent A/OpenCode and Agent B/Codex ownership matrix is the source for task assignment. Read `agent.md` and the current code for additional product context; when those documents disagree, use the current owner's instruction and verify the implemented behavior.

Preserve the existing working tree. Many files may contain uncommitted user work. Do not reset, overwrite, or merge shared files without checking ownership and diff. Do not claim OpenCode/Codex coordination occurred without actual process logs and a handoff.

The current app uses Next.js, Prisma, and Neon Postgres for production, with SQLite for local tests. A switch to Supabase is only a proposal in the master document; do not migrate or change production data without an explicit project decision. Academic records are server-owned. Enforce permissions at the API boundary, never trust client roles, and use synthetic fixtures for tests.

Run relevant TypeScript, lint, tests, and build checks. Record exact results and known gaps. Keep visual work in OpenCode's areas and platform/data/API work in Codex's areas unless ownership is explicitly handed off.
