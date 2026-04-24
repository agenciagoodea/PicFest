import React, { useEffect, useCallback, useRef, useState } from 'react';
import { Midia } from '../../types';

interface MediaLightboxProps {
  media: Midia[];
  initialIndex: number;
  onClose: () => void;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({ media, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Touch / swipe state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const current = media[currentIndex];
  const isVideo = current?.tipo === 'video';

  const navigate = useCallback((dir: 'prev' | 'next') => {
    if (animating) return;
    const newIndex = dir === 'prev'
      ? (currentIndex - 1 + media.length) % media.length
      : (currentIndex + 1) % media.length;

    setDirection(dir === 'prev' ? 'right' : 'left');
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setDirection(null);
      setAnimating(false);
    }, 220);
  }, [animating, currentIndex, media.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigate('prev');
      if (e.key === 'ArrowRight') navigate('next');
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, onClose]);

  // Auto-play video when switching to a video slide
  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex, isVideo]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      navigate(diff > 0 ? 'next' : 'prev');
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const slideClass = animating
    ? direction === 'left'
      ? 'translate-x-[-60px] opacity-0'
      : 'translate-x-[60px] opacity-0'
    : 'translate-x-0 opacity-100';

  const guestName = (current as any)?.perfil?.nome || (current as any)?.perfil?.email || null;

  return (
    <div
      className="fixed inset-0 z-[500] bg-black/98 backdrop-blur-2xl flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 z-10">
        <div className="flex items-center gap-3">
          {guestName && (
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-[14px] text-slate-400">person</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{guestName}</span>
            </div>
          )}
          {current?.legenda && (
            <span className="text-xs text-slate-400 font-medium italic max-w-[200px] truncate">"{current.legenda}"</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            {currentIndex + 1} / {media.length}
          </span>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      {/* Media area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden px-16">
        <div className={`transition-all duration-200 ease-in-out ${slideClass} flex items-center justify-center w-full h-full`}>
          {isVideo ? (
            <video
              ref={videoRef}
              src={current.url}
              controls
              autoPlay
              playsInline
              className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
              style={{ maxHeight: 'calc(100vh - 180px)' }}
            />
          ) : (
            <img
              src={current.url}
              alt={current.legenda || 'Mídia do evento'}
              className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain select-none"
              style={{ maxHeight: 'calc(100vh - 180px)' }}
              draggable={false}
            />
          )}
        </div>

        {/* Prev button */}
        {media.length > 1 && (
          <button
            onClick={() => navigate('prev')}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 z-20"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
        )}

        {/* Next button */}
        {media.length > 1 && (
          <button
            onClick={() => navigate('next')}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 z-20"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        )}
      </div>

      {/* Footer dots / thumbnails */}
      <div className="flex-shrink-0 flex justify-center items-center gap-1.5 py-4 px-6">
        {media.length <= 20
          ? media.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`rounded-full transition-all duration-200 ${i === currentIndex ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/25 hover:bg-white/50'}`}
            />
          ))
          : (
            <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">
              {currentIndex + 1} de {media.length}
            </span>
          )
        }
      </div>
    </div>
  );
};
