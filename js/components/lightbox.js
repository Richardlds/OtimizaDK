/**
 * OTIMIZADK - Componente Lightbox (Visualizador em Tela Cheia com Zoom)
 */

const LightboxComponent = {
    init() {
        const modalLightbox = document.getElementById('modalLightbox');
        const lightboxBackdrop = document.getElementById('lightboxBackdrop');
        const btnCloseLightbox = document.getElementById('btnCloseLightbox');
        const btnLightboxZoomIn = document.getElementById('btnLightboxZoomIn');
        const btnLightboxZoomOut = document.getElementById('btnLightboxZoomOut');
        const btnLightboxZoomReset = document.getElementById('btnLightboxZoomReset');
        const btnLightboxRotate = document.getElementById('btnLightboxRotate');
        const btnLightboxPrev = document.getElementById('btnLightboxPrev');
        const btnLightboxNext = document.getElementById('btnLightboxNext');
        const btnLightboxCopy = document.getElementById('btnLightboxCopy');
        const btnLightboxDownload = document.getElementById('btnLightboxDownload');

        if (btnCloseLightbox) btnCloseLightbox.addEventListener('click', () => this.close());
        if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', () => this.close());

        if (btnLightboxZoomIn) btnLightboxZoomIn.addEventListener('click', () => this.zoomIn());
        if (btnLightboxZoomOut) btnLightboxZoomOut.addEventListener('click', () => this.zoomOut());
        if (btnLightboxZoomReset) btnLightboxZoomReset.addEventListener('click', () => this.zoomReset());
        if (btnLightboxRotate) btnLightboxRotate.addEventListener('click', () => this.rotate());

        if (btnLightboxPrev) btnLightboxPrev.addEventListener('click', () => this.prev());
        if (btnLightboxNext) btnLightboxNext.addEventListener('click', () => this.next());

        if (btnLightboxCopy) btnLightboxCopy.addEventListener('click', () => this.copy());
        if (btnLightboxDownload) btnLightboxDownload.addEventListener('click', () => this.download());
    },

    open(fotos, indexInicial = 0) {
        if (!fotos || fotos.length === 0) return;
        const state = window.State.lightbox;
        state.fotos = fotos;
        state.index = Math.max(0, Math.min(indexInicial, fotos.length - 1));
        state.zoom = 1;
        state.rotate = 0;

        this.update();
        const modalLightbox = document.getElementById('modalLightbox');
        if (modalLightbox) modalLightbox.classList.add('open');
        
        if (window.lucide) {
            window.lucide.createIcons({ root: modalLightbox });
        }
    },

    close() {
        const modalLightbox = document.getElementById('modalLightbox');
        if (modalLightbox) modalLightbox.classList.remove('open');
    },

    update() {
        const state = window.State.lightbox;
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxCounter = document.getElementById('lightboxCounter');
        const btnLightboxPrev = document.getElementById('btnLightboxPrev');
        const btnLightboxNext = document.getElementById('btnLightboxNext');
        const lightboxThumbsStrip = document.getElementById('lightboxThumbsStrip');

        if (!lightboxImage || state.fotos.length === 0) return;
        
        lightboxImage.src = state.fotos[state.index];
        
        if (lightboxCounter) {
            lightboxCounter.textContent = `${state.index + 1} / ${state.fotos.length}`;
        }

        this.applyTransform();

        if (btnLightboxPrev) btnLightboxPrev.style.display = state.fotos.length > 1 ? 'flex' : 'none';
        if (btnLightboxNext) btnLightboxNext.style.display = state.fotos.length > 1 ? 'flex' : 'none';

        // Atualiza a faixa de miniaturas inferior
        if (lightboxThumbsStrip) {
            lightboxThumbsStrip.innerHTML = '';
            if (state.fotos.length > 1) {
                state.fotos.forEach((foto, i) => {
                    const item = document.createElement('div');
                    item.className = `lightbox-thumb-item ${i === state.index ? 'active' : ''}`;
                    item.innerHTML = `<img src="${foto}" alt="Miniatura ${i + 1}">`;
                    item.addEventListener('click', () => {
                        state.index = i;
                        state.zoom = 1;
                        state.rotate = 0;
                        this.update();
                    });
                    lightboxThumbsStrip.appendChild(item);
                });
                lightboxThumbsStrip.style.display = 'flex';
            } else {
                lightboxThumbsStrip.style.display = 'none';
            }
        }
    },

    applyTransform() {
        const state = window.State.lightbox;
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxZoomLevel = document.getElementById('lightboxZoomLevel');

        if (!lightboxImage) return;
        lightboxImage.style.transform = `scale(${state.zoom}) rotate(${state.rotate}deg)`;
        
        if (lightboxZoomLevel) {
            lightboxZoomLevel.textContent = `${Math.round(state.zoom * 100)}%`;
        }
    },

    zoomIn() {
        const state = window.State.lightbox;
        state.zoom = Math.min(3.5, state.zoom + 0.25);
        this.applyTransform();
    },

    zoomOut() {
        const state = window.State.lightbox;
        state.zoom = Math.max(0.5, state.zoom - 0.25);
        this.applyTransform();
    },

    zoomReset() {
        const state = window.State.lightbox;
        state.zoom = 1;
        state.rotate = 0;
        this.applyTransform();
    },

    rotate() {
        const state = window.State.lightbox;
        state.rotate = (state.rotate + 90) % 360;
        this.applyTransform();
    },

    prev() {
        const state = window.State.lightbox;
        if (state.fotos.length <= 1) return;
        state.index = (state.index - 1 + state.fotos.length) % state.fotos.length;
        state.zoom = 1;
        state.rotate = 0;
        this.update();
    },

    next() {
        const state = window.State.lightbox;
        if (state.fotos.length <= 1) return;
        state.index = (state.index + 1) % state.fotos.length;
        state.zoom = 1;
        state.rotate = 0;
        this.update();
    },

    copy() {
        const state = window.State.lightbox;
        const currentFoto = state.fotos[state.index];
        if (!currentFoto) return;
        navigator.clipboard.writeText(currentFoto).then(() => {
            if (window.Toast) window.Toast.show('Link/Base64 da imagem copiado!', 'success');
        });
    },

    download() {
        const state = window.State.lightbox;
        const currentFoto = state.fotos[state.index];
        if (!currentFoto) return;
        const link = document.createElement('a');
        link.href = currentFoto;
        link.download = `otimizadk-foto-${state.index + 1}.jpg`;
        link.click();
        if (window.Toast) window.Toast.show('Download iniciado.', 'info');
    }
};

window.LightboxComponent = LightboxComponent;
window.abrirLightbox = (fotos, idx) => LightboxComponent.open(fotos, idx);
