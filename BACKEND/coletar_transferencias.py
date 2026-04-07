"""
Script de Coleta - Transferências Constitucionais para Estados
Fonte: Tesouro Nacional Transparente

Autor: Emmanuel de Oliveira Peralta Duarte
TCC - Engenharia de Software - ULBRA Palmas

Formato do CSV:
  UF | ANO | Mês | 1º Decêndio | 2º Decêndio | 3º Decêndio | Item transferência | Transferência
"""

import requests
import pandas as pd
import os
import time
from datetime import datetime

OUTPUT_DIR = "dados_brutos"
os.makedirs(OUTPUT_DIR, exist_ok=True)

ANOS_ALVO = list(range(2010, datetime.now().year + 1))

ESTADOS = [
    "AC","AL","AM","AP","BA","CE","DF","ES","GO",
    "MA","MG","MS","MT","PA","PB","PE","PI","PR",
    "RJ","RN","RO","RR","RS","SC","SE","SP","TO"
]

def montar_url(ano: int, mes: int) -> str:
    return (
        f"https://www.tesourotransparente.gov.br/ckan/dataset/"
        f"d4a5a640-c83e-4b59-b4f8-ca0b53af6b0d/resource/"
        f"e0c81e52-efcd-4d48-a1e2-23e9e2568f5e/download/"
        f"Transferencia_Mensal_Estados_{ano}{mes:02d}.csv"
    )

def baixar_mes(ano: int, mes: int) -> pd.DataFrame:
    url = montar_url(ano, mes)
    cache = os.path.join(OUTPUT_DIR, f"raw_{ano}{mes:02d}.csv")

    if os.path.exists(cache):
        try:
            return pd.read_csv(cache, sep="\t", encoding="latin1", low_memory=False)
        except:
            return pd.read_csv(cache, sep=";", encoding="latin1", low_memory=False)

    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        with open(cache, "wb") as f:
            f.write(resp.content)

        try:
            return pd.read_csv(cache, sep="\t", encoding="latin1", low_memory=False)
        except:
            return pd.read_csv(cache, sep=";", encoding="latin1", low_memory=False)

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            return pd.DataFrame()
        print(f"    ✗ HTTP {e.response.status_code}")
        return pd.DataFrame()
    except Exception as e:
        print(f"    ✗ {e}")
        return pd.DataFrame()

def processar(df: pd.DataFrame, ano: int) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame()

    # Normalizar colunas
    df.columns = df.columns.str.strip()

    # Identificar colunas dinamicamente
    col_uf    = next((c for c in df.columns if "UF" in c.upper()), None)
    col_dec1  = next((c for c in df.columns if "1" in c and "EC" in c.upper()), None)
    col_dec2  = next((c for c in df.columns if "2" in c and "EC" in c.upper()), None)
    col_dec3  = next((c for c in df.columns if "3" in c and "EC" in c.upper()), None)
    col_item  = next((c for c in df.columns if "ITEM" in c.upper()), None)

    if not col_uf or not col_item:
        return pd.DataFrame()

    # Filtrar apenas estados
    df[col_uf] = df[col_uf].astype(str).str.strip().str.upper()
    df = df[df[col_uf].isin(ESTADOS)].copy()

    if df.empty:
        return pd.DataFrame()

    def to_float(s):
        try:
            return float(str(s).replace(".", "").replace(",", ".").strip())
        except:
            return 0.0

    # Calcular valor total = soma dos 3 decêndios
    for col in [col_dec1, col_dec2, col_dec3]:
        if col:
            df[col] = df[col].apply(to_float)

    cols_valor = [c for c in [col_dec1, col_dec2, col_dec3] if c]
    df["valor_transferido"] = df[cols_valor].sum(axis=1)

    df["ano"] = ano
    df["sigla_uf"] = df[col_uf]
    df["tipo_transferencia"] = df[col_item].astype(str).str.strip()

    resultado = (
        df.groupby(["ano", "sigla_uf", "tipo_transferencia"])["valor_transferido"]
        .sum()
        .reset_index()
    )
    return resultado[resultado["valor_transferido"] > 0]


def main():
    print("=" * 60)
    print("  COLETA - TRANSFERÊNCIAS CONSTITUCIONAIS")
    print("  Fonte: Tesouro Nacional Transparente")
    print("  TCC - Emmanuel Peralta - ULBRA Palmas")
    print("=" * 60)
    print(f"\n  Anos: {ANOS_ALVO[0]} – {ANOS_ALVO[-1]}\n")

    frames = []

    for ano in ANOS_ALVO:
        print(f"\n▶ Ano {ano}")
        frames_ano = []

        for mes in range(1, 13):
            if ano == datetime.now().year and mes > datetime.now().month:
                break

            print(f"  {mes:02d}/{ano}...", end=" ", flush=True)
            df_raw = baixar_mes(ano, mes)

            if df_raw.empty:
                print("✗ não encontrado")
                continue

            df_proc = processar(df_raw, ano)
            if not df_proc.empty:
                frames_ano.append(df_proc)
                tipos = df_proc["tipo_transferencia"].nunique()
                total = df_proc["valor_transferido"].sum()
                print(f"✓ {tipos} tipos | R$ {total/1e9:.1f}B")
            else:
                print("⚠ sem dados")

            time.sleep(0.2)

        if frames_ano:
            df_ano = (
                pd.concat(frames_ano, ignore_index=True)
                .groupby(["ano", "sigla_uf", "tipo_transferencia"])["valor_transferido"]
                .sum().reset_index()
            )
            frames.append(df_ano)
            total_ano = df_ano["valor_transferido"].sum()
            print(f"  ✓ {len(df_ano)} registros | Total: R$ {total_ano/1e9:.1f}B")

    if not frames:
        print("\n✗ Nenhum dado coletado.")
        return pd.DataFrame()

    df_final = pd.concat(frames, ignore_index=True)
    caminho = os.path.join(OUTPUT_DIR, "transferencias_consolidado.csv")
    df_final.to_csv(caminho, index=False, encoding="utf-8")

    print(f"\n{'='*60}")
    print(f"✓ Coleta concluída!")
    print(f"  Registros: {len(df_final):,}")
    print(f"  Anos: {df_final['ano'].min()} – {df_final['ano'].max()}")
    print(f"  Estados: {df_final['sigla_uf'].nunique()}")
    print(f"  Tipos: {sorted(df_final['tipo_transferencia'].unique().tolist())}")
    print(f"  Arquivo: {caminho}")
    print("=" * 60)
    return df_final


if __name__ == "__main__":
    main()