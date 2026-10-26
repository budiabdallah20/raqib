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
import { LogoMark } from '@/components/shared/Logo';

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
        'كلمات المرور تُخزَّن مشفّرة باستخدام bcrypt، والجلسات محمية برموز JWT موقّعة ومشفّرة، والاتصال مؤمَّن عبر HTTPS.',
        'نحتفظ بالبيانات طوال فترة نشاط الحساب، ويمكن حذفها بناءً على طلبك وفق سياسة الاحتفاظ المعتمدة بالجامعة.',
        'الوصول إلى البيانات مقصور على صاحب الحساب والإدارة المصرح لها، مع تسجيل للعمليات الحساسة.',
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
        'المنصة مخصصة لطلاب وأعضاء هيئة التدريس وإدارة كلية العلوم — جامعة السويس.',
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
        'يمكنك سحب موافقتك على البيانات الاختيارية (مثل تاريخ الميلاد وبصمة الوجه) في أي وقت دون التأثير على استخدامك الأساسي للمنصة.',
        'لأي استفسار أو شكوى، تواصل مع إدارة المنصة عبر البريد الرسمي لكلية العلوم — جامعة السويس.',
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

  React.useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
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
            aria-modal="true"
            aria-label="السياسات والحقوق"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="card-glow relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-[0_40px_120px_-24px_rgba(8,22,17,0.5)] backdrop-blur-2xl"
          >
            <div className="pointer-events-none absolute inset-0 bg-mesh-gold opacity-40" />
            <div className="relative flex items-start justify-between gap-4 border-b border-brand-900/[0.08] px-6 py-5">
              <div className="flex items-center gap-3">
                <LogoMark className="h-10 w-10" />
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-gold-700">
                    <Sparkles className="h-3 w-3" />
                    RAQIB LEGAL
                  </p>
                  <h2 className="mt-1 font-display text-xl font-extrabold text-ink-950">
                    الخصوصية والحقوق
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-900/10 bg-white/65 text-ink-400 transition hover:border-brand-500/30 hover:text-ink-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative flex gap-1 overflow-x-auto border-b border-brand-900/[0.08] px-4 py-2 no-scrollbar">
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
                        ? 'bg-brand-500/10 text-brand-700'
                        : 'text-ink-400 hover:bg-brand-500/[0.05] hover:text-ink-800',
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
                      <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-brand-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
                        {section.title}
                      </h3>
                      <div className="space-y-2 border-r border-gold-500/25 pr-4">
                        {section.body.map((paragraph, index) => (
                          <p
                            key={index}
                            className="text-[12.5px] leading-7 text-ink-500"
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

            <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-brand-900/[0.08] px-6 py-4">
              <p className="text-[10.5px] text-ink-400">
                آخر تحديث: أكتوبر 2026 · منصة رقيب — جامعة السويس
              </p>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 rounded-xl bg-[linear-gradient(110deg,#8a6424,#c8a24b_45%,#e6cb78)] px-4 py-2 text-xs font-bold text-[#1c1503] shadow-[0_10px_28px_-12px_rgba(200,162,75,.6)] transition hover:-translate-y-0.5"
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
