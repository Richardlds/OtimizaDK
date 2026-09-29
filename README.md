# ⚡ OTIMIZADK - Central de Conhecimento & Procedimentos

Uma base de conhecimento moderna, veloz e intuitiva para equipes de suporte, operações e desenvolvimento. Integração com banco de dados híbrido (Supabase Cloud + LocalStorage Offline) e Inteligência Artificial Multimodal (Google Gemini Vision & OpenAI).

---

## 📁 Estrutura Modular do Projeto

O projeto foi totalmente reestruturado seguindo as melhores práticas de Clean Code e Separação de Responsabilidades (SoC):

```text
OtimizaDK/
├── index.html                  # Estrutura HTML da aplicação
├── style.css                   # Sistema de design, temas (Dark/Light), layout e @media print
├── server.js                   # Servidor de testes local nativo Node.js (sem dependências)
├── start.bat                   # Inicializador rápido para ambiente Windows
├── package.json                # Metadados e scripts do projeto
│
└── js/                         # Código JavaScript Modularizado
    ├── config.js               # Constantes, chaves de armazenamento e endpoints
    ├── state.js                # Gerenciamento de Estado Centralizado (State Management)
    ├── db.js                   # Camada de Abstração de Dados Híbrida (Supabase + LocalStorage)
    │
    ├── utils/                  # Utilitários Puros e Reutilizáveis
    │   ├── toast.js            # Sistema de notificações flutuantes (Toasts)
    │   ├── image-utils.js      # Compressão Canvas (1600px, 85%) e normalizador de imagens
    │   └── markdown.js         # Formatador Markdown, blocos de código com botão de cópia
    │
    ├── services/               # Serviços de Integração Externa
    │   └── ai-service.js       # IA Multimodal (Gemini Vision OCR, OpenAI, RAG, Gerador)
    │
    ├── components/             # Componentes de Interface Isolados
    │   ├── cards.js            # Renderização de cards do catálogo e ações rápidas
    │   ├── filters.js          # Barra de pesquisa, abas de categoria (Erros, FAQ, etc.) e tags
    │   ├── dropzone.js         # Upload múltiplo de fotos, Drag & Drop e Ctrl+V (Clipboard)
    │   └── lightbox.js         # Visualizador de fotos em tela cheia com Zoom e Rotação
    │
    ├── modals/                 # Controladores de Modais e Diálogos
    │   ├── form-modal.js       # Cadastro/edição de procedimentos e assistente de IA
    │   ├── view-modal.js       # Visualização detalhada, galeria e cópia para WhatsApp
    │   ├── ai-search-modal.js  # Busca Semântica em Linguagem Natural (RAG)
    │   ├── ai-config-modal.js  # Gerenciamento de chaves, provedores e teste de conexão
    │   └── shortcuts-modal.js  # Guia e gerenciador de atalhos globais de teclado
    │
    └── app.js                  # Ponto de Entrada (Bootstrap da Aplicação)
```

---

## 🚀 Principais Funcionalidades

1. **Envio de Múltiplas Fotos & Prints**:
   - Upload de múltiplos arquivos simultâneos.
   - **Drag & Drop**: Arraste imagens diretamente para a área de upload.
   - **Colar da Área de Transferência (<kbd>Ctrl + V</kbd>)**: Tire um print de tela e cole diretamente no formulário.
   - **Compressão Automática via Canvas**: Reduz fotos em alta resolução para ~80KB sem perder nitidez, otimizando o banco de dados.

2. **Visualizador Lightbox em Tela Cheia**:
   - Zoom in/out/reset e rotação de 90°.
   - Navegação por setas do teclado (<kbd>←</kbd> <kbd>→</kbd>) e faixa inferior de miniaturas.
   - Cópia do link/base64 e download direto do arquivo JPEG.

3. **Diagnóstico Visual com IA (Visão Computacional)**:
   - Análise automática de screenshots com OCR (Gemini 2.0 Flash / OpenAI Vision).
   - Extrai o erro da imagem e preenche automaticamente o título, descrição, solução e tags.

4. **Sistema de Favoritos (⭐)**:
   - Marque procedimentos mais usados para acesso com 1 clique na aba **Favoritos**.

5. **Exportação Formatada**:
   - **WhatsApp / Teams / Slack**: Copia o procedimento formatado com cabeçalhos e emojis limpos.
   - **Impressão / PDF**: Layout exclusivo `@media print` sem barras de navegação.

6. **Atalhos Globais de Teclado**:
   - <kbd>Ctrl + K</kbd>: Abrir Busca Inteligente com IA.
   - <kbd>/</kbd>: Focar na barra de busca.
   - <kbd>N</kbd>: Novo Procedimento.
   - <kbd>F</kbd>: Filtrar Favoritos.
   - <kbd>?</kbd>: Abrir guia de atalhos.
   - <kbd>Esc</kbd>: Fechar qualquer modal ou lightbox ativo.

---

## 💻 Como Executar

### Opção 1: Via Servidor Local Node.js
```bash
# Executar servidor
node server.js
# Ou no Windows: execute o arquivo start.bat
```
Abra o navegador em `http://localhost:8080`.

### Opção 2: Direto pelo Navegador
Dê um duplo clique no arquivo `index.html`. A aplicação funciona de forma 100% autônoma através do protocolo `file:///`.
