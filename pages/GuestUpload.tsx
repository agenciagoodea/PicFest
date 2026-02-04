
import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { profileService } from '../services/profileService';
import { Evento } from '../types';

export const GuestUpload: React.FC = () => {
  const { slug } = useParams();
  const [event, setEvent] = useState<Evento | null>(null);
  const [step, setStep] = useState(1); // 1: Perfil, 2: Seleção Mídia, 3: Legenda, 4: Sucesso
  const [loading, setLoading] = useState(false);
  const [showOnScreen, setShowOnScreen] = useState(true);

  // Dados do Perfil do Convidado
  const [guestProfile, setGuestProfile] = useState({
    nome: '',
    email: '',
    telefone: '',
    instagram: '',
    foto_perfil: ''
  });

  // Dados da Mídia
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePhotoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (slug) {
      supabaseService.getEventBySlug(slug).then(setEvent);
    }
  }, [slug]);

  const handleProfilePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setGuestProfile(prev => ({ ...prev, foto_perfil: URL.createObjectURL(selected) }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setStep(3);
    }
  };

  const handleUpload = async () => {
    if (!file || !event) return;
    setLoading(true);
    try {
      // 1. Criar ou buscar perfil do convidado
      const { data: guestProfileData, error: profileError } = await profileService.getOrCreateGuestProfile({
        nome: guestProfile.nome,
        email: guestProfile.email,
        telefone: guestProfile.telefone,
        instagram: guestProfile.instagram,
      });

      if (profileError || !guestProfileData) {
        throw new Error('Erro ao criar perfil do convidado');
      }

      // 2. Upload da foto de perfil se houver
      if (guestProfile.foto_perfil && guestProfile.foto_perfil.startsWith('blob:')) {
        const profilePhotoFile = await fetch(guestProfile.foto_perfil).then(r => r.blob());
        await profileService.uploadProfilePhoto(
          guestProfileData.id,
          new File([profilePhotoFile], 'profile.jpg', { type: 'image/jpeg' })
        );
      }

      // 3. Upload da mídia do evento
      const uploadedMedia = await supabaseService.uploadMedia(
        event.id,
        guestProfileData.id,
        file,
        caption,
        showOnScreen
      );

      if (!uploadedMedia) {
        throw new Error('Erro ao fazer upload da mídia');
      }

      setStep(4);
    } catch (e: any) {
      console.error('Erro no upload:', e);
      alert(e.message || 'Erro no upload');
    } finally {
      setLoading(false);
    }
  };

  const canProceedProfile = guestProfile.nome && guestProfile.email;

  if (!event && slug) {
    return (
      <div className="min-h-screen bg-background-dark text-white flex flex-col items-center justify-center p-10 text-center">
        <span className="material-symbols-outlined text-primary text-6xl animate-pulse mb-4">search</span>
        <h1 className="text-2xl font-black">Buscando Evento...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark text-white font-sans selection:bg-primary selection:text-white">
      {/* Background Decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center p-6 md:p-10">
        <header className="flex flex-col items-center gap-4 mb-10 text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 animate-bounce-slow">
            <span className="material-symbols-outlined !text-3xl text-white">auto_awesome_motion</span>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase italic">{event?.nome || 'PicFest Event'}</h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transmissão ao Vivo</span>
            </div>
          </div>
        </header>

        <div className="w-full max-w-[500px]">
          {/* Passo 1: Cadastro do Perfil */}
          {step === 1 && (
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-8 md:p-10 rounded-[2.5rem] flex flex-col gap-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <h2 className="text-3xl font-black leading-tight">Prepare-se!</h2>
                <p className="text-slate-400 text-sm mt-2">Crie seu crachá digital para aparecer no telão.</p>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div
                  onClick={() => profilePhotoRef.current?.click()}
                  className="relative group cursor-pointer w-32 h-32"
                >
                  <div className="w-full h-full rounded-[2rem] border-4 border-primary/20 bg-white/5 overflow-hidden flex items-center justify-center relative">
                    {guestProfile.foto_perfil ? (
                      <img src={guestProfile.foto_perfil} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined !text-4xl text-slate-700">add_a_photo</span>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg border-2 border-background-dark">
                    <span className="material-symbols-outlined !text-sm text-white">edit</span>
                  </div>
                  <input ref={profilePhotoRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePhoto} />
                </div>
              </div>

              <form className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Artístico / Apelido</label>
                    <input
                      type="text"
                      required
                      value={guestProfile.nome}
                      onChange={e => setGuestProfile({ ...guestProfile, nome: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="Como quer ser chamado?"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                    <input
                      type="email"
                      required
                      value={guestProfile.email}
                      onChange={e => setGuestProfile({ ...guestProfile, email: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="contato@exemplo.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Telefone</label>
                      <input
                        type="tel"
                        value={guestProfile.telefone}
                        onChange={e => setGuestProfile({ ...guestProfile, telefone: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Instagram</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs">@</span>
                        <input
                          type="text"
                          value={guestProfile.instagram}
                          onChange={e => setGuestProfile({ ...guestProfile, instagram: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 pl-8 pr-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all text-xs"
                          placeholder="seu_user"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canProceedProfile}
                  onClick={() => setStep(2)}
                  className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 disabled:opacity-30 hover:scale-[1.02] active:scale-95 transition-all mt-4 uppercase tracking-widest"
                >
                  Começar a Capturar
                </button>
              </form>
            </div>
          )}

          {/* Passo 2: Seleção de Mídia */}
          {step === 2 && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-4">
                <h2 className="text-3xl font-black italic uppercase">Seja o Fotógrafo</h2>
                <p className="text-slate-400 mt-2">Sua mídia será exibida para todos no evento!</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square bg-white/5 border-4 border-dashed border-primary/20 rounded-[3rem] flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-all group"
                >
                  <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-2xl">
                    <span className="material-symbols-outlined !text-5xl">photo_camera</span>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-primary">Capturar Agora</p>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Fotos ou Vídeos Curtos</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                </div>

                <button onClick={() => setStep(1)} className="text-slate-500 font-bold hover:text-white transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">arrow_back</span> Editar meu perfil
                </button>
              </div>
            </div>
          )}

          {/* Passo 3: Legenda e Upload */}
          {step === 3 && (
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] flex flex-col gap-6 animate-in zoom-in-95 duration-500 shadow-2xl">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-black tracking-tight">Quase lá...</h2>
                <button onClick={() => { setFile(null); setStep(2); }} className="text-xs font-bold text-red-500 uppercase tracking-widest">Trocar Mídia</button>
              </div>

              <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-black border border-white/10 relative shadow-2xl">
                {file?.type.startsWith('video') ? (
                  <video src={preview!} className="w-full h-full object-cover" controls />
                ) : (
                  <img src={preview!} className="w-full h-full object-cover" />
                )}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10">
                  <img src={guestProfile.foto_perfil || 'https://i.pravatar.cc/50'} className="w-6 h-6 rounded-lg object-cover" />
                  <span className="text-[10px] font-black text-white">{guestProfile.nome}</span>
                </div>
              </div>

              {/* OPÇÃO DE PRIVACIDADE CHAMATIVA */}
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Onde exibir sua mídia?</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowOnScreen(true)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all group ${showOnScreen ? 'bg-primary/20 border-primary shadow-[0_0_20px_rgba(19,182,236,0.2)]' : 'bg-white/5 border-white/10'}`}
                  >
                    <span className={`material-symbols-outlined !text-2xl ${showOnScreen ? 'text-primary' : 'text-slate-500'}`}>tv</span>
                    <div className="text-center">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${showOnScreen ? 'text-white' : 'text-slate-500'}`}>Brilhar no Telão</p>
                    </div>
                    {showOnScreen && <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>}
                  </button>
                  <button
                    onClick={() => setShowOnScreen(false)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${!showOnScreen ? 'bg-orange-500/20 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]' : 'bg-white/5 border-white/10'}`}
                  >
                    <span className={`material-symbols-outlined !text-2xl ${!showOnScreen ? 'text-orange-500' : 'text-slate-500'}`}>visibility_off</span>
                    <div className="text-center">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${!showOnScreen ? 'text-white' : 'text-slate-500'}`}>Envio Privado</p>
                    </div>
                    {!showOnScreen && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>}
                  </button>
                </div>
                <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-tighter italic">
                  {showOnScreen ? '✨ Todos no evento verão sua captura!' : '🔒 Apenas o organizador terá acesso à sua mídia.'}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sua Mensagem / Legenda</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-primary transition-all text-sm leading-relaxed"
                  placeholder="O que está acontecendo nesse momento?"
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={loading}
                className={`w-full py-5 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-50 ${showOnScreen ? 'bg-primary shadow-primary/20' : 'bg-orange-500 shadow-orange-500/20'}`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined">{showOnScreen ? 'send' : 'lock'}</span>
                    <span>{showOnScreen ? 'ENVIAR PARA O TELÃO' : 'ENVIAR PRIVADAMENTE'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Passo 4: Sucesso */}
          {step === 4 && (
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-12 rounded-[3rem] flex flex-col items-center gap-8 text-center animate-in zoom-in-90 duration-500 shadow-2xl">
              <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-white shadow-2xl mb-2 relative ${showOnScreen ? 'bg-green-500 shadow-green-500/20' : 'bg-orange-500 shadow-orange-500/20'}`}>
                <span className="material-symbols-outlined !text-5xl">{showOnScreen ? 'check_circle' : 'security'}</span>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-4 border-background-dark animate-pulse">
                  <span className={`material-symbols-outlined !text-sm ${showOnScreen ? 'text-green-500' : 'text-orange-500'}`}>celebration</span>
                </div>
              </div>

              <div>
                <h2 className="text-4xl font-black italic tracking-tighter">INCRIÍVEL!</h2>
                <p className="text-slate-400 mt-4 leading-relaxed">
                  {showOnScreen
                    ? 'Sua foto foi enviada com sucesso e está sendo processada pela moderação para brilhar no telão!'
                    : 'Sua foto foi entregue com segurança apenas para o organizador. Obrigado por compartilhar!'}
                </p>
              </div>

              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={() => { setStep(2); setFile(null); setPreview(null); setCaption(''); setShowOnScreen(true); }}
                  className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all uppercase tracking-widest"
                >
                  Enviar Outra Foto
                </button>
                <button className="py-4 text-slate-500 font-bold hover:text-primary transition-colors text-xs uppercase tracking-widest">
                  Ver Minha Galeria
                </button>
              </div>
            </div>
          )}
        </div>

        <footer className="mt-12 text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] flex items-center gap-2">
          <span>Powerd by</span>
          <div className="flex items-center gap-1 text-slate-500">
            <span className="material-symbols-outlined text-xs">auto_awesome_motion</span>
            <span>EventMedia SaaS</span>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5%); }
          50% { transform: translateY(0); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
