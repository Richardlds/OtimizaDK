/**
 * OTIMIZADK - Utilitário de Notificações (Toast)
 */

const Toast = {
    show(mensagem, tipo = 'success') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${tipo}`;
        
        let icone = 'check-circle';
        if (tipo === 'error') icone = 'x-circle';
        if (tipo === 'info') icone = 'info';
        if (tipo === 'warning') icone = 'alert-triangle';

        toast.innerHTML = `<i data-lucide="${icone}" style="width: 16px;"></i> <span style="display: flex; align-items: center;">${mensagem}</span>`;
        toastContainer.appendChild(toast);
        
        if (window.lucide) {
            window.lucide.createIcons({ root: toast });
        }
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }
};

// Aliases globais para compatibilidade
window.Toast = Toast;
window.mostrarToast = Toast.show;
