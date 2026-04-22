import { supabase } from './supabaseClient';

export interface EmailPayload {
    to: string;
    subject: string;
    html: string;
    template_slug?: string;
    variables?: Record<string, any>;
}

export const emailService = {
    /**
     * Enviar email via Edge Function
     */
    sendEmail: async (payload: EmailPayload) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            const { data, error } = await supabase.functions.invoke('send-email', {
                body: payload,
                headers: session ? {
                    Authorization: `Bearer ${session.access_token}`
                } : {}
            });

            if (error) throw error;
            return { success: true, data };
        } catch (error: any) {
            console.error('Erro ao enviar e-mail:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Enviar notificação de novo evento para o organizador
     */
    notifyNewEvent: async (organizadorEmail: string, eventName: string, eventSlug: string) => {
        return emailService.sendEmail({
            to: organizadorEmail,
            subject: `Seu evento "${eventName}" foi criado com sucesso!`,
            template_slug: 'new-event-organizer',
            variables: { eventName, eventSlug },
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h1 style="color: #ff3366;">Olá!</h1>
                    <p>Seu evento <b>${eventName}</b> já está pronto para brilhar.</p>
                    <p>Link para convidados: <a href="https://picfest.app/#/evento/${eventSlug}">picfest.app/#/evento/${eventSlug}</a></p>
                    <hr />
                    <p style="font-size: 12px; color: #999;">Equipe PicFest</p>
                </div>
            `
        });
    }
};
