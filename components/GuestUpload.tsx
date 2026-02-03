
import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';

export const GuestUpload: React.FC = () => {
  const { slug } = useParams();
  const [step, setStep] = useState(1); // 1: Perfil, 2: Seleção Mídia, 3: Legenda, 4: Sucesso
  const [loading, setLoading] = useState(false);
  const [showOnScreen, setShowOnScreen] = useState(true);
  
  // Dados do Perfil do Convidado
  const [guestProfile, setGuestProfile] = useState({
    nome: '',
    email: '',
    foto_perfil: ''
  });

  // Dados da Mídia
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePhotoRef = useRef<HTMLInputElement>(null);

  const handleProfilePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (guestProfile.foto_perfil) URL.revokeObjectURL(guestProfile.foto_perfil);
      setGuestProfile(prev => ({ ...prev, foto_perfil: URL.createObjectURL(selected) }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (preview) URL.revokeObjectURL(preview);
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setStep(3);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      await supabaseService.uploadMedia('1', 'guest-user', file, caption);
      setStep(4);
    } catch (e) {
      console.error(e);
      alert('Não foi possível enviar a foto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const canProceedProfile = guestProfile.nome && guestProfile.email;

  return (
    <div className="min-h-screen bg-background-dark text-white font-sans selection:bg-primary selection:text-white pb-10 flex flex-col items-center">
      {/* Background Decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/20 blur-[120px] rounded-full opacity-50"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full opacity-30"></div>
      </div>

      <div className="relative z-10 w-full max-w-[450px] flex flex-col items-center px-6 pt-10">
        <header className="flex flex-col items-center gap-4 mb-10 text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 animate-pulse">
            <span className="material-symbols-outlined !text-3xl text-white">auto_awesome_motion</span>
          </div>
          <div className="flex flex-col gap-1">
             <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white leading-none">Tech Gala 2024</h1>
             <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">Sua foto no telão em tempo real</p>
          </div>
        </header>

        <div className="w-full">
          {/* Passo 1: Cadastro do Perfil */}
          {step === 1 && (
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] flex flex-col gap-8 shadow-2xl animate-in fade-in slide-in-from-bottom-6">
              <div className="text-center">
                <h2 className="text-2xl font-black italic uppercase tracking-tight">Crie seu Perfil</h2>
                <p className="text-slate-400 text-xs mt-2 uppercase font-bold tracking-widest">Para aparecer no telão</p>
              </div>

              <div className="flex flex-col items-center gap-4">
                 <div onClick={() => profilePhotoRef.current?.click()} className="relative cursor-pointer w-28 h-28 group">
                    <div className="w-full h-full rounded-[2.5rem] border-2 border-primary/30 bg-white/5 overflow-hidden flex items-center justify-center transition-all group-active:scale-95">
                       {guestProfile.foto_perfil ? (
                         <img src={guestProfile.foto_perfil} className="w-full h-full object-cover" />
                       ) : (
                         <span className="material-symbols-outlined !text-4xl text-slate-600">add_a_photo</span>
                       )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-primary rounded-xl flex items-center justify-center border-4 border-background-dark shadow-xl">
                       <span className="material-symbols-outlined !text-sm text-white">camera</span>
                    </div>
                    <input ref={profilePhotoRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePhoto} />
                 </div>
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Seu Nome</label>
                   <input type="text" value={guestProfile.nome} onChange={e => setGuestProfile({...guestProfile, nome: e.target.value})} className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-white text-sm outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Nome Sobrenome" />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                   <input type="email" value={guestProfile.email} onChange={e => setGuestProfile({...guestProfile, email: e.target.value})} className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-white text-sm outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="seu@email.com" />
                </div>
                
                <button type="button" disabled={!canProceedProfile} onClick={() => setStep(2)} className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 disabled:opacity-20 uppercase tracking-widest text-xs mt-2 transition-all active:scale-95">
                   Entrar na Festa
                </button>
              </div>
            </div>
          )}

          {/* Passo 2: Seleção de Mídia (Botão Centralizado Real) */}
          {step === 2 && (
            <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-8">
               <div 
                 onClick={() => fileInputRef.current?.click()} 
                 className="aspect-[4/5] bg-white/5 border border-white/10 rounded-[3rem] flex flex-col items-center justify-center gap-8 cursor-pointer active:scale-95 transition-all group shadow-2xl backdrop-blur-md relative overflow-hidden"
               >
                  <div className="absolute inset-0 border-2 border-dashed border-primary/20 rounded-[3rem] m-4"></div>
                  
                  <div className="w-32 h-32 bg-primary rounded-[3rem] flex items-center justify-center text-white shadow-[0_0_50px_rgba(19,182,236,0.4)] group-hover:scale-105 transition-transform duration-500">
                     <span className="material-symbols-outlined !text-6xl">photo_camera</span>
                  </div>
                  
                  <div className="text-center px-6 relative z-10">
                    <p className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Capturar Momento</p>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-4 bg-white/5 py-2 px-4 rounded-full border border-white/10">Toque para abrir a câmera</p>
                  </div>

                  {/* Sem 'capture' para permitir Selfie + Traseira + Rolo de Câmera no menu do sistema */}
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept="image/*,video/*" 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
               </div>
               
               <button onClick={() => setStep(1)} className="text-slate-600 font-black text-[10px] uppercase tracking-[0.3em] text-center hover:text-white transition-colors">Voltar para o perfil</button>
            </div>
          )}

          {/* Passo 3: Legenda e Upload */}
          {step === 3 && (
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-6 rounded-[2.5rem] flex flex-col gap-6 animate-in zoom-in-95 shadow-2xl">
               <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-black border border-white/10 relative group shadow-inner">
                  {file?.type.startsWith('video') ? (
                    <video src={preview!} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                  ) : (
                    <img src={preview!} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 bg-primary text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-lg backdrop-blur-md border border-white/20">Sua Captura</div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setShowOnScreen(true)} className={`p-4 rounded-2xl border text-[9px] font-black uppercase flex flex-col items-center gap-2 transition-all ${showOnScreen ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                     <span className="material-symbols-outlined !text-xl">tv</span> Exibir no Telão
                  </button>
                  <button onClick={() => setShowOnScreen(false)} className={`p-4 rounded-2xl border text-[9px] font-black uppercase flex flex-col items-center gap-2 transition-all ${!showOnScreen ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                     <span className="material-symbols-outlined !text-xl">lock</span> Privado (Admin)
                  </button>
               </div>

               <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Legenda (Opcional)</label>
                 <textarea value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:ring-1 focus:ring-primary transition-all resize-none" placeholder="O que está acontecendo?" />
               </div>

               <button onClick={handleUpload} disabled={loading} className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/30 text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Enviar Agora <span className="material-symbols-outlined text-sm">rocket_launch</span></>
                  )}
               </button>
               <button onClick={() => { setStep(2); if(preview) URL.revokeObjectURL(preview); setPreview(null); }} className="text-slate-600 text-[10px] font-black uppercase tracking-widest text-center hover:text-white">Trocar mídia</button>
            </div>
          )}

          {/* Passo 4: Sucesso */}
          {step === 4 && (
            <div className="bg-white/5 border border-white/10 p-12 rounded-[3rem] flex flex-col items-center gap-8 text-center animate-in zoom-in-90 shadow-2xl backdrop-blur-xl">
               <div className="w-24 h-24 bg-green-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-green-500/30">
                  <span className="material-symbols-outlined !text-5xl animate-bounce">check</span>
               </div>
               <div>
                 <h2 className="text-3xl font-black italic uppercase text-white">Prontinho!</h2>
                 <p className="text-slate-400 text-sm mt-3 leading-relaxed font-bold">Sua mídia foi enviada com sucesso e aparecerá no telão em instantes.</p>
               </div>
               <button onClick={() => { setStep(2); setFile(null); if(preview) URL.revokeObjectURL(preview); setPreview(null); setCaption(''); }} className="w-full py-5 bg-white text-primary font-black rounded-2xl text-xs uppercase shadow-xl hover:scale-105 transition-all active:scale-95">
                Enviar Mais Fotos
               </button>
            </div>
          )}
        </div>
      </div>
      
      <footer className="mt-auto py-8 text-[9px] font-black text-slate-700 uppercase tracking-[0.5em] relative z-10">
        PICFEST LIVE • BETA V1.0
      </footer>
    </div>
  );
};
