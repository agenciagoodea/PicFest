import { supabase } from './supabaseClient';
import { Profile, Evento, Plano, Depoimento } from '../types';

export const adminService = {
    /**
     * Obter métricas globais da plataforma
     */
    getMetrics: async () => {
        try {
            const [usersRes, eventsRes, mediaRes, subsRes, paymentsRes] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'organizador'),
                supabase.from('eventos').select('*', { count: 'exact', head: true }),
                supabase.from('midias').select('*', { count: 'exact', head: true }),
                supabase.from('subscriptions').select('*', { count: 'exact' }).eq('status', 'active'),
                supabase.from('payments').select('amount').eq('status', 'approved')
            ]);

            const revenue = paymentsRes.data?.reduce((acc, pay: any) => acc + (pay.amount || 0), 0) || 0;

            return {
                totalUsers: usersRes.count || 0,
                totalEvents: eventsRes.count || 0,
                totalMedia: mediaRes.count || 0,
                revenue,
                activeSubscriptions: subsRes.count || 0
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
    },
    
    /**
     * Excluir usuário permanentemente (Auth + Profile)
     */
    deleteUser: async (userId: string) => {
        const { data: { session } } = await supabase.auth.getSession();

        const { data, error } = await supabase.functions.invoke('admin-delete-user', {
            body: { userId },
            headers: session ? {
                Authorization: `Bearer ${session.access_token}`
            } : {}
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
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
            .from('plans')
            .select('*')
            .order('price', { ascending: true });

        if (error) throw error;
        return data as Plano[];
    },

    /**
     * Atualizar plano
     */
    updatePlan: async (planId: string, updates: Partial<Plano>) => {
        const { error } = await supabase
            .from('plans')
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
            .from('plans')
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
            .from('plans')
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
    },
    /**
     * Sincronizar um pagamento manualmente via Edge Function
     */
    syncMercadoPago: async (paymentId: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        
        const { data, error } = await supabase.functions.invoke('sync-mercadopago', {
            body: { paymentId },
            headers: session ? {
                Authorization: `Bearer ${session.access_token}`
            } : {}
        });

        if (error) throw error;
        return data;
    }
};
