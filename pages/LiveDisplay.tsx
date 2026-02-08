
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

  useEffect(() => {
    if (!slug) return;

    // Buscar o evento pelo slug ou ID (se o slug parecer um UUID)
    const fetchEvent = async () => {
      let ev = await supabaseService.getEventBySlug(slug);

      // Se não encontrou pelo slug, tenta pelo ID (UUID)
      if (!ev && slug.length > 20) {
        const { data } = await supabase.from('eventos').select('*').eq('id', slug).maybeSingle();
        if (data) ev = data as Evento;
      }

      if (ev) {
        setEvent(ev);
      } else {
        console.warn('Evento não encontrado para o slug/id:', slug);
      }
    };

    fetchEvent();
  }, [slug]);

  useEffect(() => {
    if (media.length === 0) return;

    const currentMedia = media[currentIndex];
    let timeoutId: number;

    if (currentMedia.tipo === 'video') {
      // Para vídeos, o onEnded cuidará da transição
    } else {
      timeoutId = window.setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % media.length);
      }, 8200); // 8.2 segundos para garantir que a barra de 8s termine visualmente
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentIndex, media]);

  // Pre-loading das próximas 5 imagens
  useEffect(() => {
    if (media.length === 0) return;

    const itemsToPreload = 5;
    for (let i = 1; i <= itemsToPreload; i++) {
      const nextIndex = (currentIndex + i) % media.length;
      const nextItem = media[nextIndex];
      if (nextItem && nextItem.tipo === 'foto') {
        const img = new Image();
        img.src = nextItem.url;
      } else if (nextItem && nextItem.tipo === 'video') {
        const video = document.createElement('video');
        video.src = nextItem.url;
        video.preload = 'auto'; // Tentar carregar metadados/buffer
      }
    }
  }, [currentIndex, media]);

  // Efeito para detectar novas mídias e dar destaque a elas
  useEffect(() => {
    if (media.length > 0 && !mediaLoading) {
      const latestId = media[0]?.id;
      const lastProcessedId = (window as any)._lastMediaId;

      if (latestId && latestId !== lastProcessedId) {
        (window as any)._lastMediaId = latestId;

        if (lastProcessedId) {
          console.log('✨ [Telão] Nova mídia detectada! Pulando para o destaque em 1s...');
          // Limpar qualquer transição pendente para dar lugar à nova foto
          const timeoutId = setTimeout(() => {
            setCurrentIndex(0);
          }, 1000); // 1 segundo é suficiente para o cérebro associar o envio à mudança
          return () => clearTimeout(timeoutId);
        }
      }
    }
  }, [media, mediaLoading]);

  const handleVideoEnded = () => {
    setCurrentIndex(prev => (prev + 1) % media.length);
  };

  const current = media[currentIndex];

  // Calcular próximas 5 mídias para a fila
  const nextUpQueue = media.length > 0
    ? Array.from({ length: 5 }).map((_, i) => media[(currentIndex + 1 + i) % media.length])
    : [];

  if (!event || media.length === 0) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center gap-6 overflow-hidden">
        {/* Adicionado status de conexão para ajuda visual */}
        <div className="absolute bottom-10 text-[8px] font-bold text-slate-800 uppercase tracking-[0.4em]">
          Supabase Realtime Connection Active
        </div>
        <div className="relative">
          <span className="material-symbols-outlined !text-8xl text-primary animate-pulse opacity-50">auto_awesome_motion</span>
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
        </div>
        <div className="text-center relative z-10">
          <h1 className="text-3xl font-black tracking-tighter text-white/90 uppercase italic">
            {event ? event.nome : 'Carregando Evento...'}
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 text-sm">
            Aguardando as primeiras fotos
          </p>
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
                className="max-w-full max-h-full object-contain shadow-[0_0_100px_rgba(0,0,0,0.9)] rounded-[2rem]"
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
                  className="max-w-[90vw] max-h-[85vh] object-contain shadow-[0_0_100px_rgba(0,0,0,0.9)] rounded-[2rem] border border-white/5 animate-kenburns"
                  key={`img-main-${current.id}`}
                  loading="eager"
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
              <h3 className="text-3xl font-black text-white leading-none">{current.perfil?.nome || 'Convidado'}</h3>
              {current.legenda && (
                <p className="text-xl italic text-slate-200 mt-3 font-medium opacity-90 leading-relaxed border-l-2 border-primary/50 pl-4 uppercase tracking-tighter">
                  "{current.legenda}"
                </p>
              )}
            </div>
          </div>

          {/* Fila de Próximas Fotos (Bottom Right) */}
          <div className="absolute bottom-10 right-10 flex flex-col items-end gap-2 animate-in slide-in-from-right-10 duration-700">
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">A seguir</p>
            <div className="flex items-center gap-3">
              {nextUpQueue.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="w-16 h-24 rounded-xl border-2 border-white/20 overflow-hidden relative shadow-lg bg-black/50">
                  {item.tipo === 'video' ? (
                    <video src={item.url} className="w-full h-full object-cover opacity-70" />
                  ) : (
                    <img src={item.url} className="w-full h-full object-cover opacity-70" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center p-1">
                    <span className="text-[8px] text-white font-bold truncate w-full text-center">{item.perfil?.nome?.split(' ')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QR Code de Engajamento (Dinâmico com Base URL correta) */}
          <div className="absolute top-10 right-10 flex flex-col items-end gap-4 animate-in slide-in-from-right-10 duration-700">
            <div className="bg-white p-2 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-primary/20 group hover:scale-110 transition-transform">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href.split('#')[0] + '#/evento/' + (event?.slug || slug))}&color=000000&bgcolor=ffffff`}
                className="w-24 h-24"
              />
            </div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/5">Escaneie e Participe</p>
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
