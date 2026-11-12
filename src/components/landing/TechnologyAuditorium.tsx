import Image from 'next/image';

const stack = [
  ['nextdotjs', 'Next.js', 'التطبيق والمسارات', 'Application & routing', '#ffffff'],
  ['react', 'React', 'واجهات تفاعلية', 'Interactive interfaces', '#61DAFB'],
  ['typescript', 'TypeScript', 'أنواع واضحة', 'Typed application', '#3178C6'],
  ['tailwindcss', 'Tailwind CSS', 'تنسيق متجاوب', 'Responsive styling', '#06B6D4'],
  ['nodedotjs', 'Node.js', 'تشغيل الخادم', 'Server runtime', '#5FA04E'],
  ['prisma', 'Prisma', 'الوصول للبيانات', 'Data access', '#ffffff'],
  ['postgresql', 'PostgreSQL', 'قاعدة بيانات الإنتاج', 'Production database', '#4169E1'],
  ['neon', 'Neon', 'استضافة PostgreSQL', 'Hosted PostgreSQL', '#00E599'],
  ['sqlite', 'SQLite', 'الاختبارات المحلية', 'Local test database', '#38a5d4'],
  ['framer', 'Framer Motion', 'حركة الواجهات', 'Interface motion', '#ffffff'],
  ['vercel', 'Vercel', 'إعدادات النشر', 'Deployment configuration', '#ffffff'],
  ['github', 'GitHub', 'مستودع المشروع', 'Project repository', '#ffffff'],
] as const;

export function TechnologyAuditorium({ en }: { en: boolean }) {
  return <section className="p2-auditorium" id="technology">
    <div className="rq-section">
      <div className="rq-section-heading"><div><p className="rq-kicker">THE TECHNOLOGY AUDITORIUM</p><h2>{en ? 'Behind the curtain.' : 'خلف الستار.'} <em>{en ? 'Built with purpose.' : 'تقنيات تصنع التجربة.'}</em></h2></div><p>{en ? 'The tools behind Raqib. Each has a role, and a seat in our auditorium.' : 'لكل تقنية دور في رقيب. ولكل دور مقعد في قاعة تُبنى فيها التجربة.'}</p></div>
      <div className="p2-auditorium-layout"><figure className="p2-seat-photo"><Image src="/images/phase2/royal-seat.webp" alt={en ? 'Red velvet theater chair with a gold frame' : 'كرسي مسرحي مخملي أحمر بإطار ذهبي'} fill sizes="(min-width: 1000px) 28vw, 90vw"/><figcaption><span>THE CRAFT BEHIND THE EXPERIENCE</span><strong>{en ? 'Every detail has its place.' : 'كل تفصيلة في مكانها.'}</strong></figcaption></figure>
      <div className="p2-seating">{stack.map(([slug,name,ar,eng]) => <article className="p2-tech-seat" key={slug}><div className="p2-seat-back"><span className="p2-seat-pin"/><Image src={`/brand/technology/${slug}.svg`} width={42} height={42} alt={`${name} logo`}/><h3>{name}</h3><p>{en ? eng : ar}</p></div><div className="p2-seat-cushion" aria-hidden/><span className="p2-seat-leg" aria-hidden/></article>)}</div></div>
      <p className="p2-tech-caption">{en ? 'Technology marks identify tools used in this project; they do not imply endorsement.' : 'الشعارات تعرّف الأدوات المستخدمة في المشروع، ولا تعني رعاية أصحابها للمنصة.'}</p>
    </div>
  </section>;
}
