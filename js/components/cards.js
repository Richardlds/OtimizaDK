/**
 * OTIMIZADK - Componente de Renderização de Cards do Catálogo
 */

const CardsComponent = {
    obterClasseDaTag(tagBase) {
        const tag = (tagBase || '').toLowerCase();
        if (tag.includes('erro') || tag.includes('urgente') || tag.includes('falha')) return 'badge-erro';
        if (tag.includes('faq') || tag.includes('sucesso')) return 'badge-faq';
        if (tag.includes('procedimento') || tag.includes('aviso')) return 'badge-procedimento';
        if (tag.includes('codigo') || tag.includes('dev')) return 'badge-codigo';
        return 'badge-uf'; 
    },

    copiarSolucao(e, id) {
        if (e) e.stopPropagation();
        const item = window.State.dados.find(d => d.id === id);
        if (!item || !item.comoResolver) return;
        navigator.clipboard.writeText(item.comoResolver).then(() => {
            if (window.Toast) window.Toast.show('Solução copiada para a área de transferência!', 'success');
        }).catch(() => {
            if (window.Toast) window.Toast.show('Erro ao copiar solução.', 'error');
        });
    },

    render(listaFiltrada) {
        const cardsContainer = document.getElementById('cardsContainer');
        if (!cardsContainer) return;
        cardsContainer.innerHTML = '';

        if (!listaFiltrada || listaFiltrada.length === 0) {
            cardsContainer.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; padding: 48px 16px;">
                    <div class="empty-state-icon"><i data-lucide="inbox" style="width: 48px; height: 48px; color: var(--text-muted);"></i></div>
                    <div class="empty-state-title" style="font-size: 16px; margin-top: 10px;">Nenhum registro encontrado</div>
                    <div class="empty-state-desc" style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Tente alterar sua pesquisa, categoria ou filtros de tags.</div>
                    <button class="btn-secondary" onclick="window.FiltersComponent.limparTodos()" style="margin-top: 16px; display: inline-flex; align-items: center; gap: 6px;">
                        <i data-lucide="rotate-ccw" style="width: 14px;"></i> Limpar Filtros
                    </button>
                </div>`;
            if (window.lucide) window.lucide.createIcons({ root: cardsContainer });
            return;
        }

        listaFiltrada.forEach(item => {
            const card = document.createElement('div');
            const tipoClass = item.tipo === 'Erro' ? 'card-type-erro' : (item.tipo === 'Procedimento' ? 'card-type-procedimento' : 'card-type-faq');
            card.className = `knowledge-card ${tipoClass}`;
            
            const arrayTags = item.tags ? item.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [];
            const tagsHTML = arrayTags.slice(0, 3).map(tag => `<span class="badge ${this.obterClasseDaTag(tag)}">${tag}</span>`).join('');
            const extraTagsCount = arrayTags.length > 3 ? `<span class="badge" style="background:var(--bg-3); color:var(--text-muted);">+${arrayTags.length - 3}</span>` : '';

            let tipoIcon = 'book-open';
            let tipoBadgeClass = 'badge-procedimento';
            if (item.tipo === 'Erro') {
                tipoIcon = 'alert-triangle';
                tipoBadgeClass = 'badge-erro';
            } else if (item.tipo === 'FAQ') {
                tipoIcon = 'help-circle';
                tipoBadgeClass = 'badge-faq';
            }

            const tipoHTML = item.tipo ? `<span class="badge ${tipoBadgeClass}"><i data-lucide="${tipoIcon}" style="width: 11px;"></i> ${item.tipo}</span>` : '';
            const estadoHTML = item.estado ? `<span class="badge badge-uf" style="background:var(--bg-3); border-color:var(--border); color:var(--text-secondary);">${item.estado}</span>` : '';
            
            const imgs = window.ImageUtils.extrairImagens(item);
            let imageBadgeHTML = '';
            if (imgs.length === 1) {
                imageBadgeHTML = `<span class="card-img-badge" title="1 foto anexada"><i data-lucide="image" style="width: 12px;"></i> 1 foto</span>`;
            } else if (imgs.length > 1) {
                imageBadgeHTML = `<span class="card-img-badge" title="${imgs.length} fotos anexadas"><i data-lucide="images" style="width: 12px;"></i> ${imgs.length} fotos</span>`;
            }

            const isFav = window.State.favoritos.has(item.id) || item.favorito;
            const dataFormatada = new Date(item.id).toLocaleDateString('pt-BR');

            card.innerHTML = `
                <div class="card-header">
                    <div class="card-badges">
                        ${tipoHTML}
                        ${estadoHTML}
                        ${tagsHTML}
                        ${extraTagsCount}
                    </div>
                    <button class="card-fav-btn ${isFav ? 'active' : ''}" onclick="window.CardsComponent.toggleFavorito(event, ${item.id})" title="${isFav ? 'Remover dos Favoritos' : 'Favoritar Procedimento'}">
                        <i data-lucide="star" style="width: 15px;"></i>
                    </button>
                </div>
                <h3 class="card-title">
                    <span>${item.nomeErro}</span>
                </h3>
                <p class="card-desc">${item.procedimento}</p>
                <div class="card-footer">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="card-date"><i data-lucide="calendar" style="width: 12px; color: var(--text-muted);"></i> ${dataFormatada}</span>
                        ${imageBadgeHTML}
                    </div>
                    <div class="card-actions" onclick="event.stopPropagation()">
                        <button class="icon-btn" onclick="window.CardsComponent.copiarSolucao(event, ${item.id})" title="Copiar Solução"><i data-lucide="copy" style="width: 13px;"></i></button>
                        <button class="icon-btn" onclick="window.FormModal.open(${item.id})" title="Editar"><i data-lucide="edit-2" style="width: 13px;"></i></button>
                        <button class="icon-btn danger" onclick="window.FormModal.excluir(${item.id})" title="Excluir"><i data-lucide="trash-2" style="width: 13px;"></i></button>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                if (window.ViewModal) window.ViewModal.open(item);
            });

            cardsContainer.appendChild(card);
        });

        if (window.lucide) {
            window.lucide.createIcons({ root: cardsContainer });
        }
    },

    toggleFavorito(e, id) {
        if (e) e.stopPropagation();
        const isFav = window.State.toggleFavorito(id);
        if (window.Toast) {
            window.Toast.show(isFav ? 'Adicionado aos favoritos! ⭐' : 'Removido dos favoritos.', isFav ? 'success' : 'info');
        }
        if (window.FiltersComponent) window.FiltersComponent.aplicar();
    }
};

window.CardsComponent = CardsComponent;
window.copiarSolucaoRapida = (e, id) => CardsComponent.copiarSolucao(e, id);
window.toggleFavorito = (e, id) => CardsComponent.toggleFavorito(e, id);
