
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


export interface Tenant {
  id: string;
  name: string;
  owner_id: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface Plano {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  interval: 'day' | 'week' | 'month' | 'year' | 'unique';
  interval_count: number;
  features_json: any;
  limits_json: any;
  is_active: boolean;
  created_at?: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: 'pending' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'expired';
  started_at?: string;
  expires_at?: string;
  renewal_date?: string;
  external_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  subscription_id?: string;
  plan_id: string;
  mercado_pago_payment_id?: string;
  external_reference?: string;
  payment_method: string;
  payment_type?: string;
  amount: number;
  currency: string;
  status: string;
  status_detail?: string;
  is_test: boolean;
  payer_email: string;
  pix_qr_code?: string;
  pix_qr_code_base64?: string;
  pix_copy_paste?: string;
  paid_at?: string;
  expires_at?: string;
  created_at: string;
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
