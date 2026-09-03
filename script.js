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

// Camada de Abstração Híbrida (Supabase com fallback automático para LocalStorage)
const db = {
    async getAll() {
        if (supabaseClient && !modoOffline) {
            try {
                const { data, error } = await supabaseClient.from('procedimentos').select('*').order('id', { ascending: false });
                if (error) throw error;
                return data || [];
            } catch (err) {
                console.warn('⚠️ Supabase indisponível (URL inexistente, projeto pausado ou erro de rede). Alternando para modo LocalStorage:', err.message || err);
                modoOffline = true;
                setTimeout(() => {
                    if (typeof mostrarToast === 'function') {
                        mostrarToast('Supabase indisponível. Operando no modo local (offline).', 'info');
                    }
                }, 500);
            }
        }
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

// State
let dados = [];
let tagFiltroAtiva = null;
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
    
    let html = '';
    if (todasTags.size > 0) {
        const activeClass = tagFiltroAtiva === null ? 'active' : '';
        html += `<button class="filter-chip ${activeClass}" onclick="setTagFiltro(null)">Sem Tag Específica</button>`;
    }
    Array.from(todasTags).sort().forEach(tag => {
        const activeClass = tagFiltroAtiva === tag ? 'active' : '';
        html += `<button class="filter-chip ${activeClass}" onclick="setTagFiltro('${tag}')">#${tag}</button>`;
    });
    
    filtersContainer.innerHTML = html;
}

window.setTagFiltro = function(tag) {
    tagFiltroAtiva = tag;
    aplicarFiltrosGlobais();
}

function aplicarFiltrosGlobais() {
    const termo = searchInput.value.toLowerCase();
    const fTipo = filterTipo.value;
    const fEstado = filterEstado.value;
    
    const dadosFiltrados = dados.filter(item => {
        const arrayTags = item.tags ? item.tags.split(',').map(tag => tag.trim().toLowerCase()) : [];
        const tituloMatch = item.nomeErro.toLowerCase().includes(termo);
        const tagsMatchBusca = arrayTags.some(t => t.includes(termo));
        
        const passaBusca = tituloMatch || tagsMatchBusca;
        const passaTag = tagFiltroAtiva ? arrayTags.includes(tagFiltroAtiva) : true;
        
        // Verifica prop para garantir compatibilidade com registros antigos
        const passaTipo = fTipo ? (item.tipo === fTipo) : true;
        const passaEstado = fEstado ? (item.estado === fEstado) : true;
        
        return passaBusca && passaTag && passaTipo && passaEstado;
    });
    
    renderTagsFilter();
    renderCards(dadosFiltrados);
}

function atualizarInterface() {
    aplicarFiltrosGlobais();
}

searchInput.addEventListener('input', aplicarFiltrosGlobais);
filterTipo.addEventListener('change', aplicarFiltrosGlobais);
filterEstado.addEventListener('change', aplicarFiltrosGlobais);

document.addEventListener('keydown', (e) => {
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
            <div class="empty-state">
                <div class="empty-state-icon"><i data-lucide="inbox" style="width: 48px; height: 48px;"></i></div>
                <div class="empty-state-title">Nenhum registro encontrado</div>
                <div class="empty-state-desc">Tente alterar sua busca ou os filtros de categoria/tags.</div>
            </div>`;
        lucide.createIcons();
        return;
    }

    listaFiltrada.forEach(item => {
        const card = document.createElement('div');
        card.className = 'knowledge-card';
        
        const arrayTags = item.tags ? item.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [];
        const tagsHTML = arrayTags.map(tag => `<span class="badge ${obterClasseDaTag(tag)}">${tag}</span>`).join('');
        
        const tipoBadgeClass = item.tipo === 'Erro' ? 'badge-erro' : (item.tipo === 'Procedimento' ? 'badge-procedimento' : 'badge-faq');
        const tipoHTML = item.tipo ? `<span class="badge ${tipoBadgeClass}">${item.tipo}</span>` : '';
        const estadoHTML = item.estado ? `<span class="badge badge-uf" style="background:var(--bg-3); border-color:var(--border); color:var(--text-secondary);">${item.estado}</span>` : '';
        const imageIcon = item.imagem ? `<span title="Contém imagem"><i data-lucide="image" style="width: 14px; color: var(--accent);"></i></span>` : '';

        const dataFormatada = new Date(item.id).toLocaleDateString('pt-BR');

        card.innerHTML = `
            <div class="card-header">
                <div class="card-badges">
                    ${tipoHTML}
                    ${estadoHTML}
                    ${tagsHTML}
                </div>
            </div>
            <h3 class="card-title" style="display:flex; justify-content:space-between; align-items:start;">
                <span>${item.nomeErro}</span>
                ${imageIcon}
            </h3>
            <p class="card-desc">${item.procedimento}</p>
            <div class="card-footer">
                <span class="card-date">${dataFormatada}</span>
                <div class="card-actions" onclick="event.stopPropagation()">
                    <button class="icon-btn" onclick="abrirEdicao(${item.id})" title="Editar"><i data-lucide="edit-2" style="width: 14px;"></i></button>
                    <button class="icon-btn danger" onclick="excluirRegistro(${item.id})" title="Excluir"><i data-lucide="trash-2" style="width: 14px;"></i></button>
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

window.addEventListener('click', (e) => {
    if (e.target === modalForm) fecharModal(modalForm);
    if (e.target === modalView) fecharModal(modalView);
});

// Inicia
init();

// Inicializa a pesquisa nos dropdowns de estado
if (window.TomSelect) {
    new TomSelect('#filterEstado', {
        create: false,
        placeholder: 'Todos os Estados',
        allowEmptyOption: true
    });
    
    new TomSelect('#estado', {
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
