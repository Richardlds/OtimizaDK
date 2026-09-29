/**
 * OTIMIZADK - Modal de Busca Inteligente com IA (RAG)
 */

const AiSearchModal = {
    init() {
        const btnOpenAiSearch = document.getElementById('btnOpenAiSearch');
        const modalAiSearch = document.getElementById('modalAiSearch');
        const closeAiSearchModal = document.getElementById('closeAiSearchModal');
        const btnExecAiSearch = document.getElementById('btnExecAiSearch');
        const aiSearchInput = document.getElementById('aiSearchInput');
        const btnCopiarRespostaIa = document.getElementById('btnCopiarRespostaIa');
        const aiChipSuggestions = document.querySelectorAll('.ai-chip-suggestion');

        if (btnOpenAiSearch) {
            btnOpenAiSearch.addEventListener('click', () => this.open());
        }

        if (closeAiSearchModal) {
            closeAiSearchModal.addEventListener('click', () => this.close());
        }

        if (btnExecAiSearch) {
            btnExecAiSearch.addEventListener('click', () => this.executarBusca());
        }

        if (aiSearchInput) {
            aiSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.executarBusca();
                }
            });
        }

        if (aiChipSuggestions) {
            aiChipSuggestions.forEach(chip => {
                chip.addEventListener('click', () => {
                    const query = chip.getAttribute('data-query');
                    if (query && aiSearchInput) {
                        aiSearchInput.value = query;
                        this.executarBusca();
                    }
                });
            });
        }

        if (btnCopiarRespostaIa) {
            btnCopiarRespostaIa.addEventListener('click', () => this.copiarResposta());
        }
    },

    open() {
        const modalAiSearch = document.getElementById('modalAiSearch');
        const aiSearchInput = document.getElementById('aiSearchInput');
        const searchInput = document.getElementById('searchInput');

        if (modalAiSearch) modalAiSearch.classList.add('open');
        if (aiSearchInput) {
            aiSearchInput.focus();
            if (searchInput && searchInput.value.trim() && !aiSearchInput.value.trim()) {
                aiSearchInput.value = searchInput.value.trim();
            }
        }
        if (window.lucide) window.lucide.createIcons();
    },

    close() {
        const modalAiSearch = document.getElementById('modalAiSearch');
        if (modalAiSearch) modalAiSearch.classList.remove('open');
    },

    verificarChave() {
        if (!window.aiService || !window.aiService.hasApiKey()) {
            if (window.Toast) window.Toast.show('Configure sua chave de API nas Configurações de IA.', 'info');
            if (window.AiConfigModal) window.AiConfigModal.open();
            return false;
        }
        return true;
    },

    async executarBusca() {
        if (!this.verificarChave()) return;

        const aiSearchInput = document.getElementById('aiSearchInput');
        const aiSearchLoading = document.getElementById('aiSearchLoading');
        const aiSearchOutput = document.getElementById('aiSearchOutput');
        const aiAnswerText = document.getElementById('aiAnswerText');
        const aiSourcesGrid = document.getElementById('aiSourcesGrid');
        const btnExecAiSearch = document.getElementById('btnExecAiSearch');

        const pergunta = aiSearchInput ? aiSearchInput.value.trim() : '';
        if (!pergunta) {
            if (window.Toast) window.Toast.show('Digite sua dúvida ou problema para consultar a IA.', 'info');
            if (aiSearchInput) aiSearchInput.focus();
            return;
        }

        if (aiSearchLoading) aiSearchLoading.style.display = 'flex';
        if (aiSearchOutput) aiSearchOutput.style.display = 'none';
        
        if (btnExecAiSearch) {
            btnExecAiSearch.disabled = true;
            btnExecAiSearch.innerHTML = '<i data-lucide="loader" class="lucide-spin" style="width: 14px; margin-right: 4px;"></i> Consultando...';
            if (window.lucide) window.lucide.createIcons();
        }

        try {
            const resultado = await window.aiService.buscarComIa(pergunta, window.State.dados);

            if (aiAnswerText) aiAnswerText.textContent = resultado.resposta;

            // Renderizar procedimentos relacionados encontrados
            if (aiSourcesGrid) {
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
                            this.close();
                            if (window.ViewModal) window.ViewModal.open(item);
                        });

                        aiSourcesGrid.appendChild(card);
                    });
                } else {
                    aiSourcesGrid.innerHTML = `
                        <div style="font-size: 12px; color: var(--text-muted); padding: 8px 0;">
                            Nenhum procedimento específico foi referenciado nesta resposta.
                        </div>`;
                }
            }

            if (aiSearchOutput) aiSearchOutput.style.display = 'flex';
            if (window.lucide) window.lucide.createIcons();
        } catch (err) {
            console.error('Erro na Busca com IA:', err);
            if (window.Toast) {
                window.Toast.show(err.message === 'CHAVE_NAO_CONFIGURADA' 
                    ? 'Por favor, configure sua chave de API nas Configurações de IA.' 
                    : `Erro ao consultar IA: ${err.message}`, 'error');
            }
        } finally {
            if (aiSearchLoading) aiSearchLoading.style.display = 'none';
            if (btnExecAiSearch) {
                btnExecAiSearch.disabled = false;
                btnExecAiSearch.innerHTML = '<i data-lucide="send" style="width: 15px; margin-right: 4px;"></i> Perguntar';
                if (window.lucide) window.lucide.createIcons();
            }
        }
    },

    copiarResposta() {
        const aiAnswerText = document.getElementById('aiAnswerText');
        if (!aiAnswerText) return;

        navigator.clipboard.writeText(aiAnswerText.textContent).then(() => {
            if (window.Toast) window.Toast.show('Resposta copiada para a área de transferência!', 'success');
        }).catch(() => {
            if (window.Toast) window.Toast.show('Erro ao copiar resposta.', 'error');
        });
    }
};

window.AiSearchModal = AiSearchModal;
