/**
 * OTIMIZADK - Ponto de Entrada Principal da Aplicação (App Bootstrap)
 */

const App = {
    async init() {
        console.log('🚀 Inicializando OtimizaDK...');

        // 1. Inicializar Componentes & Modais
        if (window.LightboxComponent) window.LightboxComponent.init();
        if (window.DropzoneComponent) window.DropzoneComponent.init();
        if (window.FiltersComponent) window.FiltersComponent.init();
        if (window.FormModal) window.FormModal.init();
        if (window.ViewModal) window.ViewModal.init();
        if (window.AiSearchModal) window.AiSearchModal.init();
        if (window.AiConfigModal) window.AiConfigModal.init();
        if (window.ShortcutsModal) window.ShortcutsModal.init();

        // 2. Inicializar Temas, Sidebar e Backup
        this.initTheme();
        this.initSidebarMobile();
        this.initBackupHandlers();
        this.initTomSelect();
        this.initModalBackdropClick();

        // 3. Exibir Estado de Carregamento Inicial
        const cardsContainer = document.getElementById('cardsContainer');
        if (cardsContainer) {
            cardsContainer.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; padding: 48px 16px;">
                    <div class="empty-state-icon"><i data-lucide="loader" class="lucide-spin" style="width: 48px; height: 48px; color: var(--accent);"></i></div>
                    <div class="empty-state-title" style="margin-top: 12px; font-size: 16px;">Carregando Base de Conhecimento...</div>
                    <div class="empty-state-desc" style="color: var(--text-secondary); font-size: 13px;">Buscando procedimentos e soluções...</div>
                </div>`;
            if (window.lucide) window.lucide.createIcons();
        }

        // 4. Carregar Dados do Banco de Dados
        try {
            window.State.dados = await window.db.getAll();
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
            window.State.dados = window.db.getLocalDados();
        }

        // 5. Seed Inicial se a base estiver vazia
        if (!window.State.dados || window.State.dados.length === 0) {
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
            await window.db.saveAll(mockData);
            window.State.dados = mockData;
        }

        // 6. Atualizar Interface do Usuário
        if (window.FiltersComponent) {
            window.FiltersComponent.aplicar();
        }

        if (window.lucide) {
            window.lucide.createIcons();
        }

        console.log('✅ OtimizaDK pronto para uso!');
    },

    initTheme() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            if (current === 'light') {
                document.documentElement.removeAttribute('data-theme');
                themeToggle.innerHTML = '<i data-lucide="moon"></i>';
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
                themeToggle.innerHTML = '<i data-lucide="sun"></i>';
            }
            if (window.lucide) window.lucide.createIcons();
        });
    },

    initSidebarMobile() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

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
    },

    initBackupHandlers() {
        const btnExportar = document.getElementById('btnExportar');
        const btnImportar = document.getElementById('btnImportar');
        const fileInput = document.getElementById('fileInput');

        if (btnExportar) {
            btnExportar.addEventListener('click', async () => {
                const currentData = await window.db.getAll();
                if (currentData.length === 0) {
                    if (window.Toast) window.Toast.show('A base está vazia.', 'error');
                    return;
                }

                const jsonString = JSON.stringify(currentData, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const tagLink = document.createElement('a');
                tagLink.href = url;
                tagLink.download = `otimizadk-backup-${new Date().toISOString().split('T')[0]}.json`;
                tagLink.click();
                URL.revokeObjectURL(url);
                if (window.Toast) window.Toast.show('Backup exportado com sucesso.', 'info');
            });
        }

        if (btnImportar && fileInput) {
            btnImportar.addEventListener('click', () => fileInput.click());

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const jsonImportado = JSON.parse(event.target.result);
                        if (Array.isArray(jsonImportado)) {
                            if (confirm("Mesclar com dados atuais?\n\nOK: Mesclar\nCancelar: Substituir Base")) {
                                const dadosFormatados = jsonImportado.map(item => ({ ...item, id: Date.now() + Math.floor(Math.random() * 10000) }));
                                await window.db.importData(dadosFormatados);
                            } else {
                                await window.db.saveAll(jsonImportado);
                            }

                            window.State.dados = await window.db.getAll();
                            if (window.FiltersComponent) window.FiltersComponent.aplicar();
                            if (window.Toast) window.Toast.show("Dados importados com sucesso!", 'success');
                        } else {
                            if (window.Toast) window.Toast.show("Arquivo não é um array válido.", 'error');
                        }
                    } catch (err) {
                        if (window.Toast) window.Toast.show("Falha ao processar o JSON.", 'error');
                    }
                    fileInput.value = '';
                };
                reader.readAsText(file);
            });
        }
    },

    initTomSelect() {
        if (window.TomSelect) {
            try {
                window.State.tsFilterEstado = new TomSelect('#filterEstado', {
                    create: false,
                    placeholder: 'Todos os Estados',
                    allowEmptyOption: true
                });

                window.State.tsEstado = new TomSelect('#estado', {
                    create: false,
                    placeholder: 'Selecione o Estado'
                });
            } catch (err) {
                console.warn('TomSelect não pôde ser inicializado:', err);
            }
        }
    },

    initModalBackdropClick() {
        const modalForm = document.getElementById('modalForm');
        const modalView = document.getElementById('modalView');
        const modalAiSearch = document.getElementById('modalAiSearch');
        const modalAiConfig = document.getElementById('modalAiConfig');
        const modalShortcuts = document.getElementById('modalShortcuts');

        window.addEventListener('click', (e) => {
            if (e.target === modalForm && window.FormModal) window.FormModal.close();
            if (e.target === modalView && window.ViewModal) window.ViewModal.close();
            if (e.target === modalAiSearch && window.AiSearchModal) window.AiSearchModal.close();
            if (e.target === modalAiConfig && window.AiConfigModal) window.AiConfigModal.close();
            if (e.target === modalShortcuts && window.ShortcutsModal) window.ShortcutsModal.close();
        });
    }
};

window.App = App;

// Auto-iniciar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
