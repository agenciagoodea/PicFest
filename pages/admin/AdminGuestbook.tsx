import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';

export const AdminGuestbook: React.FC = () => {
    const [selectedEvent, setSelectedEvent] = useState<string>('');

    // Busca todos os eventos para o dropdown
    const { data: eventos, isLoading: loadingEvents } = useQuery({
        queryKey: ['adminEvents'],
        queryFn: adminService.getAllEvents,
    });

    // Busca o guestbook do evento selecionado
    const { data: guests, isLoading: loadingGuests } = useQuery({
        queryKey: ['guestbook', selectedEvent],
        queryFn: () => adminService.getGuestbook(selectedEvent),
        enabled: !!selectedEvent,
    });

    const handleExportPDF = () => {
        if (!guests || guests.length === 0) {
            alert('Não há convidados para exportar neste evento.');
            return;
        }
        
        // Exemplo básico de exportação, pode ser substituído por jsPDF no futuro
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const htmlContent = `
            <html>
                <head>
                    <title>Livro de Assinaturas</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; }
                        h1 { text-align: center; color: #333; }
                        .guest { border-bottom: 1px solid #ccc; padding: 20px 0; display: flex; align-items: center; gap: 20px; }
                        .guest img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
                        .details h3 { margin: 0 0 5px 0; }
                        .details p { margin: 0; color: #666; }
                        .message { font-style: italic; margin-top: 10px; color: #444; }
                    </style>
                </head>
                <body>
                    <h1>Livro de Assinaturas</h1>
                    ${guests.map(g => `
                        <div class="guest">
                            ${g.foto_url ? `<img src="${g.foto_url}" />` : '<div style="width: 80px; height: 80px; border-radius: 50%; background: #eee;"></div>'}
                            <div class="details">
                                <h3>${g.nome}</h3>
                                ${g.instagram ? `<p>@${g.instagram}</p>` : ''}
                                ${g.mensagem ? `<div class="message">"${g.mensagem}"</div>` : ''}
                                <p style="font-size: 10px; margin-top: 5px;">${new Date(g.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    `).join('')}
                    <script>
                        window.onload = () => window.print();
                    </script>
                </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight uppercase">Livro de Assinaturas</h1>
                    <p className="text-slate-400 mt-2">Visualize e exporte as mensagens dos convidados.</p>
                </div>
            </header>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                <label className="text-sm font-bold text-slate-300">Selecione o Evento</label>
                {loadingEvents ? (
                    <div className="animate-pulse h-12 bg-white/10 rounded-xl w-full max-w-md"></div>
                ) : (
                    <select
                        className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white max-w-md focus:border-primary outline-none"
                        value={selectedEvent}
                        onChange={(e) => setSelectedEvent(e.target.value)}
                    >
                        <option value="" className="bg-slate-900 text-white">-- Escolha um evento --</option>
                        {eventos?.map((ev) => (
                            <option key={ev.id} value={ev.id} className="bg-slate-900 text-white">
                                {ev.nome} ({new Date(ev.data_evento).toLocaleDateString()})
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {selectedEvent && (
                <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Mensagens ({guests?.length || 0})</h2>
                        <button
                            onClick={handleExportPDF}
                            disabled={!guests || guests.length === 0}
                            className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                        >
                            Exportar Álbum PDF
                        </button>
                    </div>

                    {loadingGuests ? (
                        <div className="text-center p-10 text-slate-400 animate-pulse">Carregando convidados...</div>
                    ) : guests?.length === 0 ? (
                        <div className="text-center p-10 bg-white/5 border border-white/10 rounded-2xl text-slate-400">
                            Nenhum convidado assinou o livro deste evento ainda.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {guests?.map((guest) => (
                                <div key={guest.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-4 items-start hover:border-white/20 transition-colors">
                                    <div className="w-16 h-16 rounded-full bg-white/10 shrink-0 overflow-hidden border border-white/20">
                                        {guest.foto_url ? (
                                            <img src={guest.foto_url} alt={guest.nome} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white/50">
                                                {guest.nome.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <h3 className="font-bold text-lg text-white">{guest.nome}</h3>
                                        {guest.instagram && (
                                            <span className="text-sm text-primary">@{guest.instagram}</span>
                                        )}
                                        <p className="text-slate-300 mt-2 text-sm italic">
                                            {guest.mensagem ? `"${guest.mensagem}"` : <span className="text-slate-500">Nenhuma mensagem...</span>}
                                        </p>
                                        <span className="text-[10px] text-slate-500 mt-4 uppercase tracking-widest font-bold">
                                            {new Date(guest.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
