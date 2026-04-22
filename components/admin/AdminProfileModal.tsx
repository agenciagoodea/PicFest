import React, { useState, useContext, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '../../services/supabaseService';
import { supabase } from '../../services/supabaseClient';
import { AuthContext } from '../../App';

interface AdminProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({ isOpen, onClose }) => {
    const { profile, user } = useContext(AuthContext);
    const queryClient = useQueryClient();

    const [nome, setNome] = useState('');
    const [instagram, setInstagram] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [fotoFile, setFotoFile] = useState<File | null>(null);
    const [fotoPreview, setFotoPreview] = useState<string | null>(null);

    useEffect(() => {
        if (profile) {
            setNome(profile.nome || '');
            setInstagram(profile.instagram || '');
            setFotoPreview(profile.foto_perfil || null);
        }
    }, [profile, isOpen]);

    const updateProfileMutation = useMutation({
        mutationFn: async () => {
            if (!user) throw new Error('Usuário não autenticado');

            // 1. Atualizar foto se existir
            let fotoUrl = profile?.foto_perfil;
            if (fotoFile) {
                const result = await supabaseService.uploadProfilePhoto(user.id, fotoFile);
                if (result.error) throw new Error(result.error);
                if (result.data?.publicUrl) fotoUrl = result.data.publicUrl;
            }

            // 2. Atualizar perfil
            await supabaseService.updateProfile(user.id, {
                nome,
                instagram,
                foto_perfil: fotoUrl
            });

            // 3. Atualizar senha se fornecida
            if (senha) {
                if (senha !== confirmarSenha) throw new Error('As senhas não coincidem');
                const { error } = await supabase.auth.updateUser({ password: senha });
                if (error) throw error;
            }

            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            // Força um recarregamento da janela para atualizar o contexto (simples)
            window.location.reload();
        },
        onError: (err: any) => {
            alert(`Erro ao atualizar perfil: ${err.message}`);
        }
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#111] border border-white/10 p-8 rounded-[2rem] w-full max-w-lg shadow-2xl relative">
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">close</span>
                </button>

                <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-6">Meu Perfil</h2>

                <form onSubmit={handleSave} className="flex flex-col gap-6">
                    {/* Foto de Perfil */}
                    <div className="flex items-center gap-6">
                        <div className="relative group w-20 h-20 shrink-0">
                            <div className="w-full h-full rounded-full border-2 border-primary/50 overflow-hidden bg-black flex items-center justify-center">
                                {fotoPreview ? (
                                    <img src={fotoPreview} className="w-full h-full object-cover" alt="Perfil" />
                                ) : (
                                    <span className="material-symbols-outlined text-3xl text-slate-500">person</span>
                                )}
                            </div>
                            <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
                                Editar
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setFotoFile(file);
                                            setFotoPreview(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                            </label>
                        </div>
                        <div className="flex flex-col">
                            <p className="text-sm font-bold text-white">Avatar</p>
                            <p className="text-[10px] text-slate-400">Clique na imagem para alterar</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Nome</label>
                        <input
                            type="text"
                            required
                            className="bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white outline-none focus:border-primary transition-all text-sm font-bold"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">E-mail (Leitura)</label>
                        <input
                            type="text"
                            disabled
                            className="bg-black/50 border border-white/5 rounded-2xl h-12 px-4 text-slate-500 cursor-not-allowed text-sm"
                            value={user?.email || ''}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Instagram (Opcional)</label>
                        <input
                            type="text"
                            className="bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-primary outline-none focus:border-primary transition-all text-sm font-mono"
                            value={instagram}
                            placeholder="@seu.instagram"
                            onChange={(e) => setInstagram(e.target.value)}
                        />
                    </div>

                    <div className="border-t border-white/10 pt-6 mt-2 flex flex-col gap-6">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Alterar Senha</p>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Nova Senha</label>
                                <input
                                    type="password"
                                    className="bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white outline-none focus:border-primary transition-all text-sm"
                                    value={senha}
                                    placeholder="Deixe em branco p/ manter"
                                    onChange={(e) => setSenha(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Confirmar</label>
                                <input
                                    type="password"
                                    className="bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white outline-none focus:border-primary transition-all text-sm"
                                    value={confirmarSenha}
                                    onChange={(e) => setConfirmarSenha(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={updateProfileMutation.isPending || (!!senha && senha !== confirmarSenha)}
                        className="w-full mt-4 bg-primary text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/80 transition-all disabled:opacity-50"
                    >
                        {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar Perfil'}
                    </button>
                </form>
            </div>
        </div>
    );
};
