import React, { useEffect, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  X,
  ArrowLeft,
  Building2,
  User,
  Phone,
  MapPin,
  ExternalLink,
  Download,
  Sparkles,
} from 'lucide-react';
import { CondoEvent, Invitation } from '../types';
import { fireCelebrationConfetti } from '../lib/confetti';

interface FullscreenRsvpModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CondoEvent;
  invitation: Invitation | null;
  showSuccessCard: boolean;
  showDeclinedCard: boolean;
  qrDataUrl: string;
  submitting: boolean;
  condoName: string;
  setCondoName: (val: string) => void;
  managerName: string;
  setManagerName: (val: string) => void;
  janitorName: string;
  setJanitorName: (val: string) => void;
  whatsapp: string;
  handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  attendeeRole: 'manager' | 'janitor' | 'both';
  setAttendeeRole: (role: 'manager' | 'janitor' | 'both') => void;
  notes: string;
  setNotes: (val: string) => void;
  handleConfirm: (e: React.FormEvent) => void;
  handleDecline: () => void;
  setShowSuccessCard: (val: boolean) => void;
  setShowDeclinedCard: (val: boolean) => void;
  downloadCalendarFile: (event: CondoEvent) => void;
}

export const FullscreenRsvpModal: React.FC<FullscreenRsvpModalProps> = ({
  isOpen,
  onClose,
  event,
  invitation,
  showSuccessCard,
  showDeclinedCard,
  qrDataUrl,
  submitting,
  condoName,
  setCondoName,
  managerName,
  setManagerName,
  janitorName,
  setJanitorName,
  whatsapp,
  handlePhoneChange,
  attendeeRole,
  setAttendeeRole,
  notes,
  setNotes,
  handleConfirm,
  handleDecline,
  setShowSuccessCard,
  setShowDeclinedCard,
  downloadCalendarFile,
}) => {
  const confettiFiredRef = useRef<string | null>(null);

  // Explosão de confetes ao exibir o passe QR Code / confirmação de presença
  useEffect(() => {
    if (isOpen && showSuccessCard) {
      const triggerKey = `${invitation?.code || 'confirmed'}-${qrDataUrl ? 'qr' : 'init'}`;
      if (confettiFiredRef.current !== triggerKey) {
        confettiFiredRef.current = triggerKey;
        const timer = setTimeout(() => {
          fireCelebrationConfetti();
        }, 150);
        return () => clearTimeout(timer);
      }
    } else if (!showSuccessCard) {
      confettiFiredRef.current = null;
    }
  }, [isOpen, showSuccessCard, qrDataUrl, invitation?.code]);

  // ESC key listener to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="fullscreen-rsvp-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fullscreen-modal-title"
      className="fixed inset-0 z-[9999] w-screen w-[100dvw] h-screen h-[100dvh] flex flex-col overflow-hidden text-slate-800 animate-in fade-in duration-150"
      style={{
        overscrollBehavior: 'none',
        background:
          'radial-gradient(1100px 650px at 50% 0%, rgba(0, 122, 120, 0.12) 0%, transparent 65%), radial-gradient(900px 600px at 10% 90%, rgba(15, 118, 110, 0.08) 0%, transparent 60%), linear-gradient(160deg, #e6f6f5 0%, #f4faf9 35%, #ffffff 70%, #dcf1ef 100%)'
      }}
    >
      {/* Barra Superior Fixa com Botão Fechar */}
      <header className="shrink-0 w-full bg-white/90 border-b border-teal-200/80 px-4 py-3 flex items-center justify-between backdrop-blur-md z-10 pt-[max(0.75rem,env(safe-area-inset-top))] shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-[#007A78] shrink-0 shadow-2xs">
            <Sparkles size={16} />
          </div>
          <div className="min-w-0">
            <h1 id="fullscreen-modal-title" className="text-xs sm:text-sm font-black text-slate-900 truncate">
              {showSuccessCard ? 'Presença Confirmada' : 'Confirmação de Presença'}
            </h1>
            <p className="text-[10px] text-slate-500 font-medium truncate">
              {event.title} • Grupo Ativa
            </p>
          </div>
        </div>

        {/* Botão × Fechar */}
        <button
          type="button"
          id="btn-close-fullscreen-top"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 hover:text-slate-950 border border-slate-300 text-xs sm:text-sm font-bold transition shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer select-none"
          aria-label="Fechar formulário e voltar ao convite"
        >
          <span className="text-lg font-bold leading-none select-none">×</span>
          <span>Fechar</span>
        </button>
      </header>

      {/* Área Central Rolável (O conteúdo interno é quem rola; o fundo fica 100% travado e o topo NUNCA é cortado) */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 py-3 sm:py-6 flex flex-col items-center justify-start pb-[max(2rem,env(safe-area-inset-bottom))]"
        style={{ touchAction: 'pan-y' }}
      >
        <div className="w-full max-w-lg md:max-w-xl mx-auto py-1">
          {showSuccessCard ? (
            /* TELA DE SUCESSO APÓS CONFIRMAÇÃO */
            <div
              id="rsvp-success-fullscreen-card"
              className="border border-emerald-300 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl text-slate-900 text-center animate-in fade-in zoom-in-95 duration-200"
              style={{
                background: 'linear-gradient(155deg, #ffffff 0%, #f4fbf9 50%, #ecf8f5 100%)'
              }}
            >
              <div
                onClick={() => fireCelebrationConfetti()}
                title="Comemorar confirmação!"
                className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer active:scale-95 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-300 shadow-md transition-transform"
              >
                <CheckCircle2 size={34} className="sm:w-9 sm:h-9" />
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-950 tracking-tight mb-1.5">
                Presença confirmada com sucesso!
              </h2>
              <p className="text-slate-700 text-xs sm:text-sm font-medium mb-4 sm:mb-5 leading-relaxed max-w-md mx-auto">
                Agradecemos a confirmação. Em breve entraremos em contacto.
              </p>

              {/* BOTÃO OBRIGATÓRIO: Voltar ao convite */}
              <div className="mb-4 sm:mb-5">
                <button
                  type="button"
                  id="btn-voltar-ao-convite"
                  onClick={onClose}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black py-3 sm:py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-700/25 transition text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
                >
                  <ArrowLeft size={18} />
                  <span>Voltar ao convite</span>
                </button>
              </div>

              {/* Passe QR Code Oficial */}
              {qrDataUrl && invitation && (
                <div
                  onClick={() => fireCelebrationConfetti()}
                  title="Clique para comemorar!"
                  className="bg-slate-50 hover:bg-slate-100 active:scale-[0.98] transition cursor-pointer border border-slate-200 rounded-2xl p-3.5 sm:p-4 max-w-[260px] sm:max-w-[280px] mx-auto mb-4 shadow-xs text-center"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Passe de Entrada • Check-in
                  </div>
                  <img
                    src={qrDataUrl}
                    alt={`QR Code ${invitation.code}`}
                    className="w-36 h-36 sm:w-40 sm:h-40 mx-auto rounded-xl bg-white p-2 border border-slate-200 object-contain block shadow-xs"
                  />
                  <div className="mt-2 font-mono font-black text-sm sm:text-base tracking-widest text-teal-900 bg-teal-50 py-1 px-3 rounded-lg border border-teal-200 inline-block">
                    #{invitation.code}
                  </div>
                </div>
              )}

              {/* Resumo do Condomínio e Participantes */}
              {invitation && (
                <div className="bg-slate-50 rounded-xl p-3.5 sm:p-4 border border-slate-200 text-left mb-5 space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Condomínio:</span>
                    <span className="font-bold text-black text-right truncate pl-2">{invitation.condoName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Síndico(a):</span>
                    <span className="font-bold text-black text-right truncate pl-2">{invitation.managerName}</span>
                  </div>
                  {invitation.janitorName && (
                    <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Zelador(a):</span>
                      <span className="font-bold text-black text-right truncate pl-2">{invitation.janitorName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Participantes:</span>
                    <span className="font-bold text-teal-800 text-right">
                      {invitation.participantCount} {invitation.participantCount === 1 ? 'Pessoa' : 'Pessoas'} (
                      {invitation.attendeeRole === 'both'
                        ? 'Síndico + Zelador'
                        : invitation.attendeeRole === 'janitor'
                        ? 'Zelador'
                        : 'Síndico'}
                      )
                    </span>
                  </div>
                  {event?.address && (
                    <div className="flex items-center justify-between gap-2 py-1">
                      <span className="text-slate-500 font-medium">Local:</span>
                      <span className="font-bold text-black text-right">{event.address}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Ações complementares */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => downloadCalendarFile(event)}
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold py-3 px-4 rounded-xl transition shadow-xs text-xs sm:text-sm min-h-[44px] cursor-pointer"
                >
                  <Download size={16} />
                  <span>Salvar na Agenda (.ics)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSuccessCard(false)}
                  className="w-full sm:flex-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold py-3 px-4 rounded-xl border border-slate-300 transition text-xs sm:text-sm min-h-[44px] cursor-pointer"
                >
                  Editar Dados
                </button>
              </div>
            </div>
          ) : showDeclinedCard && invitation ? (
            /* RESPOSTA REGISTRADA: NÃO PODERÁ COMPARECER */
            <div className="bg-white border border-rose-200 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl text-slate-900 text-center">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-rose-200">
                <XCircle size={32} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-black mb-1.5 tracking-tight">Resposta Registrada</h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-5 max-w-md mx-auto">
                Registramos que você não poderá comparecer ao evento. Agradecemos pela resposta.
              </p>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeclinedCard(false);
                    setShowSuccessCard(false);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3.5 px-6 rounded-xl transition text-xs sm:text-sm shadow-md min-h-[44px] cursor-pointer"
                >
                  Mudei de ideia: Desejo Confirmar Presença
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold py-3 px-4 rounded-xl border border-slate-300 transition text-xs sm:text-sm min-h-[44px] cursor-pointer"
                >
                  Voltar ao convite
                </button>
              </div>
            </div>
          ) : (
            /* FORMULÁRIO DE CONFIRMAÇÃO */
            <div
              className="border border-teal-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 shadow-2xl text-slate-900 animate-in fade-in zoom-in-95 duration-150"
              style={{
                background: 'linear-gradient(155deg, #ffffff 0%, #f6fbfb 45%, #ecf7f6 100%)'
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-3.5 sm:mb-4 pb-3 border-b border-teal-100/90">
                <div>
                  <div className="flex items-center gap-1.5 text-[#007A78] font-bold text-[11px] tracking-wider uppercase mb-0.5">
                    <Sparkles size={13} className="text-[#007A78] shrink-0" />
                    <span>Confirmação Imediata</span>
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-950 tracking-tight leading-tight">
                    Confirmar Presença no Evento
                  </h2>
                  <p className="text-slate-600 text-xs sm:text-sm mt-0.5 leading-normal">
                    Preencha os dados do condomínio para emitir seu passe de entrada oficial.
                  </p>
                </div>

                {/* Botão × Fechar discreto no card */}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center"
                  title="Fechar formulário"
                  aria-label="Fechar formulário"
                >
                  <X size={20} />
                </button>
              </div>

              <form id="rsvp-form" onSubmit={handleConfirm} className="space-y-3 sm:space-y-3.5">
                {/* 1. Nome do condomínio */}
                <div>
                  <label htmlFor="input-condo-name" className="block text-[11px] sm:text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                    Nome do Condomínio / Edifício <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building2 size={18} />
                    </div>
                    <input
                      id="input-condo-name"
                      type="text"
                      required
                      value={condoName}
                      onChange={(e) => setCondoName(e.target.value)}
                      placeholder="Ex: Condomínio Edifício Solar das Palmeiras"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-xs sm:text-sm shadow-xs min-h-[48px]"
                    />
                  </div>
                </div>

                {/* 2. Nome do síndico e 3. Nome do zelador (1 coluna em celular, 2 colunas em tablet/desktop) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Nome do síndico */}
                  <div>
                    <label htmlFor="input-manager-name" className="block text-[11px] sm:text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 truncate">
                      Nome do Síndico(a) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User size={18} />
                      </div>
                      <input
                        id="input-manager-name"
                        type="text"
                        required
                        value={managerName}
                        onChange={(e) => setManagerName(e.target.value)}
                        placeholder="Nome completo do síndico(a)"
                        className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-xs sm:text-sm shadow-xs min-h-[48px]"
                      />
                    </div>
                  </div>

                  {/* Nome do zelador */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="input-janitor-name" className="block text-[11px] sm:text-xs font-bold text-slate-900 uppercase tracking-wider truncate">
                        Nome do Zelador(a)
                      </label>
                      <span className="text-[10px] text-slate-500 font-semibold shrink-0">
                        {event.requireJanitor ? '(Obrigatório)' : '(Opcional)'}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User size={18} />
                      </div>
                      <input
                        id="input-janitor-name"
                        type="text"
                        required={event.requireJanitor}
                        value={janitorName}
                        onChange={(e) => setJanitorName(e.target.value)}
                        placeholder="Nome do zelador ou encarregado"
                        className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-xs sm:text-sm shadow-xs min-h-[48px]"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. WhatsApp */}
                <div>
                  <label htmlFor="input-whatsapp" className="block text-[11px] sm:text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                    WhatsApp para Contato <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone size={18} />
                    </div>
                    <input
                      id="input-whatsapp"
                      type="tel"
                      required
                      value={whatsapp}
                      onChange={handlePhoneChange}
                      placeholder="+55 (11) 99999-9999"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-xs sm:text-sm font-mono shadow-xs min-h-[48px]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    Enviaremos a confirmação e QR Code para este número.
                  </p>
                </div>

                {/* Quem participará */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                    Quem participará do evento?
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setAttendeeRole('manager')}
                      className={`py-2 px-2 rounded-xl border text-[11px] sm:text-xs font-semibold transition flex flex-col items-center justify-center min-h-[44px] cursor-pointer ${
                        attendeeRole === 'manager'
                          ? 'bg-teal-50 border-teal-600 text-teal-950 ring-2 ring-teal-600/30 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>Síndico(a)</span>
                      <span className="text-[10px] text-slate-500">1 pessoa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttendeeRole('janitor')}
                      className={`py-2 px-2 rounded-xl border text-[11px] sm:text-xs font-semibold transition flex flex-col items-center justify-center min-h-[44px] cursor-pointer ${
                        attendeeRole === 'janitor'
                          ? 'bg-teal-50 border-teal-600 text-teal-950 ring-2 ring-teal-600/30 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>Zelador(a)</span>
                      <span className="text-[10px] text-slate-500">1 pessoa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttendeeRole('both')}
                      className={`py-2 px-2 rounded-xl border text-[11px] sm:text-xs font-semibold transition flex flex-col items-center justify-center min-h-[44px] cursor-pointer ${
                        attendeeRole === 'both'
                          ? 'bg-teal-50 border-teal-600 text-teal-950 ring-2 ring-teal-600/30 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-teal-900 font-black">Ambos</span>
                      <span className="text-[10px] text-teal-700 font-bold">2 pessoas</span>
                    </button>
                  </div>
                </div>

                {/* Botões de Ação do Formulário: “Confirmar presença” e secundário “Cancelar” */}
                <div className="pt-2 sm:pt-3 space-y-2">
                  <button
                    id="btn-confirm-attendance"
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black py-3 sm:py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 text-sm sm:text-base tracking-wide disabled:opacity-50 min-h-[48px] cursor-pointer"
                  >
                    <CheckCircle2 size={20} />
                    <span>
                      {submitting
                        ? 'PROCESSANDO INSCRIÇÃO...'
                        : 'Confirmar presença'}
                    </span>
                  </button>

                  <button
                    id="btn-cancel-attendance"
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="w-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 hover:text-slate-900 font-bold py-2.5 sm:py-3 px-4 rounded-xl border border-slate-300 transition text-xs sm:text-sm min-h-[48px] cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>

              {/* Endereço e Link do Mapa */}
              {event.address && (
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    <MapPin size={14} className="text-teal-700 shrink-0" />
                    <span className="truncate">{event.address}</span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${event.location}, ${event.address}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 hover:text-teal-900 font-bold shrink-0 inline-flex items-center gap-1"
                  >
                    <span>Ver Mapa</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
