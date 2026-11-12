# PHASE 0 — Database Design (RAQEEB)

> Dialect: **Neon Postgres prod / SQLite local**. No migrations folder yet (`db push` only). PII encrypted at rest (AES-256-GCM). **No destructive changes in Phase 0.**

## 1. Current tables (19)
- Auth: `User` (roles as string, credits nullable, per-student group/level/dept), `Session` (tokenHash unique), `PasswordResetToken`, `PasskeyCredential`.
- Academic: `Course` (code unique, creditHours nullable, professorId Restrict), `Enrollment` (unique student×course), `Lecture` (qrToken, geofence, isOpen, cancelledAt), `Attendance` (unique lecture×student, PRESENT/LATE), `ScheduleSlot` (unique group+day+period+term), `Grade` (unique student×course, quiz/work/midterm/final), `Task` (OPEN/CLOSED), `TaskSubmission` (unique task×student), `Resource`, `GpaSnapshot`, `StudentNote`.
- System: `AppSetting` (key/value), `Quote`, `Notification`, `AuditLog`.
- No native enums, no CHECK constraints — guards live in Zod only. Indexes present on hot paths (User role/active, Session, ScheduleSlot, Grade, etc.). FKs: Cascade for user/course children, Restrict only for professor ownership, SetNull for optional links, AuditLog survives via SetNull.

## 2. Gaps vs required entities (Rule 05)
- **1 EXISTS:** `Notification` ✅
- **9 PARTIAL:** profiles (=User), courses (no semesterId/prereq/capacity, creditHours unwritable at create), enrollments (no semesterId/sectionId/status), lectures (no endsAt/status/reschedule/closedBy), attendance_records (no ABSENT/manual reason), assignments/submissions (no section/semester/weight/windows), gradebook (=Grade, no draft/approved/published, no history, `final` unwritable), audit_logs (no idempotencyKey/structured before-after)
- **14 MISSING:** roles, role_assignments, academic_years, semesters, course_sections, teaching_assignments, attendance_sessions, exams, questions, answer_keys, exam_attempts, student_answers, grading_reviews, academic_reports

## 3. Migration order (adapt, don't duplicate)
1. **M1 Time backbone:** `AcademicYear`, `Semester` (code, dates, registration windows, status). Backfill T1/T2 from `AppSetting`. Add nullable `semesterId` to Course/Enrollment/Lecture/Task. Add `credit_limit=17` to settings allowlist.
2. **M2 Identity:** `Role`, `RoleAssignment` (GLOBAL/COURSE/SECTION scope), `TeachingAssignment`. Backfill from `User.role`. Dual-read until cutover.
3. **M3 Academic spine:** `CourseSection`, `CoursePrerequisite`. Evolve `Course` (semesterId, capacity, level), `Enrollment` (semesterId, sectionId, status ACTIVE/DROPPED, credit snapshot). Rewrite enrollment: tx + credit sum + conflict + prereq.
4. **M4 Attendance split:** Keep `Lecture` as occurrence; add `AttendanceSession` (openedAt/closedAt, tokenHash, rotateCount). Evolve `Lecture` (endsAt, status SCHEDULED/OPEN/CLOSED/CANCELLED, rescheduledFromId, cancelReason). Evolve `Attendance` (ABSENT gen at close, correctionBy/reason, sessionId, recordedVia). Fix race with `upsert` in tx.
5. **M5 Assignments:** Add sectionId/semesterId/weight/window cols to `Task`; status/gradedBy/late to `TaskSubmission`.
6. **M6 Exams + grading:** New `Exam`, `Question`, `AnswerKey` (versioned), `ExamAttempt` (idempotencyKey unique), `StudentAnswer`, `GradingReview`, `GradeHistory`, `IdempotencyKey`. Evolve `Grade` (status DRAFT/APPROVED/PUBLISHED, publishedAt/By) + allow `final` in API.
7. **M7 Reports:** `AcademicReport` (async status PENDING/PROCESSING/SUCCEEDED/FAILED, version, fileUrl). Evolve `Notification` (targetRole, priority, expiresAt).

Per phase: additive nullable first → backfill (idempotent) → NOT NULL → backup → regenerate → smoke. Rollback = restore backup + revert schema + re-sync dialects. Never `db push --force`.

## 4. Fake-data purge (owner: 100% empty, executed ONLY after approval)
- Current Neon (post-purge): 1 ADMIN + 7 seeded courses + schedules + quotes.
- Target: keep ADMIN user only. Delete courses/schedules/quotes/enrollments/grades/tasks/notifications/audit(for non-admin)/sessions/tokens. Keep `AppSetting` operational keys. Backup **before** purge, plus a restore test. Owner must approve the exact cut list in the phase that executes it.

## 5. Integrity notes
- Transactions today: only schedule copy/swap + reset. Enrollment/attendance/grading lack tx. Audit is separate `prisma.auditLog.create` (swallowed errors) — must join business tx in Phase 4.
- No idempotency keys today — uniques cover student retries; bulk PUTs need `IdempotencyKey` table (M6).
- Backups: SQLite plaintext keep-20; Postgres JSON → AES `.enc` to Drive (hashes redacted). No decrypt-restore script yet — build in Phase 10. `encrypt-pii.ts` is the idempotent backfill pattern to reuse. Split backup key from PII key before rotation.