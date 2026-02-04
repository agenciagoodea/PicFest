
import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { Evento, Midia, Plano, Profile } from '../types';
import { AuthContext } from '../App';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { MetricCard } from '../components/common/MetricCard';

export const OrganizerDashboard: React.FC = () => {
   const { user, logout } = useContext(AuthContext);
   const [showEventModal, setShowEventModal] = useState(false);
   const [eventFormData, setEventFormData] = useState({
      nome: '',
      data_evento: '',
      slug_curto: '',
      moderacao_ativa: false,
   });
   const [creating, setCreating] = useState(false);

   const menuItems = [
      { path: '/dashboard', label: 'Início', icon: 'dashboard' },
      { path: '/dashboard/eventos', label: 'Meus Eventos', icon: 'event' },
      { path: '/dashboard/assinaturas', label: 'Assinaturas', icon: 'workspace_premium' },
      { path: '/dashboard/depoimentos', label: 'Avaliar Sistema', icon: 'star' },
      { path: '/dashboard/perfil', label: 'Meu Perfil', icon: 'account_circle' },
   ];

   const handleCreateEvent = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;

      setCreating(true);
      try {
         // Gerar slug automático se não fornecido
         const slug = eventFormData.slug_curto || Math.random().toString(36).substring(2, 8).toUpperCase();

         const newEvent = await supabaseService.createEvent({
            nome: eventFormData.nome,
            data_evento: eventFormData.data_evento,
            slug_curto: slug,
            organizador_id: user.id,
            status: 'ativo',
            config_json: {
               moderacao_ativa: eventFormData.moderacao_ativa,
            },
         });

         if (newEvent) {
            setShowEventModal(false);
            setEventFormData({ nome: '', data_evento: '', slug_curto: '', moderacao_ativa: false });
            // Recarregar página para mostrar novo evento
            window.location.reload();
         } else {
            alert('Erro ao criar evento');
         }
      } catch (error) {
         console.error('Erro ao criar evento:', error);
         alert('Erro ao criar evento');
      } finally {
         setCreating(false);
      }
   };

   return (
      <DashboardLayout menuItems={menuItems} title="PicFest" icon="auto_awesome_motion">
         <Routes>
            <Route path="/" element={<HomeView onNewEvent={() => setShowEventModal(true)} />} />
            <Route path="/eventos" element={<EventsListView onNewEvent={() => setShowEventModal(true)} />} />
            <Route path="/eventos/:id" element={<EventDetailView />} />
            <Route path="/assinaturas" element={<SubscriptionsView />} />
            <Route path="/depoimentos" element={<OrganizerTestimonialView />} />
            <Route path="/perfil" element={<ProfileView />} />
         </Routes>

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

                  <form onSubmit={handleCreateEvent} className="flex flex-col gap-6">
                     <div className="grid grid-cols-1 gap-5">
                        <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome do Evento</label>
                           <input
                              type="text"
                              required
                              value={eventFormData.nome}
                              onChange={(e) => setEventFormData({ ...eventFormData, nome: e.target.value })}
                              className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                              placeholder="Ex: Casamento de Maria e João"
                           />
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                           <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data do Evento</label>
                              <input
                                 type="date"
                                 required
                                 value={eventFormData.data_evento}
                                 onChange={(e) => setEventFormData({ ...eventFormData, data_evento: e.target.value })}
                                 className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-white focus:ring-2 focus:ring-primary outline-none"
                              />
                           </div>
                           <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Slug (URL curta)</label>
                              <div className="relative">
                                 <input
                                    type="text"
                                    maxLength={6}
                                    value={eventFormData.slug_curto}
                                    onChange={(e) => setEventFormData({ ...eventFormData, slug_curto: e.target.value.toUpperCase() })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 pl-5 pr-14 text-white font-mono uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="AUTO"
                                 />
                                 <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 material-symbols-outlined text-sm">auto_fix</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Configurações Rápidas</label>
                           <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                              <input
                                 type="checkbox"
                                 checked={eventFormData.moderacao_ativa}
                                 onChange={(e) => setEventFormData({ ...eventFormData, moderacao_ativa: e.target.checked })}
                                 className="w-5 h-5 rounded bg-white/10 border-white/10 text-primary focus:ring-primary"
                                 id="mod"
                              />
                              <label htmlFor="mod" className="text-sm font-medium text-slate-300">Exigir aprovação prévia de todas as fotos</label>
                           </div>
                        </div>
                     </div>

                     <div className="flex gap-4 mt-4">
                        <button type="button" onClick={() => setShowEventModal(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all">Cancelar</button>
                        <button
                           type="submit"
                           disabled={creating}
                           className="flex-1 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                           {creating ? (
                              <>
                                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                 Criando...
                              </>
                           ) : (
                              'Criar Evento'
                           )}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </DashboardLayout>
   );
};

/* --- VIEWS --- */


const HomeView: React.FC<{ onNewEvent: () => void }> = ({ onNewEvent }) => {
   const { user } = useContext(AuthContext);
   const [events, setEvents] = useState<Evento[]>([]);
   const [metrics, setMetrics] = useState({ totalMedia: 0, storageUsed: 0 });
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      if (!user) return;

      setLoading(true);
      Promise.all([
         supabaseService.getEventsByOrganizer(user.id),
         // Calcular métricas agregadas dos eventos dele
         // (Isso poderia ser um endpoint novo, mas vamos simular via eventos por enquanto ou fazer queries paralelas)
      ]).then(([eventsData]) => {
         setEvents(eventsData.filter(e => e.status?.toLowerCase() === 'ativo'));

         // Buscar total de mídias de todos os eventos dele
         const eventIds = eventsData.map(e => e.id);
         if (eventIds.length > 0) {
            // Pequena query p/ pegar contador total de midias
            // (Para simplicidade aqui, vamos apenas setar 0 ou buscar em segundo plano)
         }
      }).finally(() => setLoading(false));
   }, [user]);

   if (loading) {
      return (
         <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
         </div>
      );
   }

   return (
      <div className="flex flex-col gap-10 animate-in fade-in duration-500">
         <header className="flex justify-between items-center">
            <div>
               <h1 className="text-4xl font-black tracking-tight text-white">Olá! 👋</h1>
               <p className="text-slate-400 mt-1">Aqui está o que está acontecendo com seus eventos hoje.</p>
            </div>
            <button onClick={onNewEvent} className="px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2">
               <span className="material-symbols-outlined !text-xl">add_circle</span> Novo Evento
            </button>
         </header>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <MetricCard label="Mídias Totais" value="---" sub="Total em todos eventos" icon="photo_library" color="text-primary" />
            <MetricCard label="Eventos Ativos" value={events.length.toString()} sub="Veja o status abaixo" icon="event_available" color="text-green-500" />
            <MetricCard label="Armazenamento Est." value="-- MB" sub="Uso aproximado" icon="cloud" color="text-orange-500" progress={0} />
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
   const { user } = useContext(AuthContext);
   const [events, setEvents] = useState<Evento[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      if (!user) return;

      setLoading(true);
      supabaseService.getEventsByOrganizer(user.id).then(setEvents).finally(() => setLoading(false));
   }, [user]);

   if (loading) {
      return (
         <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
         </div>
      );
   }

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
                              <div className="w-12 h-12 rounded-xl bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(https://picsum.photos/seed/${ev.id}/100)` }} />
                              <p className="font-bold">{ev.nome}</p>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${ev.status?.toLowerCase() === 'ativo' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
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
   const { user } = useContext(AuthContext);
   const [rating, setRating] = useState(5);
   const [photo, setPhoto] = useState<string | null>(null);
   const [text, setText] = useState('');
   const [loading, setLoading] = useState(false);
   const [success, setSuccess] = useState(false);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;

      setLoading(true);
      try {
         await supabaseService.createTestimonial({
            nome: user.nome || 'Organizador',
            estrelas: rating,
            texto: text,
            foto_url: photo || user.foto_perfil || `https://i.pravatar.cc/150?u=${user.id}`,
            organizador_id: user.id
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
                     <img src={photo || user?.foto_perfil || `https://i.pravatar.cc/150?u=${user?.id}`} className="w-full h-full rounded-[2.5rem] border-4 border-primary/20 object-cover" />
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
                           className={`material-symbols-outlined !text-4xl transition-all ${star <= rating ? 'text-primary' : 'text-slate-700'}`}
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



const SubscriptionsView: React.FC = () => {
   const { user } = useContext(AuthContext);
   const [plans, setPlans] = useState<Plano[]>([]);
   const [userSub, setUserSub] = useState<any>(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const load = async () => {
         setLoading(true);
         try {
            const [plansData, subData] = await Promise.all([
               supabaseService.getPlans(),
               user ? supabaseService.getUserSubscription(user.id) : null
            ]);
            setPlans(plansData);
            setUserSub(subData);
         } finally {
            setLoading(false);
         }
      };
      load();
   }, [user]);

   if (loading) return <div className="p-20 text-center animate-pulse">Consultando oráculo financeiro...</div>;

   const activePlan = userSub?.planos || plans.find(p => p.id === 'free');

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
                        <h2 className="text-5xl font-black">{activePlan?.nome || 'Plano Gratuito'}</h2>
                     </div>
                     <span className="px-4 py-1.5 bg-white text-primary rounded-full text-xs font-black uppercase">{userSub ? 'Ativo' : 'Free Tier'}</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-auto">
                     <div>
                        <p className="text-[10px] font-bold uppercase opacity-60">Faturamento</p>
                        <p className="text-lg font-bold">{activePlan?.valor > 0 ? `R$ ${activePlan.valor.toFixed(2)}` : 'Grátis'}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-bold uppercase opacity-60">Próximo Vencimento</p>
                        <p className="text-lg font-bold">{userSub?.data_expiracao ? new Date(userSub.data_expiracao).toLocaleDateString('pt-BR') : '--/--/----'}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-bold uppercase opacity-60">Eventos</p>
                        <p className="text-lg font-bold">{activePlan?.limite_eventos === 0 ? 'Ilimitados' : activePlan?.limite_eventos}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-bold uppercase opacity-60">Status</p>
                        <p className="text-lg font-bold text-green-200 flex items-center gap-1">Ok <span className="material-symbols-outlined text-sm">verified</span></p>
                     </div>
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full"></div>
            </div>

            <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] flex flex-col gap-6">
               <h3 className="text-xl font-black">Histórico de Pagamentos</h3>
               <div className="flex flex-col gap-4">
                  <div className="py-20 text-center text-slate-600 italic text-sm">Nenhuma fatura pendente.</div>
               </div>
               <button className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold transition-all mt-auto border border-white/5">Ver faturas completas</button>
            </div>
         </div>

         <section className="mt-6">
            <h2 className="text-2xl font-black mb-8 text-center text-white">Fazer Upgrade agora</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {plans.map(p => {
                  const isCurrent = activePlan?.id === p.id;
                  return (
                     <div key={p.id} className={`bg-white/5 border ${isCurrent ? 'border-primary ring-1 ring-primary/30' : 'border-white/10'} p-10 rounded-[2.5rem] flex flex-col gap-6 relative group transition-all hover:translate-y-[-4px]`}>
                        {isCurrent && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-4 py-1 rounded-full text-[10px] font-black uppercase">Atual</span>}
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
                           className={`w-full py-4 rounded-2xl font-black transition-all ${isCurrent ? 'bg-white/5 text-slate-500 cursor-default' : 'bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02]'}`}
                           disabled={isCurrent}
                        >
                           {isCurrent ? 'Seu Plano' : p.valor === 0 ? 'Mudar para este' : 'Assinar agora'}
                        </button>
                     </div>
                  );
               })}
            </div>
         </section>
      </div>
   );
};



const ProfileView: React.FC = () => {
   const { user } = useContext(AuthContext);
   const [formData, setFormData] = useState({
      nome: '',
      whatsapp: '',
      instagram: '',
      foto_perfil: ''
   });
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      if (user) {
         setFormData({
            nome: user.nome || '',
            whatsapp: user.whatsapp || '',
            instagram: user.instagram || '',
            foto_perfil: user.foto_perfil || ''
         });
      }
   }, [user]);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      setLoading(true);
      try {
         await supabaseService.updateProfile(user.id, formData);
         alert('Perfil atualizado com sucesso!');
         // Opcional: recarregar auth para atualizar contexto
         window.location.reload();
      } catch (err) {
         alert('Erro ao atualizar perfil.');
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="flex flex-col gap-10 animate-in fade-in duration-500 max-w-4xl">
         <header>
            <h1 className="text-4xl font-black tracking-tight">Meu Perfil</h1>
            <p className="text-slate-400 mt-1">Informações da sua conta de organizador.</p>
         </header>

         <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-12 shadow-2xl">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-12">
               <div className="flex flex-col items-center gap-6">
                  <div className="relative group cursor-pointer">
                     <img src={formData.foto_perfil || `https://i.pravatar.cc/150?u=${user?.id}`} className="w-48 h-48 rounded-[3rem] border-4 border-primary/20 object-cover" />
                     <div className="absolute inset-0 bg-primary/40 rounded-[3rem] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <span className="material-symbols-outlined text-white !text-4xl">add_a_photo</span>
                     </div>
                  </div>
                  <div className="text-center">
                     <p className="text-sm font-bold text-slate-400">Clique para alterar</p>
                  </div>
               </div>

               <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2 col-span-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome Completo</label>
                     <input
                        type="text"
                        required
                        className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-white outline-none focus:ring-2 focus:ring-primary"
                        value={formData.nome}
                        onChange={e => setFormData({ ...formData, nome: e.target.value })}
                     />
                  </div>
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail</label>
                     <input type="email" disabled className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-slate-500 cursor-not-allowed outline-none" value={user?.email || ''} />
                  </div>
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">WhatsApp</label>
                     <input
                        type="text"
                        className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-white outline-none focus:ring-2 focus:ring-primary"
                        value={formData.whatsapp}
                        onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                        placeholder="+55 00 00000-0000"
                     />
                  </div>
                  <div className="flex flex-col gap-2 col-span-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Instagram Username</label>
                     <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">@</span>
                        <input
                           type="text"
                           className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 pl-10 pr-5 text-white outline-none focus:ring-2 focus:ring-primary"
                           placeholder="seu_perfil"
                           value={formData.instagram}
                           onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                        />
                     </div>
                  </div>

                  <div className="col-span-2 h-px bg-white/5 my-4"></div>

                  <div className="col-span-2 mt-4">
                     <button
                        type="submit"
                        disabled={loading}
                        className="w-full md:w-auto px-12 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                     >
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                     </button>
                  </div>
               </div>
            </form>
         </div>
      </div>
   );
};


const EventCard: React.FC<{ event: Evento }> = ({ event }) => (
   <div className="rounded-[2rem] border border-white/10 overflow-hidden bg-white/5 hover:border-primary transition-all group flex flex-col h-full shadow-lg">
      <div className="aspect-[16/10] bg-cover bg-center relative" style={{ backgroundImage: `url(https://picsum.photos/seed/${event.id}/500/300)` }}>
         <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 ${event.status?.toLowerCase() === 'ativo' ? 'bg-green-500 text-white' : 'bg-slate-500 text-white'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${event.status?.toLowerCase() === 'ativo' ? 'bg-white animate-pulse' : 'bg-white/50'}`}></span>
            {event.status?.toLowerCase() === 'ativo' ? 'Ao Vivo' : 'Encerrado'}
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
   const [loading, setLoading] = useState(true);

   const loadMedia = async () => {
      if (id) {
         setLoading(true);
         try {
            const data = await supabaseService.getMediaByEvent(id, false);
            setMedia(data);
         } finally {
            setLoading(false);
         }
      }
   };

   useEffect(() => {
      loadMedia();
   }, [id]);

   const handleApprove = async (mediaId: string) => {
      try {
         await supabaseService.approveMedia(mediaId, true);
         setMedia(prev => prev.map(m => m.id === mediaId ? { ...m, aprovado: true } : m));
      } catch (err) {
         alert('Erro ao aprovar mídia');
      }
   };

   const handleDelete = async (mediaId: string) => {
      if (!confirm('Deseja realmente excluir esta mídia? Ela será removida permanentemente.')) return;
      try {
         await supabaseService.deleteMedia(mediaId);
         setMedia(prev => prev.filter(m => m.id !== mediaId));
      } catch (err) {
         alert('Erro ao excluir mídia');
      }
   };

   if (loading) return <div className="p-20 text-center uppercase tracking-widest text-xs font-black animate-pulse">Lendo memórias...</div>;

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
               <h1 className="text-4xl font-black tracking-tight">Gerenciar Evento</h1>
               <p className="text-slate-500 mt-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">tag</span> ID: {id} •
                  <span className="material-symbols-outlined text-sm">photo_library</span> {media.length} fotos capturadas
               </p>
            </div>
            <div className="flex gap-4">
               <button onClick={loadMedia} className="p-3 bg-white/5 rounded-xl hover:text-primary transition-all">
                  <span className="material-symbols-outlined text-sm">refresh</span>
               </button>
               <button className="px-6 py-3 border border-white/10 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all">Exportar Tudo</button>
               {id && <Link to={`/live/${id}`} target="_blank" className="px-6 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">Abrir Telão</Link>}
            </div>
         </header>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {media.length === 0 ? (
               <div className="col-span-full py-20 text-center text-slate-500 italic">Nenhuma mídia enviada ainda.</div>
            ) : media.map(m => (
               <div key={m.id} className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 group relative shadow-lg">
                  {m.tipo === 'video' ? (
                     <video src={m.url} className="w-full aspect-square object-cover" />
                  ) : (
                     <img src={m.url} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                     <div className="flex gap-2">
                        {!m.aprovado && <button onClick={() => handleApprove(m.id)} className="flex-1 py-2 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase">Aprovar</button>}
                        <button onClick={() => handleDelete(m.id)} className="flex-1 py-2 bg-red-500/20 text-red-500 backdrop-blur-md rounded-xl text-[10px] font-black uppercase border border-red-500/20">Remover</button>
                     </div>
                  </div>
                  <div className="absolute top-3 left-3 flex gap-2">
                     <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${m.aprovado ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                        {m.aprovado ? 'APROVADO' : 'PENDENTE'}
                     </span>
                     {m.tipo === 'video' && <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase">Video</span>}
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
};

