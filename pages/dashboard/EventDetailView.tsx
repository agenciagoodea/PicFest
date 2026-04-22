import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '../../services/supabaseService';
import { getOptimizedImageUrl } from '../../utils/imageUtils';
import { useAuth } from '../../hooks/useAuth';
import { AddonCatalog } from '../../components/dashboard/AddonCatalog';
import { PlanAddonCatalog, Evento } from '../../types';

interface EventDetailViewProps {
   userSub: any;
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({ userSub }) => {
   const { id } = useParams();
   const queryClient = useQueryClient();
   const navigate = useNavigate();
   const [showAddons, setShowAddons] = React.useState(false);

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

   // Mutação para excluir o evento
   const deleteEventMutation = useMutation({
      mutationFn: () => id ? supabaseService.deleteEvent(id) : Promise.resolve(false),
      onSuccess: (success) => {
         if (success) {
            alert('Evento excluído com sucesso.');
            navigate('/dashboard/eventos');
         } else {
            alert('Erro ao excluir evento.');
         }
      },
      onError: (err: any) => alert('Erro: ' + err.message),
   });

   // Mutação para atualizar a logo
   const updateLogoMutation = useMutation({
      mutationFn: (file: File) => id ? supabaseService.uploadEventLogo(id, file) : Promise.resolve({ data: null, error: 'ID inválido' }),
      onSuccess: (res) => {
         if (res.error) {
            alert('Erro: ' + res.error);
         } else {
            queryClient.invalidateQueries({ queryKey: ['event', id] });
            alert('Logo atualizada com sucesso!');
         }
      },
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
                  <h1 className="text-4xl font-black tracking-tight italic uppercase text-white">{event?.nome || 'Gerenciar Evento'}</h1>
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
                   className="p-3 bg-white/5 rounded-xl hover:text-primary transition-all text-slate-400"
                   title="Atualizar"
                >
                   <span className="material-symbols-outlined text-sm">refresh</span>
                </button>
                <Link
                   to={`/dashboard/eventos/${id}/guestbook`}
                   className="p-3 bg-white/5 rounded-xl hover:text-primary transition-all text-slate-400 group flex items-center gap-2 border border-white/5"
                   title="Livro de Assinaturas"
                >
                   <span className="material-symbols-outlined text-sm">menu_book</span>
                   <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Mensagens</span>
                </Link>
                <Link
                   to={`/dashboard/eventos/${id}/vitrine`}
                   className="p-3 bg-white/5 rounded-xl hover:text-primary transition-all text-slate-400 group flex items-center gap-2 border border-white/5"
                   title="Personalizar Vitrine"
                >
                   <span className="material-symbols-outlined text-sm">palette</span>
                   <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Vitrine</span>
                </Link>
                <button
                   onClick={() => {
                      if (confirm('ATENÇÃO: Deseja realmente excluir este evento? Todos os registros, mídias e o guestbook serão apagados permanentemente.')) {
                         deleteEventMutation.mutate();
                      }
                   }}
                   className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all group"
                   title="Excluir Evento"
                >
                   <span className="material-symbols-outlined text-sm group-hover:animate-bounce">delete_forever</span>
                </button>
                {id && <Link to={`/live/${id}`} target="_blank" className="px-6 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">Abrir Telão</Link>}
            </div>
         </header>

         {/* GESTÃO DE IDENTIDADE (LOGO) */}
         <div className="flex items-center gap-6 p-6 bg-white/5 rounded-[2rem] border border-white/10 shadow-2xl">
            <div 
               className="relative group cursor-pointer"
               onClick={() => document.getElementById('logo-update-input')?.click()}
            >
               <div className="w-24 h-24 bg-black/40 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center transition-all group-hover:border-primary shadow-inner">
                   {event?.logo_url ? (
                       <img src={event.logo_url} className="w-full h-full object-cover" />
                   ) : (
                       <span className="material-symbols-outlined text-slate-700 !text-3xl">add_photo_alternate</span>
                   )}
               </div>
               <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                   <span className="material-symbols-outlined text-white text-sm">edit</span>
               </div>
               <input 
                  id="logo-update-input"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) updateLogoMutation.mutate(file);
                  }}
               />
            </div>
            <div>
               <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">Identidade do Evento</h2>
               <p className="text-slate-500 text-xs mt-1 font-medium leading-relaxed">Sua logo aparece no telão, QR Code e materiais impressos. <br/>Use uma imagem quadrada (1:1) para melhor resultado.</p>
               <button 
                  onClick={() => document.getElementById('logo-update-input')?.click()}
                  className="mt-3 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-white/20 transition-all"
               >
                   {event?.logo_url ? 'Alterar Logo' : 'Adicionar Logo'}
               </button>
            </div>
         </div>

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
                      onClick={() => setShowAddons(!showAddons)}
                      className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${showAddons ? 'bg-white/10 text-white' : 'bg-primary text-white shadow-primary/20 hover:scale-105'}`}
                   >
                      <span className="material-symbols-outlined text-[14px]">{showAddons ? 'close' : 'add_shopping_cart'}</span> 
                      {showAddons ? 'Fechar Catálogo' : 'Expandir Limites'}
                   </button>
                </div>
            </div>

            {/* CATÁLOGO MINI DE ADDONS */}
            {showAddons && (
                <div className="bg-black/40 border border-primary/20 p-6 rounded-[2rem] animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary">rocket_launch</span>
                        </div>
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-tight text-white italic">Turbine seu Evento</h4>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Escolha um pacote e receba aprovação instantânea.</p>
                        </div>
                    </div>
                    
                    <AddonCatalog 
                        eventId={id!} 
                        onSelect={(addon: PlanAddonCatalog) => {
                            // Redireciona para o checkout com os parâmetros de addon
                            navigate(`/dashboard/checkout/addon?addon_id=${addon.id}&evento_id=${id}`);
                        }} 
                    />
                </div>
            )}
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
                        onError={(e) => {
                           const target = e.target as HTMLImageElement;
                           if (target.src !== m.url) {
                              target.src = m.url;
                           }
                        }}
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
