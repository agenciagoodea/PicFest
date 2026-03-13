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

            const profile: Profile = {
                id: authData.user.id,
                email,
                nome: userData.nome,
                role: userData.role || 'organizador',
                created_at: new Date().toISOString()
            };

            return { user: authData.user, session: authData.session, profile, error: null };
        } catch (error: any) {
            console.error('Erro no registro:', error);
            return { user: null, session: null, profile: null, error: error.message };
        }
    },

    /**
     * Fazer login
     */
    signIn: async (email: string, password: string) => {
        try {
            console.time('auth_total_flow');
            console.log('🚀 Iniciando login para:', email);

            // Chamada direta do Supabase Auth
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('❌ Erro Supabase Auth:', error);
                throw error;
            }

            if (!data?.user) {
                throw new Error('Usuário não retornado após login.');
            }

            // Busca de perfil otimizada - disparada imediatamente
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (profileError) {
                console.warn('⚠️ Perfil não encontrado ou erro na busca:', profileError.message);
            }

            console.timeEnd('auth_total_flow');
            return { user: data.user, profile, error: null };
        } catch (error: any) {
            console.timeEnd('auth_total_flow');
            console.error('🛑 Falha no login:', error.message);
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
     * Obter usuário e perfil atual de forma eficiente
     */
    getCurrentUser: async (providedSession?: any) => {
        try {
            let session = providedSession;

            if (!session) {
                const { data } = await supabase.auth.getSession();
                session = data?.session;
            }

            if (!session?.user) {
                return { user: null, profile: null, error: null };
            }

            const user = session.user;

            // Busca perfil apenas se necessário
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) {
                return { user, profile: null, error: null };
            }

            return { user, profile: profile as Profile, error: null };
        } catch (error: any) {
            console.error('[authService] Erro em getCurrentUser:', error.message);
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
