import { supabase } from './supabaseClient';
import { Profile } from '../types';

export const authService = {
    /**
     * Registrar novo usuário
     */
    signUp: async (email: string, password: string, userData: { nome: string; role?: 'organizador' | 'convidado' }) => {
        try {
            // 1. Criar usuário no Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Falha ao criar usuário');

            // 2. Criar perfil na tabela profiles
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    email,
                    nome: userData.nome,
                    role: userData.role || 'organizador',
                });

            if (profileError) throw profileError;

            return { user: authData.user, error: null };
        } catch (error: any) {
            console.error('Erro no registro:', error);
            return { user: null, error: error.message };
        }
    },

    /**
     * Fazer login
     */
    signIn: async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Buscar perfil do usuário
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            return { user: data.user, profile, error: null };
        } catch (error: any) {
            console.error('Erro no login:', error);
            return { user: null, profile: null, error: error.message };
        }
    },

    /**
     * Fazer logout
     */
    signOut: async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { error: null };
        } catch (error: any) {
            console.error('Erro no logout:', error);
            return { error: error.message };
        }
    },

    /**
     * Obter usuário atual
     */
    getCurrentUser: async () => {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError) throw authError;
            if (!user) return { user: null, profile: null, error: null };

            // Buscar perfil
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;

            return { user, profile: profile as Profile, error: null };
        } catch (error: any) {
            console.error('Erro ao buscar usuário:', error);
            return { user: null, profile: null, error: error.message };
        }
    },

    /**
     * Obter sessão atual
     */
    getSession: async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            return { session, error: null };
        } catch (error: any) {
            return { session: null, error: error.message };
        }
    },

    /**
     * Listener de mudanças de autenticação
     */
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
        return subscription;
    },

    /**
     * Resetar senha
     */
    resetPassword: async (email: string) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            return { error: null };
        } catch (error: any) {
            return { error: error.message };
        }
    },

    /**
     * Atualizar senha
     */
    updatePassword: async (newPassword: string) => {
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (error) throw error;
            return { error: null };
        } catch (error: any) {
            return { error: error.message };
        }
    },
};
