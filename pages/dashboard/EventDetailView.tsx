import React, { useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '../../services/supabaseService';
import { getOptimizedImageUrl } from '../../utils/imageUtils';
import { useAuth } from '../../hooks/useAuth';
import { AddonCatalog } from '../../components/dashboard/AddonCatalog';
import { PlanAddonCatalog, Evento } from '../../types';
import { QRModal } from '../../components/common/QRModal';
import { MediaLightbox } from '../../components/dashboard/MediaLightbox';
import { supabase } from '../../services/supabaseClient';

interface EventDetailViewProps {
   userSub: any;
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({ userSub }) => {
   const { id } = useParams();
   const queryClient = useQueryClient();
   const navigate = useNavigate();
   const [showAddons, setShowAddons] = React.useState(false);
   const [showQRModal, setShowQRModal] = React.useState(false);
   const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
   const [msgText, setMsgText] = React.useState('');
   const [msgSaving, setMsgSaving] = React.useState(false);
   const [msgSaved, setMsgSaved] = React.useState(false);
   const msgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

   // Botão Voltar com fallback seguro
   const handleBack = useCallback(() => {
      if (window.history.length > 2) {
         navigate(-1);
      } else {
         navigate('/dashboard/eventos');
      }
   }, [navigate]);


   // Busca do evento com o plano
   const { data: event, isLoading: eventLoading } = useQuery({
      queryKey: ['event', id],
      queryFn: () => id ? supabaseService.getEventWithPlan(id) : null,
      enabled: !!id,
   });

   const currentEventUrl = event?.slug_curto ? `${window.location.origin}/#/evento/${event.slug_curto}` : '';

   const handleCopyLink = () => {
      if (!currentEventUrl) return;
      navigator.clipboard.writeText(currentEventUrl);
      alert('Link do evento copiado com sucesso!');
   };

   // Sincronizar mensagem com os dados do evento quando carregado
   useEffect(() => {
      if (event && (event as any).mensagem_convidados !== undefined) {
         setMsgText((event as any).mensagem_convidados || '');
      }
   }, [event?.id]);

   // Auto-save com debounce de 800ms
   const handleMsgChange = (val: string) => {
      setMsgText(val);
      setMsgSaved(false);
      if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
      msgTimerRef.current = setTimeout(async () => {
         if (!id) return;
         setMsgSaving(true);
         try {
            await supabase.from('eventos').update({ mensagem_convidados: val }).eq('id', id);
            setMsgSaved(true);
            setTimeout(() => setMsgSaved(false), 3000);
         } finally {
            setMsgSaving(false);
         }
      }, 800);
   };

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
         <header className="flex flex-col gap-8 pb-10 border-b border-white/5">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                   <div className="flex items-center gap-3 mb-2">
                      <button onClick={handleBack} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                         <span className="material-symbols-outlined text-sm">arrow_back</span>
                      </button>
                      <h1 className="text-4xl font-black tracking-tight italic uppercase text-white">{event?.nome || 'Gerenciar Evento'}</h1>
                   </div>
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">tag</span> {event?.slug_curto || id} •
                      <span className="material-symbols-outlined text-sm">photo_library</span> {media.length} mídias
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
                
                <div className="flex items-center gap-3">
                   <div className="hidden sm:flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 h-11">
                      <span className="material-symbols-outlined text-[14px] text-slate-500">link</span>
                      <span className="text-[10px] font-mono text-slate-400 max-w-[150px] truncate">{currentEventUrl}</span>
                   </div>

                   <button
                      onClick={handleCopyLink}
                      className="h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                      title="Copiar Link"
                   >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                      <span className="hidden md:inline">Copiar Link</span>
                   </button>

                   <button
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['media', id] })}
                      className="w-11 h-11 bg-white/5 rounded-xl hover:text-primary transition-all text-slate-400 border border-white/5 flex items-center justify-center"
                      title="Atualizar"
                   >
                      <span className="material-symbols-outlined text-sm">refresh</span>
                   </button>
                   
                   <button
                      onClick={() => {
                         if (confirm('ATENÇÃO: Deseja realmente excluir este evento? Todos os registros, mídias e o guestbook serão apagados permanentemente.')) {
                            deleteEventMutation.mutate();
                         }
                      }}
                      className="w-11 h-11 bg-red-500/5 border border-red-500/10 text-red-500/40 rounded-xl hover:bg-red-500 hover:text-white transition-all group flex items-center justify-center"
                      title="Excluir Evento"
                   >
                      <span className="material-symbols-outlined text-sm">delete_forever</span>
                   </button>
                </div>
             </div>
          </header>

          <div className="flex flex-col lg:flex-row gap-4">
             <div id="logo-section" className="flex-1 flex items-center gap-6 p-6 bg-white/5 rounded-[2rem] border border-white/10 shadow-2xl">
               <style>{`
                  .checkerboard {
                     background-image: linear-gradient(45deg, #2a2a2a 25%, transparent 25%), 
                                     linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), 
                                     linear-gradient(45deg, transparent 75%, #2a2a2a 75%), 
                                     linear-gradient(-45deg, transparent 75%, #2a2a2a 75%);
                     background-size: 20px 20px;
                     background-position: 0 0, 0 10px, 10px 10px, 10px 0;
                     background-color: #1a1a1a;
                  }
               `}</style>
               <div 
                  className="relative group cursor-pointer flex-shrink-0"
                  onClick={() => document.getElementById('logo-update-input')?.click()}
               >
                  <div className={`w-20 h-20 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center transition-all group-hover:border-primary shadow-inner ${event?.logo_url ? 'checkerboard' : 'bg-black/20'}`}>
                      {event?.logo_url ? (
                          <img src={event.logo_url} className="w-full h-full object-contain" />
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
                  <h2 className="text-lg font-black uppercase italic tracking-tighter text-white leading-none">Identidade</h2>
                  <p className="text-slate-500 text-[9px] mt-1.5 font-bold uppercase tracking-wider leading-relaxed">Logo do seu PicFest.</p>
                  <button 
                     onClick={() => document.getElementById('logo-update-input')?.click()}
                     className="mt-2.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:border-white/20 transition-all"
                  >
                      {event?.logo_url ? 'Alterar' : 'Adicionar'}
                  </button>
               </div>
            </div>

            {/* AÇÕES PRINCIPAIS REORGANIZADAS */}
            <div className="flex-[1.5] grid grid-cols-2 sm:grid-cols-4 gap-3">
               <button 
                  onClick={() => setShowQRModal(true)}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 hover:border-white/20 transition-all group text-center"
               >
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                     <span className="material-symbols-outlined !text-2xl">qr_code_2</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-widest text-white leading-none">QRCode</span>
                     <span className="text-[8px] text-slate-500 font-bold uppercase mt-1">Materiais</span>
                  </div>
               </button>

               <Link 
                  to={`/dashboard/eventos/${id}/guestbook`}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 hover:border-white/20 transition-all group text-center"
               >
                  <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                     <span className="material-symbols-outlined !text-2xl">chat_bubble</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-widest text-white leading-none">Mensagens</span>
                     <span className="text-[8px] text-slate-500 font-bold uppercase mt-1">Guestbook</span>
                  </div>
               </Link>

               <Link 
                  to={`/dashboard/eventos/${id}/vitrine`}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 hover:border-white/20 transition-all group text-center"
               >
                  <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                     <span className="material-symbols-outlined !text-2xl">palette</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-widest text-white leading-none">Vitrine</span>
                     <span className="text-[8px] text-slate-500 font-bold uppercase mt-1">Personalizar</span>
                  </div>
               </Link>

               {id && (
                  <Link 
                     to={`/live/${id}`} 
                     target="_blank" 
                     className="flex flex-col items-center justify-center gap-3 p-4 bg-primary rounded-[2rem] hover:scale-[1.03] active:scale-95 transition-all group text-center shadow-lg shadow-primary/20"
                  >
                     <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white group-hover:rotate-12 transition-transform">
                        <span className="material-symbols-outlined !text-2xl">monitor</span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white leading-none">Abrir Telão</span>
                        <span className="text-[8px] text-white/60 font-bold uppercase mt-1">Ao Vivo</span>
                     </div>
                  </Link>
               )}
            </div>
         </div>

         {/* MODAL QR CODE */}
         {showQRModal && event && (
            <QRModal event={event as Evento} onClose={() => setShowQRModal(false)} />
         )}

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
                      {showAddons ? 'Expandir Limites' : 'Turbinar Evento'}
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

         {/* MENSAGEM PERSONALIZADA DO ORGANIZADOR */}
         <div className="flex flex-col gap-3 p-5 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-500">chat_bubble_outline</span>
                  Mensagem para Convidados
               </label>
               {msgSaving && <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Salvando...</span>}
               {msgSaved && <span className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">check_circle</span> Mensagem salva</span>}
            </div>
            <textarea
               value={msgText}
               onChange={e => handleMsgChange(e.target.value)}
               rows={2}
               placeholder="Ex: Escaneie e apareça no telão! Obrigado por estar aqui."
               className="bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-primary transition-all resize-none placeholder:text-slate-600"
            />
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Esta mensagem aparece no cartão de mesa e na página do convidado.</p>
         </div>

         {/* Grid de Moderação de Mídia Otimizado (ALTA DENSIDADE) */}
         <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
            {media.length === 0 ? (
               <div className="col-span-full py-40 text-center flex flex-col items-center gap-4">
                  <span className="material-symbols-outlined text-6xl text-slate-800">no_photography</span>
                  <p className="text-slate-500 font-bold uppercase tracking-widest italic">Nenhuma mídia capturada até o momento.</p>
                  <p className="text-[10px] text-slate-600 uppercase font-black">Divulgue o QR Code para seus convidados!</p>
               </div>
            ) : media.map((m, mediaIndex) => {
                const isVideo = m.tipo === 'video';
                // Usando versão otimizada apenas para FOTOS (Supabase Image Transformation não suporta vídeo)
                const thumbUrl = isVideo ? m.url : getOptimizedImageUrl(m.url, { width: 400, quality: 75 });
                
                return (
                   <div key={m.id} onClick={() => setLightboxIndex(mediaIndex)} className="group relative aspect-square bg-slate-900 rounded-2xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all shadow-xl cursor-pointer">
                      {isVideo ? (
                         <video 
                            src={m.url + '#t=0.5'} 
                            className={`w-full h-full object-cover transition-all duration-700 ${!m.aprovado ? 'grayscale brightness-50 contrast-125' : 'group-hover:scale-110'}`}
                            muted
                            playsInline
                         />
                      ) : (
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
                      )}
                      
                      {isVideo && (
                         <div className="absolute top-2 left-2 w-6 h-6 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center z-10">
                            <span className="material-symbols-outlined text-white text-[12px]">videocam</span>
                         </div>
                      )}
                     
                     {!m.aprovado && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                           <span className="px-2 py-1 bg-orange-500 text-white text-[7px] font-black uppercase tracking-[0.1em] rounded-full shadow-2xl">Aguardando</span>
                        </div>
                     )}

                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-20">
                         <button
                            onClick={e => { e.stopPropagation(); setLightboxIndex(mediaIndex); }}
                            className="w-9 h-9 bg-white/20 text-white rounded-xl flex items-center justify-center hover:scale-110 transition-all mb-1"
                            title="Visualizar"
                         >
                            <span className="material-symbols-outlined text-sm">fullscreen</span>
                         </button>
                        {!m.aprovado ? (
                           <button
                              onClick={e => { e.stopPropagation(); handleApprove(m.id); }}
                              className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-primary/30"
                              title="Aprovar Foto"
                           >
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                           </button>
                        ) : (
                           <span className="text-[8px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                              <span className="material-symbols-outlined text-[10px]">verified</span> Aprovado
                           </span>
                        )}
                        <div className="flex gap-2">
                           <button
                              onClick={e => { e.stopPropagation(); handleDelete(m.id); }}
                              className="w-8 h-8 bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                              title="Excluir Permanentemente"
                           >
                              <span className="material-symbols-outlined text-sm">delete</span>
                           </button>
                           <a 
                              href={m.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="w-8 h-8 bg-white/10 text-white rounded-lg flex items-center justify-center hover:bg-white/20 transition-all"
                              title="Ver Original"
                           >
                              <span className="material-symbols-outlined text-sm">open_in_new</span>
                           </a>
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>

         {lightboxIndex !== null && (
            <MediaLightbox
               media={media as any}
               initialIndex={lightboxIndex}
               onClose={() => setLightboxIndex(null)}
            />
         )}
      </div>
   );
};
