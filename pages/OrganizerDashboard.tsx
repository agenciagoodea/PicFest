import React, { useState, useContext, Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '../services/supabaseService';
import { Evento } from '../types';
import { AuthContext } from '../App';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProfileForm } from '../components/ProfileForm';

// Importação Lazy das Views para Otimização de Performance
const HomeView = lazy(() => import('./dashboard/HomeView').then(m => ({ default: m.HomeView })));
const EventsListView = lazy(() => import('./dashboard/EventsListView').then(m => ({ default: m.EventsListView })));
const EventDetailView = lazy(() => import('./dashboard/EventDetailView').then(m => ({ default: m.EventDetailView })));
const SubscriptionsView = lazy(() => import('./dashboard/SubscriptionsView').then(m => ({ default: m.SubscriptionsView })));
const OrganizerTestimonialView = lazy(() => import('./dashboard/OrganizerTestimonialView').then(m => ({ default: m.OrganizerTestimonialView })));

// Loader simples para as transições internas
const InnerLoader = () => (
   <div className="p-20 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sincronizando...</p>
   </div>
);

export const OrganizerDashboard: React.FC = () => {
   const { user } = useContext(AuthContext);
   const queryClient = useQueryClient();
   const [showEventModal, setShowEventModal] = useState(false);
   const [eventFormData, setEventFormData] = useState({
      nome: '',
      data_evento: '',
      slug_curto: '',
      moderacao_ativa: false,
   });

   // Assinatura do usuário via React Query
   const { data: userSub } = useQuery({
      queryKey: ['userSubscription', user?.id],
      queryFn: () => user ? supabaseService.getUserSubscription(user.id) : null,
      enabled: !!user,
   });

   // Mutação para criar evento
   const createEventMutation = useMutation({
      mutationFn: (eventData: Partial<Evento>) => supabaseService.createEvent(eventData),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['events', user?.id] });
         setShowEventModal(false);
         setEventFormData({ nome: '', data_evento: '', slug_curto: '', moderacao_ativa: false });
      },
      onError: (error) => {
         console.error('Erro ao criar evento:', error);
         alert('Erro ao criar evento');
      }
   });

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
      const slug = eventFormData.slug_curto || Math.random().toString(36).substring(2, 8).toUpperCase();
      createEventMutation.mutate({
         nome: eventFormData.nome,
         data_evento: eventFormData.data_evento,
         slug_curto: slug,
         organizador_id: user.id,
         status: 'ativo',
         config_json: {
            moderacao_ativa: eventFormData.moderacao_ativa,
         },
      });
   };

   return (
      <DashboardLayout menuItems={menuItems} title="PicFest" icon="auto_awesome_motion">
         <Suspense fallback={<InnerLoader />}>
            <Routes>
               <Route path="/" element={<HomeView onNewEvent={() => setShowEventModal(true)} userSub={userSub} />} />
               <Route path="/eventos" element={<EventsListView onNewEvent={() => setShowEventModal(true)} />} />
               <Route path="/eventos/:id" element={<EventDetailView userSub={userSub} />} />
               <Route path="/assinaturas" element={<SubscriptionsView userSub={userSub} onUpdateSub={() => queryClient.invalidateQueries({ queryKey: ['userSubscription', user?.id] })} />} />
               <Route path="/depoimentos" element={<OrganizerTestimonialView />} />
               <Route path="/perfil" element={<ProfileView />} />
            </Routes>
         </Suspense>

         {/* Modal Novo Evento */}
         {showEventModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
               <div className="bg-slate-900 border border-white/10 p-10 rounded-[2rem] w-full max-w-xl flex flex-col gap-8 shadow-2xl animate-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-center text-white">
                     <div>
                        <h3 className="text-3xl font-black tracking-tight">Novo Evento</h3>
                        <p className="text-slate-500 text-sm mt-1">Configure o espaço para suas mídias.</p>
                     </div>
                     <button onClick={() => setShowEventModal(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <form onSubmit={handleCreateEvent} className="flex flex-col gap-6">
                     <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Nome do Evento</label>
                        <input
                           type="text"
                           required
                           className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white text-lg outline-none focus:border-primary transition-all"
                           placeholder="Ex: Casamento de Maria & João"
                           value={eventFormData.nome}
                           onChange={e => setEventFormData({ ...eventFormData, nome: e.target.value })}
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Data</label>
                           <input
                              type="date"
                              required
                              className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all"
                              value={eventFormData.data_evento}
                              onChange={e => setEventFormData({ ...eventFormData, data_evento: e.target.value })}
                           />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Slug Curto (Opcional)</label>
                           <input
                              type="text"
                              className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white font-mono outline-none focus:border-primary transition-all"
                              placeholder="MARIAEJOAO"
                              value={eventFormData.slug_curto}
                              onChange={e => setEventFormData({ ...eventFormData, slug_curto: e.target.value.toUpperCase() })}
                           />
                        </div>
                     </div>

                     <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                        <input
                           type="checkbox"
                           id="moderacao"
                           checked={eventFormData.moderacao_ativa}
                           onChange={e => setEventFormData({ ...eventFormData, moderacao_ativa: e.target.checked })}
                           className="w-5 h-5 rounded bg-white/10 border-white/10 text-primary focus:ring-primary"
                        />
                        <label htmlFor="moderacao" className="text-sm font-medium text-slate-300">Ativar moderação prévia (você aprova cada foto)</label>
                     </div>

                     <div className="flex gap-4 mt-4">
                        <button
                           type="button"
                           onClick={() => setShowEventModal(false)}
                           className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
                        >
                           Cancelar
                        </button>
                        <button
                           type="submit"
                           disabled={createEventMutation.isPending}
                           className="flex-1 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                           {createEventMutation.isPending ? (
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

const ProfileView: React.FC = () => <ProfileForm />;
