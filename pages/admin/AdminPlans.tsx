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
            const { id, ...planData } = plan as any;
            return adminService.createPlan({
               ...planData,
               limite_storage: 0
            });
         }
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['adminPlans'] });
         alert('Plano salvo com sucesso!');
         setShowModal(false);
      },
      onError: () => alert('Erro ao salvar plano.'),
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
               onClick={() => { setEditingPlan({ nome: '', valor: 0, limite_eventos: 0, limite_midias: 0, pode_baixar: true, recorrencia: 'mensal' }); setShowModal(true); }}
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
                     <h4 className="font-black uppercase tracking-[0.2em] text-[10px] text-primary">{p.nome}</h4>
                     <div className="flex gap-2">
                        <button onClick={() => { setEditingPlan(p); setShowModal(true); }} className="text-slate-500 hover:text-white transition-colors">
                           <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button onClick={() => handleDeletePlan(p.id)} className="text-slate-500 hover:text-red-500 transition-colors">
                           <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                     </div>
                  </div>

                  <div className="relative">
                     <p className="text-4xl font-black tracking-tighter text-white">R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                     <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{p.recorrencia}</p>
                  </div>

                  <div className="flex flex-col gap-4 text-[11px] text-slate-400 font-semibold border-t border-white/5 pt-6">
                     <p className="flex justify-between items-center">
                        <span>Eventos Ativos</span>
                        <span className="text-white bg-white/10 px-2 py-0.5 rounded-md font-black">{p.limite_eventos === 0 ? '∞' : p.limite_eventos}</span>
                     </p>
                     <p className="flex justify-between items-center">
                        <span>Mídias Totais</span>
                        <span className="text-white bg-white/10 px-2 py-0.5 rounded-md font-black">{p.limite_midias === 0 ? '∞' : p.limite_midias}</span>
                     </p>
                     <p className="flex justify-between items-center">
                        <span>Download Mídia</span>
                        <span className={`px-2 py-0.5 rounded-md font-black ${p.pode_baixar ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                           {p.pode_baixar ? 'LIBERADO' : 'BLOQUEADO'}
                        </span>
                     </p>
                  </div>
               </div>
            ))}
         </div>

         {/* MODAL DE EDIÇÃO/CRIAÇÃO */}
         {showModal && editingPlan && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
               <div className="bg-slate-900 border border-white/10 p-10 rounded-[2.5rem] w-full max-w-xl flex flex-col gap-8 shadow-2xl animate-in zoom-in-95">
                  <div className="flex justify-between items-center">
                     <h3 className="text-2xl font-black tracking-tight uppercase text-white">{editingPlan.id ? 'Editar Plano' : 'Novo Plano'}</h3>
                     <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <form onSubmit={handleSavePlan} className="flex flex-col gap-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                           <label className="text-[10px] font-black text-slate-500 uppercase">Nome do Plano</label>
                           <input
                              type="text"
                              required
                              value={editingPlan.nome}
                              onChange={e => setEditingPlan({ ...editingPlan, nome: e.target.value })}
                              className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary"
                           />
                        </div>
                        <div className="flex flex-col gap-1">
                           <label className="text-[10px] font-black text-slate-500 uppercase">Valor (R$)</label>
                           <input
                              type="number"
                              step="0.01"
                              required
                              value={editingPlan.valor}
                              onChange={e => setEditingPlan({ ...editingPlan, valor: parseFloat(e.target.value) })}
                              className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                           <label className="text-[10px] font-black text-slate-500 uppercase">Limite Eventos (0=∞)</label>
                           <input
                              type="number"
                              required
                              value={editingPlan.limite_eventos}
                              onChange={e => setEditingPlan({ ...editingPlan, limite_eventos: parseInt(e.target.value) })}
                              className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary"
                           />
                        </div>
                        <div className="flex flex-col gap-1">
                           <label className="text-[10px] font-black text-slate-500 uppercase">Limite Mídias (0=∞)</label>
                           <input
                              type="number"
                              required
                              value={editingPlan.limite_midias}
                              onChange={e => setEditingPlan({ ...editingPlan, limite_midias: parseInt(e.target.value) })}
                              className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col gap-1">
                           <label className="text-[10px] font-black text-slate-500 uppercase">Recorrência</label>
                           <select
                              value={editingPlan.recorrencia}
                              onChange={e => setEditingPlan({ ...editingPlan, recorrencia: e.target.value })}
                              className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary appearance-none"
                           >
                              <option value="mensal" className="bg-slate-900 text-white">Mensal</option>
                              <option value="anual" className="bg-slate-900 text-white">Anual</option>
                              <option value="unico" className="bg-slate-900 text-white">Pagamento Único</option>
                           </select>
                        </div>
                     </div>

                     <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 mt-2">
                        <input
                           type="checkbox"
                           id="pode_baixar"
                           checked={editingPlan.pode_baixar}
                           onChange={e => setEditingPlan({ ...editingPlan, pode_baixar: e.target.checked })}
                           className="w-5 h-5 rounded bg-white/10 border-white/10 text-primary focus:ring-primary"
                        />
                        <label htmlFor="pode_baixar" className="text-sm font-medium text-slate-300">Liberar download de mídias para o organizador</label>
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
