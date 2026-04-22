import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';

export const AdminLanding: React.FC = () => {
   const queryClient = useQueryClient();
   const [config, setConfig] = useState<any>(null);
   const [activeTab, setActiveTab] = useState<'hero' | 'features' | 'sections' | 'faq'>('hero');

   // Busca de configuração via React Query
   const { data: remoteConfig, isLoading: loading } = useQuery({
      queryKey: ['landingConfig'],
      queryFn: () => adminService.getLandingConfig(),
   });

   // Sincroniza estado local ao carregar dados remotos e inicializa estrutura se vazio
   useEffect(() => {
      if (remoteConfig) {
         setConfig({
            hero: remoteConfig.hero || { title: '', subtitle: '' },
            features: remoteConfig.features || [],
            sections: remoteConfig.sections || { plans: { visible: true }, testimonials: { visible: true }, footer: { text: '' } },
            faq: remoteConfig.faq || []
         });
      } else if (!loading) {
         setConfig({
            hero: { title: '', subtitle: '' },
            features: [],
            sections: { plans: { visible: true }, testimonials: { visible: true }, footer: { text: '' } },
            faq: []
         });
      }
   }, [remoteConfig, loading]);

   // Mutação para salvar configuração
   const saveMutation = useMutation({
      mutationFn: (newConfig: any) => adminService.updateLandingConfig(newConfig),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['landingConfig'] });
         // Usando div/toast customizado seria melhor, mas mantemos o alert simples para fallback
         alert('Vitrine publicada com sucesso!');
      },
      onError: () => alert('Erro ao salvar configurações.'),
   });

   const handleSave = () => {
      if (!config) return;
      saveMutation.mutate(config);
   };

   const addFeature = () => {
      setConfig({ ...config, features: [...(config.features || []), { icon: 'star', title: 'Novo Destaque', description: '' }] });
   };

   const addFaq = () => {
      setConfig({ ...config, faq: [...(config.faq || []), { question: 'Nova Pergunta?', answer: 'Resposta detalhada aqui.' }] });
   };

   if (loading || !config) return <div className="p-10 text-center animate-pulse">Lendo rascunho da vitrine...</div>;

   return (
      <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
         <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
               <h1 className="text-4xl font-black tracking-tight uppercase">Editor de Vitrine</h1>
               <p className="text-slate-400 mt-2">Gerencie todo o conteúdo visível na Landing Page pública.</p>
            </div>
            <div className="flex gap-4">
                <a 
                   href="/" 
                   target="_blank" 
                   rel="noreferrer"
                   className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 py-3 rounded-2xl font-bold uppercase tracking-widest transition-all text-sm flex items-center justify-center"
                >
                   Ver Landing
                </a>
                <button
                   onClick={handleSave}
                   disabled={saveMutation.isPending}
                   className="bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50 text-sm"
                >
                   {saveMutation.isPending ? 'Salvando...' : 'Publicar'}
                </button>
            </div>
         </header>

         {/* Navegação por abas */}
         <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/10">
            {[
               { id: 'hero', label: 'Cabeçalho (Hero)' },
               { id: 'features', label: 'Destaques' },
               { id: 'sections', label: 'Visibilidade de Seções' },
               { id: 'faq', label: 'Perguntas Frequentes (FAQ)' }
            ].map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3 rounded-t-2xl font-bold uppercase tracking-wider text-[10px] transition-colors ${
                     activeTab === tab.id 
                     ? 'bg-white/10 text-white border-b-2 border-primary' 
                     : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
               >
                  {tab.label}
               </button>
            ))}
         </div>

         <div className="bg-white/5 border border-white/10 p-8 rounded-b-[2.5rem] rounded-tr-[2.5rem] min-h-[500px]">
            {activeTab === 'hero' && (
               <div className="flex flex-col gap-6 max-w-3xl">
                  <h3 className="font-black uppercase tracking-widest text-xs text-primary mb-4">Seção Hero</h3>
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Título Principal (H1)</label>
                     <input
                        type="text"
                        className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary transition-all text-xl font-bold"
                        value={config.hero?.title}
                        onChange={e => setConfig({ ...config, hero: { ...config.hero, title: e.target.value } })}
                        placeholder="Ex: Compartilhe os melhores momentos..."
                     />
                  </div>
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Subtítulo</label>
                     <textarea
                        className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white outline-none focus:border-primary transition-all h-32 resize-none"
                        value={config.hero?.subtitle}
                        onChange={e => setConfig({ ...config, hero: { ...config.hero, subtitle: e.target.value } })}
                        placeholder="Ex: Uma plataforma completa para armazenar fotos..."
                     />
                  </div>
               </div>
            )}

            {activeTab === 'features' && (
               <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-black uppercase tracking-widest text-xs text-primary">Destaques (Cards)</h3>
                      <button onClick={addFeature} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                          + Adicionar Destaque
                      </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {config.features?.map((feat: any, idx: number) => (
                        <div key={idx} className="p-6 bg-black/30 rounded-[2rem] border border-white/10 flex flex-col gap-4 relative group">
                           <button 
                              onClick={() => {
                                 const newFeatures = [...config.features];
                                 newFeatures.splice(idx, 1);
                                 setConfig({ ...config, features: newFeatures });
                              }}
                              className="absolute -top-3 -right-3 w-8 h-8 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                           >
                              ×
                           </button>
                           <div className="flex gap-4">
                              <div className="flex-1 flex flex-col gap-1">
                                 <label className="text-[8px] font-black text-slate-600 uppercase">Ícone</label>
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
                              className="bg-white/5 border border-white/10 rounded-xl p-4 text-[10px] text-slate-300 outline-none h-24 resize-none"
                              value={feat.description}
                              onChange={e => {
                                 const newFeatures = [...config.features];
                                 newFeatures[idx].description = e.target.value;
                                 setConfig({ ...config, features: newFeatures });
                              }}
                           />
                        </div>
                     ))}
                     {(!config.features || config.features.length === 0) && (
                         <div className="col-span-full p-10 text-center text-slate-500 border border-dashed border-white/10 rounded-3xl">
                             Nenhum destaque adicionado.
                         </div>
                     )}
                  </div>
               </div>
            )}

            {activeTab === 'sections' && (
               <div className="flex flex-col gap-8 max-w-3xl">
                  <h3 className="font-black uppercase tracking-widest text-xs text-primary mb-4">Controle de Seções</h3>
                  
                  <div className="flex items-center justify-between p-6 bg-black/20 rounded-2xl border border-white/5">
                      <div>
                          <h4 className="text-white font-bold">Seção de Planos</h4>
                          <p className="text-xs text-slate-400 mt-1">Exibir a tabela de preços na landing page</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" 
                              checked={config.sections?.plans?.visible !== false}
                              onChange={e => setConfig({ 
                                  ...config, 
                                  sections: { ...config.sections, plans: { visible: e.target.checked } } 
                              })}
                          />
                          <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-black/20 rounded-2xl border border-white/5">
                      <div>
                          <h4 className="text-white font-bold">Seção de Depoimentos</h4>
                          <p className="text-xs text-slate-400 mt-1">Exibir os depoimentos aprovados</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" 
                              checked={config.sections?.testimonials?.visible !== false}
                              onChange={e => setConfig({ 
                                  ...config, 
                                  sections: { ...config.sections, testimonials: { visible: e.target.checked } } 
                              })}
                          />
                          <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                  </div>

                  <div className="flex flex-col gap-2 p-6 bg-black/20 rounded-2xl border border-white/5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Texto de Rodapé</label>
                      <input
                          type="text"
                          className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white text-sm outline-none focus:border-primary"
                          value={config.sections?.footer?.text || ''}
                          onChange={e => setConfig({ 
                              ...config, 
                              sections: { ...config.sections, footer: { text: e.target.value } } 
                          })}
                          placeholder="© 2024 PicFest. Todos os direitos reservados."
                      />
                  </div>
               </div>
            )}

            {activeTab === 'faq' && (
               <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-black uppercase tracking-widest text-xs text-primary">Perguntas Frequentes</h3>
                      <button onClick={addFaq} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                          + Adicionar Pergunta
                      </button>
                  </div>
                  <div className="flex flex-col gap-4 max-w-4xl">
                     {config.faq?.map((item: any, idx: number) => (
                        <div key={idx} className="p-6 bg-black/20 rounded-2xl border border-white/10 flex flex-col gap-4 relative group">
                           <button 
                              onClick={() => {
                                 const newFaq = [...config.faq];
                                 newFaq.splice(idx, 1);
                                 setConfig({ ...config, faq: newFaq });
                              }}
                              className="absolute top-4 right-4 text-slate-500 hover:text-red-500 transition-colors"
                           >
                              Remover
                           </button>
                           <div className="flex flex-col gap-2 w-[90%]">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Pergunta</label>
                              <input
                                 type="text"
                                 className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-sm text-white font-bold outline-none focus:border-primary"
                                 value={item.question}
                                 onChange={e => {
                                    const newFaq = [...config.faq];
                                    newFaq[idx].question = e.target.value;
                                    setConfig({ ...config, faq: newFaq });
                                 }}
                              />
                           </div>
                           <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Resposta</label>
                              <textarea
                                 className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-slate-300 outline-none h-24 resize-none focus:border-primary"
                                 value={item.answer}
                                 onChange={e => {
                                    const newFaq = [...config.faq];
                                    newFaq[idx].answer = e.target.value;
                                    setConfig({ ...config, faq: newFaq });
                                 }}
                              />
                           </div>
                        </div>
                     ))}
                     {(!config.faq || config.faq.length === 0) && (
                         <div className="p-10 text-center text-slate-500 border border-dashed border-white/10 rounded-3xl">
                             Nenhuma pergunta frequente adicionada.
                         </div>
                     )}
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};
