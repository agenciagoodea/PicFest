import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabaseClient';
import { adminService } from '../../services/adminService';

export const AdminPayments: React.FC = () => {
   const [tab, setTab] = useState<'payments' | 'webhooks'>('payments');

   // Busca de pagamentos
   const { data: payments = [], isLoading: loadingPayments } = useQuery({
      queryKey: ['adminPayments'],
      queryFn: async () => {
         const { data, error } = await supabase
            .from('payments')
            .select('*, plans(name), tenants(name)')
            .order('created_at', { ascending: false });
         if (error) throw error;
         return data;
      }
   });

   // Busca de webhooks
   const { data: webhooks = [], isLoading: loadingWebhooks } = useQuery({
      queryKey: ['adminWebhooks'],
      queryFn: async () => {
         const { data, error } = await supabase
            .from('webhook_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
         if (error) throw error;
         return data;
      }
   });

   const getStatusStyle = (status: string) => {
      switch (status) {
         case 'approved': return 'bg-green-500/10 text-green-500';
         case 'pending': return 'bg-yellow-500/10 text-yellow-500';
         case 'rejected':
         case 'cancelled': return 'bg-red-500/10 text-red-500';
         default: return 'bg-slate-500/10 text-slate-500';
      }
   };

   return (
      <div className="flex flex-col gap-8 animate-in fade-in duration-500">
         <header className="flex flex-col gap-2">
            <h1 className="text-4xl font-black tracking-tight uppercase">Fluxo de Caixa</h1>
            <p className="text-slate-400 text-sm">Monitoramento de transações e integridade dos webhooks.</p>
         </header>

         {/* Alterne entre Pagamentos e Webhooks */}
         <div className="flex gap-4 p-1.5 bg-white/5 border border-white/10 rounded-2xl w-fit">
            <button 
               onClick={() => setTab('payments')}
               className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'payments' ? 'bg-primary text-white' : 'text-slate-500 hover:text-white'}`}
            >
               Pagamentos
            </button>
            <button 
               onClick={() => setTab('webhooks')}
               className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'webhooks' ? 'bg-primary text-white' : 'text-slate-500 hover:text-white'}`}
            >
               Webhooks
            </button>
         </div>

         {tab === 'payments' ? (
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                           <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Data</th>
                           <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Organizador</th>
                           <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Plano</th>
                           <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Valor</th>
                           <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Método</th>
                           <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                           <th className="px-8 py-6 text-[10px] text-right font-black uppercase tracking-widest text-slate-500">Ações</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {loadingPayments ? (
                           <tr><td colSpan={7} className="px-8 py-10 text-center text-xs animate-pulse">Sincronizando extrato...</td></tr>
                        ) : payments.length === 0 ? (
                           <tr><td colSpan={7} className="px-8 py-10 text-center text-xs text-slate-500">Nenhum pagamento registrado ainda.</td></tr>
                        ) : payments.map((p: any) => (
                           <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="px-8 py-6 text-xs text-slate-300 font-medium">
                                 {new Date(p.created_at).toLocaleDateString('pt-BR')}
                                 <span className="block text-[10px] text-slate-500 mt-1">{new Date(p.created_at).toLocaleTimeString('pt-BR')}</span>
                              </td>
                              <td className="px-8 py-6">
                                 <p className="text-xs font-black text-white">{p.tenants?.name || 'Sistema'}</p>
                                 <p className="text-[10px] text-slate-500 font-mono mt-1">{p.payer_email}</p>
                              </td>
                              <td className="px-8 py-6">
                                 <span className="text-[10px] font-black uppercase px-2 py-1 bg-white/5 rounded-md text-slate-400 border border-white/5">{p.plans?.name}</span>
                              </td>
                              <td className="px-8 py-6 text-sm font-black text-white">R$ {p.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-slate-500">{p.payment_method === 'pix' ? 'qr_code_2' : 'credit_card'}</span>
                                    <span className="text-[10px] font-bold uppercase text-slate-400">{p.payment_method}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusStyle(p.status)}`}>
                                    {p.status}
                                 </span>
                              </td>
                              <td className="px-8 py-6 text-right">
                                 {p.status !== 'approved' && p.mercado_pago_payment_id && (
                                    <button 
                                      onClick={async () => {
                                        try {
                                          const el = document.getElementById(`sync-btn-${p.id}`);
                                          if(el) el.innerHTML = 'SYNC...';
                                          await adminService.syncMercadoPago(p.mercado_pago_payment_id);
                                          if(el) el.innerHTML = 'OK!';
                                          setTimeout(() => window.location.reload(), 1000);
                                        } catch (e: any) {
                                          alert(e.message || 'Erro ao sincronizar');
                                        }
                                      }}
                                      id={`sync-btn-${p.id}`}
                                      className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                      Sincronizar API
                                    </button>
                                 )}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         ) : (
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                           <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Data</th>
                           <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Tópico / Ação</th>
                           <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Resource ID</th>
                           <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Status Webhook</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {loadingWebhooks ? (
                           <tr><td colSpan={4} className="px-8 py-10 text-center text-xs animate-pulse">Monitorando pulso das APIs...</td></tr>
                        ) : webhooks.length === 0 ? (
                           <tr><td colSpan={4} className="px-8 py-10 text-center text-xs text-slate-500">Aguardando eventos do Mercado Pago.</td></tr>
                        ) : webhooks.map((w: any) => (
                           <tr key={w.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="px-8 py-6 text-xs text-slate-300">
                                 {new Date(w.created_at).toLocaleString('pt-BR')}
                              </td>
                              <td className="px-8 py-6">
                                 <div className="flex flex-col">
                                    <span className="text-xs font-black text-white">{w.topic}</span>
                                    <span className="text-[10px] text-slate-500 uppercase font-bold">{w.action}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-6 font-mono text-xs text-primary">{w.mercado_pago_resource_id}</td>
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${w.processed ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                    <span className={`text-[10px] font-black uppercase ${w.processed ? 'text-green-500' : 'text-red-500'}`}>
                                       {w.processed ? 'Processado' : 'Falhou / Pendente'}
                                    </span>
                                 </div>
                                 {w.error_message && <p className="text-[9px] text-red-400 mt-1 max-w-xs truncate">{w.error_message}</p>}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}
      </div>
   );
};
