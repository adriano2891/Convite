import React, { useState } from 'react';
import {
  X,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  Building2,
  User,
  Phone,
  MessageSquare,
  QrCode,
  ExternalLink,
  Copy,
  Check,
  CalendarCheck,
  Edit2,
  Trash2,
  FileText,
  Save,
  Send
} from 'lucide-react';
import { Invitation, CondoEvent } from '../types';
import {
  formatDateTimeBR,
  formatRelativeTimeBR,
  buildInvitationUrl,
  openWhatsApp,
  getWhatsAppMessage
} from '../lib/utils';
import { toggleCheckin, updateInvitation, logWhatsAppOpened } from '../lib/api';

interface Props {
  invitation: Invitation | null;
  event: CondoEvent;
  onClose: () => void;
  onEdit: (inv: Invitation) => void;
  onDelete: (id: string) => void;
  onOpenWhatsApp: (inv: Invitation) => void;
  onOpenQr: (inv: Invitation) => void;
  onUpdate: (updated: Invitation) => void;
}

export const GuestDrawer: React.FC<Props> = ({
  invitation,
  event,
  onClose,
  onEdit,
  onDelete,
  onOpenWhatsApp,
  onOpenQr,
  onUpdate
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  React.useEffect(() => {
    if (invitation) {
      setNotes(invitation.internalNotes || '');
    }
  }, [invitation]);

  if (!invitation) return null;

  const handleCopyLink = () => {
    const url = buildInvitationUrl(invitation.code);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      const updated = await updateInvitation(invitation.id, {
        internalNotes: notes
      });
      onUpdate(updated);
      setEditingNotes(false);
    } catch (err) {
      alert('Erro ao salvar notas');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleToggleCheckin = async () => {
    try {
      const updated = await toggleCheckin(invitation.id);
      onUpdate(updated);
    } catch (err) {
      alert('Erro ao processar check-in');
    }
  };

  const handleManualConfirm = async () => {
    try {
      const updated = await updateInvitation(invitation.id, {
        status: 'confirmed',
        attendeeRole: invitation.attendeeRole === 'none' ? 'manager' : invitation.attendeeRole,
        participantCount: invitation.participantCount || 1,
        confirmedAt: new Date().toISOString()
      });
      onUpdate(updated);
    } catch (err) {
      alert('Erro ao confirmar presença');
    }
  };

  const handleManualDecline = async () => {
    try {
      const updated = await updateInvitation(invitation.id, {
        status: 'declined',
        attendeeRole: 'none',
        participantCount: 0,
        declinedAt: new Date().toISOString()
      });
      onUpdate(updated);
    } catch (err) {
      alert('Erro ao alterar status');
    }
  };

  const getStatusBadge = () => {
    switch (invitation.status) {
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
            <span className="w-2 h-2 rounded-full bg-teal-600" />
            Check-in Realizado
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Confirmado ({invitation.participantCount} {invitation.participantCount === 1 ? 'pessoa' : 'pessoas'})
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            Não Participará
          </span>
        );
      case 'viewed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-2 h-2 rounded-full bg-sky-600" />
            Visualizado ({invitation.viewCount}x)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Não Visualizado
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white border-l border-slate-200 shadow-2xl h-full flex flex-col text-slate-800 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-white/95 sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {getStatusBadge()}
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                #{invitation.code}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{invitation.condoName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Quick Actions Bar */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => onOpenWhatsApp(invitation)}
              className="flex flex-col items-center justify-center p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition text-xs font-bold gap-1 shadow-2xs"
            >
              <MessageSquare size={16} />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handleToggleCheckin}
              className={`flex flex-col items-center justify-center p-2.5 border rounded-xl transition text-xs font-bold gap-1 shadow-2xs ${
                invitation.status === 'checked_in'
                  ? 'bg-teal-100/80 text-teal-900 border-teal-300'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
            >
              <CalendarCheck size={16} />
              <span>{invitation.status === 'checked_in' ? 'Desfazer' : 'Check-in'}</span>
            </button>
            <button
              onClick={() => onOpenQr(invitation)}
              className="flex flex-col items-center justify-center p-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl transition text-xs font-bold gap-1 shadow-2xs"
            >
              <QrCode size={16} />
              <span>QR Code</span>
            </button>
            <button
              onClick={() => onEdit(invitation)}
              className="flex flex-col items-center justify-center p-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl transition text-xs font-bold gap-1 shadow-2xs"
            >
              <Edit2 size={16} />
              <span>Editar</span>
            </button>
          </div>

          {/* Guest Details Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <User size={14} /> Síndico(a):
              </span>
              <span className="font-bold text-slate-900">{invitation.managerName}</span>
            </div>

            {invitation.janitorName && (
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <User size={14} /> Zelador:
                </span>
                <span className="font-bold text-slate-900">{invitation.janitorName}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Phone size={14} /> WhatsApp:
              </span>
              <span className="font-mono text-slate-900 font-bold">{invitation.whatsapp}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Eye size={14} /> Acessos ao link:
              </span>
              <span className="text-slate-800 font-bold">
                {invitation.viewCount} {invitation.viewCount === 1 ? 'visualização' : 'visualizações'}
              </span>
            </div>

            {/* Individual Link */}
            <div className="pt-2">
              <div className="text-slate-600 mb-1.5 font-bold">Link Exclusivo do Convite:</div>
              <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-300 shadow-2xs">
                <span className="font-mono text-[11px] text-slate-700 truncate flex-1">
                  {buildInvitationUrl(invitation.code)}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                  title="Copiar link"
                >
                  {copiedLink ? <Check size={14} className="text-teal-700 font-bold" /> : <Copy size={14} />}
                </button>
                <a
                  href={buildInvitationUrl(invitation.code)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                  title="Abrir em nova aba"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <FileText size={14} />
                <span>Observações Internas (Privadas)</span>
              </div>
              {!editingNotes && (
                <button
                  onClick={() => setEditingNotes(true)}
                  className="text-xs font-bold text-teal-700 hover:text-teal-800"
                >
                  Editar
                </button>
              )}
            </div>

            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione anotações internas (ex: Síndico ligou, virá acompanhado)..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setNotes(invitation.internalNotes || '');
                      setEditingNotes(false);
                    }}
                    className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
                  >
                    <Save size={12} />
                    <span>Salvar</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 italic">
                {invitation.internalNotes || 'Nenhuma observação interna registrada.'}
              </p>
            )}
          </div>

          {/* History Timeline */}
          <div>
            <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <Clock size={14} />
              <span>Histórico & Linha do Tempo</span>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {invitation.history && invitation.history.length > 0 ? (
                invitation.history
                  .slice()
                  .reverse()
                  .map((item, idx) => {
                    let dotColor = 'bg-slate-400';
                    if (item.type === 'confirmed') dotColor = 'bg-emerald-600 ring-4 ring-emerald-100';
                    else if (item.type === 'declined') dotColor = 'bg-rose-600 ring-4 ring-rose-100';
                    else if (item.type === 'checked_in') dotColor = 'bg-teal-700 ring-4 ring-teal-100';
                    else if (item.type === 'viewed') dotColor = 'bg-sky-600';
                    else if (item.type === 'whatsapp_opened') dotColor = 'bg-emerald-500';

                    return (
                      <div key={item.id || idx} className="relative group">
                        <div
                          className={`absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full ${dotColor}`}
                        />
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div className="text-xs font-bold text-slate-800">{item.description}</div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                            <span>{formatDateTimeBR(item.timestamp)}</span>
                            <span className="text-slate-400">{formatRelativeTimeBR(item.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-xs text-slate-400 italic">Nenhum evento registrado ainda.</div>
              )}
            </div>
          </div>

          {/* Quick Manual Status Changes */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <div className="text-xs text-slate-600 font-bold">Ações Manuais Rápidas:</div>
            <div className="flex flex-wrap gap-2">
              {invitation.status !== 'confirmed' && invitation.status !== 'checked_in' && (
                <button
                  onClick={handleManualConfirm}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-2xs"
                >
                  <CheckCircle2 size={13} />
                  <span>Confirmar Presença</span>
                </button>
              )}
              {invitation.status !== 'declined' && (
                <button
                  onClick={handleManualDecline}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-2xs"
                >
                  <XCircle size={13} />
                  <span>Marcar como Não Participará</span>
                </button>
              )}
              <button
                onClick={() => onDelete(invitation.id)}
                className="px-3 py-1.5 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-300 hover:border-rose-300 rounded-lg text-xs font-semibold transition ml-auto flex items-center gap-1 shadow-2xs"
              >
                <Trash2 size={13} />
                <span>Excluir Convidado</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
