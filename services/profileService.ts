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

    /**
     * Buscar perfil por ID
     */
    getProfile: async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return { data: data as Profile, error: null };
        } catch (error: any) {
            console.error('Erro ao buscar perfil:', error);
            return { data: null, error: error.message };
        }
    },

    /**
     * Upload de foto de perfil
     */
    uploadProfilePhoto: async (userId: string, file: File) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `profiles/${fileName}`;

            // 1. Upload para o Storage
            const { error: uploadError } = await supabase.storage
                .from('midias')
                .upload(filePath, file, {
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            // 2. Obter URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('midias')
                .getPublicUrl(filePath);

            // 3. Atualizar perfil com a URL da foto
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ foto_perfil: publicUrl })
                .eq('id', userId);

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
     * Buscar ou criar perfil de convidado
     */
    getOrCreateGuestProfile: async (guestData: {
        nome: string;
        email: string;
        telefone?: string;
        instagram?: string;
    }) => {
        try {
            // Tentar buscar perfil existente
            const { data: existing } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', guestData.email)
                .single();

            if (existing) {
                return { data: existing as Profile, error: null };
            }

            // Se não existir, criar novo
            return await profileService.createGuestProfile(guestData);
        } catch (error: any) {
            console.error('Erro ao buscar/criar perfil de convidado:', error);
            return { data: null, error: error.message };
        }
    },
};
