'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Scale,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export type PolicyTab = 'privacy' | 'terms' | 'rights';

const TABS: Array<{
  id: PolicyTab;
  label: string;
  icon: React.ElementType;
}> = [
  { id: 'privacy', label: 'سياسة الخصوصية', icon: ShieldCheck },
  { id: 'terms', label: 'الشروط والأحكام', icon: FileText },
  { id: 'rights', label: 'حقوقك', icon: Scale },
];

const SECTIONS: Record<
  PolicyTab,
  { title: string; body: string[] }[]
> = {
  privacy: [
    { title: 'التشغيل ومقدمو الخدمة', body: ['يستخدم المشروع PostgreSQL على Neon للبيانات وإعدادات نشر Vercel. قد يستخدم Resend لإرسال رسائل استعادة الحساب وGoogle Drive للملفات عند تهيئتهما. لا يعني وجود التكامل أنه مفعل لكل حساب.', 'بيانات التسجيل قد تشمل الهوية الأكاديمية والمقررات، ومع استخدام المنصة تُسجَّل بيانات الحضور والمهام والنتائج. تُحفظ تفضيلات اللغة وبعض تفضيلات الواجهة محليًا في المتصفح.', 'للاستفسار أو طلب تصحيح البيانات: budiabdallah922@gmail.com. تفاصيل المسؤول القانوني ومواقع المعالجة ومدد الاحتفاظ تحتاج مراجعة واعتماد مالك المنصة.'] },
    {
      title: 'البيانات التي نجمعها',
      body: [
        'نجمع بيانات الحساب الأساسية: الاسم، البريد الإلكتروني أو رقم الهاتف، نوع الحساب (طالب أو دكتور)، وصورة الملف الشخصي إن اخترت رفعها.',
        'بيانات اختيارية مثل تاريخ الميلاد، النوع، وتفضيلات بصمة الوجه أو الإصبع تُستخدم فقط لتخصيص التجربة، ولا تُجمع أي بيانات بيومترية فعلية في هذه المرحلة.',
        'بيانات الاستخدام المرتبطة بالحضور: المحاضرات، وقت المسح، حالة الحضور، وعنوان IP لأغراض الأمان ومنع إساءة الاستخدام.',
      ],
    },
    {
      title: 'كيف نستخدم البيانات',
      body: [
        'تشغيل المنصة وإدارة الحسابات والمقررات والمحاضرات، وتوليد تقارير الحضور للطلاب وأعضاء هيئة التدريس.',
        'حماية المنصة من محاولات الدخول غير المصرح بها، والتحقق من الهوية، وإرسال أكواد إعادة تعيين كلمة المرور.',
        'لا نبيع بياناتك، ولا نستخدمها في الإعلانات، ولا نشاركها مع أي طرف ثالث لأغراض تجارية.',
      ],
    },
    {
      title: 'التخزين والأمان',
      body: [
        'تُخزَّن كلمات المرور كقيم تجزئة باستخدام bcrypt. تُوقَّع رموز الجلسة ويراجع الخادم صلاحيتها وصلاحيات الحساب. استخدم عنوان HTTPS المنشور؛ المعاينة المحلية قد تعمل عبر HTTP.',
        'لم تُحدَّد مدة احتفاظ موحدة في هذه النسخة. تحتاج مدد الاحتفاظ وطلبات الحذف ومواعيد الرد إلى اعتماد مسؤول التشغيل؛ لا نَعِد بحذف تلقائي أو فوري للسجلات الأكاديمية.',
        'يتحدد الوصول بحسب الدور: الطالب لسجلاته، وعضو هيئة التدريس للمقررات المصرح بها، والإدارة للمهام الإدارية. تُسجَّل عمليات حساسة لأغراض المراجعة.',
      ],
    },
    {
      title: 'ملفات تعريف الارتباط',
      body: [
        'نستخدم ملف ارتباط واحدًا ضروريًا لتسجيل الدخول (raqib_token)، وهو httpOnly ولا يمكن قراءته بواسطة JavaScript.',
        'لا نستخدم ملفات تتبع إعلانية أو أدوات تحليل خارجية في هذه المرحلة.',
      ],
    },
  ],
  terms: [
    {
      title: 'قبول الشروط',
      body: [
        'باستخدامك منصة رقيب فإنك توافق على هذه الشروط وسياسة الخصوصية. إذا لم تكن موافقًا، يُرجى عدم استخدام المنصة.',
        'المنصة مخصصة للطلاب وأعضاء هيئة التدريس والإدارة ممن لديهم حسابات وصلاحيات معتمدة.',
      ],
    },
    {
      title: 'مسؤولية الحساب',
      body: [
        'أنت مسؤول عن سرية كلمة المرور وعن جميع الأنشطة التي تتم من خلال حسابك.',
        'يُمنع مشاركة الحساب أو تسجيل حضور نيابة عن طالب آخر، ويُعد ذلك مخالفة أكاديمية تستوجب الإيقاف.',
        'يجب إبلاغ الإدارة فورًا عند الاشتباه في أي وصول غير مصرح به.',
      ],
    },
    {
      title: 'نزاهة الحضور',
      body: [
        'رمز الـ QR مخصص لمحاضرة واحدة ولمدة زمنية محددة، ويُمنع نسخه أو مشاركته خارج قاعة المحاضرة.',
        'تحتفظ إدارة المنصة بحق مراجعة سجلات الحضور وإلغاء أي تسجيل مشبوه.',
      ],
    },
    {
      title: 'حدود الخدمة',
      body: [
        'نسعى لتوفير خدمة متاحة على مدار الساعة، لكن قد تحدث صيانة أو انقطاع مؤقت. لا نتحمل مسؤولية أي خسارة ناتجة عن سوء استخدام أو انقطاع خارج إرادتنا.',
        'يجوز لنا تحديث هذه الشروط، وسيتم إشعارك بالتغييرات الجوهرية داخل المنصة.',
      ],
    },
  ],
  rights: [
    { title: 'الملكية الفكرية والعلامات', body: ['حقوق البرمجيات والمحتوى لأصحابها. تُعرض علامات التقنيات والجامعة والكلية للتعريف ولا تعني رعاية أو اعتمادًا رسميًا.', 'صور المسرح أصول قدمها مالك المشروع؛ حقوقها الأصلية تبقى لأصحابها. صورة المطور وهوية BUDI مستمدتان من بورتفوليو المطور بإذنه لهذه الواجهة.'] },
    {
      title: 'حق الوصول',
      body: [
        'يمكنك طلب نسخة من البيانات التي نحتفظ بها عنك، ومعرفة كيفية استخدامها.',
      ],
    },
    {
      title: 'حق التصحيح',
      body: [
        'يمكنك تعديل بياناتك الأساسية من إعدادات الحساب، أو مراسلة الإدارة لتصحيح أي بيانات غير دقيقة.',
      ],
    },
    {
      title: 'حق الحذف',
      body: [
        'يمكنك طلب حذف حسابك وبياناتك الشخصية، مع مراعاة المتطلبات الأكاديمية والاحتفاظ بسجلات الحضور اللازمة رسميًا.',
      ],
    },
    {
      title: 'حق الاعتراض وسحب الموافقة',
      body: [
        'يمكنك سحب موافقتك على البيانات الاختيارية (مثل تاريخ الميلاد) في أي وقت دون التأثير على استخدامك الأساسي للمنصة.',
        'لأي استفسار أو شكوى، تواصل مع إدارة المنصة عبر قنوات الدعم المتاحة.',
      ],
    },
  ],
};

export function PolicyModal({
  open,
  onClose,
  initialTab = 'privacy',
}: {
  open: boolean;
  onClose: () => void;
  initialTab?: PolicyTab;
}) {
  const [tab, setTab] = React.useState<PolicyTab>(initialTab);
  const dialogRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    const previous = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus(), 0);
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab' && dialogRef.current) {
        const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button, a[href], [tabindex="0"]'));
        const first = items[0]; const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(focusTimer);
      previousFocus?.focus();
      window.removeEventListener('keydown', onKey);
    };
  }, [open, initialTab, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[150] flex items-center justify-center px-4 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-[#06110d]/45 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            ref={dialogRef}
            aria-modal="true"
            aria-label="السياسات والحقوق"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="card-glow relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#F28C28]/35 bg-[#221016]/95 text-[#F8F5F2] shadow-[0_40px_120px_-24px_rgba(0,0,0,0.95)] backdrop-blur-2xl"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(255,145,77,0.12),transparent_70%)] opacity-80" />
            <div className="relative flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <Image src="/brand/stage-mark.svg" width={40} height={40} alt="" />
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-[#FFB45C]">
                    <Sparkles className="h-3 w-3" />
                    RAQIB LEGAL
                  </p>
                  <h2 className="mt-1 font-display text-xl font-extrabold text-[#FAF6EE]">
                    الخصوصية والحقوق
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق"
                className="btn-ghost flex h-9 w-9 items-center justify-center rounded-xl transition hover:bg-white/[0.06] hover:text-[#FAF6EE]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative flex gap-1 overflow-x-auto border-b border-white/10 px-4 py-2 no-scrollbar">
              {TABS.map((item) => {
                const Icon = item.icon;
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={cn(
                      'flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition',
                      active
                        ? 'border border-[#F28C28]/40 bg-[#F28C28]/[0.14] text-[#FFB45C]'
                        : 'text-[#a89aa2] hover:bg-white/[0.05] hover:text-[#FAF6EE]',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="relative flex-1 overflow-y-auto px-6 py-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  {SECTIONS[tab].map((section) => (
                    <section key={section.title}>
                      <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-[#FFB45C]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FFB45C]" />
                        {section.title}
                      </h3>
                      <div className="space-y-2 border-r border-[#F28C28]/30 pr-4">
                        {section.body.map((paragraph, index) => (
                          <p
                            key={index}
                            className="text-[12.5px] leading-7 text-[#a89aa2]"
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </section>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
              <p className="text-[10.5px] text-[#a89aa2]">
                آخر تحديث: أكتوبر 2026 · منصة رقيب
              </p>
              <button
                type="button"
                onClick={onClose}
                className="btn-primary flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-[#1a0c10] transition hover:-translate-y-0.5"
              >
                فهمت
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
