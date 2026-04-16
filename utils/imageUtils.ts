/**
 * Utilitário para otimização de imagens usando o Supabase Image Transformation
 */

type ImageTransformOptions = {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'origin';
    resize?: 'cover' | 'contain' | 'fill';
};

export const getOptimizedImageUrl = (url: string, options: ImageTransformOptions = {}) => {
    if (!url) return '';
    
    // Se não for uma URL do Supabase, retorna a original
    if (!url.includes('supabase.co/storage/v1/object/public/')) {
        return url;
    }

    const { 
        width = 800, 
        quality = 80, 
        format = 'webp', 
        resize = 'cover' 
    } = options;

    // Converte a URL de 'object' para 'render'
    // Ex: https://[project].supabase.co/storage/v1/object/public/bucket/path
    // Para: https://[project].supabase.co/storage/v1/render/image/public/bucket/path?width=...
    
    const transformedUrl = url.replace('/object/public/', '/render/image/public/');
    
    const params = new URLSearchParams();
    if (width) params.append('width', width.toString());
    if (options.height) params.append('height', options.height.toString());
    params.append('quality', quality.toString());
    params.append('format', format);
    params.append('resize', resize);

    return `${transformedUrl}?${params.toString()}`;
};
