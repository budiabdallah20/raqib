'use client';
import { StageBrand } from '@/components/landing/StageBrand';
import { useLang } from '@/lib/i18n';

export function AdmissionTicket({children,title,subtitle,footer,variant}:{children:React.ReactNode;title?:string;subtitle?:string;footer?:React.ReactNode;variant?:'login'|'register'|'admin'}) {
 const {lang}=useLang();const en=lang==='en';
 return <section className="p2-ticket" aria-label={title}>
  <div className="p2-ticket-head"><StageBrand compact/><span>ADMIT ONE<small>{en?'YOUR ACADEMIC JOURNEY':'رحلتك الأكاديمية'}</small></span></div>
  <div className="p2-ticket-perforation" aria-hidden/>
  <div className="p2-ticket-title"><p>{variant==='register'?'02 / NEW ADMISSION':variant==='admin'?'03 / AUTHORIZED ACCESS':'01 / WELCOME BACK'}</p><h2>{title}</h2><span>{subtitle}</span></div>
  <div className="p2-ticket-content">{children}</div>
  <div className="p2-ticket-perforation" aria-hidden/>
  <div className="p2-ticket-foot"><span className="p2-ticket-bars" aria-hidden/><p>{en?'Your account determines your access.':'حسابك المعتمد يحدد صلاحيات دخولك.'}</p><span>RQ / {variant==='register'?'JOIN':'ENTER'}</span></div>
  <div className="sr-only">{footer}</div>
 </section>;
}
