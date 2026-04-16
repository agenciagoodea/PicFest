import React, { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '../../App';
import { supabaseService } from '../../services/supabaseService';
import { MetricCard } from '../../components/common/MetricCard';
import { DashboardSkeleton } from '../../components/common/Skeleton';
import { QRModal } from '../../components/common/QRModal';
import { DashboardSlideshow } from '../../components/DashboardSlideshow';
import { Link } from 'react-router-dom';
import { Evento } from '../../types';

interface HomeViewProps {
   onNewEvent: () => void;
   userSub: any;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNewEvent, userSub }) => {
   const { user } = useContext(AuthContext);

   // Busca de eventos via React Query
   const { data: events = [], isLoading: eventsLoading } = useQuery({
      queryKey: ['events', user?.id],
      queryFn: async () => {
         if (!user) return [];
         const eventsData = await supabaseService.getEventsByOrganizer(user.id);
         return eventsData.filter(e => e.status?.toLowerCase() === 'ativo');
      },
      enabled: !!user,
   });

   // Busca de estatísticas consolidadas via nova RPC (Otimização Extrema)
   const { data: stats, isLoading: statsLoading } = useQuery({
      queryKey: ['organizerStats', user?.id],
      queryFn: () => user ? supabaseService.getOrganizerStats(user.id) : null,
      enabled: !!user,
      staleTime: 1000 * 60 * 2, // 2 minutos de cache para estatísticas
   });

   const loading = eventsLoading || statsLoading;

   const activePlan = userSub?.planos;
   const canCreateMore = activePlan ? (activePlan.limite_eventos === 0 || events.length < activePlan.limite_eventos) : true;

   if (loading) {
      return <DashboardSkeleton />;
   }

   return (
      <div className="flex flex-col gap-10 animate-in fade-in duration-500">
         <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-2">
               <h1 className="text-4xl font-black tracking-tight uppercase italic flex items-center gap-3">
                  Dashboard <span className="bg-primary text-white text-[10px] not-italic px-3 py-1 rounded-full">{activePlan?.nome || 'Free'}</span>
               </h1>
               <p className="text-slate-400 font-medium">Bem-vindo de volta, organizador! Aqui está o resumo do seu PicFest.</p>
            </div>

            <button
               onClick={onNewEvent}
               disabled={!canCreateMore}
               className="bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
            >
               <span className="material-symbols-outlined">add_circle</span>
               Novo Evento
            </button>
         </header>

         {/* Grid de Métricas Consolidadas */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
               label="Eventos Ativos"
               value={stats?.total_eventos?.toString() || events.length.toString()}
               icon="event_available"
               color="text-primary"
               sub={activePlan ? `Limite: ${activePlan.limite_eventos === 0 ? 'ilimitado' : activePlan.limite_eventos}` : ''}
            />
            <MetricCard
               label="Total de Mídias"
               value={stats?.total_midias?.toString() || '0'}
               icon="groups"
               color="text-primary"
               sub={`${stats?.total_aprovadas || 0} aprovadas`}
            />
            <MetricCard
               label="Próximo Passo"
               value={stats?.proximo_evento ? 'Pronto' : 'Criar'}
               icon="auto_awesome"
               color="text-orange-500"
               sub={stats?.proximo_evento || 'Nenhum agendado'}
            />
         </div>

         {/* Lista de Eventos Ativos com Preview Visual */}
         <section>
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-xl font-black uppercase tracking-widest text-slate-500">Seus Eventos em Destaque</h2>
               <Link to="/dashboard/eventos" className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors">Ver todos</Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {events.length === 0 ? (
                  <div className="col-span-full bg-white/5 border border-white/10 rounded-[2.5rem] p-20 text-center">
                     <span className="material-symbols-outlined text-6xl text-slate-700 mb-4">event_note</span>
                     <p className="text-slate-500 font-bold uppercase tracking-widest">Nenhum evento ativo encontrado</p>
                     <button onClick={onNewEvent} className="mt-6 text-primary font-black uppercase tracking-widest text-xs hover:underline">Criar meu primeiro evento</button>
                  </div>
               ) : (
                  events.slice(0, 3).map(event => (
                     <EventCard key={event.id} event={event} />
                  ))
               )}
            </div>
         </section>
      </div>
   );
};

// Componente interno para o Card de Evento (simplificado para a Home)
const EventCard: React.FC<{ event: Evento }> = ({ event }) => {
   const [showQR, setShowQR] = React.useState(false);

   return (
      <div className="relative aspect-square rounded-[2.5rem] border border-white/10 overflow-hidden bg-white/5 hover:border-primary transition-all group shadow-2xl">
         <Link to={`/dashboard/eventos/${event.id}`} className="absolute inset-0 z-0">
            <DashboardSlideshow event={event} />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>
            <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end gap-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
               <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Ao Vivo</span>
               </div>
               <h3 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase italic break-words">{event.nome}</h3>
               <div className="flex items-center justify-between mt-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                     {new Date(event.data_evento).toLocaleDateString('pt-BR')}
                  </p>
               </div>
            </div>
         </Link>
         <div className="absolute bottom-8 right-8 z-30 flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
            <button
               onClick={(e) => { e.preventDefault(); setShowQR(true); }}
               className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-primary hover:text-white transition-all shadow-xl"
               title="Ver QR Code"
            >
               <span className="material-symbols-outlined !text-2xl">qr_code_2</span>
            </button>
            <Link
               to={`/dashboard/eventos/${event.id}`}
               className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-105 transition-all shadow-xl shadow-primary/20"
               title="Configurar Evento"
            >
               <span className="material-symbols-outlined !text-2xl">settings</span>
            </Link>
         </div>
         {showQR && <QRModal event={event} onClose={() => setShowQR(false)} />}
      </div>
   );
};
