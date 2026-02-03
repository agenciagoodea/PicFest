
import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, Link, useParams, useLocation } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { Evento, Midia, Plano } from '../types';
import { AuthContext } from '../App';

export const OrganizerDashboard: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [showEventModal, setShowEventModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { path: '/dashboard', label: 'Início', icon: 'dashboard' },
    { path: '/dashboard/eventos', label: 'Meus Eventos', icon: 'event' },
    { path: '/dashboard/assinaturas', label: 'Assinaturas', icon: 'workspace_premium' },
    { path: '/dashboard/depoimentos', label: 'Avaliar Sistema', icon: 'star' },
    { path: '/dashboard/perfil', label: 'Meu Perfil', icon: 'account_circle' },
  ];

  // Fecha a sidebar ao mudar de rota no mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-background-dark text-white font-sans">
      {/* Overlay para fechar sidebar no mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Responsiva */}
      <aside className={`
        fixed inset-y-0 left-0 z-[120] w-72 border-r border-white/5 bg-slate-900 md:bg-black/95 backdrop-blur-2xl p-6 flex flex-col gap-10 transition-transform duration-300 lg:relative lg:translate-x-0 lg:bg-black/40
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                 <span className="material-symbols-outlined text-white">auto_awesome_motion</span>
              </div>
              <h2 className="font-black text-xl tracking-tighter">PicFest</h2>
           </div>
           <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-white">
              <span className="material-symbols-outlined">close</span>
           </button>
        </div>

        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex items-center gap-3 p-3.5 rounded-xl transition-all font-semibold text-sm ${
                location.pathname === item.path 
                ? 'bg-primary text-white shadow-lg shadow-primary/10' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined !text-xl">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-4 border-t border-white/5 pt-6">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3 group relative">
            <img src="https://i.pravatar.cc/150?u=organizador" className="w-10 h-10 rounded-full border-2 border-primary/50 object-cover" alt="Perfil" />
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">Alex Morgan</p>
              <p className="text-[10px] text-slate-500 uppercase font-black">Plano Pro</p>
            </div>
            <button onClick={logout} className="ml-auto text-slate-500 hover:text-red-500 transition-colors">
              <span className="material-symbols-outlined text-sm">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar para Mobile */}
        <header className="lg:hidden h-16 border-b border-white/5 bg-black/40 backdrop-blur-md px-6 flex items-center justify-between flex-shrink-0 z-[100]">
           <button onClick={() => setIsSidebarOpen(true)} className="text-white p-2 bg-white/5 rounded-lg">
              <span className="material-symbols-outlined">menu</span>
           </button>
           <h2 className="font-black text-xs tracking-tighter uppercase italic text-primary">Painel</h2>
           <div className="w-8 h-8 rounded-full bg-primary/20" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
          <div className="max-w-6xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<HomeView onNewEvent={() => setShowEventModal(true)} />} />
              <Route path="/eventos" element={<EventsListView onNewEvent={() => setShowEventModal(true)} />} />
              <Route path="/eventos/:id" element={<EventDetailView />} />
              <Route path="/assinaturas" element={<SubscriptionsView />} />
              <Route path="/depoimentos" element={<OrganizerTestimonialView />} />
              <Route path="/perfil" element={<ProfileView />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Modal Novo Evento Responsivo */}
      {showEventModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
           <div className="bg-slate-900 border border-white/10 p-6 md:p-10 rounded-3xl w-full max-w-xl flex flex-col gap-6 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center">
                 <div>
                    <h3 className="text-2xl md:text-3xl font-black tracking-tight">Novo Evento</h3>
                    <p className="text-slate-500 text-xs md:text-sm mt-1">Configure o espaço para suas mídias.</p>
                 </div>
                 <button onClick={() => setShowEventModal(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">close</span>
                 </button>
              </div>
              
              <form className="flex flex-col gap-6">
                 <div className="grid grid-cols-1 gap-5">
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome do Evento</label>
                       <input type="text" className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm" placeholder="Ex: Casamento de Maria e João" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data do Evento</label>
                          <input type="date" className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-white focus:ring-2 focus:ring-primary outline-none text-sm" />
                       </div>
                       <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Slug (URL curta)</label>
                          <div className="relative">
                             <input type="text" maxLength={6} className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 pl-5 pr-14 text-white font-mono uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary text-sm" placeholder="AUTO" />
                             <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 material-symbols-outlined text-sm">auto_fix</span>
                          </div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex flex-col md:flex-row gap-4 mt-4">
                    <button type="button" onClick={() => setShowEventModal(false)} className="order-2 md:order-1 flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all text-sm">Cancelar</button>
                    <button type="submit" className="order-1 md:order-2 flex-1 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all text-sm">Criar Evento</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const HomeView: React.FC<{ onNewEvent: () => void }> = ({ onNewEvent }) => {
  const [events, setEvents] = useState<Evento[]>([]);
  
  useEffect(() => {
    supabaseService.getEvents().then(data => {
      setEvents(data.filter(e => e.status === 'ativo'));
    });
  }, []);

  return (
    <div className="flex flex-col gap-6 md:gap-10 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">Olá, Alex! 👋</h1>
          <p className="text-slate-400 mt-1 text-sm">Métricas de hoje.</p>
        </div>
        <button onClick={onNewEvent} className="w-full md:w-auto px-6 py-3 bg-primary text-white font-black rounded-xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 text-xs">
           <span className="material-symbols-outlined !text-xl">add_circle</span> Novo Evento
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
         <MetricCard label="Mídias Totais" value="1.284" sub="+12% hoje" icon="photo_library" color="text-primary" />
         <MetricCard label="Eventos Ativos" value={events.length.toString()} sub="Ao Vivo" icon="event_available" color="text-green-500" />
         <MetricCard label="Armazenamento" value="4.2 GB" sub="Em uso" icon="cloud" color="text-orange-500" progress={42} />
      </div>

      <section className="mt-4">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl md:text-2xl font-black tracking-tight">Ativos Agora</h2>
            <Link to="/dashboard/eventos" className="text-primary font-bold text-xs flex items-center gap-1">Ver todos <span className="material-symbols-outlined text-xs">arrow_forward</span></Link>
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.length > 0 ? events.map(ev => (
              <EventCard key={ev.id} event={ev} />
            )) : (
              <p className="col-span-full py-10 text-center text-slate-500 text-sm italic">Nenhum evento ativo.</p>
            )}
         </div>
      </section>
    </div>
  );
};

const EventsListView: React.FC<{ onNewEvent: () => void }> = ({ onNewEvent }) => {
  const [events, setEvents] = useState<Evento[]>([]);
  
  useEffect(() => {
    supabaseService.getEvents().then(setEvents);
  }, []);

  return (
    <div className="flex flex-col gap-6">
       <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">Lista de Eventos</h1>
          <button onClick={onNewEvent} className="w-full md:w-auto px-6 py-3 bg-primary text-white font-black rounded-xl text-xs">
             + Novo Evento
          </button>
       </header>

       <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left min-w-[500px]">
             <thead className="bg-white/5 border-b border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                <tr>
                   <th className="px-6 py-4">Evento</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4">Data</th>
                   <th className="px-6 py-4 text-right">Ações</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-white/5">
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-white/5">
                     <td className="px-6 py-4">
                        <p className="font-bold text-xs">{ev.nome}</p>
                     </td>
                     <td className="px-6 py-4 text-[9px] font-black uppercase">
                        <span className={ev.status === 'ativo' ? 'text-green-500' : 'text-slate-500'}>{ev.status}</span>
                     </td>
                     <td className="px-6 py-4 text-[10px] text-slate-400">{new Date(ev.data_evento).toLocaleDateString()}</td>
                     <td className="px-6 py-4 text-right">
                        <Link to={`/dashboard/eventos/${ev.id}`} className="text-primary text-[10px] font-black uppercase">Gerenciar</Link>
                     </td>
                  </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};

const OrganizerTestimonialView: React.FC = () => {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
       setSuccess(true);
       setLoading(false);
    }, 1500);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="material-symbols-outlined !text-6xl text-green-500 mb-4">verified</span>
        <h2 className="text-2xl font-black mb-2">Avaliação Enviada!</h2>
        <p className="text-slate-500 text-sm max-w-xs mx-auto">Obrigado por ajudar a melhorar nossa plataforma.</p>
        <button onClick={() => setSuccess(false)} className="mt-8 px-6 py-2 bg-white/5 rounded-lg text-xs font-bold">Enviar Outra</button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto md:mx-0">
       <header className="mb-8">
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">Avaliar Sistema</h1>
          <p className="text-slate-400 mt-1 text-sm">Sua opinião é fundamental.</p>
       </header>

       <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2 items-center">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sua Nota</label>
             <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button" onClick={() => setRating(star)} className={`material-symbols-outlined !text-3xl ${star <= rating ? 'text-primary fill-1' : 'text-slate-700'}`}>
                    star
                  </button>
                ))}
             </div>
          </div>

          <div className="flex flex-col gap-2">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Conte sua experiência</label>
             <textarea 
               required
               value={text}
               onChange={(e) => setText(e.target.value)}
               className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:ring-1 focus:ring-primary" 
               placeholder="Como foi usar o PicFest em seu evento?"
             />
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 bg-primary text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg">
             {loading ? 'Enviando...' : 'Enviar Avaliação'}
          </button>
       </form>
    </div>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: string;
  sub: string;
  icon: string;
  color: string;
  progress?: number;
}> = ({ label, value, sub, icon, color, progress }) => (
  <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col gap-3">
    <div className="flex justify-between items-start">
      <span className={`material-symbols-outlined !text-xl ${color}`}>{icon}</span>
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
    <div>
      <p className="text-2xl font-black">{value}</p>
      {progress !== undefined ? (
        <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
           <div className="h-full bg-primary" style={{width: `${progress}%`}}></div>
        </div>
      ) : (
        <p className={`text-[9px] font-black uppercase mt-1 opacity-60`}>{sub}</p>
      )}
    </div>
  </div>
);

const EventCard: React.FC<{ event: Evento }> = ({ event }) => (
  <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5 flex flex-col h-full shadow-lg">
    <div className="aspect-video bg-cover bg-center" style={{ backgroundImage: `url(https://picsum.photos/seed/${event.id}/500/300)` }} />
    <div className="p-5 flex flex-col gap-4 flex-1">
       <h4 className="text-sm font-bold truncate leading-tight">{event.nome}</h4>
       <div className="flex gap-2 mt-auto">
          <Link to={`/dashboard/eventos/${event.id}`} className="flex-1 py-2 text-center bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest">Painel</Link>
          <Link to={`/live/${event.slug_curto}`} target="_blank" className="px-3 py-2 bg-primary/20 text-primary rounded-lg">
             <span className="material-symbols-outlined text-sm">tv</span>
          </Link>
       </div>
    </div>
  </div>
);

const EventDetailView: React.FC = () => {
  const { id } = useParams();
  const [media, setMedia] = useState<Midia[]>([]);

  useEffect(() => {
    supabaseService.getMediaByEvent('1', false).then(setMedia);
  }, [id]);

  return (
    <div className="flex flex-col gap-6">
       <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Link to="/dashboard/eventos" className="text-slate-500 hover:text-white">
               <span className="material-symbols-outlined text-sm">arrow_back</span>
            </Link>
            <h1 className="text-2xl font-black tracking-tight">Evento #{id}</h1>
          </div>
          <div className="flex gap-2 mt-2">
             <button className="flex-1 py-2.5 bg-primary text-white text-[10px] font-black rounded-lg uppercase">Exportar</button>
             <Link to={`/live/${id}`} target="_blank" className="flex-1 py-2.5 border border-primary text-primary text-[10px] font-black rounded-lg uppercase text-center">Abrir Telão</Link>
          </div>
       </header>

       <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {media.map(m => (
            <div key={m.id} className="rounded-xl overflow-hidden bg-white/5 border border-white/10">
              <img src={m.url} className="w-full aspect-square object-cover" />
            </div>
          ))}
       </div>
    </div>
  );
};

const SubscriptionsView: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
       <h1 className="text-2xl md:text-4xl font-black tracking-tight">Assinatura</h1>
       <div className="bg-primary p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Plano Atual</p>
          <h2 className="text-2xl font-black">Profissional</h2>
          <div className="mt-4 flex flex-col gap-2">
             <p className="text-xs font-bold">Próxima renovação: 12/10/24</p>
          </div>
       </div>
    </div>
  );
};

const ProfileView: React.FC = () => {
  return (
    <div className="max-w-xl">
       <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-8">Meu Perfil</h1>
       <form className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
             <input type="text" className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white text-sm" defaultValue="Alex Morgan" />
          </div>
          <div className="flex flex-col gap-1.5">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
             <input type="email" readOnly className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-slate-500 text-sm" defaultValue="alex.morgan@email.com" />
          </div>
          <button type="submit" className="py-4 bg-primary text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg mt-2">Salvar</button>
       </form>
    </div>
  );
};
