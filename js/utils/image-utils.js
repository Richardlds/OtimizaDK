/**
 * OTIMIZADK - Utilitários de Imagem & Canvas
 * Suporte a compressão, redimensionamento e extração de múltiplos anexos.
 */

const ImageUtils = {
    /**
     * Extrai array normalizado de strings Base64/URLs a partir de um registro do banco.
     * Suporta legado (imagem: string), JSON string (imagem: '["..."]') e novo formato (imagens: []).
     */
    extrairImagens(item) {
        if (!item) return [];
        if (Array.isArray(item.imagens) && item.imagens.length > 0) {
            return item.imagens.filter(Boolean);
        }
        if (item.imagem && typeof item.imagem === 'string') {
            const str = item.imagem.trim();
            if (str.startsWith('[') && str.endsWith(']')) {
                try {
                    const parsed = JSON.parse(str);
                    if (Array.isArray(parsed)) return parsed.filter(Boolean);
                } catch (_) {}
            }
            if (str.length > 5) return [str];
        }
        return [];
    },

    /**
     * Comprime e redimensiona imagem no navegador usando Canvas.
     * Reduz fotos pesadas (5MB-10MB) para ~80KB-120KB mantendo resolução nítida.
     */
    async comprimir(file, maxWidth = 1600, maxHeight = 1600, qualidade = 0.85) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth || height > maxHeight) {
                        if (width / height > maxWidth / maxHeight) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        } else {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const compressedDataUrl = canvas.toDataURL('image/jpeg', qualidade);
                    resolve(compressedDataUrl);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    }
};

// Aliases globais
window.ImageUtils = ImageUtils;
window.extrairImagens = ImageUtils.extrairImagens;
window.comprimirERedimensionarImagem = ImageUtils.comprimir;
