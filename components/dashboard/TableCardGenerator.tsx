import React, { useState, useRef } from 'react';
import { Evento } from '../../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface TableCardGeneratorProps {
  event: Evento;
  config: {
    message: string;
    showLogo: boolean;
    quantity: number;
  };
}

export const TableCardGenerator: React.FC<TableCardGeneratorProps> = ({ event, config }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const pagesRef = useRef<(HTMLDivElement | null)[]>([]);
  const primaryColor = event.showcase_config?.primaryColor || '#EE3524';
  
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(window.location.origin + '/#/evento/' + event.slug_curto)}&color=000000&bgcolor=ffffff`;

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pages = pagesRef.current.filter(p => p !== null);

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (!page) continue;

        // Captura a página com alta escala para qualidade de impressão
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        if (i > 0) pdf.addPage();
        
        // A4 é 210 x 297mm
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

      pdf.save(`cartoes-mesa-${event.slug_curto}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Ocorreu um erro ao gerar o PDF. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen p-0 m-0 text-black font-sans">
      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
        .a4-page {
          width: 210mm;
          height: 297mm;
          padding: 10mm;
          display: grid;
          grid-template-columns: 90mm 90mm;
          grid-template-rows: 133mm 133mm;
          gap: 10mm;
          box-sizing: border-box;
          background: white;
          margin-bottom: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .card {
          width: 90mm;
          height: 133mm;
          border: 2px solid #f1f5f9;
          border-radius: 40px;
          padding: 25px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          background: white;
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
        }
        .qr-wrapper {
          background: #ffffff;
          padding: 15px;
          border-radius: 35px;
          margin-bottom: 20px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
      `}</style>

      {/* OVERLAY DE CARREGAMENTO */}
      {isGenerating && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-black uppercase italic tracking-widest">Gerando PDF Profissional...</h2>
          <p className="text-slate-400 mt-2 font-bold uppercase text-[10px] tracking-widest">Isso pode levar alguns segundos dependendo da quantidade de mesas.</p>
        </div>
      )}

      <div className="no-print fixed top-0 left-0 right-0 p-6 bg-slate-900 text-white flex justify-between items-center z-[100] border-b border-white/5 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">print</span>
          </div>
          <div>
            <h1 className="text-xl font-black italic uppercase tracking-tighter leading-none">Cartões de Mesa</h1>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Layout Premium • 4 por página A4</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={generatePDF}
            disabled={isGenerating}
            className="bg-primary px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Baixar PDF para Impressão
          </button>
        </div>
      </div>

      {/* Visualização do Material */}
      <div className="pt-32 pb-20 flex flex-col items-center gap-10">
        <div className="no-print flex justify-center w-full max-w-4xl">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex items-center gap-6">
             <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 flex-shrink-0">
               <span className="material-symbols-outlined text-3xl">print_connect</span>
             </div>
             <div>
                <p className="text-slate-900 text-sm font-black uppercase tracking-tight">Pronto para Imprimir</p>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 leading-relaxed">
                  O arquivo gerado já está formatado em <span className="text-primary font-black">A4</span> com margens de segurança. <br/>
                  Recomendamos papel de gramatura superior (180g ou +) para melhor estabilidade na mesa.
                </p>
             </div>
          </div>
        </div>

        {/* CONTAINER DAS PÁGINAS */}
        <div className="flex flex-col items-center">
          {Array.from({ length: Math.ceil(config.quantity / 4) }).map((_, pageIndex) => (
            <div 
              key={pageIndex} 
              ref={el => pagesRef.current[pageIndex] = el}
              className="a4-page"
            >
              {Array.from({ length: 4 }).map((_, cardIndex) => {
                const actualIndex = pageIndex * 4 + cardIndex;
                if (actualIndex >= config.quantity) return <div key={cardIndex} className="invisible" />;
                
                return (
                  <div key={cardIndex} className="card">
                    {/* Background decorativo com a cor do evento */}
                    <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: primaryColor }}></div>
                    
                    {/* Header com Logo */}
                    <div className="flex flex-col items-center w-full">
                      {config.showLogo && (event.logo_url ? (
                        <img 
                          src={event.logo_url} 
                          className="w-20 h-20 object-contain mb-4 rounded-2xl shadow-sm" 
                          alt="Logo" 
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-200 mb-4 border border-slate-100">
                          <span className="material-symbols-outlined text-2xl">photo_camera</span>
                        </div>
                      ))}
                      <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-tight w-full truncate px-2">{event.nome}</h2>
                      <div className="h-1 w-8 rounded-full mt-2" style={{ backgroundColor: primaryColor + '40' }}></div>
                    </div>

                    {/* QR Code Section */}
                    <div className="qr-wrapper">
                      <img src={qrUrl} className="w-36 h-36" alt="QR Code" crossOrigin="anonymous" />
                    </div>

                    {/* Mensagem Personalizada */}
                    <p className="text-sm font-black tracking-tight leading-snug text-slate-600 whitespace-pre-wrap max-w-[240px] px-2 mb-6">
                      {config.message || "Escaneie e compartilhe suas memórias deste momento!"}
                    </p>

                    {/* Mesa em Destaque */}
                    <div className="mt-auto w-full">
                       <div className="flex flex-col items-center">
                         <span className="text-[8px] font-black uppercase tracking-[0.4em] mb-2" style={{ color: primaryColor }}>Sua Mesa</span>
                         <div className="px-8 py-3 rounded-2xl border-2 flex items-center justify-center min-w-[120px]" style={{ borderColor: primaryColor, backgroundColor: primaryColor + '05' }}>
                            <span className="text-3xl font-black tracking-tighter" style={{ color: primaryColor }}>{actualIndex + 1}</span>
                         </div>
                       </div>
                       
                       <div className="mt-6 flex flex-col items-center gap-1 opacity-40">
                          <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Escaneie para participar</p>
                          <p className="text-[6px] font-black text-slate-300 uppercase tracking-widest">PicFest Experience • picfest.com.br</p>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
