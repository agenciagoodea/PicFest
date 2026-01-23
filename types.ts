
export type UserRole = 'admin' | 'organizador' | 'convidado';

export interface Profile {
  id: string;
  role: UserRole;
  nome: string;
  email: string;
  telefone?: string;
  instagram?: string;
  foto_perfil?: string;
  created_at: string;
}

export interface Evento {
  id: string;
  nome: string;
  slug_curto: string;
  data_evento: string;
  organizador_id: string;
  status: 'ativo' | 'encerrado';
  config_json: any;
  created_at: string;
}

export interface Midia {
  id: string;
  evento_id: string;
  usuario_id: string;
  tipo: 'foto' | 'video';
  legenda?: string;
  url: string;
  aprovado: boolean;
  created_at: string;
  perfil?: Profile;
}

export interface Plano {
  id: string;
  nome: string;
  limite_storage: number;
  limite_eventos: number;
  valor: number;
  recorrencia: string;
}

export interface Depoimento {
  id: string;
  organizador_id: string;
  nome: string;
  foto_url: string;
  estrelas: number;
  texto: string;
  aprovado: boolean;
  created_at: string;
}
