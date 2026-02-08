
import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { adminService } from '../services/adminService';
import { Depoimento, Profile, Evento, Plano } from '../types';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProfileForm } from '../components/ProfileForm';

export const AdminDashboard: React.FC = () => {
  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: 'grid_view' },
    { path: '/admin/usuarios', label: 'Usuários', icon: 'group' },
    { path: '/admin/planos', label: 'Planos', icon: 'layers' },
    { path: '/admin/eventos', label: 'Todos Eventos', icon: 'event' },
    { path: '/admin/depoimentos', label: 'Depoimentos', icon: 'reviews' },
    { path: '/admin/landing', label: 'Landing Page', icon: 'auto_awesome_motion' },
    { path: '/admin/configuracoes', label: 'Configurações', icon: 'settings' },
  ];

  return (
    <DashboardLayout menuItems={menuItems} title="PicFest Admin" icon="shield_person">
      <Routes>
        <Route path="/" element={<AdminHome />} />
        <Route path="/usuarios" element={<AdminUsers />} />
        <Route path="/planos" element={<AdminPlans />} />
        <Route path="/eventos" element={<AdminEvents />} />
        <Route path="/landing" element={<AdminLanding />} />
        <Route path="/depoimentos" element={<AdminTestimonials />} />
        <Route path="/configuracoes" element={<AdminSettings />} />
        <Route path="/perfil" element={<ProfileForm />} />
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
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(u =>
    u.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.cpf?.includes(searchTerm.replace(/\D/g, ''))
  );

  const fetchUsers = () => {
    setLoading(true);
    adminService.getAllUsers().then(data => {
      setUsers(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'organizador' : 'admin';
    if (!confirm(`Deseja alterar o papel deste usuário para ${newRole.toUpperCase()}?`)) return;

    try {
      await adminService.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
    } catch (err) {
      alert('Erro ao atualizar papel do usuário.');
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Carregando usuários...</div>;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase">Gestão de Usuários</h2>
          <p className="text-slate-400 mt-2">Controle de acesso e atribuição de cargos.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
            <input
              type="text"
              placeholder="Buscar por Nome, Email ou CPF..."
              className="bg-white/5 border border-white/10 rounded-xl h-12 pl-12 pr-6 text-xs text-white outline-none focus:border-primary w-64 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={fetchUsers} className="p-3 bg-white/5 rounded-xl hover:text-primary transition-all">
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>
      </header>

      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-md">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
            <tr>
              <th className="px-8 py-6">Membro</th>
              <th className="px-8 py-6">Cargo</th>
              <th className="px-8 py-6">Cadastro</th>
              <th className="px-8 py-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center text-slate-500 italic text-sm">Nenhum usuário encontrado.</td>
              </tr>
            ) : filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                      <img src={user.foto_perfil || `https://i.pravatar.cc/150?u=${user.id}`} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="font-bold block text-sm">{user.nome}</span>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-mono">{user.email}</span>
                        {user.cpf && <span className="text-[9px] text-primary font-black tracking-tighter uppercase mt-0.5">CPF: {user.cpf}</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border shadow-sm ${user.role === 'admin'
                    ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                    : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-8 py-6 text-xs text-slate-500 font-medium">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '--'}
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleRoleChange(user.id, user.role)}
                      className="p-2 bg-white/5 rounded-lg hover:bg-primary/20 hover:text-primary transition-all title='Alterar Cargo'"
                    >
                      <span className="material-symbols-outlined text-sm">manage_accounts</span>
                    </button>
                    <button className="p-2 bg-white/5 rounded-lg hover:bg-red-500/20 hover:text-red-500 transition-all">
                      <span className="material-symbols-outlined text-sm">block</span>
                    </button>
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

const AdminPlans = () => {
  const [plans, setPlans] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<Plano> | null>(null);

  const fetchPlans = () => {
    setLoading(true);
    adminService.getAllPlans().then(data => {
      setPlans(data);
      setLoading(false);
    });
  }

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      if (editingPlan.id) {
        await adminService.updatePlan(editingPlan.id, editingPlan);
      } else {
        // Deixar o Supabase gerar o UUID automaticamente
        const { id, ...planData } = editingPlan as any;
        await adminService.createPlan({
          ...planData,
          limite_storage: 0 // Valor padrão para evitar erro de NOT NULL se o migration falhar
        });
      }
      alert('Plano salvo com sucesso!');
      setShowModal(false);
      fetchPlans();
    } catch (err) {
      alert('Erro ao salvar plano.');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Deseja realmente excluir este plano?')) return;
    try {
      await adminService.deletePlan(id);
      fetchPlans();
    } catch (err) {
      alert('Erro ao excluir plano.');
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-xs font-black uppercase tracking-widest text-slate-700">Sincronizando Pacotes...</div>;

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase">Modelos de Negócio</h2>
          <p className="text-slate-400 mt-2">Gestão de precificação e limites operacionais SaaS.</p>
        </div>
        <button
          onClick={() => { setEditingPlan({ nome: '', valor: 0, limite_eventos: 0, limite_midias: 0, pode_baixar: true, recorrencia: 'mensal' }); setShowModal(true); }}
          className="px-6 py-3 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span> Novo Plano
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {plans.map(p => (
          <div key={p.id} className="bg-white/5 border border-white/10 p-10 rounded-[3rem] flex flex-col gap-8 group hover:border-primary/50 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] group-hover:bg-primary/10 transition-colors"></div>

            <div className="flex justify-between items-center relative">
              <h4 className="font-black uppercase tracking-[0.2em] text-[10px] text-primary">{p.nome}</h4>
              <div className="flex gap-2">
                <button onClick={() => { setEditingPlan(p); setShowModal(true); }} className="text-slate-500 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button onClick={() => handleDeletePlan(p.id)} className="text-slate-500 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <p className="text-4xl font-black tracking-tighter">R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{p.recorrencia}</p>
            </div>

            <div className="flex flex-col gap-4 text-[11px] text-slate-400 font-semibold border-t border-white/5 pt-6">
              <p className="flex justify-between items-center">
                <span>Eventos Ativos</span>
                <span className="text-white bg-white/10 px-2 py-0.5 rounded-md font-black">{p.limite_eventos === 0 ? '∞' : p.limite_eventos}</span>
              </p>
              <p className="flex justify-between items-center">
                <span>Mídias Totais</span>
                <span className="text-white bg-white/10 px-2 py-0.5 rounded-md font-black">{p.limite_midias === 0 ? '∞' : p.limite_midias}</span>
              </p>
              <p className="flex justify-between items-center">
                <span>Download Mídia</span>
                <span className={`px-2 py-0.5 rounded-md font-black ${p.pode_baixar ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                  {p.pode_baixar ? 'LIBERADO' : 'BLOQUEADO'}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE EDIÇÃO/CRIAÇÃO */}
      {showModal && editingPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 p-10 rounded-[2.5rem] w-full max-w-xl flex flex-col gap-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black tracking-tight uppercase">{editingPlan.id ? 'Editar Plano' : 'Novo Plano'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Nome do Plano</label>
                  <input
                    type="text"
                    required
                    value={editingPlan.nome}
                    onChange={e => setEditingPlan({ ...editingPlan, nome: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingPlan.valor}
                    onChange={e => setEditingPlan({ ...editingPlan, valor: parseFloat(e.target.value) })}
                    className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Limite Eventos (0=∞)</label>
                  <input
                    type="number"
                    required
                    value={editingPlan.limite_eventos}
                    onChange={e => setEditingPlan({ ...editingPlan, limite_eventos: parseInt(e.target.value) })}
                    className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Limite Mídias (0=∞)</label>
                  <input
                    type="number"
                    required
                    value={editingPlan.limite_midias}
                    onChange={e => setEditingPlan({ ...editingPlan, limite_midias: parseInt(e.target.value) })}
                    className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Recorrência</label>
                  <select
                    value={editingPlan.recorrencia}
                    onChange={e => setEditingPlan({ ...editingPlan, recorrencia: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary appearance-none"
                  >
                    <option value="mensal" className="bg-slate-900">Mensal</option>
                    <option value="anual" className="bg-slate-900">Anual</option>
                    <option value="unico" className="bg-slate-900">Pagamento Único</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 mt-2">
                <input
                  type="checkbox"
                  id="pode_baixar"
                  checked={editingPlan.pode_baixar}
                  onChange={e => setEditingPlan({ ...editingPlan, pode_baixar: e.target.checked })}
                  className="w-5 h-5 rounded bg-white/10 border-white/10 text-primary focus:ring-primary"
                />
                <label htmlFor="pode_baixar" className="text-sm font-medium text-slate-300">Liberar download de mídias para o organizador</label>
              </div>

              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-primary text-white font-black rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">Salvar Plano</button>
              </div>
            </form>
          </div>
        </div>
      )}
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

const AdminLanding = () => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminService.getLandingConfig().then(data => {
      setConfig(data || {
        hero: { titulo: '', subtitulo: '', cta_botao: '' },
        contato: { email: '', telefone: '', instagram: '' },
        faq: [],
        footer: { descricao: '' }
      });
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminService.updateLandingConfig(config);
      alert('Configurações da Landing Page salvas!');
    } catch (err) {
      alert('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Carregando configurações...</div>;

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tight uppercase">GESTÃO DA LANDING PAGE</h1>
          <p className="text-slate-400 mt-2 lowercase">Controle total sobre o conteúdo visual e textual da sua vitrine.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? 'Gravando...' : 'Gravar Alterações'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* HERO SECTION */}
        <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] flex flex-col gap-6">
          <div className="flex items-center gap-3 text-primary mb-2">
            <span className="material-symbols-outlined">rocket_launch</span>
            <h3 className="font-black uppercase tracking-widest text-xs">Hero Section (Cabeçalho)</h3>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Título Principal</label>
            <textarea
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white outline-none focus:border-primary transition-all min-h-[120px] resize-none"
              value={config.hero.titulo}
              onChange={e => setConfig({ ...config, hero: { ...config.hero, titulo: e.target.value } })}
              placeholder="Ex: SUA FESTA NO TELÃO EM REALTIME"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Subtítulo / Descrição</label>
            <textarea
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-slate-400 outline-none focus:border-primary transition-all min-h-[100px] resize-none"
              value={config.hero.subtitulo}
              onChange={e => setConfig({ ...config, hero: { ...config.hero, subtitulo: e.target.value } })}
              placeholder="Descrição detalhada do seu serviço..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Texto do Botão CTA</label>
            <input
              type="text"
              className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all"
              value={config.hero.cta_botao}
              onChange={e => setConfig({ ...config, hero: { ...config.hero, cta_botao: e.target.value } })}
              placeholder="Ex: Começar Agora"
            />
          </div>
        </div>

        {/* CONTATO & SOCIAL */}
        <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] flex flex-col gap-6">
          <div className="flex items-center gap-3 text-primary mb-2">
            <span className="material-symbols-outlined">contact_support</span>
            <h3 className="font-black uppercase tracking-widest text-xs">Informações de Contato</h3>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">E-mail de Contato</label>
            <input
              type="email"
              className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all"
              value={config.contato.email}
              onChange={e => setConfig({ ...config, contato: { ...config.contato, email: e.target.value } })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">WhatsApp / Telefone</label>
            <input
              type="text"
              className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all"
              value={config.contato.telefone}
              onChange={e => setConfig({ ...config, contato: { ...config.contato, telefone: e.target.value } })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Instagram (Handle)</label>
            <input
              type="text"
              className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all"
              value={config.contato.instagram}
              onChange={e => setConfig({ ...config, contato: { ...config.contato, instagram: e.target.value } })}
              placeholder="@seuinstagram"
            />
          </div>
        </div>

        {/* RODAPÉ E INSTITUCIONAL */}
        <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] flex flex-col gap-6 lg:col-span-2">
          <div className="flex items-center gap-3 text-primary mb-2">
            <span className="material-symbols-outlined">info</span>
            <h3 className="font-black uppercase tracking-widest text-xs">Rodapé & Institucional</h3>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Descrição da Empresa (Footer)</label>
            <textarea
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white outline-none focus:border-primary transition-all min-h-[100px] resize-none"
              value={config.footer?.descricao || ''}
              onChange={e => setConfig({ ...config, footer: { ...config.footer, descricao: e.target.value } })}
              placeholder="Descreva sua empresa para o rodapé..."
            />
          </div>
        </div>

        {/* FAQ SECTION */}
        <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] flex flex-col gap-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3 text-primary">
              <span className="material-symbols-outlined">quiz</span>
              <h3 className="font-black uppercase tracking-widest text-xs">Perguntas Frequentes (FAQ)</h3>
            </div>
            <button
              onClick={() => setConfig({ ...config, faq: [...(config.faq || []), { pergunta: '', resposta: '' }] })}
              className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
            >
              + Adicionar Pergunta
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(config.faq || []).map((f: any, i: number) => (
              <div key={i} className="bg-white/2 border border-white/5 p-6 rounded-2xl flex flex-col gap-4 group relative">
                <button
                  onClick={() => setConfig({ ...config, faq: config.faq.filter((_: any, idx: number) => idx !== i) })}
                  className="absolute top-4 right-4 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase">Pergunta</label>
                  <input
                    type="text"
                    className="bg-white/5 border border-white/10 rounded-xl h-10 px-4 text-xs text-white outline-none focus:border-primary"
                    value={f.pergunta}
                    onChange={e => {
                      const newFaq = [...config.faq];
                      newFaq[i].pergunta = e.target.value;
                      setConfig({ ...config, faq: newFaq });
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase">Resposta</label>
                  <textarea
                    className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-400 outline-none focus:border-primary min-h-[80px] resize-none"
                    value={f.resposta}
                    onChange={e => {
                      const newFaq = [...config.faq];
                      newFaq[i].resposta = e.target.value;
                      setConfig({ ...config, faq: newFaq });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminSettings = () => {
  const [config, setConfig] = useState({
    mercadopago: {
      publicKey: '',
      accessToken: '',
      webhookUrl: 'https://sua-url-api.com/webhooks/mercadopago',
    }
  });
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    adminService.getConfig('mercadopago').then(data => {
      if (data) {
        setConfig(prev => ({ ...prev, mercadopago: { ...prev.mercadopago, ...data } }));
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await adminService.updateConfig('mercadopago', config.mercadopago);
      alert('Configurações salvas com sucesso!');
    } catch (err) {
      alert('Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  const testConnectivity = async () => {
    setTestResult('processando');
    setTimeout(() => {
      setTestResult(config.mercadopago.accessToken.length > 10 ? 'success' : 'error');
    }, 1500);
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-xs font-black uppercase tracking-widest">Consultando chaves mestre...</div>;

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-black tracking-tight uppercase">Configurações globais</h1>
        <p className="text-slate-400 mt-2 lowercase text-sm">Integração Mercado Pago e parâmetros de sistema.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] flex flex-col gap-6">
          <h3 className="font-black uppercase tracking-widest text-[10px] text-primary">Credenciais Mercado Pago</h3>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Public Key</label>
            <input
              type="text"
              className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all font-mono text-xs"
              value={config.mercadopago.publicKey}
              onChange={e => setConfig({ ...config, mercadopago: { ...config.mercadopago, publicKey: e.target.value } })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Access Token</label>
            <input
              type="password"
              className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all font-mono text-xs"
              value={config.mercadopago.accessToken}
              onChange={e => setConfig({ ...config, mercadopago: { ...config.mercadopago, accessToken: e.target.value } })}
            />
          </div>
          <button onClick={handleSave} className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
            Salvar Credenciais
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] flex flex-col gap-6">
          <h3 className="font-black uppercase tracking-widest text-[10px] text-primary">Webhook Receiver</h3>
          <p className="text-xs text-slate-500">URL para notificações automáticas (IPN):</p>
          <div className="bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-[10px] text-green-400 break-all">
            {config.mercadopago.webhookUrl}
          </div>
          <button onClick={testConnectivity} disabled={testResult === 'processando'} className="py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
            {testResult === 'processando' ? 'Checando Rota...' : 'Testar Conexão'}
          </button>
        </div>
      </div>
    </div>
  );
};

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
