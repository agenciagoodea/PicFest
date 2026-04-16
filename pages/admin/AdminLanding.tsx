import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';

export const AdminLanding: React.FC = () => {
   const queryClient = useQueryClient();
   const [config, setConfig] = useState<any>(null);

   // Busca de configuração via React Query
   const { data: remoteConfig, isLoading: loading } = useQuery({
      queryKey: ['landingConfig'],
      queryFn: () => adminService.getLandingConfig(),
   });

   // Sincroniza estado local ao carregar dados remotos
   useEffect(() => {
      if (remoteConfig) setConfig(remoteConfig);
   }, [remoteConfig]);

   // Mutação para salvar configuração
   const saveMutation = useMutation({
      mutationFn: (newConfig: any) => adminService.updateLandingConfig(newConfig),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['landingConfig'] });
         alert('Landing Page atualizada com sucesso!');
      },
      onError: () => alert('Erro ao salvar configurações.'),
   });

   const handleSave = () => {
      if (!config) return;
      saveMutation.mutate(config);
   };

   if (loading || !config) return <div className="p-10 text-center animate-pulse">Lendo rascunho da vitrine...</div>;

   return (
      <div className="flex flex-col gap-10 animate-in fade-in duration-500">
         <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
               <h1 className="text-4xl font-black tracking-tight uppercase">Editor de Vitrine</h1>
               <p className="text-slate-400 mt-2">Personalize a experiência visual da Landing Page principal.</p>
            </div>
            <button
               onClick={handleSave}
               disabled={saveMutation.isPending}
               className="bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
            >
               {saveMutation.isPending ? 'Propagando...' : 'Publicar Alterações'}
            </button>
         </header>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Hero Section */}
            <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] flex flex-col gap-6">
               <h3 className="font-black uppercase tracking-widest text-[10px] text-primary">Seção Hero</h3>
               <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Título Principal (H1)</label>
                  <input
                     type="text"
                     className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all text-xl font-bold"
                     value={config.hero?.title}
                     onChange={e => setConfig({ ...config, hero: { ...config.hero, title: e.target.value } })}
                  />
               </div>
               <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Subtítulo</label>
                  <textarea
                     className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white outline-none focus:border-primary transition-all h-32 resize-none"
                     value={config.hero?.subtitle}
                     onChange={e => setConfig({ ...config, hero: { ...config.hero, subtitle: e.target.value } })}
                  />
               </div>
            </div>

            {/* Features Section */}
            <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] flex flex-col gap-6">
               <h3 className="font-black uppercase tracking-widest text-[10px] text-primary">Destaques (Cards)</h3>
               <div className="flex flex-col gap-4">
                  {config.features?.map((feat: any, idx: number) => (
                     <div key={idx} className="p-6 bg-black/20 rounded-[2rem] border border-white/5 flex flex-col gap-4">
                        <div className="flex gap-4">
                           <div className="flex-1 flex flex-col gap-1">
                              <label className="text-[8px] font-black text-slate-600 uppercase">Ícone (Google Font Name)</label>
                              <input
                                 type="text"
                                 className="bg-white/5 border border-white/10 rounded-xl h-10 px-4 text-xs text-white"
                                 value={feat.icon}
                                 onChange={e => {
                                    const newFeatures = [...config.features];
                                    newFeatures[idx].icon = e.target.value;
                                    setConfig({ ...config, features: newFeatures });
                                 }}
                              />
                           </div>
                           <div className="flex-[2] flex flex-col gap-1">
                              <label className="text-[8px] font-black text-slate-600 uppercase">Título</label>
                              <input
                                 type="text"
                                 className="bg-white/5 border border-white/10 rounded-xl h-10 px-4 text-xs text-white font-bold"
                                 value={feat.title}
                                 onChange={e => {
                                    const newFeatures = [...config.features];
                                    newFeatures[idx].title = e.target.value;
                                    setConfig({ ...config, features: newFeatures });
                                 }}
                              />
                           </div>
                        </div>
                        <textarea
                           className="bg-white/5 border border-white/10 rounded-xl p-4 text-[10px] text-slate-400 outline-none h-20"
                           value={feat.description}
                           onChange={e => {
                              const newFeatures = [...config.features];
                              newFeatures[idx].description = e.target.value;
                              setConfig({ ...config, features: newFeatures });
                           }}
                        />
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
   );
};
