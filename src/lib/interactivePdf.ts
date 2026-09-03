import { jsPDF } from 'jspdf';
import { CondoEvent, CoverHotspot } from '../types';
import { buildInvitationUrl } from './utils';

export interface OptimizedImageData {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Loads and prepares an image for PDF embedding:
 * Scales to crisp resolution (max 1240px) and compresses to ~120-200 KB
 * so WhatsApp Web and mobile can instantly open and preview it without delay.
 */
async function loadAndOptimizeImageData(url: string): Promise<OptimizedImageData> {
  return new Promise((resolve, reject) => {
    const processImage = (img: HTMLImageElement) => {
      try {
        const naturalW = img.naturalWidth || img.width || 1200;
        const naturalH = img.naturalHeight || img.height || 1600;

        // Balance crisp resolution with fast loading and small file size (~150KB)
        const MAX_DIM = 1400;
        let targetW = naturalW;
        let targetH = naturalH;

        if (targetW > MAX_DIM || targetH > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / targetW, MAX_DIM / targetH);
          targetW = Math.round(targetW * ratio);
          targetH = Math.round(targetH * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Contexto de canvas indisponível');

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);

        resolve({
          dataUrl,
          width: targetW,
          height: targetH
        });
      } catch (e) {
        // If canvas export fails due to CORS or security, check if url is already a data URL
        if (url.startsWith('data:image')) {
          resolve({
            dataUrl: url,
            width: img.naturalWidth || 1200,
            height: img.naturalHeight || 1600
          });
        } else {
          // Fallback: try fetching as blob
          fetchBlobAsDataUrl(url)
            .then((dataUrl) => {
              resolve({
                dataUrl,
                width: img.naturalWidth || 1200,
                height: img.naturalHeight || 1600
              });
            })
            .catch(() => reject(e));
        }
      }
    };

    const fetchBlobAsDataUrl = (imgUrl: string): Promise<string> => {
      return fetch(imgUrl)
        .then((res) => res.blob())
        .then(
          (blob) =>
            new Promise((res, rej) => {
              const reader = new FileReader();
              reader.onloadend = () => res(reader.result as string);
              reader.onerror = rej;
              reader.readAsDataURL(blob);
            })
        );
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => processImage(img);
    img.onerror = () => {
      fetchBlobAsDataUrl(url)
        .then((dataUrl) => {
          const fallbackImg = new Image();
          fallbackImg.onload = () => processImage(fallbackImg);
          fallbackImg.onerror = () => reject(new Error('Não foi possível carregar a imagem da capa'));
          fallbackImg.src = dataUrl;
        })
        .catch(reject);
    };

    img.src = url;
  });
}

/**
 * Returns a clean, safe uppercase filename for the invitation PDF.
 * Removes accents and problematic punctuation to avoid WhatsApp Web / OS filename issues.
 */
export function getPdfFileName(eventTitle?: string): string {
  if (!eventTitle) return 'CONVITE.pdf';
  const clean = eventTitle
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-zA-Z0-9 _-]/g, ' ') // replace symbols with spaces
    .replace(/\s+/g, ' ') // collapse spaces
    .trim();

  if (!clean) return 'CONVITE.pdf';
  if (/^convite/i.test(clean)) {
    return `${clean.toUpperCase()}.pdf`;
  }
  return `CONVITE - ${clean.toUpperCase()}.pdf`;
}

export interface GeneratePdfOptions {
  event: CondoEvent;
  hotspots?: CoverHotspot[];
  invitationCode?: string;
  onProgress?: (status: string) => void;
  autoDownload?: boolean;
}

export interface GeneratedPdfResult {
  blob: Blob;
  file: File;
  fileName: string;
  dataUrl: string;
}

/**
 * Generates an interactive, 100% standards-compliant PDF with:
 * 1. Native PDF page formatting matching the cover dimensions without distortion.
 * 2. Optimal file size (~140-220 KB) for fast preview generation in WhatsApp.
 * 3. Document properties and metadata for PDF readers.
 * 4. Interactive clickable links that work in all viewers.
 */
export async function generateInteractivePdf(options: GeneratePdfOptions): Promise<GeneratedPdfResult> {
  const { event, invitationCode, onProgress, autoDownload = true } = options;
  // Use provided hotspots, or event hotspots, or smart defaults matching standard cover buttons
  const fallbackHotspots: CoverHotspot[] = [
    {
      id: 'hs-rsvp-default',
      name: 'Confirmar Presença',
      actionType: 'confirm_rsvp',
      targetUrl: '#formulario',
      openInNewTab: false,
      x: 15,
      y: 73,
      width: 70,
      height: 14
    },
    {
      id: 'hs-maps-default',
      name: 'Como Chegar (Maps)',
      actionType: 'google_maps',
      targetUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        event.address || event.location || 'Grupo Ativa São Paulo'
      )}`,
      openInNewTab: true,
      x: 15,
      y: 88,
      width: 70,
      height: 10
    }
  ];

  const hotspots =
    options.hotspots && options.hotspots.length > 0
      ? options.hotspots
      : event.coverHotspots && event.coverHotspots.length > 0
      ? event.coverHotspots
      : fallbackHotspots;

  if (onProgress) onProgress('Preparando imagem do convite em alta definição...');

  const imageUrl =
    event.bannerUrl ||
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80';

  const imgInfo = await loadAndOptimizeImageData(imageUrl);

  if (onProgress) onProgress('Gerando documento PDF compatível...');

  const isLandscape = imgInfo.width > imgInfo.height;
  const aspect = imgInfo.height / imgInfo.width;

  // Base A4 width: 595.28 pt. Proportional height preserves exact invitation design.
  let targetWidthPt: number;
  let targetHeightPt: number;

  if (isLandscape) {
    targetWidthPt = 841.89;
    targetHeightPt = Math.round(841.89 * aspect * 100) / 100;
  } else {
    targetWidthPt = 595.28;
    targetHeightPt = Math.round(595.28 * aspect * 100) / 100;
  }

  // Create clean, strictly standard jsPDF instance
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'pt',
    format: [targetWidthPt, targetHeightPt],
    compress: true
  });

  // Standard Document Properties
  const cleanTitle = event.title ? event.title.trim() : 'CONVITE';
  pdf.setProperties({
    title: cleanTitle.toUpperCase(),
    subject: 'Convite Interativo Oficial',
    author: 'Grupo Ativa',
    creator: 'Grupo Ativa - Soluções Condominiais'
  });

  // Draw full-bleed invitation cover image
  pdf.addImage(
    imgInfo.dataUrl,
    'JPEG',
    0,
    0,
    targetWidthPt,
    targetHeightPt,
    undefined,
    'FAST'
  );

  // Online fallback link (points to this invitation's interactive page)
  const currentOnlineUrl = invitationCode
    ? buildInvitationUrl(invitationCode)
    : `${window.location.origin}/convite/geral`;

  // Embed Clickable Hyperlinks
  if (hotspots && hotspots.length > 0) {
    if (onProgress) onProgress('Configurando links e botões interativos...');
    hotspots.forEach((spot) => {
      const linkX = (spot.x / 100) * targetWidthPt;
      const linkY = (spot.y / 100) * targetHeightPt;
      const linkW = (spot.width / 100) * targetWidthPt;
      const linkH = (spot.height / 100) * targetHeightPt;

      let destinationUrl = spot.targetUrl?.trim();

      const spotName = (spot.name || '').toLowerCase();
      const isRsvpAction =
        !destinationUrl ||
        destinationUrl === '#formulario' ||
        destinationUrl.startsWith('#') ||
        spot.actionType === 'confirm_rsvp' ||
        spot.actionType === 'open_form' ||
        spot.actionType === 'register' ||
        spotName.includes('confirm') ||
        spotName.includes('presen') ||
        spotName.includes('inscri') ||
        spotName.includes('particip') ||
        spotName.includes('cadastr') ||
        spotName.includes('formul');

      // If action is RSVP/confirmation, append ?confirmar=1 to open the form directly
      if (isRsvpAction) {
        const sep = currentOnlineUrl.includes('?') ? '&' : '?';
        destinationUrl = `${currentOnlineUrl}${sep}confirmar=1`;
      } else if (!destinationUrl.startsWith('http://') && !destinationUrl.startsWith('https://')) {
        destinationUrl = `https://${destinationUrl}`;
      }

      try {
        pdf.link(linkX, linkY, linkW, linkH, { url: destinationUrl });
      } catch (err) {
        console.warn('Aviso: falha ao inserir anotação de link:', err);
      }
    });
  }

  if (onProgress) onProgress('Finalizando arquivo...');

  const fileName = getPdfFileName(event.title);

  // Generate compliant Blob and File
  const pdfBlob = pdf.output('blob');
  const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
  const dataUrl = pdf.output('datauristring');

  if (autoDownload) {
    pdf.save(fileName);
  }

  return {
    blob: pdfBlob,
    file: pdfFile,
    fileName,
    dataUrl
  };
}
