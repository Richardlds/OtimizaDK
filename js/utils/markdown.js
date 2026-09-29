/**
 * OTIMIZADK - Utilitário de Formatação Markdown & Código
 * Converte blocos de código com botão de cópia, negrito, itálico e tags inline.
 */

const Markdown = {
    render(texto) {
        if (!texto) return '';
        
        let html = texto
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Blocos de código ```linguagem\nconteudo\n```
        html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, function(match, lang, code) {
            const id = 'code_' + Math.random().toString(36).substr(2, 9);
            return `
                <div class="code-block-wrap">
                    <div class="code-block-header">
                        <span class="code-lang"><i data-lucide="code" style="width:12px; margin-right:4px;"></i>${lang || 'código'}</span>
                        <button type="button" onclick="Markdown.copyCode('${id}')">
                            <i data-lucide="copy" style="width: 12px;"></i> Copiar Código
                        </button>
                    </div>
                    <pre class="code-block-content" id="${id}">${code.trim()}</pre>
                </div>
            `;
        });

        // Código em linha `codigo`
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Negrito **texto**
        html = html.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

        // Itálico *texto*
        html = html.replace(/\*([^*]+)\*/g, '<i>$1</i>');

        // Quebras de linha normais para <br>
        return html.replace(/\n/g, '<br>');
    },

    copyCode(id) {
        const el = document.getElementById(id);
        if (!el) return;
        navigator.clipboard.writeText(el.innerText || el.textContent).then(() => {
            if (window.Toast) window.Toast.show('Trecho de código copiado!', 'success');
        });
    }
};

// Aliases globais
window.Markdown = Markdown;
window.renderizarMarkdown = Markdown.render;
window.copiarBlocoCodigo = Markdown.copyCode;
