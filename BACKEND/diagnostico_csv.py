"""
Diagnóstico: estrutura real do CSV do Tesouro Nacional
"""
import requests
import pandas as pd
from io import StringIO

CKAN_API   = "https://www.tesourotransparente.gov.br/ckan/api/3/action/package_show"
DATASET_ID = "transferencias-constitucionais-para-estados"

print("Consultando CKAN...")
r = requests.get(CKAN_API, params={"id": DATASET_ID}, timeout=30)
recursos = r.json()["result"]["resources"]

print(f"\n=== TODOS OS ARQUIVOS DISPONÍVEIS ({len(recursos)} total) ===")
for rec in recursos:
    print(f"  nome='{rec.get('name','')}' | url={rec.get('url','')[:80]}")

# Pega o primeiro arquivo que tenha 2025 no nome
url_2025 = None
nome_2025 = None
for rec in recursos:
    nome = rec.get("name", "")
    url  = rec.get("url", "")
    if "2025" in nome and url:
        url_2025  = url
        nome_2025 = nome
        break

if not url_2025:
    print("\nNenhum arquivo de 2025 encontrado. Usando o primeiro disponível.")
    for rec in recursos:
        if rec.get("url"):
            url_2025  = rec["url"]
            nome_2025 = rec.get("name", "")
            break

print(f"\n=== BAIXANDO: {nome_2025} ===")
r2 = requests.get(url_2025, timeout=30)
df = pd.read_csv(StringIO(r2.content.decode("latin1")), sep=";", low_memory=False)
df.columns = df.columns.str.strip()

print("\n=== COLUNAS ===")
for c in df.columns:
    print(f"  '{c}'")

print(f"\n=== SHAPE: {df.shape} ===")

# Amostra de TO
col_uf = next((c for c in df.columns if c.strip().upper() == "UF"), None)
if col_uf:
    df_to = df[df[col_uf].astype(str).str.strip().str.upper() == "TO"].copy()
    print(f"\n=== LINHAS DE TOCANTINS (TO): {len(df_to)} linhas ===")
    print(df_to.to_string())

    print("\n=== VALORES ÚNICOS POR COLUNA (TO) ===")
    for c in df.columns:
        vals = df_to[c].dropna().unique().tolist()
        print(f"  '{c}': {vals}")
