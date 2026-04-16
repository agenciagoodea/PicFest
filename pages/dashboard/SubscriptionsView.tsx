import React, { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '../../App';
import { supabaseService } from '../../services/supabaseService';
import { mercadoPagoService } from '../../services/mercadoPagoService';
import { PricingCard } from '../../components/common/PricingCard';

interface SubscriptionsViewProps {
   userSub: any;
   onUpdateSub: () => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ userSub, onUpdateSub }) => {
   const { user } = useContext(AuthContext);

   // Busca de planos via React Query
   const { data: plans = [], isLoading: loading } = useQuery({
      queryKey: ['plans'],
      queryFn: () => supabaseService.getPlans(),
   });

   if (loading) return <div className="p-20 text-center animate-pulse">Consultando oráculo financeiro...</div>;

   const activePlan = userSub?.planos || plans.find(p => p.id === 'free');

   return (
      <div className="flex flex-col gap-10 animate-in fade-in duration-500">
         <header>
            <h1 className="text-4xl font-black tracking-tight">Assinatura & Planos</h1>
            <p className="text-slate-400 mt-1">Gerencie seu plano atual e libere novos recursos.</p>
         </header>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-primary p-10 rounded-[2.5rem] text-white shadow-2xl shadow-primary/30 relative overflow-hidden">
               <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-10">
                     <div>
                        <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">Seu Plano Atual</p>
                        <h2 className="text-5xl font-black">{activePlan?.nome || 'Plano Gratuito'}</h2>
                     </div>
                     <span className="px-4 py-1.5 bg-white text-primary rounded-full text-xs font-black uppercase">{userSub ? 'Ativo' : 'Free Tier'}</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-auto">
                     <div>
                        <p className="text-[10px] font-bold uppercase opacity-60">Faturamento</p>
                        <p className="text-lg font-bold">{activePlan?.valor > 0 ? `R$ ${activePlan.valor.toFixed(2)}` : 'Grátis'}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-bold uppercase opacity-60">Próximo Vencimento</p>
                        <p className="text-lg font-bold">{userSub?.data_expiracao ? new Date(userSub.data_expiracao).toLocaleDateString('pt-BR') : '--/--/----'}</p>
                     </div>
                  </div>
               </div>
               {/* Decorative Circle */}
               <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 flex flex-col justify-center gap-4 text-center">
               <span className="material-symbols-outlined text-4xl text-primary">verified</span>
               <h4 className="font-black uppercase tracking-widest text-sm">Garantia PicFest</h4>
               <p className="text-xs text-slate-500 font-medium">Upgrade instantâneo. Sem taxas ocultas. Cancele quando desejar.</p>
            </div>
         </div>

         <section className="mt-10">
            <h3 className="text-xl font-black uppercase tracking-[0.2em] text-slate-500 mb-8 pl-1">Upgrade Disponível</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {plans.map((p: any) => {
                  const features = [
                     `${p.limite_eventos === 0 ? 'Eventos Ilimitados' : `Até ${p.limite_eventos} Eventos`}`,
                     `${p.limite_midias === 0 ? 'Mídias Ilimitadas' : `Até ${p.limite_midias} Mídias`}`,
                     p.pode_baixar ? 'Download em Lote Liberado' : 'Apenas Visualização Realtime',
                     'Suporte prioritário',
                     'Personalização de QR Code'
                  ];

                    return (
                      <PricingCard
                         key={p.id}
                         name={p.nome}
                         price={p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                         recurrence={p.recorrencia}
                         featured={p.nome.toLowerCase().includes('pro')}
                         features={features}
                         buttonText={activePlan?.id === p.id ? 'Seu Plano Atual' : (p.valor === 0 ? 'Mudar para este' : 'Assinar agora')}
                         onClick={() => {
                            if (activePlan?.id !== p.id) {
                               if (p.valor === 0) {
                                  // Lógica para plano free se necessário
                                  alert('Plano alterado!');
                               } else {
                                  window.location.hash = `#/dashboard/checkout/${p.id}`;
                               }
                            }
                         }}
                      />
                   );
               })}
            </div>
         </section>
      </div>
   );
};
