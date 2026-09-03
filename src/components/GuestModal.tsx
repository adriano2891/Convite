import React, { useState, useEffect } from 'react';
import { X, Building2, User, Phone, FileText, AlertTriangle, Check, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { Invitation, CondoEvent } from '../types';
import { checkDuplicate, createInvitation, updateInvitation } from '../lib/api';
import { formatPhone, buildInvitationUrl, openWhatsApp, getWhatsAppMessage } from '../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  event: CondoEvent;
  invitationToEdit?: Invitation | null;
  onSuccess: (inv: Invitation) => void;
}

export const GuestModal: React.FC<Props> = ({
  isOpen,
  onClose,
  event,
  invitationToEdit,
  onSuccess
}) => {
  const [condoName, setCondoName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [janitorName, setJanitorName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [customShareImageUrl, setCustomShareImageUrl] = useState('');
  const [status, setStatus] = useState<Invitation['status']>('not_viewed');

  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<Invitation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (invitationToEdit) {
      setCondoName(invitationToEdit.condoName);
      setManagerName(invitationToEdit.managerName);
      setJanitorName(invitationToEdit.janitorName || '');
      setWhatsapp(invitationToEdit.whatsapp);
      setInternalNotes(invitationToEdit.internalNotes || '');
      setCustomShareImageUrl(invitationToEdit.customShareImageUrl || '');
      setStatus(invitationToEdit.status);
    } else {
      setCondoName('');
      setManagerName('');
      setJanitorName('');
      setWhatsapp('');
      setInternalNotes('');
      setCustomShareImageUrl('');
      setStatus('not_viewed');
    }
    setDuplicateWarning(null);
  }, [invitationToEdit, isOpen]);

  // Debounced duplicate check
  useEffect(() => {
    if (!isOpen || invitationToEdit) return;
    if (!condoName && !whatsapp && !managerName) {
      setDuplicateWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingDuplicate(true);
        const res = await checkDuplicate(event.id, {
          condoName,
          managerName,
          whatsapp,
          excludeId: invitationToEdit?.id
        });
        if (res.hasDuplicate && res.duplicates.length > 0) {
          setDuplicateWarning(res.duplicates[0]);
        } else {
          setDuplicateWarning(null);
        }
      } catch (err) {
        console.error('Error checking duplicate:', err);
      } finally {
        setCheckingDuplicate(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [condoName, managerName, whatsapp, event.id, isOpen, invitationToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!condoName.trim() || !managerName.trim() || !whatsapp.trim()) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }

    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);

    try {
      setSubmitting(true);
      let result: Invitation;
      if (invitationToEdit) {
        result = await updateInvitation(invitationToEdit.id, {
          condoName: condoName.trim(),
          managerName: managerName.trim(),
          janitorName: janitorName.trim(),
          whatsapp: whatsapp.trim(),
          internalNotes: internalNotes.trim(),
          customShareImageUrl: customShareImageUrl.trim() || undefined,
          status
        });
      } else {
        result = await createInvitation(event.id, {
          condoName: condoName.trim(),
          managerName: managerName.trim(),
          janitorName: janitorName.trim(),
          whatsapp: whatsapp.trim(),
          internalNotes: internalNotes.trim(),
          customShareImageUrl: customShareImageUrl.trim() || undefined
        });
      }
      onSuccess(result);
      setSaveSuccessMessage('Alterações salvas com sucesso');
      setTimeout(() => {
        setSaveSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setSaveErrorMessage(err.message || 'Não foi possível salvar as alterações no banco de dados. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!invitationToEdit) return;
    const url = buildInvitationUrl(invitationToEdit.code);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendWhatsAppNow = () => {
    if (!invitationToEdit) return;
    const msg = getWhatsAppMessage('notViewed', invitationToEdit, event);
    openWhatsApp(invitationToEdit.whatsapp, msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-800 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-slate-900 mb-1">
          {invitationToEdit ? 'Editar Convite' : 'Novo Convite'}
        </h2>
        <p className="text-slate-500 text-xs mb-5">
          {invitationToEdit
            ? `Código do Convite: ${invitationToEdit.code}`
            : 'Cadastre o condomínio e gere o link exclusivo de confirmação'}
        </p>

        {/* Visual Database Save Feedback */}
        {saveSuccessMessage && (
          <div className="mb-4 bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
            <button onClick={() => setSaveSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2">✕</button>
          </div>
        )}

        {saveErrorMessage && (
          <div className="mb-4 bg-rose-50 border border-rose-300 text-rose-900 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{saveErrorMessage}</span>
            </div>
            <button
              onClick={() => handleSubmit()}
              className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold transition shrink-0 ml-2"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Duplicate Warning */}
        {duplicateWarning && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
            <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-bold block text-amber-900">Possível Duplicidade Detectada!</span>
              Já existe um convite cadastrado para <strong>{duplicateWarning.condoName}</strong> (
              {duplicateWarning.managerName} - {duplicateWarning.whatsapp}). Código:{' '}
              <span className="font-mono font-bold text-slate-900">{duplicateWarning.code}</span>.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Condomínio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Condomínio <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Building2 size={16} />
              </div>
              <input
                type="text"
                required
                value={condoName}
                onChange={(e) => setCondoName(e.target.value)}
                placeholder="Ex: Condomínio Maison Royale"
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition shadow-2xs"
              />
            </div>
          </div>

          {/* Síndico */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nome do Síndico(a) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User size={16} />
              </div>
              <input
                type="text"
                required
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="Ex: Roberto Alencar"
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition shadow-2xs"
              />
            </div>
          </div>

          {/* Zelador */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nome do Zelador
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User size={16} />
              </div>
              <input
                type="text"
                value={janitorName}
                onChange={(e) => setJanitorName(e.target.value)}
                placeholder="Ex: Valdir Santos"
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition shadow-2xs"
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              WhatsApp <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone size={16} />
              </div>
              <input
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                placeholder="+55 (11) 99999-9999"
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 font-mono transition shadow-2xs"
              />
            </div>
          </div>

          {/* Status (when editing) */}
          {invitationToEdit && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Status do Convite
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition shadow-2xs"
              >
                <option value="not_viewed">⚪ Não visualizado</option>
                <option value="viewed">🔵 Visualizado</option>
                <option value="confirmed">🟢 Confirmado</option>
                <option value="declined">🔴 Não participará</option>
                <option value="checked_in">🟣 Check-in realizado</option>
              </select>
            </div>
          )}

          {/* Observações Internas */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Observações Internas (Privadas do Admin)
            </label>
            <div className="relative">
              <textarea
                rows={2}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Ex: Síndico pediu para confirmar número de participantes na véspera."
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition shadow-2xs"
              />
            </div>
          </div>

          {/* Capa de Compartilhamento Personalizada (Opcional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Capa de Preview Personalizada (Opcional para este convite)
            </label>
            <input
              type="url"
              value={customShareImageUrl}
              onChange={(e) => setCustomShareImageUrl(e.target.value)}
              placeholder="https://exemplo.com/capa-vip-condominio.jpg (deixe vazio para capa padrão)"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition shadow-2xs"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Se preenchido, substitui a imagem padrão de preview social exclusivamente para este condomínio.
            </p>
          </div>

          {/* Link Tools (if editing) */}
          {invitationToEdit && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
              <div className="truncate text-xs text-slate-600 font-mono">
                {buildInvitationUrl(invitationToEdit.code)}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 transition flex items-center gap-1 text-xs shadow-2xs"
                  title="Copiar Link"
                >
                  {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsAppNow}
                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white transition flex items-center gap-1 text-xs shadow-2xs"
                  title="Enviar WhatsApp"
                >
                  <Phone size={14} />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition shadow-md shadow-teal-700/20 disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : invitationToEdit ? 'Atualizar Convite' : 'Criar Convite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
