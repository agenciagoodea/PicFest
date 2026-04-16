import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';

export const AdminEvents: React.FC = () => {
   // Busca de eventos via React Query
   const { data: events = [], isLoading: loading } = useQuery({
      queryKey: ['adminEvents'],
      queryFn: () => adminService.getAllEvents(),
   });

   if (loading) return <div className="p-10 text-center text-slate-600 font-bold uppercase tracking-widest text-xs animate-pulse">Monitorando eventos globais...</div>;

   return (
      <div className="flex flex-col gap-8 animate-in fade-in duration-500">
         <header>
            <h2 className="text-3xl font-black tracking-tight uppercase flex items-center gap-3">
               Monitor Global <span className="bg-primary/10 text-primary text-[10px] px-3 py-1 rounded-full not-italic">Eventos PicFest</span>
            </h2>
            <p className="text-slate-400 mt-2">Visão geral de todas as experiências criadas na plataforma.</p>
         </header>

         <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <table className="w-full text-left">
               <thead className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  <tr>
                     <th className="px-8 py-5">Evento</th>
                     <th className="px-8 py-5">Organizador</th>
                     <th className="px-8 py-5">Data</th>
                     <th className="px-8 py-5">Status</th>
                     <th className="px-8 py-5 text-right">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5 text-sm">
                  {events.length === 0 ? (
                     <tr>
                        <td colSpan={5} className="px-8 py-10 text-center text-slate-500 italic">Nenhum evento registrado no sistema.</td>
                     </tr>
                  ) : events.map((ev: any) => (
                     <tr key={ev.id} className="hover:bg-white/5 transition-all group">
                        <td className="px-8 py-5 font-bold">
                           <div>
                              <span className="text-white block">{ev.nome}</span>
                              <p className="text-[10px] font-mono text-primary uppercase mt-0.5 tracking-tighter">/{ev.slug_curto}</p>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-slate-400 font-medium">
                           {ev.organizador?.nome || <span className="text-slate-600 italic">Desconhecido</span>}
                        </td>
                        <td className="px-8 py-5 text-slate-500 italic">
                           {new Date(ev.data_evento).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-8 py-5">
                           <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase border shadow-sm ${ev.status?.toLowerCase() === 'ativo' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                              {ev.status}
                           </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link
                                 to={`/live/${ev.slug_curto}`}
                                 target="_blank"
                                 className="p-2 bg-white/5 rounded-lg hover:bg-green-500/20 hover:text-green-500 transition-all"
                                 title="Ver Telão"
                              >
                                 <span className="material-symbols-outlined text-sm">tv</span>
                              </Link>
                              <button className="p-2 bg-white/5 rounded-lg hover:bg-red-500/20 hover:text-red-500 transition-all">
                                 <span className="material-symbols-outlined text-sm">report</span>
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
};
