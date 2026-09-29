/**
 * OTIMIZADK - Modal de Configuração dos Provedores e Chaves de IA
 */

const AiConfigModal = {
    init() {
        const btnOpenAiConfig = document.getElementById('btnOpenAiConfig');
        const modalAiConfig = document.getElementById('modalAiConfig');
        const closeAiConfigModal = document.getElementById('closeAiConfigModal');
        const btnCancelAiConfig = document.getElementById('btnCancelAiConfig');
        const formAiConfig = document.getElementById('formAiConfig');
        const aiProviderSelect = document.getElementById('aiProviderSelect');
        const aiModelSelect = document.getElementById('aiModelSelect');
        const btnToggleShowKey = document.getElementById('btnToggleShowKey');
        const btnDetectarModelos = document.getElementById('btnDetectarModelos');
        const btnTestAiKey = document.getElementById('btnTestAiKey');

        if (btnOpenAiConfig) {
            btnOpenAiConfig.addEventListener('click', () => this.open());
        }

        if (closeAiConfigModal) {
            closeAiConfigModal.addEventListener('click', () => this.close());
        }

        if (btnCancelAiConfig) {
            btnCancelAiConfig.addEventListener('click', () => this.close());
        }

        if (aiProviderSelect) {
            aiProviderSelect.addEventListener('change', () => this.atualizarVisibilidade());
        }

        if (aiModelSelect) {
            aiModelSelect.addEventListener('change', () => this.handleModelSelectChange());
        }

        if (btnToggleShowKey) {
            btnToggleShowKey.addEventListener('click', () => this.toggleShowKey());
        }

        if (btnDetectarModelos) {
            btnDetectarModelos.addEventListener('click', () => this.detectarModelos());
        }

        if (btnTestAiKey) {
            btnTestAiKey.addEventListener('click', () => this.testarConexao());
        }

        if (formAiConfig) {
            formAiConfig.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    },

    open() {
        this.sincronizarCampos();
        const modalAiConfig = document.getElementById('modalAiConfig');
        if (modalAiConfig) modalAiConfig.classList.add('open');
        if (window.lucide) window.lucide.createIcons();
    },

    close() {
        const modalAiConfig = document.getElementById('modalAiConfig');
        if (modalAiConfig) modalAiConfig.classList.remove('open');
    },

    sincronizarCampos() {
        if (!window.aiService) return;
        const config = window.aiService.getConfig();
        const aiProviderSelect = document.getElementById('aiProviderSelect');
        const aiApiKeyInput = document.getElementById('aiApiKeyInput');
        const aiModelSelect = document.getElementById('aiModelSelect');
        const aiModelInput = document.getElementById('aiModelInput');
        const aiEndpointInput = document.getElementById('aiEndpointInput');
        const aiTestStatus = document.getElementById('aiTestStatus');

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

        this.atualizarVisibilidade();
    },

    atualizarVisibilidade() {
        const aiProviderSelect = document.getElementById('aiProviderSelect');
        const aiEndpointGroup = document.getElementById('aiEndpointGroup');
        const btnDetectarModelos = document.getElementById('btnDetectarModelos');
        const aiKeyHint = document.getElementById('aiKeyHint');

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
    },

    handleModelSelectChange() {
        const aiModelSelect = document.getElementById('aiModelSelect');
        const aiModelInput = document.getElementById('aiModelInput');
        if (!aiModelSelect || !aiModelInput) return;

        if (aiModelSelect.value === 'custom') {
            aiModelInput.style.display = 'block';
            aiModelInput.focus();
        } else {
            aiModelInput.style.display = 'none';
            aiModelInput.value = aiModelSelect.value;
        }
    },

    toggleShowKey() {
        const aiApiKeyInput = document.getElementById('aiApiKeyInput');
        const btnToggleShowKey = document.getElementById('btnToggleShowKey');
        if (!aiApiKeyInput || !btnToggleShowKey) return;

        if (aiApiKeyInput.type === 'password') {
            aiApiKeyInput.type = 'text';
            btnToggleShowKey.innerHTML = '<i data-lucide="eye-off" style="width: 16px;"></i>';
        } else {
            aiApiKeyInput.type = 'password';
            btnToggleShowKey.innerHTML = '<i data-lucide="eye" style="width: 16px;"></i>';
        }
        if (window.lucide) window.lucide.createIcons();
    },

    async detectarModelos() {
        const aiApiKeyInput = document.getElementById('aiApiKeyInput');
        const aiModelSelect = document.getElementById('aiModelSelect');
        const aiModelInput = document.getElementById('aiModelInput');
        const btnDetectarModelos = document.getElementById('btnDetectarModelos');

        const apiKey = aiApiKeyInput ? aiApiKeyInput.value.trim() : '';
        if (!apiKey) {
            if (window.Toast) window.Toast.show('Cole sua Chave de API antes de detectar os modelos.', 'info');
            if (aiApiKeyInput) aiApiKeyInput.focus();
            return;
        }

        const originalHtml = btnDetectarModelos.innerHTML;
        btnDetectarModelos.disabled = true;
        btnDetectarModelos.innerHTML = '<i data-lucide="loader" class="lucide-spin" style="width: 12px;"></i> Buscando...';
        if (window.lucide) window.lucide.createIcons();

        try {
            const modelos = await window.aiService.listarModelosGemini(apiKey);
            if (modelos && modelos.length > 0 && aiModelSelect) {
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
                if (aiModelInput) {
                    aiModelInput.value = best;
                    aiModelInput.style.display = 'none';
                }

                if (window.Toast) window.Toast.show(`${modelos.length} modelos encontrados! Selecionado: ${best}`, 'success');
            } else {
                if (window.Toast) window.Toast.show('Nenhum modelo compatível retornado para esta chave.', 'error');
            }
        } catch (err) {
            console.error('Erro ao detectar modelos:', err);
            if (window.Toast) window.Toast.show(`Erro ao detectar modelos: ${err.message}`, 'error');
        } finally {
            btnDetectarModelos.disabled = false;
            btnDetectarModelos.innerHTML = originalHtml;
            if (window.lucide) window.lucide.createIcons();
        }
    },

    async testarConexao() {
        const aiProviderSelect = document.getElementById('aiProviderSelect');
        const aiApiKeyInput = document.getElementById('aiApiKeyInput');
        const aiModelSelect = document.getElementById('aiModelSelect');
        const aiModelInput = document.getElementById('aiModelInput');
        const aiEndpointInput = document.getElementById('aiEndpointInput');
        const aiTestStatus = document.getElementById('aiTestStatus');
        const btnTestAiKey = document.getElementById('btnTestAiKey');

        const modeloEscolhido = (aiModelSelect && aiModelSelect.value !== 'custom') 
            ? aiModelSelect.value 
            : (aiModelInput ? aiModelInput.value.trim() : '');

        const testConfig = {
            provider: aiProviderSelect ? aiProviderSelect.value : 'gemini',
            apiKey: aiApiKeyInput ? aiApiKeyInput.value.trim() : '',
            model: modeloEscolhido,
            customEndpoint: aiEndpointInput ? aiEndpointInput.value.trim() : ''
        };

        if (!testConfig.apiKey) {
            if (window.Toast) window.Toast.show('Informe a chave de API antes de testar.', 'error');
            return;
        }

        if (aiTestStatus) {
            aiTestStatus.style.display = 'block';
            aiTestStatus.style.background = 'var(--bg-3)';
            aiTestStatus.style.color = 'var(--text-primary)';
            aiTestStatus.style.border = '1px solid var(--border)';
            aiTestStatus.innerHTML = '<i data-lucide="loader" class="lucide-spin" style="width: 14px; margin-right: 6px;"></i> Testando conexão com a IA...';
            if (window.lucide) window.lucide.createIcons();
        }
        if (btnTestAiKey) btnTestAiKey.disabled = true;

        try {
            const resultado = await window.aiService.testConnection(testConfig);
            const modeloFinal = resultado.modeloUtilizado || testConfig.model;

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
                if (aiModelInput) {
                    aiModelInput.value = modeloFinal;
                    aiModelInput.style.display = 'none';
                }
            }

            if (aiTestStatus) {
                aiTestStatus.style.background = 'var(--success-glow)';
                aiTestStatus.style.color = 'var(--success)';
                aiTestStatus.style.border = '1px solid var(--success)';
                aiTestStatus.innerHTML = `<i data-lucide="check-circle" style="width: 14px; margin-right: 6px;"></i> Conexão estabelecida com sucesso!<br><span style="font-size:11px; opacity:0.9; margin-left: 20px;">Modelo ativo: <b>${modeloFinal}</b></span>`;
                if (window.lucide) window.lucide.createIcons();
            }
            if (window.Toast) window.Toast.show(`Chave validada com sucesso! (${modeloFinal})`, 'success');
        } catch (err) {
            if (aiTestStatus) {
                aiTestStatus.style.background = 'var(--danger-glow)';
                aiTestStatus.style.color = 'var(--danger)';
                aiTestStatus.style.border = '1px solid var(--danger)';
                aiTestStatus.innerHTML = `<i data-lucide="alert-triangle" style="width: 14px; margin-right: 6px;"></i> Falha: ${err.message}`;
                if (window.lucide) window.lucide.createIcons();
            }
            if (window.Toast) window.Toast.show(`Falha no teste: ${err.message}`, 'error');
        } finally {
            if (btnTestAiKey) btnTestAiKey.disabled = false;
        }
    },

    handleSubmit(e) {
        e.preventDefault();
        const aiProviderSelect = document.getElementById('aiProviderSelect');
        const aiApiKeyInput = document.getElementById('aiApiKeyInput');
        const aiModelSelect = document.getElementById('aiModelSelect');
        const aiModelInput = document.getElementById('aiModelInput');
        const aiEndpointInput = document.getElementById('aiEndpointInput');

        const modeloEscolhido = (aiModelSelect && aiModelSelect.value !== 'custom') 
            ? aiModelSelect.value 
            : (aiModelInput ? aiModelInput.value.trim() : '');

        const novaConfig = {
            provider: aiProviderSelect ? aiProviderSelect.value : 'gemini',
            apiKey: aiApiKeyInput ? aiApiKeyInput.value.trim() : '',
            model: modeloEscolhido || (aiProviderSelect.value === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini'),
            customEndpoint: aiEndpointInput ? aiEndpointInput.value.trim() : ''
        };

        window.aiService.saveConfig(novaConfig);
        if (window.Toast) window.Toast.show('Configurações de IA salvas com sucesso!', 'success');
        this.close();
    }
};

window.AiConfigModal = AiConfigModal;
window.sincronizarCamposAiConfig = () => AiConfigModal.sincronizarCampos();
window.verificarOuAbrirConfigAi = () => {
    if (!window.aiService || !window.aiService.hasApiKey()) {
        if (window.Toast) window.Toast.show('Configure sua chave de API para utilizar a IA.', 'info');
        AiConfigModal.open();
        return false;
    }
    return true;
};
