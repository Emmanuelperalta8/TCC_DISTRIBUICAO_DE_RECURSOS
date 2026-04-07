"""
Script de Coleta - Estados e População via API IBGE
Carrega nas tabelas: dim_estado e dim_populacao

Autor: Emmanuel de Oliveira Peralta Duarte
TCC - Engenharia de Software - ULBRA Palmas

Fontes:
  - Censo 2010: tabela 1552, variável 93
  - Estimativas 2011-2021: tabela 6579, variável 9324
  - Censo 2022: tabela 9514, variável 93
  - Estimativas 2023+: tabela 6579, variável 9324
"""

import requests
import pandas as pd
import os
import time
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
IBGE_BASE    = "https://servicodados.ibge.gov.br/api"

CAPITAIS = {
    "RO": "Porto Velho",    "AC": "Rio Branco",     "AM": "Manaus",
    "RR": "Boa Vista",      "PA": "Belém",           "AP": "Macapá",
    "TO": "Palmas",         "MA": "São Luís",        "PI": "Teresina",
    "CE": "Fortaleza",      "RN": "Natal",           "PB": "João Pessoa",
    "PE": "Recife",         "AL": "Maceió",          "SE": "Aracaju",
    "BA": "Salvador",       "MG": "Belo Horizonte",  "ES": "Vitória",
    "RJ": "Rio de Janeiro", "SP": "São Paulo",       "PR": "Curitiba",
    "SC": "Florianópolis",  "RS": "Porto Alegre",    "MS": "Campo Grande",
    "MT": "Cuiabá",         "GO": "Goiânia",         "DF": "Brasília",
}

REGIOES_SIGLA = {
    "N": "Norte", "NE": "Nordeste", "SE": "Sudeste",
    "S": "Sul",   "CO": "Centro-Oeste"
}

def parsear_series(dados: list, fonte: str) -> list:
    """Extrai registros de nome/ano/populacao da resposta SIDRA."""
    registros = []
    for variavel in dados:
        for resultado in variavel.get("resultados", []):
            for serie in resultado.get("series", []):
                nome = serie["localidade"]["nome"]
                for ano_str, pop_str in serie["serie"].items():
                    try:
                        registros.append({
                            "nome_estado": nome,
                            "ano":         int(ano_str),
                            "populacao":   int(pop_str),
                            "fonte":       fonte,
                        })
                    except:
                        continue
    return registros

def coletar_sidra(tabela: int, variavel: int, periodos: str, fonte: str) -> list:
    url = (
        f"{IBGE_BASE}/v3/agregados/{tabela}/periodos/{periodos}"
        f"/variaveis/{variavel}?localidades=N3%5Ball%5D"
    )
    try:
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        return parsear_series(r.json(), fonte)
    except Exception as e:
        print(f"  ✗ Erro {tabela}/{periodos}: {e}")
        return []

# ─────────────────────────────────────────────
# COLETAR ESTADOS
# ─────────────────────────────────────────────
def coletar_estados() -> pd.DataFrame:
    print("\n[1/3] Coletando estados via API IBGE Localidades...")
    r = requests.get(f"{IBGE_BASE}/v1/localidades/estados", timeout=20)
    r.raise_for_status()
    registros = []
    for e in r.json():
        registros.append({
            "sigla_uf":    e["sigla"],
            "nome_estado": e["nome"],
            "regiao":      REGIOES_SIGLA.get(e["regiao"]["sigla"], e["regiao"]["nome"]),
            "capital":     CAPITAIS.get(e["sigla"], ""),
            "id_ibge":     e["id"],
        })
    df = pd.DataFrame(registros).sort_values("sigla_uf").reset_index(drop=True)
    print(f"  ✓ {len(df)} estados coletados")
    return df

# ─────────────────────────────────────────────
# COLETAR POPULAÇÃO COMPLETA
# ─────────────────────────────────────────────
def coletar_populacao(df_estados: pd.DataFrame) -> pd.DataFrame:
    print("\n[2/3] Coletando população por estado e ano...")

    mapa = df_estados.set_index("nome_estado")["sigla_uf"].to_dict()
    registros = []

    # Censo 2010
    print("  → Censo 2010...")
    registros += coletar_sidra(1552, 93, "2010", "IBGE Censo 2010")

    # Estimativas 2011-2021
    print("  → Estimativas 2011–2021...")
    periodos = "|".join(str(a) for a in range(2011, 2022))
    registros += coletar_sidra(6579, 9324, periodos, "IBGE Estimativa")
    time.sleep(0.5)

    # Censo 2022
    print("  → Censo 2022...")
    registros += coletar_sidra(9514, 93, "2022", "IBGE Censo 2022")
    time.sleep(0.5)

    # Estimativas 2023-2025
    print("  → Estimativas 2023–2025...")
    periodos = "|".join(str(a) for a in range(2023, 2026))
    registros += coletar_sidra(6579, 9324, periodos, "IBGE Estimativa")

    # Montar DataFrame
    df = pd.DataFrame(registros)
    df["sigla_uf"] = df["nome_estado"].map(mapa)
    df = df.dropna(subset=["sigla_uf"])
    df = df[["sigla_uf", "ano", "populacao", "fonte"]]
    df = df.drop_duplicates(subset=["sigla_uf", "ano"], keep="last")
    df = df.sort_values(["sigla_uf", "ano"]).reset_index(drop=True)

    print(f"  ✓ {len(df)} registros | Anos: {df['ano'].min()}–{df['ano'].max()} | Estados: {df['sigla_uf'].nunique()}")
    return df

# ─────────────────────────────────────────────
# CARREGAR NO SUPABASE
# ─────────────────────────────────────────────
def carregar_supabase(tabela: str, df: pd.DataFrame):
    if not SUPABASE_URL or not SUPABASE_KEY:
        print(f"  ⚠ Supabase não configurado.")
        return
    try:
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        registros = df.where(pd.notna(df), None).to_dict(orient="records")
        BATCH = 500
        total = 0
        for i in range(0, len(registros), BATCH):
            client.table(tabela).upsert(registros[i:i+BATCH]).execute()
            total += len(registros[i:i+BATCH])
            print(f"\r  [{tabela}] {total}/{len(registros)}...", end="")
        print(f"\r  ✓ {tabela}: {total:,} registros carregados          ")
    except Exception as e:
        print(f"\n  ✗ Erro: {e}")

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
def main():
    print("=" * 60)
    print("  COLETA IBGE - ESTADOS E POPULAÇÃO")
    print("  TCC - Emmanuel Peralta - ULBRA Palmas")
    print("=" * 60)

    df_estados = coletar_estados()
    df_pop     = coletar_populacao(df_estados)

    os.makedirs("dados_brutos", exist_ok=True)
    df_estados.to_csv("dados_brutos/estados.csv",    index=False, encoding="utf-8")
    df_pop.to_csv(    "dados_brutos/populacao.csv",  index=False, encoding="utf-8")
    print("\n  ✓ CSVs salvos em dados_brutos/")

    print("\n[3/3] Carregando no Supabase...")
    carregar_supabase("dim_estado",    df_estados)
    carregar_supabase("dim_populacao", df_pop)

    print(f"\n{'='*60}")
    print("✓ Concluído!")
    print(f"  dim_estado:    {len(df_estados)} estados")
    print(f"  dim_populacao: {len(df_pop)} registros (2010–2025)")
    print("=" * 60)

if __name__ == "__main__":
    main()