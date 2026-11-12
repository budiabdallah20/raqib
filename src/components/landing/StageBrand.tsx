import Image from 'next/image';

export function StageBrand({ compact = false }: { compact?: boolean }) {
  return <span className="rq-brand"><Image src="/brand/stage-mark.svg" width={44} height={48} alt="" /><span><strong>رقيب</strong>{!compact && <small lang="en">RAQIB · ACADEMIC THEATER</small>}</span></span>;
}
