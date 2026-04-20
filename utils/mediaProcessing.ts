
import heic2any from 'heic2any';
import imageCompression from 'browser-image-compression';

/**
 * Utilitário profissional para processamento de mídias no lado do cliente
 */
export const mediaProcessing = {
  /**
   * Processa uma imagem: converte HEIC para JPG e comprime conforme os padrões aprovados
   */
  processImage: async (file: File): Promise<File> => {
    let processedFile = file;

    // 1. Converter HEIC/HEIF para JPG se necessário
    const isHEIC = file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
    
    if (isHEIC) {
      try {
        console.log('Convertendo arquivo HEIC para JPG...');
        const blob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.85
        });
        
        const blobArray = Array.isArray(blob) ? blob[0] : blob;
        processedFile = new File([blobArray], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
      } catch (error) {
        console.error('Erro ao converter HEIC:', error);
        // Fallback: mantém o arquivo original se falhar a conversão
      }
    }

    // 2. Comprimir imagem (Padrão: 1600px, 0.85 qualidade)
    try {
      const options = {
        maxSizeMB: 2, // Limite conservador para mobile
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        initialQuality: 0.85,
        fileType: 'image/jpeg'
      };

      console.log('Comprimindo imagem...');
      processedFile = await imageCompression(processedFile, options);
    } catch (error) {
      console.error('Erro na compressão:', error);
    }

    return processedFile;
  },

  /**
   * Valida metadados básicos de vídeo
   */
  validateVideo: (file: File): { valid: boolean; error?: string } => {
    const isVideo = file.type.startsWith('video/');
    if (!isVideo) return { valid: false, error: 'O arquivo não é um vídeo válido.' };

    // Limite de tamanho: 100MB
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) return { valid: false, error: 'O vídeo é muito grande (máx 100MB).' };

    return { valid: true };
  }
};
