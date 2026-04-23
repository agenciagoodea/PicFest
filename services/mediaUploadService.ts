
import { supabase } from './supabaseClient';
import { mediaProcessing } from '../utils/mediaProcessing';

export interface UploadProgress {
  percentage: number;
  stage: 'validating' | 'processing' | 'uploading' | 'persisting' | 'success' | 'error';
  message: string;
}

export const mediaUploadService = {
  /**
   * Upload de mídia com pipeline completo: Processamento -> Storage -> DB
   */
  uploadEventMedia: async (
    eventId: string,
    userId: string,
    file: File,
    caption: string,
    showOnScreen: boolean,
    onProgress: (progress: UploadProgress) => void
  ) => {
    let uploadedPath: string | null = null;

    try {
      // 1. Validação e Processamento
      onProgress({ stage: 'processing', percentage: 10, message: 'Processando mídia...' });
      
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        fileToUpload = await mediaProcessing.processImage(file);
      } else if (file.type.startsWith('video/')) {
        const validation = mediaProcessing.validateVideo(file);
        if (!validation.valid) throw new Error(validation.error);
      }

      // 2. Upload para o Storage
      onProgress({ stage: 'uploading', percentage: 30, message: 'Enviando arquivo...' });
      
      const fileExt = fileToUpload.name.split('.').pop() || (fileToUpload.type.startsWith('video') ? 'mp4' : 'jpg');
      const timestamp = Date.now();
      const uniqueId = Math.random().toString(36).substring(7);
      const fileName = `${uniqueId}-${timestamp}.${fileExt}`;
      const typeFolder = fileToUpload.type.startsWith('video') ? 'videos' : 'photos';
      
      // Organização: eventos/ID_EVENTO/tipo/ARQUIVO
      uploadedPath = `eventos/${eventId}/${typeFolder}/${fileName}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from('midias')
        .upload(uploadedPath, fileToUpload, {
          cacheControl: '3600',
          upsert: true
        });

      if (storageError) throw storageError;
      
      onProgress({ stage: 'uploading', percentage: 80, message: 'Arquivo enviado!' });
      
      // 2.1 Extrair Metadados antes de salvar no banco
      const metadata = await mediaProcessing.getMediaMetadata(fileToUpload);

      // 3. Obter URL Pública
      const { data: { publicUrl } } = supabase.storage
        .from('midias')
        .getPublicUrl(uploadedPath);

      // 4. Salvar no Banco de Dados
      onProgress({ stage: 'persisting', percentage: 90, message: 'Finalizando...' });
      
      const { data: mediaData, error: dbError } = await supabase
        .from('midias')
        .insert({
          evento_id: eventId,
          usuario_id: userId,
          tipo: fileToUpload.type.startsWith('video') ? 'video' : 'foto',
          legenda: caption,
          url: publicUrl,
          aprovado: showOnScreen,
          width: metadata.width,
          height: metadata.height,
          orientation: metadata.orientation,
          duration: metadata.duration
        })
        .select()
        .maybeSingle();

      if (dbError) {
        // ROLLBACK: Deletar arquivo físico se falhar o banco
        console.error('Falha ao salvar no banco, iniciando rollback do storage...');
        await supabase.storage.from('midias').remove([uploadedPath]);
        throw new Error(`Erro ao salvar registro: ${dbError.message}`);
      }

      onProgress({ stage: 'success', percentage: 100, message: 'Sucesso!' });
      return mediaData;

    } catch (error: any) {
      console.error('Erro detalhado no upload service:', error);
      
      // Tentar rollback se o erro aconteceu após o upload
      if (uploadedPath) {
        try {
          await supabase.storage.from('midias').remove([uploadedPath]);
        } catch (e) {
          console.error('Falha no rollback crítico:', e);
        }
      }

      onProgress({ 
        stage: 'error', 
        percentage: 0, 
        message: error.message || 'Ocorreu um erro inesperado.' 
      });
      throw error;
    }
  }
};
