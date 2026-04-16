import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '../../services/supabaseService';
import { getOptimizedImageUrl } from '../../utils/imageUtils';

interface EventDetailViewProps {
   userSub: any;
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({ userSub }) => {
   const { id } = useParams();
   const queryClient = useQueryClient();

   // Busca de mídias via React Query
   const { data: media = [], isLoading: loading } = useQuery({
      queryKey: ['media', id],
      queryFn: () => id ? supabaseService.getMediaByEvent(id, false) : [],
      enabled: !!id,
   });

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
                  <h1 className="text-4xl font-black tracking-tight italic uppercase">Gerenciar Evento</h1>
               </div>
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">tag</span> ID: {id} •
                  <span className="material-symbols-outlined text-sm">photo_library</span> {media.length} fotos capturadas
               </p>
            </div>
            <div className="flex gap-4">
                <button
                   onClick={() => queryClient.invalidateQueries({ queryKey: ['media', id] })}
                   className="p-3 bg-white/5 rounded-xl hover:text-primary transition-all"
                >
                   <span className="material-symbols-outlined text-sm">refresh</span>
                </button>
               {userSub?.planos?.pode_baixar ? (
                  <button className="px-6 py-3 border border-white/10 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all">Exportar Tudo</button>
               ) : (
                  <button
                     onClick={() => alert('Seu plano atual não permite o download em lote das mídias. Faça um upgrade para liberar este recurso!')}
                     className="px-6 py-3 border border-white/10 rounded-xl font-black text-xs uppercase tracking-widest opacity-30 hover:bg-red-500/10 transition-all flex items-center gap-2"
                  >
                     <span className="material-symbols-outlined text-xs">lock</span> Exportar Tudo
                  </button>
               )}
               {id && <Link to={`/live/${id}`} target="_blank" className="px-6 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">Abrir Telão</Link>}
            </div>
         </header>

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
