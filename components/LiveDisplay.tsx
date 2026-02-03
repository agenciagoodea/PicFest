
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { Midia } from '../types';

export const LiveDisplay: React.FC = () => {
  const { slug } = useParams();
  const [media, setMedia] = useState<Midia[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Carregar mídias aprovadas iniciais
    supabaseService.getMediaByEvent('1', true).then(setMedia);

    // Inscrição Realtime
    const unsubscribe = supabaseService.subscribeToMedia('1', (newMidia) => {
      setMedia(prev => [newMidia, ...prev]);
    });

    return () => unsubscribe();
  }, [slug]);

  useEffect(() => {
    if (media.length === 0) return;

    const currentMedia = media[currentIndex];
    let timeoutId: number;

    if (currentMedia.tipo === 'video') {
      // Para vídeos, esperamos o vídeo acabar ou um tempo máximo
      // Nota: Em uma implementação real, usaríamos o evento onEnded do vídeo
    } else {
      timeoutId = window.setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % media.length);
      }, 8000); // 8 segundos para fotos
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentIndex, media]);

  const handleVideoEnded = () => {
    setCurrentIndex(prev => (prev + 1) % media.length);
  };

  const current = media[currentIndex];

  if (media.length === 0) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center gap-6 overflow-hidden">
         <div className="relative">
            <span className="material-symbols-outlined !text-8xl text-primary animate-pulse opacity-50">auto_awesome_motion</span>
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
         </div>
         <div className="text-center relative z-10">
            <h1 className="text-3xl font-black tracking-tighter text-white/90 uppercase italic">Aguardando Capturas...</h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 text-sm">O evento começará em instantes</p>
         </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative group">
      {/* Background Dinâmico (Blur Profundo) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
         <div className="absolute inset-0 bg-black/60 z-10"></div>
         {current.tipo === 'video' ? (
           <video 
             src={current.url} 
             className="w-full h-full object-cover opacity-40 blur-[100px] scale-110" 
             muted 
             autoPlay 
             loop 
           />
         ) : (
           <img 
             src={current.url} 
             className="w-full h-full object-cover opacity-40 blur-[100px] scale-110 animate-kenburns" 
             key={`bg-${current.id}`}
           />
         )}
      </div>

      {/* Container de Mídia Principal (Imersivo) */}
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        <div className="w-full h-full flex items-center justify-center relative px-4 md:px-0">
          
          {/* Mídia Principal com Respeito ao Aspect Ratio */}
          <div className="relative h-full w-full max-w-[95vw] max-h-[95vh] flex items-center justify-center overflow-hidden">
             {current.tipo === 'video' ? (
               <video
                 ref={videoRef}
                 src={current.url}
                 className="max-w-full max-h-full object-contain shadow-[0_0_80px_rgba(0,0,0,0.8)] rounded-lg"
                 autoPlay
                 muted={false} // Ativar som se desejado
                 onEnded={handleVideoEnded}
                 key={`vid-${current.id}`}
               />
             ) : (
               <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                 <img
                   src={current.url}
                   className="max-w-full max-h-full object-contain shadow-[0_0_80px_rgba(0,0,0,0.8)] rounded-lg animate-kenburns"
                   key={`img-${current.id}`}
                 />
               </div>
             )}
          </div>

          {/* Overlay flutuante de Informação do Convidado */}
          <div className="absolute bottom-10 left-10 flex items-center gap-6 animate-in slide-in-from-left-10 duration-700">
             <div className="relative">
                <img 
                  src={current.perfil?.foto_perfil || `https://picsum.photos/seed/${current.perfil?.nome}/100`} 
                  className="w-24 h-24 rounded-[2rem] border-4 border-primary shadow-2xl object-cover" 
                />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white border-4 border-black">
                   <span className="material-symbols-outlined !text-xl">favorite</span>
                </div>
             </div>
             <div className="bg-black/30 backdrop-blur-3xl border border-white/10 p-6 rounded-[2rem] shadow-2xl min-w-[300px]">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Momentos de</p>
                <h3 className="text-3xl font-black text-white leading-none">{current.perfil?.nome}</h3>
                {current.legenda && (
                  <p className="text-xl italic text-slate-200 mt-3 font-medium opacity-90 leading-relaxed border-l-2 border-primary/50 pl-4 uppercase tracking-tighter">
                    "{current.legenda}"
                  </p>
                )}
             </div>
          </div>

          {/* QR Code de Engajamento (Top Right) */}
          <div className="absolute top-10 right-10 flex flex-col items-end gap-4 animate-in slide-in-from-right-10 duration-700">
             <div className="bg-white p-3 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-primary/20 group hover:scale-105 transition-transform">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://picfest.io/evento/${slug}&color=000000&bgcolor=ffffff`} 
                  className="w-32 h-32 md:w-44 md:h-44" 
                />
                <div className="mt-3 text-center">
                   <p className="text-[10px] font-black text-black uppercase tracking-widest">Escaneie para enviar</p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-xs font-black text-primary uppercase tracking-[0.3em] drop-shadow-lg">Tech Gala 2024</p>
                <p className="text-sm font-mono font-bold text-white/50 tracking-tighter">picfest.io/{slug}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Progress Bar na base */}
      {current.tipo === 'foto' && (
        <div className="absolute bottom-0 left-0 h-1.5 bg-white/5 w-full z-50 overflow-hidden">
           <div 
             key={`progress-${currentIndex}`} 
             className="h-full bg-primary shadow-[0_0_20px_rgba(19,182,236,1)] transition-all ease-linear" 
             style={{ animation: 'liveProgress 8s linear forwards' }} 
           />
        </div>
      )}

      <footer className="absolute bottom-4 right-4 z-50 text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
        PICFEST LIVE • BETA V1.0
      </footer>

      <style>{`
        @keyframes liveProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
        
        @keyframes kenburns {
          0% {
            transform: scale(1) translate(0, 0);
          }
          50% {
            transform: scale(1.1) translate(-1%, 1%);
          }
          100% {
            transform: scale(1.05) translate(0, 0);
          }
        }

        .animate-kenburns {
          animation: kenburns 20s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  );
};
