import { supabase } from './supabaseClient';

/**
 * SERVIÇO DE INTEGRAÇÃO MERCADO PAGO
 * Este serviço gerencia a criação de pagamentos via Edge Functions.
 */

export const mercadoPagoService = {
    /**
     * Iniciar processo de pagamento (Pix ou Cartão)
     * @param planId ID do plano
     * @param paymentData Dados do pagamento (method, cardToken, etc)
     */
    /**
     * Iniciar processo de pagamento (Pix ou Cartão)
     */
    async createPayment(itemId: string, paymentData: {
        purchaseType?: 'plan' | 'addon';
        addonId?: string;
        eventoId?: string;
        paymentMethod: 'pix' | 'credit_card' | 'debit_card';
        cardToken?: string;
        email: string;
        installments?: number;
        deviceId?: string;
        payer?: {
            first_name: string;
            last_name: string;
            identification: {
                type: string;
                number: string;
            };
        };
    }) {
        const { purchaseType = 'plan' } = paymentData;
        console.log(`Iniciando pagamento [${purchaseType}]: ${itemId}`, paymentData);

        const { data: { session } } = await supabase.auth.getSession();
        
        const { data, error } = await supabase.functions.invoke('mercadopago-payment', {
            body: {
                purchaseType,
                planId: purchaseType === 'plan' ? itemId : undefined,
                addonId: paymentData.addonId,
                eventoId: paymentData.eventoId,
                ...paymentData
            },
            headers: session ? {
                Authorization: `Bearer ${session.access_token}`
            } : {}
        });

        if (error) {
            console.error('Erro na Edge Function:', error);
            throw error;
        }

        return data;
    },

    /**
     * Consultar status de um pagamento localmente
     * @param paymentId ID do pagamento no Mercado Pago
     */
    async getPaymentStatus(paymentId: string) {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('mercado_pago_payment_id', paymentId)
            .single();

        if (error) throw error;
        return data;
    }
};
