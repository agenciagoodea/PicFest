
import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, Link, useParams, useLocation } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { Evento, Midia, Plano } from '../types';
import { AuthContext } from '../App';

export const OrganizerDashboard: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [showEventModal, setShowEventModal] = useState(false);

  const menuItems = [
    { path: '/dashboard', label: 'Início', icon: 'dashboard' },
    { path: '/dashboard/eventos', label: 'Meus Eventos', icon: 'event' },
    { path: '/dashboard/assinaturas', label: 'Assinaturas', icon: 'workspace_premium' },
    { path: '/dashboard/depoimentos', label: 'Avaliar Sistema', icon: 'star' },
    { path: '/dashboard/perfil', label: 'Meu Perfil', icon: 'account_circle' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background-dark text-white font-sans">
      {/* Sidebar Refatorada */}
      <aside className="w-72 border-r border-white/5 bg-black/40 backdrop-blur-2xl p-6 flex flex-col gap-10">
        <div className="flex items-center gap-3 px-2">
           <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white">auto_awesome_motion</span>
           </div>
           <h2 className="font-black text-xl tracking-tighter">EventMedia</h2>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
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

        <div className="flex flex-col gap-4">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3 group relative">
            <img src="https://i.pravatar.cc/150?u=organizador" className="w-10 h-10 rounded-full border-2 border-primary/50" />
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
        <Routes>
          <Route path="/" element={<HomeView onNewEvent={() => setShowEventModal(true)} />} />
          <Route path="/eventos" element={<EventsListView onNewEvent={() => setShowEventModal(true)} />} />
          <Route path="/eventos/:id" element={<EventDetailView />} />
          <Route path="/assinaturas" element={<SubscriptionsView />} />
          <Route path="/depoimentos" element={<OrganizerTestimonialView />} />
          <Route path="/perfil" element={<ProfileView />} />
        </Routes>
      </main>

      {/* Modal Novo Evento */}
      {showEventModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
           <div className="bg-slate-900 border border-white/10 p-10 rounded-[2rem] w-full max-w-xl flex flex-col gap-8 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center">
                 <div>
                    <h3 className="text-3xl font-black tracking-tight">Novo Evento</h3>
                    <p className="text-slate-500 text-sm mt-1">Configure o espaço para suas mídias.</p>
                 </div>
                 <button onClick={() => setShowEventModal(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">close</span>
                 </button>
              </div>
              
              <form className="flex flex-col gap-6">
                 <div className="grid grid-cols-1 gap-5">
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome do Evento</label>
                       <input type="text" className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" placeholder="Ex: Casamento de Maria e João" />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                       <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data do Evento</label>
                          <input type="date" className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-white focus:ring-2 focus:ring-primary outline-none" />
                       </div>
                       <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Slug (URL curta)</label>
                          <div className="relative">
                             <input type="text" maxLength={6} className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 pl-5 pr-14 text-white font-mono uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary" placeholder="AUTO" />
                             <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 material-symbols-outlined text-sm">auto_fix</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Configurações Rápidas</label>
                       <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                          <input type="checkbox" className="w-5 h-5 rounded bg-white/10 border-white/10 text-primary focus:ring-primary" id="mod" />
                          <label htmlFor="mod" className="text-sm font-medium text-slate-300">Exigir aprovação prévia de todas as fotos</label>
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex gap-4 mt-4">
                    <button type="button" onClick={() => setShowEventModal(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all">Cancelar</button>
                    <button type="submit" className="flex-1 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">Criar Evento</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

/* --- VIEWS DO DASHBOARD --- */

const HomeView: React.FC<{ onNewEvent: () => void }> = ({ onNewEvent }) => {
  const [events, setEvents] = useState<Evento[]>([]);
  
  useEffect(() => {
    supabaseService.getEvents().then(data => {
      setEvents(data.filter(e => e.status === 'ativo'));
    });
  }, []);

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Olá, Alex! 👋</h1>
          <p className="text-slate-400 mt-1">Aqui está o que está acontecendo com seus eventos hoje.</p>
        </div>
        <button onClick={onNewEvent} className="px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2">
           <span className="material-symbols-outlined !text-xl">add_circle</span> Novo Evento
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <MetricCard label="Mídias Totais" value="1.284" sub="+12% hoje" icon="photo_library" color="text-primary" />
         <MetricCard label="Eventos Ativos" value={events.length.toString()} sub="Veja o status abaixo" icon="event_available" color="text-green-500" />
         <MetricCard label="Armazenamento" value="4.2 GB" sub="De 20 GB contratados" icon="cloud" color="text-orange-500" progress={42} />
      </div>

      <section className="mt-4">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black tracking-tight">Próximos Eventos & Ao Vivo</h2>
            <Link to="/dashboard/eventos" className="text-primary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">Ver todos <span className="material-symbols-outlined text-sm">arrow_forward</span></Link>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.length > 0 ? events.map(ev => (
              <EventCard key={ev.id} event={ev} />
            )) : (
              <div className="col-span-full py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center gap-4">
                 <span className="material-symbols-outlined !text-5xl text-slate-700">event_busy</span>
                 <p className="text-slate-500 font-medium">Nenhum evento ativo no momento.</p>
                 <button onClick={onNewEvent} className="text-primary font-bold hover:underline">Criar meu primeiro evento</button>
              </div>
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
    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
       <header className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Meus Eventos</h1>
            <p className="text-slate-400 mt-1">Gerencie a lista completa de todos os seus eventos.</p>
          </div>
          <button onClick={onNewEvent} className="px-6 py-3 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2">
             <span className="material-symbols-outlined !text-xl">add</span> Novo Evento
          </button>
       </header>

       <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
             <thead className="bg-white/5 border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <tr>
                   <th className="px-8 py-5">Evento</th>
                   <th className="px-8 py-5">Status</th>
                   <th className="px-8 py-5">Data</th>
                   <th className="px-8 py-5">URL Curta</th>
                   <th className="px-8 py-5 text-right">Ações</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-white/5">
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-white/5 transition-all group">
                     <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-cover bg-center border border-white/10" style={{backgroundImage: `url(https://picsum.photos/seed/${ev.id}/100)`}} />
                           <p className="font-bold">{ev.nome}</p>
                        </div>
                     </td>
                     <td className="px-8 py-5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${ev.status === 'ativo' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                           {ev.status}
                        </span>
                     </td>
                     <td className="px-8 py-5 text-sm text-slate-400 font-medium">{new Date(ev.data_evento).toLocaleDateString('pt-BR')}</td>
                     <td className="px-8 py-5 font-mono text-xs text-primary font-black uppercase">/{ev.slug_curto}</td>
                     <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Link to={`/dashboard/eventos/${ev.id}`} className="p-2 bg-white/5 rounded-lg hover:text-primary"><span className="material-symbols-outlined text-sm">settings</span></Link>
                           <Link to={`/live/${ev.slug_curto}`} target="_blank" className="p-2 bg-white/5 rounded-lg hover:text-green-500"><span className="material-symbols-outlined text-sm">tv</span></Link>
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

const OrganizerTestimonialView: React.FC = () => {
  const [rating, setRating] = useState(5);
  const [photo, setPhoto] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabaseService.createTestimonial({
        nome: 'Alex Morgan',
        estrelas: rating,
        texto: text,
        foto_url: photo || 'https://i.pravatar.cc/150?u=organizador',
        organizador_id: 'org1'
      });
      setSuccess(true);
    } catch (err) {
      alert('Erro ao enviar depoimento.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-green-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-green-500/20 mb-8">
           <span className="material-symbols-outlined !text-5xl">verified</span>
        </div>
        <h2 className="text-4xl font-black mb-4">Obrigado pelo seu depoimento!</h2>
        <p className="text-slate-400 text-center max-w-md leading-relaxed">Sua avaliação foi enviada para moderação e em breve aparecerá em nossa landing page para inspirar outros organizadores.</p>
        <button onClick={() => setSuccess(false)} className="mt-10 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10">Enviar Outro</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500 max-w-3xl">
       <header>
          <h1 className="text-4xl font-black tracking-tight">Depoimento da Sua Festa</h1>
          <p className="text-slate-400 mt-1">Sua opinião é fundamental para evoluirmos o sistema.</p>
       </header>

       <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-3xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
             <div className="flex flex-col items-center gap-6 mb-4">
                <div className="relative group cursor-pointer w-32 h-32">
                   <img src={photo || "https://i.pravatar.cc/150?u=organizador"} className="w-full h-full rounded-[2.5rem] border-4 border-primary/20 object-cover" />
                   <div className="absolute inset-0 bg-primary/40 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                      <span className="material-symbols-outlined text-white !text-2xl">add_a_photo</span>
                   </div>
                   <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setPhoto(URL.createObjectURL(file));
                      }}
                   />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sua Foto Favorita da Festa</p>
             </div>

             <div className="flex flex-col gap-3 items-center">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sua Nota para o Sistema</label>
                <div className="flex gap-2">
                   {[1, 2, 3, 4, 5].map(star => (
                     <button 
                       key={star} 
                       type="button"
                       onClick={() => setRating(star)}
                       className={`material-symbols-outlined !text-4xl transition-all ${star <= rating ? 'text-primary fill-1' : 'text-slate-700'}`}
                       style={{ fontVariationSettings: `'FILL' ${star <= rating ? 1 : 0}` }}
                     >
                       star
                     </button>
                   ))}
                </div>
             </div>

             <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Conte como foi a experiência</label>
                <textarea 
                  required
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-40 bg-white/5 border border-white/10 rounded-3xl p-6 text-white outline-none focus:ring-2 focus:ring-primary transition-all leading-relaxed" 
                  placeholder="Ex: Foi fantástico ver a reação dos convidados quando suas fotos apareciam no telão..."
                />
             </div>

             <button 
               type="submit" 
               disabled={loading}
               className="w-full py-5 bg-primary text-white font-black rounded-[1.5rem] shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest"
             >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Enviar Avaliação Premium'}
             </button>
          </form>
       </div>
    </div>
  );
};

// ... SubscriptionsView, ProfileView, etc permanecem os mesmos ...
const SubscriptionsView: React.FC = () => {
  const plans: Plano[] = [
    { id: 'free', nome: 'Básico', valor: 0, limite_eventos: 1, limite_storage: 1, recorrencia: 'Grátis' },
    { id: 'pro', nome: 'Profissional', valor: 49.90, limite_eventos: 10, limite_storage: 20, recorrencia: 'Mensal' },
    { id: 'ent', nome: 'Enterprise', valor: 199.00, limite_eventos: 0, limite_storage: 100, recorrencia: 'Mensal' }
  ];

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
       <header>
          <h1 className="text-4xl font-black tracking-tight">Assinatura & Planos</h1>
          <p className="text-slate-400 mt-1">Gerencie seu plano atual e libere novos recursos.</p>
       </header>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-primary p-10 rounded-[2.5rem] text-white shadow-2xl shadow-primary/30 relative overflow-hidden">
             <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-10">
                   <div>
                      <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">Seu Plano Atual</p>
                      <h2 className="text-5xl font-black">Plano Profissional</h2>
                   </div>
                   <span className="px-4 py-1.5 bg-white text-primary rounded-full text-xs font-black uppercase">Ativo</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-auto">
                   <div>
                      <p className="text-[10px] font-bold uppercase opacity-60">Faturamento</p>
                      <p className="text-lg font-bold">Mensal (R$ 49,90)</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold uppercase opacity-60">Próximo Vencimento</p>
                      <p className="text-lg font-bold">12/10/2024</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold uppercase opacity-60">Mídias no Mês</p>
                      <p className="text-lg font-bold">842 / 1.000</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold uppercase opacity-60">Status de Pagamento</p>
                      <p className="text-lg font-bold text-green-200 flex items-center gap-1">Confirmado <span className="material-symbols-outlined text-sm">verified</span></p>
                   </div>
                </div>
             </div>
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full"></div>
          </div>

          <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] flex flex-col gap-6">
             <h3 className="text-xl font-black">Histórico de Pagamentos</h3>
             <div className="flex flex-col gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                     <div>
                        <p className="font-bold text-sm">Assinatura Pro - Set/24</p>
                        <p className="text-[10px] text-slate-500 uppercase">NF-e #827364</p>
                     </div>
                     <span className="material-symbols-outlined text-slate-500 hover:text-white cursor-pointer">receipt_long</span>
                  </div>
                ))}
             </div>
             <button className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold transition-all mt-auto">Ver faturas completas</button>
          </div>
       </div>

       <section className="mt-6">
          <h2 className="text-2xl font-black mb-8 text-center">Fazer Upgrade agora</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {plans.map(p => (
               <div key={p.id} className={`bg-white/5 border ${p.id === 'pro' ? 'border-primary ring-1 ring-primary/30' : 'border-white/10'} p-10 rounded-[2.5rem] flex flex-col gap-6 relative group transition-all hover:translate-y-[-4px]`}>
                  {p.id === 'pro' && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-4 py-1 rounded-full text-[10px] font-black uppercase">Atual</span>}
                  <h4 className="text-2xl font-black">{p.nome}</h4>
                  <div className="flex items-baseline gap-1">
                     <span className="text-4xl font-black">R$ {p.valor.toFixed(2)}</span>
                     <span className="text-slate-500 text-sm">/mês</span>
                  </div>
                  <ul className="flex flex-col gap-4 my-4">
                     <li className="flex items-center gap-3 text-sm text-slate-300">
                        <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                        {p.limite_eventos === 0 ? 'Eventos Ilimitados' : `${p.limite_eventos} Evento${p.limite_eventos > 1 ? 's' : ''}`}
                     </li>
                     <li className="flex items-center gap-3 text-sm text-slate-300">
                        <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                        {p.limite_storage}GB de Armazenamento
                     </li>
                     <li className="flex items-center gap-3 text-sm text-slate-300">
                        <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                        Painel de Moderação em Tempo Real
                     </li>
                  </ul>
                  <button 
                    className={`w-full py-4 rounded-2xl font-black transition-all ${p.id === 'pro' ? 'bg-white/5 text-slate-500 cursor-default' : 'bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02]'}`}
                    disabled={p.id === 'pro'}
                  >
                     {p.id === 'pro' ? 'Seu Plano' : p.id === 'free' ? 'Voltar para Grátis' : 'Assinar via Mercado Pago'}
                  </button>
               </div>
             ))}
          </div>
       </section>
    </div>
  );
};

const ProfileView: React.FC = () => {
  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500 max-w-4xl">
       <header>
          <h1 className="text-4xl font-black tracking-tight">Meu Perfil</h1>
          <p className="text-slate-400 mt-1">Informações da sua conta de organizador.</p>
       </header>

       <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-12 shadow-2xl">
          <form className="grid grid-cols-1 md:grid-cols-3 gap-12">
             <div className="flex flex-col items-center gap-6">
                <div className="relative group cursor-pointer">
                   <img src="https://i.pravatar.cc/150?u=organizador" className="w-48 h-48 rounded-[3rem] border-4 border-primary/20 object-cover" />
                   <div className="absolute inset-0 bg-primary/40 rounded-[3rem] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                      <span className="material-symbols-outlined text-white !text-4xl">add_a_photo</span>
                   </div>
                </div>
                <div className="text-center">
                   <p className="text-sm font-bold text-slate-400">Tamanho sugerido: 500x500px</p>
                   <button type="button" className="text-primary text-xs font-black uppercase mt-2 hover:underline">Alterar Foto</button>
                </div>
             </div>

             <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2 col-span-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome Completo</label>
                   <input type="text" className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-white outline-none focus:ring-2 focus:ring-primary" defaultValue="Alex Morgan" />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail</label>
                   <input type="email" disabled className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-slate-500 cursor-not-allowed outline-none" defaultValue="alex.morgan@eventos.com" />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">WhatsApp</label>
                   <input type="text" className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-white outline-none focus:ring-2 focus:ring-primary" defaultValue="+55 11 99999-0000" />
                </div>
                <div className="flex flex-col gap-2 col-span-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Instagram Profile</label>
                   <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">instagram.com/</span>
                      <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 pl-32 pr-5 text-white outline-none focus:ring-2 focus:ring-primary" defaultValue="alexmorgan_events" />
                   </div>
                </div>
                
                <div className="col-span-2 h-px bg-white/5 my-4"></div>

                <div className="flex flex-col gap-2 col-span-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha Atual (Para Alterações)</label>
                   <input type="password" placeholder="••••••••" className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-white outline-none focus:ring-2 focus:ring-primary" />
                </div>

                <div className="col-span-2 mt-4">
                   <button type="submit" className="w-full md:w-auto px-12 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                      Salvar Alterações
                   </button>
                </div>
             </div>
          </form>
       </div>
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
  <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] flex flex-col gap-4 shadow-xl">
    <div className="flex justify-between items-start">
      <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${color}`}>
        <span className="material-symbols-outlined !text-2xl">{icon}</span>
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
    <div className="mt-2">
      <p className="text-4xl font-black tracking-tight">{value}</p>
      {progress !== undefined ? (
        <div className="w-full h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden">
           <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{width: `${progress}%`}}></div>
        </div>
      ) : (
        <p className={`text-[10px] font-black uppercase mt-1 ${sub.includes('+') ? 'text-green-500' : 'text-slate-500'}`}>{sub}</p>
      )}
    </div>
  </div>
);

const EventCard: React.FC<{ event: Evento }> = ({ event }) => (
  <div className="rounded-[2rem] border border-white/10 overflow-hidden bg-white/5 hover:border-primary transition-all group flex flex-col h-full shadow-lg">
    <div className="aspect-[16/10] bg-cover bg-center relative" style={{ backgroundImage: `url(https://picsum.photos/seed/${event.id}/500/300)` }}>
       <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 ${event.status === 'ativo' ? 'bg-green-500 text-white' : 'bg-slate-500 text-white'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${event.status === 'ativo' ? 'bg-white animate-pulse' : 'bg-white/50'}`}></span>
          {event.status === 'ativo' ? 'Ao Vivo' : 'Encerrado'}
       </div>
       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm flex items-center justify-center gap-4">
          <Link to={`/live/${event.slug_curto}`} target="_blank" className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-xl shadow-primary/20 hover:scale-110 transition-transform">
             <span className="material-symbols-outlined !text-2xl">tv</span>
          </Link>
          <Link to={`/evento/${event.slug_curto}`} target="_blank" className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-xl hover:scale-110 transition-transform">
             <span className="material-symbols-outlined !text-2xl">link</span>
          </Link>
       </div>
    </div>
    <div className="p-8 flex flex-col gap-6 flex-1">
       <div>
         <h4 className="text-xl font-bold truncate leading-tight">{event.nome}</h4>
         <p className="text-xs text-slate-500 font-medium mt-1">{new Date(event.data_evento).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
       </div>
       <div className="flex gap-3 mt-auto">
          <Link to={`/dashboard/eventos/${event.id}`} className="flex-1 py-3 text-center bg-white/5 border border-white/5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">Configurar</Link>
          <button className="px-4 py-3 bg-primary/20 text-primary rounded-xl transition-all hover:bg-primary hover:text-white">
             <span className="material-symbols-outlined text-sm">qr_code_2</span>
          </button>
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
    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
       <header className="flex justify-between items-start">
         <div>
            <div className="flex items-center gap-3 mb-2">
               <Link to="/dashboard/eventos" className="p-1.5 bg-white/5 rounded-lg text-slate-500 hover:text-white">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
               </Link>
               <span className="text-[10px] font-black text-primary uppercase tracking-widest">Painel do Organizador</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">Tech Gala 2024</h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
               <span className="material-symbols-outlined text-sm">tag</span> ID: {id} • 
               <span className="material-symbols-outlined text-sm">photo_library</span> {media.length} fotos capturadas
            </p>
         </div>
         <div className="flex gap-4">
            <button className="px-6 py-3 border border-white/10 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all">Exportar Tudo</button>
            <Link to={`/live/${id}`} target="_blank" className="px-6 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">Abrir Telão</Link>
         </div>
       </header>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {media.map(m => (
            <div key={m.id} className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 group relative shadow-lg">
              <img src={m.url} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                <div className="flex gap-2">
                   {!m.aprovado && <button className="flex-1 py-2 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase">Aprovar</button>}
                   <button className="flex-1 py-2 bg-red-500/20 text-red-500 backdrop-blur-md rounded-xl text-[10px] font-black uppercase border border-red-500/20">Remover</button>
                </div>
              </div>
              <div className="absolute top-3 left-3">
                 <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${m.aprovado ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                    {m.aprovado ? 'APROVADO' : 'PENDENTE'}
                 </span>
              </div>
            </div>
          ))}
       </div>
    </div>
  );
};
