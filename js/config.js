/**
 * OTIMIZADK - Configurações Globais
 * Centraliza URLs, chaves e constantes da aplicação.
 */

const CONFIG = {
    // Configurações do Supabase (Nuvem)
    SUPABASE_URL: 'https://ndiwpvlropelnsvtbsng.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kaXdwdmxyb3BlbG5zdnRic25nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDI4NDIsImV4cCI6MjA4NTg3ODg0Mn0.Sf5iXn6bHkWXAz62t8Kh9BB404OXc1OJ01kLejqLAWc',

    // Chaves de Armazenamento Local (LocalStorage)
    STORAGE_KEYS: {
        DADOS: 'otimizadk_dados',
        FAVORITOS: 'otimizadk_favoritos',
        AI_CONFIG: 'otimizadk_ai_config',
        THEME: 'otimizadk_theme'
    },

    // Configurações Padrão de IA
    DEFAULT_AI: {
        provider: 'gemini', // 'gemini' | 'openai'
        apiKey: '',
        model: 'gemini-2.0-flash',
        customEndpoint: ''
    },

    // Versão da Aplicação
    VERSION: 'v1.5.0'
};

// Disponibiliza globalmente
window.CONFIG = CONFIG;
