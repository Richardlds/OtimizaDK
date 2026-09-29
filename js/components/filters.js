/**
 * OTIMIZADK - Componente de Filtros, Pesquisa e Abas de Acesso Rápido
 */

const FiltersComponent = {
    init() {
        const searchInput = document.getElementById('searchInput');
        const filterEstado = document.getElementById('filterEstado');
        const quickTabs = document.querySelectorAll('#quickTabs .quick-tab');
        const btnToggleTagsBar = document.getElementById('btnToggleTagsBar');
        const filtersContainer = document.getElementById('filtersContainer');
        const toggleTagsCheckbox = document.getElementById('toggleTagsCheckbox');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.aplicar());
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    this.aplicar();
                }
            });
        }

        if (filterEstado) {
            filterEstado.addEventListener('change', () => this.aplicar());
        }

        // Abas de Acesso Rápido (Todos, Favoritos, Erros, Procedimentos, FAQ)
        if (quickTabs) {
            quickTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const tipo = tab.getAttribute('data-tipo') || '';
                    if (window.State.tipoFiltroAtivo === tipo && tipo !== '') {
                        window.State.tipoFiltroAtivo = '';
                        quickTabs.forEach(t => t.classList.remove('active'));
                        const tabAll = document.getElementById('tabAll');
                        if (tabAll) tabAll.classList.add('active');
                    } else {
                        quickTabs.forEach(t => t.classList.remove('active'));
                        tab.classList.add('active');
                        window.State.tipoFiltroAtivo = tipo;
                    }
                    this.aplicar();
                });
            });
        }

        // Botão de expandir/ocultar barra de tags
        if (btnToggleTagsBar && filtersContainer) {
            btnToggleTagsBar.addEventListener('click', () => {
                const isVisible = filtersContainer.style.display === 'flex';
                filtersContainer.style.display = isVisible ? 'none' : 'flex';
                btnToggleTagsBar.classList.toggle('active', !isVisible);
            });
        }

        // Checkbox secundário de toggle de tags (caso exista)
        if (toggleTagsCheckbox && filtersContainer) {
            toggleTagsCheckbox.addEventListener('change', (e) => {
                filtersContainer.style.display = e.target.checked ? 'flex' : 'none';
            });
        }
    },

    setTag(tag) {
        if (window.State.tagFiltroAtiva === tag) {
            window.State.tagFiltroAtiva = null;
        } else {
            window.State.tagFiltroAtiva = tag;
        }
        this.aplicar();
    },

    renderTags() {
        const filtersContainer = document.getElementById('filtersContainer');
        if (!filtersContainer) return;

        const todasTags = new Set();
        window.State.dados.forEach(item => {
            if (!item.tags) return;
            const arrayTags = item.tags.split(',').map(tag => tag.trim().toLowerCase()).filter(t => t);
            arrayTags.forEach(t => todasTags.add(t));
        });

        const tagsCountBadge = document.getElementById('tagsCountBadge');
        if (tagsCountBadge) tagsCountBadge.textContent = todasTags.size;

        let html = '';
        if (todasTags.size > 0) {
            const activeClass = window.State.tagFiltroAtiva === null ? 'active' : '';
            html += `<button class="filter-chip ${activeClass}" onclick="window.FiltersComponent.setTag(null)">Todas as Tags</button>`;
        }
        Array.from(todasTags).sort().forEach(tag => {
            const activeClass = window.State.tagFiltroAtiva === tag ? 'active' : '';
            html += `<button class="filter-chip ${activeClass}" onclick="window.FiltersComponent.setTag('${tag}')">#${tag}</button>`;
        });

        filtersContainer.innerHTML = html;
    },

    aplicar() {
        const searchInput = document.getElementById('searchInput');
        const filterEstado = document.getElementById('filterEstado');
        const termo = (searchInput ? searchInput.value : '').toLowerCase().trim();
        const fEstado = filterEstado ? filterEstado.value : '';

        // 1. Filtrar pelo termo de busca, estado e tag ativa (base contextual para os contadores das abas)
        const baseFiltrada = window.State.dados.filter(item => {
            const arrayTags = item.tags ? item.tags.split(',').map(tag => tag.trim().toLowerCase()) : [];
            const tituloMatch = (item.nomeErro || '').toLowerCase().includes(termo);
            const descMatch = (item.procedimento || '').toLowerCase().includes(termo);
            const solucaoMatch = (item.comoResolver || '').toLowerCase().includes(termo);
            const tagsMatchBusca = arrayTags.some(t => t.includes(termo));

            const passaBusca = termo ? (tituloMatch || descMatch || solucaoMatch || tagsMatchBusca) : true;
            const passaTag = window.State.tagFiltroAtiva ? arrayTags.includes(window.State.tagFiltroAtiva.toLowerCase()) : true;
            const passaEstado = fEstado ? (item.estado === fEstado) : true;

            return passaBusca && passaTag && passaEstado;
        });

        // 2. Atualizar contadores das abas de acesso rápido
        const totalAll = baseFiltrada.length;
        const totalFav = baseFiltrada.filter(d => window.State.favoritos.has(d.id) || d.favorito).length;
        const totalErros = baseFiltrada.filter(d => {
            const t = (d.tipo || '').toLowerCase();
            return t === 'erro' || t.includes('erro') || t.includes('falha');
        }).length;
        const totalProc = baseFiltrada.filter(d => {
            const t = (d.tipo || '').toLowerCase();
            return t === 'procedimento' || t.includes('procedimento') || t.includes('manual');
        }).length;
        const totalFaq = baseFiltrada.filter(d => {
            const t = (d.tipo || '').toLowerCase();
            return t === 'faq' || t.includes('faq') || t.includes('duvida') || t.includes('dúvida');
        }).length;

        const bAll = document.getElementById('badgeCountAll');
        const bFav = document.getElementById('badgeCountFav');
        const bErro = document.getElementById('badgeCountErro');
        const bProc = document.getElementById('badgeCountProc');
        const bFaq = document.getElementById('badgeCountFaq');

        if (bAll) bAll.textContent = totalAll;
        if (bFav) bFav.textContent = totalFav;
        if (bErro) bErro.textContent = totalErros;
        if (bProc) bProc.textContent = totalProc;
        if (bFaq) bFaq.textContent = totalFaq;

        // 3. Filtrar pela aba selecionada (tipo)
        const tipoAtivo = window.State.tipoFiltroAtivo;
        const dadosExibidos = baseFiltrada.filter(item => {
            if (!tipoAtivo) return true;
            if (tipoAtivo === 'Favoritos') return window.State.favoritos.has(item.id) || item.favorito;
            const t = (item.tipo || '').toLowerCase();
            if (tipoAtivo === 'Erro') return t === 'erro' || t.includes('erro') || t.includes('falha');
            if (tipoAtivo === 'Procedimento') return t === 'procedimento' || t.includes('procedimento') || t.includes('manual');
            if (tipoAtivo === 'FAQ') return t === 'faq' || t.includes('faq') || t.includes('duvida') || t.includes('dúvida');
            return item.tipo === tipoAtivo;
        });

        // 4. Atualizar contador no cabeçalho
        const activeCountDisplay = document.getElementById('activeCountDisplay');
        if (activeCountDisplay) {
            activeCountDisplay.textContent = `${dadosExibidos.length} ${dadosExibidos.length === 1 ? 'procedimento' : 'procedimentos'}`;
        }

        // 5. Atualizar contador geral da sidebar
        const bMeta = document.getElementById('sidebarMetaCount');
        if (bMeta) bMeta.textContent = window.State.dados.length;

        this.renderTags();
        if (window.CardsComponent) {
            window.CardsComponent.render(dadosExibidos);
        }
    },

    limparTodos() {
        const searchInput = document.getElementById('searchInput');
        const filterEstado = document.getElementById('filterEstado');
        const quickTabs = document.querySelectorAll('#quickTabs .quick-tab');

        if (searchInput) searchInput.value = '';
        window.State.tagFiltroAtiva = null;
        window.State.tipoFiltroAtivo = '';

        if (window.State.tsFilterEstado) {
            window.State.tsFilterEstado.setValue('');
        } else if (filterEstado) {
            filterEstado.value = '';
        }

        if (quickTabs) {
            quickTabs.forEach(tab => {
                tab.classList.toggle('active', tab.getAttribute('data-tipo') === '');
            });
        }

        this.aplicar();
        if (window.Toast) window.Toast.show('Filtros redefinidos.', 'info');
    }
};

window.FiltersComponent = FiltersComponent;
window.setTagFiltro = (tag) => FiltersComponent.setTag(tag);
window.limparTodosFiltros = () => FiltersComponent.limparTodos();
window.aplicarFiltrosGlobais = () => FiltersComponent.aplicar();
window.atualizarInterface = () => FiltersComponent.aplicar();
