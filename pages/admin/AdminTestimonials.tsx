import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '../../services/supabaseService';
import { Depoimento } from '../../types';

export const AdminTestimonials: React.FC = () => {
   const queryClient = useQueryClient();

   // Busca de depoimentos via React Query
   const { data: testimonials = [], isLoading: loading } = useQuery({
      queryKey: ['adminTestimonials'],
      queryFn: () => supabaseService.getTestimonials(false),
   });

   // Mutação para atualizar aprovação
   const approvalMutation = useMutation({
      mutationFn: ({ id, approved }: { id: string, approved: boolean }) => 
         supabaseService.updateTestimonialApproval(id, approved),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['adminTestimonials'] });
         alert('Status do depoimento atualizado!');
      },
      onError: () => alert('Erro ao atualizar depoimento'),
   });

   const toggleApproval = (id: string, current: boolean) => {
      approvalMutation.mutate({ id, approved: !current });
   };

   if (loading) return <div className="p-10 text-center animate-pulse font-black uppercase tracking-widest text-slate-700">Auditando relatos...</div>;

   return (
      <div className="flex flex-col gap-8 animate-in fade-in duration-500">
         <header>
            <h1 className="text-4xl font-black tracking-tight uppercase italic">Moderação de Depoimentos</h1>
            <p className="text-slate-400 mt-2">Aprove avaliações reais para exibição na vitrine do PicFest.</p>
         </header>

         <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-md">
            <table className="w-full text-left">
               <thead className="bg-white/5 border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <tr>
                     <th className="px-8 py-5">Organizador</th>
                     <th className="px-8 py-5">Depoimento</th>
                     <th className="px-8 py-5 text-center">Estrelas</th>
                     <th className="px-8 py-5">Status</th>
                     <th className="px-8 py-5 text-right">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {testimonials.length === 0 ? (
                     <tr><td colSpan={5} className="px-8 py-10 text-center text-slate-500 font-bold italic">Nenhum depoimento encontrado para moderação.</td></tr>
                  ) : testimonials.map((t: Depoimento) => (
                     <tr key={t.id} className="hover:bg-white/5 transition-all group">
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-4">
                              <img src={t.foto_url || `https://i.pravatar.cc/150?u=${t.id}`} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                              <p className="font-bold text-sm truncate max-w-[150px]">{t.nome}</p>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <p className="text-xs text-slate-400 max-w-md line-clamp-2 italic">"{t.texto}"</p>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex justify-center text-primary">
                              {Array.from({ length: t.estrelas }).map((_, i) => (
                                 <span key={i} className="material-symbols-outlined !text-sm">star</span>
                              ))}
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border shadow-sm ${t.aprovado ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                              {t.aprovado ? 'APROVADO' : 'PENDENTE'}
                           </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <button
                              onClick={() => toggleApproval(t.id, t.aprovado)}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${t.aprovado ? 'bg-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white' : 'bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white'}`}
                           >
                              {t.aprovado ? 'Desativar' : 'Aprovar'}
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
};
