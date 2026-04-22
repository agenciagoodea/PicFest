import React, { useState, useEffect, useContext } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../../App';
import { profileService } from '../../services/profileService';
import { supabase } from '../../services/supabaseClient';
import { Profile } from '../../types';

export const ProfileView: React.FC = () => {
    const { profile, user } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<Partial<Profile>>({
        nome: '',
        bio: '',
        instagram: '',
        phone: '',
    });
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (profile) {
            setFormData({
                nome: profile.nome || '',
                bio: (profile as any).bio || '',
                instagram: profile.instagram || '',
                phone: (profile as any).phone || '',
            });
        }
    }, [profile]);

    const updateProfileMutation = useMutation({
        mutationFn: (updates: Partial<Profile>) => profileService.updateProfile(user!.id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
            alert('Perfil atualizado com sucesso!');
        },
        onError: (err: any) => alert('Erro ao atualizar: ' + err.message)
    });

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        try {
            const { url, error } = await profileService.uploadProfilePhoto(user.id, file);
            if (error) throw new Error(error);
            queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
            alert('Foto atualizada!');
        } catch (err: any) {
            alert('Erro no upload: ' + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!user?.email) return;
        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
            redirectTo: `${window.location.origin}/#/reset-password`,
        });
        if (error) alert('Erro: ' + error.message);
        else alert('Link de redefinição enviado para seu e-mail!');
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate(formData);
    };

    return (
        <div className="flex flex-col gap-10 animate-in fade-in duration-500 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 border-b border-white/5">
                <div>
                    <h1 className="text-4xl font-black tracking-tight italic uppercase text-white flex items-center gap-4">
                        <span className="material-symbols-outlined text-primary !text-4xl">account_circle</span>
                        Meu Perfil
                    </h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                        Gerencie sua identidade na plataforma PicFest
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* LADO ESQUERDO: FOTO E RESUMO */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] flex flex-col items-center text-center gap-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/20 to-transparent"></div>
                        
                        <div className="relative group cursor-pointer mt-8">
                            <div className="w-40 h-40 rounded-[3rem] border-4 border-primary/20 bg-slate-800 overflow-hidden relative z-10 shadow-2xl transition-transform group-hover:scale-105 duration-300">
                                {isUploading ? (
                                    <div className="w-full h-full flex items-center justify-center bg-black/50">
                                        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    </div>
                                ) : profile?.foto_perfil ? (
                                    <img src={profile.foto_perfil} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                                        <span className="material-symbols-outlined text-5xl text-slate-700">person</span>
                                    </div>
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl border-4 border-slate-900 z-20 cursor-pointer hover:rotate-12 transition-transform">
                                <span className="material-symbols-outlined text-white text-sm">photo_camera</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                            </label>
                        </div>

                        <div className="z-10">
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{profile?.nome || 'Usuário'}</h3>
                            <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-1">{profile?.role}</p>
                        </div>

                        <div className="w-full pt-6 border-t border-white/5 flex flex-col gap-4">
                            <div className="flex justify-between items-center px-4">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail</span>
                                <span className="text-xs text-white font-medium">{profile?.email}</span>
                            </div>
                            <div className="flex justify-between items-center px-4">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Membro desde</span>
                                <span className="text-xs text-white font-medium">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '---'}</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleResetPassword}
                        className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                    >
                        <span className="material-symbols-outlined text-sm">lock_reset</span>
                        Redefinir Senha
                    </button>
                </div>

                {/* LADO DIREITO: FORMULÁRIO */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSave} className="bg-white/5 border border-white/10 p-10 rounded-[3rem] flex flex-col gap-8 shadow-2xl relative">
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                            <span className="w-2 h-8 bg-primary rounded-full"></span>
                            Dados Pessoais
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Nome Completo</label>
                                <input 
                                    type="text"
                                    value={formData.nome}
                                    onChange={e => setFormData({...formData, nome: e.target.value})}
                                    className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white text-sm outline-none focus:border-primary transition-all"
                                    placeholder="Seu nome"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Instagram (@)</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 font-black text-xs">@</span>
                                    <input 
                                        type="text"
                                        value={formData.instagram}
                                        onChange={e => setFormData({...formData, instagram: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 pl-10 pr-6 text-white text-sm outline-none focus:border-primary transition-all"
                                        placeholder="seu_user"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">WhatsApp / Telefone</label>
                                <input 
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white text-sm outline-none focus:border-primary transition-all"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Bio / Descrição</label>
                            <textarea 
                                value={formData.bio}
                                onChange={e => setFormData({...formData, bio: e.target.value})}
                                className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-sm outline-none focus:border-primary transition-all h-32 resize-none leading-relaxed"
                                placeholder="Conte um pouco sobre você ou sua empresa de eventos..."
                            />
                        </div>

                        <div className="flex justify-end mt-4">
                            <button 
                                type="submit"
                                disabled={updateProfileMutation.isPending}
                                className="px-12 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
