import React, { useState, useRef, useEffect, useCallback } from 'react';

interface PhotoCameraProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export const PhotoCamera: React.FC<PhotoCameraProps> = ({ onCapture, onCancel }) => {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsReady(true);
        setError(null);
      }
    } catch (err: any) {
      console.error('Erro ao acessar câmera:', err);
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    setIsReady(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !isReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Ajustar tamanho do canvas para o vídeo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Se for câmera frontal, espelhar o desenho no canvas
    if (facingMode === 'user') {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Converter para Blob/File
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
      }
    }, 'image/jpeg', 0.85);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in">
      {/* Video Preview */}
      <div className="relative w-full h-full max-w-lg overflow-hidden flex items-center justify-center bg-slate-900">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />
        
        {/* Flash Effect Overlay */}
        <div id="camera-flash" className="absolute inset-0 bg-white opacity-0 pointer-events-none transition-opacity duration-100"></div>

        {!isReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center gap-4">
            <span className="material-symbols-outlined text-red-500 text-5xl">videocam_off</span>
            <p className="text-white font-bold">{error}</p>
            <button onClick={onCancel} className="px-6 py-2 bg-white/10 text-white rounded-full font-bold">Voltar</button>
          </div>
        )}
      </div>

      {/* Hidden Canvas for Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-8 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent">
        <button
          onClick={onCancel}
          className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <button
          onClick={() => {
            // Flash effect
            const flash = document.getElementById('camera-flash');
            if (flash) {
              flash.style.opacity = '1';
              setTimeout(() => flash.style.opacity = '0', 100);
            }
            capturePhoto();
          }}
          disabled={!isReady}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group active:scale-95 transition-all disabled:opacity-50"
        >
          <div className="w-14 h-14 rounded-full bg-white group-hover:scale-110 transition-transform"></div>
        </button>

        <button
          onClick={toggleCamera}
          className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
        >
          <span className="material-symbols-outlined">flip_camera_ios</span>
        </button>
      </div>

      {/* Header Info */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-center">
        <span className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/10">
          Capturar Foto
        </span>
      </div>
    </div>
  );
};
