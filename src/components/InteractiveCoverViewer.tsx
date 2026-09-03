import React, { useRef, useState } from 'react';
import { CoverHotspot } from '../types';
import { ExternalLink, Sparkles } from 'lucide-react';

interface Props {
  imageUrl: string;
  altText?: string;
  hotspots?: CoverHotspot[];
  /** When true, highlights hotspots with visible borders, badges, and selection outline for editing */
  showHotspotBorders?: boolean;
  selectedHotspotId?: string | null;
  onSelectHotspot?: (hotspot: CoverHotspot) => void;
  onActionTrigger?: (hotspot: CoverHotspot) => void;
  /** When true, allows clicking on hotspots to trigger links or actions */
  interactive?: boolean;
  className?: string;
  onImageLoad?: (dimensions: { naturalWidth: number; naturalHeight: number }) => void;
}

export const InteractiveCoverViewer: React.FC<Props> = ({
  imageUrl,
  altText = 'Capa Interativa do Convite',
  hotspots = [],
  showHotspotBorders = false,
  selectedHotspotId = null,
  onSelectHotspot,
  onActionTrigger,
  interactive = true,
  className = '',
  onImageLoad
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);

  const handleHotspotClick = (e: React.MouseEvent, spot: CoverHotspot) => {
    // If in admin editing mode, select the hotspot for editing
    if (showHotspotBorders && onSelectHotspot) {
      e.preventDefault();
      e.stopPropagation();
      onSelectHotspot(spot);
      return;
    }

    if (!interactive) return;

    // Show quick subtle click ripple feedback
    setActiveFeedbackId(spot.id);
    setTimeout(() => setActiveFeedbackId(null), 400);

    // If custom action handler is provided, delegate completely to it (e.g. open fullscreen RSVP modal)
    if (onActionTrigger) {
      e.preventDefault();
      onActionTrigger(spot);
      return;
    }

    // Determine target execution
    const isFormAction =
      spot.actionType === 'confirm_rsvp' ||
      spot.actionType === 'open_form' ||
      spot.targetUrl?.startsWith('#');

    if (isFormAction) {
      e.preventDefault();
      const formEl = document.getElementById('rsvp-form') || document.getElementById('rsvp-response-card');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Focus first input after scroll
        setTimeout(() => {
          const firstInput = formEl.querySelector<HTMLInputElement>('input, textarea');
          firstInput?.focus();
        }, 500);
      }
      return;
    }

    let url = spot.targetUrl?.trim();
    if (!url) return;

    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
      url = `https://${url}`;
    }

    if (spot.openInNewTab) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = url;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Background artwork */}
      <img
        src={imageUrl}
        alt={altText}
        referrerPolicy="no-referrer"
        onLoad={(e) => {
          const target = e.currentTarget;
          if (onImageLoad) {
            onImageLoad({
              naturalWidth: target.naturalWidth,
              naturalHeight: target.naturalHeight
            });
          }
        }}
        className="w-full h-auto block object-contain pointer-events-none"
      />

      {/* Hotspots Overlay Layer */}
      {hotspots.map((spot) => {
        const isSelected = selectedHotspotId === spot.id;
        const isFeedback = activeFeedbackId === spot.id;

        // In Guest Mode (showHotspotBorders = false): 100% invisible!
        // No border, no background, no shadow. Instant 1-tap/1-click touch response.
        if (!showHotspotBorders) {
          return (
            <button
              key={spot.id}
              type="button"
              id={`hotspot-btn-${spot.id}`}
              onClick={(e) => handleHotspotClick(e, spot)}
              title={spot.name || 'Clique para interagir'}
              aria-label={spot.name || 'Área interativa'}
              style={{
                left: `${spot.x}%`,
                top: `${spot.y}%`,
                width: `${spot.width}%`,
                height: `${spot.height}%`,
                touchAction: 'manipulation'
              }}
              className={`absolute cursor-pointer border-0 outline-none p-0 m-0 z-20 transition-opacity focus:outline-none ${
                isFeedback ? 'bg-teal-500/20' : 'bg-transparent'
              }`}
            />
          );
        }

        // In Admin Edit Mode (showHotspotBorders = true): Highlighted outline & badge
        return (
          <div
            key={spot.id}
            onClick={(e) => handleHotspotClick(e, spot)}
            style={{
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              width: `${spot.width}%`,
              height: `${spot.height}%`
            }}
            className={`absolute cursor-pointer transition-all duration-150 rounded-md flex flex-col justify-between p-1 z-10 ${
              isSelected
                ? 'border-2 border-teal-500 bg-teal-500/25 shadow-lg ring-2 ring-teal-400/50'
                : 'border-2 border-dashed border-sky-400 bg-sky-500/15 hover:bg-sky-500/25 hover:border-sky-300'
            }`}
          >
            {/* Top Action Badge */}
            <div className="flex items-center justify-between gap-1 overflow-hidden">
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900/90 text-white shadow-xs truncate max-w-full">
                <Sparkles size={10} className="text-teal-400 shrink-0" />
                <span className="truncate">{spot.name || 'Área Clicável'}</span>
              </span>

              {spot.openInNewTab && (
                <span className="p-0.5 rounded bg-slate-900/80 text-white shrink-0" title="Abre em nova aba">
                  <ExternalLink size={9} />
                </span>
              )}
            </div>

            {/* Bottom URL preview */}
            <div className="text-[9px] font-mono text-white bg-slate-950/80 px-1 py-0.2 rounded truncate max-w-full">
              {spot.targetUrl || '#formulario'}
            </div>
          </div>
        );
      })}
    </div>
  );
};
