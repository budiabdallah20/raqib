'use client';

/**
 * ⌘ سجل الأوامر — لوحة الأوامر (Ctrl+K) تُبنى من: أوامر مدمجة + كل صفحة
 * تسجل أوامرها الخاصة. حدث النافذة `raqib:palette:open` يفتح اللوحة من أي مكان.
 */
import * as React from 'react';

export type Command = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  keywords?: string;
  href?: string;
  run?: () => void;
};

export const PALETTE_EVENT = 'raqib:palette:open';
export const SETTINGS_EVENT = 'raqib:settings:open';
export const SCAN_EVENT = 'raqib:scan:open';

const listeners = new Set<() => void>();
const owners = new Map<string, Command[]>();
let cache: Command[] | null = null;

function invalidate() {
  cache = null;
  listeners.forEach((listener) => listener());
}

export function setCommands(owner: string, commands: Command[]) {
  owners.set(owner, commands);
  invalidate();
}

export function clearCommands(owner: string) {
  owners.delete(owner);
  invalidate();
}

export function allCommands(): Command[] {
  if (!cache) {
    cache = [];
    owners.forEach((commands) => cache!.push(...commands));
  }
  return cache;
}

export function useCommands(): Command[] {
  return React.useSyncExternalStore(
    subscribe,
    () => {
      if (!cache) {
        cache = [];
        owners.forEach((commands) => cache!.push(...commands));
      }
      return cache;
    },
    () => [] as Command[],
  );
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function openPalette() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PALETTE_EVENT));
}

export function openSettings() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT));
}

/* ── تنبيه المحاضرة القادمة — كل متوفر يحدّثه والوكيل (PortalAgent) يقرؤه ── */

export type LiveReminder = {
  /** ISO timestamp للمحاضرة القادمة */
  nextAt: string;
  title: string;
  course?: string;
  room?: string | null;
};

let liveReminder: LiveReminder | null = null;

export function setLiveReminder(value: LiveReminder | null) {
  liveReminder = value;
}

export function getLiveReminder(): LiveReminder | null {
  return liveReminder;
}

/** تطبيع عربي خفيف للبحث: حذف التشكيل وتوحيد الألف والياء والتاء المربوطة */
export function normalizeArabic(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ـ/g, '')
    .trim();
}
