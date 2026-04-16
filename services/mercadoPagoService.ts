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
    async createPayment(planId: string, paymentData: {
        paymentMethod: 'pix' | 'credit_card' | 'debit_card';
        cardToken?: string;
        email: string;
        installments?: number;
        payer?: {
            first_name: string;
            last_name: string;
            identification: {
                type: string;
                number: string;
            };
        };
    }) {
        console.log(`Iniciando pagamento para o plano: ${planId}`, paymentData);

        const { data, error } = await supabase.functions.invoke('mercadopago-payment', {
            body: {
                planId,
                ...paymentData
            }
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
