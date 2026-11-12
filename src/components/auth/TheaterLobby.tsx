'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, CalendarDays, ScanLine } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { StageBrand } from '@/components/landing/StageBrand';
import '@/components/landing/academic-theater.css';
import './theater-lobby.css';
import './admission-hall.css';

export function TheaterLobby({ children }: { children: React.ReactNode }) {
  const { lang, setLang } = useLang();
  const en = lang === 'en';
  return <div className="rq-auth auth-dark auth-theatre p2-admission" dir={en ? 'ltr' : 'rtl'}>
    <div className="p2-hall-backdrop" aria-hidden><Image src="/images/phase2/admission-hall.webp" alt="" fill priority sizes="100vw"/></div>
    <aside className="rq-auth-story">

      <Link href="/" className="rq-auth-brand" aria-label="رقيب — الرئيسية"><StageBrand/></Link>
      <div className="rq-auth-copy"><p className="rq-auth-eyebrow">RAQIB / THE ACADEMIC THEATER</p><h1>{en ? 'Your next chapter' : 'خذ مكانك.'}<br/><em>{en ? 'begins here.' : 'المشهد يبدأ بك.'}</em></h1><p>{en ? 'A space for your lectures, coursework and progress. Welcome to your academic journey.' : 'مساحة لمحاضراتك، ومهامك، وكل خطوة في طريقك. أهلًا بك في رحلتك الأكاديمية.'}</p><div className="rq-auth-features">{[[CalendarDays, en ? 'Your schedule' : 'جدولك'], [ScanLine, en ? 'Attendance' : 'حضورك'], [BookOpen, en ? 'Your courses' : 'مقرراتك']].map(([Icon, label]) => { const Symbol = Icon as typeof CalendarDays; return <span key={String(label)}><Symbol size={18} strokeWidth={1.4}/>{String(label)}</span>; })}</div></div>
      <div className="p2-foyer-window"><Image src="/images/phase2/foyer.webp" alt="" fill sizes="350px"/></div><p className="rq-auth-caption">{en ? 'A stage for every ambition.' : 'لكل طموحٍ مسرح. ولكل خطوةٍ معنى.'}</p>
    </aside>
    <main className="rq-auth-main"><button className="p2-language" onClick={() => setLang(en ? "ar" : "en")} aria-label={en ? "العربية" : "Switch to English"}>{en ? "عربي" : "EN"}</button><Link href="/" className="rq-auth-back"><ArrowRight size={16}/>{en ? 'Back to home' : 'العودة للرئيسية'}</Link><div className="rq-auth-form">{children}</div><p className="rq-auth-bottom">RAQIB <span>·</span> {en ? 'YOUR ACADEMIC SPACE' : 'مساحتك الأكاديمية'}</p></main>
  </div>;
}
