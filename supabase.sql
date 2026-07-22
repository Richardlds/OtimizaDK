-- Script de Instalação para o OTIMIZADK no Supabase
-- Basta copiar tudo abaixo, ir no seu painel do Supabase > SQL Editor > New Query, colar e rodar!

-- 1. Cria a Tabela de Procedimentos
CREATE TABLE IF NOT EXISTS public.procedimentos (
  id bigint PRIMARY KEY,
  "nomeErro" text NOT NULL,
  tipo text,
  estado text,
  tags text,
  imagem text,
  procedimento text NOT NULL,
  "comoResolver" text NOT NULL
);

-- 2. Habilita a Segurança de Linha (RLS)
ALTER TABLE public.procedimentos ENABLE ROW LEVEL SECURITY;

-- 3. Cria as Regras de Acesso para Permitir Leitura e Escrita
-- (Para uso interno, deixamos aberto. Para produção externa, essas regras devem ser ajustadas para autenticação)
CREATE POLICY "Permitir leitura anonima" ON public.procedimentos FOR SELECT USING (true);
CREATE POLICY "Permitir insercao anonima" ON public.procedimentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizacao anonima" ON public.procedimentos FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusao anonima" ON public.procedimentos FOR DELETE USING (true);
