import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';

import { PlanAddon } from '../../types';

export const AdminAddons: React.FC = () => {
   const queryClient = useQueryClient();
   const [showModal, setShowModal] = useState(false);
   const [editingAddon, setEditingAddon] = useState<Partial<PlanAddon> | null>(null);
   const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

   const showFeedback = (msg: string, type: 'success' | 'error') => {
       setFeedback({ msg, type });
       setTimeout(() => setFeedback(null), 3000);
   };

   // Busca de adicionais via React Query
   const { data: addons = [], isLoading: loading } = useQuery({
      queryKey: ['adminAddons'],
      queryFn: () => adminService.getAllAddons(),
   });

   // Mutação para salvar/criar adicional
   const saveMutation = useMutation({
      mutationFn: async (addon: Partial<PlanAddon>) => {
         if (addon.id) {
            return adminService.updateAddon(addon.id, addon);
         } else {
            return adminService.createAddon(addon);
         }
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['adminAddons'] });
         showFeedback('Adicional salvo com sucesso!', 'success');
         setShowModal(false);
      },
      onError: (err) => {
          console.error(err);
          showFeedback('Erro ao salvar adicional.', 'error');
      },
   });

   // Mutação para excluir adicional
   const deleteMutation = useMutation({
      mutationFn: (id: string) => adminService.deleteAddon(id),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['adminAddons'] });
         showFeedback('Adicional excluído da loja.', 'success');
      },
      onError: () => showFeedback('Atenção: Adicionais já comprados não podem ser excluídos, apenas inativados.', 'error'),
   });

   const handleSaveAddon = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingAddon) return;
      saveMutation.mutate(editingAddon);
   };

   const handleDeleteAddon = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm('Deseja realmente excluir este pacote adicional? Recomendado apenas inativar se já tiver vendas.')) return;
      deleteMutation.mutate(id);
   };

   if (loading) return <div className="p-10 text-center animate-pulse text-xs font-black uppercase tracking-widest text-slate-700">Carregando Catálogo...</div>;

   return (
      <div className="flex flex-col gap-10 animate-in fade-in duration-500">
         <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
            <div>
               <h2 className="text-3xl font-black tracking-tight uppercase flex items-center gap-3">
                    <span className="material-symbols-outlined text-4xl text-primary">add_shopping_cart</span>
                    Pacotes Adicionais
               </h2>
               <p className="text-slate-400 mt-2">Venda de pacotes de fotos e vídeos avulsos (Addons) para esticar os limites de Eventos.</p>
            </div>
            <button
               onClick={() => { 
                   setEditingAddon({ 
                       name: '', 
                       slug: '', 
                       description: '',
                       price: 0, 
                       addon_type: 'fotos',
                       extra_photos: 0,
                       extra_videos: 0,
                       extra_events: 0,
                       sort_order: addons.length + 1,
                       is_active: true,
                       is_visible: true
                   }); 
                   setShowModal(true); 
               }}
               className="px-6 py-3 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
               <span className="material-symbols-outlined">add</span> Novo Pacote
            </button>
         </header>

         {feedback && (
             <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-white font-bold text-sm shadow-xl flex items-center gap-2 z-50 animate-in slide-in-from-bottom-5 ${feedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                 <span className="material-symbols-outlined text-sm">{feedback.type === 'success' ? 'check_circle' : 'error'}</span>
                 {feedback.msg}
             </div>
         )}

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {addons.map(addon => (
               <div 
                  key={addon.id} 
                  className={`relative flex flex-col gap-4 p-8 rounded-[2rem] border overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform ${
                      addon.is_active 
                      ? 'bg-black/40 border-white/10 backdrop-blur-md shadow-2xl' 
                      : 'bg-black/20 border-red-500/20 opacity-70 grayscale'
                  }`}
                  onClick={() => { setEditingAddon(addon); setShowModal(true); }}
               >
                  <div className="flex flex-col gap-1 pr-16">
                     <h3 className="text-2xl font-black text-white leading-none tracking-tight">{addon.name}</h3>
                     <p className="text-xs text-primary font-mono bg-primary/10 self-start px-2 py-0.5 rounded-full mt-2">/{addon.slug}</p>
                  </div>
                  
                  {/* Toggle Rápido Ativo/Inativo */}
                  <div 
                      className="absolute top-6 right-6"
                      onClick={(e) => {
                          e.stopPropagation();
                          const updatedAddon = { ...addon, is_active: !addon.is_active };
                          saveMutation.mutate(updatedAddon as any);
                      }}
                  >
                      <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={addon.is_active} readOnly />
                          <div className={`w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${addon.is_active ? 'peer-checked:bg-primary' : 'bg-slate-700'}`}></div>
                      </label>
                  </div>
                  
                  <div className="text-[10px] text-slate-400 font-medium h-12 leading-relaxed overflow-hidden">
                     {addon.description || 'Sem descrição.'}
                  </div>

                  <div className="flex flex-col gap-1 mt-4">
                     <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Preço Único</span>
                     <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-white/50">R$</span>
                        <span className="text-3xl font-black text-white">{Number(addon.price).toFixed(2)}</span>
                     </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/10">
                     <span className="text-xs font-black text-slate-500 uppercase tracking-widest">O que adiciona?</span>
                     
                     {addon.extra_photos > 0 && (
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                           <span className="material-symbols-outlined text-[16px] text-blue-400">photo_library</span>
                           <span className="text-blue-400">+{addon.extra_photos}</span> <span className="opacity-50">Fotos extras no evento</span>
                        </div>
                     )}
                     
                     {addon.extra_videos > 0 && (
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                           <span className="material-symbols-outlined text-[16px] text-orange-400">videocam</span>
                           <span className="text-orange-400">+{addon.extra_videos}</span> <span className="opacity-50">Vídeos extras no evento</span>
                        </div>
                     )}

                     {addon.extra_photos === 0 && addon.extra_videos === 0 && (
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                           <span className="material-symbols-outlined text-[16px]">do_not_disturb_on</span>
                           Nenhum de mídia configurado
                        </div>
                     )}
                  </div>

                  <button 
                     onClick={(e) => handleDeleteAddon(addon.id!, e)}
                     className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-red-500 text-slate-500 hover:text-white flex items-center justify-center transition-colors"
                     title="Excluir Adicional"
                  >
                     <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
               </div>
            ))}
         </div>

         {/* Modal de Criação / Edição */}
         {showModal && editingAddon && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
               <div className="bg-slate-900 border border-white/10 p-10 rounded-[2.5rem] w-full max-w-2xl flex flex-col gap-8 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center">
                     <h3 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3 text-white">
                        <span className="material-symbols-outlined text-primary">{editingAddon.id ? 'edit' : 'add_circle'}</span>
                        {editingAddon.id ? 'Editar Adicional' : 'Novo Adicional'}
                     </h3>
                     <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <form onSubmit={handleSaveAddon} className="flex flex-col gap-6">

                     {/* BLOCO BASICOS */}
                     <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                        <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/10 pb-2">Informação de Venda</h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <div className="flex flex-col gap-1 md:col-span-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase">Nome Amigável</label>
                              <input
                                 type="text"
                                 required
                                 value={editingAddon.name}
                                 onChange={e => setEditingAddon({ ...editingAddon, name: e.target.value })}
                                 className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary"
                                 placeholder="ex: Pacote de Bateria Seca (+500)"
                              />
                           </div>
                           <div className="flex flex-col gap-1 md:col-span-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase">Slug Interno (URL)</label>
                              <input
                                 type="text"
                                 required
                                 value={editingAddon.slug}
                                 onChange={e => setEditingAddon({ ...editingAddon, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                 className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white font-mono outline-none focus:border-primary"
                                 placeholder="pacote-500-fotos"
                              />
                           </div>
                        </div>

                        <div className="flex flex-col gap-1">
                           <label className="text-[10px] font-black text-slate-500 uppercase">Descrição de Ajuda (Opcional)</label>
                           <textarea
                              value={editingAddon.description || ''}
                              onChange={e => setEditingAddon({ ...editingAddon, description: e.target.value })}
                              className="bg-white/5 border border-white/10 rounded-xl h-20 p-4 text-white outline-none focus:border-primary resize-none text-xs"
                              placeholder="Fale brevemente sobre as vantagens."
                           />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase">Preço Venda (R$)</label>
                              <input
                                 type="number"
                                 step="0.01"
                                 required
                                 value={editingAddon.price}
                                 onChange={e => setEditingAddon({ ...editingAddon, price: parseFloat(e.target.value) })}
                                 className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary font-bold text-green-400"
                              />
                           </div>
                           <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase">Ordem Loja</label>
                              <input
                                 type="number"
                                 required
                                 value={editingAddon.sort_order || 0}
                                 onChange={e => setEditingAddon({ ...editingAddon, sort_order: parseInt(e.target.value) })}
                                 className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary"
                              />
                           </div>
                           <div className="flex flex-col gap-1 items-center justify-center relative top-2">
                               <label className="flex items-center gap-2 text-[10px] font-black cursor-pointer text-slate-500 uppercase">
                                  Ativo e a venda
                                  <input 
                                     type="checkbox" 
                                     checked={editingAddon.is_active} 
                                     onChange={e => setEditingAddon({...editingAddon, is_active: e.target.checked})}
                                     className="w-4 h-4 accent-primary"
                                  />
                               </label>
                           </div>
                        </div>
                     </div>

                     {/* BLOCO CONFIG DE CAPACIDADE DE ADIÇÃO */}
                     <div className="bg-black/20 border border-white/5 rounded-2xl p-6 flex flex-col gap-4 shadow-inner">
                        <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                           <span className="material-symbols-outlined text-[16px] text-slate-400">database</span>
                           Configuração de Incremento (O que isso libera?)
                        </h4>
                        
                        <div className="flex flex-col gap-1">
                           <label className="text-[10px] font-black text-slate-500 uppercase">Tipo Técnico</label>
                           <select
                              value={editingAddon.addon_type || 'fotos'}
                              onChange={e => setEditingAddon({ ...editingAddon, addon_type: e.target.value as any })}
                              className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary appearance-none text-xs w-1/2"
                           >
                              <option value="fotos">Pacote Exclusivo de Fotos</option>
                              <option value="videos">Pacote Exclusivo de Vídeos</option>
                              <option value="misto">Conjunto Misto</option>
                           </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-2">
                           <div className="flex flex-col gap-2 p-4 border border-blue-500/20 bg-blue-500/5 rounded-xl">
                              <label className="text-[10px] font-black text-blue-400 uppercase flex items-center gap-1">
                                 <span className="material-symbols-outlined text-[16px]">photo_library</span> Fotos (+ Adição)
                              </label>
                              <input
                                 type="number"
                                 min="0"
                                 value={editingAddon.extra_photos ?? 0}
                                 onChange={e => setEditingAddon({ ...editingAddon, extra_photos: parseInt(e.target.value) })}
                                 className="bg-transparent border-none text-3xl font-black text-white outline-none w-full"
                              />
                           </div>

                           <div className="flex flex-col gap-2 p-4 border border-orange-500/20 bg-orange-500/5 rounded-xl">
                              <label className="text-[10px] font-black text-orange-400 uppercase flex items-center gap-1">
                                 <span className="material-symbols-outlined text-[16px]">videocam</span> Vídeos (+ Adição)
                              </label>
                              <input
                                 type="number"
                                 min="0"
                                 value={editingAddon.extra_videos ?? 0}
                                 onChange={e => setEditingAddon({ ...editingAddon, extra_videos: parseInt(e.target.value) })}
                                 className="bg-transparent border-none text-3xl font-black text-white outline-none w-full"
                              />
                           </div>
                        </div>
                     </div>

                     {/* Botoes Form */}
                     <div className="flex gap-4 items-center justify-end pt-4 mt-4 border-t border-white/10">
                        <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 font-bold text-slate-400 hover:text-white uppercase text-xs tracking-wider">Cancelar</button>
                        <button type="submit" className="px-8 py-3 bg-primary text-white font-black rounded-xl hover:scale-105 active:scale-95 transition-transform hover:shadow-lg hover:shadow-primary/20 uppercase text-xs tracking-wider">
                           Salvar Configuração e Liberar
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};
