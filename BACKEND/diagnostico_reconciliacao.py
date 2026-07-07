"""
Diagnóstico: reconcilia os dados que estão no Supabase (fato_transferencias,
carregados pelo pipeline a partir da API CKAN) contra o relatório oficial
"Transferências para estados" baixado manualmente do site do Tesouro
Transparente.

A planilha de referência NUNCA é usada como fonte de dados do sistema — serve
só de gabarito para encontrar o gap. O lado "sistema" vem do Supabase, que por
sua vez foi populado pela API (mesma fonte da planilha).

Uso:
  python diagnostico_reconciliacao.py
"""

import os

import pandas as pd
from dotenv import load_dotenv

load_dotenv()

REF_CSV = r"C:\Users\emmanuel.peralta\Downloads\transferências_para_estados (1).csv"
ANO_INICIO = 2016  # mesmo recorte do pipeline (coletar_transferencias.ANO_INICIO)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")


def carregar_referencia() -> pd.DataFrame:
    df = pd.read_csv(REF_CSV, sep=";", encoding="latin1")
    df.columns = df.columns.str.strip()

    col_dest = next(c for c in df.columns if "ransfer" in c and c != "UF")
    df = df.rename(columns={
        col_dest: "destino",
        "Valor Consolidado": "valor_str",
        "Ano": "ano",
        "UF": "sigla_uf",
    })

    df["valor"] = (
        df["valor_str"]
        .str.replace("R$", "", regex=False)
        .str.replace(".", "", regex=False)
        .str.replace(",", ".", regex=False)
        .astype(float)
    )

    return df[["sigla_uf", "ano", "destino", "valor"]]


def carregar_sistema() -> pd.DataFrame:
    from supabase import create_client

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("Configure SUPABASE_URL e SUPABASE_SERVICE_KEY no .env")

    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    registros, offset = [], 0
    while True:
        res = (
            client.table("fato_transferencias")
            .select("sigla_uf,ano,valor_transferido")
            .range(offset, offset + 999)
            .execute()
        )
        if not res.data:
            break
        registros.extend(res.data)
        if len(res.data) < 1000:
            break
        offset += 1000

    df = pd.DataFrame(registros)
    df["valor_transferido"] = pd.to_numeric(df["valor_transferido"], errors="coerce").fillna(0)
    return df


def main():
    print("Carregando referência oficial (planilha baixada)...")
    ref = carregar_referencia()
    ref = ref[ref["ano"] >= ANO_INICIO]

    # mesma exclusão que o pipeline aplica (DESTINO_EXCLUIR = "FUNDEB",
    # cobre "FUNDEB" e "AJUSTE FUNDEB") — comparação justa com o sistema
    ref_excluidos = ref[ref["destino"].str.upper().str.contains("FUNDEB")]
    ref_filtrada = ref[~ref["destino"].str.upper().str.contains("FUNDEB")]

    ref_tot = (
        ref_filtrada.groupby(["sigla_uf", "ano"])["valor"]
        .sum()
        .reset_index()
        .rename(columns={"valor": "valor_referencia"})
    )

    print("Carregando dados atuais do sistema (Supabase: fato_transferencias)...")
    sist = carregar_sistema()
    sist = sist[sist["ano"] >= ANO_INICIO]
    sist_tot = (
        sist.groupby(["sigla_uf", "ano"])["valor_transferido"]
        .sum()
        .reset_index()
        .rename(columns={"valor_transferido": "valor_sistema"})
    )

    comp = ref_tot.merge(sist_tot, on=["sigla_uf", "ano"], how="outer")
    comp[["valor_referencia", "valor_sistema"]] = comp[["valor_referencia", "valor_sistema"]].fillna(0)
    comp["delta"] = comp["valor_sistema"] - comp["valor_referencia"]
    comp["delta_pct"] = (
        (comp["delta"] / comp["valor_referencia"].replace(0, pd.NA)) * 100
    ).round(2)
    comp = comp.reindex(comp["delta"].abs().sort_values(ascending=False).index)

    out_path = "diagnostico_reconciliacao.csv"
    comp.to_csv(out_path, index=False, encoding="utf-8")

    TOLERANCIA = 1.0  # R$1 de arredondamento é aceitável
    divergentes = comp[comp["delta"].abs() > TOLERANCIA]

    print("=" * 70)
    print(f"Total de pares UF/Ano comparados (>= {ANO_INICIO}): {len(comp)}")
    print(f"Divergentes (gap > R$ {TOLERANCIA:.2f}): {len(divergentes)}")
    print(f"Arquivo completo salvo em: {out_path}")
    print("=" * 70)

    if not ref_excluidos.empty:
        print(f"\n(Excluí {len(ref_excluidos)} linhas da referência com destino "
              f"FUNDEB/AJUSTE FUNDEB, mesma regra do pipeline)")

    if not divergentes.empty:
        print("\nTOP 20 maiores divergências (R$):")
        print(
            divergentes.head(20)[
                ["sigla_uf", "ano", "valor_referencia", "valor_sistema", "delta", "delta_pct"]
            ].to_string(index=False)
        )
    else:
        print("\nNenhuma divergência acima da tolerância. Sistema bate com a referência.")


if __name__ == "__main__":
    main()
