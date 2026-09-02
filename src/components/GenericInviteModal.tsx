import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  QrCode as QrIcon,
  MessageSquare,
  Share2,
  ExternalLink,
  Download,
  Printer,
  Sparkles,
  Building2,
  Calendar,
  MapPin
} from 'lucide-react';
import QRCode from 'qrcode';
import { CondoEvent } from '../types';
import { formatDateBR } from '../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  event: CondoEvent | null;
  onOpenForm?: () => void;
}

export const GenericInviteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  event,
  onOpenForm
}) => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'qrcode' | 'link'>('whatsapp');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const genericUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/convite/geral`
    : 'https://seusite.com/convite/geral';

  useEffect(() => {
    if (isOpen && genericUrl) {
      QRCode.toDataURL(genericUrl, {
        width: 480,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then(setQrDataUrl)
        .catch(console.error);
    }
  }, [isOpen, genericUrl]);

  if (!isOpen || !event) return null;

  const broadcastMessage = `📢 *CONVITE OFICIAL: ${event.title.toUpperCase()}*

Prezados Síndicos, Síndicas e Zeladores,

Você e sua equipe estão convidados para o nosso encontro exclusivo:

📅 *Data:* ${formatDateBR(event.date)}
⏰ *Horário:* ${event.time}
📍 *Local:* ${event.location}
${event.address ? `🗺️ *Endereço:* ${event.address}\n` : ''}
${event.presentationText ? `ℹ️ *Sobre:* ${event.presentationText}\n` : ''}
👉 *Confirme sua presença e retire seu passe de entrada pelo link:*
${genericUrl}

_As vagas são limitadas. Por favor, confirme o quanto antes!_`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(genericUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(broadcastMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qrcode-convite-geral-${event.id}.png`;
    a.click();
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(broadcastMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Convite Geral (Formulário Único)</h2>
              <p className="text-xs text-slate-500">Divulgue em grupos ou cartazes para todos os condomínios</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Nav */}
        <div className="grid grid-cols-3 border-b border-slate-200 text-xs font-bold bg-slate-50/50">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`py-3 flex items-center justify-center gap-1.5 transition border-b-2 ${
              activeTab === 'whatsapp'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/60'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare size={15} />
            <span>Mensagem Grupos</span>
          </button>

          <button
            onClick={() => setActiveTab('qrcode')}
            className={`py-3 flex items-center justify-center gap-1.5 transition border-b-2 ${
              activeTab === 'qrcode'
                ? 'border-teal-700 text-teal-900 bg-teal-50/60'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrIcon size={15} />
            <span>QR Code Cartaz</span>
          </button>

          <button
            onClick={() => setActiveTab('link')}
            className={`py-3 flex items-center justify-center gap-1.5 transition border-b-2 ${
              activeTab === 'link'
                ? 'border-sky-600 text-sky-800 bg-sky-50/60'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Share2 size={15} />
            <span>Link do Formulário</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Texto Pronto para Envio</span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded border border-emerald-200">
                    WhatsApp Formatado
                  </span>
                </div>
                <pre className="text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto p-3 bg-white rounded-xl border border-slate-200">
                  {broadcastMessage}
                </pre>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={handleCopyMessage}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                >
                  {copiedMessage ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedMessage ? 'Texto Copiado!' : 'Copiar Texto para WhatsApp'}</span>
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="bg-white hover:bg-slate-100 text-emerald-700 py-3 px-4 rounded-xl text-xs font-bold border border-slate-300 transition flex items-center justify-center gap-2 shadow-2xs"
                >
                  <MessageSquare size={16} />
                  <span>Abrir no WhatsApp Web</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'qrcode' && (
            <div className="text-center space-y-4">
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Imprima este QR Code em avisos de elevador, recepção ou projete na tela de reuniões. Ao escanear, o síndico acessa o formulário de confirmação.
              </p>

              {qrDataUrl && (
                <div className="bg-white p-5 rounded-2xl inline-block shadow-md border border-slate-200 max-w-[260px] mx-auto">
                  <img src={qrDataUrl} alt="QR Code Convite Geral" className="w-52 h-52 mx-auto rounded-lg" />
                  <div className="text-[11px] font-bold text-slate-900 mt-2 uppercase tracking-wider">
                    {event.title}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    /convite/geral
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-3">
                <button
                  onClick={handleDownloadQr}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center gap-2 shadow-md shadow-teal-700/20"
                >
                  <Download size={15} />
                  <span>Baixar Imagem PNG</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold py-2.5 px-4 rounded-xl border border-slate-300 transition flex items-center gap-2 shadow-2xs"
                >
                  <Printer size={15} />
                  <span>Imprimir</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Link Direto do Formulário Único
                </label>
                <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl p-2 shadow-2xs">
                  <input
                    type="text"
                    readOnly
                    value={genericUrl}
                    className="bg-transparent text-xs text-teal-800 font-mono font-medium flex-1 outline-none px-2"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shrink-0"
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Este link pode ser acessado por qualquer pessoa simultaneamente. Cada envio cria um registro com QR Code e código individual.
                </p>
              </div>

              <div className="pt-2">
                <a
                  href={genericUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-white hover:bg-slate-100 text-slate-800 py-3 px-4 rounded-xl text-xs font-bold border border-slate-300 transition flex items-center justify-center gap-2 shadow-2xs"
                >
                  <ExternalLink size={15} />
                  <span>Abrir Formulário em Nova Aba</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            {event.title} • {formatDateBR(event.date)}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition shadow-2xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
