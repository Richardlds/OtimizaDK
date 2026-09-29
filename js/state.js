/**
 * OTIMIZADK - Gerenciamento de Estado Centralizado (State Management)
 */

const State = {
    dados: [],
    tagFiltroAtiva: null,
    tipoFiltroAtivo: '',
    itemVisualizandoAtual: null,
    
    // Fotos anexadas no formulário atual
    fotosFormulario: [],

    // Favoritos salvos
    favoritos: new Set(),

    // Estado do Visualizador Lightbox
    lightbox: {
        fotos: [],
        index: 0,
        zoom: 1,
        rotate: 0
    },

    // TomSelect instances
    tsFilterEstado: null,
    tsEstado: null,

    // Inicializa favoritos do storage
    initFavoritos() {
        try {
            const raw = localStorage.getItem(window.CONFIG.STORAGE_KEYS.FAVORITOS);
            if (raw) {
                this.favoritos = new Set(JSON.parse(raw));
            }
        } catch (e) {
            console.warn('Falha ao carregar favoritos:', e);
            this.favoritos = new Set();
        }
    },

    salvarFavoritos() {
        try {
            localStorage.setItem(window.CONFIG.STORAGE_KEYS.FAVORITOS, JSON.stringify(Array.from(this.favoritos)));
        } catch (e) {
            console.warn('Falha ao salvar favoritos:', e);
        }
    },

    toggleFavorito(id) {
        let status = false;
        if (this.favoritos.has(id)) {
            this.favoritos.delete(id);
            status = false;
        } else {
            this.favoritos.add(id);
            status = true;
        }
        this.salvarFavoritos();
        return status;
    }
};

State.initFavoritos();
window.State = State;
