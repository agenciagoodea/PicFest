import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '../../services/supabaseService';
import { Evento } from '../../types';

export const ShowcaseEditorView: React.FC = () => {
    const { id } = useParams();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Busca do evento
    const { data: event, isLoading } = useQuery({
        queryKey: ['event', id],
        queryFn: () => id ? supabaseService.getEventWithPlan(id) : null,
        enabled: !!id,
    });

    const [config, setConfig] = useState<any>({
        primaryColor: '#ff3366',
        welcomeTitle: 'Bem-vindo ao nosso evento!',
        welcomeSubtitle: 'Compartilhe suas memórias em tempo real.',
        showGuestbook: true,
        theme: 'dark'
    });

    useEffect(() => {
        if (event?.showcase_config) {
            setConfig({
                ...config,
                ...event.showcase_config
            });
        }
    }, [event]);

    const updateShowcaseMutation = useMutation({
        mutationFn: (newConfig: any) => id ? supabaseService.updateEventShowcase(id, newConfig) : Promise.resolve(null),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['event', id] });
            alert('Vitrine personalizada com sucesso!');
        },
        onError: (err: any) => alert('Erro ao salvar: ' + err.message)
    });

    const handleSave = () => {
        updateShowcaseMutation.mutate(config);
    };

    if (isLoading) return (
        <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="uppercase tracking-widest text-[10px] font-black text-slate-500">Abrindo ateliê de design...</p>
        </div>
    );

    return (
        <div className="flex flex-col gap-10 animate-in fade-in duration-500 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 border-b border-white/5">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link to={`/dashboard/eventos/${id}`} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                        </Link>
                        <h1 className="text-4xl font-black tracking-tight italic uppercase text-white flex items-center gap-4">
                            <span className="material-symbols-outlined text-primary !text-4xl">palette</span>
                            Editor de Vitrine
                        </h1>
                    </div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                        Personalize a primeira impressão dos seus convidados
                    </p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={handleSave}
                        disabled={updateShowcaseMutation.isPending}
                        className="px-8 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {updateShowcaseMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* CONFIGURAÇÕES */}
                <div className="flex flex-col gap-8">
                    <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex flex-col gap-6">
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Cores e Identidade</h3>
                        
                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Cor de Destaque (Botões e Destaques)</label>
                            <div className="flex items-center gap-4">
                                <input 
                                    type="color" 
                                    value={config.primaryColor}
                                    onChange={e => setConfig({...config, primaryColor: e.target.value})}
                                    className="w-16 h-16 rounded-2xl bg-transparent border-0 cursor-pointer"
                                />
                                <input 
                                    type="text" 
                                    value={config.primaryColor}
                                    onChange={e => setConfig({...config, primaryColor: e.target.value})}
                                    className="bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white font-mono uppercase text-sm flex-1"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Tema de Fundo</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setConfig({...config, theme: 'dark'})}
                                    className={`h-14 rounded-2xl border flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all ${config.theme === 'dark' ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 text-slate-500'}`}
                                >
                                    <span className="material-symbols-outlined text-sm">dark_mode</span> Escuro
                                </button>
                                <button 
                                    onClick={() => setConfig({...config, theme: 'light'})}
                                    className={`h-14 rounded-2xl border flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all ${config.theme === 'light' ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 text-slate-500'}`}
                                >
                                    <span className="material-symbols-outlined text-sm">light_mode</span> Claro
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex flex-col gap-6">
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Textos de Boas-Vindas</h3>
                        
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Título Principal</label>
                            <input 
                                type="text"
                                value={config.welcomeTitle}
                                onChange={e => setConfig({...config, welcomeTitle: e.target.value})}
                                className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white text-lg outline-none focus:border-primary transition-all"
                                placeholder="Ex: Bem-vindo ao Casamento de Maria & João!"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Subtítulo / Descrição</label>
                            <textarea 
                                value={config.welcomeSubtitle}
                                onChange={e => setConfig({...config, welcomeSubtitle: e.target.value})}
                                className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-sm outline-none focus:border-primary transition-all h-28 resize-none"
                                placeholder="Ex: Compartilhe suas fotos e apareça no telão agora mesmo."
                            />
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex flex-col gap-6">
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Módulos Extras</h3>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">menu_book</span>
                                <span className="text-sm font-bold text-slate-300">Exibir Livro de Assinaturas</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={config.showGuestbook}
                                onChange={e => setConfig({ ...config, showGuestbook: e.target.checked })}
                                className="w-5 h-5 rounded bg-white/10 border-white/10 text-primary focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>

                {/* PREVIEW */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest pl-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs">smartphone</span> Live Preview
                    </h3>
                    <div className={`w-full aspect-[9/19] max-w-[340px] mx-auto border-[12px] border-slate-800 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col ${config.theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#0f172a] text-white'}`}>
                        {/* Status bar mock */}
                        <div className="h-10 flex justify-between items-center px-8 pt-4 pb-2 opacity-50">
                            <span className="text-[10px] font-bold">12:30</span>
                            <div className="flex gap-1 items-center">
                                <span className="material-symbols-outlined text-xs">wifi</span>
                                <span className="material-symbols-outlined text-xs">battery_full</span>
                            </div>
                        </div>

                        {/* Content Mock */}
                        <div className="flex-1 flex flex-col items-center p-8 text-center gap-8">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: config.primaryColor }}>
                                <span className="material-symbols-outlined text-white text-3xl italic">auto_awesome_motion</span>
                            </div>

                            <div>
                                <h4 className="text-2xl font-black leading-tight uppercase italic">{config.welcomeTitle}</h4>
                                <p className={`text-xs mt-3 font-medium opacity-60 leading-relaxed`}>{config.welcomeSubtitle}</p>
                            </div>

                            <div className="w-full flex flex-col gap-4 mt-4">
                                <div 
                                    className="h-16 rounded-2xl flex items-center justify-center font-black uppercase text-[10px] tracking-widest shadow-xl"
                                    style={{ backgroundColor: config.primaryColor, color: '#fff' }}
                                >
                                    Enviar Foto ou Vídeo
                                </div>
                                {config.showGuestbook && (
                                    <div className={`h-12 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[9px] tracking-widest border border-slate-200/20 bg-slate-400/10`}>
                                        <span className="material-symbols-outlined text-sm">menu_book</span>
                                        Livro de Assinaturas
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto opacity-20 text-[8px] font-black uppercase tracking-widest">Powered by PicFest</div>
                        </div>
                    </div>
                    <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-2 italic">Aparência que o seu convidado verá ao escanear o QR Code.</p>
                </div>
            </div>
        </div>
    );
};
