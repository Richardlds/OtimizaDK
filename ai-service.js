/**
 * OTIMIZADK - AI Service
 * Integração com Google Gemini (padrão) e OpenAI / Groq / Provedores compatíveis.
 * Executado 100% no cliente sem expor chaves no repositório.
 */

const AI_CONFIG_KEY = 'otimizadk_ai_config';

// Configuração padrão
const DEFAULT_AI_CONFIG = {
    provider: 'gemini', // 'gemini' | 'openai'
    apiKey: '',
    model: 'gemini-2.0-flash', // gemini-2.0-flash (recomendado), gemini-2.5-flash, gemini-1.5-flash-latest, gpt-4o-mini
    customEndpoint: ''
};

const aiService = {
    // Carrega configuração salva
    getConfig() {
        try {
            const raw = localStorage.getItem(AI_CONFIG_KEY);
            if (!raw) return { ...DEFAULT_AI_CONFIG };
            return { ...DEFAULT_AI_CONFIG, ...JSON.parse(raw) };
        } catch (e) {
            console.error('Erro ao ler configuração de IA:', e);
            return { ...DEFAULT_AI_CONFIG };
        }
    },

    // Salva configuração
    saveConfig(newConfig) {
        const current = this.getConfig();
        const updated = { ...current, ...newConfig };
        localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(updated));
        return updated;
    },

    // Verifica se a chave está configurada
    hasApiKey() {
        const config = this.getConfig();
        return Boolean(config.apiKey && config.apiKey.trim().length > 5);
    },

    // Lista os modelos disponíveis na conta do usuário no Google Gemini
    async listarModelosGemini(apiKey) {
        const key = (apiKey || this.getConfig().apiKey || '').trim();
        if (!key) throw new Error('Informe a Chave de API antes de consultar os modelos.');

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
        const response = await fetch(url);

        if (!response.ok) {
            let errorMsg = `Erro ao consultar modelos (${response.status})`;
            try {
                const errData = await response.json();
                if (errData.error && errData.error.message) {
                    errorMsg = errData.error.message;
                }
            } catch (_) {}
            throw new Error(errorMsg);
        }

        const data = await response.json();
        const models = (data.models || [])
            .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name.replace(/^models\//, ''));

        return models;
    },

    // Chamada de baixo nível ao provedor
    async call(prompt, systemInstruction = '') {
        const config = this.getConfig();
        if (!config.apiKey || !config.apiKey.trim()) {
            throw new Error('CHAVE_NAO_CONFIGURADA');
        }

        if (config.provider === 'gemini') {
            return await this._callGemini(prompt, systemInstruction, config);
        } else {
            return await this._callOpenAI(prompt, systemInstruction, config);
        }
    },

    // Chamada à API REST do Google Gemini
    async _callGemini(prompt, systemInstruction, config) {
        let rawModel = (config.model || 'gemini-2.0-flash').replace(/^models\//, '');
        let url = `https://generativelanguage.googleapis.com/v1beta/models/${rawModel}:generateContent?key=${encodeURIComponent(config.apiKey.trim())}`;

        const requestBody = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2048
            }
        };

        if (systemInstruction) {
            requestBody.systemInstruction = {
                parts: [{ text: systemInstruction }]
            };
        }

        let response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        // Caso o modelo solicitado não exista (404/400), tenta fallback automático com os modelos disponíveis da chave
        if (!response.ok && (response.status === 404 || response.status === 400)) {
            try {
                const disponiveis = await this.listarModelosGemini(config.apiKey);
                const prioridades = [
                    'gemini-2.0-flash',
                    'gemini-2.5-flash',
                    'gemini-1.5-flash-latest',
                    'gemini-1.5-flash-8b',
                    'gemini-1.5-pro',
                    'gemini-pro'
                ];
                const fallback = prioridades.find(p => disponiveis.includes(p) && p !== rawModel) 
                    || disponiveis.find(p => p !== rawModel);

                if (fallback) {
                    console.warn(`⚠️ Modelo ${rawModel} não suportado. Alternando automaticamente para ${fallback}...`);
                    this.saveConfig({ model: fallback });
                    rawModel = fallback;
                    url = `https://generativelanguage.googleapis.com/v1beta/models/${rawModel}:generateContent?key=${encodeURIComponent(config.apiKey.trim())}`;
                    response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestBody)
                    });
                }
            } catch (_) {}
        }

        if (!response.ok) {
            let errorMsg = `Erro na API do Gemini (${response.status})`;
            try {
                const errData = await response.json();
                if (errData.error && errData.error.message) {
                    errorMsg = errData.error.message;
                }
            } catch (_) {}
            throw new Error(errorMsg);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        if (!candidate || !candidate.content?.parts?.[0]?.text) {
            throw new Error('Nenhuma resposta retornada pela IA.');
        }

        return candidate.content.parts[0].text;
    },

    // Chamada à API da OpenAI ou compatíveis (Groq, OpenRouter, etc.)
    async _callOpenAI(prompt, systemInstruction, config) {
        const endpoint = config.customEndpoint && config.customEndpoint.trim() 
            ? config.customEndpoint.trim() 
            : 'https://api.openai.com/v1/chat/completions';
        
        const model = config.model || 'gpt-4o-mini';

        const messages = [];
        if (systemInstruction) {
            messages.push({ role: 'system', content: systemInstruction });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey.trim()}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            let errorMsg = `Erro na API OpenAI (${response.status})`;
            try {
                const errData = await response.json();
                if (errData.error && errData.error.message) {
                    errorMsg = errData.error.message;
                }
            } catch (_) {}
            throw new Error(errorMsg);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    },

    // Teste de Conexão com a chave
    async testConnection(testConfig) {
        const config = testConfig || this.getConfig();
        if (!config.apiKey || !config.apiKey.trim()) {
            throw new Error('Informe a Chave de API antes de testar.');
        }

        if (config.provider === 'gemini') {
            // 1. Obtém lista real de modelos autorizados para esta chave
            const modelosDisponiveis = await this.listarModelosGemini(config.apiKey);
            if (!modelosDisponiveis || modelosDisponiveis.length === 0) {
                throw new Error('Nenhum modelo de geração de conteúdo encontrado para esta chave no Gemini.');
            }

            // 2. Se o modelo configurado não existir na lista, escolhe automaticamente o melhor
            let modeloEscolhido = (config.model || '').replace(/^models\//, '');
            if (!modelosDisponiveis.includes(modeloEscolhido)) {
                const prioridades = [
                    'gemini-2.0-flash',
                    'gemini-2.5-flash',
                    'gemini-1.5-flash-latest',
                    'gemini-1.5-flash-8b',
                    'gemini-1.5-pro',
                    'gemini-pro'
                ];
                modeloEscolhido = prioridades.find(p => modelosDisponiveis.includes(p)) || modelosDisponiveis[0];
                config.model = modeloEscolhido;
                this.saveConfig({ model: modeloEscolhido });
            }

            // 3. Testa geração com o modelo selecionado
            const prompt = 'Responda apenas com a palavra OK.';
            await this._callGemini(prompt, '', config);

            return {
                ok: true,
                modeloUtilizado: modeloEscolhido,
                modelosDisponiveis: modelosDisponiveis
            };
        } else {
            const prompt = 'Responda apenas com a palavra OK.';
            await this._callOpenAI(prompt, '', config);
            return {
                ok: true,
                modeloUtilizado: config.model || 'gpt-4o-mini',
                modelosDisponiveis: []
            };
        }
    },

    // 1. BUSCA COM IA NA BASE DE CONHECIMENTOS (RAG)
    async buscarComIa(pergunta, listaProcedimentos) {
        // Formata a base atual como catálogo resumido para o prompt
        const catalogo = listaProcedimentos.map(item => {
            return `--- ID: ${item.id} ---
Título: ${item.nomeErro}
Tipo: ${item.tipo || 'Geral'} | UF: ${item.estado || 'Nacional'}
Tags: ${item.tags || ''}
Contexto: ${item.procedimento || ''}
Solução: ${item.comoResolver || ''}`;
        }).join('\n\n');

        const systemInstruction = `Você é o Assistente Especialista de Suporte e Base de Conhecimento do sistema OTIMIZADK.
Seu objetivo é ajudar técnicos e operadores a resolverem incidentes baseando-se estritamente na base de conhecimentos fornecida.
Instruções:
1. Responda em Português do Brasil com tom profissional, claro, objetivo e formatado em tópicos/passos quando aplicável.
2. Indique exatamente quais IDs de procedimentos da base contêm a resposta ou são mais relevantes para o caso no formato de lista no final: [IDS_RELACIONADOS: id1, id2].
3. Se a informação NÃO constar na base, informe educadamente que o procedimento específico ainda não está catalogado na base OTIMIZADK, mas forneça uma orientação técnica recomendada com base nas melhores práticas de TI/Suporte.`;

        const prompt = `Pergunta/Dúvida do Usuário: "${pergunta}"

Abaixo está a base de conhecimentos atual do OTIMIZADK:
=========================================
${catalogo || 'A base de conhecimentos está atualmente sem procedimentos.'}
=========================================

Analise a dúvida, encontre os procedimentos correspondentes e responda com a solução passo a passo e liste os IDs encontrados.`;

        const respostaBruta = await this.call(prompt, systemInstruction);

        // Extrai IDs relacionados
        let idsRelacionados = [];
        const matchIds = respostaBruta.match(/\[IDS_RELACIONADOS:\s*([\d\s,]+)\]/i);
        if (matchIds && matchIds[1]) {
            idsRelacionados = matchIds[1]
                .split(',')
                .map(id => parseInt(id.trim(), 10))
                .filter(id => !isNaN(id));
        }

        // Remove a tag de IDs do texto exibido ao usuário
        const respostaFormatada = respostaBruta.replace(/\[IDS_RELACIONADOS:.*?\]/gi, '').trim();

        // Filtra os objetos de procedimento correspondentes
        const procedimentosEncontrados = listaProcedimentos.filter(p => idsRelacionados.includes(p.id));

        return {
            resposta: respostaFormatada,
            ids: idsRelacionados,
            procedimentos: procedimentosEncontrados
        };
    },

    // 2. CONSTRUÇÃO DE NOVO PROCEDIMENTO COM IA
    async gerarProcedimentoCompleto(descricaoOuTitulo) {
        const systemInstruction = `Você é um Arquiteto de Suporte e Documentação Técnica.
Você deve estruturar procedimentos operacionais padrão e documentações de erro no formato exato JSON especificado.
Retorne EXCLUSIVAMENTE o bloco JSON válido, sem texto antes ou depois.

Formato esperado:
{
  "nomeErro": "Título conciso e claro do incidente ou procedimento",
  "tipo": "Erro" | "Procedimento" | "FAQ",
  "estado": "Nacional" ou sigla de UF brasileira (ex: "SP", "RJ", etc. caso seja específico),
  "procedimento": "Descrição clara do cenário, sintomas, causa raiz provável e contexto operacional",
  "comoResolver": "Passo a passo numerado, prático, detalhado e executável para resolver o problema",
  "tags": "3 a 5 tags em minúsculas separadas por vírgula (ex: pdv, impressora, timeout)"
}`;

        const prompt = `Crie uma documentação técnica completa para o seguinte tópico/problema:
"${descricaoOuTitulo}"`;

        const resposta = await this.call(prompt, systemInstruction);
        
        // Limpa possíveis marcações de código markdown ```json ... ```
        const limpo = resposta.replace(/```json/gi, '').replace(/```/g, '').trim();

        try {
            const parsed = JSON.parse(limpo);
            return {
                nomeErro: parsed.nomeErro || descricaoOuTitulo,
                tipo: parsed.tipo || 'Procedimento',
                estado: parsed.estado || 'Nacional',
                procedimento: parsed.procedimento || '',
                comoResolver: parsed.comoResolver || '',
                tags: parsed.tags || ''
            };
        } catch (e) {
            console.warn('Falha ao parsear JSON direto da IA, tentando extração por regex:', e);
            return {
                nomeErro: descricaoOuTitulo,
                tipo: 'Procedimento',
                estado: 'Nacional',
                procedimento: 'Procedimento gerado via assistente IA.',
                comoResolver: resposta,
                tags: 'suporte, procedimento'
            };
        }
    },

    // 3. APRIMORAR RESOLUÇÃO / COMO RESOLVER COM IA
    async aprimorarSolucao(titulo, comoResolverAtual) {
        const systemInstruction = `Você é um especialista em documentação de suporte técnico.
Sua missão é reescrever e enriquecer o passo a passo de resolução de um procedimento para torná-lo extremamente claro, didático, estruturado em tópicos numerados com ações práticas, comandos e como validar a resolução.
Retorne apenas o texto aprimorado, sem introduções desnecessárias.`;

        const prompt = `Título do Problema: "${titulo}"
Texto de Resolução Atual:
"${comoResolverAtual}"

Por favor, reescreva e aprimore este passo a passo de resolução tornando-o profissional, numerado e objetivo.`;

        return await this.call(prompt, systemInstruction);
    },

    // 4. GERAÇÃO DE TAGS COM IA
    async gerarTags(titulo, contexto, solucao) {
        const systemInstruction = `Você é um sistema de indexação de base de conhecimento.
Seu trabalho é ler o título, contexto e solução de um procedimento técnico e extrair de 3 a 6 tags/palavras-chave relevantes.
Regras estritas:
1. Retorne APENAS as tags em minúsculas, separadas por vírgula.
2. NÃO use hashtags (#), NÃO use aspas, NÃO adicione introduções ou saudações.
Exemplo de resposta: sefaz, nfe, certificado digital, timeout, emissor`;

        const prompt = `Título: ${titulo || 'Não informado'}
Contexto: ${contexto || 'Não informado'}
Solução: ${solucao || 'Não informado'}

Gere as tags correspondentes:`;

        const resposta = await this.call(prompt, systemInstruction);
        // Limpa a resposta para garantir que apenas palavras separadas por vírgula retornem
        return resposta
            .replace(/[#*`]/g, '')
            .replace(/\n+/g, ', ')
            .split(',')
            .map(t => t.trim().toLowerCase())
            .filter(t => t.length > 1)
            .slice(0, 6)
            .join(', ');
    }
};

// Disponibiliza globalmente
window.aiService = aiService;

// Tenta sincronizar chave do .env via servidor local caso ainda não tenha chave no localStorage
if (typeof window !== 'undefined') {
    (async function() {
        try {
            const res = await fetch('/api/config');
            if (res.ok) {
                const envData = await res.json();
                const config = aiService.getConfig();
                if (!config.apiKey && envData) {
                    if (envData.geminiKey) {
                        aiService.saveConfig({ provider: 'gemini', apiKey: envData.geminiKey });
                        console.log('🤖 Chave Gemini carregada automaticamente do servidor (.env)!');
                    } else if (envData.openaiKey) {
                        aiService.saveConfig({ provider: 'openai', apiKey: envData.openaiKey });
                        console.log('🤖 Chave OpenAI carregada automaticamente do servidor (.env)!');
                    }
                }
            }
        } catch (_) {}
    })();
}
