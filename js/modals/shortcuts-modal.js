/**
 * OTIMIZADK - Modal de Atalhos do Teclado e Listener de Hotkeys
 */

const ShortcutsModal = {
    init() {
        const modalShortcuts = document.getElementById('modalShortcuts');
        const btnOpenShortcuts = document.getElementById('btnOpenShortcuts');
        const closeShortcutsModal = document.getElementById('closeShortcutsModal');

        if (btnOpenShortcuts) {
            btnOpenShortcuts.addEventListener('click', () => this.open());
        }

        if (closeShortcutsModal) {
            closeShortcutsModal.addEventListener('click', () => this.close());
        }

        this.bindGlobalHotkeys();
    },

    open() {
        const modalShortcuts = document.getElementById('modalShortcuts');
        if (modalShortcuts) modalShortcuts.classList.add('open');
        if (window.lucide) window.lucide.createIcons();
    },

    close() {
        const modalShortcuts = document.getElementById('modalShortcuts');
        if (modalShortcuts) modalShortcuts.classList.remove('open');
    },

    bindGlobalHotkeys() {
        document.addEventListener('keydown', (e) => {
            const modalLightbox = document.getElementById('modalLightbox');
            const searchInput = document.getElementById('searchInput');

            // 1. Atalhos quando o Lightbox está aberto
            if (modalLightbox && modalLightbox.classList.contains('open')) {
                if (e.key === 'Escape') {
                    if (window.LightboxComponent) window.LightboxComponent.close();
                    return;
                }
                if (e.key === 'ArrowLeft') {
                    if (window.LightboxComponent) window.LightboxComponent.prev();
                    return;
                }
                if (e.key === 'ArrowRight') {
                    if (window.LightboxComponent) window.LightboxComponent.next();
                    return;
                }
                if (e.key === '+' || e.key === '=') {
                    if (window.LightboxComponent) window.LightboxComponent.zoomIn();
                    return;
                }
                if (e.key === '-') {
                    if (window.LightboxComponent) window.LightboxComponent.zoomOut();
                    return;
                }
            }

            // 2. Atalho Ctrl+K / Cmd+K para Busca Inteligente com IA
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                if (window.AiSearchModal) window.AiSearchModal.open();
                return;
            }

            // 3. Atalhos rápidos fora de campos de digitação
            const tag = document.activeElement ? document.activeElement.tagName : '';
            const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

            if (!isEditing) {
                if (e.key === '/') {
                    e.preventDefault();
                    if (searchInput) searchInput.focus();
                } else if (e.key.toLowerCase() === 'n') {
                    e.preventDefault();
                    if (window.FormModal) window.FormModal.openNew();
                } else if (e.key.toLowerCase() === 'f') {
                    e.preventDefault();
                    const tabFav = document.getElementById('tabFavoritos');
                    if (tabFav) tabFav.click();
                } else if (e.key === '?') {
                    e.preventDefault();
                    this.open();
                }
            }
        });
    }
};

window.ShortcutsModal = ShortcutsModal;
