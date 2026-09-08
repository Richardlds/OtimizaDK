/**
 * OTIMIZADK - Lógica da Aplicação
 * Preparado para Supabase com Funções Assíncronas, Lucide Icons e Filtros por Categoria/Estado.
 */

// ==========================================
// CONEXÃO COM O SUPABASE
// ==========================================
// Coloque sua URL e Chave aqui para que o sistema ative a nuvem automaticamente!
// (Se ficar vazio, o sistema continuará usando o LocalStorage do navegador)
const SUPABASE_URL = 'https://ndiwpvlropelnsvtbsng.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kaXdwdmxyb3BlbG5zdnRic25nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDI4NDIsImV4cCI6MjA4NTg3ODg0Mn0.Sf5iXn6bHkWXAz62t8Kh9BB404OXc1OJ01kLejqLAWc';

let supabaseClient = null;
let modoOffline = false;

if (SUPABASE_URL && SUPABASE_KEY && window.supabase) {
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: false // Previne avisos de Tracking Prevention do navegador para storage de terceiros
            }
        });
        console.log('⚡ Supabase Inicializado (tentando conexão)...');
    } catch (err) {
        console.warn('⚠️ Falha ao instanciar o Supabase:', err);
        supabaseClient = null;
    }
}

const STORAGE_KEY = 'otimizadk_dados';

// Helpers seguros para LocalStorage (previne exceções caso o navegador restrinja storage)
function getLocalDados() {
    try {
        const storage = localStorage.getItem(STORAGE_KEY);
        return storage ? JSON.parse(storage) : [];
    } catch (e) {
        console.warn('⚠️ Falha ao ler LocalStorage:', e);
        return [];
    }
}

function setLocalDados(items) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
        console.warn('⚠️ Falha ao gravar no LocalStorage:', e);
    }
}

function atualizarStatusConexao(online) {
    const dot = document.getElementById('dbStatusDot');
    const txt = document.getElementById('sidebarStatusText');
    if (dot) {
        if (online) {
            dot.className = 'status-indicator-dot';
            if (txt) txt.textContent = 'Nuvem Supabase';
        } else {
            dot.className = 'status-indicator-dot offline';
            if (txt) txt.textContent = 'Modo Local (Offline)';
        }
    }
}

// Camada de Abstração Híbrida (Supabase com fallback automático para LocalStorage)
const db = {
    async getAll() {
        if (supabaseClient && !modoOffline) {
            try {
                const { data, error } = await supabaseClient.from('procedimentos').select('*').order('id', { ascending: false });
                if (error) throw error;
                atualizarStatusConexao(true);
                return data || [];
            } catch (err) {
                console.warn('⚠️ Supabase indisponível. Alternando para modo LocalStorage:', err.message || err);
                modoOffline = true;
                atualizarStatusConexao(false);
                setTimeout(() => {
                    if (typeof mostrarToast === 'function') {
                        mostrarToast('Supabase indisponível. Operando no modo local (offline).', 'info');
                    }
                }, 500);
            }
        }
        atualizarStatusConexao(false);
        return getLocalDados();
    },
    async saveAll(items) {
        if (supabaseClient && !modoOffline) return;
        setLocalDados(items);
    },
    async create(item) {
        if (supabaseClient && !modoOffline) {
            try {
                const { error } = await supabaseClient.from('procedimentos').insert([item]);
                if (error) throw error;
                return;
            } catch (err) {
                console.warn('⚠️ Erro ao salvar no Supabase. Salvando localmente:', err);
                modoOffline = true;
                if (typeof mostrarToast === 'function') mostrarToast('Erro no Supabase. Salvando no modo local.', 'info');
            }
        }
        const all = await this.getAll();
        all.unshift(item);
        await this.saveAll(all);
    },
    async update(id, updatedItem) {
        if (supabaseClient && !modoOffline) {
            try {
                const { error } = await supabaseClient.from('procedimentos').update(updatedItem).eq('id', id);
                if (error) throw error;
                return;
            } catch (err) {
                console.warn('⚠️ Erro ao atualizar no Supabase. Atualizando localmente:', err);
                modoOffline = true;
            }
        }
        const all = await this.getAll();
        const index = all.findIndex(d => d.id === id);
        if (index > -1) all[index] = updatedItem;
        await this.saveAll(all);
    },
    async delete(id) {
        if (supabaseClient && !modoOffline) {
            try {
                const { error } = await supabaseClient.from('procedimentos').delete().eq('id', id);
                if (error) throw error;
                return;
            } catch (err) {
                console.warn('⚠️ Erro ao excluir no Supabase. Excluindo localmente:', err);
                modoOffline = true;
            }
        }
        const all = await this.getAll();
        const filtered = all.filter(d => d.id !== id);
        await this.saveAll(filtered);
    },
    async importData(importedItems) {
        if (supabaseClient && !modoOffline) {
            try {
                const { error } = await supabaseClient.from('procedimentos').insert(importedItems);
                if (error) throw error;
                return;
            } catch (err) {
                console.warn('⚠️ Erro ao importar no Supabase. Importando localmente:', err);
                modoOffline = true;
            }
        }
        const all = await this.getAll();
        const merged = [...all, ...importedItems];
        await this.saveAll(merged);
    }
};

// ==========================================
// DOM ELEMENTS
// ==========================================
const cardsContainer = document.getElementById('cardsContainer');
const searchInput = document.getElementById('searchInput');
const filtersContainer = document.getElementById('filtersContainer');
const toggleTagsCheckbox = document.getElementById('toggleTagsCheckbox');
const filterTipo = document.getElementById('filterTipo');
const filterEstado = document.getElementById('filterEstado');

const modalForm = document.getElementById('modalForm');
const modalView = document.getElementById('modalView');
const closeFormModal = document.getElementById('closeFormModal');
const closeViewModal = document.getElementById('closeViewModal');
const btnCancelForm = document.getElementById('btnCancelForm');

const btnAdicionar = document.getElementById('btnAdicionar');
const btnExportar = document.getElementById('btnExportar');
const btnImportar = document.getElementById('btnImportar');
const fileInput = document.getElementById('fileInput');

const formProcedimento = document.getElementById('formProcedimento');
const erroIdInput = document.getElementById('erroId');
const modalTitle = document.getElementById('modalTitle');

const viewTitle = document.getElementById('viewTitle');
const viewTags = document.getElementById('viewTags');
const viewProcedimento = document.getElementById('viewProcedimento');
const viewComoResolver = document.getElementById('viewComoResolver');
const btnCopiar = document.getElementById('btnCopiar');

const imagemUpload = document.getElementById('imagemUpload');
const imagemBase64 = document.getElementById('imagemBase64');
const imagemPreview = document.getElementById('imagemPreview');
const imgPreviewTag = imagemPreview ? imagemPreview.querySelector('img') : null;
const btnRemoverImagem = document.getElementById('btnRemoverImagem');

const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const themeToggle = document.getElementById('themeToggle');

// Elementos de IA
const btnOpenAiSearch = document.getElementById('btnOpenAiSearch');
const modalAiSearch = document.getElementById('modalAiSearch');
const closeAiSearchModal = document.getElementById('closeAiSearchModal');
const aiSearchInput = document.getElementById('aiSearchInput');
const btnExecAiSearch = document.getElementById('btnExecAiSearch');
const aiSearchLoading = document.getElementById('aiSearchLoading');
const aiSearchOutput = document.getElementById('aiSearchOutput');
const aiAnswerText = document.getElementById('aiAnswerText');
const aiSourcesGrid = document.getElementById('aiSourcesGrid');
const btnCopiarRespostaIa = document.getElementById('btnCopiarRespostaIa');
const aiChipSuggestions = document.querySelectorAll('.ai-chip-suggestion');

const btnAiGerarProcedimento = document.getElementById('btnAiGerarProcedimento');
const btnAiAprimorarSolucao = document.getElementById('btnAiAprimorarSolucao');
const btnAiGerarTags = document.getElementById('btnAiGerarTags');

const btnOpenAiConfig = document.getElementById('btnOpenAiConfig');
const modalAiConfig = document.getElementById('modalAiConfig');
const closeAiConfigModal = document.getElementById('closeAiConfigModal');
const btnCancelAiConfig = document.getElementById('btnCancelAiConfig');
const formAiConfig = document.getElementById('formAiConfig');
const aiProviderSelect = document.getElementById('aiProviderSelect');
const aiApiKeyInput = document.getElementById('aiApiKeyInput');
const btnToggleShowKey = document.getElementById('btnToggleShowKey');
const aiModelSelect = document.getElementById('aiModelSelect');
const aiModelInput = document.getElementById('aiModelInput');
const btnDetectarModelos = document.getElementById('btnDetectarModelos');
const aiEndpointInput = document.getElementById('aiEndpointInput');
const aiEndpointGroup = document.getElementById('aiEndpointGroup');
const btnTestAiKey = document.getElementById('btnTestAiKey');
const aiTestStatus = document.getElementById('aiTestStatus');
const aiKeyHint = document.getElementById('aiKeyHint');

// State
let dados = [];
let tagFiltroAtiva = null;
let tipoFiltroAtivo = '';
let tsFilterEstado = null;
let tsEstado = null; 

// ==========================================
// INITIALIZATION
// ==========================================
async function init() {
    cardsContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="loader" class="lucide-spin" style="width: 48px; height: 48px; color: var(--accent);"></i></div>
            <div class="empty-state-title">Carregando Base de Conhecimento...</div>
            <div class="empty-state-desc">Aguarde, buscando dados...</div>
        </div>`;
    lucide.createIcons();
    
    try {
        dados = await db.getAll();
    } catch (err) {
        console.error('Erro ao carregar dados:', err);
        dados = getLocalDados();
    }
    
    if (!dados || dados.length === 0) {
        const mockData = [
            {
                id: Date.now(),
                nomeErro: "Erro 500 no Servidor de Produção",
                tipo: "Erro",
                estado: "Nacional",
                tags: "servidor, sistema, rede",
                procedimento: "O usuário reporta que ao tentar finalizar uma compra, o sistema exibe um Erro 500.",
                comoResolver: "1. Acesse o painel da AWS CloudWatch.\n2. Filtre os logs de erro.\n3. Reinicie a instância se for deadlock."
            },
            {
                id: Date.now() + 1,
                nomeErro: "Reset de Senha AD",
                tipo: "Procedimento",
                estado: "SP",
                tags: "acesso, rh",
                procedimento: "Usuário bloqueou a conta após 3 tentativas no Active Directory (Exclusivo São Paulo).",
                comoResolver: "1. Abra o painel do AD da filial SP.\n2. Busque pelo usuário.\n3. Desmarque a opção 'Locked out'.\n4. Force a troca de senha."
            }
        ];
        await db.saveAll(mockData);
        dados = mockData;
    }
    
    atualizarInterface();
    lucide.createIcons();
}

// ==========================================
// RENDERIZAÇÃO E FILTROS
// ==========================================
function renderTagsFilter() {
    if (!filtersContainer) return;
    
    const todasTags = new Set();
    dados.forEach(item => {
        if(!item.tags) return;
        const arrayTags = item.tags.split(',').map(tag => tag.trim().toLowerCase()).filter(t => t);
        arrayTags.forEach(t => todasTags.add(t));
    });
    
    const tagsCountBadge = document.getElementById('tagsCountBadge');
    if (tagsCountBadge) tagsCountBadge.textContent = todasTags.size;

    let html = '';
    if (todasTags.size > 0) {
        const activeClass = tagFiltroAtiva === null ? 'active' : '';
        html += `<button class="filter-chip ${activeClass}" onclick="setTagFiltro(null)">Todas as Tags</button>`;
    }
    Array.from(todasTags).sort().forEach(tag => {
        const activeClass = tagFiltroAtiva === tag ? 'active' : '';
        html += `<button class="filter-chip ${activeClass}" onclick="setTagFiltro('${tag}')">#${tag}</button>`;
    });
    
    filtersContainer.innerHTML = html;
}

window.setTagFiltro = function(tag) {
    if (tagFiltroAtiva === tag) {
        tagFiltroAtiva = null;
    } else {
        tagFiltroAtiva = tag;
    }
    aplicarFiltrosGlobais();
};

function aplicarFiltrosGlobais() {
    const termo = (searchInput.value || '').toLowerCase().trim();
    const fEstado = filterEstado ? filterEstado.value : '';
    
    // 1. Filtrar pelo termo de busca, estado e tag ativa (base contextual para os contadores das abas)
    const baseFiltrada = dados.filter(item => {
        const arrayTags = item.tags ? item.tags.split(',').map(tag => tag.trim().toLowerCase()) : [];
        const tituloMatch = (item.nomeErro || '').toLowerCase().includes(termo);
        const descMatch = (item.procedimento || '').toLowerCase().includes(termo);
        const solucaoMatch = (item.comoResolver || '').toLowerCase().includes(termo);
        const tagsMatchBusca = arrayTags.some(t => t.includes(termo));
        
        const passaBusca = termo ? (tituloMatch || descMatch || solucaoMatch || tagsMatchBusca) : true;
        const passaTag = tagFiltroAtiva ? arrayTags.includes(tagFiltroAtiva.toLowerCase()) : true;
        const passaEstado = fEstado ? (item.estado === fEstado) : true;
        
        return passaBusca && passaTag && passaEstado;
    });

    // 2. Atualizar contadores das abas de acesso rápido para acompanhar o filtro ativo
    const totalAll = baseFiltrada.length;
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
    const bErro = document.getElementById('badgeCountErro');
    const bProc = document.getElementById('badgeCountProc');
    const bFaq = document.getElementById('badgeCountFaq');

    if (bAll) bAll.textContent = totalAll;
    if (bErro) bErro.textContent = totalErros;
    if (bProc) bProc.textContent = totalProc;
    if (bFaq) bFaq.textContent = totalFaq;

    // 3. Filtrar pela aba selecionada (tipo: Erro, Procedimento, FAQ ou Todos)
    const dadosExibidos = baseFiltrada.filter(item => {
        if (!tipoFiltroAtivo) return true;
        const t = (item.tipo || '').toLowerCase();
        if (tipoFiltroAtivo === 'Erro') return t === 'erro' || t.includes('erro') || t.includes('falha');
        if (tipoFiltroAtivo === 'Procedimento') return t === 'procedimento' || t.includes('procedimento') || t.includes('manual');
        if (tipoFiltroAtivo === 'FAQ') return t === 'faq' || t.includes('faq') || t.includes('duvida') || t.includes('dúvida');
        return item.tipo === tipoFiltroAtivo;
    });

    // 4. Atualiza contador no cabeçalho com a quantidade visível no catálogo
    const activeCountDisplay = document.getElementById('activeCountDisplay');
    if (activeCountDisplay) {
        activeCountDisplay.textContent = `${dadosExibidos.length} ${dadosExibidos.length === 1 ? 'procedimento' : 'procedimentos'}`;
    }

    renderTagsFilter();
    renderCards(dadosExibidos);
}

function atualizarInterface() {
    // Atualiza contadores gerais (sidebar)
    const bMeta = document.getElementById('sidebarMetaCount');
    if (bMeta) bMeta.textContent = dados.length;

    aplicarFiltrosGlobais();
}

searchInput.addEventListener('input', aplicarFiltrosGlobais);
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        searchInput.value = '';
        aplicarFiltrosGlobais();
    }
});
if (filterEstado) filterEstado.addEventListener('change', aplicarFiltrosGlobais);

// Event listeners para as Abas de Acesso Rápido
const quickTabs = document.querySelectorAll('#quickTabs .quick-tab');
quickTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tipo = tab.getAttribute('data-tipo') || '';
        if (tipoFiltroAtivo === tipo && tipo !== '') {
            // Se clicar na mesma aba ativa, desmarca e volta para "Todos"
            tipoFiltroAtivo = '';
            quickTabs.forEach(t => t.classList.remove('active'));
            const tabAll = document.getElementById('tabAll');
            if (tabAll) tabAll.classList.add('active');
        } else {
            quickTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            tipoFiltroAtivo = tipo;
        }
        aplicarFiltrosGlobais();
    });
});

// Botão de alternar barra de tags
const btnToggleTagsBar = document.getElementById('btnToggleTagsBar');
if (btnToggleTagsBar && filtersContainer) {
    btnToggleTagsBar.addEventListener('click', () => {
        const isVisible = filtersContainer.style.display === 'flex';
        filtersContainer.style.display = isVisible ? 'none' : 'flex';
        btnToggleTagsBar.classList.toggle('active', !isVisible);
    });
}

// Limpar todos os filtros rapidamente
window.limparTodosFiltros = function() {
    searchInput.value = '';
    tagFiltroAtiva = null;
    tipoFiltroAtivo = '';
    if (tsFilterEstado) tsFilterEstado.setValue('');
    else if (filterEstado) filterEstado.value = '';

    quickTabs.forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-tipo') === '');
    });

    aplicarFiltrosGlobais();
    mostrarToast('Filtros redefinidos.', 'info');
};

// Cópia rápida de solução direto do card
window.copiarSolucaoRapida = function(e, id) {
    e.stopPropagation();
    const item = dados.find(d => d.id === id);
    if (!item || !item.comoResolver) return;
    navigator.clipboard.writeText(item.comoResolver).then(() => {
        mostrarToast('Solução copiada para a área de transferência!', 'success');
    }).catch(() => {
        mostrarToast('Erro ao copiar solução.', 'error');
    });
};

document.addEventListener('keydown', (e) => {
    // Atalho Ctrl+K ou Cmd+K para Busca Inteligente com IA
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        abrirModal(modalAiSearch);
        if (aiSearchInput) aiSearchInput.focus();
        return;
    }
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInput.focus();
    }
});

function obterClasseDaTag(tagBase) {
    const tag = tagBase.toLowerCase();
    if (tag.includes('erro') || tag.includes('urgente') || tag.includes('falha')) return 'badge-erro';
    if (tag.includes('faq') || tag.includes('sucesso')) return 'badge-faq';
    if (tag.includes('procedimento') || tag.includes('aviso')) return 'badge-procedimento';
    if (tag.includes('codigo') || tag.includes('dev')) return 'badge-codigo';
    return 'badge-uf'; 
}

function renderCards(listaFiltrada) {
    cardsContainer.innerHTML = '';
    
    if (listaFiltrada.length === 0) {
        cardsContainer.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; padding: 48px 16px;">
                <div class="empty-state-icon"><i data-lucide="inbox" style="width: 48px; height: 48px; color: var(--text-muted);"></i></div>
                <div class="empty-state-title" style="font-size: 16px; margin-top: 10px;">Nenhum registro encontrado</div>
                <div class="empty-state-desc" style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Tente alterar sua pesquisa, categoria ou filtros de tags.</div>
                <button class="btn-secondary" onclick="limparTodosFiltros()" style="margin-top: 16px; display: inline-flex; align-items: center; gap: 6px;">
                    <i data-lucide="rotate-ccw" style="width: 14px;"></i> Limpar Filtros
                </button>
            </div>`;
        lucide.createIcons();
        return;
    }

    listaFiltrada.forEach(item => {
        const card = document.createElement('div');
        const tipoClass = item.tipo === 'Erro' ? 'card-type-erro' : (item.tipo === 'Procedimento' ? 'card-type-procedimento' : 'card-type-faq');
        card.className = `knowledge-card ${tipoClass}`;
        
        const arrayTags = item.tags ? item.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [];
        const tagsHTML = arrayTags.slice(0, 3).map(tag => `<span class="badge ${obterClasseDaTag(tag)}">${tag}</span>`).join('');
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
        const imageIcon = item.imagem ? `<span title="Contém imagem anexada"><i data-lucide="image" style="width: 14px; color: var(--accent);"></i></span>` : '';

        const dataFormatada = new Date(item.id).toLocaleDateString('pt-BR');

        card.innerHTML = `
            <div class="card-header">
                <div class="card-badges">
                    ${tipoHTML}
                    ${estadoHTML}
                    ${tagsHTML}
                    ${extraTagsCount}
                </div>
            </div>
            <h3 class="card-title" style="display:flex; justify-content:space-between; align-items:start; gap: 8px;">
                <span>${item.nomeErro}</span>
                ${imageIcon}
            </h3>
            <p class="card-desc">${item.procedimento}</p>
            <div class="card-footer">
                <span class="card-date"><i data-lucide="calendar" style="width: 12px; color: var(--text-muted);"></i> ${dataFormatada}</span>
                <div class="card-actions" onclick="event.stopPropagation()">
                    <button class="icon-btn" onclick="copiarSolucaoRapida(event, ${item.id})" title="Copiar Solução"><i data-lucide="copy" style="width: 13px;"></i></button>
                    <button class="icon-btn" onclick="abrirEdicao(${item.id})" title="Editar"><i data-lucide="edit-2" style="width: 13px;"></i></button>
                    <button class="icon-btn danger" onclick="excluirRegistro(${item.id})" title="Excluir"><i data-lucide="trash-2" style="width: 13px;"></i></button>
                </div>
            </div>
        `;

        card.addEventListener('click', () => abrirVisualizacao(item));
        cardsContainer.appendChild(card);
    });
    
    lucide.createIcons();
}

// ==========================================
// UPLOAD DE IMAGEM (Base64)
// ==========================================
imagemUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) {
            mostrarToast('A imagem deve ter no máximo 2MB.', 'error');
            imagemUpload.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = function(event) {
            imagemBase64.value = event.target.result;
            imgPreviewTag.src = event.target.result;
            imagemPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

btnRemoverImagem.addEventListener('click', () => {
    imagemUpload.value = '';
    imagemBase64.value = '';
    imagemPreview.style.display = 'none';
});

// ==========================================
// CRUD (Async)
// ==========================================
btnAdicionar.addEventListener('click', () => {
    formProcedimento.reset(); 
    erroIdInput.value = '';   
    document.getElementById('tipo').value = 'Procedimento';
    if (tsEstado) tsEstado.setValue('Nacional');
    else document.getElementById('estado').value = 'Nacional';
    imagemUpload.value = '';
    imagemBase64.value = '';
    imagemPreview.style.display = 'none';
    modalTitle.textContent = 'Novo Procedimento';
    abrirModal(modalForm);
});

formProcedimento.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btnSubmit = formProcedimento.querySelector('button[type="submit"]');
    const originalText = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.style.opacity = '0.7';
    btnSubmit.style.cursor = 'not-allowed';
    btnSubmit.innerHTML = '<i data-lucide="loader" class="lucide-spin" style="width: 15px; margin-right: 6px;"></i> Salvando...';
    lucide.createIcons();
    
    const idExistente = erroIdInput.value;
    const novoRegistro = {
        id: idExistente ? parseInt(idExistente) : Date.now(),
        nomeErro: document.getElementById('nomeErro').value,
        tipo: document.getElementById('tipo').value,
        estado: document.getElementById('estado').value,
        tags: document.getElementById('tags').value,
        imagem: imagemBase64.value,
        procedimento: document.getElementById('procedimento').value,
        comoResolver: document.getElementById('comoResolver').value
    };

    try {
        if (idExistente) {
            await db.update(novoRegistro.id, novoRegistro);
            mostrarToast('Registro atualizado com sucesso.', 'success');
        } else {
            await db.create(novoRegistro);
            mostrarToast('Procedimento criado com sucesso.', 'success');
        }
        
        dados = await db.getAll();
        atualizarInterface();
        fecharModal(modalForm);
    } catch (error) {
        mostrarToast('Erro ao salvar no banco de dados.', 'error');
        console.error(error);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.style.opacity = '1';
        btnSubmit.style.cursor = 'pointer';
        btnSubmit.innerHTML = originalText;
        lucide.createIcons();
    }
});

window.abrirEdicao = function(id) {
    const registro = dados.find(d => d.id === id);
    if (!registro) return;

    erroIdInput.value = registro.id;
    document.getElementById('nomeErro').value = registro.nomeErro;
    document.getElementById('tipo').value = registro.tipo || 'Erro';
    if (tsEstado) tsEstado.setValue(registro.estado || 'Nacional');
    else document.getElementById('estado').value = registro.estado || 'Nacional';
    document.getElementById('tags').value = registro.tags || '';
    document.getElementById('procedimento').value = registro.procedimento;
    document.getElementById('comoResolver').value = registro.comoResolver;
    
    if (registro.imagem) {
        imagemBase64.value = registro.imagem;
        imgPreviewTag.src = registro.imagem;
        imagemPreview.style.display = 'block';
    } else {
        imagemUpload.value = '';
        imagemBase64.value = '';
        imagemPreview.style.display = 'none';
    }

    modalTitle.textContent = 'Editar Procedimento';
    abrirModal(modalForm);
};

window.excluirRegistro = async function(id) {
    if (confirm("Excluir permanentemente este registro?")) {
        try {
            await db.delete(id);
            dados = await db.getAll();
            
            const arrayRestantes = [];
            dados.forEach(d => {
                if(!d.tags) return;
                const arr = d.tags.split(',').map(t=>t.trim().toLowerCase());
                arrayRestantes.push(...arr);
            });
            if (tagFiltroAtiva && !arrayRestantes.includes(tagFiltroAtiva)) {
                tagFiltroAtiva = null;
            }

            atualizarInterface();
            mostrarToast('Registro removido.', 'info');
        } catch (error) {
            mostrarToast('Erro ao excluir registro.', 'error');
            console.error(error);
        }
    }
};

// ==========================================
// VISUALIZAÇÃO
// ==========================================
function abrirVisualizacao(item) {
    viewTitle.textContent = item.nomeErro;
    viewProcedimento.textContent = item.procedimento;
    viewComoResolver.textContent = item.comoResolver;
    
    const viewImageSection = document.getElementById('viewImageSection');
    const viewImage = document.getElementById('viewImage');
    
    if (item.imagem) {
        viewImage.src = item.imagem;
        viewImageSection.style.display = 'block';
    } else {
        viewImage.src = '';
        viewImageSection.style.display = 'none';
    }
    
    let badgesHTML = '';
    if (item.tipo) {
        const tipoBadgeClass = item.tipo === 'Erro' ? 'badge-erro' : (item.tipo === 'Procedimento' ? 'badge-procedimento' : 'badge-faq');
        badgesHTML += `<span class="badge ${tipoBadgeClass}">${item.tipo}</span>`;
    }
    if (item.estado) {
        badgesHTML += `<span class="badge badge-uf" style="background:var(--bg-3); border-color:var(--border); color:var(--text-secondary);">${item.estado}</span>`;
    }

    const arrayTags = item.tags ? item.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [];
    badgesHTML += arrayTags.map(tag => `<span class="badge ${obterClasseDaTag(tag)}">${tag}</span>`).join('');
    
    viewTags.innerHTML = badgesHTML;
    
    btnCopiar.onclick = () => {
        navigator.clipboard.writeText(item.comoResolver).then(() => {
            mostrarToast('Solução copiada para a área de transferência!', 'success');
        }).catch(() => {
            mostrarToast('Erro ao acessar área de transferência.', 'error');
        });
    };

    abrirModal(modalView);
}

function mostrarToast(mensagem, tipo = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    
    let icone = 'check-circle';
    if(tipo === 'error') icone = 'x-circle';
    if(tipo === 'info') icone = 'info';

    toast.innerHTML = `<i data-lucide="${icone}" style="width: 16px;"></i> <span style="display: flex; align-items: center;">${mensagem}</span>`;
    toastContainer.appendChild(toast);
    
    lucide.createIcons();
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================
// IMPORTAR / EXPORTAR
// ==========================================
btnExportar.addEventListener('click', async () => {
    const currentData = await db.getAll();
    if (currentData.length === 0) return mostrarToast('A base está vazia.', 'error');
    
    const jsonString = JSON.stringify(currentData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const tagLink = document.createElement('a');
    tagLink.href = url;
    tagLink.download = `otimizadk-backup-${new Date().toISOString().split('T')[0]}.json`;
    tagLink.click();
    URL.revokeObjectURL(url);
    mostrarToast('Backup exportado com sucesso.', 'info');
});

btnImportar.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(event) {
        try {
            const jsonImportado = JSON.parse(event.target.result);
            if (Array.isArray(jsonImportado)) {
                if (confirm("Mesclar com dados atuais?\n\nOK: Mesclar\nCancelar: Substituir Base")) {
                    const dadosFormatados = jsonImportado.map(item => ({ ...item, id: Date.now() + Math.floor(Math.random() * 10000) }));
                    await db.importData(dadosFormatados);
                } else {
                    await db.saveAll(jsonImportado);
                }
                
                dados = await db.getAll();
                atualizarInterface();
                mostrarToast("Dados importados com sucesso!", 'success');
            } else {
                mostrarToast("Arquivo não é um array válido.", 'error');
            }
        } catch (err) {
            mostrarToast("Falha ao processar o JSON.", 'error');
        }
        fileInput.value = ''; 
    };
    reader.readAsText(file);
});

// ==========================================
// THEME & SIDEBAR (Mobile)
// ==========================================
themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    if (current === 'light') {
        document.documentElement.removeAttribute('data-theme');
        themeToggle.innerHTML = '<i data-lucide="moon"></i>';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggle.innerHTML = '<i data-lucide="sun"></i>';
    }
    lucide.createIcons();
});

if (mobileMenuBtn && sidebar && sidebarOverlay) {
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('open');
    });

    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('open');
    });
}

// ==========================================
// CONTROLE DE MODAIS
// ==========================================
function abrirModal(modal) {
    modal.classList.add('open');
}

function fecharModal(modal) {
    modal.classList.remove('open');
}

closeFormModal.addEventListener('click', () => fecharModal(modalForm));
closeViewModal.addEventListener('click', () => fecharModal(modalView));
btnCancelForm.addEventListener('click', () => fecharModal(modalForm));

if (closeAiSearchModal) closeAiSearchModal.addEventListener('click', () => fecharModal(modalAiSearch));
if (closeAiConfigModal) closeAiConfigModal.addEventListener('click', () => fecharModal(modalAiConfig));
if (btnCancelAiConfig) btnCancelAiConfig.addEventListener('click', () => fecharModal(modalAiConfig));

window.addEventListener('click', (e) => {
    if (e.target === modalForm) fecharModal(modalForm);
    if (e.target === modalView) fecharModal(modalView);
    if (e.target === modalAiSearch) fecharModal(modalAiSearch);
    if (e.target === modalAiConfig) fecharModal(modalAiConfig);
});

// Inicia
init();

// Inicializa a pesquisa nos dropdowns de estado
if (window.TomSelect) {
    tsFilterEstado = new TomSelect('#filterEstado', {
        create: false,
        placeholder: 'Todos os Estados',
        allowEmptyOption: true
    });
    
    tsEstado = new TomSelect('#estado', {
        create: false,
        placeholder: 'Selecione o Estado'
    });
}

// Toggle de Tags
if (toggleTagsCheckbox && filtersContainer) {
    toggleTagsCheckbox.addEventListener('change', (e) => {
        filtersContainer.style.display = e.target.checked ? 'flex' : 'none';
    });
}

// ==========================================
// LÓGICA DE INTELIGÊNCIA ARTIFICIAL (IA)
// ==========================================

// Sincronização e Abertura do Modal de Configuração de IA
function sincronizarCamposAiConfig() {
    if (!window.aiService) return;
    const config = window.aiService.getConfig();
    if (aiProviderSelect) aiProviderSelect.value = config.provider || 'gemini';
    if (aiApiKeyInput) aiApiKeyInput.value = config.apiKey || '';
    
    const currentModel = config.model || (config.provider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini');
    if (aiModelInput) aiModelInput.value = currentModel;
    
    if (aiModelSelect) {
        const options = Array.from(aiModelSelect.options).map(o => o.value);
        if (options.includes(currentModel)) {
            aiModelSelect.value = currentModel;
            if (aiModelInput) aiModelInput.style.display = 'none';
        } else {
            aiModelSelect.value = 'custom';
            if (aiModelInput) {
                aiModelInput.style.display = 'block';
                aiModelInput.value = currentModel;
            }
        }
    }

    if (aiEndpointInput) aiEndpointInput.value = config.customEndpoint || '';
    if (aiTestStatus) aiTestStatus.style.display = 'none';
    
    atualizarVisibilidadeAiConfig();
}

function atualizarVisibilidadeAiConfig() {
    if (!aiProviderSelect) return;
    const isGemini = aiProviderSelect.value === 'gemini';
    if (aiEndpointGroup) aiEndpointGroup.style.display = isGemini ? 'none' : 'block';
    if (btnDetectarModelos) btnDetectarModelos.style.display = isGemini ? 'inline-flex' : 'none';

    if (aiKeyHint) {
        if (isGemini) {
            aiKeyHint.innerHTML = 'Obtenha uma chave gratuita em <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style="color: var(--accent); text-decoration: underline;">Google AI Studio</a>.';
        } else {
            aiKeyHint.innerHTML = 'Insira a chave da OpenAI (<a href="https://platform.openai.com/api-keys" target="_blank" style="color:var(--accent);">platform.openai.com</a>) ou de seu provedor compatível (Groq, OpenRouter).';
        }
    }
}

if (aiProviderSelect) {
    aiProviderSelect.addEventListener('change', atualizarVisibilidadeAiConfig);
}

if (aiModelSelect) {
    aiModelSelect.addEventListener('change', () => {
        if (aiModelSelect.value === 'custom') {
            aiModelInput.style.display = 'block';
            aiModelInput.focus();
        } else {
            aiModelInput.style.display = 'none';
            aiModelInput.value = aiModelSelect.value;
        }
    });
}

// Botão para Detectar Modelos Autorizados para a Chave
if (btnDetectarModelos) {
    btnDetectarModelos.addEventListener('click', async () => {
        const apiKey = aiApiKeyInput.value.trim();
        if (!apiKey) {
            mostrarToast('Cole sua Chave de API antes de detectar os modelos.', 'info');
            aiApiKeyInput.focus();
            return;
        }

        const originalHtml = btnDetectarModelos.innerHTML;
        btnDetectarModelos.disabled = true;
        btnDetectarModelos.innerHTML = '<i data-lucide="loader" class="lucide-spin" style="width: 12px;"></i> Buscando...';
        lucide.createIcons();

        try {
            const modelos = await window.aiService.listarModelosGemini(apiKey);
            if (modelos && modelos.length > 0) {
                aiModelSelect.innerHTML = '';
                modelos.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m;
                    opt.textContent = m + (m.includes('2.0') ? ' (Recomendado)' : '');
                    aiModelSelect.appendChild(opt);
                });
                const optCustom = document.createElement('option');
                optCustom.value = 'custom';
                optCustom.textContent = 'Outro modelo (digitar manualmente)...';
                aiModelSelect.appendChild(optCustom);

                const prioridades = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash-8b', 'gemini-1.5-pro'];
                const best = prioridades.find(p => modelos.includes(p)) || modelos[0];
                aiModelSelect.value = best;
                aiModelInput.value = best;
                aiModelInput.style.display = 'none';

                mostrarToast(`${modelos.length} modelos encontrados! Selecionado: ${best}`, 'success');
            } else {
                mostrarToast('Nenhum modelo compatível retornado para esta chave.', 'error');
            }
        } catch (err) {
            console.error(err);
            mostrarToast(`Erro ao detectar modelos: ${err.message}`, 'error');
        } finally {
            btnDetectarModelos.disabled = false;
            btnDetectarModelos.innerHTML = originalHtml;
            lucide.createIcons();
        }
    });
}

if (btnOpenAiConfig) {
    btnOpenAiConfig.addEventListener('click', () => {
        sincronizarCamposAiConfig();
        abrirModal(modalAiConfig);
    });
}

if (btnToggleShowKey && aiApiKeyInput) {
    btnToggleShowKey.addEventListener('click', () => {
        if (aiApiKeyInput.type === 'password') {
            aiApiKeyInput.type = 'text';
            btnToggleShowKey.innerHTML = '<i data-lucide="eye-off" style="width: 16px;"></i>';
        } else {
            aiApiKeyInput.type = 'password';
            btnToggleShowKey.innerHTML = '<i data-lucide="eye" style="width: 16px;"></i>';
        }
        lucide.createIcons();
    });
}

// Testar Conexão com a IA
if (btnTestAiKey) {
    btnTestAiKey.addEventListener('click', async () => {
        const modeloEscolhido = (aiModelSelect && aiModelSelect.value !== 'custom') 
            ? aiModelSelect.value 
            : aiModelInput.value.trim();

        const testConfig = {
            provider: aiProviderSelect.value,
            apiKey: aiApiKeyInput.value.trim(),
            model: modeloEscolhido,
            customEndpoint: aiEndpointInput ? aiEndpointInput.value.trim() : ''
        };

        if (!testConfig.apiKey) {
            mostrarToast('Informe a chave de API antes de testar.', 'error');
            return;
        }

        aiTestStatus.style.display = 'block';
        aiTestStatus.style.background = 'var(--bg-3)';
        aiTestStatus.style.color = 'var(--text-primary)';
        aiTestStatus.style.border = '1px solid var(--border)';
        aiTestStatus.innerHTML = '<i data-lucide="loader" class="lucide-spin" style="width: 14px; margin-right: 6px;"></i> Testando conexão com a IA...';
        lucide.createIcons();
        btnTestAiKey.disabled = true;

        try {
            const resultado = await window.aiService.testConnection(testConfig);
            const modeloFinal = resultado.modeloUtilizado || testConfig.model;

            // Se modelos foram retornados, atualiza as opções do dropdown
            if (resultado.modelosDisponiveis && resultado.modelosDisponiveis.length > 0 && aiModelSelect) {
                aiModelSelect.innerHTML = '';
                resultado.modelosDisponiveis.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m;
                    opt.textContent = m + (m.includes('2.0') ? ' (Recomendado)' : '');
                    aiModelSelect.appendChild(opt);
                });
                const optCustom = document.createElement('option');
                optCustom.value = 'custom';
                optCustom.textContent = 'Outro modelo (digitar manualmente)...';
                aiModelSelect.appendChild(optCustom);

                aiModelSelect.value = modeloFinal;
                aiModelInput.value = modeloFinal;
                aiModelInput.style.display = 'none';
            }

            aiTestStatus.style.background = 'var(--success-glow)';
            aiTestStatus.style.color = 'var(--success)';
            aiTestStatus.style.border = '1px solid var(--success)';
            aiTestStatus.innerHTML = `<i data-lucide="check-circle" style="width: 14px; margin-right: 6px;"></i> Conexão estabelecida com sucesso!<br><span style="font-size:11px; opacity:0.9; margin-left: 20px;">Modelo ativo: <b>${modeloFinal}</b></span>`;
            lucide.createIcons();
            mostrarToast(`Chave validada com sucesso! (${modeloFinal})`, 'success');
        } catch (err) {
            aiTestStatus.style.background = 'var(--danger-glow)';
            aiTestStatus.style.color = 'var(--danger)';
            aiTestStatus.style.border = '1px solid var(--danger)';
            aiTestStatus.innerHTML = `<i data-lucide="alert-triangle" style="width: 14px; margin-right: 6px;"></i> Falha: ${err.message}`;
            lucide.createIcons();
            mostrarToast(`Falha no teste: ${err.message}`, 'error');
        } finally {
            btnTestAiKey.disabled = false;
        }
    });
}

// Salvar Configurações de IA
if (formAiConfig) {
    formAiConfig.addEventListener('submit', (e) => {
        e.preventDefault();
        const modeloEscolhido = (aiModelSelect && aiModelSelect.value !== 'custom') 
            ? aiModelSelect.value 
            : aiModelInput.value.trim();

        const novaConfig = {
            provider: aiProviderSelect.value,
            apiKey: aiApiKeyInput.value.trim(),
            model: modeloEscolhido || (aiProviderSelect.value === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini'),
            customEndpoint: aiEndpointInput ? aiEndpointInput.value.trim() : ''
        };

        window.aiService.saveConfig(novaConfig);
        mostrarToast('Configurações de IA salvas com sucesso!', 'success');
        fecharModal(modalAiConfig);
    });
}

// Helper: valida se a chave está configurada
function verificarOuAbrirConfigAi() {
    if (!window.aiService || !window.aiService.hasApiKey()) {
        mostrarToast('Configure sua chave de API para utilizar a IA.', 'info');
        sincronizarCamposAiConfig();
        abrirModal(modalAiConfig);
        return false;
    }
    return true;
}

// 1. BUSCA COM IA
if (btnOpenAiSearch) {
    btnOpenAiSearch.addEventListener('click', () => {
        abrirModal(modalAiSearch);
        if (aiSearchInput) {
            aiSearchInput.focus();
            if (searchInput && searchInput.value.trim() && !aiSearchInput.value.trim()) {
                aiSearchInput.value = searchInput.value.trim();
            }
        }
    });
}

async function executarBuscaComIa() {
    if (!verificarOuAbrirConfigAi()) return;

    const pergunta = aiSearchInput.value.trim();
    if (!pergunta) {
        mostrarToast('Digite sua dúvida ou problema para consultar a IA.', 'info');
        aiSearchInput.focus();
        return;
    }

    aiSearchLoading.style.display = 'flex';
    aiSearchOutput.style.display = 'none';
    btnExecAiSearch.disabled = true;
    btnExecAiSearch.innerHTML = '<i data-lucide="loader" class="lucide-spin" style="width: 14px; margin-right: 4px;"></i> Consultando...';
    lucide.createIcons();

    try {
        const resultado = await window.aiService.buscarComIa(pergunta, dados);

        aiAnswerText.textContent = resultado.resposta;

        // Renderizar procedimentos relacionados encontrados
        aiSourcesGrid.innerHTML = '';
        if (resultado.procedimentos && resultado.procedimentos.length > 0) {
            resultado.procedimentos.forEach(item => {
                const card = document.createElement('div');
                card.className = 'ai-source-card';
                
                const tipoBadge = item.tipo === 'Erro' ? 'badge-erro' : (item.tipo === 'Procedimento' ? 'badge-procedimento' : 'badge-faq');
                const ufBadge = item.estado ? `<span class="badge badge-uf">${item.estado}</span>` : '';

                card.innerHTML = `
                    <div class="ai-source-card-title" title="${item.nomeErro}">${item.nomeErro}</div>
                    <div class="ai-source-card-footer">
                        <div class="card-badges" style="margin: 0;">
                            <span class="badge ${tipoBadge}">${item.tipo || 'Geral'}</span>
                            ${ufBadge}
                        </div>
                        <button class="btn-secondary" style="padding: 3px 8px; font-size: 11px;">
                            <i data-lucide="external-link" style="width: 11px; margin-right: 3px;"></i> Ver
                        </button>
                    </div>
                `;

                card.addEventListener('click', () => {
                    fecharModal(modalAiSearch);
                    abrirVisualizacao(item);
                });

                aiSourcesGrid.appendChild(card);
            });
        } else {
            aiSourcesGrid.innerHTML = `
                <div style="font-size: 12px; color: var(--text-muted); padding: 8px 0;">
                    Nenhum procedimento específico foi referenciado nesta resposta.
                </div>`;
        }

        aiSearchOutput.style.display = 'flex';
        lucide.createIcons();
    } catch (err) {
        console.error('Erro na Busca com IA:', err);
        mostrarToast(err.message === 'CHAVE_NAO_CONFIGURADA' 
            ? 'Por favor, configure sua chave de API nas Configurações de IA.' 
            : `Erro ao consultar IA: ${err.message}`, 'error');
    } finally {
        aiSearchLoading.style.display = 'none';
        btnExecAiSearch.disabled = false;
        btnExecAiSearch.innerHTML = '<i data-lucide="send" style="width: 15px; margin-right: 4px;"></i> Perguntar';
        lucide.createIcons();
    }
}

if (btnExecAiSearch) {
    btnExecAiSearch.addEventListener('click', executarBuscaComIa);
}

if (aiSearchInput) {
    aiSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            executarBuscaComIa();
        }
    });
}

// Chips de sugestão da busca IA
if (aiChipSuggestions) {
    aiChipSuggestions.forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.getAttribute('data-query');
            if (query && aiSearchInput) {
                aiSearchInput.value = query;
                executarBuscaComIa();
            }
        });
    });
}

// Copiar resposta da busca com IA
if (btnCopiarRespostaIa && aiAnswerText) {
    btnCopiarRespostaIa.addEventListener('click', () => {
        navigator.clipboard.writeText(aiAnswerText.textContent).then(() => {
            mostrarToast('Resposta copiada para a área de transferência!', 'success');
        }).catch(() => {
            mostrarToast('Erro ao copiar resposta.', 'error');
        });
    });
}

// 2. CONSTRUÇÃO DO NOVO PROCEDIMENTO COM IA
if (btnAiGerarProcedimento) {
    btnAiGerarProcedimento.addEventListener('click', async () => {
        if (!verificarOuAbrirConfigAi()) return;

        let tituloAtual = document.getElementById('nomeErro').value.trim();
        if (!tituloAtual) {
            tituloAtual = prompt("Informe o título ou o problema que você deseja documentar com IA:\n(Ex: 'Erro 404 ao emitir boleto' ou 'Procedimento para trocar bobina')");
            if (!tituloAtual || !tituloAtual.trim()) return;
            document.getElementById('nomeErro').value = tituloAtual.trim();
        }

        const btn = btnAiGerarProcedimento;
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.innerHTML = '<i data-lucide="loader" class="lucide-spin" style="width: 14px; margin-right: 6px;"></i> Gerando Procedimento...';
        lucide.createIcons();

        try {
            const gerado = await window.aiService.gerarProcedimentoCompleto(tituloAtual);

            if (gerado.nomeErro) document.getElementById('nomeErro').value = gerado.nomeErro;
            if (gerado.tipo) document.getElementById('tipo').value = gerado.tipo;
            if (gerado.estado) {
                if (tsEstado) tsEstado.setValue(gerado.estado);
                else document.getElementById('estado').value = gerado.estado;
            }
            if (gerado.procedimento) document.getElementById('procedimento').value = gerado.procedimento;
            if (gerado.comoResolver) document.getElementById('comoResolver').value = gerado.comoResolver;
            if (gerado.tags) document.getElementById('tags').value = gerado.tags;

            mostrarToast('Procedimento gerado com IA com sucesso!', 'success');
        } catch (err) {
            console.error('Erro ao gerar procedimento:', err);
            mostrarToast(`Erro ao gerar procedimento: ${err.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.innerHTML = originalHtml;
            lucide.createIcons();
        }
    });
}

// Aprimorar Solução com IA
if (btnAiAprimorarSolucao) {
    btnAiAprimorarSolucao.addEventListener('click', async () => {
        if (!verificarOuAbrirConfigAi()) return;

        const titulo = document.getElementById('nomeErro').value.trim();
        const resolucaoAtual = document.getElementById('comoResolver').value.trim();

        if (!resolucaoAtual) {
            mostrarToast('Digite ao menos um esboço no campo "Como Resolver" antes de aprimorar.', 'info');
            document.getElementById('comoResolver').focus();
            return;
        }

        const btn = btnAiAprimorarSolucao;
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.innerHTML = '<i data-lucide="loader" class="lucide-spin" style="width: 14px; margin-right: 6px;"></i> Aprimorando...';
        lucide.createIcons();

        try {
            const resolucaoAprimorada = await window.aiService.aprimorarSolucao(titulo, resolucaoAtual);
            document.getElementById('comoResolver').value = resolucaoAprimorada;
            mostrarToast('Solução aprimorada e reestruturada com IA!', 'success');
        } catch (err) {
            console.error('Erro ao aprimorar solução:', err);
            mostrarToast(`Erro ao aprimorar: ${err.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.innerHTML = originalHtml;
            lucide.createIcons();
        }
    });
}

// 3. GERAÇÃO DE TAGS COM IA
if (btnAiGerarTags) {
    btnAiGerarTags.addEventListener('click', async () => {
        if (!verificarOuAbrirConfigAi()) return;

        const titulo = document.getElementById('nomeErro').value.trim();
        const contexto = document.getElementById('procedimento').value.trim();
        const resolucao = document.getElementById('comoResolver').value.trim();

        if (!titulo && !contexto && !resolucao) {
            mostrarToast('Preencha ao menos o Título ou o Conteúdo antes de gerar tags.', 'info');
            document.getElementById('nomeErro').focus();
            return;
        }

        const btn = btnAiGerarTags;
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.innerHTML = '<i data-lucide="loader" class="lucide-spin" style="width: 12px; margin-right: 4px;"></i> Sugerindo...';
        lucide.createIcons();

        try {
            const tagsSugeridas = await window.aiService.gerarTags(titulo, contexto, resolucao);
            if (tagsSugeridas) {
                document.getElementById('tags').value = tagsSugeridas;
                mostrarToast('Tags geradas com IA com sucesso!', 'success');
            } else {
                mostrarToast('Não foi possível sugerir tags para o conteúdo informado.', 'info');
            }
        } catch (err) {
            console.error('Erro ao gerar tags com IA:', err);
            mostrarToast(`Erro ao gerar tags: ${err.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.innerHTML = originalHtml;
            lucide.createIcons();
        }
    });
}
