/**
 * OTIMIZADK - Componente de Dropzone e Gestão de Fotos do Formulário
 */

const DropzoneComponent = {
    init() {
        const dropZoneFotos = document.getElementById('dropZoneFotos');
        const imagemUpload = document.getElementById('imagemUpload');

        if (dropZoneFotos) {
            dropZoneFotos.addEventListener('click', () => {
                if (imagemUpload) imagemUpload.click();
            });

            dropZoneFotos.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZoneFotos.classList.add('dragover');
            });

            dropZoneFotos.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZoneFotos.classList.remove('dragover');
            });

            dropZoneFotos.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZoneFotos.classList.remove('dragover');
                if (e.dataTransfer && e.dataTransfer.files) {
                    this.adicionarArquivos(e.dataTransfer.files);
                }
            });
        }

        if (imagemUpload) {
            imagemUpload.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    this.adicionarArquivos(e.target.files);
                    imagemUpload.value = '';
                }
            });
        }

        // Listener global de Colar da Área de Transferência (Ctrl + V)
        window.addEventListener('paste', async (e) => {
            const modalForm = document.getElementById('modalForm');
            if (modalForm && modalForm.classList.contains('open')) {
                const items = e.clipboardData ? e.clipboardData.items : [];
                const imageFiles = [];
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type && items[i].type.indexOf('image') !== -1) {
                        const blob = items[i].getAsFile();
                        if (blob) imageFiles.push(blob);
                    }
                }

                if (imageFiles.length > 0) {
                    e.preventDefault();
                    await this.adicionarArquivos(imageFiles);
                    if (window.Toast) window.Toast.show('Print colado da área de transferência!', 'success');
                }
            }
        });
    },

    async adicionarArquivos(fileList) {
        if (!fileList || fileList.length === 0) return;
        const arrayFiles = Array.from(fileList).filter(f => f.type && f.type.startsWith('image/'));
        if (arrayFiles.length === 0) {
            if (window.Toast) window.Toast.show('Por favor, selecione apenas arquivos de imagem.', 'error');
            return;
        }

        let adicionadas = 0;
        for (const file of arrayFiles) {
            try {
                const base64 = await window.ImageUtils.comprimir(file);
                window.State.fotosFormulario.push(base64);
                adicionadas++;
            } catch (e) {
                console.warn('Erro ao comprimir imagem:', e);
            }
        }

        this.renderGallery();
        if (adicionadas > 0 && window.Toast) {
            window.Toast.show(`${adicionadas} foto(s) anexada(s) com sucesso!`, 'success');
        }
    },

    renderGallery() {
        const formGalleryGrid = document.getElementById('formGalleryGrid');
        const uploadCountPill = document.getElementById('uploadCountPill');
        const btnAiAnalisarPrint = document.getElementById('btnAiAnalisarPrint');

        if (!formGalleryGrid) return;
        formGalleryGrid.innerHTML = '';

        const fotos = window.State.fotosFormulario;

        if (fotos.length === 0) {
            formGalleryGrid.style.display = 'none';
            if (uploadCountPill) uploadCountPill.style.display = 'none';
            if (btnAiAnalisarPrint) btnAiAnalisarPrint.style.display = 'none';
            return;
        }

        formGalleryGrid.style.display = 'grid';
        if (uploadCountPill) {
            uploadCountPill.textContent = `${fotos.length} ${fotos.length === 1 ? 'foto' : 'fotos'}`;
            uploadCountPill.style.display = 'inline-block';
        }
        if (btnAiAnalisarPrint) {
            btnAiAnalisarPrint.style.display = 'inline-flex';
        }

        fotos.forEach((foto, idx) => {
            const thumb = document.createElement('div');
            thumb.className = 'form-thumb-card';
            thumb.innerHTML = `
                <img src="${foto}" alt="Foto ${idx + 1}" title="Clique para ampliar">
                <span class="form-thumb-badge">#${idx + 1}</span>
                <button type="button" class="form-thumb-remove" title="Remover esta foto">
                    <i data-lucide="x" style="width: 12px;"></i>
                </button>
            `;

            thumb.querySelector('img').addEventListener('click', () => {
                if (window.LightboxComponent) {
                    window.LightboxComponent.open(fotos, idx);
                }
            });

            thumb.querySelector('.form-thumb-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removerFoto(idx);
            });

            formGalleryGrid.appendChild(thumb);
        });

        if (window.lucide) {
            window.lucide.createIcons({ root: formGalleryGrid });
        }
    },

    removerFoto(index) {
        window.State.fotosFormulario.splice(index, 1);
        this.renderGallery();
    },

    reset() {
        window.State.fotosFormulario = [];
        this.renderGallery();
    },

    setFotos(fotos) {
        window.State.fotosFormulario = Array.isArray(fotos) ? [...fotos] : [];
        this.renderGallery();
    }
};

window.DropzoneComponent = DropzoneComponent;
