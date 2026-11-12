?# PHASE 0 — Feature Matrix (RAQEEB)

> Legend: ✅ Implemented (DB-backed) · 🟡 Partial · ❌ Missing (greenfield). Evidence = code, not docs.

## STUDENT PORTAL
| Feature | Status | Note |
|---|---|---|
| Dashboard | ✅ | Profile, enrollments, attendance, upcoming, tasks, grades, announcements — real SQL |
| Self-registration + 17h limit | ✅ | Since 2026-11-08: tx-safe enroll/drop (Serializable-free), 17h via `credit_limit` AppSetting, group/term schedule-conflict detection, re-enroll after drop, in-tx audit. No prereq/capacity checks yet |
| Timetable | ✅ | Weekly grid + ICS + print |
| Attendance QR + history | ✅ | Scanner + `?token=` + offline queue; inactive enrollment now rejected at server; corrected records and notices reach the student. **No student appeal request yet** |
| Assignments | ✅ | Sheets/projects as WEEKLY/MONTHLY, deadline, file, professor score/feedback |
| Exams (MCQ/TF/short/essay, autosave) | 🟡 | Exam Studio works across both portals. Server-backed draft autosave and resume were added 2026-11-09; full E2E recheck is pending because the local Prisma client was locked by a running development server. See `codex-work-2026-11-09.md`. |
| Course Compass (per-course risk) | ✅ | Since 2026-11-07: per-course attendance/grades/tasks weighted risk + advice, credit-hours meter vs `credit_limit` |
| Grades + downloads | 🟡 | Official view + CSV/print; no official-vs-estimated distinction, no download authz beyond own |
| AI Course Assistant (RAG) | ❌ | No AI code; `PortalAgent` is a toaster, not AI |

## DOCTOR PORTAL
| Feature | Status | Note |
|---|---|---|
| Academic dashboard | ✅ | Own courses, counts, upcoming, quick actions |
| Course mgmt + rosters + TA perms | 🟡 | View + materials only; no roster/TA/section mgmt |
| Lecture create/cancel/reschedule + notify | 🟡 | Create+open/close; cancel flag exists, no UI button; open notifies, close/cancel does not |
| Attendance center (QR, manual, exports) | 🟡 | Rotating QR + dup protection; paginated roster and reasoned manual PRESENT/LATE correction now work through a transaction with audit and student notice. No Excel/PDF server-side |
| Exam Studio (bank, keys, windows) | ✅ | Since 2026-11-08: full Studio — DRAFT→PUBLISHED→CLOSED, answer keys, availability windows, attempts review, essay grading, publish/hide results, CSV export |
| Early-risk watchlist | ✅ | Since 2026-11-07: deterministic 0–100 per student (attendance/grades/tasks), CSV export |
| Grading (deterministic + AI-assist + review) | 🟡 | Manual only (quiz/work/mid 0-60); no auto-grade, no AI flow, no publish states |
| Gradebook (matrix, import, weights) | 🟡 | Matrix + CSV out only; no import/weights/states |
| Assignment manager | ✅ | Create/publish/close/reopen/delete, deadline, review |
| Reports (course/attendance/grade/exam) | 🟡 | Attendance-only (CSV/print); no grade/exam reports, no version IDs |
| AI tools (generate/summarize/feedback) | ❌ | None |

## ADMIN PORTAL
| Feature | Status | Note |
|---|---|---|
| Users/roles, professor/TA assignments | 🟡 | Active toggle + details; no role-change UI, no TA concept |
| Courses/sections | 🟡 | Course CRUD; no sections |
| Years/semesters | ❌ | Only `secondTermStart`/`firstTermEnd` strings |
| Credit-hour policies | ✅ | `credit_limit` AppSetting honored by registration + visible/configurable in `/admin/settings` since 2026-11-08 |
| Operations Room ("نبض المنصة") | ✅ | Since 2026-11-07: live KPIs + DB latency + deterministic anomaly detection (weakest lectures, absence-risk students, silent courses, failed logins), CSV, print |
| Registration oversight | ❌ | No enrollment approval/limits UI |
| Attendance/grading audit | ✅ | Full AuditLog feed + filters; attendance correction creates an audit row atomically and admin can review the same roster |
| Notifications mgmt | 🟡 | Bell real; no compose UI (emergency banner only) |
| AI quota / storage / health | 🟡 | DB/Drive usage real; AI quota none; health real |
| Exports / backup / restore / activity | 🟡 | CSV + print + SQLite backup; no restore UI, no Excel, no Postgres in-app backup |

## Cross-cutting
| Feature | Status |
|---|---|
| Design system (tokens, sidebar/bottom-nav, light mode, skeletons, toasts, a11y focus-trap, bottom-nav, shared primitives) | 🟡 — teal/gold ink theme, no `#0B1120` blueprint tokens, top Navbar only, light mode partial, skeletons per-portal, no global toast/Error Boundaries |
| Security hardening (JWT/sessions, CSRF, CSP, uploads, encryption, rate limits, audit) | ✅ Core hardened; gaps: MFA enforcement, signed URLs, read-endpoint limits, restore testing, scanner (see `security-checklist.md`) |
| User session management | ✅ | Database-backed session list and revocation for student, professor and admin; current session protected from accidental remote revoke |
| Performance (pagination, lazy, caching, PWA) | 🟡 — admin paginated, polling 5-60s, no virtualization, PWA partial |
| Testing (unit/integration/E2E) | ◐ Core + 85 unit tests (crypto/QR/policy/settings/exporters/risk/enrollment/answer) + 3 Playwright journeys; E2E smoke script `scripts/dev-verify-e2e.mjs` proves registration + full exam lifecycle against disposable SQLite |

## Migration posture
Preserve all working features. Build incrementally per phase (see `implementation-roadmap.md`). Never mark a feature done on visual polish alone (Rule 17). Fake-data purge (100% empty) is a data operation, not a feature — executed only in an approved phase after backup + restore test.
