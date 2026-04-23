
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
  },

  /**
   * Extrai metadados de largura, altura, orientação e duração de uma mídia
   */
  getMediaMetadata: (file: File): Promise<{ width?: number; height?: number; orientation?: 'portrait' | 'landscape'; duration?: number }> => {
    return new Promise((resolve) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (isImage) {
        const img = new Image();
        img.onload = () => {
          const orientation = img.width > img.height ? 'landscape' : 'portrait';
          resolve({ width: img.width, height: img.height, orientation });
          URL.revokeObjectURL(img.src);
        };
        img.onerror = () => resolve({});
        img.src = URL.createObjectURL(file);
      } else if (isVideo) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          const orientation = video.videoWidth > video.videoHeight ? 'landscape' : 'portrait';
          resolve({ 
            width: video.videoWidth, 
            height: video.videoHeight, 
            orientation,
            duration: video.duration 
          });
          URL.revokeObjectURL(video.src);
        };
        video.onerror = () => resolve({});
        video.src = URL.createObjectURL(file);
      } else {
        resolve({});
      }
    });
  }
};
