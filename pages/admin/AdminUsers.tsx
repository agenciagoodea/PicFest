import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';
import { Profile } from '../../types';

export const AdminUsers: React.FC = () => {
   const queryClient = useQueryClient();
   const [searchTerm, setSearchTerm] = useState('');

   // Busca de usuários via React Query
   const { data: users = [], isLoading: loading } = useQuery({
      queryKey: ['adminUsers'],
      queryFn: () => adminService.getAllUsers(),
   });

   // Mutação para alterar role
   const roleMutation = useMutation({
      mutationFn: ({ userId, newRole }: { userId: string, newRole: string }) => adminService.updateUserRole(userId, newRole),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
         alert('Cargo atualizado com sucesso!');
      },
      onError: () => alert('Erro ao atualizar papel do usuário.'),
   });

   const filteredUsers = users.filter(u =>
      u.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.cpf?.includes(searchTerm.replace(/\D/g, ''))
   );

   const handleRoleChange = (userId: string, currentRole: string) => {
      const newRole = currentRole === 'admin' ? 'organizador' : 'admin';
      if (!confirm(`Deseja alterar o papel deste usuário para ${newRole.toUpperCase()}?`)) return;
      roleMutation.mutate({ userId, newRole });
   };

   if (loading) return <div className="p-10 text-center animate-pulse">Consultando base de membros...</div>;

   return (
      <div className="flex flex-col gap-8 animate-in fade-in duration-500">
         <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
            <div>
               <h2 className="text-3xl font-black tracking-tight uppercase">Gestão de Usuários</h2>
               <p className="text-slate-400 mt-2">Controle de acesso e atribuição de cargos da plataforma.</p>
            </div>
            <div className="flex gap-4">
               <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                  <input
                     type="text"
                     placeholder="Nome, Email ou CPF..."
                     className="bg-white/5 border border-white/10 rounded-xl h-12 pl-12 pr-6 text-xs text-white outline-none focus:border-primary w-64 transition-all"
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>
               <button
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['adminUsers'] })}
                  className="p-3 bg-white/5 rounded-xl hover:text-primary transition-all"
               >
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
                                 className="p-2 bg-white/5 rounded-lg hover:bg-primary/20 hover:text-primary transition-all"
                                 title="Alterar Cargo"
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
