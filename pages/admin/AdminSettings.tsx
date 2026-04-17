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

interface MpAccountInfo {
   nickname: string;
   id: number;
   email: string;
   site_id: string;
}

const DEFAULT_CONFIG: MpConfig = {
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

export const AdminSettings: React.FC = () => {
   const queryClient = useQueryClient();
   const [config, setConfig] = useState<MpConfig>(DEFAULT_CONFIG);
   const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
   const [accountInfo, setAccountInfo] = useState<MpAccountInfo | null>(null);
   const [testError, setTestError] = useState('');
   const [showTokens, setShowTokens] = useState(false);

   const { data: remoteConfig, isLoading: loading } = useQuery({
      queryKey: ['systemConfig'],
      queryFn: () => adminService.getConfig('mercadopago_config'),
   });

   useEffect(() => {
      if (remoteConfig?.mercadopago) {
         const newConfig = { ...DEFAULT_CONFIG, ...remoteConfig.mercadopago };
         
         // Correção automática: Se a URL gravada for da Vercel, forçamos a do Supabase
         if (newConfig.webhookUrl?.includes('vercel.app')) {
            newConfig.webhookUrl = DEFAULT_CONFIG.webhookUrl;
         }
         
         setConfig(newConfig);
      }
   }, [remoteConfig]);

   const saveMutation = useMutation({
      mutationFn: (newConfig: MpConfig) =>
         adminService.updateConfig('mercadopago_config', { mercadopago: newConfig }),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['systemConfig'] });
         alert('Configurações salvas com sucesso!');
      },
      onError: () => alert('Erro ao salvar configurações.'),
   });

   const handleSave = () => saveMutation.mutate(config);

   const testConnection = async () => {
      if (!config.accessToken) {
         alert('Insira o Access Token primeiro.');
         return;
      }
      
      setTestStatus('loading');
      setTestError('');
      setAccountInfo(null);

      try {
         const { data: { session } } = await supabase.auth.getSession();
         
         // Chamamos a Edge Function que servirá como proxy para evitar erro de CORS no navegador
         const { data, error } = await supabase.functions.invoke('mercadopago-payment', {
            body: { 
               action: 'test-connection', 
               accessToken: config.accessToken 
            },
            headers: session ? {
               Authorization: `Bearer ${session.access_token}`
            } : {}
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
      setConfig(prev => ({
         ...prev,
         enabledMethods: { ...prev.enabledMethods, [method]: !prev.enabledMethods[method] }
      }));
   };

   if (loading) return <div className="p-10 text-center animate-pulse text-xs font-black uppercase tracking-widest text-slate-700">Consultando chaves mestre...</div>;

   const PAYMENT_METHODS = [
      { key: 'pix' as const, label: 'Pix', icon: 'qr_code_2', desc: 'Transferência instantânea', color: 'text-green-400' },
      { key: 'credit_card' as const, label: 'Cartão de Crédito', icon: 'credit_card', desc: 'Visa, Master, Elo e outros', color: 'text-blue-400' },
      { key: 'debit_card' as const, label: 'Cartão de Débito', icon: 'contactless', desc: 'Débito direto em conta', color: 'text-cyan-400' },
      { key: 'boleto' as const, label: 'Boleto Bancário', icon: 'receipt_long', desc: 'Vencimento em 1-3 dias úteis', color: 'text-amber-400' },
   ];

   return (
      <div className="flex flex-col gap-10 animate-in fade-in duration-500">
         <header>
            <h1 className="text-4xl font-black tracking-tight uppercase">Parâmetros API</h1>
            <p className="text-slate-400 mt-2 text-sm">Integração Mercado Pago e métodos de pagamento aceitos.</p>
         </header>

         {/* Card principal de credenciais */}
         <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
            {/* Header do card */}
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
                     onClick={() => setConfig(prev => ({ ...prev, environment: prev.environment === 'sandbox' ? 'production' : 'sandbox' }))}
                     className={`w-14 h-7 rounded-full transition-all relative ${config.environment === 'production' ? 'bg-primary' : 'bg-slate-700'}`}
                  >
                     <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${config.environment === 'production' ? 'right-1' : 'left-1'}`}></span>
                  </button>
               </div>
            </div>

            <div className="p-8 flex flex-col gap-6">
               {/* Ambiente */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Ambiente</label>
                     <select
                        className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all text-sm appearance-none"
                        value={config.environment}
                        onChange={e => setConfig(prev => ({ ...prev, environment: e.target.value as 'sandbox' | 'production' }))}
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
                        value={config.applicationId}
                        onChange={e => setConfig(prev => ({ ...prev, applicationId: e.target.value }))}
                     />
                  </div>
               </div>

               {/* Public Key + Access Token */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Public Key</label>
                     <input
                        type="text"
                        className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all font-mono text-xs"
                        placeholder={config.environment === 'sandbox' ? 'TEST-xxxxxxxx-...' : 'APP_USR-xxxxxxxx-...'}
                        value={config.publicKey}
                        onChange={e => setConfig(prev => ({ ...prev, publicKey: e.target.value }))}
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
                        placeholder={config.environment === 'sandbox' ? 'TEST-xxxxxxxx-...' : 'APP_USR-xxxxxxxx-...'}
                        value={config.accessToken}
                        onChange={e => setConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                     />
                  </div>
               </div>

               {/* Webhook Secret */}
               <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Webhook Secret Key (Client Secret)</label>
                  <input
                     type={showTokens ? 'text' : 'password'}
                     className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all font-mono text-xs"
                     placeholder="Chave secreta para validar os webhooks do MP"
                     value={config.webhookSecret}
                     onChange={e => setConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
                  />
               </div>

               {/* Botão Testar + Status */}
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

               {/* Informações da conta (após teste bem-sucedido) */}
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

         {/* Métodos de pagamento */}
         <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col gap-6">
            <div>
               <h3 className="font-black text-white text-lg">Formas de Pagamento</h3>
               <p className="text-slate-500 text-xs mt-1">Selecione quais métodos serão exibidos no checkout aos clientes.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {PAYMENT_METHODS.map(method => (
                  <div
                     key={method.key}
                     onClick={() => toggleMethod(method.key)}
                     className={`group flex items-center gap-5 p-6 rounded-2xl border cursor-pointer transition-all select-none ${
                        config.enabledMethods[method.key]
                           ? 'border-primary/50 bg-primary/5'
                           : 'border-white/10 bg-white/5 hover:bg-white/10'
                     }`}
                  >
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${config.enabledMethods[method.key] ? 'bg-primary/20' : 'bg-white/5'}`}>
                        <span className={`material-symbols-outlined ${config.enabledMethods[method.key] ? 'text-primary' : method.color}`}>{method.icon}</span>
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className={`font-black text-sm ${config.enabledMethods[method.key] ? 'text-white' : 'text-slate-400'}`}>{method.label}</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{method.desc}</p>
                     </div>
                     <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${config.enabledMethods[method.key] ? 'border-primary bg-primary' : 'border-slate-600'}`}>
                        {config.enabledMethods[method.key] && <span className="material-symbols-outlined text-white text-sm">check</span>}
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Webhook URL */}
         <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col gap-4">
            <div>
               <h3 className="font-black text-white text-lg">Webhook Receiver</h3>
               <p className="text-slate-500 text-xs mt-1">Configure esta URL no painel do Mercado Pago para receber notificações de pagamento.</p>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
               <span className="material-symbols-outlined text-green-400 flex-shrink-0">link</span>
               <p className="font-mono text-[11px] text-green-400 break-all leading-relaxed flex-1">{config.webhookUrl}</p>
               <button
                  onClick={() => navigator.clipboard.writeText(config.webhookUrl)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex-shrink-0"
               >
                  Copiar
               </button>
            </div>
            {/* Instruções */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 flex flex-col gap-3">
               <p className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">info</span>
                  Instruções de Configuração
               </p>
               <ol className="flex flex-col gap-2 text-[11px] text-slate-400 list-decimal list-inside">
                  <li>Acesse o <a href="https://www.mercadopago.com.br/developers/panel" target="_blank" rel="noreferrer" className="text-primary hover:underline">Mercado Pago Developers</a> com sua conta.</li>
                  <li>Crie uma nova aplicação e copie o <strong className="text-white">Application ID</strong>, <strong className="text-white">Public Key</strong> e <strong className="text-white">Access Token</strong>.</li>
                  <li>Para webhooks, utilize a URL acima e configure os eventos do tipo <code className="bg-white/5 px-1 rounded text-primary">payment</code> e <code className="bg-white/5 px-1 rounded text-primary">mp-connect</code>.</li>
                  <li>Em ambiente Sandbox, use as <strong className="text-white">credenciais de teste</strong> e os cartões de teste do MP para validação.</li>
               </ol>
            </div>
         </div>

         {/* Botão salvar fixo */}
         <div className="sticky bottom-4 flex justify-end">
            <button
               onClick={handleSave}
               disabled={saveMutation.isPending}
               className="px-10 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
            >
               <span className="material-symbols-outlined text-sm">save</span>
               {saveMutation.isPending ? 'Sincronizando...' : 'Salvar Configurações'}
            </button>
         </div>
      </div>
   );
};
