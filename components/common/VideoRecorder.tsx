
import React, { useState, useRef, useEffect } from 'react';

interface VideoRecorderProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
  maxDuration?: number;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({ 
  onCapture, 
  onCancel, 
  maxDuration = 30 
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar câmera
  useEffect(() => {
    startCamera();
    return () => stopAll();
  }, []);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: 'environment', // Câmera traseira
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      };
      
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.error('Erro ao acessar câmera:', err);
      setPermissionError('Não foi possível acessar a câmera. Verifique as permissões do seu navegador.');
    }
  };

  const stopAll = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startRecording = () => {
    if (!stream) return;
    
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus' // Padrão suportado pela maioria
    });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/mp4' });
      setRecordedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    setSeconds(0);

    // Timer de contagem e parada automática
    timerRef.current = setInterval(() => {
      setSeconds(prev => {
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

  const handleConfirm = () => {
    if (recordedBlob) {
      const file = new File([recordedBlob], `video-${Date.now()}.mp4`, { type: 'video/mp4' });
      onCapture(file);
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setPreviewUrl(null);
    setSeconds(0);
    // Reinicia o fluxo de vídeo se necessário (já deve estar ativo se não paramos tracks)
  };

  if (permissionError) {
    return (
      <div className="fixed inset-0 z-[110] bg-black flex flex-col items-center justify-center p-8 text-center gap-6">
        <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center border border-red-500/40">
          <span className="material-symbols-outlined text-4xl text-red-500 italic">videocam_off</span>
        </div>
        <div>
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Acesso Negado</h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">Não foi possível acessar sua câmera pelo navegador. <br/>Deseja usar o aplicativo de câmera do seu celular?</p>
        </div>
        <div className="flex flex-col w-full gap-3">
          <button 
            onClick={() => {
              // Trigger input invisível que já existe no GuestUpload (via fallback)
              onCancel();
              document.getElementById('native-video-input')?.click();
            }} 
            className="w-full py-4 bg-primary text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-primary/20"
          >
            Usar Câmera do Sistema
          </button>
          <button onClick={onCancel} className="w-full py-4 bg-white/5 text-slate-500 font-black rounded-2xl text-[10px] uppercase tracking-widest">Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-between p-6 overflow-hidden">
      {/* Header / Timer */}
      <div className="w-full flex justify-between items-center py-4">
        <button onClick={onCancel} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white">
          <span className="material-symbols-outlined">close</span>
        </button>
        
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 shadow-2xl">
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></div>
          <span className="text-2xl font-mono font-black text-white leading-none tracking-tighter">
            00:{seconds.toString().padStart(2, '0')}
          </span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l border-white/10 pl-3">Máx 30s</span>
        </div>
        
        <div className="w-12"></div> {/* Spacer */}
      </div>

      {/* Viewport */}
      <div className="flex-1 w-full max-w-sm rounded-[3rem] overflow-hidden bg-zinc-900 relative shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5">
        {previewUrl ? (
          <video src={previewUrl} className="w-full h-full object-cover" controls autoPlay loop />
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover scale-x-[-1]" // Espelhamento para naturalidade no mobile
          />
        )}

        {isRecording && (
          <div className="absolute inset-0 border-4 border-red-500 pointer-events-none animate-pulse"></div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full py-8 flex items-center justify-center gap-10">
        {!previewUrl ? (
          <>
            <div className="w-16"></div> {/* Spacer */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all shadow-2xl ${isRecording ? 'border-white bg-white/10' : 'border-white bg-white'}`}
            >
              <div className={`transition-all duration-300 ${isRecording ? 'w-8 h-8 bg-red-500 rounded-md' : 'w-16 h-16 bg-red-500 rounded-full scale-90'}`}></div>
            </button>
            <div className="w-16"></div> {/* Spacer */}
          </>
        ) : (
          <div className="flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-300">
            <button
              onClick={resetRecording}
              className="px-8 py-5 bg-white/5 border border-white/10 text-white font-black rounded-3xl uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-all text-xs"
            >
              <span className="material-symbols-outlined text-sm">refresh</span> Refazer
            </button>
            <button
              onClick={handleConfirm}
              className="px-8 py-5 bg-primary text-white font-black rounded-3xl uppercase tracking-widest flex items-center gap-2 shadow-2xl shadow-primary/30 hover:scale-105 transition-all text-xs"
            >
              <span className="material-symbols-outlined text-sm">check_circle</span> Usar Vídeo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
