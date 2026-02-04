import { supabase } from './supabaseClient';

export const storageService = {
    /**
     * Upload de arquivo para o Storage
     */
    uploadFile: async (
        bucket: string,
        path: string,
        file: File,
        options?: { upsert?: boolean; onProgress?: (progress: number) => void }
    ) => {
        try {
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(path, file, {
                    upsert: options?.upsert || false,
                });

            if (error) throw error;

            // Obter URL pública
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(path);

            return { data: { path: data.path, publicUrl }, error: null };
        } catch (error: any) {
            console.error('Erro no upload:', error);
            return { data: null, error: error.message };
        }
    },

    /**
     * Deletar arquivo do Storage
     */
    deleteFile: async (bucket: string, path: string) => {
        try {
            const { error } = await supabase.storage
                .from(bucket)
                .remove([path]);

            if (error) throw error;
            return { error: null };
        } catch (error: any) {
            console.error('Erro ao deletar arquivo:', error);
            return { error: error.message };
        }
    },

    /**
     * Obter URL pública de um arquivo
     */
    getPublicUrl: (bucket: string, path: string) => {
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return publicUrl;
    },

    /**
     * Listar arquivos em um diretório
     */
    listFiles: async (bucket: string, path: string) => {
        try {
            const { data, error } = await supabase.storage
                .from(bucket)
                .list(path);

            if (error) throw error;
            return { data, error: null };
        } catch (error: any) {
            console.error('Erro ao listar arquivos:', error);
            return { data: null, error: error.message };
        }
    },

    /**
     * Upload de mídia (foto/vídeo) para evento
     */
    uploadEventMedia: async (
        eventoId: string,
        file: File,
        onProgress?: (progress: number) => void
    ) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `eventos/${eventoId}/${fileName}`;

            return await storageService.uploadFile('midias', filePath, file, {
                onProgress,
            });
        } catch (error: any) {
            console.error('Erro ao fazer upload de mídia:', error);
            return { data: null, error: error.message };
        }
    },

    /**
     * Validar tipo de arquivo
     */
    validateFileType: (file: File, allowedTypes: string[]) => {
        return allowedTypes.some(type => {
            if (type.endsWith('/*')) {
                const baseType = type.split('/')[0];
                return file.type.startsWith(baseType + '/');
            }
            return file.type === type;
        });
    },

    /**
     * Validar tamanho do arquivo
     */
    validateFileSize: (file: File, maxSizeMB: number) => {
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        return file.size <= maxSizeBytes;
    },

    /**
     * Formatar tamanho de arquivo
     */
    formatFileSize: (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },
};
