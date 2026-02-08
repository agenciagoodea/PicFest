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

            if (profileError) throw profileError;

            return { user: authData.user, session: authData.session, error: null };
        } catch (error: any) {
            console.error('Erro no registro:', error);
            return { user: null, session: null, error: error.message };
        }
    },

    /**
     * Fazer login
     */
    signIn: async (email: string, password: string) => {
        try {
            console.time('supabase_auth_signin');
            console.log('🚀 Iniciando tentativa de login para:', email);

            // Timeout de 30 segundos (aumentado de 10s)
            let timeoutId: any;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    console.warn('⚠️ Login atingiu timeout de 30s');
                    reject(new Error('Tempo limite de conexão excedido (30s). Verifique sua rede.'));
                }, 30000);
            });

            const signInPromise = supabase.auth.signInWithPassword({
                email,
                password,
            });

            // Corrida entre login e timeout
            const { data, error } = await (Promise.race([signInPromise, timeoutPromise]) as Promise<any>);

            // Limpar o timeout se o login terminou
            if (timeoutId) clearTimeout(timeoutId);

            console.timeEnd('supabase_auth_signin');

            if (error) {
                console.error('❌ Erro retornado pelo Supabase Auth:', error);
                throw error;
            }

            if (!data?.user) {
                throw new Error('Usuário não retornado após login bem-sucedido.');
            }

            console.time('fetch_profile');
            console.log('👤 Buscando perfil para ID:', data.user.id);
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();
            console.timeEnd('fetch_profile');

            if (profileError) {
                console.error('⚠️ Erro ao buscar perfil (o login continuará):', profileError);
                // Não travar login se perfil não carregar, mas logar erro
            } else {
                console.log('✅ Perfil carregado com sucesso');
            }

            return { user: data.user, profile, error: null };
        } catch (error: any) {
            console.timeEnd('supabase_auth_signin');
            console.error('🛑 Falha crítica no login:', error.message);
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
     * Permite passar uma sessão já existente para evitar chamadas redundantes
     */
    getCurrentUser: async (providedSession?: any) => {
        try {
            let session = providedSession;

            if (!session) {
                const sessionPromise = supabase.auth.getSession();

                // Timeout de 5 segundos para a sessão não travar o app inteiro
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('TIMEOUT_GET_SESSION')), 5000)
                );

                const { data, error: sessionError } = await (Promise.race([sessionPromise, timeoutPromise]) as Promise<any>);
                session = data?.session;

                if (sessionError || !session?.user) {
                    return { user: null, profile: null, error: null };
                }
            }

            const user = session.user;

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
            if (error.message !== 'TIMEOUT_GET_SESSION') {
                console.error('[authService] Erro em getCurrentUser:', error.message);
            }
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
