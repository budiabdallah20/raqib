'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { ArrowLeft, ArrowUpRight, BookOpen, CalendarDays, Check, ChevronDown, GraduationCap, Layers3, Menu, ScanLine, ShieldCheck, Users, X } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import type { PolicyTab } from '@/components/auth/PolicyModal';
import { StageBrand } from './StageBrand';
import './academic-theater.css';
import './phase-two.css';
import { TechnologyAuditorium } from './TechnologyAuditorium';
import { GrandFinale } from './GrandFinale';

const PolicyModal = dynamic(() => import('@/components/auth/PolicyModal').then(m => m.PolicyModal));

export function AcademicTheater() {
  const { lang, setLang } = useLang();
  const en = lang === 'en';
  const copy = (ar: string, english: string) => en ? english : ar;
  const [menu, setMenu] = useState(false);
  const [policy, setPolicy] = useState<PolicyTab | null>(null);
  const nav = [['#roles', copy('بوابات رقيب', 'Portals')], ['#features', copy('إمكانيات المنصة', 'Capabilities')], ['#journey', copy('رحلتك معنا', 'Your journey')], ['#technology', copy('التقنيات', 'Technology')]];
  const roles = [
    { icon: GraduationCap, number: '01', title: copy('الطالب', 'Student'), subtitle: 'THE LEARNER', body: copy('مساحة تجمع يومك الدراسي، وتترك لك وقتًا لما يستحق: التعلّم.', 'Your academic day, in one place. More room for what matters: learning.'), points: [copy('جدولك ومحاضراتك', 'Schedule and lectures'), copy('الحضور والمهام الدراسية', 'Attendance and coursework'), copy('متابعة تقدمك الأكاديمي', 'Your academic progress')], href: '/login?intent=student' },
    { icon: BookOpen, number: '02', title: copy('عضو هيئة التدريس', 'Teaching staff'), subtitle: 'THE EDUCATOR', body: copy('من تنظيم المحاضرة إلى متابعة طلابك. رؤية أوضح لكل خطوة.', 'From preparing a lecture to following your students. Clarity at every step.'), points: [copy('إدارة المحاضرات والمقررات', 'Lectures and courses'), copy('متابعة حضور الطلاب', 'Student attendance'), copy('المهام والتقارير الأكاديمية', 'Coursework and reports')], href: '/login?intent=professor' },
    { icon: ShieldCheck, number: '03', title: copy('مسؤول النظام', 'Administrator'), subtitle: 'THE ORGANIZER', body: copy('نظرة مترابطة للعمل الأكاديمي، وأدوات للإدارة وفق صلاحياتك.', 'A connected view of academic operations, with tools appropriate to your permissions.'), points: [copy('إدارة الحسابات والمقررات', 'Accounts and courses'), copy('تنظيم العملية الدراسية', 'Academic organization'), copy('التقارير والمتابعة', 'Reports and oversight')], href: '/login?tab=admin&intent=admin' },
  ];
  const features = [
    { icon: ScanLine, title: copy('حضورك، بخطوة واحدة.', 'Check in. Carry on.'), text: copy('سجّل حضور المحاضرة باستخدام رمز QR، وراجع سجلك من حسابك.', 'Check in with a lecture QR code and review attendance from your account.'), tag: '01 / ATTENDANCE' },
    { icon: CalendarDays, title: copy('يومك الدراسي، بوضوح.', 'A clearer academic day.'), text: copy('المقررات ومواعيد المحاضرات في جدول يجمع تفاصيل يومك.', 'Courses and lecture times brought together in your schedule.'), tag: '02 / SCHEDULE' },
    { icon: Layers3, title: copy('كل مهمة في مكانها.', 'Everything in its place.'), text: copy('تابع التكليفات والمواد الدراسية المرتبطة بمقرراتك.', 'Follow coursework and learning materials for your courses.'), tag: '03 / COURSEWORK' },
    { icon: Users, title: copy('متابعة تصنع الفارق.', 'Progress you can follow.'), text: copy('اطّلع على الحضور والنتائج المنشورة، وفق صلاحيات حسابك.', 'Review attendance and published results within your account permissions.'), tag: '04 / PROGRESS' },
  ];
  return <div className="rq-public" dir={en ? 'ltr' : 'rtl'}>
    <a className="rq-skip" href="#main">{copy('انتقل للمحتوى', 'Skip to content')}</a>
    <header className="rq-nav">
      <Link href="/" aria-label={copy('رقيب — الرئيسية', 'Raqib — home')}><StageBrand /></Link>
      <nav className="rq-desktop-nav" aria-label={copy('القائمة الرئيسية', 'Main navigation')}>{nav.map(([href, label]) => <a key={href} href={href}>{label}</a>)}</nav>
      <div className="rq-nav-actions"><button className="rq-language" onClick={() => setLang(en ? 'ar' : 'en')} aria-label={en ? 'العربية' : 'Switch to English'}>{en ? 'عربي' : 'EN'}</button><Link className="rq-nav-login" href="/login">{copy('تسجيل الدخول', 'Sign in')}<ArrowUpRight size={16} /></Link><button className="rq-menu-toggle" aria-label={copy('القائمة', 'Menu')} aria-expanded={menu} aria-controls="rq-mobile-nav" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button></div>
      {menu && <nav id="rq-mobile-nav" className="rq-mobile-nav" onKeyDown={e => { if (e.key === 'Escape') setMenu(false); }}>{nav.map(([href, label]) => <a key={href} href={href} onClick={() => setMenu(false)}>{label}</a>)}</nav>}
    </header>
    <main id="main">
      <section className="rq-hero">
        <Image className="rq-hero-image" src="/images/theatre/auditorium.webp" alt="" fill priority sizes="100vw" />
        <div className="rq-hero-shade" />
        <div className="rq-hero-content">
          <p className="rq-eyebrow"><span />{copy('رقيب · مساحتك الأكاديمية', 'RAQIB · YOUR ACADEMIC SPACE')}<span /></p>
          <h1>{copy('لكل طموحٍ مسرح.', 'Every ambition has a stage.')}<br /><em>{copy('وهنا يبدأ مشهدك.', 'Yours begins here.')}</em></h1>
          <p className="rq-hero-description">{copy('من أول محاضرة إلى آخر إنجاز. رقيب يجمع تفاصيل رحلتك الدراسية في تجربة واحدة، واضحة ومترابطة.', 'From your first lecture to your next achievement. Raqib brings your academic journey together in one clear, connected experience.')}</p>
          <div className="rq-actions"><Link href="/register" className="rq-button rq-primary">{copy('ابدأ رحلتك', 'Start your journey')}<ArrowLeft size={18} /></Link><a href="#roles" className="rq-button rq-secondary">{copy('اكتشف المنصة', 'Explore the platform')}<ChevronDown size={18} /></a></div>
          <div className="rq-hero-note"><span />{copy('تجربة أكاديمية لقسم الرياضيات وعلوم الحاسب', 'An academic pilot for Mathematics & Computer Science')}</div>
        </div>
        <div className="rq-hero-bottom"><span dir="ltr">THE ACADEMIC THEATER / RAQIB</span><a href="#roles">{copy('المشهد التالي', 'The next scene')}<ChevronDown size={15}/></a><span dir="ltr">01 — 06</span></div>
      </section>
      <section className="rq-section rq-roles" id="roles">
        <div className="rq-section-heading"><div><p className="rq-kicker">01 / {copy('بوابات رقيب', 'THE PORTALS')}</p><h2>{copy('ثلاث بوابات.', 'Three portals.')} <em>{copy('حكاية واحدة.', 'One shared story.')}</em></h2></div><p>{copy('اختر مدخلك إلى رقيب. لكل دور أدواته، وللجميع تجربة تجمعهم.', 'Find your way into Raqib. Purposeful tools for every role, connected by one experience.')}</p></div>
        <div className="rq-role-grid">{roles.map((r, i) => <article className={`rq-role-card ${i === 0 ? 'rq-role-featured' : ''}`} key={r.number}><div className="rq-role-top"><span className="rq-icon"><r.icon size={29} strokeWidth={1.3}/></span><span className="rq-card-number">{r.number}</span></div><p className="rq-role-caption" lang="en">{r.subtitle}</p><h3>{r.title}</h3><p className="rq-role-body">{r.body}</p><ul>{r.points.map(p => <li key={p}><Check size={15}/>{p}</li>)}</ul><Link href={r.href}>{copy('ادخل بوابتك', 'Enter your portal')}<ArrowLeft size={18}/></Link></article>)}</div>
        <p className="rq-permissions"><ShieldCheck size={14}/>{copy('تُحدَّد صلاحيات الدخول من حسابك المعتمد.', 'Access is determined by your authorized account.')}</p>
      </section>
      <section className="rq-journey-band" id="journey"><div className="rq-section"><div className="rq-section-heading"><div><p className="rq-kicker">02 / {copy('رحلتك معنا', 'YOUR JOURNEY')}</p><h2>{copy('خطوات بسيطة.', 'Simple steps.')} <em>{copy('أثر أكبر.', 'Lasting impact.')}</em></h2></div><p>{copy('تنظيم أقل. تركيز أكثر. مساحة لكل إنجاز قادم.', 'Less to organize. More room to focus. Space for your next achievement.')}</p></div><ol className="rq-steps">{[[copy('انضم إلى رقيب', 'Join Raqib'), copy('أنشئ حسابك أو سجّل الدخول بحسابك الحالي.', 'Create an account or sign in with your existing one.')], [copy('واكب يومك', 'Follow your day'), copy('راجع محاضراتك ومهامك وسجّل حضورك.', 'Review lectures and coursework, and check in.')], [copy('تابع تقدمك', 'See your progress'), copy('ارجع إلى سجلك ونتائجك المنشورة في أي وقت.', 'Return to your records and published results.')]].map(([title, body], i) => <li key={title}><span className="rq-step-number">0{i + 1}</span><h3>{title}</h3><p>{body}</p></li>)}</ol></div></section>
      <section className="rq-section" id="features"><div className="rq-section-heading"><div><p className="rq-kicker">03 / {copy('خلف كل إنجاز', 'BEHIND EVERY ACHIEVEMENT')}</p><h2>{copy('تفاصيل كثيرة.', 'Many details.')} <em>{copy('مساحة واحدة.', 'One place.')}</em></h2></div><Link className="rq-text-link" href="/login">{copy('تعرّف عليها من حسابك', 'Explore from your account')}<ArrowUpRight size={17}/></Link></div><div className="rq-feature-grid">{features.map(f => <article className="rq-feature" key={f.tag}><f.icon size={34} strokeWidth={1.2}/><small dir="ltr">{f.tag}</small><h3>{f.title}</h3><p>{f.text}</p></article>)}</div></section>
      <TechnologyAuditorium en={en} />
      <section className="rq-section rq-trust"><span className="rq-trust-icon"><ShieldCheck size={44} strokeWidth={1}/></span><div><p className="rq-kicker">04 / {copy('خلف الكواليس', 'BACKSTAGE')}</p><h2>{copy('مساحة تخصّك.', 'Your own space.')} <em>{copy('وصول بصلاحيات واضحة.', 'Clearly defined access.')}</em></h2><p>{copy('حسابك هو مدخلك إلى بياناتك الأكاديمية. تتحقق المنصة من صلاحيات الحساب قبل إتاحة السجلات والإجراءات.', 'Your account is your gateway to your academic records. The platform verifies account permissions before granting access to records and actions.')}</p></div></section>
      <section className="rq-section rq-faq" id="faq"><p className="rq-kicker">05 / {copy('قبل أن تبدأ', 'BEFORE YOU BEGIN')}</p><h2>{copy('أسئلة في مكانها.', 'Good questions.')}</h2>{[[copy('هل أحتاج إلى تحميل تطبيق؟', 'Do I need to install an app?'), copy('يمكنك استخدام رقيب مباشرة من متصفح هاتفك أو جهاز الكمبيوتر.', 'You can use Raqib directly in your phone or desktop browser.')], [copy('كيف أختار البوابة المناسبة؟', 'How do I choose a portal?'), copy('اختر البوابة المرتبطة بدورك. الوصول الفعلي يتحدد من حسابك وصلاحياته، وليس من اختيار البطاقة.', 'Choose the portal for your role. Actual access follows your account permissions, not the card you select.')], [copy('نسيت كلمة المرور، ماذا أفعل؟', 'What if I forget my password?'), copy('استخدم خيار «نسيت كلمة المرور» من صفحة تسجيل الدخول واتبع تعليمات الاستعادة.', 'Use “Forgot password” on the sign-in page and follow the recovery instructions.')]].map(([q, a]) => <details key={q}><summary>{q}<ChevronDown size={18}/></summary><p>{a}</p></details>)}</section>
      <section className="rq-invitation"><Image src="/images/theatre/curtain.webp" alt="" fill sizes="100vw"/><div className="rq-invitation-shade"/><div className="rq-invitation-content"><p className="rq-kicker">06 / {copy('الدعوة لك', 'YOUR INVITATION')}</p><h2>{copy('المشهد القادم', 'The next scene')}<br/><em>{copy('يبدأ بك.', 'begins with you.')}</em></h2><p>{copy('خذ مكانك. وابدأ رحلة أكاديمية أكثر وضوحًا.', 'Take your place. Begin a clearer academic journey.')}</p><div className="rq-actions"><Link href="/register" className="rq-button rq-primary">{copy('أنشئ حسابك', 'Create your account')}<ArrowLeft size={18}/></Link><Link href="/login" className="rq-button rq-secondary">{copy('لديّ حساب بالفعل', 'I already have an account')}</Link></div></div></section>
    </main>
    <GrandFinale en={en} onPolicy={setPolicy} />
    {policy && <PolicyModal open initialTab={policy} onClose={() => setPolicy(null)}/>}
  </div>;
}
