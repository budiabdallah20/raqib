import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const tx = {
    lecture: { findUnique: vi.fn() },
    enrollment: { findUnique: vi.fn() },
    attendance: { findUnique: vi.fn(), upsert: vi.fn() },
    session: { updateMany: vi.fn() },
    auditLog: { create: vi.fn() },
    notification: { create: vi.fn() },
  };
  const prisma = {
    lecture: { findUnique: vi.fn() },
    enrollment: { findUnique: vi.fn(), count: vi.fn(), findMany: vi.fn() },
    attendance: { findMany: vi.fn() },
    session: { findMany: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
  };
  return { tx, prisma, requireUser: vi.fn(), getCurrentSession: vi.fn() };
});

vi.mock('@/lib/db', () => ({ prisma: mocks.prisma }));
vi.mock('@/lib/auth', () => ({ requireUser: mocks.requireUser }));
vi.mock('@/lib/session', () => ({ getCurrentSession: mocks.getCurrentSession }));

import { PATCH as correctAttendance } from '@/app/api/attendance/reconcile/route';
import { GET as listSessions, DELETE as revokeSession } from '@/app/api/auth/sessions/route';
import { recordAttendance } from '@/lib/attendance-record';

const correction = (studentId = 'student-1') => new Request('http://localhost/api/attendance/reconcile', {
  method: 'PATCH',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ lectureId: 'lecture-1', studentId, status: 'PRESENT', reason: 'تم التحقق من الحضور يدويًا' }),
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ id: 'professor-1', role: 'PROFESSOR' });
  mocks.tx.lecture.findUnique.mockResolvedValue({
    id: 'lecture-1', title: 'محاضرة', professorId: 'professor-1', courseId: 'course-1',
    startsAt: new Date(Date.now() - 60_000), cancelledAt: null, course: { code: 'MAT101' },
  });
  mocks.tx.enrollment.findUnique.mockResolvedValue({ status: 'ACTIVE' });
  mocks.prisma.enrollment.findUnique.mockResolvedValue({ status: 'ACTIVE' });
  mocks.tx.attendance.findUnique.mockResolvedValue(null);
  mocks.tx.attendance.upsert.mockResolvedValue({ id: 'attendance-1' });
  mocks.tx.auditLog.create.mockResolvedValue({ id: 'audit-1' });
  mocks.tx.notification.create.mockResolvedValue({ id: 'notice-1' });
});

describe('attendance reconciliation across portals', () => {
  it('denies an instructor from changing another instructor’s lecture', async () => {
    mocks.tx.lecture.findUnique.mockResolvedValue({
      id: 'lecture-1', professorId: 'professor-2', courseId: 'course-1', cancelledAt: null,
      startsAt: new Date(Date.now() - 60_000), course: { code: 'MAT101' },
    });
    const response = await correctAttendance(correction());
    expect(response.status).toBe(403);
    expect(mocks.tx.attendance.upsert).not.toHaveBeenCalled();
  });

  it('denies changes for a student without active enrollment', async () => {
    mocks.tx.enrollment.findUnique.mockResolvedValue({ status: 'DROPPED' });
    const response = await correctAttendance(correction());
    expect(response.status).toBe(403);
    expect(mocks.tx.attendance.upsert).not.toHaveBeenCalled();
  });

  it('denies corrections before a lecture begins', async () => {
    mocks.tx.lecture.findUnique.mockResolvedValue({
      id: 'lecture-1', title: 'محاضرة', professorId: 'professor-1', courseId: 'course-1',
      startsAt: new Date(Date.now() + 60_000), cancelledAt: null, course: { code: 'MAT101' },
    });
    const response = await correctAttendance(correction());
    expect(response.status).toBe(409);
    expect(mocks.tx.attendance.upsert).not.toHaveBeenCalled();
  });

  it('denies QR attendance after enrollment was dropped', async () => {
    mocks.prisma.enrollment.findUnique.mockResolvedValue({ status: 'DROPPED' });
    mocks.prisma.enrollment.findUnique.mockResolvedValue({ status: 'DROPPED' });
    const result = await recordAttendance({
      studentId: 'student-1',
      lecture: { id: 'lecture-1', courseId: 'course-1', title: 'محاضرة', startsAt: new Date(), course: { name: 'رياضيات', code: 'MAT101' } },
      via: 'QR',
      audit: vi.fn(),
    });
    expect(result.kind).toBe('forbidden');
    expect(mocks.tx.attendance.upsert).not.toHaveBeenCalled();
  });

  it('writes attendance, audit and student notification in one transaction', async () => {
    const response = await correctAttendance(correction());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ changed: true, status: 'PRESENT' });
    expect(mocks.prisma.$transaction).toHaveBeenCalledOnce();
    expect(mocks.tx.attendance.upsert).toHaveBeenCalledOnce();
    expect(mocks.tx.auditLog.create).toHaveBeenCalledOnce();
    expect(mocks.tx.notification.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: 'student-1', link: '/student/attendance' }),
    }));
  });

  it('does not send another notification when status is unchanged', async () => {
    mocks.tx.attendance.findUnique.mockResolvedValue({ status: 'PRESENT' });
    const response = await correctAttendance(correction());
    expect(response.status).toBe(200);
    expect((await response.json()).changed).toBe(false);
    expect(mocks.tx.notification.create).not.toHaveBeenCalled();
  });
});

describe('session ownership', () => {
  it('lists only the owner’s active sessions without token hashes', async () => {
    mocks.getCurrentSession.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' }, sessionId: 'current-1' });
    mocks.prisma.session.findMany.mockResolvedValue([{
      id: 'current-1', userAgent: 'Test browser', createdAt: new Date(), lastSeenAt: new Date(), expiresAt: new Date(Date.now() + 60_000),
    }]);
    const response = await listSessions();
    expect(response.status).toBe(200);
    expect(mocks.prisma.session.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: 'student-1', revokedAt: null }),
      select: expect.not.objectContaining({ tokenHash: true }),
    }));
    const body = await response.json();
    expect(body.sessions[0].current).toBe(true);
    expect(body.sessions[0].tokenHash).toBeUndefined();
  });

  it('only revokes sessions belonging to the signed-in user', async () => {
    mocks.getCurrentSession.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' }, sessionId: 'current-1' });
    mocks.tx.session.updateMany.mockResolvedValue({ count: 0 });
    const response = await revokeSession(new Request('http://localhost/api/auth/sessions', {
      method: 'DELETE', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: 'foreign-session' }),
    }));
    expect(response.status).toBe(404);
    expect(mocks.tx.session.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: 'student-1', id: 'foreign-session' }),
    }));
  });

  it('records a successful revoke in the same transaction', async () => {
    mocks.getCurrentSession.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' }, sessionId: 'current-1' });
    mocks.tx.session.updateMany.mockResolvedValue({ count: 1 });
    const response = await revokeSession(new Request('http://localhost/api/auth/sessions', {
      method: 'DELETE', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: 'other-1' }),
    }));
    expect(response.status).toBe(200);
    expect(mocks.tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'SESSION_REVOKE', userId: 'student-1' }),
    }));
  });
});
