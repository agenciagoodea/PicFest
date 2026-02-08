
import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { Evento, Midia, Plano, Profile } from '../types';
import { AuthContext } from '../App';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { MetricCard } from '../components/common/MetricCard';
import { ProfileForm } from '../components/ProfileForm';
import { PricingCard } from '../components/common/PricingCard';
import { DashboardSlideshow } from '../components/DashboardSlideshow';
import { mercadoPagoService } from '../services/mercadoPagoService';
import { Depoimento } from '../types';
import { QRModal } from '../components/common/QRModal';
import { Skeleton, DashboardSkeleton, TableSkeleton } from '../components/common/Skeleton';

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
   const [userSub, setUserSub] = useState<any>(null);
   const [loadingSub, setLoadingSub] = useState(true);

   useEffect(() => {
      if (user) {
         supabaseService.getUserSubscription(user.id)
            .then(setUserSub)
            .finally(() => setLoadingSub(false));
      }
   }, [user]);

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
            <Route path="/" element={<HomeView onNewEvent={() => setShowEventModal(true)} userSub={userSub} />} />
            <Route path="/eventos" element={<EventsListView onNewEvent={() => setShowEventModal(true)} />} />
            <Route path="/eventos/:id" element={<EventDetailView userSub={userSub} />} />
            <Route path="/assinaturas" element={<SubscriptionsView userSub={userSub} onUpdateSub={() => supabaseService.getUserSubscription(user!.id).then(setUserSub)} />} />
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


const HomeView: React.FC<{ onNewEvent: () => void, userSub: any }> = ({ onNewEvent, userSub }) => {
   const { user } = useContext(AuthContext);
   const [events, setEvents] = useState<Evento[]>([]);
   const [totalMediaCount, setTotalMediaCount] = useState(0);
   const [loading, setLoading] = useState(true);

   const activePlan = userSub?.planos;
   const canCreateMore = activePlan ? (activePlan.limite_eventos === 0 || events.length < activePlan.limite_eventos) : true;

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
      return <DashboardSkeleton />;
   }

   return (
      <div className="flex flex-col gap-10 animate-in fade-in duration-500">
         <header className="flex flex-col sm:flex-row justify-between items-center gap-6 sm:gap-0">
            <div className="text-center sm:text-left">
               <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">Olá! 👋</h1>
               <p className="text-slate-400 mt-1">Aqui está o que está acontecendo com seus eventos hoje.</p>
            </div>
            <button
               onClick={() => canCreateMore ? onNewEvent() : alert('Você atingiu o limite de eventos do seu plano. Faça um upgrade para criar mais!')}
               className={`w-full sm:w-auto px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2 ${!canCreateMore ? 'opacity-50 grayscale' : ''}`}
            >
               <span className="material-symbols-outlined !text-xl">{canCreateMore ? 'add_circle' : 'lock'}</span> Novo Evento
            </button>
         </header>

         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <MetricCard label="Mídias Atuais" value="0" sub={`Limite: ${activePlan?.limite_midias === 0 ? '∞' : (activePlan?.limite_midias || '---')}`} icon="photo_library" color="text-primary" />
            <MetricCard label="Eventos Ativos" value={events.length.toString()} sub={`Limite: ${activePlan?.limite_eventos === 0 ? '∞' : (activePlan?.limite_eventos || '---')}`} icon="event_available" color="text-green-500" />
            <MetricCard label="Download em Lote" value={activePlan?.pode_baixar ? 'LIBERADO' : 'BLOQUEADO'} sub="Status do Recurso" icon="download" color={activePlan?.pode_baixar ? 'text-blue-500' : 'text-red-500'} />
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col justify-center text-center sm:text-left">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status do Plano</p>
               <p className="text-sm font-black text-white uppercase">{activePlan?.nome || 'Analizando...'}</p>
               <Link to="/dashboard/assinaturas" className="text-[10px] text-primary font-bold mt-2 hover:underline">Ver Detalhes →</Link>
            </div>
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
      console.log('EventsListView mounted. User:', user);
      if (!user) {
         console.warn('EventsListView: User is null, skipping fetch');
         return;
      }

      console.log('EventsListView: Fetching events for organizer:', user.id);
      setLoading(true);
      supabaseService.getEventsByOrganizer(user.id)
         .then(data => {
            console.log('EventsListView: Events fetched:', data);
            setEvents(data);
         })
         .catch(err => console.error('EventsListView: Error fetching events:', err))
         .finally(() => setLoading(false));
   }, [user]);

   if (loading) {
      return <TableSkeleton rows={events.length > 0 ? events.length : 5} />;
   }

   return (
      <div className="flex flex-col gap-10 animate-in fade-in duration-500">
         <header className="flex flex-col sm:flex-row justify-between items-center gap-6 sm:gap-0">
            <div className="text-center sm:text-left">
               <h1 className="text-3xl md:text-4xl font-black tracking-tight">Meus Eventos</h1>
               <p className="text-slate-400 mt-1">Gerencie a lista completa de todos os seus eventos.</p>
            </div>
            <button onClick={onNewEvent} className="w-full sm:w-auto px-6 py-3 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
               <span className="material-symbols-outlined !text-xl">add</span> Novo Evento
            </button>
         </header>

         <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
            <table className="w-full text-left">
               <thead className="bg-white/5 border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <tr>
                     <th className="px-8 py-5">Evento</th>
                     <th className="px-8 py-5 hidden md:table-cell">Status</th>
                     <th className="px-8 py-5 hidden sm:table-cell">Data</th>
                     <th className="px-8 py-5 hidden lg:table-cell">URL Curta</th>
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
   const { profile } = useContext(AuthContext);
   const [rating, setRating] = useState(5);
   const [text, setText] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [testimonials, setTestimonials] = useState<Depoimento[]>([]);
   const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
   const [organizerMedia, setOrganizerMedia] = useState<Midia[]>([]);
   const [showMediaPicker, setShowMediaPicker] = useState(false);

   const loadTestimonials = async () => {
      if (!profile?.id) return;
      const data = await supabaseService.getTestimonialsByOrganizer(profile.id);
      setTestimonials(data);
   };

   const loadOrganizerMedia = async () => {
      if (!profile?.id) return;
      const data = await supabaseService.getOrganizerMedia(profile.id);
      setOrganizerMedia(data);
   };

   useEffect(() => {
      loadTestimonials();
      loadOrganizerMedia();
   }, [profile?.id]);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!text || isSubmitting) return;

      setIsSubmitting(true);
      try {
         await supabaseService.createTestimonial({
            organizador_id: profile.id,
            nome: profile.nome,
            foto_url: selectedMediaUrl || profile.foto_perfil || `https://i.pravatar.cc/150?u=${profile.id}`,
            estrelas: rating,
            texto: text,
            aprovado: false
         });
         alert('Obrigado pelo seu depoimento! Ele aparecerá na landing page após a moderação.');
         setText('');
         setRating(5);
         setSelectedMediaUrl(null);
         loadTestimonials();
      } catch (error) {
         alert('Erro ao enviar depoimento.');
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleDelete = async (id: string) => {
      if (!window.confirm('Tem certeza que deseja excluir esta avaliação?')) return;
      try {
         await supabaseService.deleteTestimonial(id);
         loadTestimonials();
      } catch (error) {
         alert('Erro ao excluir avaliação.');
      }
   };

   return (
      <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10">
            <div className="max-w-2xl">
               <h2 className="text-4xl font-black text-white italic uppercase mb-2">Sua Opinião Importa!</h2>
               <p className="text-slate-400 font-medium mb-8">Conte-nos como está sendo sua experiência com o PicFest.</p>

               <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <div className="flex gap-2">
                     {[1, 2, 3, 4, 5].map((star) => (
                        <button
                           key={star}
                           type="button"
                           onClick={() => setRating(star)}
                           className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${rating >= star ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                        >
                           <span className="material-symbols-outlined !text-2xl">star</span>
                        </button>
                     ))}
                  </div>

                  <textarea
                     value={text}
                     onChange={(e) => setText(e.target.value)}
                     placeholder="Escreva aqui seu depoimento..."
                     className="w-full h-32 bg-white/5 border border-white/10 rounded-3xl p-6 text-white placeholder:text-slate-600 focus:border-primary/50 transition-all outline-none resize-none font-medium"
                     required
                  />

                  {/* Seleção de Mídia do Perfil */}
                  <div className="flex flex-col gap-4">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Escolha uma foto do seu evento para o depoimento</p>
                     <div className="flex flex-wrap gap-4">
                        <button
                           type="button"
                           onClick={() => setShowMediaPicker(!showMediaPicker)}
                           className={`w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${selectedMediaUrl ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                        >
                           {selectedMediaUrl ? (
                              <img src={selectedMediaUrl} className="w-full h-full object-cover rounded-xl" />
                           ) : (
                              <>
                                 <span className="material-symbols-outlined text-slate-500">add_photo_alternate</span>
                                 <span className="text-[8px] font-black uppercase text-slate-500">Escolher</span>
                              </>
                           )}
                        </button>

                        {showMediaPicker && (
                           <div className="flex-1 min-w-[300px] h-24 overflow-x-auto flex gap-2 pb-2 custom-scrollbar">
                              {organizerMedia.length === 0 ? (
                                 <div className="h-full flex items-center px-4 text-[10px] text-slate-600 uppercase font-black">Nenhuma mídia encontrada nos seus eventos</div>
                              ) : (
                                 organizerMedia.filter(m => m.tipo === 'foto').map((media) => (
                                    <img
                                       key={media.id}
                                       src={media.url}
                                       onClick={() => {
                                          setSelectedMediaUrl(media.url);
                                          setShowMediaPicker(false);
                                       }}
                                       className={`h-full aspect-square object-cover rounded-xl cursor-pointer border-2 transition-all ${selectedMediaUrl === media.url ? 'border-primary scale-95' : 'border-transparent hover:border-white/20'}`}
                                    />
                                 ))
                              )}
                           </div>
                        )}

                        {selectedMediaUrl && (
                           <button
                              type="button"
                              onClick={() => setSelectedMediaUrl(null)}
                              className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
                           >
                              Remover Foto
                           </button>
                        )}
                     </div>
                  </div>

                  <button
                     type="submit"
                     disabled={isSubmitting}
                     className="w-full md:w-auto bg-primary text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:scale-100"
                  >
                     {isSubmitting ? 'Enviando...' : 'Enviar Depoimento'}
                  </button>
               </form>
            </div>
         </div>

         {/* Lista de Depoimentos Enviados */}
         {testimonials.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {testimonials.map((t) => (
                  <div key={t.id} className="bg-white/5 border border-white/10 rounded-[2rem] p-8 relative group">
                     <div className="flex items-center gap-2 mb-4">
                        {Array.from({ length: t.estrelas }).map((_, i) => (
                           <span key={i} className="material-symbols-outlined text-primary !text-sm">star</span>
                        ))}
                     </div>
                     <p className="text-slate-300 italic mb-4">"{t.texto}"</p>
                     <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${t.aprovado ? 'text-green-500' : 'text-yellow-500'}`}>
                           {t.aprovado ? 'Aprovado' : 'Aguardando Moderação'}
                        </span>
                        {(profile?.role === 'admin' || t.organizador_id === profile?.id) && (
                           <button
                              onClick={() => handleDelete(t.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                           >
                              <span className="material-symbols-outlined !text-lg">delete</span>
                           </button>
                        )}
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
   );
};



const SubscriptionsView: React.FC<{ userSub: any, onUpdateSub: () => void }> = ({ userSub, onUpdateSub }) => {
   const { user } = useContext(AuthContext);
   const [plans, setPlans] = useState<Plano[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const load = async () => {
         setLoading(true);
         try {
            const plansData = await supabaseService.getPlans();
            setPlans(plansData);
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
                        <p className="text-[10px] font-bold uppercase opacity-60">Mídias</p>
                        <p className="text-lg font-bold">{activePlan?.limite_midias === 0 ? 'Ilimitadas' : activePlan?.limite_midias}</p>
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
                  const features = [
                     `${p.limite_eventos === 0 ? 'Eventos Ilimitados' : p.limite_eventos + ' Evento(s) Ativo(s)'}`,
                     `${p.limite_midias === 0 ? 'Mídias Ilimitadas' : p.limite_midias + ' Mídias por Evento'}`,
                     "Moderação Realtime",
                  ];

                  if (p.pode_baixar) {
                     features.push("Download em Lote");
                  }

                  return (
                     <PricingCard
                        key={p.id}
                        name={p.nome}
                        price={p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        recurrence={p.recorrencia}
                        featured={p.nome.toLowerCase().includes('pro')}
                        features={features}
                        buttonText={activePlan?.id === p.id ? 'Seu Plano Atual' : (p.valor === 0 ? 'Mudar para este' : 'Assinar agora')}
                        onClick={() => activePlan?.id !== p.id && mercadoPagoService.checkout(p.id, p.valor, p.nome)}
                     />
                  );
               })}
            </div>
         </section>
      </div>
   );
};



const ProfileView: React.FC = () => <ProfileForm />;







const EventCard: React.FC<{ event: Evento }> = ({ event }) => {
   const [showQR, setShowQR] = useState(false);

   return (
      <div className="relative aspect-square rounded-[2.5rem] border border-white/10 overflow-hidden bg-white/5 hover:border-primary transition-all group shadow-2xl">
         <Link to={`/dashboard/eventos/${event.id}`} className="absolute inset-0 z-0">
            <DashboardSlideshow event={event} />

            {/* Overlay de gradiente para legibilidade */}
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>

            {/* Informações do Evento */}
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

         {/* Botões de Ação (Aparecem no Hover) */}
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


const EventDetailView: React.FC<{ userSub: any }> = ({ userSub }) => {
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
               {userSub?.planos?.pode_baixar ? (
                  <button className="px-6 py-3 border border-white/10 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all">Exportar Tudo</button>
               ) : (
                  <button
                     onClick={() => alert('Seu plano atual não permite o download em lote das mídias. Faça um upgrade para liberar este recurso!')}
                     className="px-6 py-3 border border-white/10 rounded-xl font-black text-xs uppercase tracking-widest opacity-30 hover:bg-red-500/10 transition-all flex items-center gap-2"
                  >
                     <span className="material-symbols-outlined text-xs">lock</span> Exportar Tudo
                  </button>
               )}
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

