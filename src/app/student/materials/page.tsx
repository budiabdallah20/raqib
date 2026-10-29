'use client';

/**
 * 📁 ملفات المقررات — كل PDF/مذكرة رفعه الدكاترة لموادك في مكان واحد
 * بتبويبات للمواد + بحث + تنزيل مباشر.
 */
import * as React from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, FolderOpen, Search } from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { EmptyState } from '@/components/student/EmptyState';
import { RowsSkeleton } from '@/components/student/Skeletons';
import { cn } from '@/lib/utils';

type MaterialItem = {
  id: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  kind: string;
  createdAt: string;
  lecture: { id: string; title: string } | null;
};

type MaterialGroup = {
  courseId: string;
  code: string;
  name: string;
  items: MaterialItem[];
};

function fmtSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function StudentMaterialsPage() {
  const [groups, setGroups] = React.useState<MaterialGroup[] | null>(null);
  const [active, setActive] = React.useState<string>('ALL');
  const [query, setQuery] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    api<{ materials: MaterialGroup[] }>('/api/student/materials')
      .then((data) => setGroups(data.materials ?? []))
      .catch((err) => {
        setError((err as Error).message);
        setGroups([]);
      });
  }, []);

  const shown = (groups ?? [])
    .filter((group) => active === 'ALL' || group.courseId === active)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        query.trim()
          ? item.originalName.toLowerCase().includes(query.trim().toLowerCase()) ||
            (item.lecture?.title ?? '').includes(query.trim())
          : true,
      ),
    }))
    .filter((group) => group.items.length > 0);

  const totalFiles = (groups ?? []).reduce((acc, group) => acc + group.items.length, 0);
  const totalBytes = (groups ?? []).reduce((acc, group) => acc + group.items.reduce((a, item) => a + item.size, 0), 0);

  return (
    <StudentShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-950">ملفات المقررات</h1>
          <p className="mt-1 text-ink-500">مذكرات وشرح الدكاترة لموادك — جاهزة للتنزيل</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-brand-900/10 bg-white/65 px-3 py-1.5 text-xs font-bold text-ink-600" dir="ltr">
            {totalFiles} ملف · {fmtSize(totalBytes)}
          </span>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mb-4 rounded-xl border border-ember-500/25 bg-ember-500/[0.08] px-4 py-3 text-sm text-ember-600">
          {error}
        </p>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث باسم الملف أو المحاضرة…"
            className="w-64 pr-9"
          />
        </div>
        <button
          type="button"
          onClick={() => setActive('ALL')}
          className={cn(
            'rounded-xl border px-3 py-1.5 text-xs font-bold transition',
            active === 'ALL'
              ? 'border-brand-500/35 bg-brand-500/[0.10] text-brand-700'
              : 'border-brand-900/10 bg-white/60 text-ink-400 hover:text-ink-700',
          )}
        >
          كل المواد
        </button>
        {(groups ?? []).map((group) => (
          <button
            key={group.courseId}
            type="button"
            onClick={() => setActive(group.courseId)}
            className={cn(
              'rounded-xl border px-3 py-1.5 text-xs font-bold transition',
              active === group.courseId
                ? 'border-brand-500/35 bg-brand-500/[0.10] text-brand-700'
                : 'border-brand-900/10 bg-white/60 text-ink-400 hover:text-ink-700',
            )}
          >
            {group.code}
          </button>
        ))}
      </div>

      {groups === null ? (
        <RowsSkeleton rows={4} />
      ) : !groups.length ? (
        <EmptyState
          kind="materials"
          title="لسه مفيش ملفات في موادك"
          sub="أول ما الدكتور يرفع مذكرة أو شرح هتلاقيه هنا"
        />
      ) : shown.length === 0 ? (
        <EmptyState kind="materials" compact title="مفيش ملف مطابق للفلتر الحالي" />
      ) : (
        <div className="space-y-6">
          {shown.map((group, groupIndex) => (
            <motion.div
              key={group.courseId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(groupIndex * 0.06, 0.3) }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="rounded-lg bg-gold-400/15 px-2 py-0.5 text-xs font-bold text-gold-700">{group.code}</span>
                    {group.name}
                    <span className="ms-auto text-[10px] font-bold text-ink-300" dir="ltr">
                      {group.items.length} ملف
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-900/10 bg-white/65 p-3.5 transition hover:border-gold-400/35 hover:bg-gold-400/[0.05]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold-400/25 bg-gold-400/10 text-gold-700">
                        <FileText className="h-4.5 w-4.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ink-900" dir="ltr">
                          {item.originalName}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-ink-400">
                          <span dir="ltr">{fmtSize(item.size)}</span>
                          <span>·</span>
                          <span>{item.kind}</span>
                          {item.lecture ? (
                            <>
                              <span>·</span>
                              <span className="truncate">محاضرة: {item.lecture.title}</span>
                            </>
                          ) : null}
                          <span>·</span>
                          <span dir="ltr">{new Date(item.createdAt).toLocaleDateString('ar-EG')}</span>
                        </p>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gold-400/35 bg-gold-400/[0.10] px-3 py-2 text-xs font-bold text-gold-800 transition hover:bg-gold-400/[0.18]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        فتح / تنزيل
                      </a>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <p className="mt-8 flex items-center justify-center gap-2 text-[10px] text-ink-300">
        <FolderOpen className="h-3 w-3" />
        RAQiB Library — ملفاتك في مكان واحد
      </p>
    </StudentShell>
  );
}
