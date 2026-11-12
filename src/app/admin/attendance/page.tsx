'use client';

import { AttendanceConsole } from '@/components/academic/AttendanceConsole';
import { DashboardShell } from '@/components/shared/DashboardShell';

export default function AdminAttendancePage() {
  return <DashboardShell><AttendanceConsole admin /></DashboardShell>;
}
