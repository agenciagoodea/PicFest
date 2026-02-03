
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { Depoimento } from '../types';

export const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: 'grid_view' },
    { path: '/admin/usuarios', label: 'Usuários', icon: 'group' },
    { path: '/admin/planos', label: 'Planos', icon: 'layers' },
    { path: '/admin/eventos', label: 'Todos Eventos', icon: 'event' },
    { path: '/admin/depoimentos', label: 'Depoimentos', icon: 'reviews' },
    { path: '/admin/cms', label: 'Conteúdo (CMS)', icon: 'article' },
    { path: '/admin/financeiro', label: 'Financeiro', icon: 'account_balance_wallet' },
    { path: '/admin/configuracao', label: 'Configuração', icon: 'settings' },
  ];

  // Fechar sidebar ao navegar no mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-background-dark text-white">
      {/* Sidebar Administrativa Responsiva */}
      <aside className={`
        fixed inset-y-0 left-0 z-[150] w-72 border-r border-white/5 bg-slate-900 lg:bg-black/20 backdrop-blur-xl p-6 flex flex-col gap-10 transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:relative lg:flex-shrink-0
      `}>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white">shield_person</span>
            </div>
            <div>
              <h2 className="font-bold text-lg leading-none">Admin Panel</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">v1.0</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 p-3.5 rounded-xl transition-all font-medium text-sm ${
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

        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hidden md:block">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Sistemas OK</p>
          </div>
        </div>
      </aside>

      {/* Área de Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Mobile */}
        <header className="lg:hidden h-16 border-b border-white/5 bg-black/40 backdrop-blur-md px-6 flex items-center justify-between flex-shrink-0 z-[100]">
           <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/5 rounded-lg">
              <span className="material-symbols-outlined">menu</span>
           </button>
           <h2 className="font-black text-xs tracking-tighter uppercase italic text-primary">Admin</h2>
           <div className="w-8 h-8 rounded-full bg-primary/20" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
          <div className="max-w-6xl mx-auto">
            <Routes>
              <Route path="/" element={<AdminHome />} />
              <Route path="/usuarios" element={<AdminUsers />} />
              <Route path="/planos" element={<AdminPlans />} />
              <Route path="/eventos" element={<AdminEvents />} />
              <Route path="/depoimentos" element={<AdminTestimonials />} />
              <Route path="/cms" element={<AdminCMS />} />
              <Route path="/financeiro" element={<AdminFinance />} />
              <Route path="/configuracao" element={<AdminSettings />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Overlay para fechar sidebar no mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[140] lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

/* --- SUB-TELAS OTIMIZADAS PARA MOBILE --- */

const AdminHome = () => (
  <div className="flex flex-col gap-6 md:gap-10">
    <header>
      <h1 className="text-2xl md:text-4xl font-black tracking-tight">Visão Geral</h1>
      <p className="text-slate-400 mt-2 text-sm">Métricas consolidadas do SaaS.</p>
    </header>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <StatCard label="Receita Mensal" value="R$ 42.850" trend="+18%" icon="trending_up" color="text-green-500" />
      <StatCard label="Novos Usuários" value="1.104" trend="+12%" icon="person_add" color="text-primary" />
      <StatCard label="Mídias Totais" value="842.003" trend="+5%" icon="photo_library" color="text-orange-500" />
      <StatCard label="Assinaturas" value="184" trend="+2%" icon="verified" color="text-purple-500" />
    </div>
  </div>
);

const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState<Depoimento[]>([]);

  useEffect(() => {
    supabaseService.getTestimonials(false).then(setTestimonials);
  }, []);

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in">
       <header>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">Moderação</h1>
          <p className="text-slate-400 mt-1 text-sm">Aprove avaliações para a Landing Page.</p>
       </header>

       <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
             <thead className="bg-white/5 border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <tr>
                   <th className="px-6 py-4">Organizador</th>
                   <th className="px-6 py-4">Depoimento</th>
                   <th className="px-6 py-4">Estrelas</th>
                   <th className="px-6 py-4 text-right">Ações</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-white/5">
                {testimonials.map(t => (
                  <tr key={t.id} className="hover:bg-white/5 transition-all">
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <img src={t.foto_url} className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                           <p className="font-bold text-xs">{t.nome}</p>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <p className="text-[10px] text-slate-400 max-w-xs truncate italic">"{t.texto}"</p>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex text-primary">
                           {Array.from({ length: t.estrelas }).map((_, i) => (
                             <span key={i} className="material-symbols-outlined !text-[10px] fill-1">star</span>
                           ))}
                        </div>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <button className="text-[10px] font-black uppercase text-primary border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-all">Aprovar</button>
                     </td>
                  </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};

const AdminCMS = () => {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <header>
        <h2 className="text-2xl md:text-4xl font-black tracking-tight">CMS Editor</h2>
        <p className="text-slate-400 text-sm">Altere a Landing Page em tempo real.</p>
      </header>

      <div className="flex gap-1 bg-white/5 p-1 rounded-xl self-start overflow-x-auto max-w-full scrollbar-hide">
         {[
           { id: 'home', label: 'Home/Slider', icon: 'home' },
           { id: 'faq', label: 'FAQ', icon: 'help' },
           { id: 'legal', label: 'Termos', icon: 'gavel' }
         ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
           >
             <span className="material-symbols-outlined !text-sm">{tab.icon}</span>
             {tab.label}
           </button>
         ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl backdrop-blur-3xl">
         {activeTab === 'home' && (
           <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Título Hero Principal</label>
                    <input type="text" className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-sm text-white focus:ring-2 focus:ring-primary transition-all outline-none" defaultValue="Capture Cada Ângulo em Tempo Real" />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Subtítulo Hero</label>
                    <input type="text" className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-sm text-white focus:ring-2 focus:ring-primary transition-all outline-none" defaultValue="A forma mais simples de coletar fotos." />
                 </div>
                 <div className="md:col-span-2 flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Slide de Imagem Hero (URL)</label>
                    <input type="text" className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-sm text-white focus:ring-2 focus:ring-primary transition-all outline-none" defaultValue="https://picsum.photos/1200/600" />
                 </div>
                 <button className="md:col-span-2 py-5 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/30 text-xs uppercase tracking-widest hover:scale-[1.01] transition-all">Publicar Alterações</button>
              </div>
           </div>
         )}
         {activeTab === 'faq' && <p className="text-slate-500 text-center py-20 text-sm font-bold uppercase tracking-widest">Módulo de FAQ em desenvolvimento...</p>}
         {activeTab === 'legal' && <p className="text-slate-500 text-center py-20 text-sm font-bold uppercase tracking-widest">Módulo Jurídico em desenvolvimento...</p>}
      </div>
    </div>
  );
};

const AdminFinance = () => {
  return (
    <div className="flex flex-col gap-6 md:gap-10">
      <header>
        <h2 className="text-2xl md:text-4xl font-black tracking-tight uppercase italic text-primary">Fluxo Financeiro</h2>
        <p className="text-slate-400 text-xs mt-1">Controle de faturamento e status de transações.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
         <FinanceCard label="Total Recebido" value="R$ 12.450,00" color="bg-white/5" />
         <FinanceCard label="Aguardando" value="R$ 1.290,00" color="bg-white/5" />
         <FinanceCard label="Cancelados (Mês)" value="R$ 490,00" color="bg-red-500/10 text-red-500" />
         <FinanceCard label="Saldo Disponível" value="R$ 8.920,40" color="bg-primary text-white shadow-2xl shadow-primary/20" />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between flex-wrap gap-4">
           <h3 className="font-black text-sm uppercase tracking-widest">Histórico de Transações</h3>
           <div className="flex gap-2">
              <button className="px-4 py-2 bg-primary text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Todos</button>
              <button className="px-4 py-2 bg-white/5 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">Pendentes</button>
           </div>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Evento / ID</th>
                <th className="px-8 py-5">Data</th>
                <th className="px-8 py-5">Valor</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[1, 2, 3, 4, 5].map(i => (
                <tr key={i} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-5">
                    <div>
                      <p className="font-bold text-xs text-white">Casamento Lucas & Bia</p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">TX_0{i}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-[11px] text-slate-400">22/09/2024</td>
                  <td className="px-8 py-5 text-xs font-black text-primary">R$ 49,90</td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-sm">receipt_long</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const FinanceCard = ({ label, value, color }: any) => (
  <div className={`${color} border border-white/5 p-6 md:p-8 rounded-[2rem] flex flex-col gap-2`}>
    <p className="text-[9px] font-black uppercase tracking-widest opacity-60">{label}</p>
    <p className="text-xl md:text-2xl font-black">{value}</p>
  </div>
);

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('mercadopago');

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <header>
        <h2 className="text-2xl md:text-4xl font-black tracking-tight uppercase italic text-primary">Configuração do Sistema</h2>
        <p className="text-slate-400 text-xs mt-1">Integrações de API e parâmetros globais do SaaS.</p>
      </header>

      <div className="flex gap-1 bg-white/5 p-1 rounded-xl self-start overflow-x-auto max-w-full scrollbar-hide">
        <button 
          onClick={() => setActiveTab('mercadopago')}
          className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'mercadopago' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
        >
          Mercado Pago API
        </button>
        <button 
          onClick={() => setActiveTab('webhooks')}
          className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'webhooks' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
        >
          Webhooks / Retorno
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 md:p-12 w-full shadow-2xl backdrop-blur-3xl">
        {activeTab === 'mercadopago' && (
          <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
                <span className="material-symbols-outlined !text-3xl">payments</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-white">Configuração Mercado Pago</h3>
                <p className="text-slate-500 text-xs mt-1">Obtenha suas credenciais no Painel de Desenvolvedor do Mercado Pago.</p>
              </div>
            </div>

            <div className="h-px bg-white/5" />

            <div className="grid grid-cols-1 gap-8">
               <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">PUBLIC KEY</label>
                  <input type="text" className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 font-mono text-xs text-white focus:ring-2 focus:ring-primary transition-all outline-none" placeholder="APP_USR-..." />
               </div>
               <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ACCESS TOKEN</label>
                  <input type="password" name="at" className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 font-mono text-xs text-white focus:ring-2 focus:ring-primary transition-all outline-none" placeholder="TEST-..." />
               </div>
               
               <div className="bg-primary/5 border border-primary/10 p-6 rounded-2xl flex items-start gap-4">
                  <span className="material-symbols-outlined text-primary text-xl">info</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    Sugerimos usar credenciais de <strong className="text-white">Produção</strong> para processar pagamentos reais. Credenciais de teste são limitadas ao sandbox.
                  </p>
               </div>

               <button className="py-5 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/30 text-xs uppercase tracking-widest mt-2 hover:scale-[1.01] transition-all">Salvar Chaves de API</button>
            </div>
          </div>
        )}
        {activeTab === 'webhooks' && <p className="text-slate-500 text-center py-20 text-sm font-bold uppercase tracking-widest">Endpoints de Webhook em desenvolvimento...</p>}
      </div>
    </div>
  );
};

const AdminUsers = () => {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl md:text-4xl font-black uppercase italic text-primary leading-none">Gestão de Usuários</h2>
          <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest font-black">Admin & Organizadores</p>
        </div>
        <button className="w-full md:w-auto px-6 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary/20">
          <span className="material-symbols-outlined text-lg">person_add</span> Criar Admin
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Usuário</th>
                <th className="px-8 py-5">Email</th>
                <th className="px-8 py-5">Role</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[1, 2, 3].map(i => (
                <tr key={i} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl border border-white/10 bg-slate-800" />
                      <p className="font-bold text-xs text-white">Ricardo Alves</p>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-[11px] text-slate-400">ricardo@admin.com</td>
                  <td className="px-8 py-5">
                    <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-slate-500 uppercase">Administrador</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="text-primary text-[10px] font-black uppercase tracking-widest px-4 py-2 hover:bg-primary/10 rounded-lg transition-all">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminPlans = () => {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h2 className="text-2xl md:text-4xl font-black uppercase italic text-primary leading-none">Gestão de Planos</h2>
        <button className="w-full md:w-auto px-6 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20">
          + Novo Plano
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {[
          { name: 'Plano Grátis', price: '0.00', m: '50', e: '1', g: '100', s: '1GB', id: 'MP-FREE-001' },
          { name: 'Plano Pro', price: '49.90', m: '1000', e: '10', g: '1000', s: '20GB', id: 'MP-PRO-984' },
          { name: 'Plano Enterprise', price: '199.00', m: 'Unlimited', e: 'Unlimited', g: 'Unlimited', s: '100GB', id: 'MP-ENT-221' }
        ].map((p, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-8 md:p-10 rounded-[2.5rem] flex flex-col gap-8 shadow-2xl hover:border-primary/30 transition-all group">
            <div className="flex justify-between items-start">
               <h3 className="font-black text-xl text-white">{p.name}</h3>
               <span className="material-symbols-outlined text-slate-700 group-hover:text-primary transition-colors">layers</span>
            </div>
            <div className="flex items-baseline gap-1">
               <span className="text-sm font-bold text-slate-500 uppercase">R$</span>
               <span className="text-4xl font-black tracking-tighter text-white">{p.price}</span>
            </div>
            <div className="h-px bg-white/5" />
            <ul className="flex flex-col gap-4">
              <PlanDetail label="Mídias" value={p.m} />
              <PlanDetail label="Eventos" value={p.e} />
              <PlanDetail label="Convidados" value={p.g} />
              <PlanDetail label="Espaço (GB)" value={p.s} />
            </ul>
            <div className="mt-auto pt-6 flex items-center justify-between">
               <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">MP ID: <span className="text-primary">{p.id}</span></p>
               <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Editar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PlanDetail = ({ label, value }: any) => (
  <li className="flex justify-between items-center text-[11px] font-medium">
     <span className="text-slate-500 uppercase tracking-widest">{label}:</span>
     <span className="text-white font-black">{value}</span>
  </li>
);

const AdminEvents = () => {
  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-2xl md:text-4xl font-black uppercase italic text-primary leading-none">Monitor de Eventos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl group">
            <div className="aspect-video relative bg-slate-900 overflow-hidden">
               <img src={`https://picsum.photos/seed/${i + 10}/400/225`} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
               <div className="absolute top-3 left-3 px-2 py-1 bg-green-500 rounded-md text-[8px] font-black text-white shadow-lg uppercase">Live Now</div>
            </div>
            <div className="p-6">
               <h4 className="font-black text-sm truncate text-white leading-tight">Casamento Lucas & Bia</h4>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Org: Ricardo A.</p>
               
               <div className="flex items-center justify-between mt-6">
                  <p className="text-[10px] font-bold text-slate-600">ID: <span className="font-mono">123456</span></p>
                  <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all">Moderador</button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, trend, icon, color }: any) => (
  <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-[2rem] flex flex-col gap-4 shadow-xl">
    <div className="flex justify-between items-start text-slate-500">
      <p className="text-[9px] font-black uppercase tracking-widest">{label}</p>
      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
        <span className="material-symbols-outlined !text-xl">{icon}</span>
      </div>
    </div>
    <div>
      <p className="text-2xl md:text-3xl font-black text-white tracking-tighter">{value}</p>
      <p className="text-[10px] font-black text-green-500 bg-green-500/10 self-start px-2 py-0.5 rounded-full mt-2 inline-block">{trend}</p>
    </div>
  </div>
);
