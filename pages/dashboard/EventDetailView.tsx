import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '../../services/supabaseService';
import { getOptimizedImageUrl } from '../../utils/imageUtils';
import { useAuth } from '../../hooks/useAuth';

interface EventDetailViewProps {
   userSub: any;
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({ userSub }) => {
   const { id } = useParams();
   const queryClient = useQueryClient();

   // Busca do evento com o plano
   const { data: event, isLoading: eventLoading } = useQuery({
      queryKey: ['event', id],
      queryFn: () => id ? supabaseService.getEventWithPlan(id) : null,
      enabled: !!id,
   });

   // Busca limites consolidados (Plano + Adicionais)
   const { data: limitsData, isLoading: limitsLoading } = useQuery({
      queryKey: ['eventLimits', id],
      queryFn: () => id ? supabaseService.getEventOperationalLimits(id) : null,
      enabled: !!id,
   });

   // Usuário atual para buscar créditos
   const { user } = useAuth();
   const userId = user?.id;

   // Busca créditos disponíveis (planos comprados, mas não utilizados)
   const { data: availableCredits = [] } = useQuery({
      queryKey: ['planCredits', userId],
      queryFn: () => userId ? supabaseService.getAvailablePlanCredits(userId) : [],
      enabled: !!userId,
   });

   // Mutação para vincular plano ao evento
   const assignPlanMutation = useMutation({
      mutationFn: (plan: any) => supabaseService.assignPlanToEvent(id!, plan),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['event', id] });
         queryClient.invalidateQueries({ queryKey: ['planCredits', userId] });
         alert('Plano vinculado com sucesso ao evento!');
      },
      onError: () => alert('Erro ao vincular plano.'),
   });

   // Busca de mídias via React Query
   const { data: media = [], isLoading: mediaLoading } = useQuery({
      queryKey: ['media', id],
      queryFn: () => id ? supabaseService.getMediaByEvent(id, false) : [],
      enabled: !!id,
   });

   const loading = mediaLoading || eventLoading || limitsLoading;

   // Mutação para aprovar mídia
   const approveMutation = useMutation({
      mutationFn: (mediaId: string) => supabaseService.approveMedia(mediaId, true),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['media', id] });
      },
      onError: () => alert('Erro ao aprovar mídia'),
   });

   // Mutação para excluir mídia
   const deleteMutation = useMutation({
      mutationFn: (mediaId: string) => supabaseService.deleteMedia(mediaId),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['media', id] });
      },
      onError: () => alert('Erro ao excluir mídia'),
   });

   const handleApprove = (mediaId: string) => {
      approveMutation.mutate(mediaId);
   };

   const handleDelete = (mediaId: string) => {
      if (!confirm('Deseja realmente excluir esta mídia? Ela será removida permanentemente.')) return;
      deleteMutation.mutate(mediaId);
   };

   if (loading) return (
      <div className="p-20 flex flex-col items-center justify-center gap-4">
         <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
         <p className="uppercase tracking-widest text-[10px] font-black text-slate-500">Recuperando registros...</p>
      </div>
   );

   return (
      <div className="flex flex-col gap-10 animate-in fade-in duration-500">
         <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 border-b border-white/5">
            <div>
               <div className="flex items-center gap-3 mb-2">
                  <Link to="/dashboard/eventos" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                     <span className="material-symbols-outlined text-sm">arrow_back</span>
                  </Link>
                  <h1 className="text-4xl font-black tracking-tight italic uppercase">{event?.nome || 'Gerenciar Evento'}</h1>
               </div>
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">tag</span> {event?.slug_curto || id} •
                  <span className="material-symbols-outlined text-sm">photo_library</span> {media.length} fotos
                  {event?.plan_snapshot && (
                     <>
                        <span className="mx-2 opacity-30">|</span>
                        <span className="text-primary bg-primary/10 px-2 py-0.5 rounded">
                           Plano: {event.plan_snapshot.name}
                        </span>
                     </>
                  )}
               </p>
            </div>
            <div className="flex gap-4">
                <button
                   onClick={() => queryClient.invalidateQueries({ queryKey: ['media', id] })}
                   className="p-3 bg-white/5 rounded-xl hover:text-primary transition-all"
                >
                   <span className="material-symbols-outlined text-sm">refresh</span>
                </button>
               {event?.plan_snapshot?.limits_json?.download || event?.plan_snapshot?.features_json?.download_files ? (
                  <button className="px-6 py-3 border border-white/10 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all">Exportar Tudo</button>
               ) : (
                  <Link
                     to={`/dashboard/assinaturas`}
                     className="px-6 py-3 border border-white/10 rounded-xl font-black text-xs uppercase tracking-widest opacity-80 hover:bg-orange-500/10 hover:text-orange-500 transition-all flex items-center gap-2"
                  >
                     <span className="material-symbols-outlined text-xs">lock</span> Liberar Exportação
                  </Link>
               )}
               {id && <Link to={`/live/${id}`} target="_blank" className="px-6 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">Abrir Telão</Link>}
            </div>
         </header>

         {/* PAINEL DE LIMITES E USO (NOVO DESIGN) */}
         <div className="flex flex-col gap-4">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-primary">data_usage</span>
                Uso e Limites
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Cartão FOTOS */}
                <div className="bg-black/20 border border-white/5 p-6 rounded-3xl flex flex-col gap-4">
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">photo_library</span> Fotos
                            </span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-4xl font-black text-white">{event?.media_count_photos || 0}</span>
                                <span className="text-sm font-bold text-slate-500">/ {limitsData?.final_photos ?? (event?.plan_snapshot?.limits_json?.photos || 20)}</span>
                            </div>
                        </div>
                        {limitsData?.extra_photos > 0 && (
                            <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded uppercase tracking-wider">
                                +{limitsData.extra_photos} Adicionais
                            </span>
                        )}
                    </div>
                    
                    <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/5 relative">
                        {(() => {
                           const max = limitsData?.final_photos ?? (event?.plan_snapshot?.limits_json?.photos || 20);
                           const curr = event?.media_count_photos || 0;
                           const pct = max > 0 ? Math.min(100, Math.round((curr / max) * 100)) : 100;
                           const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-orange-500' : 'bg-blue-500';
                           return <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${pct}%` }}></div>;
                        })()}
                    </div>
                </div>

                {/* Cartão VÍDEOS */}
                <div className="bg-black/20 border border-white/5 p-6 rounded-3xl flex flex-col gap-4">
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">videocam</span> Vídeos
                            </span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-4xl font-black text-white">{event?.media_count_videos || 0}</span>
                                <span className="text-sm font-bold text-slate-500">/ {limitsData?.final_videos ?? (event?.plan_snapshot?.limits_json?.videos || 5)}</span>
                            </div>
                        </div>
                        {limitsData?.extra_videos > 0 && (
                            <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded uppercase tracking-wider">
                                +{limitsData.extra_videos} Adicionais
                            </span>
                        )}
                    </div>
                    
                    <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/5 relative">
                        {(() => {
                           const max = limitsData?.final_videos ?? (event?.plan_snapshot?.limits_json?.videos || 5);
                           const curr = event?.media_count_videos || 0;
                           const pct = max > 0 ? Math.min(100, Math.round((curr / max) * 100)) : 100;
                           const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-orange-500' : 'bg-orange-500'; // orange default para vídeo
                           return <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${pct}%` }}></div>;
                        })()}
                    </div>
                </div>
            </div>

            {/* Ações de Upgrade e Créditos Originais */}
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                <div className="flex flex-col">
                    <span className="text-xs font-black text-white uppercase tracking-widest text-primary">Plano Atual: {event?.plan_snapshot?.name || 'Free'}</span>
                    <span className="text-[10px] text-slate-400 mt-1">Lembrando que fotos e vídeos reprovados não consomem seu limite.</span>
                </div>
                <div className="flex flex-wrap gap-2">
                   {availableCredits.map(credit => (
                      <button
                         key={credit.plan.id}
                         disabled={assignPlanMutation.isPending || event?.plan_id === credit.plan.id}
                         onClick={() => !event?.plan_id || confirm('Tem certeza que deseja aplicar um novo plano a este evento?') ? assignPlanMutation.mutate(credit.plan) : null}
                         className="px-4 py-2 bg-white/10 text-white border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all disabled:opacity-50"
                      >
                         Usar Crédito {credit.plan.name}
                      </button>
                   ))}
                   
                   <button
                      onClick={() => alert('Em breve: Modal de seleção rápida de pacotes (Addons) integrada com Mercado Pago Checkout Transparente. Por enquanto você pode gerir limites via Admin.')}
                      className="px-4 py-2 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                   >
                      <span className="material-symbols-outlined text-[14px]">add_shopping_cart</span> Expandir Limites
                   </button>
                </div>
            </div>
         </div>

         {/* Grid de Moderação de Mídia Otimizado */}
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {media.length === 0 ? (
               <div className="col-span-full py-40 text-center flex flex-col items-center gap-4">
                  <span className="material-symbols-outlined text-6xl text-slate-800">no_photography</span>
                  <p className="text-slate-500 font-bold uppercase tracking-widest italic">Nenhuma mídia capturada até o momento.</p>
                  <p className="text-[10px] text-slate-600 uppercase font-black">Divulgue o QR Code para seus convidados!</p>
               </div>
            ) : media.map((m) => {
               // Usando versão otimizada para o grid (width 400px)
               const thumbUrl = getOptimizedImageUrl(m.url, { width: 400, quality: 75 });
               
               return (
                  <div key={m.id} className="group relative aspect-square bg-slate-900 rounded-[2rem] overflow-hidden border border-white/5 hover:border-primary/50 transition-all shadow-xl">
                     <img 
                        src={thumbUrl} 
                        className={`w-full h-full object-cover transition-all duration-700 ${!m.aprovado ? 'grayscale brightness-50 contrast-125' : 'group-hover:scale-110'}`} 
                        loading="lazy"
                        alt="Memória do evento"
                     />
                     
                     {!m.aprovado && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                           <span className="px-4 py-1.5 bg-orange-500 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-2xl">Aguardando</span>
                        </div>
                     )}

                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 z-20">
                        {!m.aprovado ? (
                           <button
                              onClick={() => handleApprove(m.id)}
                              className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-primary/30"
                              title="Aprovar Foto"
                           >
                              <span className="material-symbols-outlined">check_circle</span>
                           </button>
                        ) : (
                           <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">verified</span> Aprovado
                           </span>
                        )}
                        <button
                           onClick={() => handleDelete(m.id)}
                           className="w-12 h-12 bg-red-500/20 text-red-500 border border-red-500/20 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                           title="Excluir Permanentemente"
                        >
                           <span className="material-symbols-outlined">delete</span>
                        </button>
                        <a 
                           href={m.url} 
                           target="_blank" 
                           rel="noreferrer" 
                           className="text-[8px] font-black uppercase text-slate-500 hover:text-white transition-colors"
                        >
                           Ver Original
                        </a>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
   );
};
