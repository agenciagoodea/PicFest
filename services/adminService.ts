import { supabase } from './supabaseClient';
import { Profile, Evento, Plano, Depoimento } from '../types';

export const adminService = {
    /**
     * Obter métricas globais da plataforma
     */
    getMetrics: async () => {
        try {
            // Disparar todas as consultas em paralelo para reduzir latência total
            const [usersRes, eventsRes, mediaRes, subsRes] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'organizador'),
                supabase.from('eventos').select('*', { count: 'exact', head: true }),
                supabase.from('midias').select('*', { count: 'exact', head: true }),
                supabase.from('assinaturas').select('*, planos(*)').eq('status', 'ativo')
            ]);

            const revenue = subsRes.data?.reduce((acc, sub: any) => acc + (sub.planos?.valor || 0), 0) || 0;

            return {
                totalUsers: usersRes.count || 0,
                totalEvents: eventsRes.count || 0,
                totalMedia: mediaRes.count || 0,
                revenue,
                activeSubscriptions: subsRes.data?.length || 0
            };
        } catch (error) {
            console.error('Erro ao buscar métricas:', error);
            return { totalUsers: 0, totalEvents: 0, totalMedia: 0, revenue: 0, activeSubscriptions: 0 };
        }
    },

    /**
     * Listar todos os usuários (organizadores e admins)
     */
    getAllUsers: async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Profile[];
    },

    /**
     * Atualizar role de um usuário
     */
    updateUserRole: async (userId: string, role: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', userId);

        if (error) throw error;
        return true;
    },

    /**
     * Listar todos os eventos da plataforma
     */
    getAllEvents: async () => {
        const { data, error } = await supabase
            .from('eventos')
            .select('*, organizador:profiles(nome)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as any as Evento[];
    },

    /**
     * Listar todos os planos
     */
    getAllPlans: async () => {
        const { data, error } = await supabase
            .from('planos')
            .select('*')
            .order('valor', { ascending: true });

        if (error) throw error;
        return data as Plano[];
    },

    /**
     * Atualizar plano
     */
    updatePlan: async (planId: string, updates: Partial<Plano>) => {
        const { error } = await supabase
            .from('planos')
            .update(updates)
            .eq('id', planId);

        if (error) throw error;
        return true;
    },

    /**
     * Criar novo plano
     */
    createPlan: async (plan: Partial<Plano>) => {
        const { data, error } = await supabase
            .from('planos')
            .insert(plan)
            .select()
            .single();

        if (error) throw error;
        return data as Plano;
    },

    /**
     * Excluir plano
     */
    deletePlan: async (planId: string) => {
        const { error } = await supabase
            .from('planos')
            .delete()
            .eq('id', planId);

        if (error) throw error;
        return true;
    },

    /**
     * Obter configurações da Landing Page
     */
    getLandingConfig: async () => {
        const { data, error } = await supabase
            .from('configuracao_geral')
            .select('*')
            .eq('id', 'landing_page')
            .maybeSingle();

        if (error) throw error;
        return data?.conteudo || null;
    },

    /**
     * Atualizar configurações da Landing Page
     */
    updateLandingConfig: async (conteudo: any) => {
        const { error } = await supabase
            .from('configuracao_geral')
            .upsert({ id: 'landing_page', conteudo, updated_at: new Date().toISOString() });

        if (error) throw error;
        return true;
    },

    /**
     * Obter uma configuração específica por ID
     */
    getConfig: async (id: string) => {
        const { data, error } = await supabase
            .from('configuracao_geral')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data?.conteudo || null;
    },

    /**
     * Atualizar uma configuração específica por ID
     */
    updateConfig: async (id: string, conteudo: any) => {
        const { error } = await supabase
            .from('configuracao_geral')
            .upsert({ id, conteudo, updated_at: new Date().toISOString() });

        if (error) throw error;
        return true;
    }
};
