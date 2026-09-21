const pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export async function exportDeckPdf(root: HTMLElement, slug: string, onProgress: (page: number) => void) {
  const [{ toPng }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')]);
  const pages = Array.from(root.querySelectorAll<HTMLElement>('[data-pdf-slide]'));
  if (pages.length !== 3) throw new Error('The three presentation slides could not be prepared.');

  const deadline = Date.now() + 45000;
  while (true) {
    if (!root.isConnected) throw new Error('PDF download was cancelled.');
    if (root.querySelector('[data-export-error="true"]')) throw new Error('Slide data could not be loaded. Please try again.');
    if (pages.every(page => page.querySelector('[data-export-ready="true"]') && page.querySelectorAll('svg.recharts-surface').length >= (page.dataset.pdfSlide === 'highlights' ? 3 : 4))) break;
    if (Date.now() > deadline) throw new Error('Loading the slides took too long. Please try again.');
    await pause(100);
  }
  await document.fonts.ready;
  await Promise.all(Array.from(root.querySelectorAll('img')).map(img => img.decode()));
  // ResponsiveContainer needs a layout pass after the data and fonts arrive.
  await pause(200);

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [1200, 675], compress: true });
  pdf.setProperties({ title: `MRA Executive Presentation - ${slug}`, creator: 'MRA Group' });
  for (let i = 0; i < pages.length; i++) {
    if (!root.isConnected) throw new Error('PDF download was cancelled.');
    onProgress(i + 1);
    const png = await toPng(pages[i], {
      width: 1600, height: 900, pixelRatio: 2,
      backgroundColor: '#f5f9fb',
      style: { position: 'relative', inset: 'auto', transform: 'none', overflow: 'hidden', boxShadow: 'none' },
    });
    if (i > 0) pdf.addPage([1200, 675], 'landscape');
    pdf.addImage(png, 'PNG', 0, 0, 1200, 675, undefined, 'FAST');
  }
  if (!root.isConnected) throw new Error('PDF download was cancelled.');
  await pdf.save(`MRA-${slug.replace(/[^a-zA-Z0-9_-]/g, '-')}-presentation.pdf`, { returnPromise: true });
}
