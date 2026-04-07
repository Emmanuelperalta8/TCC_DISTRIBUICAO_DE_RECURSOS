
-- =============================================
-- DATA MART - TRANSFERÊNCIAS FEDERAIS
-- TCC - Emmanuel Peralta - ULBRA Palmas
-- Execute no SQL Editor do Supabase
-- =============================================

-- DIMENSÃO: Estado
CREATE TABLE IF NOT EXISTS dim_estado (
    id_estado   SERIAL PRIMARY KEY,
    sigla_uf    CHAR(2)      NOT NULL UNIQUE,
    nome_estado VARCHAR(60)  NOT NULL,
    regiao      VARCHAR(20)  NOT NULL
);

-- DIMENSÃO: Tempo
CREATE TABLE IF NOT EXISTS dim_tempo (
    id_tempo             SERIAL PRIMARY KEY,
    ano                  SMALLINT     NOT NULL UNIQUE,
    decada               VARCHAR(10),
    periodo_presidencial VARCHAR(30)
);

-- DIMENSÃO: Tipo de Transferência
CREATE TABLE IF NOT EXISTS dim_tipo_transferencia (
    id_tipo            SERIAL PRIMARY KEY,
    tipo_transferencia VARCHAR(60)  NOT NULL UNIQUE,
    categoria          VARCHAR(30)  NOT NULL
);

-- FATO: Transferências (tabela central do modelo estrela)
CREATE TABLE IF NOT EXISTS fato_transferencias (
    id                  BIGSERIAL PRIMARY KEY,
    id_estado           INT REFERENCES dim_estado(id_estado),
    id_tempo            INT REFERENCES dim_tempo(id_tempo),
    id_tipo             INT REFERENCES dim_tipo_transferencia(id_tipo),
    sigla_uf            CHAR(2),
    ano                 SMALLINT,
    tipo_transferencia  VARCHAR(60),
    valor_transferido   NUMERIC(18, 2),
    populacao           BIGINT,
    valor_per_capita    NUMERIC(12, 2),
    UNIQUE (sigla_uf, ano, tipo_transferencia)
);

-- AGREGAÇÕES (para performance do dashboard)
CREATE TABLE IF NOT EXISTS agg_por_estado_ano (
    id              BIGSERIAL PRIMARY KEY,
    ano             SMALLINT,
    sigla_uf        CHAR(2),
    regiao          VARCHAR(20),
    valor_total     NUMERIC(18, 2),
    populacao       BIGINT,
    valor_per_capita NUMERIC(12, 2),
    UNIQUE (ano, sigla_uf)
);

CREATE TABLE IF NOT EXISTS agg_por_regiao_ano (
    id              BIGSERIAL PRIMARY KEY,
    ano             SMALLINT,
    regiao          VARCHAR(20),
    valor_total     NUMERIC(18, 2),
    populacao       BIGINT,
    valor_per_capita NUMERIC(12, 2),
    UNIQUE (ano, regiao)
);

CREATE TABLE IF NOT EXISTS agg_por_tipo_ano (
    id              BIGSERIAL PRIMARY KEY,
    ano             SMALLINT,
    tipo_transferencia VARCHAR(60),
    valor_total     NUMERIC(18, 2),
    UNIQUE (ano, tipo_transferencia)
);

-- VIEW: Resumo nacional por ano
CREATE OR REPLACE VIEW vw_resumo_nacional AS
SELECT
    ano,
    SUM(valor_transferido)   AS total_transferido,
    SUM(populacao)           AS populacao_total,
    ROUND(SUM(valor_transferido) / NULLIF(SUM(populacao), 0), 2) AS per_capita_nacional
FROM fato_transferencias
GROUP BY ano
ORDER BY ano;

-- Habilitar RLS e acesso público de leitura (para o dashboard React)
ALTER TABLE dim_estado            ENABLE ROW LEVEL SECURITY;
ALTER TABLE dim_tempo             ENABLE ROW LEVEL SECURITY;
ALTER TABLE dim_tipo_transferencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE fato_transferencias   ENABLE ROW LEVEL SECURITY;
ALTER TABLE agg_por_estado_ano    ENABLE ROW LEVEL SECURITY;
ALTER TABLE agg_por_regiao_ano    ENABLE ROW LEVEL SECURITY;
ALTER TABLE agg_por_tipo_ano      ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (anon key pode ler)
CREATE POLICY "Leitura pública" ON dim_estado            FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON dim_tempo             FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON dim_tipo_transferencia FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON fato_transferencias   FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON agg_por_estado_ano    FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON agg_por_regiao_ano    FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON agg_por_tipo_ano      FOR SELECT USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_fato_ano      ON fato_transferencias (ano);
CREATE INDEX IF NOT EXISTS idx_fato_uf       ON fato_transferencias (sigla_uf);
CREATE INDEX IF NOT EXISTS idx_fato_tipo     ON fato_transferencias (tipo_transferencia);
CREATE INDEX IF NOT EXISTS idx_agg_est_ano   ON agg_por_estado_ano (ano, sigla_uf);
