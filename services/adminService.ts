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
            .order('sort_order', { ascending: true })
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
     * Duplicar um plano existente
     */
    duplicatePlan: async (planId: string) => {
        // Busca o plano original
        const { data: originalPlan, error: fetchError } = await supabase
            .from('plans')
            .select('*')
            .eq('id', planId)
            .single();

        if (fetchError || !originalPlan) throw new Error('Plano original não encontrado');

        // Cria a cópia removendo id e created_at, ajustando name, slug e is_active
        const { id, created_at, ...planToCopy } = originalPlan;
        
        const duplicatedPlan = {
            ...planToCopy,
            name: `${planToCopy.name} (Cópia)`,
            slug: `${planToCopy.slug}-copia-${Date.now()}`,
            is_active: false // Cópias começam desativadas
        };

        const { data, error: insertError } = await supabase
            .from('plans')
            .insert(duplicatedPlan)
            .select()
            .single();

        if (insertError) throw insertError;
        return data as Plano;
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
    },

    // ==========================================
    // ADICIONAIS (ADDONS)
    // ==========================================

    /**
     * Listar todos os adicionais catalogados
     */
    getAllAddons: async () => {
        const { data, error } = await supabase
            .from('plan_addons_catalog')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * Criar um novo adicional
     */
    createAddon: async (addon: any) => {
        const { data, error } = await supabase
            .from('plan_addons_catalog')
            .insert(addon)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Atualizar adicional existente
     */
    updateAddon: async (id: string, updates: any) => {
        const { data, error } = await supabase
            .from('plan_addons_catalog')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Excluir logica ou fisicamente um adicional (embora haja constraints em compras, tentaremos delete)
     */
    deleteAddon: async (id: string) => {
        const { error } = await supabase
            .from('plan_addons_catalog')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // ==========================================
    // LIVRO DE ASSINATURAS (GUESTBOOK)
    // ==========================================

    /**
     * Buscar todos os convidados que assinaram o livro de um evento
     */
    getGuestbook: async (eventoId: string) => {
        const { data, error } = await supabase
            .from('event_guestbook')
            .select('*')
            .eq('evento_id', eventoId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // ==========================================
    // EMAIL & SMTP
    // ==========================================

    /**
     * Obter templates de e-mail
     */
    getEmailTemplates: async () => {
        const { data, error } = await supabase
            .from('email_templates')
            .select('*')
            .order('slug', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * Atualizar template de e-mail
     */
    updateEmailTemplate: async (id: string, updates: any) => {
        const { data, error } = await supabase
            .from('email_templates')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Limpeza de dados de teste (Planos e Assinaturas órfãs)
     * Estratégia segura: verifica FKs antes de deletar
     */
    cleanupTestData: async () => {
        try {
            // 1. Buscar planos de teste candidatos à remoção
            const { data: oldPlans, error: fetchError } = await supabase
                .from('plans')
                .select('id, name, slug')
                .in('slug', ['starter', 'premium', 'teste', 'test-plan', 'gratuito', 'basico', 'pro'])
                .eq('is_active', false); // Só remove planos JÁ desativados

            if (fetchError) throw fetchError;
            if (!oldPlans || oldPlans.length === 0) return { success: true, deletedCount: 0 };

            const planIds = oldPlans.map(p => p.id);

            // 2. Verificar quais têm assinaturas ATIVAS vinculadas (não podemos deletar esses)
            const { data: activeSubs } = await supabase
                .from('subscriptions')
                .select('plan_id')
                .in('plan_id', planIds)
                .eq('status', 'active');

            const blockedPlanIds = new Set((activeSubs || []).map((s: any) => s.plan_id));
            const deletablePlanIds = planIds.filter(id => !blockedPlanIds.has(id));

            if (deletablePlanIds.length === 0) {
                return {
                    success: false,
                    deletedCount: 0,
                    error: `${blockedPlanIds.size} plano(s) possuem assinaturas ativas e não podem ser removidos.`
                };
            }

            // 3. Desassociar subscriptions e payments INATIVAS/CANCELADAS desses planos antes de deletar
            await supabase
                .from('subscriptions')
                .update({ plan_id: null } as any)
                .in('plan_id', deletablePlanIds)
                .neq('status', 'active'); // Apenas as não ativas

            // 4. Deletar planos que não têm assinaturas ativas
            const { count, error: deleteError } = await supabase
                .from('plans')
                .delete({ count: 'exact' })
                .in('id', deletablePlanIds);

            if (deleteError) throw deleteError;

            const skippedCount = blockedPlanIds.size;
            return {
                success: true,
                deletedCount: count || 0,
                skippedCount,
                message: skippedCount > 0
                    ? `${count || 0} removidos. ${skippedCount} ignorados (têm assinaturas ativas).`
                    : `${count || 0} planos de teste removidos com sucesso.`
            };
        } catch (error: any) {
            console.error('Erro na limpeza:', error);
            return { success: false, deletedCount: 0, error: error.message };
        }
    }
};
