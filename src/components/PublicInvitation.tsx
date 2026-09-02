import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Building2,
  User,
  Phone,
  Download,
  ExternalLink,
  Sparkles,
  AlertCircle,
  FileText,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  QrCode as QrIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { Invitation, CondoEvent, AttendeeRole } from '../types';
import { getInvitationByCode, submitRsvp, getActiveEventPublic, registerPublicInvitation } from '../lib/api';
import { formatPhone, formatDateBR, downloadCalendarFile, buildInvitationUrl } from '../lib/utils';
import { AtivaLogo } from './AtivaLogo';

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
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [showDeclinedCard, setShowDeclinedCard] = useState(false);
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
          setShowSuccessCard(false);
          setShowDeclinedCard(false);

          if (data.event) {
            document.title = `${data.event.shareTitle || data.event.title} | Formulário de Confirmação Grupo Ativa`;
          }
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
            document.title = `${data.invitation.condoName} | Confirmação de Presença - Grupo Ativa`;
          }

          // Prepopulate form fields
          setCondoName(data.invitation.condoName || '');
          setManagerName(data.invitation.managerName || '');
          setJanitorName(data.invitation.janitorName || '');
          setWhatsapp(data.invitation.whatsapp || '');
          if (data.invitation.attendeeRole && data.invitation.attendeeRole !== 'none') {
            setAttendeeRole(data.invitation.attendeeRole);
          }

          // If the guest already confirmed before, show the pass (but allow editing)
          if (data.invitation.status === 'confirmed' || data.invitation.status === 'checked_in') {
            setShowSuccessCard(true);
          } else if (data.invitation.status === 'declined') {
            setShowDeclinedCard(true);
          } else {
            // Pending or viewed: directly open form!
            setShowSuccessCard(false);
            setShowDeclinedCard(false);
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
        const res = await registerPublicInvitation(event.id, {
          condoName,
          managerName,
          janitorName,
          whatsapp,
          attendeeRole,
          internalNotes: notes
        });

        setInvitation(res.invitation);
        setShowSuccessCard(true);
        setShowDeclinedCard(false);

        // Confetti celebration
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } else {
        const res = await submitRsvp(invitation.code, {
          action: 'confirm',
          attendeeRole,
          condoName,
          managerName,
          janitorName,
          whatsapp
        });

        setInvitation(res.invitation);
        setShowSuccessCard(true);
        setShowDeclinedCard(false);

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
      alert('Como este é o formulário de inscrição, basta não enviar para não participar.');
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
      setShowDeclinedCard(true);
      setShowSuccessCard(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar resposta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartNewGenericRegistration = () => {
    setInvitation(null);
    setCondoName('');
    setManagerName('');
    setJanitorName('');
    setWhatsapp('');
    setNotes('');
    setAttendeeRole('both');
    setShowSuccessCard(false);
    setShowDeclinedCard(false);
    setMode('generic');
    if (onSelectCode) {
      onSelectCode('geral');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-extrabold text-black">Carregando formulário do convite...</h2>
          <p className="text-slate-600 text-xs mt-2 font-medium">Acessando informações e disponibilidade em tempo real</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
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
              className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-xl font-bold transition text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles size={16} />
              <span>Abrir Formulário de Inscrição</span>
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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-4 sm:py-8 px-3 sm:px-4 md:px-6 flex flex-col justify-between">
      <div className="max-w-xl mx-auto w-full space-y-4">
        
        {/* View 1: Confirmed Pass Screen (After submission or if already confirmed) */}
        {showSuccessCard && invitation ? (
          <div
            id="rsvp-success-pass"
            className="bg-white border border-emerald-300 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl text-slate-900 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-300 shadow-md">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight mb-1">
                Presença Confirmada!
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mb-5">
                Seu passe de entrada foi gerado com sucesso. Apresente o QR Code na recepção.
              </p>

              {/* QR Code Entry Pass */}
              {qrDataUrl && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 max-w-[260px] sm:max-w-[280px] mx-auto mb-5 shadow-sm text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Passe de Entrada • Check-in
                  </div>
                  <img
                    src={qrDataUrl}
                    alt={`QR Code ${invitation.code}`}
                    className="w-40 h-40 mx-auto rounded-xl bg-white p-2 border border-slate-200 object-contain block shadow-xs"
                  />
                  <div className="mt-2.5 font-mono font-black text-base sm:text-lg tracking-widest text-teal-900 bg-teal-50 py-1 px-3 rounded-lg border border-teal-200 inline-block">
                    #{invitation.code}
                  </div>
                </div>
              )}

              {/* Data Summary Box */}
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
                <div className="flex items-center justify-between gap-2 py-1">
                  <span className="text-slate-500 font-medium">Local:</span>
                  <span className="font-bold text-black text-right">{event.address}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => downloadCalendarFile(event)}
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 px-4 rounded-xl transition shadow-md text-xs sm:text-sm min-h-[44px]"
                >
                  <Download size={16} />
                  <span>Salvar na Agenda (.ics)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSuccessCard(false)}
                  className="w-full sm:flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-xl border border-slate-300 transition text-xs sm:text-sm min-h-[44px]"
                >
                  Editar / Alterar Dados
                </button>
              </div>
            </div>
          </div>
        ) : showDeclinedCard && invitation ? (
          /* View 2: Declined Screen */
          <div className="bg-white border border-rose-200 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl text-slate-900 text-center">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-rose-200">
              <XCircle size={32} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-black mb-1.5 tracking-tight">Resposta Registrada</h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-5 max-w-md mx-auto">
              Registramos que você não poderá comparecer ao evento. Agradecemos pela resposta.
            </p>

            <button
              type="button"
              onClick={() => {
                setShowDeclinedCard(false);
                setShowSuccessCard(false);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl transition text-xs sm:text-sm shadow-md min-h-[44px]"
            >
              Mudei de ideia: Desejo Confirmar Presença
            </button>
          </div>
        ) : (
          /* View 3: Direct Registration / Confirmation Form (Opened immediately on link click) */
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 shadow-2xl text-slate-900">
            <div className="mb-5 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2 text-teal-700 font-bold text-xs tracking-wider uppercase mb-1">
                <Sparkles size={14} className="text-teal-600 shrink-0" />
                <span>Confirmação Imediata</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">
                Preencha os Dados para Inscrição
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-1 leading-relaxed">
                Informe os dados do seu condomínio para garantir as vagas e emitir o passe de acesso.
              </p>
            </div>

            <form onSubmit={handleConfirm} className="space-y-4 sm:space-y-5">
              {/* Condomínio */}
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
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
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-black font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-xs sm:text-sm shadow-xs min-h-[44px]"
                  />
                </div>
              </div>

              {/* Síndico */}
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
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
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-black font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-xs sm:text-sm shadow-xs min-h-[44px]"
                  />
                </div>
              </div>

              {/* Zelador */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
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
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-black font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-xs sm:text-sm shadow-xs min-h-[44px]"
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
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
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-black font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-xs sm:text-sm font-mono shadow-xs min-h-[44px]"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Enviaremos a confirmação e QR Code para este número.
                </p>
              </div>

              {/* Quem participará */}
              <div className="pt-1">
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
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
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                  Observações ou Dúvidas <span className="text-slate-500 font-normal">(Opcional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Ex: Chegaremos por volta das 14h / Dúvidas sobre o local"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-black font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 text-xs shadow-xs"
                />
              </div>

              {/* Submit Action */}
              <div className="pt-2 space-y-2.5">
                <button
                  id="btn-confirm-attendance"
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-4 rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 text-sm sm:text-base tracking-wide disabled:opacity-50 min-h-[48px]"
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

            {/* Address and Map link at the bottom of form */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2 min-w-0 pr-2">
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
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-400 font-medium py-2">
          Grupo Ativa • Gestão Corporativa de Eventos e Condomínios
        </div>
      </div>
    </div>
  );
};

