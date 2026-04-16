import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '../../App';
import { supabaseService } from '../../services/supabaseService';
import { TableSkeleton } from '../../components/common/Skeleton';

interface EventsListViewProps {
   onNewEvent: () => void;
}

export const EventsListView: React.FC<EventsListViewProps> = ({ onNewEvent }) => {
   const { user } = useContext(AuthContext);

   // Busca de eventos via React Query (usa a mesma query key da HomeView, permitindo cache compartilhado)
   const { data: events = [], isLoading: loading } = useQuery({
      queryKey: ['events', user?.id],
      queryFn: () => user ? supabaseService.getEventsByOrganizer(user.id) : [],
      enabled: !!user,
   });

   if (loading) {
      return <TableSkeleton rows={5} />;
   }

   return (
      <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <header className="flex justify-between items-end">
            <div>
               <h2 className="text-3xl font-black tracking-tight uppercase">Meus Eventos</h2>
               <p className="text-slate-400 mt-2">Gerencie e visualize todos os seus PicFests criados.</p>
            </div>
            <button
               onClick={onNewEvent}
               className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-black text-xs uppercase tracking-widest hover:text-primary transition-all flex items-center gap-2"
            >
               <span className="material-symbols-outlined">add</span> Novo Evento
            </button>
         </header>

         <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-md">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-white/5 border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                     <th className="px-8 py-6">Evento</th>
                     <th className="px-8 py-6">Data</th>
                     <th className="px-8 py-6">Status</th>
                     <th className="px-8 py-6 text-right">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {events.length === 0 ? (
                     <tr>
                        <td colSpan={4} className="px-8 py-20 text-center text-slate-500 italic text-sm">
                           Nenhum evento encontrado. Crie um novo para começar.
                        </td>
                     </tr>
                  ) : events.map(event => (
                     <tr key={event.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                 <span className="material-symbols-outlined">event_available</span>
                              </div>
                              <div>
                                 <span className="font-bold block text-base">{event.nome}</span>
                                 <span className="text-[10px] text-primary font-black tracking-widest uppercase">/{event.slug_curto}</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-xs text-slate-400 font-bold uppercase">
                           {new Date(event.data_evento).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-8 py-6">
                           <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${event.status === 'ativo' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                              {event.status}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link
                                 to={`/dashboard/eventos/${event.id}`}
                                 className="p-2 bg-white/5 rounded-lg hover:bg-primary/20 hover:text-primary transition-all"
                                 title="Configurar"
                              >
                                 <span className="material-symbols-outlined text-sm">settings</span>
                              </Link>
                              <Link
                                 to={`/live/${event.id}`}
                                 target="_blank"
                                 className="p-2 bg-white/5 rounded-lg hover:bg-green-500/20 hover:text-green-500 transition-all"
                                 title="Ver Telão"
                              >
                                 <span className="material-symbols-outlined text-sm">tv</span>
                              </Link>
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
