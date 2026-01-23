
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { Depoimento } from '../types';

export const AdminDashboard: React.FC = () => {
  const location = useLocation();

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

  return (
    <div className="flex h-screen overflow-hidden bg-background-dark text-white">
      {/* Sidebar Administrativa */}
      <aside className="w-72 border-r border-white/5 bg-black/20 backdrop-blur-xl p-6 flex flex-col gap-10">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-white">shield_person</span>
          </div>
          <div>
            <h2 className="font-bold text-lg leading-none">Admin Panel</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">EventMedia v1.0</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
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

        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-xs font-bold text-slate-400 uppercase">Status do Sistema</p>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed text-balance">Servidores estáveis. Mercado Pago API operante.</p>
        </div>
      </aside>

      {/* Área de Conteúdo */}
      <main className="flex-1 overflow-y-auto p-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
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
      </main>
    </div>
  );
};

/* --- SUB-TELAS DO ADMIN --- */

const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState<Depoimento[]>([]);

  useEffect(() => {
    supabaseService.getTestimonials(false).then(setTestimonials);
  }, []);

  const toggleApproval = (id: string, current: boolean) => {
    supabaseService.updateTestimonialApproval(id, !current);
    setTestimonials(prev => prev.map(d => d.id === id ? { ...d, aprovado: !current } : d));
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
       <header>
          <h1 className="text-4xl font-black tracking-tight">Moderação de Depoimentos</h1>
          <p className="text-slate-400 mt-2">Aprove avaliações para exibição na Landing Page.</p>
       </header>

       <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
             <thead className="bg-white/5 border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <tr>
                   <th className="px-8 py-5">Organizador</th>
                   <th className="px-8 py-5">Depoimento</th>
                   <th className="px-8 py-5">Estrelas</th>
                   <th className="px-8 py-5">Status</th>
                   <th className="px-8 py-5 text-right">Ações</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-white/5">
                {testimonials.map(t => (
                  <tr key={t.id} className="hover:bg-white/5 transition-all group">
                     <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                           <img src={t.foto_url} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                           <p className="font-bold text-sm">{t.nome}</p>
                        </div>
                     </td>
                     <td className="px-8 py-5">
                        <p className="text-xs text-slate-400 max-w-md line-clamp-2 italic">"{t.texto}"</p>
                     </td>
                     <td className="px-8 py-5">
                        <div className="flex text-primary">
                           {Array.from({ length: t.estrelas }).map((_, i) => (
                             <span key={i} className="material-symbols-outlined !text-sm fill-1">star</span>
                           ))}
                        </div>
                     </td>
                     <td className="px-8 py-5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${t.aprovado ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                           {t.aprovado ? 'APROVADO' : 'PENDENTE'}
                        </span>
                     </td>
                     <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => toggleApproval(t.id, t.aprovado)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${t.aprovado ? 'bg-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white' : 'bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white'}`}
                        >
                           {t.aprovado ? 'Desativar' : 'Aprovar'}
                        </button>
                     </td>
                  </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};

// ... Resto das sub-telas (AdminHome, AdminUsers, etc) permanecem os mesmos ...
const AdminHome = () => (
  <div className="flex flex-col gap-10">
    <header>
      <h1 className="text-4xl font-black tracking-tight">Visão Geral</h1>
      <p className="text-slate-400 mt-2">Métricas consolidadas de toda a plataforma.</p>
    </header>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard label="Receita Mensal" value="R$ 42.850" trend="+18.4%" icon="trending_up" color="text-green-500" />
      <StatCard label="Novos Usuários" value="1.104" trend="+12.1%" icon="person_add" color="text-primary" />
      <StatCard label="Mídias Totais" value="842.003" trend="+5.2%" icon="photo_library" color="text-orange-500" />
      <StatCard label="Assinaturas Ativas" value="184" trend="+2.4%" icon="verified" color="text-purple-500" />
    </div>
  </div>
);

const AdminUsers = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black">Gestão de Usuários</h2>
        <button onClick={handleCreate} className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">person_add</span> Criar Admin
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5 text-xs text-slate-500 font-bold uppercase">
            <tr>
              <th className="px-8 py-5 text-left">Usuário</th>
              <th className="px-8 py-5 text-left">Email</th>
              <th className="px-8 py-5 text-left">Role</th>
              <th className="px-8 py-5 text-left">Status</th>
              <th className="px-8 py-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[
              { id: 1, nome: "Ricardo Alves", email: "ricardo@admin.com", role: "admin", status: "Ativo" },
              { id: 2, nome: "Ana Paula", email: "ana.paula@gmail.com", role: "organizador", status: "Ativo" },
              { id: 3, nome: "Juliana Silva", email: "juli@evento.com", role: "organizador", status: "Suspenso" }
            ].map((u, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td className="px-8 py-5 font-bold">{u.nome}</td>
                <td className="px-8 py-5 text-sm text-slate-400">{u.email}</td>
                <td className="px-8 py-5"><span className="px-2 py-1 bg-white/10 rounded text-[10px] font-bold uppercase">{u.role}</span></td>
                <td className="px-8 py-5">
                  <span className={`w-3 h-3 rounded-full inline-block mr-2 ${u.status === 'Ativo' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-sm font-medium">{u.status}</span>
                </td>
                <td className="px-8 py-5 text-right">
                  <button onClick={() => handleEdit(u)} className="text-primary hover:underline text-sm font-bold">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 p-10 rounded-3xl w-full max-w-lg flex flex-col gap-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black">{editingUser ? 'Editar Usuário' : 'Novo Administrador'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form className="flex flex-col gap-4">
               <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nome Completo</label>
                    <input type="text" defaultValue={editingUser?.nome} className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 focus:ring-primary focus:border-primary" placeholder="Nome do usuário" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">E-mail</label>
                    <input type="email" defaultValue={editingUser?.email} className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 focus:ring-primary focus:border-primary" placeholder="email@exemplo.com" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Função (Role)</label>
                    <select defaultValue={editingUser?.role || 'organizador'} className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 focus:ring-primary focus:border-primary appearance-none">
                       <option value="admin">Administrador do Sistema</option>
                       <option value="organizador">Organizador de Eventos</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
                    <div className="flex gap-4 mt-2">
                       <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="status" defaultChecked={editingUser?.status === 'Ativo' || !editingUser} className="text-primary focus:ring-primary bg-white/5 border-white/10" />
                          <span className="text-sm">Ativo</span>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="status" defaultChecked={editingUser?.status === 'Suspenso'} className="text-primary focus:ring-primary bg-white/5 border-white/10" />
                          <span className="text-sm">Suspenso</span>
                       </label>
                    </div>
                  </div>
               </div>
               <div className="flex gap-4 mt-4">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-white/5 rounded-2xl font-bold">Cancelar</button>
                 <button type="submit" className="flex-1 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20">Salvar Alterações</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminPlans = () => {
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setShowPlanForm(true);
  };

  const mockPlans = [
    { id: 'free', nome: 'Plano Grátis', valor: 0, mídias: 50, eventos: 1, convidados: 100, storage: 1, mp_id: 'MP-FREE-001' },
    { id: 'pro', nome: 'Plano Pro', valor: 49.90, mídias: 1000, eventos: 10, convidados: 1000, storage: 20, mp_id: 'MP-PRO-984' },
    { id: 'ent', nome: 'Plano Enterprise', valor: 199.00, mídias: 0, eventos: 0, convidados: 0, storage: 100, mp_id: 'MP-ENT-000' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black">Gestão de Planos</h2>
        <button onClick={() => { setEditingPlan(null); setShowPlanForm(true); }} className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20">
          + Novo Plano
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockPlans.map((p, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-3xl flex flex-col gap-4 relative group">
            <button onClick={() => handleEditPlan(p)} className="absolute top-4 right-4 p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="material-symbols-outlined text-sm">edit</span>
            </button>
            <h3 className="text-xl font-bold">{p.nome}</h3>
            <p className="text-4xl font-black">R$ {p.valor.toFixed(2)}</p>
            <div className="h-px bg-white/5 my-2"></div>
            <ul className="text-sm text-slate-400 space-y-3">
              <li className="flex justify-between"><span>Mídias:</span> <span className="font-bold text-white">{p.mídias === 0 ? 'Ilimitadas' : p.mídias}</span></li>
              <li className="flex justify-between"><span>Eventos:</span> <span className="font-bold text-white">{p.eventos === 0 ? 'Ilimitados' : p.eventos}</span></li>
              <li className="flex justify-between"><span>Convidados:</span> <span className="font-bold text-white">{p.convidados === 0 ? 'Ilimitados' : p.convidados}</span></li>
              <li className="flex justify-between"><span>Espaço (GB):</span> <span className="font-bold text-white">{p.storage}GB</span></li>
              <li className="flex justify-between pt-2 border-t border-white/5 text-[10px] uppercase font-bold text-primary"><span>MP ID:</span> <span>{p.mp_id}</span></li>
            </ul>
          </div>
        ))}
      </div>

      {showPlanForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
           <div className="bg-slate-900 border border-white/10 p-10 rounded-3xl w-full max-w-2xl flex flex-col gap-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black">{editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}</h3>
                 <button onClick={() => setShowPlanForm(false)} className="text-slate-500 hover:text-white"><span className="material-symbols-outlined">close</span></button>
              </div>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nome do Plano</label>
                    <input type="text" defaultValue={editingPlan?.nome} className="bg-white/5 border border-white/10 rounded-xl h-12 px-4" placeholder="Ex: Premium Mensal" />
                 </div>
                 <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Valor (R$)</label>
                    <input type="number" step="0.01" defaultValue={editingPlan?.valor} className="bg-white/5 border border-white/10 rounded-xl h-12 px-4" placeholder="0.00" />
                 </div>
                 <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Mercado Pago ID</label>
                    <input type="text" defaultValue={editingPlan?.mp_id} className="bg-white/5 border border-white/10 rounded-xl h-12 px-4" placeholder="ID do item no MP" />
                 </div>
                 <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Limite de Mídias (0 = Ilimitado)</label>
                    <input type="number" defaultValue={editingPlan?.mídias} className="bg-white/5 border border-white/10 rounded-xl h-12 px-4" />
                 </div>
                 <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Limite de Eventos (0 = Ilimitado)</label>
                    <input type="number" defaultValue={editingPlan?.eventos} className="bg-white/5 border border-white/10 rounded-xl h-12 px-4" />
                 </div>
                 <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Limite de Convidados</label>
                    <input type="number" defaultValue={editingPlan?.convidados} className="bg-white/5 border border-white/10 rounded-xl h-12 px-4" />
                 </div>
                 <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Armazenamento (GB)</label>
                    <input type="number" defaultValue={editingPlan?.storage} className="bg-white/5 border border-white/10 rounded-xl h-12 px-4" />
                 </div>
                 <div className="flex gap-4 col-span-2 mt-4">
                    <button type="button" onClick={() => setShowPlanForm(false)} className="flex-1 py-4 bg-white/5 rounded-2xl font-bold">Cancelar</button>
                    <button type="submit" className="flex-1 py-4 bg-primary text-white font-black rounded-2xl">Salvar Plano</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const AdminEvents = () => {
  const [photoSeed, setPhotoSeed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setPhotoSeed(s => s + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  const mockEvents = [
    { id: '123456', nome: 'Casamento Lucas & Bia', status: 'Ativo', org: 'Ricardo A.' },
    { id: '654321', nome: 'Festa Tech 2024', status: 'Ativo', org: 'Ana Paula' },
    { id: '789012', nome: 'Show ao Vivo XP', status: 'Ativo', org: 'Ricardo A.' },
    { id: '345678', nome: 'Workshop Design', status: 'Encerrado', org: 'Juliana S.' }
  ];

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-3xl font-black">Monitor de Eventos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mockEvents.map((ev, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col group">
            <div className="aspect-video relative overflow-hidden bg-black">
               <img 
                 src={`https://picsum.photos/seed/${ev.id + photoSeed}/400/225`} 
                 className="w-full h-full object-cover opacity-60 transition-opacity duration-1000" 
                 key={photoSeed}
               />
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm gap-4">
                  <Link to={`/live/${ev.id}`} title="Ver Telão" className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white"><span className="material-symbols-outlined text-sm">tv</span></Link>
                  <Link to={`/evento/${ev.id}`} title="Link Upload" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary"><span className="material-symbols-outlined text-sm">link</span></Link>
               </div>
               <div className="absolute top-3 left-3 px-2 py-0.5 bg-green-500 rounded text-[8px] font-black uppercase">LIVE NOW</div>
            </div>
            <div className="p-5 flex flex-col gap-1">
               <h4 className="font-bold truncate">{ev.nome}</h4>
               <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Org: {ev.org}</p>
               <div className="flex justify-between items-center mt-4">
                  <span className="text-[10px] text-slate-500 font-mono">ID: {ev.id}</span>
                  <button className="text-[10px] font-bold text-primary hover:underline">Moderador</button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminCMS = () => {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h2 className="text-3xl font-black">Editor de Conteúdo (CMS)</h2>
        <p className="text-slate-400 text-sm">Altere textos, imagens e seções da Landing Page em tempo real.</p>
      </header>

      <div className="flex gap-1 bg-white/5 p-1 rounded-2xl self-start overflow-x-auto max-w-full">
         {[
           { id: 'home', label: 'Home/Slider', icon: 'home' },
           { id: 'legal', label: 'Termos/Privacidade', icon: 'gavel' },
           { id: 'faq', label: 'Cadastro FAQ', icon: 'help' },
           { id: 'contacts', label: 'Contatos', icon: 'alternate_email' },
           { id: 'footer', label: 'Rodapé', icon: 'vertical_align_bottom' }
         ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
           >
             <span className="material-symbols-outlined text-sm">{tab.icon}</span>
             {tab.label}
           </button>
         ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-10 max-w-[1000px]">
         {activeTab === 'home' && (
           <div className="flex flex-col gap-8 animate-in fade-in duration-300">
              <h3 className="text-xl font-bold border-b border-white/5 pb-4">Configuração da Home</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Título Hero Principal</label>
                    <input type="text" className="bg-white/5 border border-white/10 rounded-xl h-12 px-4" defaultValue="Capture Cada Ângulo em Tempo Real" />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Subtítulo Hero</label>
                    <input type="text" className="bg-white/5 border border-white/10 rounded-xl h-12 px-4" defaultValue="A forma mais simples de coletar fotos de convidados." />
                 </div>
                 <div className="flex flex-col gap-2 col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Slide de Imagem Hero (URL)</label>
                    <div className="flex gap-2">
                      <input type="text" className="flex-1 bg-white/5 border border-white/10 rounded-xl h-12 px-4" defaultValue="https://picsum.photos/1200/600" />
                      <button className="px-4 bg-white/10 rounded-xl font-bold text-xs uppercase">Preview</button>
                    </div>
                 </div>
                 <button className="md:col-span-2 py-4 bg-primary text-white font-black rounded-xl shadow-xl shadow-primary/20 mt-4">Publicar Alterações</button>
              </div>
           </div>
         )}

         {activeTab === 'faq' && (
           <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                 <h3 className="text-xl font-bold">Gestão do FAQ</h3>
                 <button className="px-3 py-1.5 bg-white/10 rounded-lg text-xs font-bold">+ Nova Pergunta</button>
              </div>
              {[1, 2, 3].map(i => (
                <div key={i} className="p-6 bg-black/20 rounded-2xl border border-white/5 flex flex-col gap-4 relative group">
                   <button className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined text-sm">delete</span></button>
                   <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Pergunta #{i}</label>
                      <input type="text" className="bg-white/5 border border-white/10 rounded-xl h-10 px-4 text-sm" defaultValue="Como os convidados enviam as fotos?" />
                   </div>
                   <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Resposta #{i}</label>
                      <textarea className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm h-24" defaultValue="Basta escanear o QR Code impresso no evento..." />
                   </div>
                </div>
              ))}
              <button className="py-4 bg-primary text-white font-black rounded-xl mt-4">Salvar FAQ</button>
           </div>
         )}

         {activeTab === 'contacts' && (
           <div className="flex flex-col gap-8 animate-in fade-in duration-300">
              <h3 className="text-xl font-bold border-b border-white/5 pb-4">Informações de Contato</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">E-mail de Suporte</label>
                    <input type="email" className="bg-white/5 border border-white/10 rounded-xl h-12 px-4" defaultValue="suporte@eventmedia.io" />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">WhatsApp / Telefone</label>
                    <input type="text" className="bg-white/5 border border-white/10 rounded-xl h-12 px-4" defaultValue="+55 11 99999-9999" />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Instagram Link</label>
                    <input type="text" className="bg-white/5 border border-white/10 rounded-xl h-12 px-4" defaultValue="instagram.com/eventmedia" />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Endereço (Opcional)</label>
                    <input type="text" className="bg-white/5 border border-white/10 rounded-xl h-12 px-4" placeholder="Logradouro, Nº..." />
                 </div>
                 <button className="md:col-span-2 py-4 bg-primary text-white font-black rounded-xl mt-4">Salvar Contatos</button>
              </div>
           </div>
         )}

         {activeTab === 'legal' && (
           <div className="flex flex-col gap-8 animate-in fade-in duration-300">
              <h3 className="text-xl font-bold border-b border-white/5 pb-4">Jurídico</h3>
              <div className="flex flex-col gap-6">
                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Termos de Uso</label>
                    <textarea className="bg-white/5 border border-white/10 rounded-xl p-6 text-sm h-64 font-mono leading-relaxed" defaultValue="# Termos de Uso do EventMedia\n\nAo utilizar nossa plataforma..." />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Política de Privacidade</label>
                    <textarea className="bg-white/5 border border-white/10 rounded-xl p-6 text-sm h-64 font-mono leading-relaxed" defaultValue="# Política de Privacidade\n\nValorizamos a proteção dos seus dados..." />
                 </div>
              </div>
              <button className="py-4 bg-primary text-white font-black rounded-xl mt-4">Salvar Jurídico</button>
           </div>
         )}

         {activeTab === 'footer' && (
            <div className="flex flex-col gap-8 animate-in fade-in duration-300">
               <h3 className="text-xl font-bold border-b border-white/5 pb-4">Rodapé</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2 col-span-2">
                     <label className="text-[10px] font-bold text-slate-500 uppercase">Texto de Copyright</label>
                     <input type="text" className="bg-white/5 border border-white/10 rounded-xl h-12 px-4" defaultValue="© 2024 EventMedia SaaS. Desenvolvido para eventos de alto impacto." />
                  </div>
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-bold text-slate-500 uppercase">Links Úteis (Coluna 1)</label>
                     <textarea className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs h-32" defaultValue="Home, Recursos, Preços" />
                  </div>
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-bold text-slate-500 uppercase">Links Úteis (Coluna 2)</label>
                     <textarea className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs h-32" defaultValue="Sobre Nós, Blog, Carreiras" />
                  </div>
                  <button className="md:col-span-2 py-4 bg-primary text-white font-black rounded-xl mt-4">Salvar Rodapé</button>
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

const AdminFinance = () => {
  const transactions = [
    { id: 'tx_01', evento: 'Casamento Lucas & Bia', valor: 49.90, status: 'Pago', data: '22/05/2024' },
    { id: 'tx_02', evento: 'Conferência Tech 2024', valor: 199.00, status: 'Ativo', data: '21/05/2024' },
    { id: 'tx_03', evento: 'Aniversário 15 anos Julia', valor: 49.90, status: 'Cancelado', data: '20/05/2024' },
    { id: 'tx_04', evento: 'Show Sertanejo Live', valor: 299.00, status: 'Aguardando', data: '20/05/2024' },
    { id: 'tx_05', evento: 'Evento Corporativo XP', valor: 199.00, status: 'Pago', data: '19/05/2024' },
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Pago': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Ativo': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Cancelado': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Aguardando': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black">Fluxo Financeiro</h2>
          <p className="text-slate-400 text-sm">Controle de faturamento e status de transações.</p>
        </div>
        <button className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl font-bold text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">download</span> Exportar Relatório
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Total Recebido</p>
            <p className="text-2xl font-black mt-1">R$ 12.450,00</p>
         </div>
         <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Aguardando</p>
            <p className="text-2xl font-black mt-1">R$ 1.290,00</p>
         </div>
         <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Cancelados (Mês)</p>
            <p className="text-2xl font-black mt-1 text-red-500">R$ 490,00</p>
         </div>
         <div className="bg-primary p-6 rounded-3xl shadow-xl shadow-primary/20">
            <p className="text-[10px] font-bold text-white/70 uppercase">Saldo Disponível</p>
            <p className="text-2xl font-black mt-1 text-white">R$ 8.920,40</p>
         </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="font-bold">Histórico de Transações</h3>
          <div className="flex gap-2">
            {['Todos', 'Pago', 'Aguardando', 'Cancelado'].map(f => (
              <button key={f} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase ${f === 'Todos' ? 'bg-primary text-white' : 'bg-white/5 text-slate-400'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-4">Evento / ID</th>
              <th className="px-8 py-4">Data</th>
              <th className="px-8 py-4">Valor</th>
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                <td className="px-8 py-5">
                  <p className="font-bold text-sm">{tx.evento}</p>
                  <p className="text-[10px] text-slate-500 uppercase">{tx.id}</p>
                </td>
                <td className="px-8 py-5 text-sm text-slate-400">{tx.data}</td>
                <td className="px-8 py-5 font-black">R$ {tx.valor.toFixed(2)}</td>
                <td className="px-8 py-5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <button className="material-symbols-outlined text-slate-500 hover:text-white transition-colors">info</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('mercadopago');

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h2 className="text-3xl font-black">Configuração do Sistema</h2>
        <p className="text-slate-400 text-sm">Integrações de API e parâmetros globais do SaaS.</p>
      </header>

      <div className="flex gap-1 bg-white/5 p-1 rounded-2xl self-start">
        <button 
          onClick={() => setActiveTab('mercadopago')}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'mercadopago' ? 'bg-primary text-white' : 'text-slate-500 hover:text-white'}`}
        >
          Mercado Pago API
        </button>
        <button 
          onClick={() => setActiveTab('webhooks')}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'webhooks' ? 'bg-primary text-white' : 'text-slate-500 hover:text-white'}`}
        >
          Webhooks / Retorno
        </button>
        <button 
          onClick={() => setActiveTab('geral')}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'geral' ? 'bg-primary text-white' : 'text-slate-500 hover:text-white'}`}
        >
          Geral
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-10 max-w-[800px]">
        {activeTab === 'mercadopago' && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex items-center gap-4 border-b border-white/5 pb-6">
              <div className="w-16 h-16 bg-[#009ee3] rounded-2xl flex items-center justify-center p-3">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Mercado_Libre_logo.svg/1200px-Mercado_Libre_logo.svg.png" className="w-full grayscale brightness-[10]" alt="Mercado Pago" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Configuração Mercado Pago</h3>
                <p className="text-sm text-slate-500">Obtenha suas credenciais no Painel de Desenvolvedor do Mercado Pago.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
               <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Public Key</label>
                  <input type="text" className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 font-mono text-sm focus:ring-primary focus:border-primary" placeholder="APP_USR-..." />
               </div>
               <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Access Token</label>
                  <input type="password" className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 font-mono text-sm focus:ring-primary focus:border-primary" placeholder="TEST-..." />
               </div>
               <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                  <span className="material-symbols-outlined text-primary">info</span>
                  <p className="text-xs text-slate-400 leading-relaxed">Sugerimos usar credenciais de <strong>Produção</strong> para processar pagamentos reais. Credenciais de teste são limitadas ao sandbox.</p>
               </div>
               <button className="py-4 bg-primary text-white font-black rounded-xl shadow-xl shadow-primary/20 mt-4">Salvar Configurações</button>
            </div>
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-left-4 duration-300">
            <h3 className="text-xl font-bold">URLs de Notificação (Webhooks)</h3>
            <p className="text-sm text-slate-400">Configure estas URLs no seu painel do Mercado Pago para receber notificações instantâneas sobre mudanças de status.</p>
            
            <div className="space-y-4">
               {[
                 { label: 'Webhook de Notificação', url: 'https://api.eventmedia.io/webhooks/mercadopago' },
                 { label: 'Página de Sucesso', url: 'https://eventmedia.io/pagamento/sucesso' },
                 { label: 'Página de Pendente', url: 'https://eventmedia.io/pagamento/pendente' },
                 { label: 'Página de Erro', url: 'https://eventmedia.io/pagamento/erro' }
               ].map(url => (
                 <div key={url.label} className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">{url.label}</label>
                    <div className="flex gap-2">
                       <input readOnly value={url.url} className="flex-1 bg-white/5 border border-white/10 rounded-xl h-12 px-4 font-mono text-xs text-slate-400" />
                       <button className="px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10">
                          <span className="material-symbols-outlined text-sm">content_copy</span>
                       </button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'geral' && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-left-4 duration-300">
             <h3 className="text-xl font-bold">Parâmetros de Sistema</h3>
             <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                   <div>
                      <p className="font-bold">Modo de Manutenção</p>
                      <p className="text-xs text-slate-500">Impede novos logins e compras temporariamente.</p>
                   </div>
                   <div className="w-12 h-6 bg-white/10 rounded-full relative p-1 cursor-pointer">
                      <div className="w-4 h-4 bg-slate-500 rounded-full"></div>
                   </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                   <div>
                      <p className="font-bold">Aprovação Automática (Planos Free)</p>
                      <p className="text-xs text-slate-500">Ativa contas gratuitas sem validação de e-mail.</p>
                   </div>
                   <div className="w-12 h-6 bg-primary/20 rounded-full relative p-1 cursor-pointer">
                      <div className="w-4 h-4 bg-primary rounded-full absolute right-1"></div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, trend, icon, color }: any) => (
  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col gap-2">
    <div className="flex justify-between items-start text-slate-500">
      <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      <span className={`material-symbols-outlined !text-xl ${color}`}>{icon}</span>
    </div>
    <p className="text-2xl font-black">{value}</p>
    <p className="text-[10px] font-bold text-green-500 bg-green-500/10 self-start px-2 py-0.5 rounded-full">{trend}</p>
  </div>
);
