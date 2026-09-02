import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Users,
  Building2,
  User,
  Phone,
  QrCode as QrIcon,
  Download,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertCircle,
  FileText,
  Search,
  Share2,
  Check,
  Copy,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { Invitation, CondoEvent, AttendeeRole } from '../types';
import { getInvitationByCode, submitRsvp, getActiveEventPublic, registerPublicInvitation } from '../lib/api';
import { formatPhone, formatDateBR, downloadCalendarFile, buildInvitationUrl } from '../lib/utils';

interface Props {
  code?: string;
  onNavigateToAdmin?: () => void;
  onBackToAdmin?: () => void;
  onSelectCode?: (newCode: string) => void;
}

export const PublicInvitation: React.FC<Props> = ({
  code = 'geral',
  onNavigateToAdmin,
  onBackToAdmin,
  onSelectCode
}) => {
  const isGenericCode = !code || code.toLowerCase() === 'geral' || code.toLowerCase() === 'aberto' || code.toLowerCase() === 'novo';

  const [mode, setMode] = useState<'generic' | 'code'>(isGenericCode ? 'generic' : 'code');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [event, setEvent] = useState<CondoEvent | null>(null);
  const [confirmedCount, setConfirmedCount] = useState<number>(0);
  const [availableSlots, setAvailableSlots] = useState<number>(50);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [condoName, setCondoName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [janitorName, setJanitorName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [notes, setNotes] = useState('');
  const [attendeeRole, setAttendeeRole] = useState<AttendeeRole>('both');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showEditForm, setShowEditForm] = useState(false);
  const [lookupCodeInput, setLookupCodeInput] = useState('');
  const [showLookupBox, setShowLookupBox] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Synchronize when prop changes
  useEffect(() => {
    if (!code || code.toLowerCase() === 'geral' || code.toLowerCase() === 'aberto') {
      setMode('generic');
    } else {
      setMode('code');
    }
  }, [code]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        if (mode === 'generic') {
          // Load active event for generic open form
          const data = await getActiveEventPublic();
          setEvent(data.event);
          setConfirmedCount(data.confirmedParticipants);
          setAvailableSlots(data.availableSlots);
          setInvitation(null);
          if (data.event) {
            document.title = `${data.event.shareTitle || data.event.title} | Convite Especial Grupo Ativa`;
          }
          // Keep form clean or reset if switching
          setCondoName('');
          setManagerName('');
          setJanitorName('');
          setWhatsapp('');
          setNotes('');
          setAttendeeRole('both');
        } else {
          // Load invitation by specific code
          const activeCode = code && code.toLowerCase() !== 'geral' ? code : 'ROYAL01';
          const data = await getInvitationByCode(activeCode);
          setInvitation(data.invitation);
          setEvent(data.event);

          if (data.event && data.invitation) {
            document.title = `${data.invitation.condoName} | ${data.event.shareTitle || data.event.title} - Grupo Ativa`;
          }

          // Prepopulate form
          setCondoName(data.invitation.condoName || '');
          setManagerName(data.invitation.managerName || '');
          setJanitorName(data.invitation.janitorName || '');
          setWhatsapp(data.invitation.whatsapp || '');
          if (data.invitation.attendeeRole && data.invitation.attendeeRole !== 'none') {
            setAttendeeRole(data.invitation.attendeeRole);
          }

          // Generate QR code for entry
          const passUrl = buildInvitationUrl(data.invitation.code);
          const qr = await QRCode.toDataURL(passUrl, { width: 320, margin: 2 });
          setQrDataUrl(qr);
        }
      } catch (err: any) {
        setError(err.message || 'Não foi possível carregar as informações do convite.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [code, mode]);

  // When invitation changes (e.g. after confirmation), generate its QR code
  useEffect(() => {
    if (invitation?.code) {
      const passUrl = buildInvitationUrl(invitation.code);
      QRCode.toDataURL(passUrl, { width: 320, margin: 2 }).then(setQrDataUrl).catch(console.error);
    }
  }, [invitation?.code]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setWhatsapp(formatted);
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!condoName.trim() || !managerName.trim() || !whatsapp.trim()) {
      alert('Por favor, preencha o Nome do Condomínio, Síndico(a) e WhatsApp.');
      return;
    }
    if (event?.requireJanitor && !janitorName.trim()) {
      alert('Por favor, preencha o nome do Zelador.');
      return;
    }

    try {
      setSubmitting(true);

      if (mode === 'generic' || !invitation) {
        if (!event) throw new Error('Evento não carregado');
        // Register in open general form
        const res = await registerPublicInvitation(event.id, {
          condoName,
          managerName,
          janitorName,
          whatsapp,
          attendeeRole,
          internalNotes: notes
        });

        setInvitation(res.invitation);
        setShowEditForm(false);

        // Confetti celebration!
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } else {
        // Submit RSVP for pre-existing invitation
        const res = await submitRsvp(invitation.code, {
          action: 'confirm',
          attendeeRole,
          condoName,
          managerName,
          janitorName,
          whatsapp
        });

        setInvitation(res.invitation);
        setShowEditForm(false);

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao confirmar presença');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation) {
      alert('Como este é o formulário geral de inscrição, basta não preencher para não participar.');
      return;
    }

    const confirmDecline = window.confirm(
      'Tem certeza de que não poderá comparecer ao evento?'
    );
    if (!confirmDecline) return;

    try {
      setSubmitting(true);
      const res = await submitRsvp(invitation.code, {
        action: 'decline',
        attendeeRole: 'none',
        condoName,
        managerName,
        janitorName,
        whatsapp
      });
      setInvitation(res.invitation);
      setShowEditForm(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar resposta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupCodeInput.trim()) return;
    const clean = lookupCodeInput.trim().toUpperCase();
    if (onSelectCode) {
      onSelectCode(clean);
    } else {
      window.history.pushState({}, '', `/convite/${clean}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    setShowLookupBox(false);
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleStartNewGenericRegistration = () => {
    setInvitation(null);
    setCondoName('');
    setManagerName('');
    setJanitorName('');
    setWhatsapp('');
    setNotes('');
    setAttendeeRole('both');
    setShowEditForm(false);
    setMode('generic');
    if (onSelectCode) {
      onSelectCode('geral');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ativa-gradient flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-extrabold text-black">Carregando convite do evento...</h2>
          <p className="text-slate-600 text-xs mt-2 font-medium">Acessando informações e vagas em tempo real</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-ativa-gradient flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-black text-black mb-2">Convite Não Encontrado</h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            {error || 'Não foi possível carregar as informações do convite.'}
          </p>

          <div className="space-y-2">
            <button
              onClick={handleStartNewGenericRegistration}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles size={16} />
              <span>Abrir Formulário Geral de Inscrição</span>
            </button>

            {(onNavigateToAdmin || onBackToAdmin) && (
              <button
                onClick={onNavigateToAdmin || onBackToAdmin}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-xl font-semibold transition text-xs border border-slate-300"
              >
                Ir para o Painel Administrativo
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isConfirmed = invitation && (invitation.status === 'confirmed' || invitation.status === 'checked_in');
  const isDeclined = invitation && invitation.status === 'declined';
  const hasResponded = (isConfirmed || isDeclined) && !showEditForm;

  return (
    <div className="min-h-screen bg-ativa-gradient text-slate-100 py-3 sm:py-6 px-2.5 sm:px-4 md:px-6 flex flex-col justify-between">
      <div className="max-w-xl mx-auto w-full space-y-4 sm:space-y-6">
        
        {/* Event Identity Card */}
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
          {/* Banner Image - 100% of the card, completely fitted without any crop */}
          {event.bannerUrl && (
            <div className="relative w-full bg-slate-50 border-b border-slate-200 flex items-center justify-center">
              <img
                src={event.bannerUrl}
                alt={event.title}
                referrerPolicy="no-referrer"
                className="w-full h-auto block object-contain max-w-full"
              />
            </div>
          )}

          <div className="p-4 sm:p-7 md:p-8">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-xs tracking-wider uppercase mb-2">
              <Sparkles size={14} className="text-teal-600 shrink-0" />
              <span>{invitation ? 'Confirmação de Presença' : 'Convite Oficial & Inscrição Aberta'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-black tracking-tight mb-2 sm:mb-3">
              {event.title}
            </h1>
            <p className="text-slate-700 text-xs sm:text-sm md:text-base leading-relaxed mb-4 sm:mb-6 font-normal">
              {event.presentationText}
            </p>

            {/* Event Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-200">
              <div className="flex items-center sm:items-start gap-3 bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                  <Calendar size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider">Data do Evento</div>
                  <div className="text-xs sm:text-sm font-bold text-black capitalize mt-0.5 truncate">
                    {formatDateBR(event.date)}
                  </div>
                </div>
              </div>

              <div className="flex items-center sm:items-start gap-3 bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                  <Clock size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider">Horário</div>
                  <div className="text-xs sm:text-sm font-bold text-black mt-0.5">{event.time}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200 sm:col-span-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <MapPin size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider">Local & Endereço</div>
                  <div className="text-xs sm:text-sm font-bold text-black mt-0.5">{event.location}</div>
                  {event.address && (
                    <div className="text-[11px] sm:text-xs text-slate-600 mt-0.5 font-medium leading-tight">{event.address}</div>
                  )}
                  {event.address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${event.location}, ${event.address}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-teal-700 hover:text-teal-900 font-bold mt-1.5"
                    >
                      <span>Abrir no Google Maps</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Card: Confirmed Pass or Open Form */}
        {hasResponded && invitation ? (
          <div
            id="rsvp-response-card"
            className={`rounded-2xl sm:rounded-3xl p-4 sm:p-7 md:p-8 border shadow-xl transition-all duration-300 bg-white ${
              isConfirmed
                ? 'border-emerald-200'
                : 'border-rose-200'
            }`}
          >
            {isConfirmed ? (
              <div className="text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-emerald-300 shadow-md">
                  <CheckCircle2 size={32} className="sm:w-9 sm:h-9" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-black mb-1.5 sm:mb-2 tracking-tight">
                  Presença Confirmada com Sucesso!
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm md:text-base leading-relaxed mb-4 sm:mb-6 max-w-md mx-auto">
                  Agradecemos sua confirmação. Apresente seu código na recepção no dia do evento.
                </p>

                {/* Summary Box - Fully Responsive on all screen sizes */}
                <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-slate-200 text-left mb-4 sm:mb-6 space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-medium shrink-0">Condomínio:</span>
                    <span className="font-bold text-black text-right truncate pl-2 max-w-[65%]">{invitation.condoName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-medium shrink-0">Síndico(a):</span>
                    <span className="font-bold text-black text-right truncate pl-2 max-w-[65%]">{invitation.managerName}</span>
                  </div>
                  {invitation.janitorName && (
                    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-200">
                      <span className="text-slate-500 font-medium shrink-0">Zelador(a):</span>
                      <span className="font-bold text-black text-right truncate pl-2 max-w-[65%]">{invitation.janitorName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-medium shrink-0">WhatsApp:</span>
                    <span className="font-mono font-semibold text-black text-right">{invitation.whatsapp}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-medium shrink-0">Participantes:</span>
                    <span className="font-bold text-teal-800 text-right">
                      {invitation.participantCount}{' '}
                      {invitation.participantCount === 1 ? 'Pessoa' : 'Pessoas'} (
                      {invitation.attendeeRole === 'both'
                        ? 'Síndico + Zelador'
                        : invitation.attendeeRole === 'janitor'
                        ? 'Zelador'
                        : 'Síndico'}
                      )
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 py-1.5">
                    <span className="text-slate-500 font-medium shrink-0">Código de Check-in:</span>
                    <span className="font-mono font-black text-teal-900 text-sm sm:text-base tracking-widest bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 shrink-0">
                      #{invitation.code}
                    </span>
                  </div>
                </div>

                {/* QR Code Entry Card */}
                {qrDataUrl && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-slate-900 max-w-[280px] sm:max-w-xs mx-auto mb-4 sm:mb-6 shadow-sm text-center w-full">
                    <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Passe de Entrada • Check-in
                    </div>
                    <img
                      src={qrDataUrl}
                      alt={`QR Code ${invitation.code}`}
                      className="w-36 h-36 sm:w-44 sm:h-44 mx-auto rounded-lg bg-white p-2 border border-slate-200 object-contain block"
                    />
                    <div className="mt-2 font-mono font-black text-sm sm:text-base tracking-widest text-black">
                      #{invitation.code}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 font-medium">
                      Apresente na portaria/recepção do evento
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                    <button
                      onClick={() => downloadCalendarFile(event)}
                      className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 sm:py-3.5 px-4 rounded-xl transition shadow-md text-xs sm:text-sm min-h-[44px]"
                    >
                      <Download size={16} />
                      <span>Salvar na Agenda (.ics)</span>
                    </button>
                    <button
                      onClick={() => setShowEditForm(true)}
                      className="w-full sm:flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 sm:py-3.5 px-4 rounded-xl border border-slate-300 transition text-xs sm:text-sm min-h-[44px]"
                    >
                      Alterar Meus Dados
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-rose-200">
                  <XCircle size={32} className="sm:w-9 sm:h-9" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-black mb-1.5 sm:mb-2 tracking-tight">Resposta Registrada</h2>
                <p className="text-slate-600 text-xs sm:text-sm sm:text-base leading-relaxed mb-4 sm:mb-6 max-w-md mx-auto">
                  Registramos que você não poderá comparecer. Agradecemos pelo retorno.
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => setShowEditForm(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl transition text-xs sm:text-sm shadow-md min-h-[44px]"
                  >
                    Desejo Alterar e Confirmar Minha Presença
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* The Universal RSVP Form (Generic or Specific) */
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-7 md:p-8 shadow-xl">
            <div className="mb-5 sm:mb-6 pb-4 sm:pb-5 border-b border-slate-200">
              <h2 className="text-xl sm:text-2xl font-extrabold text-black">
                Formulário de Confirmação
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-1">
                Preencha os dados do seu condomínio para garantir seu passe de entrada.
              </p>
            </div>

            <form onSubmit={handleConfirm} className="space-y-4 sm:space-y-5">
              {/* Condomínio */}
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5 sm:mb-2">
                  Nome do Condomínio / Edifício <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Building2 size={18} />
                  </div>
                  <input
                    id="input-condo-name"
                    type="text"
                    required
                    value={condoName}
                    onChange={(e) => setCondoName(e.target.value)}
                    placeholder="Ex: Condomínio Residencial Solar das Palmeiras"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-black font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-xs sm:text-sm shadow-sm min-h-[44px]"
                  />
                </div>
              </div>

              {/* Síndico */}
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5 sm:mb-2">
                  Nome do Síndico(a) ou Representante <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User size={18} />
                  </div>
                  <input
                    id="input-manager-name"
                    type="text"
                    required
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="Nome completo do síndico(a)"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-black font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-xs sm:text-sm shadow-sm min-h-[44px]"
                  />
                </div>
              </div>

              {/* Zelador */}
              <div>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <label className="block text-xs font-bold text-black uppercase tracking-wider">
                    Nome do Zelador(a) / Encarregado
                  </label>
                  <span className="text-xs text-slate-500 font-semibold">
                    {event.requireJanitor ? '(Obrigatório)' : '(Opcional)'}
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User size={18} />
                  </div>
                  <input
                    id="input-janitor-name"
                    type="text"
                    required={event.requireJanitor}
                    value={janitorName}
                    onChange={(e) => setJanitorName(e.target.value)}
                    placeholder="Nome do zelador ou encarregado"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-black font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-xs sm:text-sm shadow-sm min-h-[44px]"
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5 sm:mb-2">
                  WhatsApp para Contato <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone size={18} />
                  </div>
                  <input
                    id="input-whatsapp"
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={handlePhoneChange}
                    placeholder="+55 (11) 99999-9999"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-black font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-xs sm:text-sm font-mono shadow-sm min-h-[44px]"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Enviaremos seu comprovante e QR Code para este número.
                </p>
              </div>

              {/* Quem participará */}
              <div className="pt-1">
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2.5">
                  Quem participará do evento?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAttendeeRole('manager')}
                    className={`py-3 px-3 rounded-xl border text-xs sm:text-sm font-medium transition flex flex-col items-center justify-center gap-1 min-h-[44px] ${
                      attendeeRole === 'manager'
                        ? 'bg-teal-50 border-teal-600 text-black ring-2 ring-teal-600/30'
                        : 'bg-slate-50 border-slate-300 text-black hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-bold text-black">Apenas Síndico(a)</span>
                    <span className="text-[11px] text-slate-600 font-medium">1 participante</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttendeeRole('janitor')}
                    className={`py-3 px-3 rounded-xl border text-xs sm:text-sm font-medium transition flex flex-col items-center justify-center gap-1 min-h-[44px] ${
                      attendeeRole === 'janitor'
                        ? 'bg-teal-50 border-teal-600 text-black ring-2 ring-teal-600/30'
                        : 'bg-slate-50 border-slate-300 text-black hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-bold text-black">Apenas Zelador</span>
                    <span className="text-[11px] text-slate-600 font-medium">1 participante</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttendeeRole('both')}
                    className={`py-3 px-3 rounded-xl border text-xs sm:text-sm font-medium transition flex flex-col items-center justify-center gap-1 min-h-[44px] ${
                      attendeeRole === 'both'
                        ? 'bg-teal-50 border-teal-600 text-black ring-2 ring-teal-600/30'
                        : 'bg-slate-50 border-slate-300 text-black hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-black text-black">Síndico + Zelador</span>
                    <span className="text-[11px] text-teal-800 font-bold">2 participantes</span>
                  </button>
                </div>
              </div>

              {/* Observações / Notas */}
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5 sm:mb-2">
                  Observações ou Dúvidas <span className="text-slate-500 font-normal">(Opcional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Ex: Chegaremos por volta das 19h15 / Dúvidas sobre estacionamento"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 sm:px-4 py-2.5 text-black font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 text-xs shadow-sm"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 sm:pt-4 space-y-2.5 sm:space-y-3">
                <button
                  id="btn-confirm-attendance"
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 sm:py-4 px-4 sm:px-6 rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 text-sm sm:text-base tracking-wide disabled:opacity-50 min-h-[48px]"
                >
                  <CheckCircle2 size={20} />
                  <span>
                    {submitting
                      ? 'PROCESSANDO INSCRIÇÃO...'
                      : 'CONFIRMAR PRESENÇA & GERAR ACESSO'}
                  </span>
                </button>

                {invitation && (
                  <button
                    id="btn-decline-attendance"
                    type="button"
                    onClick={handleDecline}
                    disabled={submitting}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-black font-bold py-3 px-4 rounded-xl border border-slate-300 transition text-xs disabled:opacity-50 min-h-[44px]"
                  >
                    NÃO PODEREI COMPARECER
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Spacer / Bottom Padding */}
        <div className="pb-4 sm:pb-6" />
      </div>
    </div>
  );
};
