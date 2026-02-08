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

        // Implementar Polling como fallback (segurança caso o Realtime falhe devido a limites de uso)
        const pollingInterval = setInterval(() => {
            console.log('🔄 [Polling] Verificando novas mídias...');
            loadMedia(true); // true para loading silencioso
        }, 15000); // A cada 15 segundos

        // Canal de Realtime
        const canalNome = `media_changes_${eventId}`;

        const channel = supabase
            .channel(canalNome, {
                config: {
                    broadcast: { self: true },
                    presence: { key: eventId },
                }
            })
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'midias',
                    filter: `evento_id=eq.${eventId}`,
                },
                (payload) => {
                    console.log('✨ [Realtime] Nova mídia recebida via INSERT:', payload.new.id);
                    const newMedia = payload.new as Midia;

                    if (!approvedOnly || newMedia.aprovado) {
                        setMedia(prev => {
                            if (prev.some(m => m.id === newMedia.id)) return prev;
                            return [newMedia, ...prev];
                        });

                        // Buscar perfil sem travar a thread
                        supabase.from('profiles').select('*').eq('id', newMedia.usuario_id).single()
                            .then(({ data }) => {
                                if (data) {
                                    setMedia(current => current.map(m => m.id === newMedia.id ? { ...m, perfil: data } : m));
                                }
                            });
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
                (payload) => {
                    console.log('🔄 [Realtime] Mídia atualizada:', payload.new.id);
                    const updatedMedia = payload.new as Midia;
                    setMedia(prev => {
                        const exists = prev.some(m => m.id === updatedMedia.id);
                        if (updatedMedia.aprovado && approvedOnly && !exists) return [updatedMedia, ...prev];
                        if (!updatedMedia.aprovado && approvedOnly && exists) return prev.filter(m => m.id !== updatedMedia.id);
                        return prev.map(m => m.id === updatedMedia.id ? { ...m, ...updatedMedia } : m);
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
                    console.log('🗑️ [Realtime] Mídia removida:', payload.old.id);
                    setMedia(prev => prev.filter(m => m.id !== payload.old.id));
                }
            )
            .subscribe(async (status) => {
                console.log(`📡 [Realtime] Status do Canal ${eventId}:`, status);
                if (status === 'CHANNEL_ERROR') {
                    console.warn('⚠️ [Realtime] Erro no canal. O projeto pode estar excedendo limites de uso.');
                }
            });

        return () => {
            supabase.removeChannel(channel);
            clearInterval(pollingInterval);
        };
    }, [eventId, approvedOnly]);

    const loadMedia = async (silent: boolean = false) => {
        try {
            if (!silent) setLoading(true);
            let query = supabase
                .from('midias')
                .select('*, perfil:profiles(*)')
                .eq('evento_id', eventId);

            if (approvedOnly) {
                query = query.eq('aprovado', true);
            }

            const { data, error: fetchError } = await query.order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            // Se for carregamento silencioso, apenas atualizar as que não temos ou se mudou algo
            if (silent) {
                setMedia(prev => {
                    const newData = data as any as Midia[];
                    // Se o primeiro item mudou, significa que tem mídia nova
                    if (newData.length > 0 && prev.length > 0 && newData[0].id !== prev[0].id) {
                        console.log('🔄 [Polling] Novas mídias encontradas!');
                        return newData;
                    }
                    // Se o tamanho mudou, atualizar
                    if (newData.length !== prev.length) return newData;
                    return prev;
                });
            } else {
                setMedia(data as any as Midia[]);
            }
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
