
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
  bio?: string;
  phone?: string;
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
  config_json?: any;
  created_at?: string;

  // --- Campos do modelo por evento (Fase 2) ---
  plan_id?: string;
  plan_snapshot?: Plano | null;
  plan_expires_at?: string | null;
  media_count_photos?: number;
  media_count_videos?: number;
  logo_url?: string;
  logo_path?: string;
  showcase_config?: {
    primaryColor?: string;
    welcomeTitle?: string;
    welcomeSubtitle?: string;
    showGuestbook?: boolean;
    theme?: 'light' | 'dark' | 'custom';
  };
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

/**
 * Plano SaaS — suporta tanto o modelo antigo (subscription) quanto o novo (single_event)
 * Os campos antigos são mantidos como opcionais para compatibilidade com pagamentos existentes.
 */
export interface Plano {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  interval: 'day' | 'week' | 'month' | 'year' | 'unique';
  interval_count: number;

  // --- Campos do novo modelo por evento ---
  billing_type?: 'subscription' | 'single_event';
  sort_order?: number;

  features_json: {
    items?: string[];
    // Novo modelo por evento
    slideshow?: boolean;
    qr_upload?: boolean;
    download_files?: boolean;
    zip_download?: boolean;
    custom_cover?: boolean;
    branding?: boolean;
    priority_processing?: boolean;
  };
  limits_json: {
    // Modelo antigo (subscription) — mantido para compatibilidade
    events?: number;
    media?: number;
    download?: boolean;
    // Novo modelo por evento
    photos?: number;
    videos?: number;
    zip?: boolean;
  };

  is_free_tier?: boolean;
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

/** Adicionais de Planos (Addons) no Catálogo */
export interface PlanAddonCatalog {
    id: string;
    name: string;
    slug: string;
    description?: string;
    addon_type: 'fotos' | 'videos' | 'misto' | 'recurso';
    price: number;
    extra_photos: number;
    extra_videos: number;
    extra_events: number;
    features_json: any;
    sort_order: number;
    is_active: boolean;
    is_visible: boolean;
    created_at: string;
}

/** Adicionais adquiridos para um evento específico */
export interface EventPlanAddon {
    id: string;
    tenant_id: string;
    evento_id: string;
    addon_id: string;
    payment_id?: string;
    name_snapshot: string;
    type_snapshot: string;
    price_snapshot: number;
    extra_photos_snapshot: number;
    extra_videos_snapshot: number;
    status: 'active' | 'cancelled';
    created_at: string;
}

/** Retorno de validação de upload com suporte a addons */
export interface UploadLimitCheck {
  allowed: boolean;
  reason?: 'photo_limit_reached' | 'video_limit_reached' | 'no_plan';
  current: number;
  limit: number;
  base_limit: number;
  addon_limit: number;
}

export interface PlanAddon {
  id: string;
  name: string;
  slug: string;
  description: string;
  addon_type: 'fotos' | 'videos' | 'misto' | 'recurso';
  price: number;
  extra_photos: number;
  extra_videos: number;
  extra_events: number;
  features_json?: Record<string, any>;
  sort_order: number;
  is_active: boolean;
  is_visible: boolean;
  created_at?: string;
}
