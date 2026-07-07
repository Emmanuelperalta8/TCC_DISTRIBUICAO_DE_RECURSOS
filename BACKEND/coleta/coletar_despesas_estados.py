"""
Script de Coleta - Despesas dos Governos Estaduais
Fonte: SICONFI (Sistema de Informações Contábeis e Fiscais do Setor Público) / STN
Relatório: RREO Anexo 1 - Balanço Orçamentário (Despesas Liquidadas)

Autor: Emmanuel de Oliveira Peralta Duarte
TCC - Engenharia de Software - ULBRA Palmas

Metodologia:
  O RREO (Relatório Resumido da Execução Orçamentária) é publicado bimestralmente
  pelos entes federados conforme a LRF (Lei de Responsabilidade Fiscal, art. 52).
  Utilizamos o 6º bimestre (nr_periodo=6) que acumula o exercício completo.

  A métrica "Despesas Liquidadas" representa o estágio em que o serviço/produto
  foi entregue e a dívida foi reconhecida — é o indicador padrão de gasto efetivo,
  superior a "Empenhadas" (comprometimento) e similar a "Pagas" para análise anual.

  Referência: STN — Instruções de Procedimentos Contábeis (IPC) n. 06/2011;
  Lei 4.320/1964, art. 63 (liquidação da despesa).

Estrutura da resposta SICONFI (campos relevantes):
  conta   — nome da conta contábil (ex: "TOTAL DAS DESPESAS (XII) = (X + XI)")
  coluna  — nome da coluna (ex: "DESPESAS LIQUIDADAS ATÉ O BIMESTRE (h)")
  valor   — valor numérico em reais
"""

import logging
import os
import time

import requests
from dotenv import load_dotenv
import pandas as pd

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

# API SICONFI — Tesouro Nacional (sem necessidade de chave de API)
SICONFI_BASE = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt"

ANO_INICIO = 2016
ANO_FIM    = 2025

# Códigos IBGE dos estados — usados diretamente como id_ente no SICONFI
IBGE_ESTADOS = {
    "AC": 12, "AL": 27, "AM": 13, "AP": 16, "BA": 29,
    "CE": 23, "DF": 53, "ES": 32, "GO": 52, "MA": 21,
    "MG": 31, "MS": 50, "MT": 51, "PA": 15, "PB": 25,
    "PE": 26, "PI": 22, "PR": 41, "RJ": 33, "RN": 24,
    "RO": 11, "RR": 14, "RS": 43, "SC": 42, "SE": 28,
    "SP": 35, "TO": 17,
}

TIMEOUT = 30
DELAY   = 0.3   # segundos entre requisições para não sobrecarregar a API


def buscar_despesas_rreo(id_ente: int, uf: str, ano: int) -> float:
    """
    Consulta RREO Anexo 1 no SICONFI e extrai o total de Despesas Liquidadas
    até o 6º bimestre (exercício completo).

    Campos reais da API: conta, coluna, valor
    Coluna desejada: "DESPESAS LIQUIDADAS ATÉ O BIMESTRE (h)" (acumulado anual)
    Conta desejada:  "TOTAL DAS DESPESAS (XII) = (X + XI)"
    """
    url = f"{SICONFI_BASE}/rreo"
    params = {
        "an_exercicio":          ano,
        "nr_periodo":            6,      # 6º bimestre = acumulado anual
        "co_tipo_demonstrativo": "RREO",
        "id_ente":               id_ente,
    }
    try:
        r = requests.get(url, params=params, timeout=TIMEOUT)
        r.raise_for_status()
        items = r.json().get("items", [])

        if not items:
            log.warning("  SICONFI sem dados: UF=%s id_ente=%s ano=%d", uf, id_ente, ano)
            return 0.0

        # Filtra colunas de "Liquidadas acumulado até o bimestre"
        # Exclui "NO BIMESTRE" (= só o 6º bimestre, não o acumulado anual)
        liq = [
            i for i in items
            if "LIQUIDADA" in i.get("coluna", "").upper()
            and "BIMESTRE"  in i.get("coluna", "").upper()
            and "NO BIMESTRE" not in i.get("coluna", "").upper()
        ]

        if not liq:
            log.warning("  Nenhuma linha de despesas liquidadas: %s/%d", uf, ano)
            return 0.0

        # Prioridade 1: conta "TOTAL DAS DESPESAS" (inclui extra + intra-orçamentárias)
        for item in liq:
            conta = item.get("conta", "").upper()
            if "TOTAL" in conta and "DESPESA" in conta:
                v = float(item.get("valor", 0) or 0)
                if v > 0:
                    log.info("  %s/%d → R$ %.2fB", uf, ano, v / 1e9)
                    return v

        # Prioridade 2: "SUBTOTAL DAS DESPESAS"
        for item in liq:
            conta = item.get("conta", "").upper()
            if "SUBTOTAL" in conta and "DESPESA" in conta:
                v = float(item.get("valor", 0) or 0)
                if v > 0:
                    log.info("  %s/%d → R$ %.2fB (subtotal)", uf, ano, v / 1e9)
                    return v

        # Prioridade 3: maior valor entre candidatas (o agregado > suas partes)
        max_val = max((float(i.get("valor", 0) or 0) for i in liq), default=0.0)
        if max_val > 0:
            log.info("  %s/%d → R$ %.2fB (max candidata)", uf, ano, max_val / 1e9)
            return max_val

        log.warning("  Nenhuma linha de despesas liquidadas encontrada: %s/%d", uf, ano)
        return 0.0

    except requests.RequestException as e:
        log.warning("  Erro SICONFI %s/%d: %s", uf, ano, e)
        return 0.0


def carregar_supabase(client, registros: list[dict]):
    """Faz upsert em lotes na tabela fato_despesas_uf."""
    BATCH = 200
    total = 0
    for i in range(0, len(registros), BATCH):
        client.table("fato_despesas_uf").upsert(
            registros[i:i + BATCH],
            on_conflict="ano,sigla_uf",
        ).execute()
        total += len(registros[i:i + BATCH])
    log.info("  %d registros gravados no Supabase", total)


def main():
    log.info("=" * 60)
    log.info("  COLETA - DESPESAS DOS GOVERNOS ESTADUAIS")
    log.info("  Fonte: SICONFI/STN — RREO Anexo 1")
    log.info("  TCC - Emmanuel Peralta - ULBRA Palmas")
    log.info("=" * 60)

    if not SUPABASE_URL or not SUPABASE_KEY:
        log.error("Configure SUPABASE_URL e SUPABASE_SERVICE_KEY no .env")
        return

    from supabase import create_client
    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Busca registros já existentes com seus valores
    existentes_raw = (
        client.table("fato_despesas_uf")
        .select("ano,sigla_uf,despesa_liquidada")
        .execute()
        .data
    )
    # Chave: (ano, sigla_uf) → valor já salvo (0 = falhou antes, >0 = ok)
    existentes = {(r["ano"], r["sigla_uf"]): float(r["despesa_liquidada"] or 0)
                  for r in existentes_raw}
    log.info("%d registros existem no banco.", len(existentes))

    log.info("Coletando despesas por estado/ano (anos %d–%d)...", ANO_INICIO, ANO_FIM)
    registros = []
    for ano in range(ANO_INICIO, ANO_FIM + 1):
        pendentes = [uf for uf in IBGE_ESTADOS if existentes.get((ano, uf), -1) <= 0]
        if not pendentes:
            log.info("▶ Ano %d — completo, pulando.", ano)
            continue
        log.info("▶ Ano %d — %d estado(s) pendentes.", ano, len(pendentes))
        for uf in pendentes:
            id_ente = IBGE_ESTADOS[uf]
            despesa = buscar_despesas_rreo(id_ente, uf, ano)
            registros.append({
                "ano":               ano,
                "sigla_uf":          uf,
                "despesa_liquidada": round(despesa, 2),
            })
            time.sleep(DELAY)

    df = pd.DataFrame(registros)
    com_dados = df[df["despesa_liquidada"] > 0]
    log.info(
        "Total: %d registros, %d com despesas > 0",
        len(df), len(com_dados),
    )

    if not registros:
        log.info("Nenhum registro novo para inserir. Banco já está atualizado.")
        return

    if com_dados.empty:
        log.error("Nenhum dado coletado. Verifique se a API SICONFI está acessível.")
        return

    log.info("Carregando no Supabase (tabela fato_despesas_uf)...")
    carregar_supabase(client, registros)

    log.info("=" * 60)
    log.info("Coleta concluída! %d estados com dados de despesas.", len(com_dados["sigla_uf"].unique()))
    log.info("=" * 60)


if __name__ == "__main__":
    main()
