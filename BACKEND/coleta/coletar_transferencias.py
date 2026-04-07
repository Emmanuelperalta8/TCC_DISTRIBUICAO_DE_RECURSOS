"""
Script de Coleta - Transferências Constitucionais para Estados
Fonte: Tesouro Nacional Transparente (via API CKAN)

Autor: Emmanuel de Oliveira Peralta Duarte
TCC - Engenharia de Software - ULBRA Palmas

Correções aplicadas:
  1. Filtro: apenas Item == Transferência E Transferência != FUNDEB/FUNDEF
  2. Detecção de valores em centavos (divide por 100 se média por estado > 1B)
"""

import requests
import pandas as pd
import os
import time
from io import StringIO
from dotenv import load_dotenv

load_dotenv()

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

# Destinos a excluir (redistribuições — não são transferências diretas ao estado)
DESTINOS_EXCLUIR = {"FUNDEB", "FUNDEF"}

# Valor máximo razoável por estado/mês (R$ 50 bilhões)
VALOR_MAX_POR_ESTADO = 50_000_000_000


def listar_arquivos_ckan() -> list:
    print("  [CKAN] Consultando lista de arquivos...")
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
    print(f"  ✓ {len(arquivos)} arquivos encontrados")
    return arquivos


def baixar_csv_memoria(url: str) -> pd.DataFrame:
    try:
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        return pd.read_csv(StringIO(r.content.decode("latin1")), sep=";", low_memory=False)
    except Exception as e:
        print(f"✗ {e}")
        return pd.DataFrame()


def processar_csv(df: pd.DataFrame, ano: int) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame()

    df.columns = df.columns.str.strip()

    col_uf       = next((c for c in df.columns if c.strip().upper() == "UF"), None)
    col_dec1     = next((c for c in df.columns if "1" in c and "ec" in c.lower()), None)
    col_dec2     = next((c for c in df.columns if "2" in c and "ec" in c.lower()), None)
    col_dec3     = next((c for c in df.columns if "3" in c and "ec" in c.lower()), None)
    col_item     = next((c for c in df.columns if "item" in c.lower()), None)
    col_transfer = next((c for c in df.columns if "transfer" in c.lower() and "item" not in c.lower()), None)

    if not col_uf or not col_item:
        return pd.DataFrame()

    # Filtrar estados válidos
    df[col_uf] = df[col_uf].astype(str).str.strip().str.upper()
    df = df[df[col_uf].isin(ESTADOS)].copy()

    if df.empty:
        return pd.DataFrame()

    df[col_item] = df[col_item].astype(str).str.strip()

    # Filtro principal: excluir linhas onde destino é FUNDEB/FUNDEF
    if col_transfer:
        df[col_transfer] = df[col_transfer].astype(str).str.strip().str.upper()
        df = df[~df[col_transfer].isin(DESTINOS_EXCLUIR)].copy()

    if df.empty:
        return pd.DataFrame()

    # Somar decêndios
    cols_val = [c for c in [col_dec1, col_dec2, col_dec3] if c]
    for c in cols_val:
        df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0)

    df["valor_transferido"] = df[cols_val].sum(axis=1)

    # Detecção de valores em centavos
    # Se o valor médio por linha ultrapassar 1 bilhão, provavelmente está em centavos
    media = df["valor_transferido"].mean()
    if media > 1_000_000_000:
        print(f"⚠ Valores em centavos detectados (média R${media/1e9:.1f}B) → dividindo por 100", end=" ")
        df["valor_transferido"] = df["valor_transferido"] / 100

    df["ano"]                = ano
    df["sigla_uf"]           = df[col_uf]
    df["tipo_transferencia"] = df[col_item]

    resultado = (
        df.groupby(["ano", "sigla_uf", "tipo_transferencia"])["valor_transferido"]
        .sum()
        .reset_index()
    )

    # Remover valores absurdos (> 50B por estado/tipo/mês)
    resultado = resultado[resultado["valor_transferido"] <= VALOR_MAX_POR_ESTADO]

    return resultado[resultado["valor_transferido"] > 0]


def carregar_supabase(client, df: pd.DataFrame):
    registros = df.where(pd.notna(df), None).to_dict(orient="records")
    BATCH = 500
    total = 0
    for i in range(0, len(registros), BATCH):
        client.table("fato_transferencias").upsert(registros[i:i+BATCH]).execute()
        total += len(registros[i:i+BATCH])
        print(f"\r    Supabase: {total}/{len(registros)}...", end="")
    print(f"\r    ✓ {total:,} registros carregados          ")


def main():
    print("=" * 60)
    print("  COLETA - TRANSFERÊNCIAS CONSTITUCIONAIS")
    print("  Fonte: Tesouro Nacional → Supabase")
    print("  TCC - Emmanuel Peralta - ULBRA Palmas")
    print("=" * 60)

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("\n✗ Configure SUPABASE_URL e SUPABASE_SERVICE_KEY no .env")
        return

    from supabase import create_client
    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    print("\n  Limpando tabela fato_transferencias...")
    client.table("fato_transferencias").delete().neq("id", 0).execute()
    print("  ✓ Tabela limpa")

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
                print(f"\n  Total {ano_atual}: R$ {total_bi:.1f}B")
                carregar_supabase(client, df_ano)
                frames_ano = []

            print(f"\n▶ Ano {ano}")
            ano_atual = ano

        print(f"  {mes:02d}/{ano}...", end=" ", flush=True)
        df_raw  = baixar_csv_memoria(url)
        df_proc = processar_csv(df_raw, ano)

        if not df_proc.empty:
            frames_ano.append(df_proc)
            print(f"✓ R$ {df_proc['valor_transferido'].sum()/1e9:.2f}B")
        else:
            print("⚠ sem dados")

        time.sleep(0.2)

    if frames_ano:
        df_ano = (
            pd.concat(frames_ano, ignore_index=True)
            .groupby(["ano", "sigla_uf", "tipo_transferencia"])["valor_transferido"]
            .sum().reset_index()
        )
        total_bi = df_ano["valor_transferido"].sum() / 1e9
        print(f"\n  Total {ano_atual}: R$ {total_bi:.1f}B")
        carregar_supabase(client, df_ano)

    print(f"\n{'='*60}")
    print("✓ Coleta e carga concluídas!")
    print("=" * 60)


if __name__ == "__main__":
    main()