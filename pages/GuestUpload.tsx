
import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { profileService } from '../services/profileService';
import { mediaUploadService, UploadProgress } from '../services/mediaUploadService';
import { VideoRecorder } from '../components/common/VideoRecorder';
import { Evento, Midia } from '../types';

const GalleryGrid: React.FC<{ eventId?: string, userId: string | null }> = ({ eventId, userId }) => {
  const [media, setMedia] = useState<Midia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId && userId) {
      supabaseService.getUserEventMedia(eventId, userId as string)
        .then(setMedia)
        .finally(() => setLoading(false));
    }
  }, [eventId, userId]);

  if (loading) return <div className="col-span-full text-center py-10"><div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  if (media.length === 0) return (
    <div className="col-span-full text-center py-10 flex flex-col items-center gap-2 opacity-50">
      <span className="material-symbols-outlined text-4xl text-slate-700 italic">no_photography</span>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Nenhum registro seu ainda</p>
    </div>
  );

  return (
    <>
      {media.map(item => (
        <div key={item.id} className="aspect-[9/16] rounded-2xl overflow-hidden bg-white/5 relative group border border-white/5">
          {item.tipo === 'video' ? (
            <video src={item.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          ) : (
            <img src={item.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          )}
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-wider ${item.aprovado ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
            {item.aprovado ? 'No Telão' : 'Privado'}
          </div>
        </div>
      ))}
    </>
  );
};

export const GuestUpload: React.FC = () => {
  const { slug } = useParams();
  const [event, setEvent] = useState<Evento | null>(null);
  const [step, setStep] = useState(1); // 1: Perfil, 2: Seleção Mídia, 3: Legenda, 4: Sucesso
  const [loading, setLoading] = useState(false);
  const [showOnScreen, setShowOnScreen] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isRecording, setIsRecording] = useState(false);

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
  const [guestId, setGuestId] = useState<string | null>(null);

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
    e.target.value = '';
  };

  const handleVideoCapture = (capturedFile: File) => {
    setFile(capturedFile);
    setPreview(URL.createObjectURL(capturedFile));
    setIsRecording(false);
    setStep(3);
  };

  const handleUpload = async () => {
    if (!file || !event) return;
    setLoading(true);
    setUploadProgress({ percentage: 0, stage: 'validating', message: 'Iniciando...' });

    try {
      // 1. Criar ou buscar perfil do convidado
      const { data: guestProfileData, error: profileError } = await profileService.getOrCreateGuestProfile({
        nome: guestProfile.nome,
        email: guestProfile.email,
        telefone: guestProfile.telefone,
        instagram: guestProfile.instagram,
      });

      if (profileError || !guestProfileData) {
        throw new Error('Não foi possível salvar seu perfil. Tente novamente.');
      }

      setGuestId(guestProfileData.id);

      // 2. Upload da foto de perfil se houver e for nova
      if (guestProfile.foto_perfil && guestProfile.foto_perfil.startsWith('blob:')) {
        const profilePhotoRes = await fetch(guestProfile.foto_perfil);
        const profilePhotoBlob = await profilePhotoRes.blob();

        const uploadRes = await profileService.uploadProfilePhoto(
          guestProfileData.id,
          new File([profilePhotoBlob], 'profile.jpg', { type: 'image/jpeg' })
        );

        if (uploadRes.url) {
          setGuestProfile(prev => ({ ...prev, foto_perfil: uploadRes.url! }));
        }
      }

      // 3. Validar limite de upload
      const mediaType = file.type.startsWith('video/') ? 'video' : 'foto';
      const limitCheck = await supabaseService.validateUploadLimit(event.id, mediaType);

      if (!limitCheck.allowed) {
        const isPhoto = mediaType === 'foto';
        throw new Error(isPhoto 
          ? `Tudo cheio por aqui! O limite de fotos deste evento foi atingido. Avise o organizador para liberar mais espaço!`
          : `Tudo cheio por aqui! O limite de vídeos deste evento foi atingido. Avise o organizador para liberar mais espaço!`);
      }

      // 4. Pipeline de Upload Profissional
      await mediaUploadService.uploadEventMedia(
        event.id,
        guestProfileData.id,
        file,
        caption,
        showOnScreen,
        (progress) => setUploadProgress(progress)
      );

      // 5. Salvar/Atualizar no Livro de Assinaturas (Guestbook)
      try {
         await supabaseService.upsertGuestbookEntry({
            evento_id: event.id,
            tenant_id: event.organizador_id || '', // ou o tenant_id associado ao evento
            guest_id: guestProfileData.id,
            nome: guestProfileData.nome,
            instagram: guestProfileData.instagram || '',
            mensagem: caption || '',
            foto_url: guestProfileData.foto_perfil || ''
         });
      } catch (guestbookErr) {
         console.error('Erro ao salvar no guestbook:', guestbookErr);
         // Não bloqueamos a UI por falha no guestbook
      }

      setStep(4);
    } catch (e: any) {
      console.error('Erro no upload:', e);
      setUploadProgress({ stage: 'error', percentage: 0, message: e.message || 'Erro crítico no envio.' });
      setTimeout(() => alert(e.message || 'Erro ao processar sua mídia. Tente novamente.'), 100);
    } finally {
      setLoading(false);
    }
  };

  const canProceedProfile = guestProfile.nome && guestProfile.email;

  if (!event && slug) {
    return (
      <div className="min-h-screen bg-background-dark text-white flex flex-col items-center justify-center p-10 text-center">
        <span className="material-symbols-outlined text-primary text-6xl animate-pulse mb-6 italic">auto_awesome_motion</span>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Localizando seu Evento...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark text-white font-sans selection:bg-primary selection:text-white">
      {/* Câmera Customizada de Vídeo */}
      {isRecording && (
        <VideoRecorder 
          onCapture={handleVideoCapture} 
          onCancel={() => setIsRecording(false)} 
          maxDuration={30}
        />
      )}

      {/* Background Decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[130px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[130px] rounded-full"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center p-6 md:p-10">
        <header className="flex flex-col items-center gap-5 mb-12 text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30 animate-bounce-slow">
            <span className="material-symbols-outlined !text-3xl text-white italic">auto_awesome_motion</span>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">{event?.nome || 'PicFest Event'}</h1>
            <div className="flex items-center justify-center gap-2 mt-3 p-2 px-4 bg-white/5 rounded-full border border-white/5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Experience Mode</span>
            </div>
          </div>
        </header>

        <div className="w-full max-w-[500px]">
          {/* Passo 1: Cadastro do Perfil */}
          {step === 1 && (
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-8 md:p-10 rounded-[3rem] flex flex-col gap-10 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="text-center">
                <h2 className="text-4xl font-black leading-none tracking-tight uppercase italic italic">Boas Vindas!</h2>
                <p className="text-slate-500 text-sm mt-3 font-medium">Complete seu crachá para que todos saibam quem é você.</p>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div
                  onClick={() => profilePhotoRef.current?.click()}
                  className="relative group cursor-pointer w-32 h-32"
                >
                  <div className="w-full h-full rounded-[2.5rem] border-4 border-primary/20 bg-white/5 overflow-hidden flex items-center justify-center relative shadow-2xl transition-transform group-hover:scale-105 active:scale-95 duration-300">
                    {guestProfile.foto_perfil ? (
                      <img src={guestProfile.foto_perfil} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined !text-4xl text-slate-700 italic">add_a_photo</span>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl border-4 border-background-dark group-hover:rotate-12 transition-transform">
                    <span className="material-symbols-outlined !text-sm text-white">edit</span>
                  </div>
                  <input
                    ref={profilePhotoRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={handleProfilePhoto}
                  />
                </div>
              </div>

              <form className="flex flex-col gap-5">
                <div className="grid grid-cols-1 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Como quer ser identificado?</label>
                    <input
                      type="text"
                      required
                      value={guestProfile.nome}
                      onChange={e => setGuestProfile({ ...guestProfile, nome: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded-2xl h-16 px-6 text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-700 font-bold"
                      placeholder="Seu Nome ou Apelido"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Seu melhor E-mail</label>
                    <input
                      type="email"
                      required
                      value={guestProfile.email}
                      onChange={e => setGuestProfile({ ...guestProfile, email: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded-2xl h-16 px-6 text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-700 font-bold"
                      placeholder="contato@empresa.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Telefone</label>
                      <input
                        type="tel"
                        value={guestProfile.telefone}
                        onChange={e => setGuestProfile({ ...guestProfile, telefone: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded-2xl h-16 px-6 text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-700 font-bold"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Instagram (@)</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700 text-xs font-black">@</span>
                        <input
                          type="text"
                          value={guestProfile.instagram}
                          onChange={e => setGuestProfile({ ...guestProfile, instagram: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl h-16 pl-10 pr-6 text-white focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-bold placeholder:text-slate-700"
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
                  className="w-full py-6 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/30 disabled:opacity-30 hover:scale-[1.02] active:scale-95 transition-all mt-6 uppercase tracking-[0.3em] italic"
                >
                  Entrar na Festa
                </button>
              </form>
            </div>
          )}

          {/* Passo 2: Seleção de Mídia */}
          {step === 2 && (
            <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-right-8 duration-700">
              <div className="text-center mb-4">
                <h2 className="text-4xl font-black italic uppercase italic tracking-tighter leading-none">Capture o Momento</h2>
                <p className="text-slate-500 mt-4 text-sm font-medium">Suas imagens aparecerão ao vivo para todos!</p>
              </div>

              <div className="flex flex-col gap-6">
                {/* FOTO */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-7 p-8 bg-primary/10 border-2 border-dashed border-primary/40 rounded-[3rem] hover:bg-primary/20 hover:border-primary transition-all group cursor-pointer active:scale-[0.98] shadow-xl"
                >
                  <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(19,182,236,0.3)] flex-shrink-0 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined !text-5xl text-white italic">photo_camera</span>
                  </div>
                  <div className="text-left">
                    <p className="text-3xl font-black text-white tracking-tighter italic uppercase leading-none">Tirar Foto</p>
                    <p className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-widest">Qualidade Profissional</p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-[9px] text-primary font-black uppercase tracking-[0.3em]">Suporte nativo iPhone</span>
                    </div>
                  </div>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {/* VÍDEO (MediaDevices API) */}
                <button
                  type="button"
                  onClick={() => setIsRecording(true)}
                  className="w-full flex items-center gap-7 p-8 bg-orange-500/10 border-2 border-dashed border-orange-500/40 rounded-[3rem] hover:bg-orange-500/20 hover:border-orange-500 transition-all group cursor-pointer active:scale-[0.98] shadow-xl"
                >
                  <div className="w-24 h-24 bg-orange-500 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.3)] flex-shrink-0 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined !text-5xl text-white italic">videocam</span>
                  </div>
                  <div className="text-left">
                    <p className="text-3xl font-black text-white tracking-tighter italic uppercase leading-none">Gravar Vídeo</p>
                    <p className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-widest">Timer Real-Time</p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      <span className="text-[9px] text-orange-400 font-black uppercase tracking-[0.3em]">Corte Automático 30s</span>
                    </div>
                  </div>
                </button>

                {/* INPUT VÍDEO NATIVO (FALLBACK) */}
                <input
                  id="native-video-input"
                  type="file"
                  accept="video/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <button onClick={() => setStep(1)} className="text-slate-600 font-black text-[10px] uppercase tracking-[0.5em] hover:text-white transition-all flex items-center justify-center gap-3 mt-8 opacity-40 hover:opacity-100">
                <span className="material-symbols-outlined !text-sm">chevron_left</span> Voltar ao Perfil
              </button>
            </div>
          )}

          {/* Passo 3: Legenda e Upload */}
          {step === 3 && (
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-8 md:p-10 rounded-[3rem] flex flex-col gap-8 animate-in zoom-in-95 duration-500 shadow-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter italic">Quase Brilhando!</h2>
                <button onClick={() => { setFile(null); setStep(2); }} className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em] bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20">Refazer</button>
              </div>

              <div className="aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-black border border-white/5 relative shadow-2xl">
                {file?.type.startsWith('video') ? (
                  <video src={preview!} className="w-full h-full object-cover" controls />
                ) : (
                  <img src={preview!} className="w-full h-full object-cover" />
                )}
                <div className="absolute top-5 left-5 flex items-center gap-3 bg-black/60 backdrop-blur-xl p-3 px-5 rounded-2xl border border-white/10 shadow-2xl">
                  <div className="w-7 h-7 rounded-lg overflow-hidden border border-white/10">
                    <img src={guestProfile.foto_perfil || 'https://i.pravatar.cc/100'} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[11px] font-black text-white italic uppercase tracking-tighter">{guestProfile.nome}</span>
                </div>
              </div>

              {/* BARRA DE PROGRESSO */}
              {loading && uploadProgress && (
                <div className="flex flex-col gap-4 p-7 bg-white/5 rounded-[2rem] border border-white/10 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">{uploadProgress.message}</span>
                    <span className="text-xs font-black text-white">{uploadProgress.percentage}%</span>
                  </div>
                  <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-[2px]">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(19,182,236,0.3)] ${uploadProgress.stage === 'error' ? 'bg-red-500 shadow-red-500' : 'bg-primary'}`}
                      style={{ width: `${uploadProgress.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {!loading && (
                <>
                  {/* OPÇÃO DE PRIVACIDADE */}
                  <div className="flex flex-col gap-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-2">Destino da Captura</label>
                    <div className="grid grid-cols-2 gap-5">
                      <button
                        type="button"
                        onClick={() => setShowOnScreen(true)}
                        className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all duration-300 ${showOnScreen ? 'bg-primary/20 border-primary shadow-[0_0_30px_rgba(19,182,236,0.15)]' : 'bg-white/5 border-white/5 opacity-30 grayscale'}`}
                      >
                        <span className={`material-symbols-outlined !text-3xl ${showOnScreen ? 'text-primary' : 'text-slate-500'}`}>tv</span>
                        <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${showOnScreen ? 'text-white' : 'text-slate-500'}`}>Brilhar no Telão</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowOnScreen(false)}
                        className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all duration-300 ${!showOnScreen ? 'bg-orange-500/20 border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.15)]' : 'bg-white/5 border-white/5 opacity-30 grayscale'}`}
                      >
                        <span className={`material-symbols-outlined !text-3xl ${!showOnScreen ? 'text-orange-500' : 'text-slate-500'}`}>visibility_off</span>
                        <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${!showOnScreen ? 'text-white' : 'text-slate-500'}`}>Ficar no Privado</p>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-2">Legenda / Recado (Opcional)</label>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="w-full h-28 bg-white/5 border border-white/10 rounded-3xl p-6 text-white outline-none focus:ring-4 focus:ring-primary/20 transition-all text-sm leading-relaxed placeholder:text-slate-800 font-medium"
                      placeholder="Deixe uma mensagem especial para o telão..."
                    />
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={handleUpload}
                disabled={loading}
                className={`w-full py-6 text-white font-black rounded-3xl shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 uppercase tracking-[0.4em] italic ${showOnScreen ? 'bg-primary shadow-primary/30' : 'bg-orange-500 shadow-orange-500/30'}`}
              >
                {loading ? (
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>BRILHANDO...</span>
                  </div>
                ) : (
                  <>
                    <span className="material-symbols-outlined !text-xl">{showOnScreen ? 'send' : 'lock'}</span>
                    <span>FINALIZAR AGORA</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Passo 4: Sucesso */}
          {step === 4 && (
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-12 md:p-14 rounded-[4rem] flex flex-col items-center gap-10 text-center animate-in zoom-in-90 duration-700 shadow-2xl">
              <div className={`w-28 h-28 rounded-[3rem] flex items-center justify-center text-white shadow-2xl mb-4 relative ${showOnScreen ? 'bg-green-500 shadow-green-500/20' : 'bg-orange-500 shadow-orange-500/20'}`}>
                <span className="material-symbols-outlined !text-6xl italic">{showOnScreen ? 'star_rate' : 'verified_user'}</span>
                <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-white rounded-3xl flex items-center justify-center border-8 border-background-dark animate-bounce">
                  <span className={`material-symbols-outlined !text-xl ${showOnScreen ? 'text-green-500' : 'text-orange-500'}`}>celebration</span>
                </div>
              </div>

              <div>
                <h2 className="text-5xl font-black italic uppercase italic tracking-tighter leading-[0.8] mb-2">FENOMENAL!</h2>
                <p className="text-slate-500 mt-6 leading-relaxed font-medium">
                  {showOnScreen
                    ? 'Sua mídia foi enviada e está processando para aparecer no telão principal. Prepare-se para se ver ao vivo!'
                    : 'Registro concluído com sucesso. Sua imagem foi enviada privadamente apenas para os organizadores.'}
                </p>
              </div>

              <div className="flex flex-col w-full gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => { setStep(2); setFile(null); setPreview(null); setCaption(''); setShowOnScreen(true); }}
                  className="w-full py-6 bg-primary text-white font-black rounded-3xl shadow-2xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all uppercase tracking-[0.3em] italic"
                >
                  Capturar Novo Momento
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="py-5 text-slate-500 font-bold hover:text-white transition-all text-[11px] uppercase tracking-[0.5em] mt-2 opacity-50 hover:opacity-100"
                >
                  Minha Galeria Privada
                </button>
              </div>
            </div>
          )}

          {/* Passo 5: Minha Galeria */}
          {step === 5 && (
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-8 md:p-12 rounded-[3.5rem] flex flex-col gap-8 w-full shadow-2xl animate-in slide-in-from-bottom-12 duration-700">
              <div className="flex justify-between items-end border-b border-white/5 pb-6">
                <div>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Minha Coleção</h2>
                  <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] mt-3 italic">Seu histórico neste evento</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setStep(2); setFile(null); setPreview(null); }}
                  className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30 hover:rotate-90 active:scale-90 transition-all duration-500"
                >
                  <span className="material-symbols-outlined !text-2xl italic">add</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-3 custom-scrollbar mt-2">
                <GalleryGrid eventId={event?.id} userId={guestId} />
              </div>

              <button
                type="button"
                onClick={() => setStep(4)}
                className="py-5 text-slate-600 font-bold text-[11px] uppercase tracking-[0.6em] mt-4 hover:text-white transition-all opacity-40 hover:opacity-100"
              >
                Retornar
              </button>
            </div>
          )}
        </div>

        <footer className="mt-20 py-10 border-t border-white/5 w-full max-w-[350px] text-center flex flex-col items-center gap-5 opacity-40">
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-black uppercase tracking-[0.6em] text-slate-600">Core Experience</span>
            <div className="flex items-center gap-2 text-white">
              <span className="material-symbols-outlined !text-xl italic">auto_awesome_motion</span>
              <span className="text-[12px] font-black italic uppercase tracking-tighter">PicFest v2.0</span>
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5%); }
          50% { transform: translateY(0); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3.5s infinite ease-in-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(19, 182, 236, 0.4);
          border-radius: 10px;
        }
      `}</style>
    </div >
  );
};
