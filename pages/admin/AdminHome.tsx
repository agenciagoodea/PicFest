import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';

export const AdminHome: React.FC = () => {
   // Busca de métricas via React Query
   const { data: metrics, isLoading: loading } = useQuery({
      queryKey: ['adminMetrics'],
      queryFn: () => adminService.getMetrics(),
   });

   if (loading) return <div className="p-10 text-center animate-pulse text-white uppercase tracking-widest text-xs font-black">Sincronizando Big Data...</div>;

   return (
      <div className="flex flex-col gap-10 animate-in fade-in duration-500">
         <header>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
               Visão Geral <span className="text-[10px] bg-white/5 border border-white/10 px-3 py-1 rounded-full text-slate-500 not-italic">Painel de Controle</span>
            </h1>
            <p className="text-slate-400 mt-2">Métricas consolidadas de toda a plataforma PicFest.</p>
         </header>

         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
               label="Receita Mensal Est."
               value={`R$ ${metrics?.revenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
               trend="Tempo Real"
               icon="account_balance"
               color="text-green-500"
            />
            <StatCard
               label="Organizadores"
               value={metrics?.totalUsers?.toString() || '0'}
               trend="Total"
               icon="groups"
               color="text-primary"
            />
            <StatCard
               label="Mídias Totais"
               value={metrics?.totalMedia?.toString() || '0'}
               trend="Acumulado"
               icon="photo_library"
               color="text-orange-500"
            />
            <StatCard
               label="Eventos Ativos"
               value={metrics?.totalEvents?.toString() || '0'}
               trend="Total"
               icon="event"
               color="text-purple-500"
            />
         </div>
      </div>
   );
};

const StatCard = ({ label, value, trend, icon, color }: any) => (
   <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex flex-col gap-2 hover:border-primary/30 transition-all group shadow-xl">
      <div className="flex justify-between items-start text-slate-500">
         <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
         <span className={`material-symbols-outlined !text-xl ${color} group-hover:scale-110 transition-transform`}>{icon}</span>
      </div>
      <p className="text-3xl font-black text-white">{value}</p>
      <div className="flex items-center gap-1 mt-1">
         <span className="material-symbols-outlined text-[10px] text-primary">trending_up</span>
         <p className="text-[10px] font-black text-primary uppercase tracking-widest">{trend}</p>
      </div>
   </div>
);
