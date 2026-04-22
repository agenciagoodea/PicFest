import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { Evento } from '../../types';

export const AdminEvents: React.FC = () => {
   const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);

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

         <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-md">
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
                              {ev.status === 'ativo' ? 'ATIVO' : 'ENCERRADO'}
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
                              <button 
                                 onClick={() => setSelectedEvent(ev)}
                                 className="p-2 bg-white/5 rounded-lg hover:bg-blue-500/20 hover:text-blue-500 transition-all"
                                 title="Métricas de Consumo"
                              >
                                 <span className="material-symbols-outlined text-sm">bar_chart</span>
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* Modal de Métricas */}
         {selectedEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
               <div className="bg-slate-900 border border-white/10 p-10 rounded-[2.5rem] w-full max-w-lg flex flex-col gap-8 shadow-2xl animate-in zoom-in-95">
                  <div className="flex justify-between items-start">
                     <div>
                        <h3 className="text-2xl font-black tracking-tight uppercase text-white">{selectedEvent.nome}</h3>
                        <p className="text-slate-500 text-xs mt-1">/{selectedEvent.slug_curto}</p>
                     </div>
                     <button onClick={() => setSelectedEvent(null)} className="text-slate-500 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                     {/* Informação do Plano */}
                     <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Plano Vinculado</span>
                           <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-[10px] font-black uppercase">
                              {selectedEvent.plan_snapshot?.name || 'Personalizado'}
                           </span>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                           <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Expira em:</span>
                              <span className="text-white font-bold">
                                 {selectedEvent.plan_expires_at ? new Date(selectedEvent.plan_expires_at).toLocaleDateString('pt-BR') : 'Sem expiração'}
                              </span>
                           </div>
                        </div>
                     </div>

                     {/* Consumo de Mídia */}
                     <div className="bg-black/20 border border-white/5 rounded-2xl p-6 flex flex-col gap-6">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Consumo de Recursos</h4>
                        
                        {/* Fotos */}
                        <div className="flex flex-col gap-2">
                           <div className="flex justify-between items-end">
                              <span className="text-xs font-bold text-white flex items-center gap-2">
                                 <span className="material-symbols-outlined text-blue-400 text-sm">photo_library</span>
                                 Fotos
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                 {selectedEvent.media_count_photos || 0} / {selectedEvent.plan_snapshot?.limits_json?.photos || '∞'}
                              </span>
                           </div>
                           <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                 className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                 style={{ width: `${Math.min(100, ((selectedEvent.media_count_photos || 0) / (selectedEvent.plan_snapshot?.limits_json?.photos || 1)) * 100)}%` }}
                              ></div>
                           </div>
                        </div>

                        {/* Vídeos */}
                        <div className="flex flex-col gap-2">
                           <div className="flex justify-between items-end">
                              <span className="text-xs font-bold text-white flex items-center gap-2">
                                 <span className="material-symbols-outlined text-orange-400 text-sm">videocam</span>
                                 Vídeos
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                 {selectedEvent.media_count_videos || 0} / {selectedEvent.plan_snapshot?.limits_json?.videos || '∞'}
                              </span>
                           </div>
                           <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                 className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                                 style={{ width: `${Math.min(100, ((selectedEvent.media_count_videos || 0) / (selectedEvent.plan_snapshot?.limits_json?.videos || 1)) * 100)}%` }}
                              ></div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex justify-center">
                     <Link 
                        to={`/live/${selectedEvent.slug_curto}`} 
                        target="_blank"
                        className="px-8 py-3 bg-white text-black font-black rounded-xl hover:scale-105 transition-all text-xs uppercase tracking-widest"
                     >
                        Visualizar Telão
                     </Link>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};
