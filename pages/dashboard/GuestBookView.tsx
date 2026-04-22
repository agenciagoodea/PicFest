import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabaseService } from '../../services/supabaseService';

export const GuestBookView: React.FC = () => {
    const { id: eventId } = useParams();

    const { data: entries = [], isLoading } = useQuery({
        queryKey: ['guestbook', eventId],
        queryFn: () => eventId ? supabaseService.getGuestbookEntries(eventId) : [],
        enabled: !!eventId,
    });

    const exportToCSV = () => {
        if (entries.length === 0) return;
        const headers = ['Nome', 'Instagram', 'Mensagem', 'Data'];
        const rows = entries.map((e: any) => [
            e.nome,
            e.instagram || '',
            (e.mensagem || '').replace(/,/g, ' '),
            new Date(e.created_at).toLocaleDateString('pt-BR')
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(r => r.join(",")).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `guestbook-${eventId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="uppercase tracking-widest text-[10px] font-black text-slate-500">Abrindo Livro de Assinaturas...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 border-b border-white/5">
                <div>
                    <h1 className="text-4xl font-black tracking-tight italic uppercase text-white flex items-center gap-4">
                        <span className="material-symbols-outlined text-primary !text-4xl">menu_book</span>
                        Livro de Assinaturas
                    </h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                        Memórias e recados deixados pelos seus convidados
                    </p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={exportToCSV}
                        className="px-6 py-3 border border-white/10 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all text-slate-400 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Exportar Contatos (CSV)
                    </button>
                </div>
            </header>

            {entries.length === 0 ? (
                <div className="py-40 text-center flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-6xl text-slate-800 italic">edit_note</span>
                    <p className="text-slate-500 font-bold uppercase tracking-widest italic">O livro ainda está em branco.</p>
                    <p className="text-[10px] text-slate-600 uppercase font-black">As mensagens aparecem aqui conforme os convidados enviam mídias.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {entries.map((entry: any) => (
                        <div key={entry.id} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex flex-col gap-6 hover:border-primary/30 transition-all group shadow-2xl">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/5 group-hover:border-primary transition-all">
                                    <img 
                                        src={entry.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.nome)}&background=random`} 
                                        className="w-full h-full object-cover" 
                                        alt={entry.nome}
                                    />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">{entry.nome}</h3>
                                    <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-1">@{entry.instagram || 'anonimo'}</p>
                                </div>
                            </div>

                            <div className="relative">
                                <span className="material-symbols-outlined absolute -top-4 -left-4 text-white/5 !text-6xl italic -rotate-12">format_quote</span>
                                <p className="text-slate-300 text-sm italic leading-relaxed relative z-10 pl-2">
                                    {entry.mensagem || "Enviou mídias para o evento, mas não deixou recado."}
                                </p>
                            </div>

                            <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                    {new Date(entry.created_at).toLocaleDateString('pt-BR')}
                                </span>
                                <div className="flex gap-2">
                                    <button className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-sm italic">mail</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
