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

   // Usuário atual para buscar créditos
   const userId = user?.id;
   const { data: availableCredits = [], isLoading: creditsLoading } = useQuery({
      queryKey: ['planCredits', userId],
      queryFn: () => userId ? supabaseService.getAvailablePlanCredits(userId) : [],
      enabled: !!userId,
   });

   if (loading || creditsLoading) return <div className="p-20 text-center animate-pulse">Consultando oráculo financeiro...</div>;

   const activePlan = userSub?.planos || plans.find(p => p.slug === 'free' || p.id === 'free');

   return (
      <div className="flex flex-col gap-10 animate-in fade-in duration-500">
         <header>
            <h1 className="text-4xl font-black tracking-tight">Meus Planos</h1>
            <p className="text-slate-400 mt-1">Gerencie seus pacotes de eventos e libere novos recursos.</p>
         </header>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-primary p-10 rounded-[2.5rem] text-white shadow-2xl shadow-primary/30 relative overflow-hidden">
               <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-10">
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Status da Conta</p>
                        <h2 className="text-5xl font-black">{activePlan?.name || activePlan?.nome || 'Plano Free'}</h2>
                     </div>
                     <span className="px-4 py-1.5 bg-white text-primary rounded-full text-[10px] font-black uppercase">{userSub ? 'Assinante' : 'Free Tier'}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-auto">
                     {availableCredits.length > 0 ? (
                        <div className="bg-black/20 p-4 rounded-2xl">
                           <p className="text-[10px] font-bold uppercase opacity-60 mb-2">Créditos Avulsos (Por Evento)</p>
                           <div className="flex flex-col gap-2">
                              {availableCredits.map(credit => (
                                 <div key={credit.plan.id} className="flex justify-between items-center bg-white/10 px-3 py-2 rounded-lg">
                                    <span className="font-bold text-sm">{credit.plan.name}</span>
                                    <span className="bg-white text-primary px-2 py-0.5 rounded text-xs font-black">{credit.available} disp.</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     ) : (
                        <div>
                           <p className="text-[10px] font-bold uppercase opacity-60">Faturamento Mensal</p>
                           <p className="text-lg font-bold">{(activePlan?.price || activePlan?.valor || 0) > 0 ? `R$ ${(activePlan?.price || activePlan?.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Grátis'}</p>
                        </div>
                     )}
                  </div>
               </div>
               {/* Decorative Circle */}
               <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 flex flex-col justify-center gap-4 text-center">
               <span className="material-symbols-outlined text-4xl text-primary">verified</span>
               <h4 className="font-black uppercase tracking-widest text-sm">Garantia PicFest</h4>
               <p className="text-xs text-slate-500 font-medium">Libere recursos premium para seus eventos com nossos pacotes avulsos ou assinaturas.</p>
            </div>
         </div>

         <section className="mt-10">
            <h3 className="text-xl font-black uppercase tracking-[0.2em] text-slate-500 mb-8 pl-1">Comprar Pacotes Avulsos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {plans.filter((p: any) => p.is_active !== false).map((p: any) => {
                  const features = p.features_json?.items || [
                     p.pode_baixar ? 'Download Liberado' : 'Sem Download',
                  ];
                  
                  const planName = p.name || p.nome || 'Plano';
                  const planPrice = p.price || p.valor || 0;
                  const isFree = planPrice === 0;

                    return (
                      <PricingCard
                         key={p.id}
                         name={planName}
                         price={planPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                         recurrence={p.billing_type === 'single_event' ? 'Por Evento' : (p.interval === 'month' ? 'Mensal' : 'Anual')}
                         featured={planName.toLowerCase() === 'fest'}
                         features={features}
                         buttonText={isFree ? 'Padrão' : 'Comprar Crédito'}
                         onClick={() => {
                            if (!isFree) {
                               window.location.hash = `#/dashboard/checkout/${p.id}`;
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
