
export type UserRole = 'admin' | 'organizador' | 'convidado';

export interface Profile {
  id: string;
  role: UserRole;
  nome: string;
  email: string;
  telefone?: string;
  instagram?: string;
  whatsapp?: string;
  foto_perfil?: string;
  data_nascimento?: string;
  cpf?: string;
  cep?: string;
  endereco_logradouro?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_estado?: string;
  created_at: string;
}

export interface Evento {
  id: string;
  nome: string;
  slug_curto: string;
  data_evento: string;
  organizador_id?: string;
  status: 'ativo' | 'encerrado';
  config_json?: any; // Matches DB column 'config_json'
  created_at?: string;
  // deprecated: configuracao?: any; 
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
  limite_eventos: number;
  limite_midias: number;
  pode_baixar: boolean;
  valor: number;
  recorrencia: string;
  ativo?: boolean;
}

export interface Depoimento {
  id: string;
  organizador_id?: string;
  nome: string;
  foto_url: string;
  estrelas: number;
  texto: string;
  aprovado: boolean;
  created_at?: string;
}
