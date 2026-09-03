import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { CondoEvent, Invitation } from '../types';
import { batchImportInvitations } from '../lib/api';
import { formatPhone } from '../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  event: CondoEvent;
  existingInvitations: Invitation[];
  onSuccess: (count: number) => void;
}

interface ParsedRow {
  condoName: string;
  managerName: string;
  janitorName?: string;
  whatsapp: string;
  internalNotes?: string;
  isDuplicate?: boolean;
}

export const BatchImportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  event,
  existingInvitations,
  onSuccess
}) => {
  const [inputText, setInputText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const sampleCsv = `Condomínio Maison Royale;Roberto Alencar;Valdir Santos;11998877665
Residencial Jardim Europa;Camila Rodrigues;José Ferreira;11988776655
Edifício Blue Tower;Marcos Vinícius;Antônio Silva;11977665544
Condomínio Park Avenue;Juliana Mendes;;11966554433`;

  const handleParse = () => {
    if (!inputText.trim()) {
      alert('Por favor, cole os dados para importação.');
      return;
    }

    const lines = inputText.trim().split(/\r?\n/);
    const rows: ParsedRow[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Ignore header line if present
      if (
        i === 0 &&
        (line.toLowerCase().includes('condom') || line.toLowerCase().includes('sindico'))
      ) {
        continue;
      }

      // Split by semicolon, tab, or comma
      let parts: string[] = [];
      if (line.includes(';')) {
        parts = line.split(';').map((s) => s.trim());
      } else if (line.includes('\t')) {
        parts = line.split('\t').map((s) => s.trim());
      } else if (line.includes(',')) {
        parts = line.split(',').map((s) => s.trim());
      } else {
        parts = [line];
      }

      const condoName = parts[0] || '';
      const managerName = parts[1] || '';
      const janitorName = parts[2] || '';
      const rawPhone = parts[3] || '';

      if (!condoName || !managerName || !rawPhone) continue;

      const formattedPhone = formatPhone(rawPhone);

      // Duplicate check against existing invitations
      const cleanPhone = (p: string) => p.replace(/\D/g, '');
      const isDuplicate = existingInvitations.some(
        (inv) =>
          inv.condoName.toLowerCase() === condoName.toLowerCase() ||
          cleanPhone(inv.whatsapp).includes(cleanPhone(rawPhone).slice(-8))
      );

      rows.push({
        condoName,
        managerName,
        janitorName,
        whatsapp: formattedPhone,
        isDuplicate
      });
    }

    if (rows.length === 0) {
      alert('Nenhum registro válido identificado. Verifique o formato dos dados.');
      return;
    }

    setParsedRows(rows);
    setStep('preview');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    try {
      setImporting(true);
      setErrorMessage(null);
      const res = await batchImportInvitations(event.id, parsedRows);
      onSuccess(res.importedCount);
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Não foi possível salvar os convidados no banco de dados. Tente novamente.'
      );
    } finally {
      setImporting(false);
    }
  };

  const duplicateCount = parsedRows.filter((r) => r.isDuplicate).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative text-slate-800 max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
            <FileSpreadsheet size={20} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Importação em Massa de Convidados</h2>
        </div>
        <p className="text-slate-500 text-xs mb-3">
          Importe dezenas de condomínios de uma vez. O sistema gerará automaticamente links
          exclusivos e QR Codes para cada um.
        </p>

        {errorMessage && (
          <div className="mb-4 bg-rose-50 border border-rose-300 text-rose-900 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={handleConfirmImport}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition ml-3 shrink-0"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {step === 'input' ? (
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* File Upload Box */}
            <div className="border-2 border-dashed border-slate-200 hover:border-teal-600 rounded-xl p-5 text-center bg-slate-50/70 transition">
              <Upload size={24} className="mx-auto text-teal-700 mb-2" />
              <div className="text-xs font-bold text-slate-800">
                Selecione um arquivo CSV / TXT ou arraste para cá
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Colunas esperadas: Condomínio ; Síndico ; Zelador ; WhatsApp
              </p>
              <label className="inline-block mt-3 px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition shadow-2xs">
                <span>Escolher Arquivo</span>
                <input
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Paste Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Ou Cole Diretamente os Dados (Excel / Planilha):
                </label>
                <button
                  type="button"
                  onClick={() => setInputText(sampleCsv)}
                  className="text-xs text-teal-700 hover:text-teal-900 font-semibold underline"
                >
                  Inserir Exemplo
                </button>
              </div>
              <textarea
                rows={8}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Condomínio;Síndico;Zelador;WhatsApp (um por linha)"
                className="w-full bg-white border border-slate-300 rounded-xl p-3 font-mono text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
              />
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleParse}
                className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold transition flex items-center gap-1.5 shadow-md shadow-teal-700/20"
              >
                <span>Avançar para Pré-Visualização</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Summary Bar */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between mb-4 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Total a importar: </span>
                <span className="font-bold text-slate-900">{parsedRows.length} convidados</span>
              </div>
              {duplicateCount > 0 && (
                <div className="text-amber-700 font-semibold flex items-center gap-1">
                  <AlertTriangle size={14} />
                  <span>{duplicateCount} possível(is) duplicidade(s)</span>
                </div>
              )}
            </div>

            {/* Table Preview */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 sticky top-0 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Condomínio</th>
                    <th className="py-2.5 px-3">Síndico</th>
                    <th className="py-2.5 px-3">Zelador</th>
                    <th className="py-2.5 px-3">WhatsApp</th>
                    <th className="py-2.5 px-3">Aviso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} className={row.isDuplicate ? 'bg-amber-50/50' : 'hover:bg-slate-50/50'}>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{row.condoName}</td>
                      <td className="py-2.5 px-3 text-slate-700">{row.managerName}</td>
                      <td className="py-2.5 px-3 text-slate-500">{row.janitorName || '—'}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{row.whatsapp}</td>
                      <td className="py-2.5 px-3">
                        {row.isDuplicate ? (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                            Possível Duplicidade
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
              >
                Voltar e Editar
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={importing}
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-teal-700/20"
                >
                  <CheckCircle2 size={16} />
                  <span>
                    {importing
                      ? 'Importando e gerando links...'
                      : `Confirmar e Importar ${parsedRows.length} Convites`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
