'use client';

/**
 * Footer — THE FINAL STAGE (cinematic final polish):
 * theatrical lighting architecture, an institutional identity marquee
 * (CSS transform loop only), and a large Developer Spotlight portrait with
 * official social channels and the BUDI identity medallion.
 *
 * Perf contract: all lighting is static gradients (one paint), the marquee is
 * a single composited transform animation that pauses on hover and collapses
 * under prefers-reduced-motion. Only genuine links are rendered.
 */

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Globe, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { AcademicGateLogo } from '@/components/stage/AcademicGateMark';
import type { PolicyTab } from '@/components/auth/PolicyModal';

/** Official brand marks available as real SVG assets in the project. */
const BRAND_ICONS: Record<string, string> = {
  WhatsApp: '/brand-icons/whatsapp.svg',
  GitHub: '/brand-icons/github.svg',
};

export function LandingFooter({ onOpenPolicy }: { onOpenPolicy: (tab: PolicyTab) => void }) {
  const { t } = useLang();

  /** Verified institutional identities — no fabricated emblems. */
  const identities = [
    { src: '/logos/faculty-sci-logo-sm.jpg', label: t.footer.sponsorFaculty, alt: 'Faculty of Science — Suez University', width: 256, height: 243, plate: true },
    { src: '/logos/suez-uni-logo.png', label: t.footer.sponsorUni, alt: 'Suez University', width: 413, height: 375, plate: true },
    { src: '/brand-icons/budi.svg', label: t.footer.sponsorBudi, alt: 'BUDI', width: 40, height: 40, plate: false },
  ] as const;

  const socialIcon = (label: string) => {
    if (BRAND_ICONS[label]) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={BRAND_ICONS[label]} alt="" aria-hidden className="h-[18px] w-[18px] object-contain" loading="lazy" />
      );
    }
    if (label === 'Email') return <Mail className="h-[18px] w-[18px]" />;
    if (label === 'Phone') return <Phone className="h-[18px] w-[18px]" />;
    return <Globe className="h-[18px] w-[18px]" />;
  };

  return (
    <footer className="theatre-footer relative px-4 pb-10 pt-14 sm:px-6 sm:pt-16">
      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Brand + AI-security statement */}
          <div className="lg:col-span-5">
            <AcademicGateLogo />
            <p className="mt-4 max-w-xs text-[13px] leading-6 text-[#b8abb2]">{t.footer.tagline}</p>

            <div className="mt-5 inline-flex flex-wrap items-center gap-2.5 rounded-2xl border border-[#F28C28]/25 bg-white/[0.04] px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#FFB45C]" />
              <span className="text-[11.5px] font-semibold text-[#FFF8F0]/85">{t.footer.statement}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F28C28]/35 bg-[#F28C28]/10 px-2.5 py-1 font-latin text-[8px] font-bold uppercase tracking-[0.18em] text-[#FFB45C]">
                <span aria-hidden className="h-1 w-1 rounded-full bg-[#FFB45C] shadow-[0_0_6px_rgba(255,180,92,.9)]" />
                {t.footer.statementBadge}
              </span>
            </div>

            <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-[#FFB45C]">
              <ShieldCheck className="h-3 w-3" />
              {t.footer.secure}
            </p>
          </div>

          {/* Platform */}
          <div className="lg:col-span-2">
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.1em] text-[#FFF8F0]">{t.footer.platform}</h3>
            <ul className="mt-3 space-y-2">
              {t.footer.linksPlatform.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13px] text-[#b8abb2] transition hover:text-[#FFB45C]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Access */}
          <div className="lg:col-span-2">
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.1em] text-[#FFF8F0]">{t.footer.account}</h3>
            <ul className="mt-3 space-y-2">
              {t.footer.linksAccount.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13px] text-[#b8abb2] transition hover:text-[#FFB45C]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — genuine destinations */}
          <div className="lg:col-span-3">
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.1em] text-[#FFF8F0]">{t.footer.contactTitle}</h3>
            <ul className="mt-3 space-y-2 text-[13px] text-[#b8abb2]">
              <li>
                <a href="mailto:budiabdallah922@gmail.com" className="inline-flex items-center gap-2 transition hover:text-[#FFB45C]">
                  <Mail className="h-3.5 w-3.5" />budiabdallah922@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+201065228072" className="inline-flex items-center gap-2 transition hover:text-[#FFB45C]">
                  <Phone className="h-3.5 w-3.5" /><span dir="ltr">+20 106 522 8072</span>
                </a>
              </li>
              <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{t.footer.devLoc}</li>
            </ul>
          </div>
        </div>

        {/* Section light line */}
        <div className="footer-light-line mt-12" aria-hidden />

        {/* ── Identity marquee — illuminated panels on the stage ── */}
        <div className="identity-marquee-frame mt-8" role="region" aria-label={t.footer.sponsorTitle}>
          <p className="identity-marquee-title">{t.footer.sponsorTitle}</p>
          <div className="identity-marquee" dir="ltr">
            <div className="identity-marquee-track">
              {[0, 1].map((copy) => (
                <div key={copy} className="identity-marquee-set" aria-hidden={copy === 1 || undefined}>
                  {identities.map((item) => (
                    <div key={item.label} className="identity-panel">
                      {item.plate ? (
                        <span className="identity-plate">
                          <Image
                            src={item.src}
                            alt={copy === 1 ? '' : item.alt}
                            width={item.width}
                            height={item.height}
                            className="h-[38px] w-[38px] object-contain"
                            sizes="38px"
                          />
                        </span>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.src}
                          alt={copy === 1 ? '' : item.alt}
                          width={item.width}
                          height={item.height}
                          className="h-[42px] w-[42px] object-contain"
                          loading="lazy"
                        />
                      )}
                      <span className="identity-panel-name">{item.label}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Developer Spotlight — the creator of the stage ── */}
        <div className="dev-spotlight mt-8">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-10">
            {/* Portrait — large theater frame with a warm spotlight */}
            <div className="dev-portrait mx-auto w-full max-w-[320px] sm:max-w-[340px] lg:mx-0 lg:w-full">
              <div className="dev-portrait-spot" aria-hidden />
              <figure className="dev-portrait-frame">
                <Image
                  src="/images/developer-portrait.webp"
                  alt={t.footer.devName}
                  width={768}
                  height={1024}
                  loading="lazy"
                  sizes="(max-width: 1024px) 70vw, 340px"
                  className="h-auto w-full object-cover"
                />
                <span className="dev-portrait-corner dev-portrait-corner--tr" aria-hidden />
                <span className="dev-portrait-corner dev-portrait-corner--bl" aria-hidden />
              </figure>
            </div>

            {/* Info */}
            <div className="min-w-0 text-center lg:text-start">
              <p className="font-latin text-[9px] font-bold uppercase tracking-[0.3em] text-[#FFB45C]">{t.footer.devTitle}</p>
              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
                <h3 className="font-display text-2xl font-black text-[#FFFFFF]">{t.footer.devName}</h3>
                <span className="rounded-full border border-[#F28C28]/30 bg-[#F28C28]/10 px-3 py-1 text-[10px] font-bold tracking-[0.06em] text-[#FFB45C]">
                  {t.footer.devRole}
                </span>
              </div>
              <p className="mt-3 text-[13px] leading-7 text-[#b8abb2]">{t.footer.devBio}</p>
              <p className="mt-1.5 flex items-center justify-center gap-1.5 text-[11.5px] text-[#b8abb2]/80 lg:justify-start">
                <MapPin className="h-3 w-3 text-[#FFB45C]/70" />
                {t.footer.devLoc}
              </p>

              {/* Official social channels — only genuine destinations */}
              <p className="mt-5 font-latin text-[8.5px] font-bold uppercase tracking-[0.28em] text-[#b8abb2]/60">
                {t.footer.socialsTitle}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                {t.footer.devLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    aria-label={`${link.label} — ${t.footer.devName}`}
                    title={link.label}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                    className="social-orb"
                  >
                    {socialIcon(link.label)}
                  </a>
                ))}

                {/* BUDI identity — the navbar brand asset, presented with a halo */}
                <span className="budi-medallion">
                  <span className="budi-halo" aria-hidden />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand-icons/budi.svg" alt="BUDI" width={40} height={40} className="relative h-11 w-11" loading="lazy" />
                  <span className="relative flex flex-col items-start leading-tight">
                    <span className="font-latin text-[13px] font-black tracking-[0.14em] text-[#FFD9A0]">BUDI</span>
                    <span className="text-[9.5px] font-semibold text-[#b8abb2]">{t.footer.engineered}</span>
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal */}
        <div className="mt-10 flex flex-col items-center gap-4 border-t border-white/[0.08] pt-8">
          <p className="text-[12px] text-[#b8abb2]">{t.footer.copyright}</p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#b8abb2]">
            <button type="button" onClick={() => onOpenPolicy('privacy')} className="transition hover:text-[#FFB45C]">
              {t.footer.privacy}
            </button>
            <span aria-hidden>·</span>
            <button type="button" onClick={() => onOpenPolicy('terms')} className="transition hover:text-[#FFB45C]">
              {t.footer.terms}
            </button>
            <span aria-hidden>·</span>
            <span>{t.footer.rights}</span>
          </div>
          <p className="font-latin text-[9px] uppercase tracking-[0.3em] text-[#b8abb2]/50">
            {t.footer.engineered} · {t.footer.devName}
          </p>
        </div>
      </div>
    </footer>
  );
}
