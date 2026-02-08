
/**
 * Utilitário para processamento de imagens no lado do cliente
 */
export const imageProcessor = {
	/**
	 * Comprime uma imagem para reduzir o tamanho do arquivo antes do upload
	 */
	compress: async (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> => {
		// Se não for imagem, retorna o arquivo original
		if (!file.type.startsWith('image/')) {
			return file;
		}

		return new Promise((resolve, reject) => {
			const img = new Image();
			img.src = URL.createObjectURL(file);

			img.onload = () => {
				URL.revokeObjectURL(img.src);

				const canvas = document.createElement('canvas');
				let width = img.width;
				let height = img.height;

				// Calcular novas dimensões mantendo o aspect ratio
				if (width > maxWidth) {
					height = Math.round((height * maxWidth) / width);
					width = maxWidth;
				}

				canvas.width = width;
				canvas.height = height;

				const ctx = canvas.getContext('2d');
				if (!ctx) {
					return resolve(file); // Fallback para arquivo original se falhar o canvas
				}

				ctx.drawImage(img, 0, 0, width, height);

				canvas.toBlob(
					(blob) => {
						if (blob) {
							const compressedFile = new File([blob], file.name, {
								type: 'image/jpeg',
								lastModified: Date.now(),
							});

							// Se a compressão ficou maior que o original (quase impossível, mas por segurança)
							if (compressedFile.size > file.size) {
								resolve(file);
							} else {
								resolve(compressedFile);
							}
						} else {
							resolve(file);
						}
					},
					'image/jpeg',
					quality
				);
			};

			img.onerror = () => {
				URL.revokeObjectURL(img.src);
				reject(new Error('Falha ao brensentar imagem para compressão'));
			};
		});
	}
};
