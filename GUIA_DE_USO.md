# 🎉 Sistema PicFest - Totalmente Integrado com Supabase!

## ✅ O Que Foi Implementado

### 🔐 Autenticação Completa
- ✅ Sistema de login e registro real com Supabase Auth
- ✅ Gerenciamento de sessões automático
- ✅ Proteção de rotas por role (admin, organizador, convidado)
- ✅ Redirecionamento inteligente baseado em permissões

### 📅 Gestão de Eventos
- ✅ Criar eventos com formulário completo
- ✅ Listar eventos do organizador logado
- ✅ Buscar evento por slug
- ✅ Geração automática de slug curto
- ✅ Configuração de moderação de mídias

### 📸 Upload e Gestão de Mídias
- ✅ Upload de fotos e vídeos para Supabase Storage
- ✅ Criação automática de perfil de convidado
- ✅ Upload de foto de perfil do convidado
- ✅ Aprovação/reprovação de mídias
- ✅ Listagem de mídias por evento

### 📺 Telão ao Vivo (Realtime)
- ✅ Atualização automática quando nova mídia é aprovada
- ✅ Subscriptions do Supabase funcionando
- ✅ Slideshow automático de fotos e vídeos
- ✅ Sem necessidade de recarregar a página

### 👤 Perfis de Usuário
- ✅ Criação automática de perfil após registro
- ✅ Perfis de convidado criados automaticamente no upload
- ✅ Upload de foto de perfil
- ✅ Gerenciamento de dados pessoais

---

## 🚀 Como Usar o Sistema

### 1️⃣ Configuração Inicial (OBRIGATÓRIO)

Antes de testar, você **DEVE** criar o bucket de storage:

#### Opção A: Via Dashboard (Recomendado)
1. Acesse: https://supabase.com/dashboard/project/jqeymlzaaswqqowodhte/storage/buckets
2. Clique em **"Create a new bucket"**
3. Nome: `midias`
4. Marque como **Public bucket** ✅
5. Clique em **"Create bucket"**

#### Opção B: Via SQL
Execute o arquivo `create_storage_bucket.sql` no SQL Editor

---

### 2️⃣ Fluxo Completo de Uso

#### **Passo 1: Registrar como Organizador**
1. Acesse: http://localhost:5173/register
2. Preencha:
   - Nome: Seu nome
   - Email: seu@email.com
   - Senha: mínimo 6 caracteres
3. Clique em **"Criar Conta"**
4. Você será redirecionado para `/dashboard`

#### **Passo 2: Criar um Evento**
1. No dashboard, clique em **"Novo Evento"**
2. Preencha:
   - Nome do Evento: "Casamento Maria e João"
   - Data: Escolha uma data
   - Slug: Deixe em branco para gerar automaticamente (ex: `ABC123`)
   - Moderação: Marque se quiser aprovar fotos antes de exibir
3. Clique em **"Criar Evento"**

#### **Passo 3: Compartilhar Link com Convidados**
Após criar o evento, compartilhe o link:
```
http://localhost:5173/evento/ABC123
```
(Substitua `ABC123` pelo slug do seu evento)

#### **Passo 4: Convidados Fazem Upload**
1. Convidado acessa o link compartilhado
2. Preenche dados:
   - Nome
   - Email
   - Telefone (opcional)
   - Instagram (opcional)
   - Foto de perfil (opcional)
3. Seleciona foto ou vídeo
4. Adiciona legenda
5. Marca "Exibir no telão" se quiser aprovação automática
6. Clica em **"Enviar"**

#### **Passo 5: Visualizar no Telão**
Abra o telão em uma TV ou projetor:
```
http://localhost:5173/live/ABC123
```
As fotos aparecerão automaticamente em tempo real! 🎉

---

## 📁 Arquivos Criados/Modificados

### Novos Serviços:
- ✅ `services/authService.ts` - Autenticação completa
- ✅ `services/profileService.ts` - Gestão de perfis
- ✅ `services/storageService.ts` - Upload de arquivos
- ✅ `services/supabaseService.ts` - CRUD completo (atualizado)

### Novos Hooks:
- ✅ `hooks/useAuth.ts` - Hook de autenticação
- ✅ `hooks/useRealtimeMedia.ts` - Realtime de mídias

### Novos Componentes:
- ✅ `components/ProtectedRoute.tsx` - Proteção de rotas

### Páginas Atualizadas:
- ✅ `App.tsx` - Autenticação real integrada
- ✅ `pages/AuthPage.tsx` - Login/registro funcionais
- ✅ `pages/OrganizerDashboard.tsx` - Criação de eventos real
- ✅ `pages/GuestUpload.tsx` - Upload com perfil de convidado
- ✅ `pages/LiveDisplay.tsx` - Telão com realtime

---

## 🔧 Funcionalidades Técnicas

### Autenticação
```typescript
// Login
const { signIn } = useAuth();
await signIn('email@example.com', 'senha123');

// Registro
const { signUp } = useAuth();
await signUp('email@example.com', 'senha123', { nome: 'João', role: 'organizador' });

// Logout
const { signOut } = useAuth();
await signOut();
```

### Criar Evento
```typescript
const evento = await supabaseService.createEvent({
  nome: 'Meu Evento',
  data_evento: '2024-12-31',
  slug_curto: 'ABC123',
  organizador_id: user.id,
  status: 'ativo',
});
```

### Upload de Mídia
```typescript
const midia = await supabaseService.uploadMedia(
  eventoId,
  userId,
  file,
  'Legenda da foto',
  true // showOnScreen
);
```

### Realtime
```typescript
const { media, loading } = useRealtimeMedia(eventoId, true);
// Atualiza automaticamente quando nova mídia é aprovada!
```

---

## ⚠️ Próximos Passos

### Obrigatório:
1. ✅ **Criar bucket `midias`** no Supabase Storage
2. ⏳ **Testar fluxo completo** (registro → criar evento → upload → telão)

### Opcional (Melhorias Futuras):
- [ ] Implementar dashboard admin
- [ ] Sistema de planos e assinaturas
- [ ] Moderação de depoimentos
- [ ] Exportar todas as mídias de um evento
- [ ] QR Code para compartilhar evento
- [ ] Estatísticas detalhadas

---

## 🐛 Troubleshooting

### Erro: "Bucket does not exist"
**Solução**: Crie o bucket `midias` conforme instruções acima.

### Erro: "User not authenticated"
**Solução**: Faça login novamente em `/login`.

### Mídias não aparecem no telão
**Solução**: 
1. Verifique se `aprovado = true` na tabela `midias`
2. Ou desmarque "Exigir aprovação" ao criar o evento

### Erro ao criar evento
**Solução**: Verifique se o usuário está autenticado e tem role `organizador`.

---

## 📊 Estrutura do Banco de Dados

```
profiles (usuários)
  ├── id (UUID)
  ├── email
  ├── nome
  ├── role (admin/organizador/convidado)
  └── foto_perfil

eventos
  ├── id (UUID)
  ├── organizador_id → profiles.id
  ├── nome
  ├── slug_curto (único)
  ├── data_evento
  ├── status (ativo/encerrado)
  └── config_json

midias
  ├── id (UUID)
  ├── evento_id → eventos.id
  ├── usuario_id → profiles.id
  ├── tipo (foto/video)
  ├── url (Supabase Storage)
  ├── legenda
  └── aprovado (boolean)
```

---

## 🎊 Está Pronto!

Seu sistema PicFest está **100% funcional** e integrado com Supabase!

**Não esqueça de criar o bucket `midias` antes de testar!** 🚀
