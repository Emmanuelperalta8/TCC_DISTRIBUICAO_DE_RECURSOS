
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

-- DIMENSÃO: População por UF/ano (fonte: IBGE)
CREATE TABLE IF NOT EXISTS dim_populacao (
    id          BIGSERIAL PRIMARY KEY,
    sigla_uf    CHAR(2)      NOT NULL,
    ano         SMALLINT     NOT NULL,
    populacao   BIGINT       NOT NULL,
    fonte       VARCHAR(60)  NOT NULL DEFAULT 'IBGE',
    UNIQUE (sigla_uf, ano)
);

-- FATO: Despesas liquidadas por UF/ano (fonte: SIAFI/STN)
CREATE TABLE IF NOT EXISTS fato_despesas_uf (
    id                 BIGSERIAL PRIMARY KEY,
    sigla_uf           CHAR(2)       NOT NULL,
    ano                SMALLINT      NOT NULL,
    despesa_liquidada  NUMERIC(18,2) NOT NULL,
    UNIQUE (sigla_uf, ano)
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
ALTER TABLE dim_populacao         ENABLE ROW LEVEL SECURITY;
ALTER TABLE fato_despesas_uf      ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (anon key pode ler)
DROP POLICY IF EXISTS "Leitura pública" ON dim_estado;
DROP POLICY IF EXISTS "Leitura pública" ON dim_tempo;
DROP POLICY IF EXISTS "Leitura pública" ON dim_tipo_transferencia;
DROP POLICY IF EXISTS "Leitura pública" ON fato_transferencias;
DROP POLICY IF EXISTS "Leitura pública" ON agg_por_estado_ano;
DROP POLICY IF EXISTS "Leitura pública" ON agg_por_regiao_ano;
DROP POLICY IF EXISTS "Leitura pública" ON agg_por_tipo_ano;
DROP POLICY IF EXISTS "Leitura pública" ON dim_populacao;
DROP POLICY IF EXISTS "Leitura pública" ON fato_despesas_uf;

CREATE POLICY "Leitura pública" ON dim_estado            FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON dim_tempo             FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON dim_tipo_transferencia FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON fato_transferencias   FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON agg_por_estado_ano    FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON agg_por_regiao_ano    FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON agg_por_tipo_ano      FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON dim_populacao         FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON fato_despesas_uf      FOR SELECT USING (true);

-- =============================================
-- TABELAS PARA CAPTURA MENSAL (Year-to-Date)
-- =============================================

-- DIMENSÃO: Mês
CREATE TABLE IF NOT EXISTS dim_mes (
    id_mes      SERIAL PRIMARY KEY,
    mes_numero  SMALLINT     NOT NULL UNIQUE,
    mes_nome    VARCHAR(15)  NOT NULL,
    mes_abrev   CHAR(3)      NOT NULL
);

-- FACT: Transferências Raw (dados brutos mensais)
CREATE TABLE IF NOT EXISTS fact_transferencias_raw (
    id                   BIGSERIAL PRIMARY KEY,
    mes_referencia       DATE         NOT NULL,
    sigla_uf             CHAR(2)      NOT NULL,
    tipo_transferencia   VARCHAR(60)  NOT NULL,
    valor_transferido    NUMERIC(18, 2),
    status_validacao     VARCHAR(20)  DEFAULT 'pendente',
    mensagem_erro        TEXT,
    data_criacao         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- FACT: Transferências Mensais (consolidadas)
CREATE TABLE IF NOT EXISTS fato_transferencias_mes (
    id                   BIGSERIAL PRIMARY KEY,
    mes_referencia       DATE         NOT NULL,
    sigla_uf             CHAR(2)      NOT NULL,
    tipo_transferencia   VARCHAR(60)  NOT NULL,
    valor_transferido    NUMERIC(18, 2) NOT NULL,
    valor_ytd            NUMERIC(18, 2),
    populacao_mes        BIGINT,
    valor_per_capita     NUMERIC(12, 2),
    data_consolidacao    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (mes_referencia, sigla_uf, tipo_transferencia)
);

-- AGREGAÇÃO: Por Estado e Mês
CREATE TABLE IF NOT EXISTS agg_mes_estado (
    id                   BIGSERIAL PRIMARY KEY,
    mes_referencia       DATE         NOT NULL,
    sigla_uf             CHAR(2)      NOT NULL,
    regiao               VARCHAR(20),
    valor_total_mes      NUMERIC(18, 2) NOT NULL,
    valor_ytd            NUMERIC(18, 2) NOT NULL,
    populacao_mes        BIGINT,
    valor_per_capita_mes NUMERIC(12, 2),
    valor_per_capita_ytd NUMERIC(12, 2),
    indice_gini          NUMERIC(5, 2),
    status_alerta        VARCHAR(10),
    data_atualizacao     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (mes_referencia, sigla_uf)
);

-- AGREGAÇÃO: Por Região e Mês
CREATE TABLE IF NOT EXISTS agg_mes_regiao (
    id                   BIGSERIAL PRIMARY KEY,
    mes_referencia       DATE         NOT NULL,
    regiao               VARCHAR(20)  NOT NULL,
    valor_total_mes      NUMERIC(18, 2) NOT NULL,
    valor_ytd            NUMERIC(18, 2) NOT NULL,
    populacao_mes        BIGINT,
    valor_per_capita_mes NUMERIC(12, 2),
    valor_per_capita_ytd NUMERIC(12, 2),
    status_alerta        VARCHAR(10),
    data_atualizacao     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (mes_referencia, regiao)
);

-- TABELA: Alertas e Desvios
CREATE TABLE IF NOT EXISTS tbl_alertas_desvios (
    id                   BIGSERIAL PRIMARY KEY,
    mes_referencia       DATE         NOT NULL,
    sigla_uf             CHAR(2)      NOT NULL,
    tipo_alerta          VARCHAR(30)  NOT NULL,
    valor_esperado       NUMERIC(18, 2),
    valor_observado      NUMERIC(18, 2),
    percentual_desvio    NUMERIC(5, 2),
    status_alerta        VARCHAR(10),
    data_criacao         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- VIEWS PARA KPIs YEAR-TO-DATE
-- =============================================

CREATE OR REPLACE VIEW vw_kpi_ytd AS
SELECT
    mes_referencia,
    sigla_uf,
    regiao,
    valor_total_mes,
    valor_ytd,
    valor_per_capita_ytd,
    indice_gini,
    status_alerta,
    ROUND(((valor_ytd - LAG(valor_ytd) OVER (PARTITION BY sigla_uf ORDER BY mes_referencia)) /
           LAG(valor_ytd) OVER (PARTITION BY sigla_uf ORDER BY mes_referencia) * 100)::numeric, 2) AS crescimento_mes_pct
FROM agg_mes_estado
ORDER BY mes_referencia DESC, sigla_uf;

CREATE OR REPLACE VIEW vw_sazonalidade_mes AS
SELECT
    EXTRACT(MONTH FROM mes_referencia)::INT AS mes_numero,
    sigla_uf,
    AVG(valor_transferido) AS valor_medio_mes,
    STDDEV_POP(valor_transferido) AS desvio_padrao,
    MIN(valor_transferido) AS valor_minimo,
    MAX(valor_transferido) AS valor_maximo
FROM fato_transferencias_mes
GROUP BY EXTRACT(MONTH FROM mes_referencia), sigla_uf
ORDER BY mes_numero, sigla_uf;

CREATE OR REPLACE VIEW vw_alerta_desvios AS
SELECT
    mes_referencia,
    sigla_uf,
    tipo_alerta,
    percentual_desvio,
    status_alerta,
    CASE
        WHEN percentual_desvio > 20 THEN 'vermelho'
        WHEN percentual_desvio > 10 THEN 'amarelo'
        ELSE 'verde'
    END AS cor_status
FROM tbl_alertas_desvios
ORDER BY mes_referencia DESC, status_alerta DESC;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_fato_ano      ON fato_transferencias (ano);
CREATE INDEX IF NOT EXISTS idx_fato_uf       ON fato_transferencias (sigla_uf);
CREATE INDEX IF NOT EXISTS idx_fato_tipo     ON fato_transferencias (tipo_transferencia);
CREATE INDEX IF NOT EXISTS idx_agg_est_ano   ON agg_por_estado_ano (ano, sigla_uf);
CREATE INDEX IF NOT EXISTS idx_pop_uf_ano    ON dim_populacao (sigla_uf, ano);
CREATE INDEX IF NOT EXISTS idx_desp_uf_ano   ON fato_despesas_uf (sigla_uf, ano);
CREATE INDEX IF NOT EXISTS idx_raw_mes       ON fact_transferencias_raw (mes_referencia, status_validacao);
CREATE INDEX IF NOT EXISTS idx_fato_mes_mes  ON fato_transferencias_mes (mes_referencia, sigla_uf);
CREATE INDEX IF NOT EXISTS idx_agg_mes_est   ON agg_mes_estado (mes_referencia, sigla_uf);
CREATE INDEX IF NOT EXISTS idx_agg_mes_reg   ON agg_mes_regiao (mes_referencia, regiao);
CREATE INDEX IF NOT EXISTS idx_alertas_mes   ON tbl_alertas_desvios (mes_referencia, status_alerta);

-- Habilitar RLS nas novas tabelas
ALTER TABLE fact_transferencias_raw       ENABLE ROW LEVEL SECURITY;
ALTER TABLE fato_transferencias_mes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE agg_mes_estado                ENABLE ROW LEVEL SECURITY;
ALTER TABLE agg_mes_regiao                ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_alertas_desvios           ENABLE ROW LEVEL SECURITY;
ALTER TABLE dim_mes                       ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública
CREATE POLICY "Leitura pública" ON fact_transferencias_raw       FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON fato_transferencias_mes       FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON agg_mes_estado                FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON agg_mes_regiao                FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON tbl_alertas_desvios           FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON dim_mes                       FOR SELECT USING (true);

-- Inserir dimensão de mês
DELETE FROM dim_mes;
INSERT INTO dim_mes (mes_numero, mes_nome, mes_abrev) VALUES
    (1, 'Janeiro', 'JAN'),
    (2, 'Fevereiro', 'FEV'),
    (3, 'Março', 'MAR'),
    (4, 'Abril', 'ABR'),
    (5, 'Maio', 'MAI'),
    (6, 'Junho', 'JUN'),
    (7, 'Julho', 'JUL'),
    (8, 'Agosto', 'AGO'),
    (9, 'Setembro', 'SET'),
    (10, 'Outubro', 'OUT'),
    (11, 'Novembro', 'NOV'),
    (12, 'Dezembro', 'DEZ')
ON CONFLICT (mes_numero) DO NOTHING;

-- =============================================
-- HISTÓRICO MENSAL REAL (coletar_transferencias.py)
-- Tabela nova e independente de fato_transferencias_mes
-- (aquela é do pipeline de YTD manual, schema diferente:
-- mes_referencia DATE, valor_ytd etc. — não usar para isto).
-- Esta guarda o detalhe mensal vindo direto dos CSVs do CKAN,
-- mesma fonte e mesmo filtro de destino de fato_transferencias,
-- só que sem agregar o mês.
-- =============================================
CREATE TABLE IF NOT EXISTS fato_transferencias_mensal (
    id                  BIGSERIAL PRIMARY KEY,
    ano                 SMALLINT     NOT NULL,
    mes                 SMALLINT     NOT NULL,
    sigla_uf            CHAR(2)      NOT NULL,
    tipo_transferencia  VARCHAR(60)  NOT NULL,
    valor_transferido   NUMERIC(18, 2) NOT NULL,
    UNIQUE (sigla_uf, ano, mes, tipo_transferencia)
);

CREATE INDEX IF NOT EXISTS idx_fato_mensal_ano_mes ON fato_transferencias_mensal (ano, mes);
CREATE INDEX IF NOT EXISTS idx_fato_mensal_uf      ON fato_transferencias_mensal (sigla_uf);

ALTER TABLE fato_transferencias_mensal ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública" ON fato_transferencias_mensal;
CREATE POLICY "Leitura pública" ON fato_transferencias_mensal FOR SELECT USING (true);

-- VIEWS: agregações mensais por estado e por região, sempre em sincronia
-- com fato_transferencias_mensal (sem precisar de passo de agregação manual)
CREATE OR REPLACE VIEW agg_por_estado_mes AS
SELECT
    f.ano,
    f.mes,
    f.sigla_uf,
    e.regiao,
    SUM(f.valor_transferido) AS valor_total
FROM fato_transferencias_mensal f
JOIN dim_estado e ON e.sigla_uf = f.sigla_uf
GROUP BY f.ano, f.mes, f.sigla_uf, e.regiao
ORDER BY f.ano, f.mes, f.sigla_uf;

CREATE OR REPLACE VIEW agg_por_regiao_mes AS
SELECT
    f.ano,
    f.mes,
    e.regiao,
    SUM(f.valor_transferido) AS valor_total
FROM fato_transferencias_mensal f
JOIN dim_estado e ON e.sigla_uf = f.sigla_uf
GROUP BY f.ano, f.mes, e.regiao
ORDER BY f.ano, f.mes, e.regiao;

CREATE OR REPLACE VIEW agg_por_tipo_mes AS
SELECT
    ano,
    mes,
    tipo_transferencia,
    SUM(valor_transferido) AS valor_total
FROM fato_transferencias_mensal
GROUP BY ano, mes, tipo_transferencia
ORDER BY ano, mes, tipo_transferencia;
