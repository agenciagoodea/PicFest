import React, { useState, useRef, useEffect, useCallback } from 'react';

interface VideoRecorderProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
  maxDuration?: number;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({ onCapture, onCancel, maxDuration = 30 }) => {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isReady, setIsReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Monitorar rotação do dispositivo
  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        audio: true
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
    if (isRecording) return;
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    setIsReady(false);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    
    recordedChunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
      ? 'video/webm;codecs=vp9' 
      : 'video/webm';
      
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' });
      onCapture(file);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    setTimer(0);
    
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev >= maxDuration - 1) {
          stopRecording();
          return maxDuration;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in overflow-hidden">
      {/* Video Preview */}
      <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-slate-950 transition-all duration-500`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full ${isLandscape ? 'object-contain' : 'object-cover'} ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />

        {isRecording && (
          <div className={`absolute ${isLandscape ? 'top-10 left-10' : 'top-10 left-1/2 -translate-x-1/2'} bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-2 animate-pulse shadow-2xl border border-white/20 z-50`}>
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            REC {formatTimer(timer)}
          </div>
        )}

        {!isReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center gap-4 z-40">
            <span className="material-symbols-outlined text-red-500 text-5xl italic">videocam_off</span>
            <h3 className="text-white font-black uppercase italic tracking-tighter text-xl">Ops! Erro de Câmera</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Não foi possível acessar a câmera. Verifique se deu permissão ao PicFest no seu navegador.</p>
            <button onClick={onCancel} className="mt-4 px-8 py-3 bg-white text-black rounded-full font-black uppercase tracking-widest text-[10px]">Tentar Novamente</button>
          </div>
        )}
      </div>

      {/* Controls Overlay - Adaptável para Paisagem */}
      <div className={`absolute z-50 ${isLandscape ? 'inset-y-0 right-0 w-32 flex-col bg-gradient-to-l' : 'inset-x-0 bottom-0 p-10 flex-row bg-gradient-to-t'} flex items-center justify-between from-black/90 via-black/40 to-transparent transition-all duration-500`}>
        <button
          onClick={onCancel}
          disabled={isRecording}
          className={`w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all disabled:opacity-30 border border-white/5 ${isLandscape ? 'order-1 mb-8' : ''}`}
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!isReady}
          className={`w-24 h-24 rounded-full border-4 flex items-center justify-center group active:scale-95 transition-all shadow-2xl ${isRecording ? 'border-red-500' : 'border-white'} ${isLandscape ? 'order-2' : ''}`}
        >
          <div className={`transition-all duration-300 ${isRecording ? 'w-10 h-10 bg-red-500 rounded-xl' : 'w-16 h-16 bg-white rounded-full group-hover:scale-110 shadow-lg'}`}></div>
        </button>

        <button
          onClick={toggleCamera}
          disabled={isRecording || !isReady}
          className={`w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all disabled:opacity-30 border border-white/5 ${isLandscape ? 'order-3 mt-8' : ''}`}
          title="Alternar Câmera"
        >
          <span className="material-symbols-outlined">flip_camera_ios</span>
        </button>
      </div>

      {/* Header Info */}
      {!isRecording && (
        <div className={`absolute top-0 left-0 right-0 p-8 flex justify-center z-50 ${isLandscape ? 'pointer-events-none' : ''}`}>
            <span className="bg-black/60 backdrop-blur-xl px-5 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 shadow-2xl italic">
                Gravador de Vídeo • {maxDuration}s
            </span>
        </div>
      )}
    </div>
  );
};
