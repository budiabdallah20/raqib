import { ROLE_HOME } from './constants';

/** Return paths are convenience only; they never decide a user's server-authorized role. */
export function safeReturnPath(raw: string | null, role: string): string {
  const home = ROLE_HOME[role] || '/';
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\') || /[\u0000-\u001f]/.test(raw)) return home;
  try {
    const url = new URL(raw, 'https://raqib.invalid');
    if (url.origin !== 'https://raqib.invalid') return home;
    if (url.pathname !== home && !url.pathname.startsWith(`${home}/`)) return home;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return home;
  }
}
