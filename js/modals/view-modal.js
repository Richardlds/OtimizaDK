/**
 * OTIMIZADK - Modal de Visualização Detalhada do Procedimento
 */

const ViewModal = {
    init() {
        const modalView = document.getElementById('modalView');
        const closeViewModal = document.getElementById('closeViewModal');
        const btnCopiar = document.getElementById('btnCopiar');
        const btnCopiarChat = document.getElementById('btnCopiarChat');
        const btnToggleFavoritoView = document.getElementById('btnToggleFavoritoView');
        const btnImprimirView = document.getElementById('btnImprimirView');

        if (closeViewModal) {
            closeViewModal.addEventListener('click', () => this.close());
        }

        if (btnCopiar) {
            btnCopiar.addEventListener('click', () => this.copiarSolucao());
        }

        if (btnCopiarChat) {
            btnCopiarChat.addEventListener('click', () => this.copiarFormatadoChat());
        }

        if (btnToggleFavoritoView) {
            btnToggleFavoritoView.addEventListener('click', () => this.toggleFavorito());
        }

        if (btnImprimirView) {
            btnImprimirView.addEventListener('click', () => {
                window.print();
            });
        }
    },

    open(item) {
        if (!item) return;
        window.State.itemVisualizandoAtual = item;

        const viewTitle = document.getElementById('viewTitle');
        const viewTags = document.getElementById('viewTags');
        const viewProcedimento = document.getElementById('viewProcedimento');
        const viewComoResolver = document.getElementById('viewComoResolver');
        const viewImageSection = document.getElementById('viewImageSection');
        const viewGalleryGrid = document.getElementById('viewGalleryGrid');
        const viewGalleryCount = document.getElementById('viewGalleryCount');
        const btnToggleFavoritoView = document.getElementById('btnToggleFavoritoView');
        const modalView = document.getElementById('modalView');

        if (viewTitle) viewTitle.textContent = item.nomeErro || 'Sem Título';
        if (viewProcedimento) viewProcedimento.innerHTML = window.MarkdownUtils.render(item.procedimento || '');
        if (viewComoResolver) viewComoResolver.innerHTML = window.MarkdownUtils.render(item.comoResolver || '');

        // Galeria de Fotos Anexadas
        const imagens = window.ImageUtils.extrairImagens(item);
        if (viewImageSection && viewGalleryGrid) {
            if (imagens.length > 0) {
                viewGalleryGrid.innerHTML = '';
                if (viewGalleryCount) viewGalleryCount.textContent = imagens.length;

                imagens.forEach((imgSrc, idx) => {
                    const card = document.createElement('div');
                    card.className = 'view-gallery-card';
                    card.innerHTML = `
                        <img src="${imgSrc}" alt="Foto ${idx + 1}">
                        <div class="view-gallery-overlay">
                            <span class="view-gallery-num">#${idx + 1} de ${imagens.length}</span>
                            <div class="view-gallery-zoom-icon"><i data-lucide="zoom-in" style="width:14px;"></i></div>
                        </div>
                    `;
                    card.addEventListener('click', () => {
                        if (window.LightboxComponent) {
                            window.LightboxComponent.open(imagens, idx);
                        }
                    });
                    viewGalleryGrid.appendChild(card);
                });

                viewImageSection.style.display = 'block';
            } else {
                viewGalleryGrid.innerHTML = '';
                viewImageSection.style.display = 'none';
            }
        }

        // Badges de Tipo, UF e Tags
        if (viewTags) {
            let badgesHTML = '';
            if (item.tipo) {
                const tipoBadgeClass = item.tipo === 'Erro' ? 'badge-erro' : (item.tipo === 'Procedimento' ? 'badge-procedimento' : 'badge-faq');
                badgesHTML += `<span class="badge ${tipoBadgeClass}">${item.tipo}</span>`;
            }
            if (item.estado) {
                badgesHTML += `<span class="badge badge-uf" style="background:var(--bg-3); border-color:var(--border); color:var(--text-secondary);">${item.estado}</span>`;
            }

            const arrayTags = item.tags ? item.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [];
            badgesHTML += arrayTags.map(tag => `<span class="badge ${window.CardsComponent.obterClasseDaTag(tag)}">${tag}</span>`).join('');

            viewTags.innerHTML = badgesHTML;
        }

        // Estado do botão de Favoritar
        if (btnToggleFavoritoView) {
            const isFav = window.State.favoritos.has(item.id) || item.favorito;
            btnToggleFavoritoView.classList.toggle('active', isFav);
        }

        if (modalView) modalView.classList.add('open');
        if (window.lucide) window.lucide.createIcons();
    },

    close() {
        const modalView = document.getElementById('modalView');
        if (modalView) modalView.classList.remove('open');
    },

    copiarSolucao() {
        const item = window.State.itemVisualizandoAtual;
        if (!item || !item.comoResolver) return;

        navigator.clipboard.writeText(item.comoResolver).then(() => {
            if (window.Toast) window.Toast.show('Solução copiada para a área de transferência!', 'success');
        }).catch(() => {
            if (window.Toast) window.Toast.show('Erro ao acessar área de transferência.', 'error');
        });
    },

    copiarFormatadoChat() {
        const item = window.State.itemVisualizandoAtual;
        if (!item) return;

        const textoChat = `🛠️ *[${(item.tipo || 'PROCEDIMENTO').toUpperCase()}] ${item.nomeErro}* (UF: ${item.estado || 'Nacional'})
━━━━━━━━━━━━━━━━━━━━━
📋 *Contexto:*
${item.procedimento || 'N/A'}

✅ *Como Resolver:*
${item.comoResolver || 'N/A'}
━━━━━━━━━━━━━━━━━━━━━
🏷️ _Tags: ${item.tags || 'Geral'}_`;

        navigator.clipboard.writeText(textoChat).then(() => {
            if (window.Toast) window.Toast.show('Texto formatado para WhatsApp/Teams copiado!', 'success');
        }).catch(() => {
            if (window.Toast) window.Toast.show('Erro ao copiar.', 'error');
        });
    },

    toggleFavorito() {
        const item = window.State.itemVisualizandoAtual;
        if (!item) return;

        const isFav = window.State.toggleFavorito(item.id);
        const btnToggleFavoritoView = document.getElementById('btnToggleFavoritoView');
        if (btnToggleFavoritoView) {
            btnToggleFavoritoView.classList.toggle('active', isFav);
        }

        if (window.Toast) {
            window.Toast.show(isFav ? 'Adicionado aos favoritos! ⭐' : 'Removido dos favoritos.', isFav ? 'success' : 'info');
        }

        if (window.FiltersComponent) {
            window.FiltersComponent.aplicar();
        }
    }
};

window.ViewModal = ViewModal;
window.abrirVisualizacao = (item) => ViewModal.open(item);
