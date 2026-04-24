import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const primaryColor = event.showcase_config?.primaryColor || '#EE3524';

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(window.location.origin + '/#/evento/' + event.slug_curto)}&color=000000&bgcolor=ffffff&margin=0`;

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pages = pagesRef.current.filter(p => p !== null);

      // Pequena pausa para garantir que os QR Codes e Logos (que são externos) terminaram de renderizar
      await new Promise(resolve => setTimeout(resolve, 800));

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (!page) continue;

        const canvas = await html2canvas(page, {
          scale: 2.5, // Aumentando escala para 2.5x para máxima nitidez na impressão
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: true
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);

        if (i > 0) pdf.addPage();

        // A4 Paisagem: 297 x 210mm
        pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
      }

      pdf.save(`cartoes-mesa-${event.slug_curto}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Ocorreu um erro ao gerar o PDF. Verifique sua conexão e tente novamente.');
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
          width: 297mm;
          height: 210mm;
          padding: 15mm;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12mm;
          box-sizing: border-box;
          background: white;
          margin-bottom: 30px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
          overflow: hidden;
          position: relative;
        }
        .card {
          width: 82mm;
          height: 180mm;
          border: 1px solid #e2e8f0;
          border-radius: 45px;
          padding: 35px 25px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          background: white;
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
          box-shadow: inset 0 0 40px rgba(0,0,0,0.02);
        }
        .logo-area { height: 90px; display: flex; align-items: center; justify-content: center; width: 100%; }
        .title-area { min-height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; }
        .qrcode-area { height: 180px; display: flex; align-items: center; justify-content: center; width: 100%; }
        .message-area { min-height: 80px; display: flex; align-items: center; justify-content: center; width: 100%; }
        .table-area { height: 110px; display: flex; align-items: center; justify-content: center; width: 100%; }
        .footer-area { height: 30px; display: flex; align-items: center; justify-content: center; width: 100%; }
        
        .qr-wrapper {
          background: transparent;
          padding: 10px;
          border-radius: 35px;
          border: none;
          box-shadow: none;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 160px;
          height: 160px;
        }
        .premium-border {
          position: absolute;
          inset: 12px;
          border: 1px solid rgba(0,0,0,0.03);
          border-radius: 35px;
          pointer-events: none;
        }
      `}</style>

      {/* OVERLAY DE CARREGAMENTO */}
      {isGenerating && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-black uppercase italic tracking-widest animate-pulse">Renderizando Material Premium...</h2>
          <p className="text-slate-400 mt-2 font-bold uppercase text-[10px] tracking-widest">Processando em alta definição para impressão.</p>
        </div>
      )}

      <div className="no-print fixed top-0 left-0 right-0 p-6 bg-slate-900 text-white flex justify-between items-center z-[100] border-b border-white/5 shadow-2xl">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate(`/dashboard/eventos/${event.id}`)}
            className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            title="Voltar para Gerenciamento"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex items-center gap-4 border-l border-white/10 pl-6">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">print</span>
            </div>
            <div>
              <h1 className="text-xl font-black italic uppercase tracking-tighter leading-none">Cartões de Mesa</h1>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Layout Paisagem • 3 por página A4</p>
            </div>
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
        <div className="no-print flex justify-center w-full max-w-5xl px-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex items-center gap-6 w-full">
            <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 flex-shrink-0">
              <span className="material-symbols-outlined text-3xl">landscape</span>
            </div>
            <div className="flex-1">
              <p className="text-slate-900 text-sm font-black uppercase tracking-tight">Otimizado para Paisagem (Landscape)</p>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 leading-relaxed">
                Agora com <span className="text-primary font-black">3 cartões por folha</span>. Este formato garante que nada seja cortado e oferece a melhor legibilidade para o QR Code. <br />
                A logo do evento e a cor da vitrine são aplicadas automaticamente.
              </p>
            </div>
            <div className="flex gap-2">
              <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase">Mesa 1 a {config.quantity}</div>
              <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase">{Math.ceil(config.quantity / 3)} Págs</div>
            </div>
          </div>
        </div>

        {/* CONTAINER DAS PÁGINAS */}
        <div className="flex flex-col items-center">
          {Array.from({ length: Math.ceil(config.quantity / 3) }).map((_, pageIndex) => (
            <div
              key={pageIndex}
              ref={el => pagesRef.current[pageIndex] = el}
              className="a4-page"
            >
              {Array.from({ length: 3 }).map((_, cardIndex) => {
                const actualIndex = pageIndex * 3 + cardIndex;
                if (actualIndex >= config.quantity) return <div key={cardIndex} className="invisible" />;
                return (
                  <div key={cardIndex} className="card">
                    {/* Elementos Decorativos Premium */}
                    <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: primaryColor }}></div>
                    <div className="premium-border"></div>
                    
                    {/* 1. Área da Logo */}
                    <div className="logo-area">
                      {config.showLogo && (event.logo_url ? (
                        <img 
                          src={event.logo_url} 
                          className="max-h-[85px] w-auto object-contain" 
                          alt="Logo" 
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-100 bg-slate-50 border border-slate-100">
                          <span className="material-symbols-outlined text-3xl">photo_camera</span>
                        </div>
                      ))}
                    </div>

                    {/* 2. Área do Título */}
                    <div className="title-area">
                      <h2 
                        className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none mb-1"
                        style={{ letterSpacing: '-0.02em' }}
                      >
                        {event.nome}
                      </h2>
                      <div className="flex items-center gap-2">
                        <div className="h-[1px] w-4 bg-slate-200"></div>
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">PicFest Experience</span>
                        <div className="h-[1px] w-4 bg-slate-200"></div>
                      </div>
                    </div>

                    {/* 3. Área do QR Code */}
                    <div className="qrcode-area">
                      <div className="qr-wrapper">
                        <img src={qrUrl} className="w-[130px] h-[130px]" alt="QR Code" crossOrigin="anonymous" />
                      </div>
                    </div>

                    {/* 4. Área da Mensagem */}
                    <div className="message-area px-4">
                      <p className="text-[12px] font-bold tracking-tight leading-relaxed text-slate-600 italic">
                        "{config.message || "Escaneie para capturar e compartilhar as memórias de hoje!"}"
                      </p>
                    </div>

                    {/* 5. Área da Mesa */}
                    <div className="table-area">
                       <div className="flex flex-col items-center">
                         <div className="mb-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                            <span className="text-[9px] font-black uppercase tracking-[0.4em]" style={{ color: primaryColor }}>Sua Mesa</span>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                         </div>
                         <div 
                           className="w-[82px] h-[82px] rounded-full border-[3px] flex items-center justify-center shadow-lg shadow-black/5 relative" 
                           style={{ 
                             borderColor: primaryColor, 
                             backgroundColor: 'transparent',
                           }}
                         >
                            <span className="text-5xl font-black tracking-tighter absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center m-0 p-0 leading-none h-auto w-auto mt-0.5" style={{ color: primaryColor }}>{actualIndex + 1}</span>
                         </div>
                       </div>
                    </div>

                    {/* 6. Área do Rodapé */}
                    <div className="footer-area">
                       <div className="flex flex-col items-center gap-1 opacity-30">
                          <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Aponte a câmera do seu celular</p>
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
