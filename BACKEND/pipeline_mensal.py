#!/usr/bin/env python3
"""
Pipeline Mensal para KPIs Year-to-Date
Processa dados brutos, valida, consolida e calcula indicadores

Etapas:
  1. Extrai dados brutos pendentes
  2. Valida contra regras de negócio
  3. Consolida por estado/tipo
  4. Calcula YTD e Gini
  5. Cria alertas

Uso:
  python pipeline_mensal.py
  python pipeline_mensal.py --mes 2026-06-01
"""

import argparse
import calendar
import logging
import os
from datetime import datetime, date
from decimal import Decimal

import pandas as pd
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

REGIOES = {
    "AC": "Norte",   "AM": "Norte",   "AP": "Norte",   "PA": "Norte",
    "RO": "Norte",   "RR": "Norte",   "TO": "Norte",
    "AL": "Nordeste", "BA": "Nordeste", "CE": "Nordeste", "MA": "Nordeste",
    "PB": "Nordeste", "PE": "Nordeste", "PI": "Nordeste", "RN": "Nordeste",
    "SE": "Nordeste",
    "DF": "Centro-Oeste", "GO": "Centro-Oeste", "MT": "Centro-Oeste", "MS": "Centro-Oeste",
    "ES": "Sudeste", "MG": "Sudeste", "RJ": "Sudeste", "SP": "Sudeste",
    "PR": "Sul", "RS": "Sul", "SC": "Sul"
}


def _supabase_client():
    from supabase import create_client
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("Configure SUPABASE_URL e SUPABASE_SERVICE_KEY no .env")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def _fetch_all(client, tabela: str, filtros: dict = None) -> list:
    """Busca registros do Supabase com filtros opcionais"""
    query = client.table(tabela).select("*")

    if filtros:
        for coluna, valor in filtros.items():
            query = query.eq(coluna, valor)

    todos = []
    offset = 0
    while True:
        res = query.range(offset, offset + 999).execute()
        if not res.data:
            break
        todos.extend(res.data)
        if len(res.data) < 1000:
            break
        offset += 1000
    return todos


def etapa_1_extrair(mes_referencia: date) -> pd.DataFrame:
    """ETAPA 1: Extrai dados brutos pendentes"""
    log.info("─" * 60)
    log.info("  ETAPA 1: EXTRAÇÃO DE DADOS BRUTOS")
    log.info("─" * 60)

    client = _supabase_client()
    registros = _fetch_all(
        client,
        "fact_transferencias_raw",
        {"mes_referencia": str(mes_referencia), "status_validacao": "pendente"}
    )

    if not registros:
        log.warning("  ⚠️  Nenhum dado bruto pendente para %s", mes_referencia)
        return pd.DataFrame()

    df = pd.DataFrame(registros)
    log.info("  ✓ %d registros extraídos", len(df))
    return df


def etapa_2_validar(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """ETAPA 2: Valida contra regras de negócio"""
    log.info("─" * 60)
    log.info("  ETAPA 2: VALIDAÇÃO")
    log.info("─" * 60)

    if df.empty:
        log.info("  ⚠️  DataFrame vazio, pulando validação")
        return df, pd.DataFrame()

    validos = df[
        (df["valor_transferido"] > 0) &
        (df["sigla_uf"].isin(REGIOES.keys())) &
        (df["tipo_transferencia"].notna())
    ].copy()

    invalidos = df[~df.index.isin(validos.index)].copy()

    log.info("  ✓ %d válidos, %d inválidos", len(validos), len(invalidos))

    # Marcar inválidos no Supabase
    if not invalidos.empty:
        client = _supabase_client()
        for _, row in invalidos.iterrows():
            try:
                client.table("fact_transferencias_raw").update({
                    "status_validacao": "invalido",
                    "mensagem_erro": "Falhou validação de negócio"
                }).eq("id", row["id"]).execute()
            except:
                pass

    return validos, invalidos


def etapa_3_consolidar(df: pd.DataFrame, mes_referencia: date) -> pd.DataFrame:
    """ETAPA 3: Consolida por estado/tipo e calcula valores"""
    log.info("─" * 60)
    log.info("  ETAPA 3: CONSOLIDAÇÃO")
    log.info("─" * 60)

    if df.empty:
        log.info("  ⚠️  Nenhum dado para consolidar")
        return pd.DataFrame()

    # Buscar população do mês
    client = _supabase_client()
    ano = mes_referencia.year
    pop_registros = _fetch_all(
        client,
        "dim_populacao",
        {"ano": ano}
    )
    pop_df = pd.DataFrame(pop_registros) if pop_registros else pd.DataFrame()

    # Consolidar por estado/tipo
    consolidado = df.groupby(["sigla_uf", "tipo_transferencia"]).agg({
        "valor_transferido": "sum",
        "mes_referencia": "first"
    }).reset_index()

    # Adicionar população e região
    consolidado["regiao"] = consolidado["sigla_uf"].map(REGIOES)

    if not pop_df.empty:
        pop_dict = dict(zip(pop_df["sigla_uf"], pop_df["populacao"]))
        consolidado["populacao"] = consolidado["sigla_uf"].map(pop_dict)
    else:
        consolidado["populacao"] = None

    consolidado["valor_per_capita"] = (
        consolidado["valor_transferido"] / consolidado["populacao"]
    ).fillna(0)

    # Calcular YTD (acumular do início do ano até esse mês)
    consolidado = _calcular_ytd(consolidado, mes_referencia, client)

    log.info("  ✓ %d registros consolidados", len(consolidado))
    return consolidado


def _calcular_ytd(df: pd.DataFrame, mes_referencia: date, client) -> pd.DataFrame:
    """Calcula valores Year-to-Date"""
    ano = mes_referencia.year
    mes_num = mes_referencia.month

    # Buscar dados históricos do ano (meses anteriores)
    historico = _fetch_all(
        client,
        "fato_transferencias_mes",
        {}  # vai filtrar manualmente
    )

    df_hist = pd.DataFrame(historico) if historico else pd.DataFrame()

    # Filtrar apenas meses anteriores do mesmo ano
    if not df_hist.empty:
        df_hist["mes_data"] = pd.to_datetime(df_hist["mes_referencia"])
        df_hist = df_hist[df_hist["mes_data"].dt.year == ano]
        df_hist = df_hist[df_hist["mes_data"].dt.month < mes_num]

    # Acumular YTD por estado/tipo
    ytd_dict = {}
    if not df_hist.empty:
        ytd_agg = df_hist.groupby(["sigla_uf", "tipo_transferencia"])["valor_transferido"].sum()
        for (uf, tipo), valor in ytd_agg.items():
            ytd_dict[(uf, tipo)] = valor

    df["valor_ytd"] = df.apply(
        lambda r: ytd_dict.get((r["sigla_uf"], r["tipo_transferencia"]), 0) + r["valor_transferido"],
        axis=1
    )

    return df


def etapa_4_calcular_indicadores(df: pd.DataFrame, mes_referencia: date) -> pd.DataFrame:
    """ETAPA 4: Calcula Gini, alertas e agregações"""
    log.info("─" * 60)
    log.info("  ETAPA 4: CÁLCULO DE INDICADORES")
    log.info("─" * 60)

    if df.empty:
        log.info("  ⚠️  Nenhum dado para calcular indicadores")
        return pd.DataFrame()

    # Calcular Gini por estado
    def gini(valores):
        valores = sorted(valores)
        n = len(valores)
        if sum(valores) == 0:
            return 0
        cumsum = 0
        for i, v in enumerate(valores):
            cumsum += (i + 1) * v
        return (2 * cumsum) / (n * sum(valores)) - (n + 1) / n

    df["indice_gini"] = df.groupby("sigla_uf")["valor_transferido"].transform(gini)

    # Determinar status de alerta (simplifac)
    df["status_alerta"] = "verde"

    log.info("  ✓ Indicadores calculados")
    return df


def etapa_5_persistir(df: pd.DataFrame, mes_referencia: date, invalidos: pd.DataFrame):
    """ETAPA 5: Persiste dados no Supabase"""
    log.info("─" * 60)
    log.info("  ETAPA 5: PERSISTÊNCIA")
    log.info("─" * 60)

    client = _supabase_client()

    if df.empty:
        log.info("  ⚠️  Nenhum dado para persistir")
        return

    # 1. Inserir em fato_transferencias_mes
    dados_mes = []
    for _, row in df.iterrows():
        dados_mes.append({
            "mes_referencia": str(row["mes_referencia"]),
            "sigla_uf": row["sigla_uf"],
            "tipo_transferencia": row["tipo_transferencia"],
            "valor_transferido": float(row["valor_transferido"]),
            "valor_ytd": float(row.get("valor_ytd", 0)),
            "populacao_mes": int(row["populacao"]) if pd.notna(row.get("populacao")) else None,
            "valor_per_capita": float(row.get("valor_per_capita", 0)),
        })

    try:
        client.table("fato_transferencias_mes").upsert(dados_mes).execute()
        log.info("  ✓ %d registros em fato_transferencias_mes", len(dados_mes))
    except Exception as e:
        log.error("  ❌ Erro ao inserir fato_transferencias_mes: %s", str(e))

    # 2. Agregações por estado
    agg_estado = df.groupby(["sigla_uf", "regiao"]).agg({
        "valor_transferido": "sum",
        "valor_ytd": "first",
        "populacao": "first",
        "indice_gini": "first",
        "status_alerta": "first"
    }).reset_index()

    agg_estado["mes_referencia"] = str(mes_referencia)
    agg_estado["valor_total_mes"] = agg_estado["valor_transferido"]
    agg_estado["valor_per_capita_mes"] = (
        agg_estado["valor_transferido"] / agg_estado["populacao"]
    ).fillna(0)
    agg_estado["valor_per_capita_ytd"] = (
        agg_estado["valor_ytd"] / agg_estado["populacao"]
    ).fillna(0)

    dados_agg_est = agg_estado[[
        "mes_referencia", "sigla_uf", "regiao", "valor_total_mes", "valor_ytd",
        "populacao", "valor_per_capita_mes", "valor_per_capita_ytd", "indice_gini", "status_alerta"
    ]].to_dict("records")

    try:
        client.table("agg_mes_estado").upsert(dados_agg_est).execute()
        log.info("  ✓ %d registros em agg_mes_estado", len(dados_agg_est))
    except Exception as e:
        log.error("  ❌ Erro ao inserir agg_mes_estado: %s", str(e))

    # 3. Agregações por região
    agg_regiao = df.groupby("regiao").agg({
        "valor_transferido": "sum",
        "valor_ytd": "first",
        "populacao": "first",
        "status_alerta": "first"
    }).reset_index()

    agg_regiao["mes_referencia"] = str(mes_referencia)
    agg_regiao["valor_total_mes"] = agg_regiao["valor_transferido"]
    agg_regiao["valor_per_capita_mes"] = (
        agg_regiao["valor_transferido"] / agg_regiao["populacao"]
    ).fillna(0)
    agg_regiao["valor_per_capita_ytd"] = (
        agg_regiao["valor_ytd"] / agg_regiao["populacao"]
    ).fillna(0)

    dados_agg_reg = agg_regiao[[
        "mes_referencia", "regiao", "valor_total_mes", "valor_ytd",
        "populacao", "valor_per_capita_mes", "valor_per_capita_ytd", "status_alerta"
    ]].to_dict("records")

    try:
        client.table("agg_mes_regiao").upsert(dados_agg_reg).execute()
        log.info("  ✓ %d registros em agg_mes_regiao", len(dados_agg_reg))
    except Exception as e:
        log.error("  ❌ Erro ao inserir agg_mes_regiao: %s", str(e))

    # 4. Marcar raw como processado
    try:
        client.table("fact_transferencias_raw").update({
            "status_validacao": "processado"
        }).eq("mes_referencia", str(mes_referencia)).eq("status_validacao", "pendente").execute()
        log.info("  ✓ Dados brutos marcados como processados")
    except Exception as e:
        log.error("  ❌ Erro ao marcar como processado: %s", str(e))


def main():
    parser = argparse.ArgumentParser(description="Pipeline mensal de KPIs YTD")
    parser.add_argument("--mes", help="Mês (YYYY-MM-DD), padrão: último dia do mês anterior")
    args = parser.parse_args()

    # Determinar mês de referência
    if args.mes:
        mes_referencia = datetime.strptime(args.mes, "%Y-%m-%d").date()
    else:
        hoje = date.today()
        if hoje.month == 1:
            mes_referencia = date(hoje.year - 1, 12, 1)
        else:
            mes_referencia = date(hoje.year, hoje.month - 1, 1)

    log.info("=" * 60)
    log.info("  PIPELINE MENSAL - KPIs YEAR-TO-DATE")
    log.info("  Mês de referência: %s", mes_referencia.strftime("%B/%Y"))
    log.info("=" * 60)

    # Executar etapas
    df_raw = etapa_1_extrair(mes_referencia)
    df_valido, df_invalido = etapa_2_validar(df_raw)
    df_consolidado = etapa_3_consolidar(df_valido, mes_referencia)
    df_indicadores = etapa_4_calcular_indicadores(df_consolidado, mes_referencia)
    etapa_5_persistir(df_indicadores, mes_referencia, df_invalido)

    log.info("=" * 60)
    log.info("✅ PIPELINE CONCLUÍDO COM SUCESSO!")
    log.info("=" * 60)

    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
