-- ============================================================
-- Criação da tabela fato_despesas_uf
-- Execute este script no Supabase SQL Editor:
--   Dashboard → SQL Editor → New Query → Cole e execute
--
-- TCC - Emmanuel de Oliveira Peralta Duarte - ULBRA Palmas
-- Fonte dos dados: SICONFI/STN — RREO Anexo 1 (Balanço Orçamentário)
-- ============================================================

CREATE TABLE IF NOT EXISTS fato_despesas_uf (
  id               BIGSERIAL    PRIMARY KEY,
  ano              INTEGER      NOT NULL,
  sigla_uf         TEXT         NOT NULL,
  despesa_liquidada NUMERIC     DEFAULT 0,

  UNIQUE (ano, sigla_uf)
);

-- Habilitar Row Level Security (padrão do Supabase)
ALTER TABLE fato_despesas_uf ENABLE ROW LEVEL SECURITY;

-- Permitir leitura para usuários anônimos e autenticados
CREATE POLICY "allow_anon_read"
  ON fato_despesas_uf
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "allow_authenticated_read"
  ON fato_despesas_uf
  FOR SELECT
  TO authenticated
  USING (true);

-- Índice para buscas por ano e UF
CREATE INDEX IF NOT EXISTS idx_despesas_ano_uf
  ON fato_despesas_uf (ano, sigla_uf);

-- ============================================================
-- Verificação após inserção dos dados (execute depois do ETL)
-- ============================================================
-- SELECT ano, COUNT(*) AS estados, SUM(despesa_liquidada)/1e9 AS total_bi
-- FROM fato_despesas_uf
-- GROUP BY ano
-- ORDER BY ano;
