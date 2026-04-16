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
                .maybeSingle();

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
     * Resgate automático: Cria um perfil básico para um usuário que existe no Auth mas não no Profiles.
     * Opera em 3 estágios para ser completamente resiliente a qualquer conflito.
     */
    createProfile: async (user: any, userData: { nome: string; role?: string }) => {
        try {
            // ESTÁGIO 1: Tenta ler o perfil existente por ID
            // (funciona agora que o RLS está corrigido)
            const { data: existingById } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (existingById) {
                console.log('[authService] ✅ Perfil encontrado via leitura direta.');
                return { profile: existingById, error: null };
            }

            // ESTÁGIO 2: Perfil não encontrado — insere silenciosamente.
            // ignoreDuplicates=true usa ON CONFLICT DO NOTHING no PostgreSQL,
            // garantindo que NENHUMA constraint (id ou email) vai lançar erro.
            await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: user.email,
                    nome: userData.nome,
                    role: userData.role || 'organizador',
                }, { onConflict: 'id', ignoreDuplicates: true });

            // ESTÁGIO 3: Lê o perfil (seja o recém-criado ou o existente ignorado)
            const { data: finalProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            console.log('[authService] 🚑 Perfil de resgate finalizado:', !!finalProfile);
            return { profile: finalProfile, error: null };
        } catch (error: any) {
            console.error('🛑 Falha crítica no resgate de perfil:', error.message);
            return { profile: null, error: error.message };
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
     * Obter usuário e perfil atual — usa RPC com SECURITY DEFINER como método primário
     * para bypass total de qualquer bloqueio de RLS.
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

            // Método primário: RPC com SECURITY DEFINER (bypass total de RLS)
            const { data: rpcProfile, error: rpcError } = await supabase
                .rpc('get_own_profile')
                .maybeSingle();

            if (!rpcError && rpcProfile) {
                console.timeEnd('auth_total_flow');
                return { user, profile: rpcProfile as Profile, error: null };
            }

            // Fallback: busca direta por ID (funciona se RLS estiver corretamente configurado)
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            console.timeEnd('auth_total_flow');
            return { user, profile: (profile as Profile) ?? null, error: null };
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
