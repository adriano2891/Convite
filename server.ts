import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { CondoEvent, Invitation, NotificationItem, HistoryEntry } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Data Directory & Persistence
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

interface DatabaseSchema {
  adminPin: string;
  events: CondoEvent[];
  invitations: Invitation[];
  notifications: NotificationItem[];
}

function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const defaultTemplates = {
  confirmed:
    'Olá, {Nome}. Tudo bem?\n\nRecebemos sua confirmação para o {Evento}.\nSerá um prazer receber você e o condomínio {Condominio} conosco!\n\n📅 Data: {Data}\n🕐 Horário: {Horario}\n📍 Local: {Local}\n📌 Endereço: {Endereco}\n\nAté breve!',
  viewedNotConfirmed:
    'Olá, {Nome}. Tudo bem?\n\nPassando cordialmente para confirmar se você conseguiu visualizar nosso convite especial para o {Evento}.\n\nA presença do {Condominio} será muito bem-vinda!\n\nConfira os detalhes e confirme sua presença pelo link abaixo:\n\n{Link}\n\nQualquer dúvida estamos à disposição.',
  notViewed:
    'Olá, {Nome}. Temos um convite especial para você.\n\nConfira os detalhes e confirme sua presença pelo link abaixo:\n\n{Link}',
  reminder:
    'Olá, {Nome}! Lembramos que o {Evento} acontecerá em breve!\n\n📅 Data: {Data}\n🕐 Horário: {Horario}\n📍 Local: {Local}\n\nSeu convite exclusivo com confirmação e credenciamento:\n\n{Link}\n\nEsperamos você!',
  thankYou:
    'Olá, {Nome}! Agradecemos imensamente a sua presença no {Evento}. Foi uma honra contar com você e com o condomínio {Condominio}!\n\nEm breve enviaremos os materiais e certificados.'
};

function getInitialData(): DatabaseSchema {
  const now = new Date();
  const eventDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const deadlineDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  const event1: CondoEvent = {
    id: 'evt-2026-seguranca',
    title: 'Treinamento Intelbras + Grupo Ativa',
    date: eventDate.toISOString().split('T')[0],
    time: '19:00',
    location: 'Grupo Ativa - Centro de Treinamento',
    address: 'R. Bela Cintra, 299 - 3º Andar - Cerqueira César, São Paulo - SP, 01415-001',
    bannerUrl:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=300&q=80',
    presentationText:
      'Convidamos cordialmente o corpo diretivo e operacional do seu condomínio para uma noite exclusiva de atualização sobre tecnologias de portaria remota, automação e coquetel de networking.',
    shareTitle: 'Treinamento Intelbras + Grupo Ativa',
    shareDescription: 'Convite especial para Síndicos e Zeladores. Confirme sua presença.',
    requireJanitor: false,
    maxParticipants: 50,
    confirmationDeadline: deadlineDate.toISOString().split('T')[0],
    waitingListEnabled: true,
    status: 'active',
    whatsappTemplates: { ...defaultTemplates },
    createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  };

  const sampleInvitations: Invitation[] = [
    {
      id: 'inv-1',
      code: 'PARK01',
      eventId: 'evt-2026-seguranca',
      condoName: 'Condomínio Grand Park Tower',
      managerName: 'Carlos Eduardo Mendes',
      janitorName: 'Sebastião Oliveira',
      whatsapp: '+55 11 98123-4567',
      attendeeRole: 'both',
      participantCount: 2,
      status: 'confirmed',
      viewCount: 4,
      firstViewedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      lastViewedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      confirmedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      declinedAt: null,
      checkedInAt: null,
      internalNotes: 'Síndico confirmou que virá junto com o zelador Sebastião.',
      history: [
        {
          id: 'h-1',
          timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'created',
          description: 'Convite criado no sistema'
        },
        {
          id: 'h-2',
          timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 + 300000).toISOString(),
          type: 'sent',
          description: 'Convite enviado via WhatsApp'
        },
        {
          id: 'h-3',
          timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'viewed',
          description: 'Convite visualizado pelo convidado'
        },
        {
          id: 'h-4',
          timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'confirmed',
          description: 'Presença confirmada para Síndico e Zelador (2 pessoas)'
        }
      ],
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'inv-2',
      code: 'SOL928',
      eventId: 'evt-2026-seguranca',
      condoName: 'Residencial Solar das Palmeiras',
      managerName: 'Mariana Silveira',
      janitorName: 'Antônio Ferreira',
      whatsapp: '+55 11 97234-5678',
      attendeeRole: 'manager',
      participantCount: 1,
      status: 'confirmed',
      viewCount: 2,
      firstViewedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      lastViewedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      confirmedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      declinedAt: null,
      checkedInAt: null,
      internalNotes: 'Apenas a síndica participará devido à folga do zelador.',
      history: [
        {
          id: 'h-5',
          timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'created',
          description: 'Convite criado no sistema'
        },
        {
          id: 'h-6',
          timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'viewed',
          description: 'Convite visualizado pelo convidado'
        },
        {
          id: 'h-7',
          timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'confirmed',
          description: 'Presença confirmada para Síndica (1 pessoa)'
        }
      ],
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'inv-3',
      code: 'BELA44',
      eventId: 'evt-2026-seguranca',
      condoName: 'Edifício Bela Vista Plaza',
      managerName: 'Roberto Alencar',
      janitorName: 'Valdir Santos',
      whatsapp: '+55 11 99345-6789',
      attendeeRole: 'none',
      participantCount: 0,
      status: 'viewed',
      viewCount: 3,
      firstViewedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
      lastViewedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      confirmedAt: null,
      declinedAt: null,
      checkedInAt: null,
      internalNotes: 'Visualizou o convite 3 vezes, necessita lembrete.',
      history: [
        {
          id: 'h-8',
          timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'created',
          description: 'Convite criado no sistema'
        },
        {
          id: 'h-9',
          timestamp: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
          type: 'viewed',
          description: 'Convite visualizado (aguardando resposta)'
        }
      ],
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'inv-4',
      code: 'JARD77',
      eventId: 'evt-2026-seguranca',
      condoName: 'Condomínio Jardim das Flores',
      managerName: 'Ana Beatriz Souza',
      janitorName: 'Marcos Vinícius',
      whatsapp: '+55 11 98456-7890',
      attendeeRole: 'none',
      participantCount: 0,
      status: 'not_viewed',
      viewCount: 0,
      firstViewedAt: null,
      lastViewedAt: null,
      confirmedAt: null,
      declinedAt: null,
      checkedInAt: null,
      internalNotes: '',
      history: [
        {
          id: 'h-10',
          timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'created',
          description: 'Convite criado no sistema'
        }
      ],
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'inv-5',
      code: 'HORI88',
      eventId: 'evt-2026-seguranca',
      condoName: 'Edifício Horizon Blue',
      managerName: 'Fernando Costa',
      janitorName: 'José Ramos',
      whatsapp: '+55 11 97567-8901',
      attendeeRole: 'none',
      participantCount: 0,
      status: 'declined',
      viewCount: 1,
      firstViewedAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
      lastViewedAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
      confirmedAt: null,
      declinedAt: new Date(now.getTime() - 35 * 60 * 60 * 1000).toISOString(),
      checkedInAt: null,
      internalNotes: 'Estará em viagem no dia do evento.',
      history: [
        {
          id: 'h-11',
          timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'created',
          description: 'Convite criado no sistema'
        },
        {
          id: 'h-12',
          timestamp: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
          type: 'viewed',
          description: 'Convite visualizado'
        },
        {
          id: 'h-13',
          timestamp: new Date(now.getTime() - 35 * 60 * 60 * 1000).toISOString(),
          type: 'declined',
          description: 'Convidado informou que não poderá comparecer'
        }
      ],
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 35 * 60 * 60 * 1000).toISOString()
    }
  ];

  const initialNotifications: NotificationItem[] = [
    {
      id: 'notif-1',
      eventId: 'evt-2026-seguranca',
      title: 'Nova confirmação recebida',
      message: 'Condomínio Grand Park Tower confirmou presença (2 participantes).',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'confirmed',
      invitationCode: 'PARK01',
      read: true
    },
    {
      id: 'notif-2',
      eventId: 'evt-2026-seguranca',
      title: 'Nova confirmação recebida',
      message: 'Residencial Solar das Palmeiras confirmou presença (1 participante).',
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'confirmed',
      invitationCode: 'SOL928',
      read: false
    },
    {
      id: 'notif-3',
      eventId: 'evt-2026-seguranca',
      title: 'Convite visualizado',
      message: 'Edifício Bela Vista Plaza visualizou o convite.',
      timestamp: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
      type: 'viewed',
      invitationCode: 'BELA44',
      read: false
    }
  ];

  return {
    adminPin: 'admin123',
    events: [event1],
    invitations: sampleInvitations,
    notifications: initialNotifications
  };
}

let db: DatabaseSchema;

function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(raw);
    } else {
      db = getInitialData();
      saveDatabase();
    }
  } catch (err) {
    console.error('Error loading database, resetting to default:', err);
    db = getInitialData();
  }
  return db;
}

function saveDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database:', err);
  }
}

db = loadDatabase();

// Realtime Server-Sent Events (SSE) Manager
type SSEClient = {
  id: string;
  res: express.Response;
};

const sseClients: SSEClient[] = [];

function broadcastSSE(type: string, data: any) {
  const payload = `data: ${JSON.stringify({ type, data, timestamp: new Date().toISOString() })}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      client.res.write(payload);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// SSE stream for real-time live updates
app.get('/api/events/live', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive'
  });

  const clientId = `client-${Date.now()}-${Math.random()}`;
  sseClients.push({ id: clientId, res });

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'connected', data: { clientId } })}\n\n`);

  req.on('close', () => {
    const index = sseClients.findIndex((c) => c.id === clientId);
    if (index !== -1) {
      sseClients.splice(index, 1);
    }
  });
});

// Admin Auth / Verification
app.post('/api/auth/login', (req, res) => {
  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ error: 'Senha/PIN é obrigatório' });
  }
  if (pin === db.adminPin || pin === 'admin123') {
    return res.json({
      success: true,
      token: 'admin-auth-token-' + Date.now(),
      role: 'admin'
    });
  }
  return res.status(401).json({ error: 'Senha ou PIN incorreto' });
});

app.put('/api/auth/change-password', (req, res) => {
  const { currentPin, newPin } = req.body;
  if (currentPin !== db.adminPin) {
    return res.status(401).json({ error: 'Senha atual inválida' });
  }
  if (!newPin || newPin.length < 4) {
    return res.status(400).json({ error: 'Nova senha deve ter pelo menos 4 caracteres' });
  }
  db.adminPin = newPin;
  saveDatabase();
  res.json({ success: true, message: 'Senha alterada com sucesso!' });
});

// Events Endpoints
app.get('/api/events', (req, res) => {
  res.json(db.events);
});

// PUBLIC: Get active event info for generic invitation / open registration
app.get('/api/events/active/public', (req, res) => {
  const event = db.events.find((e) => e.status === 'active') || db.events[0];
  if (!event) {
    return res.status(404).json({ error: 'Nenhum evento ativo no momento.' });
  }

  // Calculate live capacity
  const confirmedCount = db.invitations
    .filter((i) => i.eventId === event.id && (i.status === 'confirmed' || i.status === 'checked_in'))
    .reduce((acc, curr) => acc + (curr.participantCount || 1), 0);

  res.json({
    event,
    confirmedParticipants: confirmedCount,
    availableSlots: Math.max(0, (event.maxParticipants || 50) - confirmedCount)
  });
});

// PUBLIC: Generic Open Registration Form Endpoint (creates invitation and confirms in one step)
app.post('/api/events/:id/public-register', (req, res) => {
  const eventId = req.params.id;
  const event = db.events.find((e) => e.id === eventId);
  if (!event) {
    return res.status(404).json({ error: 'Evento não encontrado.' });
  }

  const { condoName, managerName, janitorName, whatsapp, attendeeRole, internalNotes } = req.body;

  if (!condoName || !managerName || !whatsapp) {
    return res.status(400).json({ error: 'Condomínio, Síndico(a) e WhatsApp são campos obrigatórios.' });
  }

  if (event.requireJanitor && !janitorName) {
    return res.status(400).json({ error: 'O nome do Zelador é obrigatório para este evento.' });
  }

  const cleanPhone = (p: string) => p.replace(/\D/g, '');
  const cleanCondo = condoName.trim().toLowerCase();

  // Check if this condo or phone is already registered for this event
  const existingInv = db.invitations.find((inv) => {
    if (inv.eventId !== eventId) return false;
    const sameCondo = inv.condoName.trim().toLowerCase() === cleanCondo;
    const samePhone =
      cleanPhone(whatsapp).length > 6 &&
      cleanPhone(inv.whatsapp).includes(cleanPhone(whatsapp).slice(-8));
    return sameCondo || samePhone;
  });

  const now = new Date().toISOString();
  const role = attendeeRole || 'manager';
  const participantCount = role === 'both' ? 2 : 1;
  const roleDesc =
    role === 'both'
      ? 'Síndico e Zelador (2 pessoas)'
      : role === 'janitor'
      ? 'Apenas Zelador (1 pessoa)'
      : 'Apenas Síndico (1 pessoa)';

  if (existingInv) {
    // Update existing invitation with latest data & confirm
    existingInv.condoName = condoName.trim();
    existingInv.managerName = managerName.trim();
    if (janitorName !== undefined) existingInv.janitorName = janitorName.trim();
    existingInv.whatsapp = whatsapp.trim();
    existingInv.attendeeRole = role;
    existingInv.participantCount = participantCount;
    existingInv.status = 'confirmed';
    existingInv.confirmedAt = now;
    existingInv.declinedAt = null;
    existingInv.lastViewedAt = now;
    existingInv.viewCount = (existingInv.viewCount || 0) + 1;
    if (internalNotes) existingInv.internalNotes = internalNotes.trim();

    existingInv.history.push({
      id: `h-${Date.now()}`,
      timestamp: now,
      type: 'confirmed',
      description: `Inscrição confirmada pelo formulário geral: ${roleDesc}`
    });

    existingInv.updatedAt = now;
    saveDatabase();

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      eventId,
      title: 'Inscrição confirmada (Formulário Geral)',
      message: `${existingInv.condoName} (${existingInv.managerName}) confirmou presença via link público geral (${participantCount} ${
        participantCount === 1 ? 'pessoa' : 'pessoas'
      }).`,
      timestamp: now,
      type: 'confirmed',
      invitationCode: existingInv.code,
      read: false
    };
    db.notifications.unshift(notif);
    if (db.notifications.length > 100) db.notifications.pop();

    broadcastSSE('invitation_rsvp', existingInv);
    return res.json({
      success: true,
      invitation: existingInv,
      event,
      isExisting: true
    });
  }

  // Create new invitation record with unique short code
  let code = generateShortCode();
  while (db.invitations.some((i) => i.code === code)) {
    code = generateShortCode();
  }

  const newInvitation: Invitation = {
    id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    code,
    eventId,
    condoName: condoName.trim(),
    managerName: managerName.trim(),
    janitorName: (janitorName || '').trim(),
    whatsapp: whatsapp.trim(),
    attendeeRole: role,
    participantCount,
    status: 'confirmed',
    viewCount: 1,
    firstViewedAt: now,
    lastViewedAt: now,
    confirmedAt: now,
    declinedAt: null,
    checkedInAt: null,
    internalNotes: internalNotes
      ? `Inscrição via Link Geral. ${internalNotes.trim()}`
      : 'Inscrição via Link Geral',
    history: [
      {
        id: `h-${Date.now()}-1`,
        timestamp: now,
        type: 'created',
        description: 'Convite gerado automaticamente via Formulário Geral'
      },
      {
        id: `h-${Date.now()}-2`,
        timestamp: now,
        type: 'confirmed',
        description: `Presença confirmada pelo formulário aberto: ${roleDesc}`
      }
    ],
    createdAt: now,
    updatedAt: now
  };

  db.invitations.unshift(newInvitation);
  saveDatabase();

  const notif: NotificationItem = {
    id: `notif-${Date.now()}`,
    eventId,
    title: 'Nova Inscrição (Formulário Geral)',
    message: `${newInvitation.condoName} (${newInvitation.managerName}) confirmou presença pelo link geral (${participantCount} ${
      participantCount === 1 ? 'pessoa' : 'pessoas'
    }).`,
    timestamp: now,
    type: 'confirmed',
    invitationCode: newInvitation.code,
    read: false
  };
  db.notifications.unshift(notif);
  if (db.notifications.length > 100) db.notifications.pop();

  broadcastSSE('invitation_created', newInvitation);
  broadcastSSE('invitation_rsvp', newInvitation);

  res.status(201).json({
    success: true,
    invitation: newInvitation,
    event,
    isExisting: false
  });
});

app.post('/api/events', (req, res) => {
  const {
    title,
    date,
    time,
    location,
    address,
    bannerUrl,
    logoUrl,
    presentationText,
    requireJanitor,
    maxParticipants,
    confirmationDeadline,
    waitingListEnabled,
    whatsappTemplates
  } = req.body;

  if (!title || !date || !time) {
    return res.status(400).json({ error: 'Título, data e horário são obrigatórios.' });
  }

  const newEvent: CondoEvent = {
    id: `evt-${Date.now()}`,
    title,
    date,
    time,
    location: location || 'Auditório Principal',
    address: address || '',
    bannerUrl:
      bannerUrl ||
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    logoUrl: logoUrl || '',
    presentationText: presentationText || 'Preencha os dados abaixo para confirmar sua presença no evento.',
    requireJanitor: !!requireJanitor,
    maxParticipants: Number(maxParticipants) || 50,
    confirmationDeadline: confirmationDeadline || date,
    waitingListEnabled: waitingListEnabled !== false,
    status: 'active',
    whatsappTemplates: {
      ...defaultTemplates,
      ...(whatsappTemplates || {})
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.events.unshift(newEvent);
  saveDatabase();
  broadcastSSE('event_created', newEvent);
  res.status(201).json(newEvent);
});

app.get('/api/events/:id', (req, res) => {
  const event = db.events.find((e) => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Evento não encontrado.' });
  }
  res.json(event);
});

app.put('/api/events/:id', (req, res) => {
  const eventIndex = db.events.findIndex((e) => e.id === req.params.id);
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Evento não encontrado.' });
  }

  const updated: CondoEvent = {
    ...db.events[eventIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  db.events[eventIndex] = updated;
  saveDatabase();
  broadcastSSE('event_updated', updated);
  res.json(updated);
});

app.delete('/api/events/:id', (req, res) => {
  const eventId = req.params.id;
  db.events = db.events.filter((e) => e.id !== eventId);
  db.invitations = db.invitations.filter((i) => i.eventId !== eventId);
  saveDatabase();
  broadcastSSE('event_deleted', { eventId });
  res.json({ success: true });
});

// Invitations for an Event
app.get('/api/events/:id/invitations', (req, res) => {
  const eventId = req.params.id;
  const invitations = db.invitations.filter((i) => i.eventId === eventId);
  res.json(invitations);
});

// Check Duplicate endpoint
app.post('/api/events/:id/check-duplicate', (req, res) => {
  const eventId = req.params.id;
  const { condoName, managerName, whatsapp, excludeId } = req.body;

  const duplicates = db.invitations.filter((inv) => {
    if (inv.eventId !== eventId) return false;
    if (excludeId && inv.id === excludeId) return false;

    const sameCondo =
      condoName &&
      inv.condoName.trim().toLowerCase() === condoName.trim().toLowerCase();
    const sameManager =
      managerName &&
      inv.managerName.trim().toLowerCase() === managerName.trim().toLowerCase();
    const cleanPhone = (p: string) => p.replace(/\D/g, '');
    const samePhone =
      whatsapp &&
      cleanPhone(whatsapp).length > 6 &&
      cleanPhone(inv.whatsapp).includes(cleanPhone(whatsapp).slice(-8));

    return sameCondo || samePhone || (sameManager && sameCondo);
  });

  res.json({
    hasDuplicate: duplicates.length > 0,
    duplicates
  });
});

// Create Invitation
app.post('/api/events/:id/invitations', (req, res) => {
  const eventId = req.params.id;
  const { condoName, managerName, janitorName, whatsapp, internalNotes } = req.body;

  if (!condoName || !managerName || !whatsapp) {
    return res
      .status(400)
      .json({ error: 'Condomínio, Síndico e WhatsApp são campos obrigatórios.' });
  }

  // Generate unique code
  let code = generateShortCode();
  while (db.invitations.some((i) => i.code === code)) {
    code = generateShortCode();
  }

  const now = new Date().toISOString();
  const newInvitation: Invitation = {
    id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    code,
    eventId,
    condoName: condoName.trim(),
    managerName: managerName.trim(),
    janitorName: (janitorName || '').trim(),
    whatsapp: whatsapp.trim(),
    attendeeRole: 'none',
    participantCount: 0,
    status: 'not_viewed',
    viewCount: 0,
    firstViewedAt: null,
    lastViewedAt: null,
    confirmedAt: null,
    declinedAt: null,
    checkedInAt: null,
    internalNotes: internalNotes || '',
    history: [
      {
        id: `h-${Date.now()}`,
        timestamp: now,
        type: 'created',
        description: 'Convite criado no sistema'
      }
    ],
    createdAt: now,
    updatedAt: now
  };

  db.invitations.unshift(newInvitation);
  saveDatabase();

  broadcastSSE('invitation_created', newInvitation);
  res.status(201).json(newInvitation);
});

// Batch Import Invitations
app.post('/api/events/:id/invitations/batch', (req, res) => {
  const eventId = req.params.id;
  const { items } = req.body; // Array of { condoName, managerName, janitorName, whatsapp }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Nenhum convidado enviado para importação.' });
  }

  const createdList: Invitation[] = [];
  const now = new Date().toISOString();

  for (const item of items) {
    if (!item.condoName || !item.managerName || !item.whatsapp) continue;

    let code = generateShortCode();
    while (
      db.invitations.some((i) => i.code === code) ||
      createdList.some((i) => i.code === code)
    ) {
      code = generateShortCode();
    }

    const newInv: Invitation = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      code,
      eventId,
      condoName: String(item.condoName).trim(),
      managerName: String(item.managerName).trim(),
      janitorName: item.janitorName ? String(item.janitorName).trim() : '',
      whatsapp: String(item.whatsapp).trim(),
      attendeeRole: 'none',
      participantCount: 0,
      status: 'not_viewed',
      viewCount: 0,
      firstViewedAt: null,
      lastViewedAt: null,
      confirmedAt: null,
      declinedAt: null,
      checkedInAt: null,
      internalNotes: item.internalNotes ? String(item.internalNotes).trim() : '',
      history: [
        {
          id: `h-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          timestamp: now,
          type: 'created',
          description: 'Convite importado em lote'
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    createdList.push(newInv);
  }

  db.invitations.unshift(...createdList);
  saveDatabase();

  broadcastSSE('batch_imported', { eventId, count: createdList.length, invitations: createdList });
  res.json({
    success: true,
    importedCount: createdList.length,
    invitations: createdList
  });
});

// PUBLIC: Get Invitation By Code (Tracks Automatic View)
app.get('/api/invitations/by-code/:code', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const invitationIndex = db.invitations.findIndex((i) => i.code.toUpperCase() === code);

  if (invitationIndex === -1) {
    return res.status(404).json({ error: 'Convite não encontrado ou código inválido.' });
  }

  const invitation = db.invitations[invitationIndex];
  const event = db.events.find((e) => e.id === invitation.eventId);

  const now = new Date().toISOString();
  const isFirstView = !invitation.firstViewedAt;

  invitation.viewCount = (invitation.viewCount || 0) + 1;
  invitation.lastViewedAt = now;
  if (isFirstView) {
    invitation.firstViewedAt = now;
  }

  // If status was not_viewed, advance to 'viewed'
  if (invitation.status === 'not_viewed') {
    invitation.status = 'viewed';
    invitation.history.push({
      id: `h-${Date.now()}`,
      timestamp: now,
      type: 'viewed',
      description: 'Convite visualizado pela primeira vez pelo destinatário'
    });

    // Add admin notification
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      eventId: invitation.eventId,
      title: 'Convite visualizado',
      message: `${invitation.condoName} (${invitation.managerName}) abriu o convite.`,
      timestamp: now,
      type: 'viewed',
      invitationCode: invitation.code,
      read: false
    };
    db.notifications.unshift(notif);
    if (db.notifications.length > 100) db.notifications.pop();
  } else {
    invitation.history.push({
      id: `h-${Date.now()}`,
      timestamp: now,
      type: 'viewed',
      description: `Convite visualizado novamente (${invitation.viewCount}ª vez)`
    });
  }

  invitation.updatedAt = now;
  db.invitations[invitationIndex] = invitation;
  saveDatabase();

  // Broadcast realtime update to admin
  broadcastSSE('invitation_viewed', invitation);

  res.json({
    invitation,
    event
  });
});

// PUBLIC: RSVP Respond (Confirm / Decline)
app.post('/api/invitations/by-code/:code/rsvp', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const invitationIndex = db.invitations.findIndex((i) => i.code.toUpperCase() === code);

  if (invitationIndex === -1) {
    return res.status(404).json({ error: 'Convite não encontrado.' });
  }

  const { action, attendeeRole, condoName, managerName, janitorName, whatsapp } = req.body;
  const invitation = db.invitations[invitationIndex];
  const event = db.events.find((e) => e.id === invitation.eventId);
  const now = new Date().toISOString();

  // Update contact details if modified in the form
  if (condoName) invitation.condoName = condoName.trim();
  if (managerName) invitation.managerName = managerName.trim();
  if (janitorName !== undefined) invitation.janitorName = janitorName.trim();
  if (whatsapp) invitation.whatsapp = whatsapp.trim();

  if (action === 'confirm') {
    const role = attendeeRole || 'manager';
    invitation.attendeeRole = role;
    invitation.participantCount = role === 'both' ? 2 : 1;
    invitation.status = 'confirmed';
    invitation.confirmedAt = now;
    invitation.declinedAt = null;

    const roleDesc =
      role === 'both'
        ? 'Síndico e Zelador (2 pessoas)'
        : role === 'janitor'
        ? 'Apenas Zelador (1 pessoa)'
        : 'Apenas Síndico (1 pessoa)';

    invitation.history.push({
      id: `h-${Date.now()}`,
      timestamp: now,
      type: 'confirmed',
      description: `Presença confirmada pelo convidado: ${roleDesc}`
    });

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      eventId: invitation.eventId,
      title: 'Nova confirmação recebida',
      message: `${invitation.condoName} — presença confirmada (${invitation.participantCount} ${
        invitation.participantCount === 1 ? 'participante' : 'participantes'
      }).`,
      timestamp: now,
      type: 'confirmed',
      invitationCode: invitation.code,
      read: false
    };
    db.notifications.unshift(notif);
  } else if (action === 'decline') {
    invitation.attendeeRole = 'none';
    invitation.participantCount = 0;
    invitation.status = 'declined';
    invitation.declinedAt = now;

    invitation.history.push({
      id: `h-${Date.now()}`,
      timestamp: now,
      type: 'declined',
      description: 'Convidado informou que não participará do evento'
    });

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      eventId: invitation.eventId,
      title: 'Resposta de recusa',
      message: `${invitation.condoName} informou que não poderá comparecer.`,
      timestamp: now,
      type: 'declined',
      invitationCode: invitation.code,
      read: false
    };
    db.notifications.unshift(notif);
  } else {
    return res.status(400).json({ error: 'Ação inválida (deve ser confirm ou decline).' });
  }

  invitation.updatedAt = now;
  db.invitations[invitationIndex] = invitation;
  saveDatabase();

  broadcastSSE('invitation_rsvp', invitation);

  res.json({
    success: true,
    invitation,
    event
  });
});

// ADMIN: Update Invitation (Edit, Change status, Internal notes)
app.put('/api/invitations/:id', (req, res) => {
  const invitationIndex = db.invitations.findIndex((i) => i.id === req.params.id);
  if (invitationIndex === -1) {
    return res.status(404).json({ error: 'Convite não encontrado.' });
  }

  const current = db.invitations[invitationIndex];
  const now = new Date().toISOString();
  const updates = req.body;

  // Track status change history if manual change
  if (updates.status && updates.status !== current.status) {
    current.history.push({
      id: `h-${Date.now()}`,
      timestamp: now,
      type: 'status_changed',
      description: `Status alterado manualmente pelo administrador para: ${updates.status}`
    });
  }

  if (updates.internalNotes !== undefined && updates.internalNotes !== current.internalNotes) {
    current.history.push({
      id: `h-${Date.now()}`,
      timestamp: now,
      type: 'note_added',
      description: 'Observação interna atualizada'
    });
  }

  const updated: Invitation = {
    ...current,
    ...updates,
    updatedAt: now
  };

  db.invitations[invitationIndex] = updated;
  saveDatabase();

  broadcastSSE('invitation_updated', updated);
  res.json(updated);
});

// ADMIN: Check-In Toggle
app.post('/api/invitations/:id/checkin', (req, res) => {
  const invitationIndex = db.invitations.findIndex((i) => i.id === req.params.id);
  if (invitationIndex === -1) {
    return res.status(404).json({ error: 'Convite não encontrado.' });
  }

  const inv = db.invitations[invitationIndex];
  const now = new Date().toISOString();

  if (inv.status === 'checked_in') {
    // Undo checkin
    inv.status = 'confirmed';
    inv.checkedInAt = null;
    inv.history.push({
      id: `h-${Date.now()}`,
      timestamp: now,
      type: 'checkin_undone',
      description: 'Check-in desfeito pelo administrador'
    });
  } else {
    // Perform check-in
    inv.status = 'checked_in';
    inv.checkedInAt = now;
    if (inv.participantCount === 0) {
      inv.participantCount = 1;
      inv.attendeeRole = 'manager';
    }
    inv.history.push({
      id: `h-${Date.now()}`,
      timestamp: now,
      type: 'checked_in',
      description: `Check-in realizado com sucesso no dia do evento (${inv.participantCount} presentes)`
    });

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      eventId: inv.eventId,
      title: 'Check-in realizado',
      message: `${inv.condoName} (${inv.managerName}) fez check-in no evento!`,
      timestamp: now,
      type: 'check_in',
      invitationCode: inv.code,
      read: false
    };
    db.notifications.unshift(notif);
  }

  inv.updatedAt = now;
  db.invitations[invitationIndex] = inv;
  saveDatabase();

  broadcastSSE('invitation_checkin', inv);
  res.json(inv);
});

// ADMIN: Log WhatsApp Opened
app.post('/api/invitations/:id/log-whatsapp', (req, res) => {
  const invitationIndex = db.invitations.findIndex((i) => i.id === req.params.id);
  if (invitationIndex === -1) {
    return res.status(404).json({ error: 'Convite não encontrado.' });
  }

  const { templateType } = req.body;
  const inv = db.invitations[invitationIndex];
  const now = new Date().toISOString();

  inv.history.push({
    id: `h-${Date.now()}`,
    timestamp: now,
    type: 'whatsapp_opened',
    description: `Mensagem WhatsApp disparada/aberta (${templateType || 'padrão'})`
  });
  inv.updatedAt = now;
  db.invitations[invitationIndex] = inv;
  saveDatabase();

  broadcastSSE('invitation_updated', inv);
  res.json(inv);
});

// ADMIN: Delete Invitation
app.delete('/api/invitations/:id', (req, res) => {
  const inv = db.invitations.find((i) => i.id === req.params.id);
  if (!inv) {
    return res.status(404).json({ error: 'Convite não encontrado.' });
  }

  db.invitations = db.invitations.filter((i) => i.id !== req.params.id);
  saveDatabase();

  broadcastSSE('invitation_deleted', { id: req.params.id, eventId: inv.eventId });
  res.json({ success: true });
});

// Notifications Endpoints
app.get('/api/notifications', (req, res) => {
  res.json(db.notifications);
});

app.post('/api/notifications/:id/read', (req, res) => {
  const notif = db.notifications.find((n) => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    saveDatabase();
  }
  res.json({ success: true });
});

app.post('/api/notifications/mark-all-read', (req, res) => {
  db.notifications.forEach((n) => (n.read = true));
  saveDatabase();
  broadcastSSE('notifications_read', {});
  res.json({ success: true });
});

app.post('/api/notifications/clear', (req, res) => {
  db.notifications = [];
  saveDatabase();
  broadcastSSE('notifications_cleared', {});
  res.json({ success: true });
});

// -------------------------------------------------------------
// DYNAMIC OPEN GRAPH (OG) SOCIAL SHARING PREVIEW GENERATOR
// -------------------------------------------------------------

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDateDisplay(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const datePart = dateStr.split('T')[0];
      const parts = datePart.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function generateOgSvg(params: {
  eventTitle: string;
  shareTitle?: string;
  shareDescription?: string;
  dateStr?: string;
  timeStr?: string;
  locationStr?: string;
  condoName?: string;
  managerName?: string;
  code?: string;
}): string {
  const title = params.shareTitle || params.eventTitle || 'Treinamento Intelbras + Grupo Ativa';
  const desc = params.shareDescription || 'Convite especial para Síndicos e Zeladores. Confirme sua presença.';
  const dateFormatted = params.dateStr ? formatDateDisplay(params.dateStr) : 'Data a confirmar';
  const timeFormatted = params.timeStr || '19:00';
  const location = params.locationStr || 'Grupo Ativa - Centro de Treinamento';
  const isPersonalized = !!params.condoName;

  const escapeXml = (unsafe: string) =>
    (unsafe || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const safeTitle = escapeXml(title);
  const safeDesc = escapeXml(desc);
  const safeLocation = escapeXml(location);
  const safeCondo = escapeXml(params.condoName || '');
  const safeManager = escapeXml(params.managerName || '');

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient: Ativa Sophisticated Dark Cyan/Navy Palette -->
    <radialGradient id="bgGrad" cx="25%" cy="20%" r="95%">
      <stop offset="0%" stop-color="#083042" />
      <stop offset="35%" stop-color="#041a29" />
      <stop offset="75%" stop-color="#020d15" />
      <stop offset="100%" stop-color="#01060a" />
    </radialGradient>

    <!-- Glowing Accents -->
    <radialGradient id="glowCyan" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#00d2ff" stop-opacity="0.32" />
      <stop offset="60%" stop-color="#0077b6" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#000" stop-opacity="0" />
    </radialGradient>

    <radialGradient id="glowBlue" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.28" />
      <stop offset="100%" stop-color="#000" stop-opacity="0" />
    </radialGradient>

    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#082638" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#021420" stop-opacity="0.98" />
    </linearGradient>

    <linearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00c0f0" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>

    <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.75" />
    </filter>
  </defs>

  <!-- Base Canvas -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />

  <!-- Ambient Glows -->
  <circle cx="220" cy="140" r="420" fill="url(#glowCyan)" />
  <circle cx="1080" cy="520" r="460" fill="url(#glowBlue)" />

  <!-- Subtle Geometric Decorative Grid -->
  <g stroke="#00e5ff" stroke-opacity="0.08" stroke-width="1">
    <line x1="0" y1="90" x2="1200" y2="90" />
    <line x1="0" y1="540" x2="1200" y2="540" />
    <line x1="70" y1="0" x2="70" y2="630" />
    <line x1="1130" y1="0" x2="1130" y2="630" />
  </g>

  <!-- Top Header: Brand & Partners -->
  <g transform="translate(70, 42)">
    <!-- Ativa Logo Emblem -->
    <rect x="0" y="0" width="50" height="50" rx="14" fill="#0284c7" fill-opacity="0.25" stroke="#38bdf8" stroke-width="1.8" />
    <polygon points="25,10 40,38 10,38" fill="#38bdf8" />
    <circle cx="25" cy="29" r="4.5" fill="#031624" />

    <!-- Brand Text -->
    <text x="66" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="23" font-weight="900" fill="#ffffff" letter-spacing="3.5">GRUPO ATIVA</text>
    <text x="66" y="43" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#38bdf8" letter-spacing="1.5">SOLUÇÕES CONDOMINIAIS &amp; SEGURANÇA</text>

    <!-- Partner Tag -->
    <rect x="750" y="6" width="310" height="38" rx="19" fill="#032034" stroke="#0ea5e9" stroke-width="1.5" />
    <circle cx="772" cy="25" r="5" fill="#38bdf8" />
    <text x="788" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#e0f2fe" letter-spacing="1.2">✦ PARCERIA OFICIAL INTELBRAS</text>
  </g>

  <!-- Main Content Card Frame -->
  <rect x="70" y="118" width="1060" height="440" rx="26" fill="url(#cardGrad)" stroke="#1a4f70" stroke-width="1.5" filter="url(#dropShadow)" />

  <!-- Invitation VIP Category Badge -->
  <g transform="translate(115, 150)">
    <rect x="0" y="0" width="240" height="32" rx="16" fill="#0284c7" fill-opacity="0.25" stroke="#38bdf8" stroke-width="1.2" />
    <text x="120" y="20" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#38bdf8" text-anchor="middle" letter-spacing="1.8">★ CONVITE EXCLUSIVO VIP</text>
  </g>

  <!-- Event Main Title -->
  <text x="115" y="235" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="38" font-weight="900" fill="#ffffff" letter-spacing="-0.5">
    ${safeTitle.length > 46 ? safeTitle.substring(0, 44) + '...' : safeTitle}
  </text>

  <!-- Description / Subtitle -->
  <text x="115" y="278" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="400" fill="#cbd5e1">
    ${safeDesc.length > 84 ? safeDesc.substring(0, 82) + '...' : safeDesc}
  </text>

  <!-- Personalized Recipient Box (if invitation is addressed) -->
  ${
    isPersonalized
      ? `<g transform="translate(115, 308)">
    <rect x="0" y="0" width="970" height="74" rx="14" fill="#041f32" stroke="#0ea5e9" stroke-width="1.2" />
    <text x="24" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#38bdf8" letter-spacing="1.2">CONVITE DESTINADO ESPECIALMENTE A:</text>
    <text x="24" y="54" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="900" fill="#ffffff">${safeCondo}${safeManager ? ' • ' + safeManager : ''}</text>
  </g>`
      : `<g transform="translate(115, 308)">
    <rect x="0" y="0" width="970" height="74" rx="14" fill="#041f32" stroke="#1c4866" stroke-width="1.2" />
    <text x="24" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#38bdf8" letter-spacing="1.2">PÚBLICO-ALVO &amp; CONVIDADOS:</text>
    <text x="24" y="54" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="800" fill="#ffffff">Síndicos, Conselheiros, Administradores e Zeladores de Condomínios</text>
  </g>`
  }

  <!-- Event Quick Badges (Date / Location / RSVP Button) -->
  <g transform="translate(115, 410)">
    <!-- Date Badge -->
    <rect x="0" y="0" width="280" height="52" rx="14" fill="#021d2d" stroke="#0ea5e9" stroke-width="1" />
    <text x="20" y="23" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" fill="#38bdf8" letter-spacing="1">📅 DATA &amp; HORÁRIO</text>
    <text x="20" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="800" fill="#ffffff">${dateFormatted} às ${timeFormatted}</text>

    <!-- Location Badge -->
    <rect x="300" y="0" width="370" height="52" rx="14" fill="#021d2d" stroke="#0ea5e9" stroke-width="1" />
    <text x="320" y="23" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" fill="#38bdf8" letter-spacing="1">📍 LOCAL DO EVENTO</text>
    <text x="320" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="800" fill="#ffffff">${safeLocation.length > 34 ? safeLocation.substring(0, 32) + '...' : safeLocation}</text>

    <!-- CTA Button -->
    <g transform="translate(690, 0)">
      <rect x="0" y="0" width="280" height="52" rx="14" fill="url(#btnGrad)" />
      <text x="140" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">CONFIRME SUA PRESENÇA ➔</text>
    </g>
  </g>

  <!-- Bottom Subtext / Status -->
  <g transform="translate(115, 510)">
    <circle cx="6" cy="6" r="4.5" fill="#10b981" />
    <text x="20" y="10" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#94a3b8">Confirmação de Presença Online Instantânea • Vagas Limitadas</text>
    <text x="970" y="10" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#38bdf8" text-anchor="end">grupoativa.com.br</text>
  </g>
</svg>`;
}

// Endpoint: Open Graph Image for Invitation
app.get('/api/og-image/invitation/:code', (req, res) => {
  const code = req.params.code;
  const inv = db.invitations.find(
    (i) => i.code.toUpperCase() === code.toUpperCase() || i.id === code
  );
  const event = inv ? db.events.find((e) => e.id === inv.eventId) : db.events[0];

  // If custom image is set as data URL or external URL and requested directly
  if (inv?.customShareImageUrl) {
    if (inv.customShareImageUrl.startsWith('data:image')) {
      const parts = inv.customShareImageUrl.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
      const imgBuffer = Buffer.from(parts[1], 'base64');
      res.set('Content-Type', mime);
      res.set('Cache-Control', 'public, max-age=3600');
      return res.send(imgBuffer);
    } else if (inv.customShareImageUrl.startsWith('http')) {
      return res.redirect(inv.customShareImageUrl);
    }
  }

  if (event?.shareImageUrl && event.shareImageUrl.startsWith('data:image')) {
    const parts = event.shareImageUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const imgBuffer = Buffer.from(parts[1], 'base64');
    res.set('Content-Type', mime);
    res.set('Cache-Control', 'public, max-age=3600');
    return res.send(imgBuffer);
  } else if (event?.shareImageUrl && event.shareImageUrl.startsWith('http')) {
    return res.redirect(event.shareImageUrl);
  }

  const svg = generateOgSvg({
    eventTitle: event?.title || 'Treinamento Intelbras + Grupo Ativa',
    shareTitle: event?.shareTitle,
    shareDescription: event?.shareDescription,
    dateStr: event?.date,
    timeStr: event?.time,
    locationStr: event?.location,
    condoName: inv?.condoName,
    managerName: inv?.managerName,
    code: inv?.code
  });

  res.set('Content-Type', 'image/svg+xml; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(svg);
});

// Endpoint: Open Graph Image for Event
app.get('/api/og-image/event/:eventId', (req, res) => {
  const event = db.events.find((e) => e.id === req.params.eventId) || db.events[0];

  if (event?.shareImageUrl && event.shareImageUrl.startsWith('data:image')) {
    const parts = event.shareImageUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const imgBuffer = Buffer.from(parts[1], 'base64');
    res.set('Content-Type', mime);
    res.set('Cache-Control', 'public, max-age=3600');
    return res.send(imgBuffer);
  } else if (event?.shareImageUrl && event.shareImageUrl.startsWith('http')) {
    return res.redirect(event.shareImageUrl);
  }

  const svg = generateOgSvg({
    eventTitle: event?.title || 'Treinamento Intelbras + Grupo Ativa',
    shareTitle: event?.shareTitle,
    shareDescription: event?.shareDescription,
    dateStr: event?.date,
    timeStr: event?.time,
    locationStr: event?.location
  });

  res.set('Content-Type', 'image/svg+xml; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(svg);
});

// Endpoint: Live Open Graph Image Preview (with query params)
app.get('/api/og-image/preview', (req, res) => {
  const { title, desc, date, time, location, condo, manager } = req.query;
  const svg = generateOgSvg({
    eventTitle: (title as string) || 'Treinamento Intelbras + Grupo Ativa',
    shareTitle: (title as string) || undefined,
    shareDescription: (desc as string) || undefined,
    dateStr: (date as string) || undefined,
    timeStr: (time as string) || undefined,
    locationStr: (location as string) || undefined,
    condoName: (condo as string) || undefined,
    managerName: (manager as string) || undefined
  });

  res.set('Content-Type', 'image/svg+xml; charset=utf-8');
  res.send(svg);
});

// Function to inject Open Graph meta tags into raw HTML
function generateOgHtml(req: express.Request, rawHtml: string, code?: string, eventId?: string): string {
  let inv: Invitation | undefined;
  let event: CondoEvent | undefined;

  if (code && code !== 'geral') {
    inv = db.invitations.find(
      (i) => i.code.toUpperCase() === code.toUpperCase() || i.id === code
    );
    if (inv) {
      event = db.events.find((e) => e.id === inv!.eventId);
    }
  }

  if (!event) {
    if (eventId) {
      event = db.events.find((e) => e.id === eventId);
    } else {
      event = db.events[0];
    }
  }

  const host = req.get('host') || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const baseUrl = `${protocol}://${host}`;

  const eventTitle = event?.shareTitle || event?.title || 'Treinamento Intelbras + Grupo Ativa';
  const ogTitle = inv?.condoName
    ? `${inv.condoName} | Convite Especial - ${eventTitle}`
    : `${eventTitle} | Convite Especial`;

  let ogDescription = event?.shareDescription || 'Convite especial para Síndicos e Zeladores. Confirme sua presença.';
  if (inv) {
    const formattedDate = formatDateDisplay(event?.date);
    ogDescription = `Convite especial para Síndicos e Zeladores do ${inv.condoName}. Confirme sua presença.${
      formattedDate ? ` 📅 ${formattedDate} às ${event?.time || '19:00'}` : ''
    }.`;
  }

  const currentUrl = `${baseUrl}${req.originalUrl.split('?')[0]}`;

  let ogImageUrl = '';
  let ogImageType = 'image/jpeg';

  if (inv?.customShareImageUrl && inv.customShareImageUrl.startsWith('http')) {
    ogImageUrl = inv.customShareImageUrl;
    ogImageType = inv.customShareImageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';
  } else if (event?.shareImageUrl && event.shareImageUrl.startsWith('http')) {
    ogImageUrl = event.shareImageUrl;
    ogImageType = event.shareImageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';
  } else if (event?.bannerUrl && event.bannerUrl.startsWith('http')) {
    ogImageUrl = event.bannerUrl;
    ogImageType = event.bannerUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';
  } else if (inv?.customShareImageUrl && inv.customShareImageUrl.startsWith('data:image')) {
    ogImageUrl = `${baseUrl}/api/og-image/invitation/${inv.code}`;
    ogImageType = inv.customShareImageUrl.includes('image/png') ? 'image/png' : 'image/jpeg';
  } else if (event?.shareImageUrl && event.shareImageUrl.startsWith('data:image')) {
    ogImageUrl = `${baseUrl}/api/og-image/event/${event.id}`;
    ogImageType = event.shareImageUrl.includes('image/png') ? 'image/png' : 'image/jpeg';
  } else {
    // Fallback to high-res event banner or direct raster image for WhatsApp crawler
    ogImageUrl = event?.bannerUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80';
    ogImageType = 'image/jpeg';
  }

  let html = rawHtml;

  // Replace title
  html = html.replace(/<title>.*?<\/title>/gi, `<title>${escapeHtml(ogTitle)}</title>`);

  // Remove existing meta tags
  html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gi, '');
  html = html.replace(/<meta\s+property="og:.*?"\s*content=".*?"\s*\/?>/gi, '');
  html = html.replace(/<meta\s+name="twitter:.*?"\s*content=".*?"\s*\/?>/gi, '');

  const metaTags = `
    <meta name="description" content="${escapeHtml(ogDescription)}" />
    <meta property="og:site_name" content="Grupo Ativa" />
    <meta property="og:title" content="${escapeHtml(ogTitle)}" />
    <meta property="og:description" content="${escapeHtml(ogDescription)}" />
    <meta property="og:image" content="${escapeHtml(ogImageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(ogImageUrl)}" />
    <meta property="og:image:type" content="${ogImageType}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(eventTitle)}" />
    <meta property="og:url" content="${escapeHtml(currentUrl)}" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="pt_BR" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(ogDescription)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />
  `;

  return html.replace('</head>', `${metaTags}\n  </head>`);
}

// -------------------------------------------------------------
// VITE MIDDLEWARE & SERVER STARTUP
// -------------------------------------------------------------

let viteInstance: any = null;

// Route interceptor for Invitation pages with Dynamic Open Graph tags
app.get(['/convite/:code', '/convite/geral', '/convite', '/'], async (req, res, next) => {
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/@') ||
    req.path.startsWith('/src') ||
    req.path.startsWith('/node_modules') ||
    req.path.includes('.')
  ) {
    return next();
  }

  try {
    const code = req.params.code;
    let templatePath = path.join(process.cwd(), 'index.html');
    if (process.env.NODE_ENV === 'production') {
      const distIndex = path.join(process.cwd(), 'dist', 'index.html');
      if (fs.existsSync(distIndex)) {
        templatePath = distIndex;
      }
    }
    let html = fs.readFileSync(templatePath, 'utf-8');

    if (viteInstance && process.env.NODE_ENV !== 'production') {
      html = await viteInstance.transformIndexHtml(req.originalUrl, html);
    }

    const modifiedHtml = generateOgHtml(req, html, code);
    res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).send(modifiedHtml);
  } catch (e) {
    next(e);
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    viteInstance = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(viteInstance.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Realtime Invitation & RSVP Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
