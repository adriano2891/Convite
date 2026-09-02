import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  Users,
  QrCode,
  Building2,
  User,
  Clock,
  RotateCcw,
  Sparkles,
  Camera
} from 'lucide-react';
import { Invitation, CondoEvent } from '../types';
import { formatDateTimeBR, formatDateBR } from '../lib/utils';
import { toggleCheckin } from '../lib/api';

interface Props {
  event: CondoEvent;
  invitations: Invitation[];
  onUpdateInvitation: (updated: Invitation) => void;
}

export const CheckInView: React.FC<Props> = ({
  event,
  invitations,
  onUpdateInvitation
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'checked_in' | 'pending'>('all');
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lastCheckinName, setLastCheckinName] = useState<string | null>(null);

  // Metrics
  const confirmedList = useMemo(
    () => invitations.filter((i) => i.status === 'confirmed' || i.status === 'checked_in'),
    [invitations]
  );
  const checkedInList = useMemo(
    () => invitations.filter((i) => i.status === 'checked_in'),
    [invitations]
  );

  const totalConfirmedParticipants = useMemo(
    () => confirmedList.reduce((acc, curr) => acc + (curr.participantCount || 1), 0),
    [confirmedList]
  );

  const totalCheckedInParticipants = useMemo(
    () => checkedInList.reduce((acc, curr) => acc + (curr.participantCount || 1), 0),
    [checkedInList]
  );

  const filteredGuests = useMemo(() => {
    return invitations
      .filter((inv) => {
        if (filter === 'checked_in') return inv.status === 'checked_in';
        if (filter === 'pending') return inv.status === 'confirmed';
        return true;
      })
      .filter((inv) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          inv.condoName.toLowerCase().includes(q) ||
          inv.managerName.toLowerCase().includes(q) ||
          (inv.janitorName && inv.janitorName.toLowerCase().includes(q)) ||
          inv.code.toLowerCase().includes(q) ||
          inv.whatsapp.includes(q)
        );
      });
  }, [invitations, filter, search]);

  const handleToggle = async (inv: Invitation) => {
    try {
      const updated = await toggleCheckin(inv.id);
      onUpdateInvitation(updated);
      if (updated.status === 'checked_in') {
        setLastCheckinName(`${updated.condoName} (${updated.managerName})`);
        setTimeout(() => setLastCheckinName(null), 4000);
      }
    } catch (err) {
      alert('Erro ao alterar status de check-in');
    }
  };

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const found = invitations.find(
      (i) => i.code.toUpperCase() === manualCode.trim().toUpperCase()
    );
    if (!found) {
      alert(`Código "${manualCode}" não encontrado para este evento.`);
      return;
    }
    handleToggle(found);
    setManualCode('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Large Live Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Total de Confirmados
          </div>
          <div className="text-3xl font-black text-emerald-600">
            {confirmedList.length}{' '}
            <span className="text-sm font-medium text-slate-500">
              ({totalConfirmedParticipants} pessoas)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Convites com presença confirmada para o evento
          </div>
        </div>

        <div className="bg-white border border-teal-200 rounded-2xl p-5 shadow-xs relative overflow-hidden bg-gradient-to-br from-teal-50/50 to-white">
          <div className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-1">
            Check-ins Realizados
          </div>
          <div className="text-3xl font-black text-teal-700">
            {checkedInList.length}{' '}
            <span className="text-sm font-medium text-slate-500">
              ({totalCheckedInParticipants} presentes)
            </span>
          </div>
          <div className="text-[11px] text-slate-600 mt-1">
            {confirmedList.length > 0
              ? `${Math.round((checkedInList.length / confirmedList.length) * 100)}% dos confirmados presentes`
              : '0%'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Ainda Faltam Chegar
          </div>
          <div className="text-3xl font-black text-amber-600">
            {Math.max(0, confirmedList.length - checkedInList.length)}{' '}
            <span className="text-sm font-medium text-slate-500">condomínios</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Aguardando chegada e validação na portaria
          </div>
        </div>
      </div>

      {/* Success alert on checkin */}
      {lastCheckinName && (
        <div className="bg-teal-50 border border-teal-300 rounded-xl p-4 text-teal-900 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shadow-xs">
          <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="font-bold text-slate-900 block">Check-in Realizado com Sucesso!</span>
            <span className="text-xs text-teal-800">{lastCheckinName} teve entrada liberada.</span>
          </div>
        </div>
      )}

      {/* Quick Code Input & Scanner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-4 shadow-xs">
        <form onSubmit={handleManualCodeSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <QrCode size={18} />
            </div>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="Digitar código do convite (Ex: PARK01)"
              className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 uppercase transition"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-xl transition shadow-md shadow-teal-700/20 shrink-0"
          >
            Check-in Rápido
          </button>
        </form>
      </div>

      {/* Filters & Search Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 w-full sm:w-auto shadow-2xs">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === 'all'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({invitations.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === 'pending'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Aguardando ({confirmedList.length - checkedInList.length})
            </button>
            <button
              onClick={() => setFilter('checked_in')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === 'checked_in'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-teal-800'
              }`}
            >
              Check-in Feito ({checkedInList.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={15} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar convidado..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
            />
          </div>
        </div>

        {/* Guests List */}
        <div className="divide-y divide-slate-100">
          {filteredGuests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              Nenhum participante encontrado com os filtros atuais.
            </div>
          ) : (
            filteredGuests.map((inv) => {
              const isCheckedIn = inv.status === 'checked_in';
              const isConfirmed = inv.status === 'confirmed';

              return (
                <div
                  key={inv.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    isCheckedIn ? 'bg-teal-50/40' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isCheckedIn
                          ? 'bg-teal-100 text-teal-800 border border-teal-300'
                          : isConfirmed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {isCheckedIn ? <CheckCircle2 size={20} /> : <Users size={20} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{inv.condoName}</span>
                        <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded">
                          {inv.code}
                        </span>
                        {isCheckedIn && (
                          <span className="text-[10px] font-bold bg-teal-100 text-teal-900 px-2 py-0.5 rounded border border-teal-300">
                            Check-in às {formatDateTimeBR(inv.checkedInAt).split(' ')[1] || '—'}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                        <span>
                          Síndico: <strong className="text-slate-900">{inv.managerName}</strong>
                        </span>
                        {inv.janitorName && (
                          <span>
                            Zelador: <strong className="text-slate-900">{inv.janitorName}</strong>
                          </span>
                        )}
                        <span className="text-slate-500">
                          {inv.participantCount}{' '}
                          {inv.participantCount === 1 ? 'participante' : 'participantes'} (
                          {inv.attendeeRole === 'both'
                            ? 'Síndico + Zelador'
                            : inv.attendeeRole === 'janitor'
                            ? 'Zelador'
                            : 'Síndico'}
                          )
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleToggle(inv)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs ${
                        isCheckedIn
                          ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                          : 'bg-teal-700 hover:bg-teal-800 text-white shadow-md shadow-teal-700/20'
                      }`}
                    >
                      {isCheckedIn ? (
                        <>
                          <RotateCcw size={14} />
                          <span>Desfazer Check-in</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} />
                          <span>Realizar Check-in</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
