import React, { useContext, Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthContext } from '../App';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Importação Lazy das Views Administrativas para Otimização
const AdminHome = lazy(() => import('./admin/AdminHome').then(m => ({ default: m.AdminHome })));
const AdminUsers = lazy(() => import('./admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminPlans = lazy(() => import('./admin/AdminPlans').then(m => ({ default: m.AdminPlans })));
const AdminEvents = lazy(() => import('./admin/AdminEvents').then(m => ({ default: m.AdminEvents })));
const AdminTestimonials = lazy(() => import('./admin/AdminTestimonials').then(m => ({ default: m.AdminTestimonials })));
const AdminLanding = lazy(() => import('./admin/AdminLanding').then(m => ({ default: m.AdminLanding })));
const AdminSettings = lazy(() => import('./admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const AdminPayments = lazy(() => import('./admin/AdminPayments').then(m => ({ default: m.AdminPayments })));
const AdminAddons = lazy(() => import('./admin/AdminAddons').then(m => ({ default: m.AdminAddons })));
const AdminGuestbook = lazy(() => import('./admin/AdminGuestbook').then(m => ({ default: m.AdminGuestbook })));
const AdminEmailTemplates = lazy(() => import('./admin/AdminEmailTemplates').then(m => ({ default: m.AdminEmailTemplates })));

// Loader elegante para transições de admin
const AdminInnerLoader = () => (
   <div className="p-20 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
      <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Acessando chaves mestre...</p>
   </div>
);

export const AdminDashboard: React.FC = () => {
   const { logout } = useContext(AuthContext);

   const adminMenuItems = [
      { path: '/admin', label: 'Monitor Global', icon: 'analytics' },
      { path: '/admin/usuarios', label: 'Gestão de Usuários', icon: 'group' },
      { path: '/admin/planos', label: 'Modelos de Plano', icon: 'workspace_premium' },
      { path: '/admin/adicionais', label: 'Pacotes Adicionais', icon: 'add_shopping_cart' },
      { path: '/admin/eventos', label: 'Todos os Eventos', icon: 'auto_awesome_motion' },
      { path: '/admin/convidados', label: 'Livro de Assinaturas', icon: 'menu_book' },
      { path: '/admin/pagamentos', label: 'Fluxo de Caixa', icon: 'account_balance_wallet' },
      { path: '/admin/depoimentos', label: 'Avaliações', icon: 'reviews' },
      { path: '/admin/landing', label: 'Editor de Vitrine', icon: 'auto_fix_high' },
      { path: '/admin/configuracoes', label: 'Parâmetros API', icon: 'settings' },
      { path: '/admin/emails', label: 'Templates de E-mail', icon: 'mail' },
   ];

   return (
      <DashboardLayout
         menuItems={adminMenuItems}
         title="Admin PicFest"
         icon="admin_panel_settings"
         onLogout={logout}
      >
         <Suspense fallback={<AdminInnerLoader />}>
            <Routes>
               <Route path="/" element={<AdminHome />} />
               <Route path="/usuarios" element={<AdminUsers />} />
               <Route path="/planos" element={<AdminPlans />} />
               <Route path="/adicionais" element={<AdminAddons />} />
               <Route path="/eventos" element={<AdminEvents />} />
               <Route path="/convidados" element={<AdminGuestbook />} />
               <Route path="/depoimentos" element={<AdminTestimonials />} />
               <Route path="/landing" element={<AdminLanding />} />
               <Route path="/configuracoes" element={<AdminSettings />} />
               <Route path="/pagamentos" element={<AdminPayments />} />
               <Route path="/emails" element={<AdminEmailTemplates />} />
            </Routes>
         </Suspense>
      </DashboardLayout>
   );
};
