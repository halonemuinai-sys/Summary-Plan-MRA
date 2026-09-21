'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Maximize2, Minimize2, Copy, Check, Download, Loader2 } from 'lucide-react';
import { DeckExportContext } from '@/components/DeckExportContext';
import HighlightsPage from '@/app/highlights/page';
import RevenuePage from '@/app/p/[slug]/revenue/page';

const slides = [
  { id: 'highlights', title: 'Financial Highlights', short: 'Highlights' },
  { id: 'percentage', title: 'Revenue Breakdown by Percentage', short: 'Percentage' },
  { id: 'value', title: 'Revenue Breakdown by Value', short: 'Value' },
] as const;

export default function PresentationDeck() {
  const { slug } = useParams<{ slug: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const requested = slides.findIndex(s => s.id === params.get('slide'));
  const index = requested < 0 ? 0 : requested;
  const active = slides[index];
  const stage = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.7);
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportPage, setExportPage] = useState(0);
  const exportRoot = useRef<HTMLDivElement>(null);
  const exportLock = useRef(false);

  const downloadPdf = async () => {
    if (exportLock.current) return;
    exportLock.current = true;
    setExporting(true);
    setExportPage(0);
    setNotice('');
    try {
      const { exportDeckPdf } = await import('@/lib/export-deck-pdf');
      // Wait for React to mount the export slides without moving the visible slide.
      for (let attempt = 0; !exportRoot.current && attempt < 100; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      if (!exportRoot.current) throw new Error('PDF slides could not be prepared. Please try again.');
      exportRoot.current.setAttribute('inert', '');
      await exportDeckPdf(exportRoot.current, slug, setExportPage);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'PDF download failed. Please try again.');
    } finally {
      setExporting(false);
      exportLock.current = false;
    }
  };
  // Movement is a presentation aid, not decoration: it is dropped when the viewer asks for less motion
  const reduceMotion = useReducedMotion();
  const glide = { type: 'spring' as const, stiffness: 420, damping: 34, mass: 0.7 };
  const go = useCallback((next: number) => {
    if (next < 0 || next >= slides.length) return;
    router.push(`/deck/${encodeURIComponent(slug)}?slide=${slides[next].id}`, { scroll: false });
  }, [router, slug]);

  useEffect(() => {
    const target = stage.current;
    if (!target) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(Math.max(0.1, Math.min((entry.contentRect.width - 24) / 1600, (entry.contentRect.height - 24) / 900)));
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || (event.target as HTMLElement)?.closest('input, select, textarea, [contenteditable="true"]')) return;
      const destinations: Record<string, number> = { ArrowRight: index + 1, PageDown: index + 1, ArrowLeft: index - 1, PageUp: index - 1, Home: 0, End: slides.length - 1 };
      if (event.key in destinations) { event.preventDefault(); go(destinations[event.key]); }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [go, index]);

  useEffect(() => {
    const update = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return <div className="unified-deck">
    <header className="unified-deck-toolbar"><div className="unified-deck-heading"><Link href="/admin" aria-label="Back to Admin"><ArrowLeft size={17} /></Link><div><Image src="/mra-logo-official.svg" alt="MRA Group" width={70} height={30} unoptimized /><span>Executive presentation</span></div></div><nav aria-label="Presentation slides" className="unified-deck-tabs">{slides.map((slide, i) => <button key={slide.id} onClick={() => go(i)} aria-current={index === i ? 'step' : undefined}>{index === i && <motion.span layoutId="deck-tab-marker" className="unified-deck-tab-marker" transition={reduceMotion ? { duration: 0 } : glide} />}<span className="unified-deck-tab-index">0{i + 1}</span><span className="unified-deck-tab-label">{slide.short}</span></button>)}</nav><div className="unified-deck-actions"><button onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setNotice(''); } catch { setNotice('Copy the presentation URL from your browser to share this slide.'); } }} aria-label="Copy presentation link">{copied ? <Check size={15} /> : <Copy size={15} />}<span>{copied ? 'Copied' : 'Share'}</span></button><button onClick={downloadPdf} disabled={exporting} aria-label="Download all three slides as PDF" aria-busy={exporting} title="Download all 3 slides as PDF">{exporting ? <Loader2 size={15} className="animate-spin motion-reduce:animate-none" /> : <Download size={15} />}<span aria-live="polite">{exporting ? (exportPage ? `Creating PDF ${exportPage}/3` : 'Preparing PDF?') : 'Download PDF'}</span></button><button onClick={async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); setNotice(''); } catch { setNotice('Fullscreen is unavailable in this browser.'); } }} aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>{fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button></div></header>
    {notice && <p className="unified-deck-notice" role="status">{notice}</p>}
    <div className="unified-deck-stage" ref={stage}>
      <div style={{ width: 1600 * scale, height: 900 * scale, position: 'relative' }}>
        <div className="unified-deck-slide-wrap">
          <div className={`unified-slide unified-slide-${active.id}`} style={{ transform: `scale(${scale})` }} aria-label={`Slide ${index + 1}: ${active.title}`}>
            {active.id === 'highlights' ? <HighlightsPage /> : <RevenuePage />}
          </div>
        </div>
      </div>
    </div>
    {exporting && <div ref={exportRoot} className="deck-pdf-export" aria-hidden="true">
      {slides.map(slide => <DeckExportContext.Provider key={slide.id} value={slide.id}>
        <div className={`unified-slide unified-slide-${slide.id}`} data-pdf-slide={slide.id}>
          {slide.id === 'highlights' ? <HighlightsPage /> : <RevenuePage />}
        </div>
      </DeckExportContext.Provider>)}
    </div>}
    <footer className="unified-deck-footer"><div aria-live="polite"><strong>{String(index + 1).padStart(2, '0')} <span>/ 03</span></strong><span>{active.title}</span></div><p>← → to navigate <span>·</span> {active.id === 'highlights' ? 'Highlights Studio data' : 'Active scenario · saved Brand Revenue Matrix'}</p><div><button onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous slide"><ChevronLeft size={16} /><span>Previous</span></button><button onClick={() => go(index + 1)} disabled={index === slides.length - 1} aria-label="Next slide"><span>Next</span><ChevronRight size={16} /></button></div></footer>
  </div>;
}
