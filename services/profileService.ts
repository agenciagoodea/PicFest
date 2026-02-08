import { supabase } from './supabaseClient';
import { Profile } from '../types';

export const profileService = {
    /**
     * Criar perfil de usuário
     */
    createProfile: async (profileData: Partial<Profile>) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .insert(profileData)
                .select()
                .single();

            if (error) throw error;
            return { data: data as Profile, error: null };
        } catch (error: any) {
            console.error('Erro ao criar perfil:', error);
            return { data: null, error: error.message };
        }
    },

    /**
     * Atualizar perfil
     */
    updateProfile: async (userId: string, updates: Partial<Profile>) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return { data: data as Profile, error: null };
        } catch (error: any) {
            console.error('Erro ao atualizar perfil:', error);
            return { data: null, error: error.message };
        }
    },

    getProfile: async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, nome, email, role, foto_perfil, instagram, created_at')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return { data: data as Profile, error: null };
        } catch (error: any) {
            console.error('Erro ao buscar perfil:', error);
            return { data: null, error: error.message };
        }
    },

    uploadProfilePhoto: async (userId: string, file: File) => {
        try {
            // Comprimir imagem antes do upload
            const { imageProcessor } = await import('../utils/imageProcessor');
            const compressedFile = await imageProcessor.compress(file, 400, 0.7); // Foto de perfil menor e mais leve

            const fileExt = compressedFile.name.split('.').pop() || 'jpg';
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `profiles/${fileName}`;

            // 1. Upload para o Storage
            const { error: uploadError } = await supabase.storage
                .from('midias')
                .upload(filePath, compressedFile, {
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            // 2. Obter URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('midias')
                .getPublicUrl(filePath);

            // 3. Atualizar perfil com a URL da foto (agora via RPC seguro)
            const { error: updateError } = await supabase.rpc('update_guest_photo', {
                p_guest_id: userId,
                p_photo_url: publicUrl
            });

            if (updateError) throw updateError;

            return { url: publicUrl, error: null };
        } catch (error: any) {
            console.error('Erro ao fazer upload da foto:', error);
            return { url: null, error: error.message };
        }
    },

    /**
     * Criar perfil de convidado (simplificado)
     */
    createGuestProfile: async (guestData: {
        nome: string;
        email: string;
        telefone?: string;
        instagram?: string;
    }) => {
        try {
            // Verificar se já existe um perfil com este email
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', guestData.email)
                .single();

            if (existing) {
                return { data: existing, error: null };
            }

            // Criar novo perfil de convidado
            const { data, error } = await supabase
                .from('profiles')
                .insert({
                    ...guestData,
                    role: 'convidado',
                })
                .select()
                .single();

            if (error) throw error;
            return { data: data as Profile, error: null };
        } catch (error: any) {
            console.error('Erro ao criar perfil de convidado:', error);
            return { data: null, error: error.message };
        }
    },

    /**
     * Buscar ou criar perfil de convidado (Via RPC Seguro)
     */
    getOrCreateGuestProfile: async (guestData: {
        nome: string;
        email: string;
        telefone?: string;
        instagram?: string;
    }) => {
        try {
            const { data, error } = await supabase.rpc('create_guest_profile', {
                p_nome: guestData.nome,
                p_email: guestData.email,
                p_telefone: guestData.telefone || null,
                p_instagram: guestData.instagram || null
            });

            if (error) throw error;
            return { data: data as Profile, error: null };
        } catch (error: any) {
            console.error('Erro ao buscar/criar perfil de convidado:', error);
            return { data: null, error: error.message };
        }
    },
};
