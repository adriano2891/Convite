import { CondoEvent, Invitation, NotificationItem } from '../types';

export const API_BASE = '/api';

export async function fetchEvents(): Promise<CondoEvent[]> {
  const res = await fetch(`${API_BASE}/events`);
  if (!res.ok) throw new Error('Falha ao carregar eventos');
  return res.json();
}

export async function createEvent(data: Partial<CondoEvent>): Promise<CondoEvent> {
  const res = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Falha ao criar evento');
  }
  return res.json();
}

export async function updateEvent(id: string, data: Partial<CondoEvent>): Promise<CondoEvent> {
  const res = await fetch(`${API_BASE}/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Falha ao atualizar evento');
  return res.json();
}

export async function deleteEvent(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao excluir evento');
}

export async function fetchInvitations(eventId: string): Promise<Invitation[]> {
  const res = await fetch(`${API_BASE}/events/${eventId}/invitations`);
  if (!res.ok) throw new Error('Falha ao carregar convites');
  return res.json();
}

export async function checkDuplicate(
  eventId: string,
  params: { condoName?: string; managerName?: string; whatsapp?: string; excludeId?: string }
): Promise<{ hasDuplicate: boolean; duplicates: Invitation[] }> {
  const res = await fetch(`${API_BASE}/events/${eventId}/check-duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) return { hasDuplicate: false, duplicates: [] };
  return res.json();
}

export async function createInvitation(
  eventId: string,
  data: {
    condoName: string;
    managerName: string;
    janitorName?: string;
    whatsapp: string;
    internalNotes?: string;
    customShareImageUrl?: string;
  }
): Promise<Invitation> {
  const res = await fetch(`${API_BASE}/events/${eventId}/invitations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Falha ao criar convite');
  }
  return res.json();
}

export async function batchImportInvitations(
  eventId: string,
  items: Array<{
    condoName: string;
    managerName: string;
    janitorName?: string;
    whatsapp: string;
    internalNotes?: string;
  }>
): Promise<{ success: boolean; importedCount: number; invitations: Invitation[] }> {
  const res = await fetch(`${API_BASE}/events/${eventId}/invitations/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Falha ao importar convidados');
  }
  return res.json();
}

export async function getActiveEventPublic(): Promise<{
  event: CondoEvent;
  confirmedParticipants: number;
  availableSlots: number;
}> {
  const res = await fetch(`${API_BASE}/events/active/public`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Nenhum evento ativo disponível');
  }
  return res.json();
}

export async function registerPublicInvitation(
  eventId: string,
  data: {
    condoName: string;
    managerName: string;
    janitorName?: string;
    whatsapp: string;
    attendeeRole: 'manager' | 'janitor' | 'both';
    internalNotes?: string;
  }
): Promise<{ success: boolean; invitation: Invitation; event: CondoEvent; isExisting?: boolean }> {
  const res = await fetch(`${API_BASE}/events/${eventId}/public-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Falha ao registrar confirmação');
  }
  return res.json();
}

export async function getInvitationByCode(
  code: string
): Promise<{ invitation: Invitation; event: CondoEvent }> {
  const res = await fetch(`${API_BASE}/invitations/by-code/${code}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Convite não encontrado');
  }
  return res.json();
}

export async function submitRsvp(
  code: string,
  data: {
    action: 'confirm' | 'decline';
    attendeeRole: 'manager' | 'janitor' | 'both' | 'none';
    condoName?: string;
    managerName?: string;
    janitorName?: string;
    whatsapp?: string;
  }
): Promise<{ success: boolean; invitation: Invitation; event: CondoEvent }> {
  const res = await fetch(`${API_BASE}/invitations/by-code/${code}/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Falha ao enviar resposta');
  }
  return res.json();
}

export async function updateInvitation(id: string, data: Partial<Invitation>): Promise<Invitation> {
  const res = await fetch(`${API_BASE}/invitations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Falha ao atualizar convite');
  return res.json();
}

export async function toggleCheckin(id: string): Promise<Invitation> {
  const res = await fetch(`${API_BASE}/invitations/${id}/checkin`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Falha ao processar check-in');
  return res.json();
}

export async function logWhatsAppOpened(id: string, templateType: string): Promise<void> {
  await fetch(`${API_BASE}/invitations/${id}/log-whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateType })
  });
}

export async function deleteInvitation(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/invitations/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao excluir convite');
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await fetch(`${API_BASE}/notifications`);
  if (!res.ok) return [];
  return res.json();
}

export async function markNotificationRead(id: string): Promise<void> {
  await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await fetch(`${API_BASE}/notifications/mark-all-read`, { method: 'POST' });
}

export async function clearAllNotifications(): Promise<void> {
  await fetch(`${API_BASE}/notifications/clear`, { method: 'POST' });
}

export async function loginAdmin(pin: string): Promise<{ success: boolean; token: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Senha incorreta');
  }
  return res.json();
}

export async function changeAdminPassword(
  currentPin: string,
  newPin: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPin, newPin })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Falha ao alterar senha');
  }
  return res.json();
}
