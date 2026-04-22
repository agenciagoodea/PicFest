import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';
import { supabase } from '../../services/supabaseClient';

interface MpConfig {
   publicKey: string;
   accessToken: string;
   applicationId: string;
   webhookSecret: string;
   environment: 'sandbox' | 'production';
   webhookUrl: string;
   enabledMethods: {
      pix: boolean;
      credit_card: boolean;
      debit_card: boolean;
      boleto: boolean;
   };
}

interface SmtpConfig {
    host: string;
    port: string;
    user: string;
    pass: string;
    fromEmail: string;
    fromName: string;
}

interface MpAccountInfo {
   nickname: string;
   id: number;
   email: string;
   site_id: string;
}

const DEFAULT_MP_CONFIG: MpConfig = {
   publicKey: '',
   accessToken: '',
   applicationId: '',
   webhookSecret: '',
   environment: 'sandbox',
   webhookUrl: 'https://jqeymlzaaswqqowodhte.supabase.co/functions/v1/mercadopago-webhook',
   enabledMethods: {
      pix: true,
      credit_card: true,
      debit_card: true,
      boleto: false,
   }
};

const DEFAULT_SMTP_CONFIG: SmtpConfig = {
    host: '',
    port: '587',
    user: '',
    pass: '',
    fromEmail: 'contato@picfest.com',
    fromName: 'PicFest'
};

export const AdminSettings: React.FC = () => {
   const queryClient = useQueryClient();
   const [activeTab, setActiveTab] = useState<'mercadopago' | 'email'>('mercadopago');
   
   // Mercado Pago State
   const [mpConfig, setMpConfig] = useState<MpConfig>(DEFAULT_MP_CONFIG);
   const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
   const [accountInfo, setAccountInfo] = useState<MpAccountInfo | null>(null);
   const [testError, setTestError] = useState('');
   const [showTokens, setShowTokens] = useState(false);

   // Email / SMTP State
   const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(DEFAULT_SMTP_CONFIG);
   const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
   const [templateHtml, setTemplateHtml] = useState<string>('');

   const { data: remoteMpConfig, isLoading: loadingMp } = useQuery({
      queryKey: ['systemConfig', 'mercadopago_config'],
      queryFn: () => adminService.getConfig('mercadopago_config'),
   });

   const { data: remoteSmtpConfig, isLoading: loadingSmtp } = useQuery({
      queryKey: ['systemConfig', 'smtp_config'],
      queryFn: () => adminService.getConfig('smtp_config'),
   });

   const { data: templates, isLoading: loadingTemplates } = useQuery({
      queryKey: ['emailTemplates'],
      queryFn: () => adminService.getEmailTemplates(),
   });

   useEffect(() => {
      if (remoteMpConfig?.mercadopago) {
         const newConfig = { ...DEFAULT_MP_CONFIG, ...remoteMpConfig.mercadopago };
         if (newConfig.webhookUrl?.includes('vercel.app')) {
            newConfig.webhookUrl = DEFAULT_MP_CONFIG.webhookUrl;
         }
         setMpConfig(newConfig);
      }
   }, [remoteMpConfig]);

   useEffect(() => {
      if (remoteSmtpConfig?.smtp) {
         setSmtpConfig({ ...DEFAULT_SMTP_CONFIG, ...remoteSmtpConfig.smtp });
      }
   }, [remoteSmtpConfig]);

   useEffect(() => {
       if (selectedTemplateId && templates) {
           const template = templates.find(t => t.id === selectedTemplateId);
           if (template) setTemplateHtml(template.html_content);
       }
   }, [selectedTemplateId, templates]);

   const saveMpMutation = useMutation({
      mutationFn: (newConfig: MpConfig) =>
         adminService.updateConfig('mercadopago_config', { mercadopago: newConfig }),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['systemConfig', 'mercadopago_config'] });
         alert('Configurações Mercado Pago salvas com sucesso!');
      },
      onError: () => alert('Erro ao salvar configurações do Mercado Pago.'),
   });

   const saveSmtpMutation = useMutation({
      mutationFn: (newConfig: SmtpConfig) =>
         adminService.updateConfig('smtp_config', { smtp: newConfig }),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['systemConfig', 'smtp_config'] });
         alert('Configurações SMTP salvas com sucesso!');
      },
      onError: () => alert('Erro ao salvar configurações SMTP.'),
   });

   const saveTemplateMutation = useMutation({
       mutationFn: ({ id, html_content }: { id: string, html_content: string }) =>
           adminService.updateEmailTemplate(id, { html_content, updated_at: new Date().toISOString() }),
       onSuccess: () => {
           queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
           alert('Template salvo com sucesso!');
       },
       onError: () => alert('Erro ao salvar template.'),
   });

   const handleSaveMp = () => saveMpMutation.mutate(mpConfig);
   const handleSaveSmtp = () => saveSmtpMutation.mutate(smtpConfig);
   const handleSaveTemplate = () => {
       if (!selectedTemplateId) return;
       saveTemplateMutation.mutate({ id: selectedTemplateId, html_content: templateHtml });
   };

   const testConnection = async () => {
      if (!mpConfig.accessToken) {
         alert('Insira o Access Token primeiro.');
         return;
      }
      
      setTestStatus('loading');
      setTestError('');
      setAccountInfo(null);

      try {
         const { data: { session } } = await supabase.auth.getSession();
         const { data, error } = await supabase.functions.invoke('mercadopago-payment', {
            body: { action: 'test-connection', accessToken: mpConfig.accessToken },
            headers: session ? { Authorization: `Bearer ${session.access_token}` } : {}
         });

         if (error) throw error;
         if (!data) throw new Error('Falha na resposta do servidor');

         if (data.success === false) {
            setTestError(data.error || 'Token inválido');
            setTestStatus('error');
            return;
         }

         setAccountInfo({
            nickname: data.nickname,
            id: data.id,
            email: data.email,
            site_id: data.site_id
         });
         setTestStatus('success');
      } catch (err: any) {
         console.error('Erro ao testar:', err);
         setTestError(err.message || 'Chave inválida ou erro de conexão');
         setTestStatus('error');
      }
   };

   const toggleMethod = (method: keyof MpConfig['enabledMethods']) => {
      setMpConfig(prev => ({
         ...prev,
         enabledMethods: { ...prev.enabledMethods, [method]: !prev.enabledMethods[method] }
      }));
   };

   if (loadingMp || loadingSmtp || loadingTemplates) return <div className="p-10 text-center animate-pulse text-xs font-black uppercase tracking-widest text-slate-700">Carregando configurações...</div>;

   const PAYMENT_METHODS = [
      { key: 'pix' as const, label: 'Pix', icon: 'qr_code_2', desc: 'Transferência instantânea', color: 'text-green-400' },
      { key: 'credit_card' as const, label: 'Cartão de Crédito', icon: 'credit_card', desc: 'Visa, Master, Elo e outros', color: 'text-blue-400' },
      { key: 'debit_card' as const, label: 'Cartão de Débito', icon: 'contactless', desc: 'Débito direto em conta', color: 'text-cyan-400' },
      { key: 'boleto' as const, label: 'Boleto Bancário', icon: 'receipt_long', desc: 'Vencimento em 1-3 dias úteis', color: 'text-amber-400' },
   ];

   return (
      <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
         <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
               <h1 className="text-4xl font-black tracking-tight uppercase">Parâmetros API</h1>
               <p className="text-slate-400 mt-2 text-sm">Integrações externas e configurações do sistema.</p>
            </div>
         </header>

         {/* Navegação por abas */}
         <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/10">
            <button
                onClick={() => setActiveTab('mercadopago')}
                className={`px-6 py-3 rounded-t-2xl font-bold uppercase tracking-wider text-[10px] transition-colors flex items-center gap-2 ${
                    activeTab === 'mercadopago' 
                    ? 'bg-white/10 text-white border-b-2 border-primary' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
            >
                <span className="material-symbols-outlined text-sm">payments</span>
                Mercado Pago
            </button>
            <button
                onClick={() => setActiveTab('email')}
                className={`px-6 py-3 rounded-t-2xl font-bold uppercase tracking-wider text-[10px] transition-colors flex items-center gap-2 ${
                    activeTab === 'email' 
                    ? 'bg-white/10 text-white border-b-2 border-primary' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
            >
                <span className="material-symbols-outlined text-sm">mail</span>
                E-mail / SMTP
            </button>
         </div>

         <div className="animate-in fade-in duration-300">
             {activeTab === 'mercadopago' && (
                 <div className="flex flex-col gap-10">
                     {/* Card principal de credenciais (Mercado Pago) */}
                     <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
                        <div className="flex items-center justify-between p-8 border-b border-white/10">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                 <span className="material-symbols-outlined text-primary">payments</span>
                              </div>
                              <div>
                                 <h3 className="font-black text-white text-lg">Integração Mercado Pago</h3>
                                 <p className="text-slate-500 text-xs">Credenciais e Ambiente de Pagamento</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-500 uppercase">Ativo</span>
                              <button
                                 onClick={() => setMpConfig(prev => ({ ...prev, environment: prev.environment === 'sandbox' ? 'production' : 'sandbox' }))}
                                 className={`w-14 h-7 rounded-full transition-all relative ${mpConfig.environment === 'production' ? 'bg-primary' : 'bg-slate-700'}`}
                              >
                                 <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${mpConfig.environment === 'production' ? 'right-1' : 'left-1'}`}></span>
                              </button>
                           </div>
                        </div>

                        <div className="p-8 flex flex-col gap-6">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="flex flex-col gap-2">
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Ambiente</label>
                                 <select
                                    className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all text-sm appearance-none"
                                    value={mpConfig.environment}
                                    onChange={e => setMpConfig(prev => ({ ...prev, environment: e.target.value as 'sandbox' | 'production' }))}
                                 >
                                    <option value="sandbox" className="bg-slate-900">Sandbox (Teste)</option>
                                    <option value="production" className="bg-slate-900">Produção (Real)</option>
                                 </select>
                              </div>

                              <div className="flex flex-col gap-2">
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Application ID</label>
                                 <input
                                    type="text"
                                    className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all font-mono text-xs"
                                    placeholder="Ex: 123456789"
                                    value={mpConfig.applicationId}
                                    onChange={e => setMpConfig(prev => ({ ...prev, applicationId: e.target.value }))}
                                 />
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="flex flex-col gap-2">
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Public Key</label>
                                 <input
                                    type="text"
                                    className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all font-mono text-xs"
                                    placeholder={mpConfig.environment === 'sandbox' ? 'TEST-xxxxxxxx-...' : 'APP_USR-xxxxxxxx-...'}
                                    value={mpConfig.publicKey}
                                    onChange={e => setMpConfig(prev => ({ ...prev, publicKey: e.target.value }))}
                                 />
                              </div>

                              <div className="flex flex-col gap-2">
                                 <div className="flex items-center justify-between pl-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Access Token</label>
                                    <button onClick={() => setShowTokens(!showTokens)} className="text-[9px] text-primary font-bold uppercase">
                                       {showTokens ? 'Ocultar' : 'Mostrar'}
                                    </button>
                                 </div>
                                 <input
                                    type={showTokens ? 'text' : 'password'}
                                    className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all font-mono text-xs"
                                    placeholder={mpConfig.environment === 'sandbox' ? 'TEST-xxxxxxxx-...' : 'APP_USR-xxxxxxxx-...'}
                                    value={mpConfig.accessToken}
                                    onChange={e => setMpConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                                 />
                              </div>
                           </div>

                           <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Webhook Secret Key (Client Secret)</label>
                              <input
                                 type={showTokens ? 'text' : 'password'}
                                 className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all font-mono text-xs"
                                 placeholder="Chave secreta para validar os webhooks do MP"
                                 value={mpConfig.webhookSecret}
                                 onChange={e => setMpConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
                              />
                           </div>

                           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                               <div className="flex items-center gap-4">
                                  <button
                                     onClick={testConnection}
                                     disabled={testStatus === 'loading'}
                                     className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-black rounded-2xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:animate-pulse"
                                  >
                                     <span className="material-symbols-outlined text-sm">cable</span>
                                     {testStatus === 'loading' ? 'Testando...' : 'Testar Conexão'}
                                  </button>

                                  {testStatus === 'success' && (
                                     <span className="flex items-center gap-2 text-green-500 text-sm font-black">
                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                        Conectado com sucesso!
                                     </span>
                                  )}
                                  {testStatus === 'error' && (
                                     <span className="flex items-center gap-2 text-red-400 text-sm font-bold">
                                        <span className="material-symbols-outlined text-sm">error</span>
                                        {testError}
                                     </span>
                                  )}
                               </div>
                               <button
                                  onClick={handleSaveMp}
                                  disabled={saveMpMutation.isPending}
                                  className="px-10 py-3 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 justify-center"
                               >
                                  <span className="material-symbols-outlined text-sm">save</span>
                                  {saveMpMutation.isPending ? 'Salvando...' : 'Salvar Configuração'}
                               </button>
                           </div>

                           {testStatus === 'success' && accountInfo && (
                              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                 <div>
                                    <p className="text-[10px] font-black text-green-400/70 uppercase tracking-widest mb-1">Vendedor</p>
                                    <p className="text-sm font-bold text-white">{accountInfo.nickname}</p>
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-green-400/70 uppercase tracking-widest mb-1">ID da Conta</p>
                                    <p className="text-sm font-bold text-white">{accountInfo.id}</p>
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-green-400/70 uppercase tracking-widest mb-1">E-mail</p>
                                    <p className="text-sm font-bold text-white truncate">{accountInfo.email}</p>
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-green-400/70 uppercase tracking-widest mb-1">Site ID</p>
                                    <p className="text-sm font-bold text-white">{accountInfo.site_id}</p>
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>

                     {/* Métodos de pagamento e Webhook */}
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                         <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col gap-6">
                            <div>
                               <h3 className="font-black text-white text-lg">Formas de Pagamento</h3>
                               <p className="text-slate-500 text-xs mt-1">Selecione quais métodos serão aceitos.</p>
                            </div>
                            <div className="flex flex-col gap-4">
                               {PAYMENT_METHODS.map(method => (
                                  <div
                                     key={method.key}
                                     onClick={() => toggleMethod(method.key)}
                                     className={`group flex items-center gap-5 p-4 rounded-2xl border cursor-pointer transition-all select-none ${
                                        mpConfig.enabledMethods[method.key]
                                           ? 'border-primary/50 bg-primary/5'
                                           : 'border-white/10 bg-white/5 hover:bg-white/10'
                                     }`}
                                  >
                                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${mpConfig.enabledMethods[method.key] ? 'bg-primary/20' : 'bg-white/5'}`}>
                                        <span className={`material-symbols-outlined text-sm ${mpConfig.enabledMethods[method.key] ? 'text-primary' : method.color}`}>{method.icon}</span>
                                     </div>
                                     <div className="flex-1 min-w-0">
                                        <p className={`font-black text-sm ${mpConfig.enabledMethods[method.key] ? 'text-white' : 'text-slate-400'}`}>{method.label}</p>
                                     </div>
                                     <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${mpConfig.enabledMethods[method.key] ? 'border-primary bg-primary' : 'border-slate-600'}`}>
                                        {mpConfig.enabledMethods[method.key] && <span className="material-symbols-outlined text-white text-[10px]">check</span>}
                                     </div>
                                  </div>
                               ))}
                            </div>
                         </div>

                         <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col gap-4">
                            <div>
                               <h3 className="font-black text-white text-lg">Webhook Receiver</h3>
                               <p className="text-slate-500 text-xs mt-1">Configure no painel do Mercado Pago.</p>
                            </div>
                            <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                               <span className="material-symbols-outlined text-green-400 flex-shrink-0">link</span>
                               <p className="font-mono text-[11px] text-green-400 break-all leading-relaxed flex-1">{mpConfig.webhookUrl}</p>
                               <button
                                  onClick={() => navigator.clipboard.writeText(mpConfig.webhookUrl)}
                                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex-shrink-0"
                               >
                                  Copiar
                               </button>
                            </div>
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 flex flex-col gap-3 mt-4">
                               <p className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                  <span className="material-symbols-outlined text-sm">info</span> Instruções
                               </p>
                               <ol className="flex flex-col gap-2 text-[11px] text-slate-400 list-decimal list-inside">
                                  <li>Acesse o Mercado Pago Developers.</li>
                                  <li>Crie a aplicação e copie as credenciais.</li>
                                  <li>Adicione a URL acima em Webhooks, ouvindo <code className="bg-white/5 px-1 rounded text-primary">payment</code> e <code className="bg-white/5 px-1 rounded text-primary">mp-connect</code>.</li>
                               </ol>
                            </div>
                         </div>
                     </div>
                 </div>
             )}

             {activeTab === 'email' && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                     {/* Configurações SMTP */}
                     <div className="flex flex-col gap-6">
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col">
                            <div className="flex items-center gap-4 p-8 border-b border-white/10">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary">dns</span>
                                </div>
                                <div>
                                    <h3 className="font-black text-white text-lg">Servidor SMTP</h3>
                                    <p className="text-slate-500 text-xs">Configuração para envio de e-mails transacionais.</p>
                                </div>
                            </div>
                            <div className="p-8 flex flex-col gap-6 flex-1">
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="col-span-2 flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Host SMTP</label>
                                        <input
                                            type="text"
                                            className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all text-sm font-mono"
                                            placeholder="smtp.exemplo.com"
                                            value={smtpConfig.host}
                                            onChange={e => setSmtpConfig(prev => ({ ...prev, host: e.target.value }))}
                                        />
                                    </div>
                                    <div className="col-span-1 flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Porta</label>
                                        <input
                                            type="text"
                                            className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all text-sm font-mono"
                                            placeholder="587"
                                            value={smtpConfig.port}
                                            onChange={e => setSmtpConfig(prev => ({ ...prev, port: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Usuário</label>
                                        <input
                                            type="text"
                                            className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all text-sm font-mono"
                                            value={smtpConfig.user}
                                            onChange={e => setSmtpConfig(prev => ({ ...prev, user: e.target.value }))}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Senha</label>
                                        <input
                                            type="password"
                                            className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all text-sm font-mono"
                                            value={smtpConfig.pass}
                                            onChange={e => setSmtpConfig(prev => ({ ...prev, pass: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Nome do Remetente</label>
                                        <input
                                            type="text"
                                            className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all text-sm"
                                            value={smtpConfig.fromName}
                                            onChange={e => setSmtpConfig(prev => ({ ...prev, fromName: e.target.value }))}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">E-mail do Remetente</label>
                                        <input
                                            type="email"
                                            className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all text-sm font-mono"
                                            value={smtpConfig.fromEmail}
                                            onChange={e => setSmtpConfig(prev => ({ ...prev, fromEmail: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/10 flex justify-end">
                               <button
                                  onClick={handleSaveSmtp}
                                  disabled={saveSmtpMutation.isPending}
                                  className="px-8 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary/80 transition-all disabled:opacity-50 flex items-center gap-2"
                               >
                                  <span className="material-symbols-outlined text-sm">save</span>
                                  Salvar SMTP
                               </button>
                            </div>
                        </div>
                     </div>

                     {/* Templates HTML */}
                     <div className="flex flex-col gap-6">
                         <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col flex-1">
                             <div className="flex items-center justify-between p-8 border-b border-white/10">
                                 <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center">
                                         <span className="material-symbols-outlined text-secondary">html</span>
                                     </div>
                                     <div>
                                         <h3 className="font-black text-white text-lg">Templates de E-mail</h3>
                                         <p className="text-slate-500 text-xs">Personalize o código HTML das notificações.</p>
                                     </div>
                                 </div>
                             </div>
                             <div className="p-8 flex flex-col gap-6 flex-1">
                                 <div className="flex flex-col gap-2">
                                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Selecione o Template</label>
                                     <select
                                         className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all text-sm appearance-none"
                                         value={selectedTemplateId}
                                         onChange={e => setSelectedTemplateId(e.target.value)}
                                     >
                                         <option value="" className="bg-slate-900">-- Escolha um template --</option>
                                         {templates?.map(t => (
                                             <option key={t.id} value={t.id} className="bg-slate-900">
                                                 [{t.slug}] - {t.subject}
                                             </option>
                                         ))}
                                     </select>
                                 </div>
                                 
                                 {selectedTemplateId && (
                                     <div className="flex flex-col gap-2 flex-1">
                                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 flex items-center justify-between">
                                             <span>Código HTML</span>
                                             <span className="text-primary font-mono lowercase">Variáveis: {'{{nome}}, {{evento}}'}</span>
                                         </label>
                                         <textarea
                                             className="bg-black/50 border border-white/10 rounded-2xl p-6 text-green-400 outline-none focus:border-primary transition-all font-mono text-xs w-full min-h-[300px] resize-y"
                                             value={templateHtml}
                                             onChange={e => setTemplateHtml(e.target.value)}
                                             spellCheck="false"
                                         />
                                     </div>
                                 )}
                             </div>
                             {selectedTemplateId && (
                                 <div className="p-6 border-t border-white/10 flex justify-end gap-4">
                                     <button
                                         onClick={handleSaveTemplate}
                                         disabled={saveTemplateMutation.isPending}
                                         className="px-8 py-3 bg-white/10 text-white font-black rounded-xl hover:bg-white/20 transition-all disabled:opacity-50 flex items-center gap-2"
                                     >
                                         <span className="material-symbols-outlined text-sm">save</span>
                                         Salvar Template
                                     </button>
                                 </div>
                             )}
                         </div>
                     </div>
                 </div>
             )}
         </div>
      </div>
   );
};
