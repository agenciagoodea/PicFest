# Documentação Técnica Completa — PicFest SaaS

O **PicFest** é uma plataforma SaaS multi-tenant voltada para transmissão de fotos e vídeos em tempo real em eventos. O sistema permite que organizadores contratem pacotes por evento, gerenciem galeria de mídias e transmitam slideshows em telões, enquanto convidados capturam momentos diretamente pelo celular sem necessidade de baixar aplicativos.

---

## 1. Arquitetura Técnica

- **Frontend:** React (TypeScript) + Vite + TailwindCSS.
- **Backend/BaaS:** Supabase (PostgreSQL, Auth, Storage, Edge Functions).
- **Pagamentos:** Mercado Pago (Checkout Transparente + Webhooks).
- **Hospedagem:** Vercel (Frontend) & Supabase (Backend/Database).

---

## 2. Modelo de Dados (PostgreSQL)

O banco de dados utiliza **Row Level Security (RLS)** para garantir que cada organizador acesse apenas seus próprios dados.

### Principais Tabelas:

| Tabela | Descrição |
| :--- | :--- |
| `profiles` | Armazena dados de usuários (Admin, Organizador ou Convidado). |
| `tenants` | Entidade "Empresa/Conta" do organizador para isolamento multi-tenant. |
| `plans` | Define planos SaaS, preços e limites (campos `limits_json` e `features_json`). |
| `eventos` | Registro principal de cada festa. Armazena `plan_snapshot` para fixar limites. |
| `midias` | Fotos e vídeos enviados pelos convidados. |
| `payments` | Histórico de transações originadas no Mercado Pago. |
| `subscriptions` | Controle de acesso baseado em pagamentos aprovados. |
| `webhook_events` | Logs de requisições recebidas do Mercado Pago para debug e processamento. |

### Relacionamentos Chave:
- `eventos.organizador_id` → `profiles.id`
- `midias.evento_id` → `eventos.id`
- `subscriptions.tenant_id` → `tenants.id`
- `payments.external_reference` vincula o pagamento à `subscription` no sistema.

---

## 3. Fluxo de Negócio — Módulo de Planos

Recentemente o sistema foi migrado de um modelo de "assinatura mensal" para **"Cotas por Evento"**.

### Como funciona a contratação:
1. **Compra de Créditos:** O organizador escolhe um plano (Free, Fest ou Show) na `SubscriptionsView.tsx`.
2. **Pagamento:** O `mercadoPagoService` gera o Checkout Transparente. Após a aprovação, o sistema cria uma `subscription` com status `active`.
3. **Vínculo ao Evento:** No `EventDetailView.tsx`, o organizador vê seus planos disponíveis (créditos comprados) e clica em **"Ativar Plano no Evento"**.
4. **Snapshot:** O sistema salva uma cópia dos limites do plano (`plan_snapshot`) diretamente na linha do evento. Isso garante que, se o preço do plano mudar no futuro, o evento já contratado não seja afetado.

---

## 4. Funcionamento do Guest Upload (Convidado)

O fluxo de captura é otimizado para celulares (PWA/Browser):

1. **Acesso:** Convidado lê o QR Code do evento e cai em `/evento/:slug`.
2. **Perfil:** O convidado informa nome/instagram (armazenado em `profiles` com role `convidado`).
3. **Captura:** O sistema oferece dois modos via `GuestUpload.tsx`:
   - **Tirar Foto:** Abre a câmera nativa direto.
   - **Gravar Vídeo:** Abre o gravador nativo (limite sugerido de 30s).
4. **Validação de Limite:** Antes do upload, a função `validateUploadLimit` (Supabase) verifica o snapshot do plano no evento. Se o limite de fotos/vídeos foi atingido, o upload é bloqueado.
5. **Transmissão:** Se a opção "Brilhar no Telão" for marcada, a mídia cai na fila de moderação ou vai direto para a galeria pública.

---

## 5. Integração Mercado Pago

### Frontend:
O `mercadoPagoService.ts` utiliza o SDK do Mercado Pago para gerar campos de cartão criptografados, garantindo segurança (PCI Compliance).

### Backend (Edge Functions):
A função `mercadopago-payment` no Supabase recebe os dados sensíveis, comunica-se com a API oficial do Mercado Pago e retorna o status.
- **Webhook:** O Mercado Pago notifica o endpoint de webhook do Supabase sobre mudanças no status (ex: aprovado). O log é salvo em `webhook_events`.

---

## 6. Segurança e Performance

- **RLS (Row Level Security):** Filtros aplicados no nível do banco `(organizador_id = auth.uid())` impedem que um usuário veja dados de outro.
- **Triggers:** A tabela `midias` possui um trigger `trg_update_event_media_count` que atualiza automaticamente os contadores de fotos e vídeos no evento, evitando consultas pesadas de `COUNT(*)`.
- **Storage Policies:** O Supabase Storage está configurado para que apenas mídias enviadas para um determinar `evento_id` possam ser lidas/excluídas conforme as permissões.

---

## 7. Estrutura de Arquivos

```text
/src
  /pages
    /dashboard       # Painel do Organizador
    /admin           # Painel Master (PicFest Admin)
    LandingPage.tsx  # Landing de Vendas
    GuestUpload.tsx  # Interface do Convidado
  /services
    supabaseService  # CRUD e Lógica de Negócio
    mercadoPago      # Integração Financeira
    adminService     # Funções de Gestão Master
  /components
    /common          # PricingCards, Botões, Layouts
  /supabase
    /migrations      # Histórico do Banco de Dados
    /functions       # Edge Functions (Node.js/Deno)
  types.ts           # Interfaces únicas da Verdade
```

---

## 8. Manutenção de Planos

Para adicionar ou alterar limites:
1. Edite o plano no painel Admin (`/admin/plans`).
2. Altere o `limits_json` (ex: `{"photos": 500, "videos": 50}`).
3. Novas ativações de eventos já usarão estes novos limites.
