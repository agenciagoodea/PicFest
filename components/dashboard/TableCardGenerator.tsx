import React from 'react';
import { Evento } from '../types';

interface TableCardGeneratorProps {
  event: Evento;
  config: {
    message: string;
    showLogo: boolean;
    quantity: number;
  };
}

export const TableCardGenerator: React.FC<TableCardGeneratorProps> = ({ event, config }) => {
  const cards = Array.from({ length: config.quantity });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/#/evento/' + event.slug_curto)}&color=000000&bgcolor=ffffff`;

  return (
    <div className="bg-white min-h-screen p-0 m-0 text-black font-sans print:p-0">
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          .no-print { display: none; }
          .page-break { page-break-after: always; }
        }
        .card-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          padding: 20px;
        }
        .card {
          border: 1px solid #eee;
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: white;
        }
      `}</style>

      <div className="no-print fixed top-0 left-0 right-0 p-6 bg-slate-900 text-white flex justify-between items-center z-50">
        <div>
          <h1 className="text-xl font-black italic uppercase tracking-tighter">Gerador de Materiais</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Imprima seus cartões de mesa profissionais</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="bg-primary px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
        >
          Imprimir Agora
        </button>
      </div>

      <div className="pt-24 no-print flex justify-center p-10 bg-slate-100">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest bg-white px-6 py-3 rounded-full shadow-sm">💡 Dica: Na janela de impressão, ative "Gráficos de Segundo Plano" para ver as cores.</p>
      </div>

      <div className="card-container">
        {cards.map((_, i) => (
          <div key={i} className="card shadow-sm border-slate-100">
            {config.showLogo && event.logo_url && (
              <img src={event.logo_url} className="w-20 h-20 object-contain mb-6 rounded-xl" />
            )}
            
            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">{event.nome}</h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-8">Live Experience by PicFest</p>

            <div className="bg-slate-50 p-6 rounded-[2.5rem] mb-8 border border-slate-100">
              <img src={qrUrl} className="w-48 h-48" alt="QR Code" />
            </div>

            <p className="text-xl font-black tracking-tight leading-relaxed text-slate-800 whitespace-pre-wrap max-w-[280px]">
              {config.message || "Escaneie e compartilhe suas memórias deste momento!"}
            </p>

            <div className="mt-10 pt-8 border-t border-slate-100 w-full flex flex-col items-center gap-2">
               <div className="flex items-center gap-2">
                 <span className="material-symbols-outlined text-sm text-slate-300 italic">auto_awesome_motion</span>
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Mesa {i + 1}</span>
               </div>
               <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-2">picfest.com.br</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
