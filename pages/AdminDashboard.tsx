
import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { adminService } from '../services/adminService';
import { Depoimento, Profile, Evento, Plano } from '../types';
import { DashboardLayout } from '../layouts/DashboardLayout';

export const AdminDashboard: React.FC = () => {
  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: 'grid_view' },
    { path: '/admin/usuarios', label: 'Usuários', icon: 'group' },
    { path: '/admin/planos', label: 'Planos', icon: 'layers' },
    { path: '/admin/eventos', label: 'Todos Eventos', icon: 'event' },
    { path: '/admin/depoimentos', label: 'Depoimentos', icon: 'reviews' },
    { path: '/admin/configuracao', label: 'Configuração', icon: 'settings' },
  ];

  return (
    <DashboardLayout menuItems={menuItems} title="PicFest Admin" icon="shield_person">
      <Routes>
        <Route path="/" element={<AdminHome />} />
        <Route path="/usuarios" element={<AdminUsers />} />
        <Route path="/planos" element={<AdminPlans />} />
        <Route path="/eventos" element={<AdminEvents />} />
        <Route path="/depoimentos" element={<AdminTestimonials />} />
        <Route path="/configuracao" element={<AdminSettings />} />
      </Routes>
    </DashboardLayout>
  );
};

/* --- SUB-TELAS --- */

const AdminHome = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getMetrics().then(data => {
      setMetrics(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-10 text-center animate-pulse">Carregando métricas...</div>;

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-black tracking-tight">Visão Geral</h1>
        <p className="text-slate-400 mt-2">Métricas consolidadas de toda a plataforma.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Receita Mensal Est."
          value={`R$ ${metrics.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend="Tempo Real"
          icon="account_balance"
          color="text-green-500"
        />
        <StatCard
          label="Organizadores"
          value={metrics.totalUsers.toString()}
          trend="Total"
          icon="groups"
          color="text-primary"
        />
        <StatCard
          label="Mídias Totais"
          value={metrics.totalMedia.toString()}
          trend="Acumulado"
          icon="photo_library"
          color="text-orange-500"
        />
        <StatCard
          label="Eventos Ativos"
          value={metrics.totalEvents.toString()}
          trend="Total"
          icon="event"
          color="text-purple-500"
        />
      </div>
    </div>
  );
};

const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState<Depoimento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabaseService.getTestimonials(false).then(data => {
      setTestimonials(data);
      setLoading(false);
    });
  }, []);

  const toggleApproval = async (id: string, current: boolean) => {
    try {
      await supabaseService.updateTestimonialApproval(id, !current);
      setTestimonials(prev => prev.map(d => d.id === id ? { ...d, aprovado: !current } : d));
    } catch (err) {
      alert('Erro ao atualizar depoimento');
    }
  };

  if (loading) return <div className="p-10 text-center">Carregando depoimentos...</div>;

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
              <th className="px-8 py-5 text-center">Estrelas</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {testimonials.length === 0 ? (
              <tr><td colSpan={5} className="px-8 py-10 text-center text-slate-500">Nenhum depoimento encontrado.</td></tr>
            ) : testimonials.map(t => (
              <tr key={t.id} className="hover:bg-white/5 transition-all group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <img src={t.foto_url || `https://i.pravatar.cc/150?u=${t.id}`} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                    <p className="font-bold text-sm truncate max-w-[150px]">{t.nome}</p>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <p className="text-xs text-slate-400 max-w-md line-clamp-2 italic">"{t.texto}"</p>
                </td>
                <td className="px-8 py-5">
                  <div className="flex justify-center text-primary">
                    {Array.from({ length: t.estrelas }).map((_, i) => (
                      <span key={i} className="material-symbols-outlined !text-sm">star</span>
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

const AdminUsers = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAllUsers().then(data => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-10 text-center">Carregando usuários...</div>;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black">Gestão de Usuários</h2>
        <p className="text-slate-400 mt-2">Visualize e gerencie as contas da plataforma.</p>
      </header>

      <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
        <table className="w-full">
          <thead className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
            <tr>
              <th className="px-8 py-5 text-left">Usuário</th>
              <th className="px-8 py-5 text-left">E-mail</th>
              <th className="px-8 py-5 text-left">Role</th>
              <th className="px-8 py-5 text-left">Criado em</th>
              <th className="px-8 py-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <img src={user.foto_perfil || `https://i.pravatar.cc/150?u=${user.id}`} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                    <span className="font-bold">{user.nome}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-sm text-slate-400">{user.email}</td>
                <td className="px-8 py-5">
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-8 py-5 text-xs text-slate-500">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '--'}
                </td>
                <td className="px-8 py-5 text-right">
                  <button className="text-primary hover:text-white transition-colors"><span className="material-symbols-outlined text-sm">more_vert</span></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminPlans = () => {
  const [plans, setPlans] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAllPlans().then(data => {
      setPlans(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-10 text-center">Carregando planos...</div>;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black">Planos & SaaS</h2>
        <p className="text-slate-400 mt-2">Configure os limites e valores dos pacotes PicFest.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map(p => (
          <div key={p.id} className="bg-white/5 border border-white/10 p-8 rounded-[2rem] flex flex-col gap-4 group hover:border-primary transition-all">
            <div className="flex justify-between items-center">
              <h4 className="font-black uppercase tracking-widest text-[10px] text-primary">{p.nome}</h4>
              <span className={`w-2 h-2 rounded-full ${p.ativo ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-slate-700'}`}></span>
            </div>
            <div>
              <p className="text-3xl font-black">R$ {p.valor.toFixed(2)}</p>
              <p className="text-[10px] text-slate-500">{p.recorrencia}</p>
            </div>
            <div className="flex flex-col gap-2 mt-4 text-xs text-slate-400">
              <p className="flex justify-between"><span>Eventos:</span> <span className="font-bold text-white">{p.limite_eventos === 0 ? 'ilimitados' : p.limite_eventos}</span></p>
              <p className="flex justify-between"><span>Storage:</span> <span className="font-bold text-white">{p.limite_storage} GB</span></p>
            </div>
            <button className="mt-6 py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-all">Editar Plano</button>
          </div>
        ))}
        <div className="border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center p-8 text-center gap-3 hover:border-white/10 transition-all cursor-pointer group">
          <span className="material-symbols-outlined !text-4xl text-slate-700 group-hover:scale-110 transition-transform">add_circle</span>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Novo Plano</p>
        </div>
      </div>
    </div>
  );
};

const AdminEvents = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAllEvents().then(data => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-10 text-center text-slate-600 font-bold uppercase tracking-widest text-xs">Monitorando eventos...</div>;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black tracking-tight">Monitor Global de Eventos</h2>
        <p className="text-slate-400 mt-2">Visão geral de todos os eventos criados no sistema.</p>
      </header>

      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
            <tr>
              <th className="px-8 py-5">Evento</th>
              <th className="px-8 py-5">Organizador</th>
              <th className="px-8 py-5">Data</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {events.map((ev: any) => (
              <tr key={ev.id} className="hover:bg-white/5 transition-all">
                <td className="px-8 py-5 font-bold">
                  <div>
                    {ev.nome}
                    <p className="text-[10px] font-mono text-primary uppercase mt-0.5">/{ev.slug_curto}</p>
                  </div>
                </td>
                <td className="px-8 py-5 text-slate-400">{ev.organizador?.nome || '--'}</td>
                <td className="px-8 py-5">{new Date(ev.data_evento).toLocaleDateString('pt-BR')}</td>
                <td className="px-8 py-5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${ev.status?.toLowerCase() === 'ativo' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                    {ev.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <Link to={`/live/${ev.slug_curto}`} target="_blank" className="p-2 bg-white/5 rounded-lg hover:text-green-500 transition-colors"><span className="material-symbols-outlined text-sm">tv</span></Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminSettings = () => (
  <div className="p-10 flex flex-col gap-6 max-w-2xl bg-white/5 border border-white/10 rounded-[2rem]">
    <h2 className="text-2xl font-black">Configurações Globais</h2>
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome da Aplicação</label>
        <input type="text" defaultValue="PicFest" className="bg-white/5 border border-white/10 h-14 px-5 rounded-2xl outline-none focus:ring-1 focus:ring-primary" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail de Suporte</label>
        <input type="email" defaultValue="contato@picfest.com.br" className="bg-white/5 border border-white/10 h-14 px-5 rounded-2xl outline-none focus:ring-1 focus:ring-primary" />
      </div>
    </div>
    <button className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 mt-6">Gravar Alterações</button>
  </div>
);

const StatCard = ({ label, value, trend, icon, color }: any) => (
  <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex flex-col gap-2 hover:border-primary/30 transition-all group">
    <div className="flex justify-between items-start text-slate-500">
      <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      <span className={`material-symbols-outlined !text-xl ${color} group-hover:scale-110 transition-transform`}>{icon}</span>
    </div>
    <p className="text-3xl font-black">{value}</p>
    <div className="flex items-center gap-1 mt-1">
      <span className="material-symbols-outlined text-[10px] text-primary">trending_up</span>
      <p className="text-[10px] font-black text-primary uppercase tracking-widest">{trend}</p>
    </div>
  </div>
);
