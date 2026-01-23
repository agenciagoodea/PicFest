
import { Evento, Midia, Profile, Plano, Depoimento } from '../types';

// Mock do banco de dados para a demo funcionar sem chaves reais
const MOCK_EVENTS: Evento[] = [
  {
    id: '1',
    nome: 'Tech Gala 2024',
    slug_curto: '123456',
    data_evento: new Date().toISOString(),
    organizador_id: 'org1',
    status: 'ativo',
    config_json: {},
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    nome: 'Casamento Sarah & João',
    slug_curto: '654321',
    data_evento: new Date().toISOString(),
    organizador_id: 'org1',
    status: 'ativo',
    config_json: {},
    created_at: new Date().toISOString()
  }
];

const MOCK_MEDIA: Midia[] = [
  {
    id: 'm1',
    evento_id: '1',
    usuario_id: 'u1',
    tipo: 'foto',
    legenda: 'Que festa incrível!',
    url: 'https://picsum.photos/800/600',
    aprovado: true,
    created_at: new Date().toISOString(),
    perfil: { id: 'u1', nome: 'Alice Silva', role: 'convidado', email: 'alice@test.com', created_at: '', foto_perfil: 'https://picsum.photos/100' }
  },
  {
    id: 'm2',
    evento_id: '1',
    usuario_id: 'u2',
    tipo: 'foto',
    legenda: 'Parabéns aos noivos!',
    url: 'https://picsum.photos/800/601',
    aprovado: false,
    created_at: new Date().toISOString(),
    perfil: { id: 'u2', nome: 'Bruno Costa', role: 'convidado', email: 'bruno@test.com', created_at: '', foto_perfil: 'https://picsum.photos/101' }
  }
];

const MOCK_DEPOIMENTOS: Depoimento[] = [
  {
    id: 'd1',
    organizador_id: 'org1',
    nome: 'Ricardo Almeida',
    foto_url: 'https://i.pravatar.cc/150?u=org1',
    estrelas: 5,
    texto: 'O EventMedia transformou o casamento que organizei. Os noivos ficaram encantados com as fotos em tempo real no telão!',
    aprovado: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'd2',
    organizador_id: 'org2',
    nome: 'Marina Souza',
    foto_url: 'https://i.pravatar.cc/150?u=org2',
    estrelas: 4,
    texto: 'Plataforma excelente e muito estável. Meus clientes corporativos adoraram a interatividade.',
    aprovado: true,
    created_at: new Date().toISOString()
  }
];

export const supabaseService = {
  getEvents: async (): Promise<Evento[]> => {
    return MOCK_EVENTS;
  },
  
  getEventBySlug: async (slug: string): Promise<Evento | undefined> => {
    return MOCK_EVENTS.find(e => e.slug_curto === slug);
  },

  getMediaByEvent: async (eventId: string, approvedOnly: boolean = true): Promise<Midia[]> => {
    return MOCK_MEDIA.filter(m => m.evento_id === eventId && (!approvedOnly || m.aprovado));
  },

  uploadMedia: async (eventId: string, userId: string, file: File, caption: string): Promise<Midia> => {
    console.log(`Uploading to storage: eventos/${eventId}/fotos/${file.name}`);
    return {
      id: Math.random().toString(36),
      evento_id: eventId,
      usuario_id: userId,
      tipo: 'foto',
      legenda: caption,
      url: URL.createObjectURL(file),
      aprovado: false,
      created_at: new Date().toISOString()
    };
  },

  subscribeToMedia: (eventId: string, callback: (payload: Midia) => void) => {
    console.log(`Subscribing to realtime: midias where event_id = ${eventId}`);
    const timer = setTimeout(() => {
      callback({
        id: 'new-' + Date.now(),
        evento_id: eventId,
        usuario_id: 'system',
        tipo: 'foto',
        legenda: 'Novo registro recebido!',
        url: 'https://picsum.photos/800/602',
        aprovado: true,
        created_at: new Date().toISOString(),
        perfil: { id: 'sys', nome: 'Realtime Demo', role: 'convidado', email: '', created_at: '' }
      });
    }, 15000);
    return () => clearTimeout(timer);
  },

  getTestimonials: async (approvedOnly: boolean = true): Promise<Depoimento[]> => {
    return MOCK_DEPOIMENTOS.filter(d => !approvedOnly || d.aprovado);
  },

  createTestimonial: async (testimonial: Partial<Depoimento>): Promise<void> => {
    console.log('Testimonial created (mock):', testimonial);
  },

  updateTestimonialApproval: async (id: string, approved: boolean): Promise<void> => {
    console.log(`Testimonial ${id} approval set to ${approved} (mock)`);
  }
};
