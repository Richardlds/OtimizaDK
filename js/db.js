/**
 * OTIMIZADK - Camada de Dados (Database Layer)
 * Abstração híbrida conectando ao Supabase na nuvem com fallback automático para LocalStorage.
 */

let supabaseClient = null;
let modoOffline = false;

// Inicializa Supabase se configurado
if (window.CONFIG && window.CONFIG.SUPABASE_URL && window.CONFIG.SUPABASE_KEY && window.supabase) {
    try {
        supabaseClient = window.supabase.createClient(window.CONFIG.SUPABASE_URL, window.CONFIG.SUPABASE_KEY, {
            auth: {
                persistSession: false // Previne avisos de rastreamento do navegador
            }
        });
        console.log('⚡ Supabase Inicializado com sucesso.');
    } catch (err) {
        console.warn('⚠️ Falha ao instanciar o Supabase:', err);
        supabaseClient = null;
    }
}

// Helpers seguros para LocalStorage
function getLocalDados() {
    try {
        const storage = localStorage.getItem(window.CONFIG.STORAGE_KEYS.DADOS);
        return storage ? JSON.parse(storage) : [];
    } catch (e) {
        console.warn('⚠️ Falha ao ler LocalStorage:', e);
        return [];
    }
}

function setLocalDados(items) {
    try {
        localStorage.setItem(window.CONFIG.STORAGE_KEYS.DADOS, JSON.stringify(items));
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

const db = {
    async getAll() {
        if (supabaseClient && !modoOffline) {
            try {
                const { data, error } = await supabaseClient
                    .from('procedimentos')
                    .select('*')
                    .order('id', { ascending: false });
                    
                if (error) throw error;
                atualizarStatusConexao(true);
                return data || [];
            } catch (err) {
                console.warn('⚠️ Supabase indisponível. Alternando para modo LocalStorage:', err.message || err);
                modoOffline = true;
                atualizarStatusConexao(false);
                setTimeout(() => {
                    if (window.Toast) {
                        window.Toast.show('Supabase indisponível. Operando no modo local (offline).', 'info');
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
                // Remove propriedades não mapeadas na tabela do Supabase se necessário
                const payload = {
                    id: item.id,
                    nomeErro: item.nomeErro,
                    tipo: item.tipo,
                    estado: item.estado,
                    tags: item.tags,
                    imagem: item.imagem,
                    procedimento: item.procedimento,
                    comoResolver: item.comoResolver
                };
                const { error } = await supabaseClient.from('procedimentos').insert([payload]);
                if (error) throw error;
                return;
            } catch (err) {
                console.warn('⚠️ Erro ao salvar no Supabase. Salvando localmente:', err);
                modoOffline = true;
                if (window.Toast) window.Toast.show('Erro no Supabase. Salvando no modo local.', 'info');
            }
        }
        const all = await this.getAll();
        all.unshift(item);
        await this.saveAll(all);
    },

    async update(id, updatedItem) {
        if (supabaseClient && !modoOffline) {
            try {
                const payload = {
                    id: updatedItem.id,
                    nomeErro: updatedItem.nomeErro,
                    tipo: updatedItem.tipo,
                    estado: updatedItem.estado,
                    tags: updatedItem.tags,
                    imagem: updatedItem.imagem,
                    procedimento: updatedItem.procedimento,
                    comoResolver: updatedItem.comoResolver
                };
                const { error } = await supabaseClient.from('procedimentos').update(payload).eq('id', id);
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
                const payload = importedItems.map(item => ({
                    id: item.id,
                    nomeErro: item.nomeErro,
                    tipo: item.tipo,
                    estado: item.estado,
                    tags: item.tags,
                    imagem: item.imagem || (Array.isArray(item.imagens) ? JSON.stringify(item.imagens) : ''),
                    procedimento: item.procedimento,
                    comoResolver: item.comoResolver
                }));
                const { error } = await supabaseClient.from('procedimentos').insert(payload);
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

window.db = db;
window.getLocalDados = getLocalDados;
window.setLocalDados = setLocalDados;
