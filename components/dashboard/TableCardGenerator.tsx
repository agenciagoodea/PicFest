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
          @page { 
            size: A4 portrait; 
            margin: 0; 
          }
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .page-break { page-break-after: always; }
          .card-container {
            width: 210mm;
            height: 297mm;
            padding: 10mm;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 10mm;
            box-sizing: border-box;
          }
        }
        .card-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          padding: 20px;
          max-width: 1000px;
          margin: 0 auto;
        }
        .card {
          border: 1px solid #eee;
          border-radius: 30px;
          padding: 30px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: white;
          position: relative;
          min-height: 130mm;
        }
        .qr-wrapper {
          background: #f8fafc;
          padding: 20px;
          border-radius: 40px;
          margin-bottom: 20px;
          border: 1px solid #f1f5f9;
        }
      `}</style>

      <div className="no-print fixed top-0 left-0 right-0 p-6 bg-slate-900 text-white flex justify-between items-center z-50 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">print</span>
          </div>
          <div>
            <h1 className="text-xl font-black italic uppercase tracking-tighter leading-none">Cartões de Mesa</h1>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Geração automática para folha A4 (4 por página)</p>
          </div>
        </div>
        <button 
          onClick={() => window.print()}
          className="bg-primary px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
          Gerar PDF / Imprimir
        </button>
      </div>

      <div className="pt-32 no-print flex justify-center p-10 bg-slate-50">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 max-w-2xl">
           <span className="material-symbols-outlined text-orange-500 text-3xl">lightbulb</span>
           <p className="text-slate-600 text-xs font-bold uppercase tracking-wide leading-relaxed">
             Dica Profissional: Na janela de impressão, selecione o destino <span className="text-primary font-black">"Salvar como PDF"</span> e em Mais Definições, ative <span className="text-primary font-black">"Gráficos de Segundo Plano"</span> para garantir o melhor resultado visual.
           </p>
        </div>
      </div>

      <div className="card-container">
        {cards.map((_, i) => (
          <div key={i} className="card shadow-xl print:shadow-none print:border-slate-200">
            {/* Header com Logo */}
            <div className="flex flex-col items-center mb-6">
              {config.showLogo && (event.logo_url ? (
                <img src={event.logo_url} className="w-24 h-24 object-contain mb-4 rounded-2xl" alt="Logo" />
              ) : (
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                  <span className="material-symbols-outlined text-3xl">photo_camera</span>
                </div>
              ))}
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-tight">{event.nome}</h2>
              <div className="h-1 w-12 bg-primary/20 rounded-full mt-3"></div>
            </div>

            {/* QR Code Section */}
            <div className="qr-wrapper">
              <img src={qrUrl} className="w-40 h-40" alt="QR Code" />
            </div>

            {/* Mensagem Personalizada */}
            <p className="text-lg font-black tracking-tight leading-snug text-slate-800 whitespace-pre-wrap max-w-[280px] px-4">
              {config.message || "Escaneie e compartilhe suas memórias deste momento!"}
            </p>

            {/* Footer do Cartão */}
            <div className="mt-8 pt-6 border-t border-slate-100 w-full flex flex-col items-center gap-2">
               <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-1">Live Experience</p>
               <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                 <span className="material-symbols-outlined text-[10px] text-slate-400 italic">tab_unselected</span>
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mesa {i + 1}</span>
               </div>
               <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mt-3">Exclusivo PicFest • picfest.com.br</p>
            </div>
            
            {/* Marcador de página para o PDF (a cada 4 cartões) */}
            {(i + 1) % 4 === 0 && <div className="page-break"></div>}
          </div>
        ))}
      </div>
    </div>
  );
};
