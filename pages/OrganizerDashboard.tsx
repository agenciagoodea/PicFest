import React, { useState, useContext, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../App';
import { supabaseService } from '../services/supabaseService';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { HomeView } from './dashboard/HomeView';
import { EventsListView } from './dashboard/EventsListView';
import { EventDetailView } from './dashboard/EventDetailView';
import { SubscriptionsView } from './dashboard/SubscriptionsView';
import { OrganizerTestimonialView } from './dashboard/OrganizerTestimonialView';
import { ProfileView } from './dashboard/ProfileView';
import { GuestBookView } from './dashboard/GuestBookView';
import { ShowcaseEditorView } from './dashboard/ShowcaseEditorView';
import { Evento } from '../types';

const InnerLoader = () => (
   <div className="flex-1 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
   </div>
);

export const OrganizerDashboard: React.FC = () => {
   const { user } = useContext(AuthContext);
   const queryClient = useQueryClient();
   const [showEventModal, setShowEventModal] = useState(false);
   const [editingEvent, setEditingEvent] = useState<Evento | null>(null);
   const [logoFile, setLogoFile] = useState<File | null>(null);
   const [logoPreview, setLogoPreview] = useState<string | null>(null);
   const [eventFormData, setEventFormData] = useState({
      nome: '',
      data_evento: '',
      slug_curto: '',
      moderacao_ativa: false,
   });

   // Buscar assinatura do usuário
   const { data: userSub } = useQuery({
      queryKey: ['userSubscription', user?.id],
      queryFn: () => user ? supabaseService.getUserSubscription(user.id) : null,
      enabled: !!user,
   });

   // Mutação para criar/editar evento
   const saveEventMutation = useMutation({
      mutationFn: async (eventData: Partial<Evento>) => {
         if (editingEvent) {
            return supabaseService.updateEvent(editingEvent.id, eventData);
         }
         return supabaseService.createEvent(eventData);
      },
      onSuccess: async (event) => {
         // Se houver logo, fazer upload agora que temos o ID do evento
         if (event && logoFile) {
            await supabaseService.uploadEventLogo(event.id, logoFile);
         }
         queryClient.invalidateQueries({ queryKey: ['events', user?.id] });
         handleCloseModal();
         alert(editingEvent ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!');
      },
      onError: (error: any) => {
         console.error('Erro ao salvar evento:', error);
         alert(error.message || 'Erro ao salvar evento. Verifique seu plano.');
      }
   });

   const handleCloseModal = () => {
      setShowEventModal(false);
      setEditingEvent(null);
      setLogoFile(null);
      setLogoPreview(null);
      setEventFormData({ nome: '', data_evento: '', slug_curto: '', moderacao_ativa: false });
   };

   const handleOpenEditModal = (event: Evento) => {
      setEditingEvent(event);
      setEventFormData({
         nome: event.nome,
         data_evento: event.data_evento.split('T')[0],
         slug_curto: event.slug_curto,
         moderacao_ativa: event.config_json?.moderacao_ativa || false,
      });
      setLogoPreview(event.logo_url || null);
      setShowEventModal(true);
   };

   const handleSaveEvent = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      
      const eventData: Partial<Evento> = {
         nome: eventFormData.nome,
         data_evento: eventFormData.data_evento,
         slug_curto: eventFormData.slug_curto || (editingEvent ? undefined : Math.random().toString(36).substring(2, 8).toUpperCase()),
         organizador_id: user.id,
         status: 'ativo',
         config_json: {
            ...editingEvent?.config_json,
            moderacao_ativa: eventFormData.moderacao_ativa,
         },
      };

      saveEventMutation.mutate(eventData);
   };

   const menuItems = [
      { path: '/dashboard', label: 'Início', icon: 'dashboard' },
      { path: '/dashboard/eventos', label: 'Meus Eventos', icon: 'event' },
      { path: '/dashboard/assinaturas', label: 'Assinaturas', icon: 'workspace_premium' },
      { path: '/dashboard/depoimentos', label: 'Avaliar Sistema', icon: 'star' },
      { path: '/dashboard/perfil', label: 'Meu Perfil', icon: 'account_circle' },
   ];

   return (
      <DashboardLayout menuItems={menuItems} title="PicFest" icon="auto_awesome_motion">
         <Suspense fallback={<InnerLoader />}>
            <Routes>
               <Route path="/" element={<HomeView onNewEvent={() => setShowEventModal(true)} userSub={userSub} />} />
               <Route path="/eventos" element={<EventsListView onNewEvent={() => setShowEventModal(true)} onEditEvent={handleOpenEditModal} />} />
               <Route path="/eventos/:id" element={<EventDetailView userSub={userSub} />} />
               <Route path="/eventos/:id/guestbook" element={<GuestBookView />} />
               <Route path="/eventos/:id/vitrine" element={<ShowcaseEditorView />} />
               <Route path="/assinaturas" element={<SubscriptionsView userSub={userSub} onUpdateSub={() => queryClient.invalidateQueries({ queryKey: ['userSubscription', user?.id] })} />} />
               <Route path="/depoimentos" element={<OrganizerTestimonialView />} />
               <Route path="/perfil" element={<ProfileView />} />
            </Routes>
         </Suspense>

         {/* Modal Criar/Editar Evento */}
         {showEventModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
               <div className="bg-slate-900 border border-white/10 p-10 rounded-[2rem] w-full max-w-xl flex flex-col gap-8 shadow-2xl animate-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-center text-white">
                     <div>
                        <h3 className="text-3xl font-black tracking-tight">{editingEvent ? 'Editar Evento' : 'Novo Evento'}</h3>
                        <p className="text-slate-500 text-sm mt-1">{editingEvent ? 'Atualize as configurações do seu PicFest.' : 'Configure o espaço para suas mídias.'}</p>
                     </div>
                     <button onClick={handleCloseModal} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <form onSubmit={handleSaveEvent} className="flex flex-col gap-6">
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

                     {/* UPLOAD DE LOGO 1:1 */}
                     <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Logo do Evento (Opcional - 1:1 recomendado)</label>
                        <div className="flex items-center gap-4">
                           <div 
                              onClick={() => document.getElementById('event-logo-input')?.click()}
                              className="w-20 h-20 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-white/10 hover:border-primary transition-all overflow-hidden"
                           >
                              {logoPreview ? (
                                 <img src={logoPreview} className="w-full h-full object-cover" />
                              ) : (
                                 <span className="material-symbols-outlined text-slate-600">add_photo_alternate</span>
                              )}
                           </div>
                           <div className="flex-1 text-left">
                              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Aparecerá no telão, QR Code e materiais de mesa. PNG ou JPG.</p>
                              {logoFile && (
                                 <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null); }} className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1">Remover</button>
                              )}
                           </div>
                           <input 
                              id="event-logo-input" 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                 const file = e.target.files?.[0];
                                 if (file) {
                                    setLogoFile(file);
                                    setLogoPreview(URL.createObjectURL(file));
                                 }
                              }}
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
                        <label htmlFor="moderacao" className="text-sm font-bold text-slate-300">Ativar Moderação (Aprovar mídias antes do telão)</label>
                     </div>

                     <button
                        type="submit"
                        disabled={saveEventMutation.isPending}
                        className="w-full h-16 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] italic disabled:opacity-50"
                     >
                        {saveEventMutation.isPending 
                            ? (editingEvent ? 'Salvando...' : 'Criando...') 
                            : (editingEvent ? 'Salvar Alterações' : 'Lançar Evento')}
                     </button>
                  </form>
               </div>
            </div>
         )}
      </DashboardLayout>
   );
};
