'use client';

/**
 * 📣 لائحة الإعلانات داخل البوابة — إشعارات الدكاترة والإدارة بأي_training تصنيف
 * (محاضرة مفتوحة · تاسك جديد · تنبيه حرمان · عام) مع تعليم كلام.
 */
import * as React from 'react';
import Link from 'next/link';
import { CalendarDays, ClipboardList, Inbox, ShieldAlert, Megaphone, CheckCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { EmptyState } from './EmptyState';
import { RowsSkeleton } from './Skeletons';

type Notice = {
  id: string;
  title: string;
  body: string | null;
  kind: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

const KIND_META: Record<string, { label: string; icon: typeof Inbox; cls: string }> = {
  LECTURE: { label: 'محاضرة', icon: CalendarDays, cls: 'text-brand-700 border-brand-500/25 bg-brand-500/[0.07]' },
  TASK: { label: 'تاسك', icon: ClipboardList, cls: 'text-gold-700 border-gold-400/30 bg-gold-400/[0.09]' },
  ALERT: { label: 'تنبيه', icon: ShieldAlert, cls: 'text-ember-600 border-ember-500/30 bg-ember-500/[0.07]' },
  INFO: { label: 'إعلان', icon: Megaphone, cls: 'text-ink-600 border-brand-900/10 bg-white/70' },
};

const FILTERS = ['الكل', 'LECTURE', 'TASK', 'ALERT', 'INFO'] as const;

export function NoticesFeed() {
  const [items, setItems] = React.useState<Notice[] | null>(null);
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>('الكل');

  const load = React.useCallback(() => {
    return api<{ items: Notice[] }>('/api/notifications')
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]));
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const unread = items?.filter((notice) => !notice.readAt).length ?? 0;
  const shown = (items ?? []).filter((notice) => filter === 'الكل' || notice.kind === filter);

  const markAll = async () => {
    if (!items) return;
    setItems(items.map((notice) => ({ ...notice, readAt: notice.readAt || new Date().toISOString() })));
    try {
      await api('/api/notifications', { method: 'POST', body: JSON.stringify({ all: true }) });
    } catch {
      /* تجاهل */
    }
  };

  const markOne = async (id: string) => {
    if (!items) return;
    const refreshed = items.map((notice) => (notice.id === id ? { ...notice, readAt: notice.readAt || new Date().toISOString() } : notice));
    setItems(refreshed);
    try {
      await api('/api/notifications', { method: 'POST', body: JSON.stringify({ ids: [id] }) });
    } catch {
      /* تجاهل */
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          لائحة الإعلانات
          {unread > 0 ? (
            <span className="rounded-full bg-ember-500 px-2 py-0.5 text-[9.5px] font-bold text-white" dir="ltr">
              {unread} جديد
            </span>
          ) : null}
        </CardTitle>
        <div className="flex items-center gap-1.5">
          {FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold transition ${
                filter === option
                  ? 'border-brand-500/35 bg-brand-500/[0.10] text-brand-700'
                  : 'border-brand-900/10 bg-white/60 text-ink-400 hover:text-ink-700'
              }`}
            >
              {option === 'الكل' ? 'الكل' : KIND_META[option]?.label ?? option}
            </button>
          ))}
          {unread > 0 ? (
            <button
              type="button"
              onClick={() => void markAll()}
              title="تعليم الكل كمقروء"
              className="flex h-6 w-6 items-center justify-center rounded-lg border border-brand-900/10 bg-white/60 text-ink-400 transition hover:text-brand-700"
              aria-label="تعليم الكل كمقروء"
            >
              <CheckCheck className="h-3 w-3" />
            </button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {items === null ? (
          <RowsSkeleton rows={3} />
        ) : shown.length === 0 ? (
          <EmptyState
            kind="notices"
            compact
            title="لائحتك صافية — مفيش إعلانات جديدة"
            sub="أول ما يتفتح محاضرة أو ينزل تاسك هيوصل هنا فورًا"
          />
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {shown.map((notice, index) => {
              const meta = KIND_META[notice.kind] ?? KIND_META.INFO;
              const Icon = meta.icon;
              const inner = (
                <>
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${meta.cls}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-bold text-ink-900">{notice.title}</span>
                      {!notice.readAt ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" /> : null}
                    </span>
                    {notice.body ? <span className="mt-0.5 line-clamp-2 block text-[10.5px] text-ink-400">{notice.body}</span> : null}
                    <span className="mt-1 block text-[9.5px] text-ink-300">
                      {new Date(notice.createdAt).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </span>
                  </span>
                </>
              );
              return (
                <motion.li
                  key={notice.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                >
                  {notice.link ? (
                    <Link
                      href={notice.link}
                      onClick={() => void markOne(notice.id)}
                      className={`flex items-start gap-2.5 rounded-2xl border p-3 transition ${!notice.readAt ? 'border-gold-400/25 bg-gold-400/[0.05]' : 'border-brand-900/10 bg-white/60'} hover:border-brand-500/25`}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void markOne(notice.id)}
                      className={`flex w-full flex-wrap items-start gap-2.5 rounded-2xl border p-3 text-right transition ${!notice.readAt ? 'border-gold-400/25 bg-gold-400/[0.05]' : 'border-brand-900/10 bg-white/60'} hover:border-brand-500/25`}
                    >
                      {inner}
                    </button>
                  )}
                </motion.li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
