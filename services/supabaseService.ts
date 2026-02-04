
import { Evento, Midia, Profile, Plano, Depoimento } from '../types';
import { supabase } from './supabaseClient';
import { storageService } from './storageService';

export const supabaseService = {
  // ============================================
  // EVENTOS
  // ============================================

  getEvents: async (): Promise<Evento[]> => {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }
    return data as Evento[];
  },

  getEventBySlug: async (slug: string): Promise<Evento | undefined> => {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('slug_curto', slug)
      .single();

    if (error) {
      console.error('Error fetching event by slug:', error);
      return undefined;
    }
    return data as Evento;
  },

  getEventsByOrganizer: async (organizadorId: string): Promise<Evento[]> => {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('organizador_id', organizadorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching organizer events:', error);
      return [];
    }
    return data as Evento[];
  },

  createEvent: async (eventData: Partial<Evento>): Promise<Evento | null> => {
    const { data, error } = await supabase
      .from('eventos')
      .insert(eventData)
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return null;
    }
    return data as Evento;
  },

  updateEvent: async (eventId: string, updates: Partial<Evento>): Promise<Evento | null> => {
    const { data, error } = await supabase
      .from('eventos')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      return null;
    }
    return data as Evento;
  },

  deleteEvent: async (eventId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('eventos')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Error deleting event:', error);
      return false;
    }
    return true;
  },

  getEventStats: async (eventId: string) => {
    // Contar mídias totais
    const { count: totalMedia } = await supabase
      .from('midias')
      .select('*', { count: 'exact', head: true })
      .eq('evento_id', eventId);

    // Contar mídias aprovadas
    const { count: approvedMedia } = await supabase
      .from('midias')
      .select('*', { count: 'exact', head: true })
      .eq('evento_id', eventId)
      .eq('aprovado', true);

    // Contar mídias pendentes
    const { count: pendingMedia } = await supabase
      .from('midias')
      .select('*', { count: 'exact', head: true })
      .eq('evento_id', eventId)
      .eq('aprovado', false);

    return {
      totalMedia: totalMedia || 0,
      approvedMedia: approvedMedia || 0,
      pendingMedia: pendingMedia || 0,
    };
  },

  // ============================================
  // MÍDIAS
  // ============================================

  getMediaByEvent: async (eventId: string, approvedOnly: boolean = true): Promise<Midia[]> => {
    let query = supabase
      .from('midias')
      .select('*, perfil:profiles(*)')
      .eq('evento_id', eventId);

    if (approvedOnly) {
      query = query.eq('aprovado', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching media:', error);
      return [];
    }
    return data as any as Midia[];
  },

  uploadMedia: async (
    eventId: string,
    userId: string,
    file: File,
    caption: string,
    showOnScreen: boolean = true
  ): Promise<Midia | null> => {
    try {
      // 1. Upload para o Storage
      const uploadResult = await storageService.uploadEventMedia(eventId, file);

      if (uploadResult.error || !uploadResult.data) {
        throw new Error(uploadResult.error || 'Erro no upload');
      }

      // 2. Salvar no banco de dados
      const { data, error: dbError } = await supabase
        .from('midias')
        .insert({
          evento_id: eventId,
          usuario_id: userId,
          tipo: file.type.startsWith('video') ? 'video' : 'foto',
          legenda: caption,
          url: uploadResult.data.publicUrl,
          aprovado: showOnScreen, // Se showOnScreen for true, já aprova automaticamente
        })
        .select('*, perfil:profiles(*)')
        .single();

      if (dbError) {
        console.error('Error saving media record:', dbError);
        return null;
      }

      return data as any as Midia;
    } catch (error) {
      console.error('Error uploading media:', error);
      return null;
    }
  },

  subscribeToMedia: (eventId: string, callback: (payload: Midia) => void) => {
    const channel = supabase
      .channel(`media_changes_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'midias',
          filter: `evento_id=eq.${eventId}`,
        },
        async (payload) => {
          // Se for inserção, buscamos o perfil para completar o objeto Midia
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.usuario_id)
            .single();

          callback({ ...payload.new, perfil: profile } as any as Midia);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // ============================================
  // DEPOIMENTOS
  // ============================================

  getTestimonials: async (approvedOnly: boolean = true): Promise<Depoimento[]> => {
    let query = supabase
      .from('depoimentos')
      .select('*');

    if (approvedOnly) {
      query = query.eq('aprovado', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching testimonials:', error);
      return [];
    }
    return data as Depoimento[];
  },

  createTestimonial: async (testimonial: Partial<Depoimento>): Promise<void> => {
    const { error } = await supabase
      .from('depoimentos')
      .insert(testimonial);

    if (error) {
      console.error('Error creating testimonial:', error);
      throw error;
    }
  },

  updateTestimonialApproval: async (id: string, approved: boolean): Promise<void> => {
    const { error } = await supabase
      .from('depoimentos')
      .update({ aprovado: approved })
      .eq('id', id);

    if (error) {
      console.error('Error updating testimonial:', error);
      throw error;
    }
  },

  // ============================================
  // PLANOS
  // ============================================

  getPlans: async (): Promise<Plano[]> => {
    const { data, error } = await supabase
      .from('planos')
      .select('*')
      .eq('ativo', true)
      .order('valor', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      return [];
    }
    return data as Plano[];
  },

  /**
   * Aprovar ou reprovar uma mídia
   */
  async approveMedia(mediaId: string, approved: boolean = true) {
    const { data, error } = await supabase
      .from('midias')
      .update({ aprovado: approved })
      .eq('id', mediaId)
      .select()
      .single();

    if (error) throw error;
    return data as Midia;
  },

  /**
   * Deletar uma mídia
   */
  async deleteMedia(mediaId: string) {
    // 1. Buscar a URL para deletar do storage depois
    const { data: media } = await supabase
      .from('midias')
      .select('url')
      .eq('id', mediaId)
      .single();

    // 2. Deletar do banco
    const { error } = await supabase
      .from('midias')
      .delete()
      .eq('id', mediaId);

    if (error) throw error;

    // 3. Deletar do storage se possível (opcional, mas recomendado)
    if (media?.url) {
      const fileName = media.url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('midias').remove([`eventos/${fileName}`]);
      }
    }

    return true;
  },

  /**
   * Atualizar perfil do usuário
   */
  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  },

  /**
   * Obter assinatura ativa do usuário
   */
  async getUserSubscription(userId: string) {
    const { data, error } = await supabase
      .from('assinaturas')
      .select('*, planos(*)')
      .eq('organizador_id', userId)
      .eq('status', 'ativo')
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};
