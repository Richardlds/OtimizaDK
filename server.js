/**
 * OTIMIZADK - Servidor de Desenvolvimento e Testes
 * Executa localmente sem dependências externas (apenas Node.js nativo).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Carrega variáveis do arquivo .env caso exista
function carregarEnv() {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return {};
    
    const conteudo = fs.readFileSync(envPath, 'utf8');
    const linhas = conteudo.split(/\r?\n/);
    const envVars = {};

    linhas.forEach(linha => {
        const limpa = linha.trim();
        if (!limpa || limpa.startsWith('#')) return;
        const indexIgual = limpa.indexOf('=');
        if (indexIgual > -1) {
            const chave = limpa.substring(0, indexIgual).trim();
            const valor = limpa.substring(indexIgual + 1).trim();
            envVars[chave] = valor;
            if (!process.env[chave]) {
                process.env[chave] = valor;
            }
        }
    });
    return envVars;
}

const env = carregarEnv();

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
    // Configura headers para CORS e suporte a desenvolvimento local
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    // Rota da API para carregar configurações do .env caso existam
    if (pathname === '/api/config') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            geminiKey: env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
            openaiKey: env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || '',
            supabaseUrl: env.SUPABASE_URL || process.env.SUPABASE_URL || '',
            supabaseKey: env.SUPABASE_KEY || process.env.SUPABASE_KEY || ''
        }));
        return;
    }

    // Rota raiz aponta para index.html
    if (pathname === '/' || pathname === '') {
        pathname = '/index.html';
    }

    const filePath = path.join(__dirname, pathname);

    // Previne Directory Traversal
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('403 Proibido');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head><meta charset="UTF-8"><title>404 - Não Encontrado</title></head>
                <body style="font-family: sans-serif; background: #0f1117; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
                    <div style="text-align: center;">
                        <h1 style="font-size: 48px; color: #4f8ef7; margin-bottom: 10px;">404</h1>
                        <p style="color: #8b91a8;">O arquivo solicitado não foi encontrado.</p>
                        <a href="/" style="color: #4f8ef7; text-decoration: underline;">Voltar para o OTIMIZADK</a>
                    </div>
                </body>
                </html>
            `);
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    });
});

// Inicia o servidor com busca de porta disponível
let portaDesejada = parseInt(process.env.PORT, 10) || 8080;

function iniciarServidor(porta) {
    server.listen(porta, () => {
        console.log('');
        console.log('====================================================');
        console.log('  ⚡ OTIMIZADK - Servidor Local de Testes Rodando');
        console.log('====================================================');
        console.log(`  🔗 Acesso Local:    http://localhost:${porta}`);
        console.log(`  🔗 Rede Local:      http://127.0.0.1:${porta}`);
        console.log('  Pressione Ctrl + C para encerrar');
        console.log('====================================================');
        console.log('');
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️  Porta ${porta} em uso. Tentando a porta ${porta + 1}...`);
            iniciarServidor(porta + 1);
        } else {
            console.error('Erro no servidor:', err);
        }
    });
}

iniciarServidor(portaDesejada);
