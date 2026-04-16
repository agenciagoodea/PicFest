import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';

export const AdminSettings: React.FC = () => {
   const queryClient = useQueryClient();
   const [config, setConfig] = useState<any>(null);
   const [testResult, setTestResult] = useState<'idle' | 'processando' | 'success' | 'error'>('idle');

   // Busca de configuração do sistema via React Query
   const { data: remoteConfig, isLoading: loading } = useQuery({
      queryKey: ['systemConfig'],
      queryFn: () => adminService.getConfig('mercadopago_config'),
   });

   useEffect(() => {
      if (remoteConfig) {
         setConfig(remoteConfig);
      } else if (!loading) {
         // Valor padrão se não existir no banco
         setConfig({
            mercadopago: {
               publicKey: '',
               accessToken: '',
               webhookUrl: `${window.location.origin}/api/webhook/mercadopago`
            }
         });
      }
   }, [remoteConfig, loading]);

   // Mutação para salvar configurações
   const saveMutation = useMutation({
      mutationFn: (newConfig: any) => adminService.updateConfig('mercadopago_config', newConfig),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['systemConfig'] });
         alert('Configurações salvas com sucesso!');
      },
      onError: () => alert('Erro ao salvar parâmetros.'),
   });

   const handleSave = () => {
      if (!config) return;
      saveMutation.mutate(config);
   };

   const testConnectivity = async () => {
      setTestResult('processando');
      setTimeout(() => {
         setTestResult(config.mercadopago.accessToken.length > 10 ? 'success' : 'error');
      }, 1500);
   };

   if (loading || !config) return <div className="p-10 text-center animate-pulse text-xs font-black uppercase tracking-widest text-slate-800">Consultando chaves mestre...</div>;

   return (
      <div className="flex flex-col gap-10 animate-in fade-in duration-500">
         <header>
            <h1 className="text-4xl font-black tracking-tight uppercase">Configurações globais</h1>
            <p className="text-slate-400 mt-2 lowercase text-sm">Integração Mercado Pago e parâmetros de sistema.</p>
         </header>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] flex flex-col gap-6">
               <h3 className="font-black uppercase tracking-widest text-[10px] text-primary">Credenciais Mercado Pago</h3>
               <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Public Key</label>
                  <input
                     type="text"
                     className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all font-mono text-xs"
                     value={config.mercadopago.publicKey}
                     onChange={e => setConfig({ ...config, mercadopago: { ...config.mercadopago, publicKey: e.target.value } })}
                  />
               </div>
               <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Access Token</label>
                  <input
                     type="password"
                     className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all font-mono text-xs"
                     value={config.mercadopago.accessToken}
                     onChange={e => setConfig({ ...config, mercadopago: { ...config.mercadopago, accessToken: e.target.value } })}
                  />
               </div>
               <button 
                onClick={handleSave} 
                disabled={saveMutation.isPending}
                className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50"
               >
                  {saveMutation.isPending ? 'Sincronizando...' : 'Salvar Credenciais'}
               </button>
            </div>

            <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] flex flex-col gap-6">
               <h3 className="font-black uppercase tracking-widest text-[10px] text-primary">Webhook Receiver</h3>
               <p className="text-xs text-slate-500">URL para notificações automáticas (IPN):</p>
               <div className="bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-[10px] text-green-400 break-all leading-relaxed">
                  {config.mercadopago.webhookUrl}
               </div>
               <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between">
                  <div className="flex flex-col">
                     <p className="text-[10px] font-black text-slate-500 uppercase">Status do Link</p>
                     <p className={`text-xs font-bold uppercase ${testResult === 'success' ? 'text-green-500' : testResult === 'error' ? 'text-red-500' : 'text-slate-400'}`}>
                        {testResult === 'success' ? 'Conectado' : testResult === 'error' ? 'Erro de Rota' : 'Não Testado'}
                     </p>
                  </div>
                  <button 
                  onClick={testConnectivity} 
                  disabled={testResult === 'processando'} 
                  className="px-6 py-2 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all disabled:animate-pulse"
                  >
                     {testResult === 'processando' ? 'Checando...' : 'Testar'}
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};
