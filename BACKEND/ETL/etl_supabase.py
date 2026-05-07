"""
ETL - Integração, Transformação e Carga no Supabase
Data Mart Temático - Transferências Federais

Autor: Emmanuel de Oliveira Peralta Duarte
TCC - Engenharia de Software - ULBRA Palmas

Etapas:
  1. Lê os CSVs coletados (transferências + população)
  2. Integra e calcula indicadores per capita
  3. Constrói as tabelas do modelo estrela (Data Mart)
  4. Carrega no Supabase (PostgreSQL)
"""

import pandas as pd
import os
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")  # usar service_role key para insert

DATA_DIR = "dados_brutos"
SAIDA_DIR = "dados_processados"
os.makedirs(SAIDA_DIR, exist_ok=True)

# ──────────────────────────────────────────────
# 1. EXTRAÇÃO
# ──────────────────────────────────────────────

def _supabase_client():
    from supabase import create_client
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("Configure SUPABASE_URL e SUPABASE_SERVICE_KEY no .env")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def _fetch_all(client, tabela: str, colunas: str) -> list:
    """Busca todos os registros do Supabase paginando de 1000 em 1000."""
    todos = []
    offset = 0
    while True:
        res = client.table(tabela).select(colunas).range(offset, offset + 999).execute()
        if not res.data:
            break
        todos.extend(res.data)
        if len(res.data) < 1000:
            break
        offset += 1000
    return todos


def carregar_transferencias() -> pd.DataFrame:
    print("  Lendo fato_transferencias do Supabase...")
    client = _supabase_client()
    registros = _fetch_all(client, "fato_transferencias", "ano,sigla_uf,tipo_transferencia,valor_transferido")
    if not registros:
        raise RuntimeError("Tabela fato_transferencias vazia. Execute primeiro: python coleta/coletar_transferencias.py")
    df = pd.DataFrame(registros)
    df["valor_transferido"] = pd.to_numeric(df["valor_transferido"], errors="coerce").fillna(0)
    print(f"  ✓ Transferências: {len(df):,} registros")
    return df


def carregar_populacao() -> pd.DataFrame:
    # Tenta CSV local primeiro (mais rápido), senão lê do Supabase
    caminho = os.path.join(DATA_DIR, "populacao_estados.csv")
    if os.path.exists(caminho):
        df = pd.read_csv(caminho, encoding="utf-8")
        print(f"  ✓ População: {len(df):,} registros (CSV local)")
        return df

    print("  Lendo dim_populacao do Supabase...")
    client = _supabase_client()
    registros = _fetch_all(client, "dim_populacao", "sigla_uf,ano,populacao")
    if not registros:
        raise RuntimeError("Sem dados de população. Execute primeiro: python coletar_populacao_ibge.py")
    df = pd.DataFrame(registros)
    print(f"  ✓ População: {len(df):,} registros (Supabase)")
    return df


# ──────────────────────────────────────────────
# 2. TRANSFORMAÇÃO - DIMENSÕES
# ──────────────────────────────────────────────

REGIOES = {
    "AC": "Norte",   "AM": "Norte",   "AP": "Norte",   "PA": "Norte",
    "RO": "Norte",   "RR": "Norte",   "TO": "Norte",
    "AL": "Nordeste","BA": "Nordeste","CE": "Nordeste","MA": "Nordeste",
    "PB": "Nordeste","PE": "Nordeste","PI": "Nordeste","RN": "Nordeste",
    "SE": "Nordeste",
    "ES": "Sudeste", "MG": "Sudeste", "RJ": "Sudeste", "SP": "Sudeste",
    "PR": "Sul",     "RS": "Sul",     "SC": "Sul",
    "DF": "Centro-Oeste","GO": "Centro-Oeste","MS": "Centro-Oeste","MT": "Centro-Oeste",
}

NOMES_ESTADOS = {
    "AC": "Acre", "AL": "Alagoas", "AM": "Amazonas", "AP": "Amapá",
    "BA": "Bahia", "CE": "Ceará", "DF": "Distrito Federal", "ES": "Espírito Santo",
    "GO": "Goiás", "MA": "Maranhão", "MG": "Minas Gerais", "MS": "Mato Grosso do Sul",
    "MT": "Mato Grosso", "PA": "Pará", "PB": "Paraíba", "PE": "Pernambuco",
    "PI": "Piauí", "PR": "Paraná", "RJ": "Rio de Janeiro", "RN": "Rio Grande do Norte",
    "RO": "Rondônia", "RR": "Roraima", "RS": "Rio Grande do Sul", "SC": "Santa Catarina",
    "SE": "Sergipe", "SP": "São Paulo", "TO": "Tocantins",
}


def construir_dim_estado(df_transferencias: pd.DataFrame) -> pd.DataFrame:
    """Dimensão: Estado (sigla, nome, região)."""
    estados = df_transferencias["sigla_uf"].unique()
    dim = pd.DataFrame({
        "sigla_uf": estados,
        "nome_estado": [NOMES_ESTADOS.get(s, s) for s in estados],
        "regiao": [REGIOES.get(s, "Desconhecida") for s in estados],
    }).sort_values("sigla_uf").reset_index(drop=True)
    dim.index = dim.index + 1
    dim.index.name = "id_estado"
    return dim.reset_index()


def construir_dim_tempo(anos: list) -> pd.DataFrame:
    """Dimensão: Tempo (ano, período presidencial)."""
    def periodo_presidencial(ano):
        if ano <= 2002: return "FHC"
        elif ano <= 2010: return "Lula I/II"
        elif ano <= 2014: return "Dilma I"
        elif ano <= 2016: return "Dilma II"
        elif ano <= 2018: return "Temer"
        elif ano <= 2022: return "Bolsonaro"
        else: return "Lula III"

    dim = pd.DataFrame({
        "ano": sorted(anos),
        "decada": [f"{(a // 10) * 10}s" for a in sorted(anos)],
        "periodo_presidencial": [periodo_presidencial(a) for a in sorted(anos)],
    })
    dim.index = dim.index + 1
    dim.index.name = "id_tempo"
    return dim.reset_index()


def construir_dim_tipo_transferencia(df: pd.DataFrame) -> pd.DataFrame:
    """Dimensão: Tipo de Transferência."""
    categorias = {
        "FPE": "Constitucional",
        "ICMS": "Constitucional",
        "IPI": "Constitucional",
        "CIDE": "Constitucional",
        "IOF_OURO": "Constitucional",
        "Constitucional": "Constitucional",
        "Convênios": "Voluntária",
        "Voluntária": "Voluntária",
        "Emendas Parlamentares": "Voluntária",
        "Saúde": "Vinculada",
        "Educação": "Vinculada",
    }

    tipos = df["tipo_transferencia"].unique()
    dim = pd.DataFrame({
        "tipo_transferencia": tipos,
        "categoria": [categorias.get(t, "Outras") for t in tipos],
    }).sort_values("tipo_transferencia").reset_index(drop=True)
    dim.index = dim.index + 1
    dim.index.name = "id_tipo"
    return dim.reset_index()


# ──────────────────────────────────────────────
# 3. TRANSFORMAÇÃO - TABELA FATO
# ──────────────────────────────────────────────

def construir_fato_transferencias(
    df_transf: pd.DataFrame,
    df_pop: pd.DataFrame,
    dim_estado: pd.DataFrame,
    dim_tempo: pd.DataFrame,
    dim_tipo: pd.DataFrame,
) -> pd.DataFrame:
    """
    Tabela fato principal do modelo estrela.
    Relaciona transferências com dimensões e calcula per capita.
    """

    # Juntar com população
    df = df_transf.merge(df_pop, on=["ano", "sigla_uf"], how="left")
    df["populacao"] = df["populacao"].fillna(0).astype(int)

    # Calcular valor per capita (em R$)
    df["valor_per_capita"] = df.apply(
        lambda r: round(r["valor_transferido"] / r["populacao"], 2)
        if r["populacao"] > 0 else 0,
        axis=1,
    )

    # Adicionar IDs das dimensões
    mapa_estado = dim_estado.set_index("sigla_uf")["id_estado"].to_dict()
    mapa_tempo = dim_tempo.set_index("ano")["id_tempo"].to_dict()
    mapa_tipo = dim_tipo.set_index("tipo_transferencia")["id_tipo"].to_dict()

    df["id_estado"] = df["sigla_uf"].map(mapa_estado)
    df["id_tempo"] = df["ano"].map(mapa_tempo)
    df["id_tipo"] = df["tipo_transferencia"].map(mapa_tipo)

    # Selecionar colunas finais da tabela fato
    fato = df[[
        "id_estado", "id_tempo", "id_tipo",
        "sigla_uf", "ano", "tipo_transferencia",
        "valor_transferido", "populacao", "valor_per_capita",
    ]].dropna(subset=["id_estado", "id_tempo", "id_tipo"])

    # Métricas agregadas adicionais (para indicadores do dashboard)
    fato["valor_transferido"] = fato["valor_transferido"].round(2)

    return fato.reset_index(drop=True)


# ──────────────────────────────────────────────
# 4. AGREGAÇÕES PARA O DASHBOARD
# ──────────────────────────────────────────────

def construir_agregacoes(fato: pd.DataFrame) -> dict:
    """
    Pré-calcula agregações para tornar o dashboard mais rápido.
    """
    import numpy as np

    # Total por estado e ano (todos os tipos)
    por_estado_ano = (
        fato.groupby(["ano", "sigla_uf"])
        .agg(
            valor_total=("valor_transferido", "sum"),
            populacao=("populacao", "first"),
        )
        .reset_index()
    )
    por_estado_ano["populacao"] = por_estado_ano["populacao"].replace(0, np.nan)
    por_estado_ano["valor_per_capita"] = (
        por_estado_ano["valor_total"] / por_estado_ano["populacao"]
    ).round(2)
    por_estado_ano["valor_per_capita"] = por_estado_ano["valor_per_capita"].replace([np.inf, -np.inf], np.nan).fillna(0)
    por_estado_ano["populacao"] = por_estado_ano["populacao"].fillna(0).astype(int)

    # Total por região e ano
    regioes_map = pd.Series(REGIOES)
    por_estado_ano["regiao"] = por_estado_ano["sigla_uf"].map(regioes_map)
    por_regiao_ano = (
        por_estado_ano.groupby(["ano", "regiao"])
        .agg(valor_total=("valor_total", "sum"), populacao=("populacao", "sum"))
        .reset_index()
    )
    por_regiao_ano["populacao"] = por_regiao_ano["populacao"].replace(0, np.nan)
    por_regiao_ano["valor_per_capita"] = (
        por_regiao_ano["valor_total"] / por_regiao_ano["populacao"]
    ).round(2)
    por_regiao_ano["valor_per_capita"] = por_regiao_ano["valor_per_capita"].replace([np.inf, -np.inf], np.nan).fillna(0)
    por_regiao_ano["populacao"] = por_regiao_ano["populacao"].fillna(0).astype(int)

    # Total por tipo e ano (Brasil)
    por_tipo_ano = (
        fato.groupby(["ano", "tipo_transferencia"])
        .agg(valor_total=("valor_transferido", "sum"))
        .reset_index()
    )

    # Ranking de estados por ano (valor per capita)
    ranking = (
        por_estado_ano.sort_values(["ano", "valor_per_capita"], ascending=[True, False])
        .assign(ranking=lambda d: d.groupby("ano").cumcount() + 1)
    )

    return {
        "por_estado_ano": por_estado_ano,
        "por_regiao_ano": por_regiao_ano,
        "por_tipo_ano": por_tipo_ano,
        "ranking_estados": ranking,
    }


# ──────────────────────────────────────────────
# 5. CARGA - SALVAR CSVs E SUPABASE
# ──────────────────────────────────────────────

def salvar_csvs(dim_estado, dim_tempo, dim_tipo, fato, agregacoes):
    """Salva todos os arquivos processados localmente."""
    arquivos = {
        "dim_estado.csv": dim_estado,
        "dim_tempo.csv": dim_tempo,
        "dim_tipo_transferencia.csv": dim_tipo,
        "fato_transferencias.csv": fato,
        **{f"agg_{nome}.csv": df for nome, df in agregacoes.items()},
    }

    for nome, df in arquivos.items():
        caminho = os.path.join(SAIDA_DIR, nome)
        df.to_csv(caminho, index=False, encoding="utf-8")
        print(f"  ✓ Salvo: {caminho} ({len(df):,} linhas)")


def carregar_supabase(tabela: str, df: pd.DataFrame, on_conflict: str = None):
    """
    Carrega um DataFrame no Supabase via API REST.
    Usa upsert para não duplicar dados em re-execuções.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        print(f"  ⚠ Supabase não configurado. Pulando carga de '{tabela}'.")
        return False

    try:
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_KEY)

        registros = df.where(pd.notna(df), None).to_dict(orient="records")

        BATCH = 500
        total = 0
        for i in range(0, len(registros), BATCH):
            lote = registros[i:i+BATCH]
            req = client.table(tabela).upsert(lote)
            if on_conflict:
                req = client.table(tabela).upsert(lote, on_conflict=on_conflict)
            req.execute()
            total += len(lote)
            print(f"\r  [{tabela}] {total}/{len(registros)} registros inseridos...", end="")

        print(f"\r  ✓ {tabela}: {total:,} registros carregados no Supabase          ")
        return True

    except ImportError:
        print("  ✗ Biblioteca supabase não instalada. Execute: pip install supabase")
        return False
    except Exception as e:
        print(f"  ✗ Erro ao carregar {tabela}: {e}")
        return False


def gerar_sql_supabase():
    """
    Gera o script SQL para criar as tabelas no Supabase.
    Execute este SQL no SQL Editor do Supabase antes de rodar o ETL.
    """
    sql = """
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
"""

    caminho = os.path.join(SAIDA_DIR, "criar_tabelas_supabase.sql")
    with open(caminho, "w", encoding="utf-8") as f:
        f.write(sql)
    print(f"  ✓ SQL salvo: {caminho}")
    return sql


# ──────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  ETL - INTEGRAÇÃO E CARGA NO SUPABASE")
    print("  TCC - Emmanuel Peralta - ULBRA Palmas")
    print("=" * 60)

    # 1. Extrair
    print("\n[1/5] Carregando dados brutos...")
    df_transf = carregar_transferencias()
    df_pop = carregar_populacao()

    # 2. Construir dimensões
    print("\n[2/5] Construindo dimensões do modelo estrela...")
    dim_estado = construir_dim_estado(df_transf)
    dim_tempo = construir_dim_tempo(df_transf["ano"].unique().tolist())
    dim_tipo = construir_dim_tipo_transferencia(df_transf)
    print(f"  ✓ dim_estado: {len(dim_estado)} estados")
    print(f"  ✓ dim_tempo: {len(dim_tempo)} anos")
    print(f"  ✓ dim_tipo: {len(dim_tipo)} tipos")

    # 3. Construir fato
    print("\n[3/5] Construindo tabela fato (com per capita)...")
    fato = construir_fato_transferencias(df_transf, df_pop, dim_estado, dim_tempo, dim_tipo)
    print(f"  ✓ fato_transferencias: {len(fato):,} registros")

    # 4. Agregações
    print("\n[4/5] Calculando agregações...")
    agregacoes = construir_agregacoes(fato)
    for nome, df in agregacoes.items():
        print(f"  ✓ {nome}: {len(df):,} registros")

    # 5. Salvar
    print("\n[5/5] Salvando arquivos e carregando no Supabase...")
    salvar_csvs(dim_estado, dim_tempo, dim_tipo, fato, agregacoes)

    # Gerar SQL para criar tabelas no Supabase
    gerar_sql_supabase()

    # Carregar no Supabase (se configurado)
    if SUPABASE_URL and SUPABASE_KEY:
        print("\n  Carregando no Supabase...")

        # dim_estado já existe com capital/id_ibge — pular para não conflitar
        print("  ℹ  dim_estado: já existe no Supabase, pulando.")

        carregar_supabase("dim_tempo", dim_tempo)
        carregar_supabase("dim_tipo_transferencia", dim_tipo)

        # fato_transferencias: atualizar apenas populacao e valor_per_capita
        fato_slim = fato[["sigla_uf", "ano", "tipo_transferencia",
                           "populacao", "valor_per_capita"]].copy()
        carregar_supabase("fato_transferencias", fato_slim,
                          on_conflict="ano,sigla_uf,tipo_transferencia")

        on_conflict_agg = {
            "agg_por_estado_ano":  "ano,sigla_uf",
            "agg_por_regiao_ano":  "ano,regiao",
            "agg_por_tipo_ano":    "ano,tipo_transferencia",
            "agg_ranking_estados": "ano,sigla_uf",
        }
        for nome, df in agregacoes.items():
            tabela = f"agg_{nome}"
            carregar_supabase(tabela, df, on_conflict=on_conflict_agg.get(tabela))
    else:
        print("\n  ℹ  Configure SUPABASE_URL e SUPABASE_SERVICE_KEY no .env para carregar no banco.")

    print(f"\n{'='*60}")
    print("✓ ETL concluído com sucesso!")
    print(f"  Arquivos em: {SAIDA_DIR}/")
    print(f"  SQL para Supabase: {SAIDA_DIR}/criar_tabelas_supabase.sql")
    print("=" * 60)


if __name__ == "__main__":
    main()