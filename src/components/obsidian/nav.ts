import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BellRing,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Cpu,
  FileBarChart,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  QrCode,
  ScanFace,
  Settings2,
  ShieldCheck,
  Users,
  UserSquare2,
} from 'lucide-react';
import type { Role } from '@/types';

export type PortalNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** route not built yet — shown disabled with a "قريبًا" chip instead of 404 */
  soon?: boolean;
};

export type PortalNavGroup = { title: string; items: PortalNavItem[] };

export const PORTAL_NAV: Record<Role, PortalNavGroup[]> = {
  STUDENT: [
    {
      title: 'الرئيسية',
      items: [
        { href: '/student', label: 'لوحتي', icon: LayoutDashboard },
        { href: '/student/schedule', label: 'الجدول', icon: CalendarDays },
        { href: '/student/attendance', label: 'الحضور', icon: ScanFace },
      ],
    },
    {
      title: 'الدراسة',
      items: [
        { href: '/student/registration', label: 'تسجيل المقررات', icon: ListChecks },
        { href: '/student/tasks', label: 'التكليفات', icon: ClipboardList },
        { href: '/student/exams', label: 'الامتحانات', icon: FileText },
        { href: '/student/lectures', label: 'المحاضرات', icon: GraduationCap },
      ],
    },
    {
      title: 'المعرفة',
      items: [
        { href: '/student/materials', label: 'المواد', icon: BookOpen },
        { href: '/student/notes', label: 'ملاحظاتي', icon: NotebookPen },
        { href: '/student/ai', label: 'المساعد الذكي', icon: Cpu, soon: true },
        { href: '/student/report', label: 'تقريري', icon: FileBarChart },
      ],
    },
  ],
  PROFESSOR: [
    {
      title: 'الرئيسية',
      items: [
        { href: '/professor', label: 'لوحة القيادة', icon: LayoutDashboard },
        { href: '/professor/schedule', label: 'جدولي', icon: CalendarDays },
        { href: '/professor/board', label: 'لوحة QR', icon: QrCode },
      ],
    },
    {
      title: 'التدريس',
      items: [
        { href: '/professor/attendance', label: 'مركز الحضور', icon: ScanFace },
        { href: '/professor/tasks', label: 'التكليفات', icon: ClipboardList },
        { href: '/professor/exams', label: 'استوديو الامتحانات', icon: FileText },
        { href: '/professor/resources', label: 'المصادر', icon: BookOpen },
      ],
    },
    {
      title: 'التحليل',
      items: [
        { href: '/professor/grades', label: 'الدرجات', icon: BarChart3 },
        { href: '/professor/reports', label: 'التقارير', icon: FileBarChart },
        { href: '/professor/ai', label: 'أدوات AI', icon: Cpu, soon: true },
      ],
    },
  ],
  ADMIN: [
    {
      title: 'القيادة',
      items: [
        { href: '/admin', label: 'نظرة عامة', icon: LayoutDashboard },
        { href: '/admin/academic', label: 'العام الدراسي', icon: CalendarDays, soon: true },
        { href: '/admin/schedule', label: 'الجدول', icon: CalendarDays },
      ],
    },
    {
      title: 'الأكاديميا',
      items: [
        { href: '/admin/students', label: 'الطلاب', icon: Users },
        { href: '/admin/professors', label: 'هيئة التدريس', icon: UserSquare2 },
        { href: '/admin/courses', label: 'المقررات', icon: BookOpen },
      ],
    },
    {
      title: 'الحكم والرقابة',
      items: [
        { href: '/admin/reports', label: 'التقارير', icon: FileBarChart },
        { href: '/admin/attendance', label: 'مراجعة الحضور', icon: ScanFace },
        { href: '/admin/audit', label: 'سجل التدقيق', icon: ShieldCheck },
        { href: '/admin/system', label: 'صحة النظام', icon: BellRing },
        { href: '/admin/settings', label: 'الإعدادات', icon: Settings2 },
      ],
    },
  ],
};

export const ROLE_TITLE: Record<Role, string> = {
  STUDENT: 'بوابة الطالب',
  PROFESSOR: 'بوابة عضو هيئة التدريس',
  ADMIN: 'بوابة الإدارة',
};

export const ROLE_AVATAR_FALLBACK: Record<Role, string> = {
  STUDENT: 'ط',
  PROFESSOR: 'د',
  ADMIN: 'أ',
};
