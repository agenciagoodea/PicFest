
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../services/supabaseClient';
import { useRealtimeMedia } from '../hooks/useRealtimeMedia';
import { Evento } from '../types';

export const LiveDisplay: React.FC = () => {
  const { slug } = useParams();
  const [event, setEvent] = useState<Evento | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Usar hook de realtime para mídias
  const { media, loading: mediaLoading } = useRealtimeMedia(event?.id || '', true);
  
  // Referência para controlar qual foi a última mídia exibida para detectar novidades
  const lastMediaCount = useRef(0);
  const priorityQueue = useRef<string[]>([]);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!slug) return;

    const fetchEvent = async () => {
      let ev = await supabaseService.getEventBySlug(slug);

      if (!ev && slug.length > 20) {
        const { data } = await supabase.from('eventos').select('*').eq('id', slug).maybeSingle();
        if (data) ev = data as Evento;
      }

      if (ev) {
        setEvent(ev);
      }
    };

    fetchEvent();
  }, [slug]);

  // Efeito para detectar novas mídias sem interromper a atual
  useEffect(() => {
    if (media.length > 0 && !mediaLoading) {
      if (isFirstLoad.current) {
        lastMediaCount.current = media.length;
        isFirstLoad.current = false;
        return;
      }

      // Se o número de mídias aumentou, temos novidades
      if (media.length > lastMediaCount.current) {
        const newItemsCount = media.length - lastMediaCount.current;
        // Pega os N primeiros itens (que são os mais novos) e coloca na fila de prioridade
        const newIds = media.slice(0, newItemsCount).map(m => m.id);
        
        // Evitar duplicatas na fila
        const filteredNewIds = newIds.filter(id => !priorityQueue.current.includes(id));
        priorityQueue.current = [...priorityQueue.current, ...filteredNewIds];
        
        console.log(`🚀 [Telão] ${filteredNewIds.length} nova(s) mídia(s) na fila de prioridade.`);
        lastMediaCount.current = media.length;
      }
    }
  }, [media, mediaLoading]);

  const goToNextMedia = () => {
    if (media.length === 0) return;

    // Se houver mídias na fila de prioridade, vamos para a primeira dela
    if (priorityQueue.current.length > 0) {
      const nextId = priorityQueue.current.shift();
      const nextIndex = media.findIndex(m => m.id === nextId);
      if (nextIndex !== -1) {
        console.log('✨ [Telão] Exibindo nova mídia da fila de prioridade.');
        setCurrentIndex(nextIndex);
        return;
      }
    }

    // Fluxo normal de loop
    setCurrentIndex(prev => (prev + 1) % media.length);
  };

  useEffect(() => {
    if (media.length === 0) return;

    const currentMedia = media[currentIndex];
    let timeoutId: number;

    if (currentMedia.tipo === 'foto') {
      timeoutId = window.setTimeout(() => {
        goToNextMedia();
      }, 8000); 
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentIndex, media]);

  // Pre-loading das próximas mídias
  useEffect(() => {
    if (media.length === 0) return;
    const nextIndex = (currentIndex + 1) % media.length;
    const nextItem = media[nextIndex];
    if (nextItem) {
      if (nextItem.tipo === 'foto') {
        const img = new Image();
        img.src = nextItem.url;
      } else {
        const video = document.createElement('video');
        video.src = nextItem.url;
        video.preload = 'auto';
      }
    }
  }, [currentIndex, media]);

  const handleVideoEnded = () => {
    goToNextMedia();
  };

  if (!event || media.length === 0) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center gap-10 overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full animate-pulse"></div>
          <div className="w-32 h-32 bg-primary/10 rounded-[3rem] border-2 border-primary/20 flex items-center justify-center relative z-10 animate-bounce-slow">
            <span className="material-symbols-outlined !text-6xl text-primary italic">auto_awesome_motion</span>
          </div>
        </div>
        <div className="text-center relative z-10">
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none mb-4">
            {event?.nome || 'Iniciando Experiência...'}
          </h1>
          <div className="flex items-center justify-center gap-4">
             <div className="h-px w-12 bg-white/10"></div>
             <p className="text-primary font-black uppercase tracking-[0.5em] text-[10px]">Aguardando Capturas</p>
             <div className="h-px w-12 bg-white/10"></div>
          </div>
        </div>
        
        {/* Connection Badge */}
        <div className="absolute bottom-12 flex items-center gap-3 bg-white/5 border border-white/5 px-6 py-3 rounded-2xl backdrop-blur-xl">
           <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Realtime Engine Connected</span>
        </div>
      </div>
    );
  }
  const current = media[currentIndex];

  // Calcular próximas 5 mídias para a fila
  const nextUpQueue = media.length > 0
    ? Array.from({ length: 5 }).map((_, i) => media[(currentIndex + 1 + i) % media.length])
    : [];

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
            key={`vid-bg-${current.id}`}
          />
        ) : (
          <img
            src={current.url}
            className="w-full h-full object-cover opacity-40 blur-[100px] scale-110 animate-kenburns"
            key={`img-bg-${current.id}`}
          />
        )}
      </div>

      {/* Container de Mídia Principal (Imersivo) */}
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        <div className="w-full h-full flex items-center justify-center relative px-4 md:px-0">

          {/* Mídia Principal com Respeito ao Aspect Ratio e Sem Distorção */}
          <div className="relative h-full w-full flex items-center justify-center">
            {current.tipo === 'video' ? (
              <video
                ref={videoRef}
                src={current.url}
                className="max-w-[90vw] max-h-[85vh] object-contain shadow-[0_50px_100px_rgba(0,0,0,0.9)] rounded-[2.5rem] border border-white/10"
                autoPlay
                muted={false}
                onEnded={handleVideoEnded}
                key={`vid-main-${current.id}`}
                playsInline
              />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center p-4">
                <img
                  src={current.url}
                  className="max-w-[90vw] max-h-[85vh] object-contain shadow-[0_50px_100px_rgba(0,0,0,0.9)] rounded-[2.5rem] border border-white/10 animate-kenburns"
                  key={`img-main-${current.id}`}
                  loading="eager"
                />
              </div>
            )}
          </div>

          {/* Overlay flutuante de Informação do Convidado - PREMIUM UPGRADE */}
          <div className="absolute bottom-12 left-12 flex items-center gap-8 animate-in slide-in-from-left-12 duration-1000 ease-out">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <img
                src={current.perfil?.foto_perfil || `https://picsum.photos/seed/${current.perfil?.nome}/100`}
                className="w-28 h-28 rounded-[2.5rem] border-4 border-primary shadow-2xl object-cover relative z-10"
              />
              <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white border-4 border-black z-20 shadow-xl">
                <span className="material-symbols-outlined !text-2xl italic">auto_awesome</span>
              </div>
            </div>
            <div className="bg-black/40 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] shadow-2xl min-w-[350px]">
              <div className="flex items-center gap-3 mb-2">
                 <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Enviado por</span>
                 <div className="h-px w-8 bg-primary/30"></div>
              </div>
              <h3 className="text-4xl font-black text-white leading-none italic uppercase tracking-tighter">{current.perfil?.nome || 'Convidado'}</h3>
              {current.legenda && (
                <p className="text-2xl italic text-slate-200 mt-5 font-medium opacity-95 leading-relaxed border-l-4 border-primary pl-6 uppercase tracking-tighter max-w-[400px]">
                  "{current.legenda}"
                </p>
              )}
            </div>
          </div>

          {/* Fila de Próximas Fotos (Bottom Right) */}
          <div className="absolute bottom-12 right-12 flex flex-col items-end gap-3 animate-in slide-in-from-right-12 duration-1000 ease-out">
            <div className="flex items-center gap-4 mb-2">
               <div className="h-px w-8 bg-white/10"></div>
               <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">A Seguir</p>
            </div>
            <div className="flex items-center gap-4">
              {nextUpQueue.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="w-20 h-28 rounded-2xl border-2 border-white/10 overflow-hidden relative shadow-2xl bg-black/50 group hover:scale-110 transition-transform duration-500">
                  {item.tipo === 'video' ? (
                    <video src={item.url} className="w-full h-full object-cover opacity-60" />
                  ) : (
                    <img src={item.url} className="w-full h-full object-cover opacity-60" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end justify-center p-2">
                    <span className="text-[9px] text-white font-black truncate w-full text-center uppercase tracking-tighter">{item.perfil?.nome?.split(' ')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QR Code de Engajamento (Dinâmico com Base URL correta e Premium Style) */}
          <div className="absolute top-12 right-12 flex flex-col items-end gap-5 animate-in slide-in-from-top-12 duration-1000 ease-out">
            <div className="bg-white p-3 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] border-4 border-primary/20 group hover:scale-110 transition-transform duration-500 relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl rotate-[-15deg] group-hover:rotate-0 transition-transform">
                 <span className="material-symbols-outlined !text-xl">qr_code_scanner</span>
              </div>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '/#/evento/' + (event?.slug_curto || slug))}&color=000000&bgcolor=ffffff`}
                className="w-32 h-32 rounded-xl"
                alt="QR Code do Evento"
              />
            </div>
            <div className="flex flex-col items-end gap-1">
               <p className="text-[12px] font-black text-white uppercase tracking-[0.4em] italic">Participe Agora</p>
               <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] opacity-80">Aponte sua câmera</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar na base */}
      {current.tipo === 'foto' && (
        <div className="absolute bottom-0 left-0 h-1.5 bg-white/5 w-full z-50 overflow-hidden">
          <div
            key={`progress-${currentIndex}`}
            className="h-full bg-primary shadow-[0_0_20px_rgba(19,182,236,1)] origin-left"
            style={{ animation: 'liveProgress 8s linear forwards' }}
          />
        </div>
      )}

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
