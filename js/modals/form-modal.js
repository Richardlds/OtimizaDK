/**
 * OTIMIZADK - Modal de Formulário de Cadastro e Edição de Procedimentos
 */

const FormModal = {
    init() {
        const modalForm = document.getElementById('modalForm');
        const formProcedimento = document.getElementById('formProcedimento');
        const closeFormModal = document.getElementById('closeFormModal');
        const btnCancelForm = document.getElementById('btnCancelForm');
        const btnAdicionar = document.getElementById('btnAdicionar');

        // Botões de IA no formulário
        const btnAiGerarProcedimento = document.getElementById('btnAiGerarProcedimento');
        const btnAiAprimorarSolucao = document.getElementById('btnAiAprimorarSolucao');
        const btnAiGerarTags = document.getElementById('btnAiGerarTags');
        const btnAiAnalisarPrint = document.getElementById('btnAiAnalisarPrint');

        if (btnAdicionar) {
            btnAdicionar.addEventListener('click', () => this.openNew());
        }

        if (closeFormModal) {
            closeFormModal.addEventListener('click', () => this.close());
        }

        if (btnCancelForm) {
            btnCancelForm.addEventListener('click', () => this.close());
        }

        if (formProcedimento) {
            formProcedimento.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // IA: Gerar Procedimento Completo
        if (btnAiGerarProcedimento) {
            btnAiGerarProcedimento.addEventListener('click', () => this.handleAiGerarProcedimento());
        }

        // IA: Aprimorar Solução
        if (btnAiAprimorarSolucao) {
            btnAiAprimorarSolucao.addEventListener('click', () => this.handleAiAprimorarSolucao());
        }

        // IA: Gerar Tags
        if (btnAiGerarTags) {
            btnAiGerarTags.addEventListener('click', () => this.handleAiGerarTags());
        }

        // IA: Diagnosticar Print com Visão Computacional
        if (btnAiAnalisarPrint) {
            btnAiAnalisarPrint.addEventListener('click', () => this.handleAiAnalisarPrint());
        }
    },

    openNew() {
        const formProcedimento = document.getElementById('formProcedimento');
        const erroIdInput = document.getElementById('erroId');
        const modalTitle = document.getElementById('modalTitle');
        const modalForm = document.getElementById('modalForm');

        if (formProcedimento) formProcedimento.reset();
        if (erroIdInput) erroIdInput.value = '';
        
        const tipoEl = document.getElementById('tipo');
        if (tipoEl) tipoEl.value = 'Procedimento';

        if (window.State.tsEstado) {
            window.State.tsEstado.setValue('Nacional');
        } else {
            const estadoEl = document.getElementById('estado');
            if (estadoEl) estadoEl.value = 'Nacional';
        }

        if (window.DropzoneComponent) {
            window.DropzoneComponent.reset();
        }

        if (modalTitle) modalTitle.textContent = 'Novo Procedimento';
        if (modalForm) modalForm.classList.add('open');
        if (window.lucide) window.lucide.createIcons();
    },

    open(id) {
        const registro = window.State.dados.find(d => d.id === id);
        if (!registro) return;

        const erroIdInput = document.getElementById('erroId');
        const modalTitle = document.getElementById('modalTitle');
        const modalForm = document.getElementById('modalForm');

        if (erroIdInput) erroIdInput.value = registro.id;
        
        const nomeErroEl = document.getElementById('nomeErro');
        if (nomeErroEl) nomeErroEl.value = registro.nomeErro || '';

        const tipoEl = document.getElementById('tipo');
        if (tipoEl) tipoEl.value = registro.tipo || 'Erro';

        if (window.State.tsEstado) {
            window.State.tsEstado.setValue(registro.estado || 'Nacional');
        } else {
            const estadoEl = document.getElementById('estado');
            if (estadoEl) estadoEl.value = registro.estado || 'Nacional';
        }

        const tagsEl = document.getElementById('tags');
        if (tagsEl) tagsEl.value = registro.tags || '';

        const procedimentoEl = document.getElementById('procedimento');
        if (procedimentoEl) procedimentoEl.value = registro.procedimento || '';

        const comoResolverEl = document.getElementById('comoResolver');
        if (comoResolverEl) comoResolverEl.value = registro.comoResolver || '';

        // Carrega fotos
        const fotos = window.ImageUtils.extrairImagens(registro);
        if (window.DropzoneComponent) {
            window.DropzoneComponent.setFotos(fotos);
        }

        if (modalTitle) modalTitle.textContent = 'Editar Procedimento';
        if (modalForm) modalForm.classList.add('open');
        if (window.lucide) window.lucide.createIcons();
    },

    close() {
        const modalForm = document.getElementById('modalForm');
        if (modalForm) modalForm.classList.remove('open');
    },

    async handleSubmit(e) {
        e.preventDefault();
        const formProcedimento = document.getElementById('formProcedimento');
        const erroIdInput = document.getElementById('erroId');
        const modalForm = document.getElementById('modalForm');
        const btnSubmit = formProcedimento.querySelector('button[type="submit"]');

        const originalText = btnSubmit.innerHTML;
        btnSubmit.disabled = true;
        btnSubmit.style.opacity = '0.7';
        btnSubmit.style.cursor = 'not-allowed';
        btnSubmit.innerHTML = '<i data-lucide="loader" class="lucide-spin" style="width: 15px; margin-right: 6px;"></i> Salvando...';
        if (window.lucide) window.lucide.createIcons();

        const idExistente = erroIdInput.value;
        const imagensSalvas = [...window.State.fotosFormulario];
        
        const novoRegistro = {
            id: idExistente ? parseInt(idExistente) : Date.now(),
            nomeErro: document.getElementById('nomeErro').value,
            tipo: document.getElementById('tipo').value,
            estado: document.getElementById('estado').value,
            tags: document.getElementById('tags').value,
            imagens: imagensSalvas,
            imagem: imagensSalvas.length > 0 ? JSON.stringify(imagensSalvas) : '',
            procedimento: document.getElementById('procedimento').value,
            comoResolver: document.getElementById('comoResolver').value,
            favorito: window.State.favoritos.has(idExistente ? parseInt(idExistente) : null) || false
        };

        try {
            if (idExistente) {
                await window.db.update(novoRegistro.id, novoRegistro);
                if (window.Toast) window.Toast.show('Registro atualizado com sucesso.', 'success');
            } else {
                await window.db.create(novoRegistro);
                if (window.Toast) window.Toast.show('Procedimento criado com sucesso.', 'success');
            }

            window.State.dados = await window.db.getAll();
            if (window.FiltersComponent) window.FiltersComponent.aplicar();
            this.close();
        } catch (error) {
            if (window.Toast) window.Toast.show('Erro ao salvar no banco de dados.', 'error');
            console.error('Erro ao salvar:', error);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.style.opacity = '1';
            btnSubmit.style.cursor = 'pointer';
            btnSubmit.innerHTML = originalText;
            if (window.lucide) window.lucide.createIcons();
        }
    },

    async excluir(id) {
        if (confirm("Excluir permanentemente este registro?")) {
            try {
                await window.db.delete(id);
                window.State.favoritos.delete(id);
                window.State.salvarFavoritos();
                window.State.dados = await window.db.getAll();

                const arrayRestantes = [];
                window.State.dados.forEach(d => {
                    if (!d.tags) return;
                    const arr = d.tags.split(',').map(t => t.trim().toLowerCase());
                    arrayRestantes.push(...arr);
                });
                if (window.State.tagFiltroAtiva && !arrayRestantes.includes(window.State.tagFiltroAtiva)) {
                    window.State.tagFiltroAtiva = null;
                }

                if (window.FiltersComponent) window.FiltersComponent.aplicar();
                if (window.Toast) window.Toast.show('Registro removido.', 'info');
            } catch (error) {
                if (window.Toast) window.Toast.show('Erro ao excluir registro.', 'error');
                console.error('Erro ao excluir:', error);
            }
        }
    },

    // IA Handlers
    verificarAi() {
        if (!window.aiService || !window.aiService.hasApiKey()) {
            if (window.Toast) window.Toast.show('Configure sua chave de API para utilizar a IA.', 'info');
            if (window.AiConfigModal) window.AiConfigModal.open();
            return false;
        }
        return true;
    },

    async handleAiGerarProcedimento() {
        if (!this.verificarAi()) return;

        let tituloAtual = document.getElementById('nomeErro').value.trim();
        if (!tituloAtual) {
            tituloAtual = prompt("Informe o título ou o problema que você deseja documentar com IA:\n(Ex: 'Erro 404 ao emitir boleto' ou 'Procedimento para trocar bobina')");
            if (!tituloAtual || !tituloAtual.trim()) return;
            document.getElementById('nomeErro').value = tituloAtual.trim();
        }

        const btn = document.getElementById('btnAiGerarProcedimento');
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.innerHTML = '<i data-lucide="loader" class="lucide-spin" style="width: 14px; margin-right: 6px;"></i> Gerando Procedimento...';
        if (window.lucide) window.lucide.createIcons();

        try {
            const gerado = await window.aiService.gerarProcedimentoCompleto(tituloAtual);

            if (gerado.nomeErro) document.getElementById('nomeErro').value = gerado.nomeErro;
            if (gerado.tipo) document.getElementById('tipo').value = gerado.tipo;
            if (gerado.estado) {
                if (window.State.tsEstado) window.State.tsEstado.setValue(gerado.estado);
                else document.getElementById('estado').value = gerado.estado;
            }
            if (gerado.procedimento) document.getElementById('procedimento').value = gerado.procedimento;
            if (gerado.comoResolver) document.getElementById('comoResolver').value = gerado.comoResolver;
            if (gerado.tags) document.getElementById('tags').value = gerado.tags;

            if (window.Toast) window.Toast.show('Procedimento gerado com IA com sucesso!', 'success');
        } catch (err) {
            console.error('Erro ao gerar procedimento:', err);
            if (window.Toast) window.Toast.show(`Erro ao gerar procedimento: ${err.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.innerHTML = originalHtml;
            if (window.lucide) window.lucide.createIcons();
        }
    },

    async handleAiAprimorarSolucao() {
        if (!this.verificarAi()) return;

        const titulo = document.getElementById('nomeErro').value.trim();
        const resolucaoAtual = document.getElementById('comoResolver').value.trim();

        if (!resolucaoAtual) {
            if (window.Toast) window.Toast.show('Digite ao menos um esboço no campo "Como Resolver" antes de aprimorar.', 'info');
            document.getElementById('comoResolver').focus();
            return;
        }

        const btn = document.getElementById('btnAiAprimorarSolucao');
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.innerHTML = '<i data-lucide="loader" class="lucide-spin" style="width: 14px; margin-right: 6px;"></i> Aprimorando...';
        if (window.lucide) window.lucide.createIcons();

        try {
            const resolucaoAprimorada = await window.aiService.aprimorarSolucao(titulo, resolucaoAtual);
            document.getElementById('comoResolver').value = resolucaoAprimorada;
            if (window.Toast) window.Toast.show('Solução aprimorada e reestruturada com IA!', 'success');
        } catch (err) {
            console.error('Erro ao aprimorar solução:', err);
            if (window.Toast) window.Toast.show(`Erro ao aprimorar: ${err.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.innerHTML = originalHtml;
            if (window.lucide) window.lucide.createIcons();
        }
    },

    async handleAiGerarTags() {
        if (!this.verificarAi()) return;

        const titulo = document.getElementById('nomeErro').value.trim();
        const contexto = document.getElementById('procedimento').value.trim();
        const resolucao = document.getElementById('comoResolver').value.trim();

        if (!titulo && !contexto && !resolucao) {
            if (window.Toast) window.Toast.show('Preencha ao menos o Título ou o Conteúdo antes de gerar tags.', 'info');
            document.getElementById('nomeErro').focus();
            return;
        }

        const btn = document.getElementById('btnAiGerarTags');
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.innerHTML = '<i data-lucide="loader" class="lucide-spin" style="width: 12px; margin-right: 4px;"></i> Sugerindo...';
        if (window.lucide) window.lucide.createIcons();

        try {
            const tagsSugeridas = await window.aiService.gerarTags(titulo, contexto, resolucao);
            if (tagsSugeridas) {
                document.getElementById('tags').value = tagsSugeridas;
                if (window.Toast) window.Toast.show('Tags geradas com IA com sucesso!', 'success');
            } else {
                if (window.Toast) window.Toast.show('Não foi possível sugerir tags para o conteúdo informado.', 'info');
            }
        } catch (err) {
            console.error('Erro ao gerar tags com IA:', err);
            if (window.Toast) window.Toast.show(`Erro ao gerar tags: ${err.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.innerHTML = originalHtml;
            if (window.lucide) window.lucide.createIcons();
        }
    },

    async handleAiAnalisarPrint() {
        if (!this.verificarAi()) return;
        if (window.State.fotosFormulario.length === 0) {
            if (window.Toast) window.Toast.show('Anexe ao menos uma foto ou print para diagnosticar.', 'info');
            return;
        }

        const btn = document.getElementById('btnAiAnalisarPrint');
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.innerHTML = '<i data-lucide="loader" class="lucide-spin" style="width: 14px; margin-right: 5px;"></i> Analisando Print com IA...';
        if (window.lucide) window.lucide.createIcons();

        try {
            const contextoAdicional = document.getElementById('nomeErro').value.trim();
            const diag = await window.aiService.diagnosticarImagemComIa(window.State.fotosFormulario, contextoAdicional);

            if (diag.nomeErro) document.getElementById('nomeErro').value = diag.nomeErro;
            if (diag.tipo) document.getElementById('tipo').value = diag.tipo;
            if (diag.estado) {
                if (window.State.tsEstado) window.State.tsEstado.setValue(diag.estado);
                else document.getElementById('estado').value = diag.estado;
            }
            if (diag.procedimento) document.getElementById('procedimento').value = diag.procedimento;
            if (diag.comoResolver) document.getElementById('comoResolver').value = diag.comoResolver;
            if (diag.tags) document.getElementById('tags').value = diag.tags;

            if (window.Toast) window.Toast.show('Diagnóstico visual realizado com IA com sucesso!', 'success');
        } catch (err) {
            console.error('Erro no diagnóstico visual:', err);
            if (window.Toast) window.Toast.show(`Erro na análise visual: ${err.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.innerHTML = originalHtml;
            if (window.lucide) window.lucide.createIcons();
        }
    }
};

window.FormModal = FormModal;
window.abrirEdicao = (id) => FormModal.open(id);
window.excluirRegistro = (id) => FormModal.excluir(id);
