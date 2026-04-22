import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';

export const AdminEmailTemplates: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [templateHtml, setTemplateHtml] = useState<string>('');
    const [templateSubject, setTemplateSubject] = useState<string>('');
    const [feedback, setFeedback] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    const showFeedback = (msg: string, type: 'success' | 'error') => {
        setFeedback({ msg, type });
        setTimeout(() => setFeedback(null), 3000);
    };

    // Busca de templates
    const { data: templates = [], isLoading: loading } = useQuery({
        queryKey: ['adminEmailTemplates'],
        queryFn: () => adminService.getEmailTemplates(),
    });

    // Mutação para salvar template
    const saveMutation = useMutation({
        mutationFn: (data: { id: string, subject: string, html_content: string }) => 
            adminService.updateEmailTemplate(data.id, data.subject, data.html_content),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminEmailTemplates'] });
            showFeedback('Template atualizado com sucesso!', 'success');
        },
        onError: () => showFeedback('Erro ao salvar template.', 'error'),
    });

    const handleSelectTemplate = (id: string) => {
        const template = templates.find(t => t.id === id);
        if (template) {
            setSelectedTemplateId(id);
            setTemplateHtml(template.html_content || '');
            setTemplateSubject(template.subject || '');
        } else {
            setSelectedTemplateId('');
            setTemplateHtml('');
            setTemplateSubject('');
        }
    };

    const handleSave = () => {
        if (!selectedTemplateId) return;
        saveMutation.mutate({
            id: selectedTemplateId,
            subject: templateSubject,
            html_content: templateHtml
        });
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-xs font-black uppercase tracking-widest text-slate-700">Carregando Templates...</div>;

    return (
        <div className="flex flex-col gap-10 animate-in fade-in duration-500">
            <header>
                <h2 className="text-3xl font-black tracking-tight uppercase flex items-center gap-3">
                    <span className="material-symbols-outlined text-4xl text-primary">mail</span>
                    Templates de E-mail
                </h2>
                <p className="text-slate-400 mt-2">Personalize o conteúdo e layout das notificações automáticas enviadas pelo sistema.</p>
            </header>

            {feedback && (
                <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-white font-bold text-sm shadow-xl flex items-center gap-2 z-50 animate-in slide-in-from-bottom-5 ${feedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    <span className="material-symbols-outlined text-sm">{feedback.type === 'success' ? 'check_circle' : 'error'}</span>
                    {feedback.msg}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lista de Templates */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Templates Disponíveis</h3>
                    <div className="flex flex-col gap-2">
                        {templates.map(t => (
                            <button
                                key={t.id}
                                onClick={() => handleSelectTemplate(t.id)}
                                className={`flex flex-col items-start gap-1 p-5 rounded-2xl border transition-all text-left ${selectedTemplateId === t.id ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                            >
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${selectedTemplateId === t.id ? 'bg-primary text-white' : 'bg-white/10 text-slate-400'}`}>
                                    {t.slug}
                                </span>
                                <span className="font-bold text-sm text-white mt-1">{t.subject}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Editor */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {selectedTemplateId ? (
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl backdrop-blur-md">
                            <div className="p-8 border-b border-white/10 flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Assunto do E-mail</label>
                                    <input
                                        type="text"
                                        className="bg-black/50 border border-white/10 rounded-xl h-12 px-6 text-white outline-none focus:border-primary transition-all text-sm font-bold"
                                        value={templateSubject}
                                        onChange={e => setTemplateSubject(e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 flex items-center justify-between">
                                        <span>Corpo do E-mail (HTML)</span>
                                        <div className="flex gap-4">
                                            <span className="text-primary font-mono lowercase text-[10px]">Variáveis: {'{{nome}}'}, {'{{evento}}'}, {'{{link}}'}</span>
                                        </div>
                                    </label>
                                    <textarea
                                        className="bg-black/50 border border-white/10 rounded-2xl p-6 text-green-400 outline-none focus:border-primary transition-all font-mono text-xs w-full min-h-[500px] resize-y"
                                        value={templateHtml}
                                        onChange={e => setTemplateHtml(e.target.value)}
                                        spellCheck="false"
                                    />
                                </div>
                            </div>
                            
                            <div className="p-8 bg-black/20 flex justify-end gap-4">
                                <button
                                    onClick={handleSave}
                                    disabled={saveMutation.isPending}
                                    className="px-10 py-4 bg-primary text-white font-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center gap-2 uppercase text-xs tracking-widest"
                                >
                                    <span className="material-symbols-outlined">save</span>
                                    Salvar Alterações
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-500 gap-4">
                            <span className="material-symbols-outlined text-6xl opacity-20">drafts</span>
                            <p className="text-sm font-medium italic">Selecione um template ao lado para editar.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
