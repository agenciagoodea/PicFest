import React, { useState, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../../App';
import { supabaseService } from '../../services/supabaseService';
import { Midia } from '../../types';

export const OrganizerTestimonialView: React.FC = () => {
   const { profile } = useContext(AuthContext);
   const queryClient = useQueryClient();
   const [rating, setRating] = useState(5);
   const [text, setText] = useState('');
   const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
   const [showMediaPicker, setShowMediaPicker] = useState(false);

   // Busca de depoimentos do organizador via React Query
   const { data: testimonials = [] } = useQuery({
      queryKey: ['testimonials', profile?.id],
      queryFn: () => profile?.id ? supabaseService.getTestimonialsByOrganizer(profile.id) : [],
      enabled: !!profile?.id,
   });

   // Busca de mídias do organizador para o picker via React Query
   const { data: organizerMedia = [] } = useQuery({
      queryKey: ['organizerMedia', profile?.id],
      queryFn: () => profile?.id ? supabaseService.getOrganizerMedia(profile.id) : [],
      enabled: !!profile?.id,
   });

   // Mutação para criar depoimento
   const createMutation = useMutation({
      mutationFn: (testimonial: any) => supabaseService.createTestimonial(testimonial),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['testimonials', profile?.id] });
         alert('Obrigado pelo seu depoimento! Ele aparecerá na landing page após a moderação.');
         setText('');
         setRating(5);
         setSelectedMediaUrl(null);
      },
      onError: () => alert('Erro ao enviar depoimento.'),
   });

   // Mutação para excluir depoimento
   const deleteMutation = useMutation({
      mutationFn: (id: string) => supabaseService.deleteTestimonial(id),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['testimonials', profile?.id] });
      },
      onError: () => alert('Erro ao excluir avaliação.'),
   });

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!text || !profile) return;

      createMutation.mutate({
         organizador_id: profile.id,
         nome: profile.nome,
         foto_url: selectedMediaUrl || profile.foto_perfil || `https://i.pravatar.cc/150?u=${profile.id}`,
         estrelas: rating,
         texto: text,
         aprovado: false
      });
   };

   const handleDelete = (id: string) => {
      if (!window.confirm('Tem certeza que deseja excluir esta avaliação?')) return;
      deleteMutation.mutate(id);
   };

   return (
      <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10">
            <div className="max-w-2xl">
               <h2 className="text-4xl font-black text-white italic uppercase mb-2">Sua Opinião Importa!</h2>
               <p className="text-slate-400 font-medium mb-8">Conte-nos como está sendo sua experiência com o PicFest.</p>

               <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <div className="flex gap-2">
                     {[1, 2, 3, 4, 5].map((star) => (
                        <button
                           key={star}
                           type="button"
                           onClick={() => setRating(star)}
                           className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${rating >= star ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                        >
                           <span className="material-symbols-outlined !text-2xl">star</span>
                        </button>
                     ))}
                  </div>

                  <textarea
                     value={text}
                     onChange={(e) => setText(e.target.value)}
                     placeholder="Escreva aqui seu depoimento..."
                     className="w-full h-32 bg-white/5 border border-white/10 rounded-3xl p-6 text-white placeholder:text-slate-600 focus:border-primary/50 transition-all outline-none resize-none font-medium"
                     required
                  />

                  {/* Seleção de Mídia do Perfil */}
                  <div className="flex flex-col gap-4">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Escolha uma foto do seu evento para o depoimento</p>
                     <div className="flex flex-wrap gap-4">
                        <button
                           type="button"
                           onClick={() => setShowMediaPicker(!showMediaPicker)}
                           className={`w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${selectedMediaUrl ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                        >
                           {selectedMediaUrl ? (
                              <img src={selectedMediaUrl} className="w-full h-full object-cover rounded-xl" />
                           ) : (
                              <>
                                 <span className="material-symbols-outlined text-slate-500">add_photo_alternate</span>
                                 <span className="text-[8px] font-black uppercase text-slate-500">Escolher</span>
                              </>
                           )}
                        </button>

                        {showMediaPicker && (
                           <div className="flex-1 min-w-[300px] h-24 overflow-x-auto flex gap-2 pb-2 custom-scrollbar">
                              {organizerMedia.length === 0 ? (
                                 <div className="h-full flex items-center px-4 text-[10px] text-slate-600 uppercase font-black">Nenhuma mídia encontrada nos seus eventos</div>
                              ) : (
                                 organizerMedia.filter((m: Midia) => m.tipo === 'foto').map((media: Midia) => (
                                    <img
                                       key={media.id}
                                       src={media.url}
                                       onClick={() => {
                                          setSelectedMediaUrl(media.url);
                                          setShowMediaPicker(false);
                                       }}
                                       className={`h-full aspect-square object-cover rounded-xl cursor-pointer border-2 transition-all ${selectedMediaUrl === media.url ? 'border-primary scale-95' : 'border-transparent hover:border-white/20'}`}
                                    />
                                 ))
                              )}
                           </div>
                        )}

                        {selectedMediaUrl && (
                           <button
                              type="button"
                              onClick={() => setSelectedMediaUrl(null)}
                              className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
                           >
                              Remover Foto
                           </button>
                        )}
                     </div>
                  </div>

                  <button
                     type="submit"
                     disabled={createMutation.isPending}
                     className="w-full md:w-auto bg-primary text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:scale-100"
                  >
                     {createMutation.isPending ? 'Enviando...' : 'Enviar Depoimento'}
                  </button>
               </form>
            </div>
         </div>

         {/* Lista de Depoimentos Enviados */}
         {testimonials.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {testimonials.map((t: any) => (
                  <div key={t.id} className="bg-white/5 border border-white/10 rounded-[2rem] p-8 relative group">
                     <div className="flex items-center gap-2 mb-4">
                        {Array.from({ length: t.estrelas }).map((_, i) => (
                           <span key={i} className="material-symbols-outlined text-primary !text-sm">star</span>
                        ))}
                     </div>
                     <p className="text-slate-300 italic mb-4">"{t.texto}"</p>
                     <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${t.aprovado ? 'text-green-500' : 'text-yellow-500'}`}>
                           {t.aprovado ? 'Aprovado' : 'Aguardando Moderação'}
                        </span>
                        {(profile?.role === 'admin' || t.organizador_id === profile?.id) && (
                           <button
                              onClick={() => handleDelete(t.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                           >
                              <span className="material-symbols-outlined !text-lg">delete</span>
                           </button>
                        )}
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
   );
};
