import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';
import { Plano } from '../../types';

export const AdminPlans: React.FC = () => {
   const queryClient = useQueryClient();
   const [showModal, setShowModal] = useState(false);
   const [editingPlan, setEditingPlan] = useState<Partial<Plano> | null>(null);

   // Busca de planos via React Query
   const { data: plans = [], isLoading: loading } = useQuery({
      queryKey: ['adminPlans'],
      queryFn: () => adminService.getAllPlans(),
   });

   // Mutação para salvar/criar plano
   const saveMutation = useMutation({
      mutationFn: async (plan: Partial<Plano>) => {
         if (plan.id) {
            return adminService.updatePlan(plan.id, plan);
         } else {
            return adminService.createPlan(plan);
         }
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['adminPlans'] });
         alert('Plano salvo com sucesso!');
         setShowModal(false);
      },
      onError: (err) => {
          console.error(err);
          alert('Erro ao salvar plano.');
      },
   });

   // Mutação para excluir plano
   const deleteMutation = useMutation({
      mutationFn: (id: string) => adminService.deletePlan(id),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['adminPlans'] });
         alert('Plano excluído.');
      },
      onError: () => alert('Erro ao excluir plano.'),
   });

   // Mutação para duplicar plano
   const duplicateMutation = useMutation({
      mutationFn: (id: string) => adminService.duplicatePlan(id),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['adminPlans'] });
         alert('Plano duplicado com sucesso! A cópia está desativada.');
      },
      onError: () => alert('Erro ao duplicar plano.'),
   });

   const handleSavePlan = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingPlan) return;
      saveMutation.mutate(editingPlan);
   };

   const handleDeletePlan = (id: string) => {
      if (!confirm('Deseja realmente excluir este plano?')) return;
      deleteMutation.mutate(id);
   };

   if (loading) return <div className="p-10 text-center animate-pulse text-xs font-black uppercase tracking-widest text-slate-700">Sincronizando Pacotes...</div>;

   return (
      <div className="flex flex-col gap-10 animate-in fade-in duration-500">
         <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
            <div>
               <h2 className="text-3xl font-black tracking-tight uppercase">Modelos de Negócio</h2>
               <p className="text-slate-400 mt-2">Gestão de precificação e limites operacionais SaaS.</p>
            </div>
            <button
               onClick={() => { 
                   setEditingPlan({ 
                       name: '', 
                       slug: '', 
                       price: 0, 
                       interval: 'unique', 
                       interval_count: 1, 
                       is_active: true,
                       billing_type: 'single_event',
                       sort_order: plans.length + 1,
                       features_json: { items: [], download_files: false, zip_download: false },
                       limits_json: { events: 1, photos: 0, videos: 0 }
                   }); 
                   setShowModal(true); 
               }}
               className="px-6 py-3 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
               <span className="material-symbols-outlined">add</span> Novo Plano
            </button>
         </header>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map(p => (
               <div key={p.id} className="bg-white/5 border border-white/10 p-10 rounded-[3rem] flex flex-col gap-8 group hover:border-primary/50 transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] group-hover:bg-primary/10 transition-colors"></div>

                  <div className="flex justify-between items-center relative">
                     <h4 className="font-black uppercase tracking-[0.2em] text-[10px] text-primary flex items-center gap-2">
                         {p.name}
                         <span className="bg-primary/20 text-white px-2 py-0.5 rounded text-[8px]">{p.billing_type === 'single_event' ? 'Por Evento' : 'Assinatura'}</span>
                     </h4>
                     <div className="flex gap-2 bg-black/40 backdrop-blur-md p-1 rounded-lg">
                        <button onClick={() => duplicateMutation.mutate(p.id)} className="p-1 text-slate-500 hover:text-green-500 transition-colors" title="Duplicar">
                           <span className="material-symbols-outlined text-sm">content_copy</span>
                        </button>
                        <button onClick={() => { setEditingPlan(p); setShowModal(true); }} className="p-1 text-slate-500 hover:text-white transition-colors" title="Editar">
                           <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button onClick={() => handleDeletePlan(p.id)} className="p-1 text-slate-500 hover:text-red-500 transition-colors" title="Excluir">
                           <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                     </div>
                  </div>

                  <div className="relative">
                     <p className="text-4xl font-black tracking-tighter text-white">R$ {(p.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                     <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{(p.interval_count || 1) > 1 ? `${p.interval_count} ` : ''}{p.interval === 'month' ? 'Mensal' : p.interval === 'year' ? 'Anual' : 'Único'}</p>
                  </div>

                  <div className="flex flex-col gap-4 text-[11px] text-slate-400 font-semibold border-t border-white/5 pt-6">
                     <p className="flex justify-between items-center">
                        <span>Slug</span>
                        <span className="text-white font-mono bg-white/5 px-2 py-0.5 rounded">{p.slug}</span>
                     </p>
                     <p className="flex justify-between items-center text-[9px] uppercase tracking-tighter">
                        <span>Recursos</span>
                        <span className="text-white">{p.features_json?.items?.length || 0} itens</span>
                     </p>
                     <p className="flex justify-between items-center">
                        <span>Status</span>
                        <span className={`px-2 py-0.5 rounded-md font-black ${p.is_active ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                           {p.is_active ? 'ATIVO' : 'INATIVO'}
                        </span>
                     </p>
                  </div>
               </div>
            ))}
         </div>

         {/* MODAL DE EDIÇÃO/CRIAÇÃO */}
         {showModal && editingPlan && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
               <div className="bg-slate-900 border border-white/10 p-10 rounded-[2.5rem] w-full max-w-2xl flex flex-col gap-8 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center">
                     <h3 className="text-2xl font-black tracking-tight uppercase text-white">{editingPlan.id ? 'Editar Plano' : 'Novo Plano'}</h3>
                     <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <form onSubmit={handleSavePlan} className="flex flex-col gap-4">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1 md:col-span-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase">Nome do Plano</label>
                           <input
                              type="text"
                              required
                              value={editingPlan.name}
                              onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                              className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary"
                           />
                        </div>
                        <div className="flex flex-col gap-1 md:col-span-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase">Slug (único)</label>
                           <input
                              type="text"
                              required
                              value={editingPlan.slug}
                              onChange={e => setEditingPlan({ ...editingPlan, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                              className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white font-mono outline-none focus:border-primary"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1">
                           <label className="text-[10px] font-black text-slate-500 uppercase">Preço (R$)</label>
                           <input
                              type="number"
                              step="0.01"
                              required
                              value={editingPlan.price}
                              onChange={e => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                              className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary"
                           />
                        </div>
                        <div className="flex flex-col gap-1">
                           <label className="text-[10px] font-black text-slate-500 uppercase">Tipo</label>
                           <select
                              value={editingPlan.billing_type || 'single_event'}
                              onChange={e => setEditingPlan({ ...editingPlan, billing_type: e.target.value as any })}
                              className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary appearance-none text-xs"
                           >
                              <option value="single_event">Por Evento (Único)</option>
                              <option value="subscription">Assinatura Mensal</option>
                           </select>
                        </div>
                        <div className="flex flex-col gap-1">
                           <label className="text-[10px] font-black text-slate-500 uppercase">Ordem (Sort)</label>
                           <input
                              type="number"
                              required
                              value={editingPlan.sort_order || 0}
                              onChange={e => setEditingPlan({ ...editingPlan, sort_order: parseInt(e.target.value) })}
                              className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary"
                           />
                        </div>
                        <div className="flex flex-col gap-1">
                           <label className="text-[10px] font-black text-slate-500 uppercase">Eventos (Lim.)</label>
                           <input
                              type="number"
                              title="0 = ilimitado"
                              value={editingPlan.limits_json?.events ?? 1}
                              onChange={e => setEditingPlan({ 
                                ...editingPlan, 
                                limits_json: { ...editingPlan.limits_json, events: parseInt(e.target.value) } 
                              })}
                              className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-white/5 rounded-xl bg-black/20">
                        <div className="flex flex-col gap-1">
                           <label className="text-[10px] font-black text-slate-500 uppercase">Limite Fotos</label>
                           <input
                              type="number"
                              title="0 = ilimitado"
                              value={editingPlan.limits_json?.photos ?? 0}
                              onChange={e => setEditingPlan({ 
                                ...editingPlan, 
                                limits_json: { ...editingPlan.limits_json, photos: parseInt(e.target.value) } 
                              })}
                              className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary"
                           />
                        </div>
                        <div className="flex flex-col gap-1">
                           <label className="text-[10px] font-black text-slate-500 uppercase">Limite Vídeos</label>
                           <input
                              type="number"
                              title="0 = ilimitado"
                              value={editingPlan.limits_json?.videos ?? 0}
                              onChange={e => setEditingPlan({ 
                                ...editingPlan, 
                                limits_json: { ...editingPlan.limits_json, videos: parseInt(e.target.value) } 
                              })}
                              className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary"
                           />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                               type="checkbox"
                               checked={editingPlan.limits_json?.download ?? !!editingPlan.features_json?.download_files}
                               onChange={e => {
                                  setEditingPlan({ 
                                      ...editingPlan, 
                                      limits_json: { ...editingPlan.limits_json, download: e.target.checked },
                                      features_json: { ...editingPlan.features_json, download_files: e.target.checked }
                                  });
                               }}
                               className="w-4 h-4 rounded"
                            />
                            <label className="text-[10px] font-black text-slate-500 uppercase">Libera Download</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                               type="checkbox"
                               checked={editingPlan.limits_json?.zip ?? !!editingPlan.features_json?.zip_download}
                               onChange={e => {
                                  setEditingPlan({ 
                                      ...editingPlan, 
                                      limits_json: { ...editingPlan.limits_json, zip: e.target.checked },
                                      features_json: { ...editingPlan.features_json, zip_download: e.target.checked }
                                  });
                               }}
                               className="w-4 h-4 rounded"
                            />
                            <label className="text-[10px] font-black text-slate-500 uppercase">Libera Arquivo ZIP</label>
                        </div>
                     </div>

                     <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Recursos (um por linha)</label>
                        <textarea
                           rows={4}
                           value={editingPlan.features_json?.items?.join('\n') || ''}
                           onChange={e => setEditingPlan({ 
                               ...editingPlan, 
                               features_json: { ...editingPlan.features_json, items: e.target.value.split('\n').filter(i => i.trim() !== '') } 
                           })}
                           className="bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-primary resize-none"
                           placeholder="Mídias ilimitadas&#10;Suporte 24h&#10;Dashboard Pro"
                        />
                     </div>

                     <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 mt-2">
                        <input
                           type="checkbox"
                           id="is_active"
                           checked={editingPlan.is_active}
                           onChange={e => setEditingPlan({ ...editingPlan, is_active: e.target.checked })}
                           className="w-5 h-5 rounded bg-white/10 border-white/10 text-primary focus:ring-primary"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-slate-300">Este plano está visível para novos usuários</label>
                     </div>

                     <div className="flex gap-4 mt-6">
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all font-bold">Cancelar</button>
                        <button
                           type="submit"
                           disabled={saveMutation.isPending}
                           className="flex-1 py-4 bg-primary text-white font-black rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                        >
                           {saveMutation.isPending ? 'Salvando...' : 'Salvar Plano'}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};
