import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Midia } from '../types';

export const useRealtimeMedia = (eventId: string, approvedOnly: boolean = true) => {
    const [media, setMedia] = useState<Midia[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!eventId) return;

        // Carregar mídias iniciais
        loadMedia();

        // Subscribe para mudanças em tempo real
        const channel = supabase
            .channel(`media_${eventId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'midias',
                    filter: `evento_id=eq.${eventId}`,
                },
                async (payload) => {
                    // Buscar perfil do usuário que fez upload
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', payload.new.usuario_id)
                        .single();

                    const newMedia = { ...payload.new, perfil: profile } as Midia;

                    // Adicionar apenas se aprovado (ou se não estiver filtrando)
                    if (!approvedOnly || newMedia.aprovado) {
                        setMedia(prev => [newMedia, ...prev]);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'midias',
                    filter: `evento_id=eq.${eventId}`,
                },
                async (payload) => {
                    // Buscar perfil atualizado
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', payload.new.usuario_id)
                        .single();

                    const updatedMedia = { ...payload.new, perfil: profile } as Midia;

                    setMedia(prev => {
                        // Se foi aprovado, adicionar à lista
                        if (updatedMedia.aprovado && approvedOnly) {
                            const exists = prev.find(m => m.id === updatedMedia.id);
                            if (!exists) {
                                return [updatedMedia, ...prev];
                            }
                        }

                        // Atualizar mídia existente
                        return prev.map(m => m.id === updatedMedia.id ? updatedMedia : m);
                    });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'midias',
                    filter: `evento_id=eq.${eventId}`,
                },
                (payload) => {
                    setMedia(prev => prev.filter(m => m.id !== payload.old.id));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId, approvedOnly]);

    const loadMedia = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('midias')
                .select('*, perfil:profiles(*)')
                .eq('evento_id', eventId);

            if (approvedOnly) {
                query = query.eq('aprovado', true);
            }

            const { data, error: fetchError } = await query.order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setMedia(data as any as Midia[]);
        } catch (err: any) {
            setError(err.message);
            console.error('Erro ao carregar mídias:', err);
        } finally {
            setLoading(false);
        }
    };

    return {
        media,
        loading,
        error,
        refresh: loadMedia,
    };
};
