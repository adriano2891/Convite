import React, { useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  CheckCircle2,
  XCircle,
  Eye,
  Users,
  Building2,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { Invitation, CondoEvent } from '../types';
import { formatDateBR, formatDateTimeBR } from '../lib/utils';

interface Props {
  event: CondoEvent;
  invitations: Invitation[];
}

export const ReportsView: React.FC<Props> = ({ event, invitations }) => {
  const total = invitations.length;
  const viewedCount = invitations.filter((i) => i.viewCount > 0).length;
  const confirmedCount = invitations.filter(
    (i) => i.status === 'confirmed' || i.status === 'checked_in'
  ).length;
  const declinedCount = invitations.filter((i) => i.status === 'declined').length;
  const pendingCount = total - (confirmedCount + declinedCount);

  const totalParticipants = invitations
    .filter((i) => i.status === 'confirmed' || i.status === 'checked_in')
    .reduce((acc, curr) => acc + (curr.participantCount || 1), 0);

  const viewRate = total > 0 ? Math.round((viewedCount / total) * 100) : 0;
  const confirmRate = total > 0 ? Math.round((confirmedCount / total) * 100) : 0;
  const declineRate = total > 0 ? Math.round((declinedCount / total) * 100) : 0;

  // Breakdown of roles
  const bothCount = invitations.filter(
    (i) =>
      (i.status === 'confirmed' || i.status === 'checked_in') && i.attendeeRole === 'both'
  ).length;
  const managerOnlyCount = invitations.filter(
    (i) =>
      (i.status === 'confirmed' || i.status === 'checked_in') && i.attendeeRole === 'manager'
  ).length;
  const janitorOnlyCount = invitations.filter(
    (i) =>
      (i.status === 'confirmed' || i.status === 'checked_in') && i.attendeeRole === 'janitor'
  ).length;

  // Group confirmations by date
  const confirmationsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    invitations.forEach((inv) => {
      if (inv.confirmedAt) {
        const dateKey = inv.confirmedAt.split('T')[0];
        map[dateKey] = (map[dateKey] || 0) + (inv.participantCount || 1);
      }
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [invitations]);

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'Código',
      'Condomínio',
      'Síndico',
      'Zelador',
      'WhatsApp',
      'Participantes',
      'Quem Participará',
      'Status',
      'Visualizações',
      'Primeira Visualização',
      'Data Confirmação',
      'Check-in',
      'Observações Internas'
    ];

    const rows = invitations.map((inv) => [
      inv.code,
      `"${inv.condoName.replace(/"/g, '""')}"`,
      `"${inv.managerName.replace(/"/g, '""')}"`,
      `"${(inv.janitorName || '').replace(/"/g, '""')}"`,
      inv.whatsapp,
      inv.participantCount || 0,
      inv.attendeeRole,
      inv.status,
      inv.viewCount,
      inv.firstViewedAt ? formatDateTimeBR(inv.firstViewedAt) : '',
      inv.confirmedAt ? formatDateTimeBR(inv.confirmedAt) : '',
      inv.checkedInAt ? formatDateTimeBR(inv.checkedInAt) : '',
      `"${(inv.internalNotes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Relatorio_Convites_${event.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="text-teal-700" size={22} />
            Relatórios & Análise de Presença
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Estatísticas consolidadas e métricas de engajamento do evento em tempo real
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-teal-700/20"
          >
            <FileSpreadsheet size={15} />
            <span>Exportar CSV / Excel</span>
          </button>
          <button
            onClick={handlePrintPdf}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
          >
            <Printer size={15} />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Rates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taxa de Abertura</span>
            <span className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <Eye size={18} />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">{viewRate}%</div>
          <div className="text-xs text-slate-500 mt-1">
            {viewedCount} de {total} convites abertos
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Taxa de Confirmação
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-600">{confirmRate}%</div>
          <div className="text-xs text-slate-500 mt-1">
            {confirmedCount} condomínios confirmados
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taxa de Recusa</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              <XCircle size={18} />
            </span>
          </div>
          <div className="text-3xl font-black text-rose-600">{declineRate}%</div>
          <div className="text-xs text-slate-500 mt-1">{declinedCount} convidados não poderão ir</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Participantes
            </span>
            <span className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
              <Users size={18} />
            </span>
          </div>
          <div className="text-3xl font-black text-teal-800">{totalParticipants}</div>
          <div className="text-xs text-slate-500 mt-1">
            Capacidade máx: {event.maxParticipants} pessoas
          </div>
        </div>
      </div>

      {/* Role Breakdown & Evolution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users size={16} className="text-teal-700" />
            Composição dos Participantes Confirmados
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span className="font-semibold">Síndico + Zelador (Ambos - 2 pessoas)</span>
                <span className="font-bold text-slate-900">
                  {bothCount} condomínios ({bothCount * 2} participantes)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-teal-700 h-full rounded-full"
                  style={{
                    width: `${confirmedCount > 0 ? (bothCount / confirmedCount) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span className="font-semibold">Apenas Síndico(a) (1 pessoa)</span>
                <span className="font-bold text-slate-900">
                  {managerOnlyCount} condomínios ({managerOnlyCount} participantes)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{
                    width: `${
                      confirmedCount > 0 ? (managerOnlyCount / confirmedCount) * 100 : 0
                    }%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span className="font-semibold">Apenas Zelador (1 pessoa)</span>
                <span className="font-bold text-slate-900">
                  {janitorOnlyCount} condomínios ({janitorOnlyCount} participantes)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-sky-600 h-full rounded-full"
                  style={{
                    width: `${
                      confirmedCount > 0 ? (janitorOnlyCount / confirmedCount) * 100 : 0
                    }%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Evolution Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-teal-700" />
            Evolução de Confirmações por Dia
          </h3>

          {confirmationsByDate.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-xs italic">
              Nenhuma confirmação registrada com data até o momento.
            </div>
          ) : (
            <div className="space-y-3">
              {confirmationsByDate.map(([date, count]) => (
                <div key={date} className="flex items-center gap-3 text-xs">
                  <span className="w-24 text-slate-600 font-mono font-bold">{formatDateBR(date)}</span>
                  <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="bg-teal-700 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (count / (totalParticipants || 1)) * 100)}%`
                      }}
                    />
                  </div>
                  <span className="font-bold text-slate-900 w-16 text-right">
                    +{count} {count === 1 ? 'vaga' : 'vagas'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
