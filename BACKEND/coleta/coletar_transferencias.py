"""
Script de Coleta - Transferências Constitucionais para Estados
Fonte: Tesouro Nacional Transparente (via API CKAN)

Autor: Emmanuel de Oliveira Peralta Duarte
TCC - Engenharia de Software - ULBRA Palmas

Colunas reais do CSV (confirmado via diagnóstico):
  - 'Item transferência' → tipo da transferência (FPE, FPM, ITR, IPI-EXP, etc.)
  - 'Transferência'      → destino (FPE direto ao estado, FUNDEB, Royalties, etc.)
  - '1º Decêndio', '2º Decêndio', '3º Decêndio' → valores por período

Metodologia:
  O CSV contém transferências estaduais e municipais agrupadas por UF.
  Filtramos apenas as transferências destinadas ao ESTADO (ente estadual),
  alinhadas ao relatório "Transferências para estados" do Tesouro Transparente.

  Excluídos:
  - Contribuições ao FUNDEB (ICMS, IPVA, ITCMD): saídas do estado para o fundo
  - FPM: Fundo de Participação dos Municípios (vai aos municípios, não ao estado)
  - ITR: Imposto Territorial Rural (50% vai ao município onde está o imóvel)
  - Ajustes contábeis: AJUSTE FUNDEB VAAR, COUN VAAR

  Nota: A distribuição do FUNDEB (R$1.4 bi para TO/2025) está em dataset
  separado do CKAN e não consta neste CSV. É reportada pelo site oficial
  como linha separada "FUNDEB" no relatório consolidado.
"""

import logging
import os
import time
from io import StringIO

import pandas as pd
import requests
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

CKAN_API   = "https://www.tesourotransparente.gov.br/ckan/api/3/action/package_show"
DATASET_ID = "transferencias-constitucionais-para-estados"
ANO_INICIO = 2016

ESTADOS = [
    "AC","AL","AM","AP","BA","CE","DF","ES","GO",
    "MA","MG","MS","MT","PA","PB","PE","PI","PR",
    "RJ","RN","RO","RR","RS","SC","SE","SP","TO"
]

# O CSV traz, para cada "Item transferência" (FPE, IPI-EXP, FPM, ICMS, ITR, etc.),
# uma ou mais linhas por DESTINO (coluna "Transferência"): o valor que efetivamente
# chega ao caixa do estado (destino = FPE, IPI-Exp, IOF-Ouro, Royalties, LC176/2020...)
# e/ou a parcela retida constitucionalmente para o FUNDEB (destino = FUNDEB).
# Itens como FPM, ICMS, IPVA, ITCMD, ITR e COUN VAAF/VAAR/VAAT só têm linha com
# destino = FUNDEB (nunca chegam ao estado). Por isso o filtro correto é pelo
# destino, não pelo nome do item — excluímos qualquer linha com destino FUNDEB.
DESTINO_EXCLUIR = "FUNDEB"

# Valor máximo razoável por estado/mês (R$ 50 bilhões)
VALOR_MAX_POR_ESTADO = 50_000_000_000


def listar_arquivos_ckan() -> list:
    log.info("[CKAN] Consultando lista de arquivos...")
    r = requests.get(CKAN_API, params={"id": DATASET_ID}, timeout=30)
    r.raise_for_status()
    recursos = r.json()["result"]["resources"]

    vistos = {}
    for rec in recursos:
        nome = rec.get("name", "")
        url  = rec.get("url", "")
        if "Mensal" not in nome or "Estado" not in nome or not url:
            continue
        partes  = nome.replace(".csv", "").split("_")
        ano_mes = partes[-1] if partes else ""
        if len(ano_mes) == 6 and ano_mes.isdigit():
            ano = int(ano_mes[:4])
            mes = int(ano_mes[4:])
            if ano >= ANO_INICIO:
                vistos[(ano, mes)] = {"nome": nome, "url": url, "ano": ano, "mes": mes}

    arquivos = sorted(vistos.values(), key=lambda x: (x["ano"], x["mes"]))
    log.info("%d arquivos encontrados", len(arquivos))
    return arquivos


def baixar_csv_memoria(url: str) -> pd.DataFrame:
    try:
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        return pd.read_csv(StringIO(r.content.decode("latin1")), sep=";", low_memory=False)
    except requests.RequestException as e:
        log.warning("Falha ao baixar CSV (%s): %s", url, e)
        return pd.DataFrame()


def processar_csv(df: pd.DataFrame, ano: int) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame()

    df.columns = df.columns.str.strip()

    col_uf    = next((c for c in df.columns if c.strip().upper() == "UF"), None)
    col_dec1  = next((c for c in df.columns if "1" in c and "ec" in c.lower()), None)
    col_dec2  = next((c for c in df.columns if "2" in c and "ec" in c.lower()), None)
    col_dec3  = next((c for c in df.columns if "3" in c and "ec" in c.lower()), None)
    col_item  = next((c for c in df.columns if "item" in c.lower()), None)
    col_dest  = next((c for c in df.columns if c.strip().lower() == "transferência"), None)

    if not col_uf or not col_item or not col_dest:
        log.warning("CSV de %d sem colunas UF/item/destino esperadas. Colunas: %s", ano, list(df.columns))
        return pd.DataFrame()

    df[col_uf] = df[col_uf].astype(str).str.strip().str.upper()
    df = df[df[col_uf].isin(ESTADOS)].copy()

    if df.empty:
        return pd.DataFrame()

    df[col_item] = df[col_item].astype(str).str.strip()
    df[col_dest] = df[col_dest].astype(str).str.strip()
    df = df[df[col_dest].str.upper() != DESTINO_EXCLUIR].copy()

    if df.empty:
        return pd.DataFrame()

    cols_val = [c for c in [col_dec1, col_dec2, col_dec3] if c]
    for c in cols_val:
        df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0)

    df["valor_transferido"] = df[cols_val].sum(axis=1)

    # Detecção de valores em centavos: média > 1 bi sugere escala errada
    media = df["valor_transferido"].mean()
    if media > 1_000_000_000:
        log.warning(
            "Valores em centavos detectados (média R$ %.1fB) — dividindo por 100",
            media / 1e9,
        )
        df["valor_transferido"] = df["valor_transferido"] / 100

    df["ano"]                = ano
    df["sigla_uf"]           = df[col_uf]
    df["tipo_transferencia"] = df[col_item]

    resultado = (
        df.groupby(["ano", "sigla_uf", "tipo_transferencia"])["valor_transferido"]
        .sum()
        .reset_index()
    )

    resultado = resultado[resultado["valor_transferido"] <= VALOR_MAX_POR_ESTADO]
    return resultado[resultado["valor_transferido"] > 0]


def carregar_supabase(client, df: pd.DataFrame):
    registros = df.where(pd.notna(df), None).to_dict(orient="records")
    BATCH = 500
    total = 0
    for i in range(0, len(registros), BATCH):
        client.table("fato_transferencias").upsert(registros[i:i+BATCH]).execute()
        total += len(registros[i:i+BATCH])
        log.debug("Supabase: %d/%d...", total, len(registros))
    log.info("  %d registros carregados no Supabase", total)


def main():
    log.info("=" * 60)
    log.info("  COLETA - TRANSFERÊNCIAS CONSTITUCIONAIS")
    log.info("  Fonte: Tesouro Nacional → Supabase")
    log.info("  TCC - Emmanuel Peralta - ULBRA Palmas")
    log.info("=" * 60)

    if not SUPABASE_URL or not SUPABASE_KEY:
        log.error("Configure SUPABASE_URL e SUPABASE_SERVICE_KEY no .env")
        return

    from supabase import create_client
    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    log.info("Limpando tabela fato_transferencias...")
    client.table("fato_transferencias").delete().neq("id", 0).execute()
    log.info("Tabela limpa")

    arquivos = listar_arquivos_ckan()
    frames_ano = []
    ano_atual  = None

    for arq in arquivos:
        ano, mes, url = arq["ano"], arq["mes"], arq["url"]

        if ano != ano_atual:
            if frames_ano:
                df_ano = (
                    pd.concat(frames_ano, ignore_index=True)
                    .groupby(["ano", "sigla_uf", "tipo_transferencia"])["valor_transferido"]
                    .sum().reset_index()
                )
                total_bi = df_ano["valor_transferido"].sum() / 1e9
                log.info("Total %d: R$ %.1fB", ano_atual, total_bi)
                carregar_supabase(client, df_ano)
                frames_ano = []

            log.info("▶ Ano %d", ano)
            ano_atual = ano

        log.info("  %02d/%d...", mes, ano)
        df_raw  = baixar_csv_memoria(url)
        df_proc = processar_csv(df_raw, ano)

        if not df_proc.empty:
            frames_ano.append(df_proc)
            log.info("  ✓ R$ %.2fB", df_proc["valor_transferido"].sum() / 1e9)
        else:
            log.warning("  sem dados para %02d/%d", mes, ano)

        time.sleep(0.2)

    if frames_ano:
        df_ano = (
            pd.concat(frames_ano, ignore_index=True)
            .groupby(["ano", "sigla_uf", "tipo_transferencia"])["valor_transferido"]
            .sum().reset_index()
        )
        total_bi = df_ano["valor_transferido"].sum() / 1e9
        log.info("Total %d: R$ %.1fB", ano_atual, total_bi)
        carregar_supabase(client, df_ano)

    log.info("=" * 60)
    log.info("Coleta e carga concluídas!")
    log.info("=" * 60)


if __name__ == "__main__":
    main()
