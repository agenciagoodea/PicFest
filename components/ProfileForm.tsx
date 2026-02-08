import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { supabaseService } from '../services/supabaseService';

export const ProfileForm: React.FC = () => {
    // Usamos 'profile' do contexto, pois ele contém os dados detalhados (CPF, WhatsApp, etc)
    const { profile, user } = useContext(AuthContext);

    const [formData, setFormData] = useState({
        nome: '',
        whatsapp: '',
        instagram: '',
        foto_perfil: '',
        data_nascimento: '',
        cpf: '',
        cep: '',
        endereco_logradouro: '',
        endereco_numero: '',
        endereco_complemento: '',
        endereco_bairro: '',
        endereco_cidade: '',
        endereco_estado: ''
    });
    const [loading, setLoading] = useState(false);
    const [cepLoading, setCepLoading] = useState(false);

    useEffect(() => {
        // Preenche o formulário quando o perfil é carregado
        if (profile) {
            setFormData({
                nome: profile.nome || '',
                whatsapp: profile.whatsapp || '',
                instagram: profile.instagram || '',
                foto_perfil: profile.foto_perfil || '',
                data_nascimento: profile.data_nascimento || '',
                cpf: profile.cpf || '',
                cep: profile.cep || '',
                endereco_logradouro: profile.endereco_logradouro || '',
                endereco_numero: profile.endereco_numero || '',
                endereco_complemento: profile.endereco_complemento || '',
                endereco_bairro: profile.endereco_bairro || '',
                endereco_cidade: profile.endereco_cidade || '',
                endereco_estado: profile.endereco_estado || ''
            });
        }
    }, [profile]);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setLoading(true);
        try {
            const { data, error } = await supabaseService.uploadProfilePhoto(user.id, file);

            if (error) throw error;

            setFormData(prev => ({ ...prev, foto_perfil: data.publicUrl }));
            alert('Foto enviada com sucesso! Clique em Atualizar Cadastro para salvar.');
        } catch (err: any) {
            console.error('Erro no upload:', err);
            alert('Erro ao enviar foto: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCepBlur = async () => {
        const cep = formData.cep.replace(/\D/g, '');
        if (cep.length !== 8) return;

        setCepLoading(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    endereco_logradouro: data.logradouro || '',
                    endereco_bairro: data.bairro || '',
                    endereco_cidade: data.localidade || '',
                    endereco_estado: data.uf || ''
                }));
            } else {
                alert('CEP não encontrado.');
            }
        } catch (err) {
            console.error('Erro ao buscar CEP:', err);
            alert('Erro ao buscar CEP. Verifique sua conexão.');
        } finally {
            setCepLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        try {
            // Limpar campos de texto para evitar erro de tipo no PostgREST
            const cleanData = {
                ...formData,
                cpf: formData.cpf.replace(/\D/g, ''),
                cep: formData.cep.replace(/\D/g, ''),
                whatsapp: formData.whatsapp.replace(/\D/g, ''),
                data_nascimento: formData.data_nascimento || null
            };

            await supabaseService.updateProfile(user.id, cleanData);
            alert('Perfil atualizado com sucesso!');
            window.location.reload();
        } catch (err: any) {
            console.error('Erro ao atualizar perfil:', err);
            alert('Erro ao atualizar perfil. Verifique se todos os campos estão corretos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-10 animate-in fade-in duration-500 max-w-5xl">
            <header>
                <h1 className="text-4xl font-black tracking-tight text-white">MEU CADASTRO</h1>
                <p className="text-slate-400 mt-1 uppercase text-[10px] font-black tracking-[0.2em]">Informações completas de identificação e localização.</p>
            </header>

            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                        {/* Foto de Perfil */}
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative group cursor-pointer w-48 h-48">
                                <div className="w-full h-full rounded-[3rem] border-4 border-primary/20 bg-white/5 group-hover:border-primary transition-all overflow-hidden shadow-2xl">
                                    <img
                                        src={formData.foto_perfil || `https://i.pravatar.cc/150?u=${user?.id}`}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                </div>
                                <div className="absolute inset-0 bg-black/60 rounded-[3rem] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white !text-4xl">add_a_photo</span>
                                </div>
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                />
                                <p className="mt-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Alterar Foto</p>
                            </div>
                        </div>

                        {/* Dados Pessoais */}
                        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="flex flex-col gap-2 col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    placeholder="Ex: Adriano Amorim Souza"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Data de Nascimento</label>
                                <input
                                    type="date"
                                    className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    value={formData.data_nascimento}
                                    onChange={e => setFormData({ ...formData, data_nascimento: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">CPF</label>
                                <input
                                    type="text"
                                    className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    value={formData.cpf}
                                    onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                                    placeholder="000.000.000-00"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">WhatsApp</label>
                                <input
                                    type="text"
                                    className="bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    value={formData.whatsapp}
                                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Instagram (Username)</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500">@</span>
                                    <input
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 pl-12 pr-6 text-white outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                        value={formData.instagram}
                                        onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                                        placeholder="seu_perfil"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Endereço */}
                    <div className="flex flex-col gap-10 pt-4">
                        <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-primary">location_on</span>
                            <h3 className="text-sm font-black uppercase tracking-widest text-primary">Endereço Completo</h3>
                            <div className="flex-1 h-[1px] bg-gradient-to-r from-primary/30 to-transparent"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-6">
                            <div className="flex flex-col gap-2 relative">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">CEP</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.cep}
                                        onChange={e => setFormData({ ...formData, cep: e.target.value })}
                                        onBlur={handleCepBlur}
                                        className="w-full bg-white/5 border border-white/10 h-14 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                        placeholder="00000-000"
                                    />
                                    {cepLoading && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Rua / Logradouro</label>
                                <input
                                    type="text"
                                    value={formData.endereco_logradouro}
                                    onChange={e => setFormData({ ...formData, endereco_logradouro: e.target.value })}
                                    className="bg-white/5 border border-white/10 h-14 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Número</label>
                                <input
                                    type="text"
                                    value={formData.endereco_numero}
                                    onChange={e => setFormData({ ...formData, endereco_numero: e.target.value })}
                                    className="bg-white/5 border border-white/10 h-14 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                />
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Complemento</label>
                                <input
                                    type="text"
                                    value={formData.endereco_complemento}
                                    onChange={e => setFormData({ ...formData, endereco_complemento: e.target.value })}
                                    className="bg-white/5 border border-white/10 h-14 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    placeholder="Apto, Bloco, etc."
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Bairro</label>
                                <input
                                    type="text"
                                    value={formData.endereco_bairro}
                                    onChange={e => setFormData({ ...formData, endereco_bairro: e.target.value })}
                                    className="bg-white/5 border border-white/10 h-14 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Cidade</label>
                                    <input
                                        type="text"
                                        value={formData.endereco_cidade}
                                        onChange={e => setFormData({ ...formData, endereco_cidade: e.target.value })}
                                        className="bg-white/5 border border-white/10 h-14 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">UF</label>
                                    <input
                                        type="text"
                                        value={formData.endereco_estado}
                                        onChange={e => setFormData({ ...formData, endereco_estado: e.target.value })}
                                        className="bg-white/5 border border-white/10 h-14 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-center"
                                        maxLength={2}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-white/5">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Salvando...' : 'Atualizar Cadastro'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
