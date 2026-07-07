"""
Script de Coleta - Transferências Constitucionais para Estados
Fonte: Tesouro Nacional Transparente (via API CKAN)

Autor: Emmanuel de Oliveira Peralta Duarte
TCC - Engenharia de Software - ULBRA Palmas

Colunas reais do CSV (confirmado via diagnóstico):
  - 'ANO', 'Mês'          → período real do lançamento (não confiar no nome do
                            arquivo: o CKAN já publicou recursos com o nome
                            sistematicamente um mês adiantado do conteúdo real,
                            e dois recursos diferentes com o nome IDÊNTICO mas
                            conteúdo de meses diferentes — por isso o período é
                            sempre lido de dentro do CSV, nunca do nome do arquivo)
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
from datetime import date
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
# destino, não pelo nome do item — excluímos qualquer linha cujo destino contenha
# FUNDEB (cobre tanto "FUNDEB" quanto ajustes como "AJUSTE FUNDEB").
DESTINO_EXCLUIR = "FUNDEB"

# Valor máximo razoável por estado/mês (R$ 50 bilhões)
VALOR_MAX_POR_ESTADO = 50_000_000_000


def listar_arquivos_ckan() -> list:
    """Lista os recursos do CKAN com dados de transferências por estado.

    Não filtra mais por "Mensal" no nome nem deriva ano/mês do nome do
    arquivo: o CKAN tem pelo menos um recurso (jan-jul/2016) que cobre
    vários meses em um único CSV e não segue o padrão "Mensal_Estados_*",
    além dos problemas já conhecidos de nome enganoso. O período real é
    sempre extraído de dentro do CSV em processar_csv(). Deduplicamos só
    pelo "id" do recurso, e ignoramos o dump histórico "1997-2015" (24
    cópias do mesmo arquivo, fora do recorte ANO_INICIO).
    """
    log.info("[CKAN] Consultando lista de arquivos...")
    r = requests.get(CKAN_API, params={"id": DATASET_ID}, timeout=30)
    r.raise_for_status()
    recursos = r.json()["result"]["resources"]

    vistos = {}
    for rec in recursos:
        nome   = rec.get("name", "")
        url    = rec.get("url", "")
        rec_id = rec.get("id", "") or url
        if "Estado" not in nome or "1997-2015" in nome or "Metadados" in nome or not url:
            continue
        vistos[rec_id] = {
            "nome": nome,
            "url": url,
            "criado_em": rec.get("created") or "",
        }

    arquivos = sorted(vistos.values(), key=lambda x: x["nome"])
    log.info("%d arquivos encontrados", len(arquivos))
    return arquivos


def baixar_csv_memoria(url: str) -> pd.DataFrame:
    try:
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        return pd.read_csv(StringIO(r.content.decode("latin1")), sep=";", low_memory=False)
    except (requests.RequestException, UnicodeDecodeError, pd.errors.ParserError) as e:
        log.warning("Falha ao baixar/ler CSV (%s): %s", url, e)
        return pd.DataFrame()


def processar_csv(df: pd.DataFrame) -> pd.DataFrame:
    """Processa um CSV de transferências, lendo ano/mês reais do conteúdo.

    Retorna granularidade MENSAL (ano, mes, sigla_uf, tipo_transferencia,
    valor_transferido). O rollup anual é derivado depois, em main(), a
    partir deste resultado — nunca a partir do nome do arquivo.
    """
    if df.empty:
        return pd.DataFrame()

    df.columns = df.columns.str.strip()

    col_uf   = next((c for c in df.columns if c.strip().upper() == "UF"), None)
    col_ano  = next((c for c in df.columns if c.strip().upper() == "ANO"), None)
    col_mes  = next((c for c in df.columns if c.strip().upper() in ("MÊS", "MES")), None)
    col_dec1 = next((c for c in df.columns if "1" in c and "ec" in c.lower()), None)
    col_dec2 = next((c for c in df.columns if "2" in c and "ec" in c.lower()), None)
    col_dec3 = next((c for c in df.columns if "3" in c and "ec" in c.lower()), None)
    col_item = next((c for c in df.columns if "item" in c.lower()), None)
    col_dest = next((c for c in df.columns if c.strip().lower() == "transferência"), None)

    # Fallback posicional: em pelo menos um CSV (2018) o cabeçalho da coluna
    # de destino vem corrompido como "Unnamed: N", mas a coluna continua na
    # mesma posição, logo após "Item transferência".
    if col_dest is None and col_item is not None:
        cols = list(df.columns)
        idx_item = cols.index(col_item)
        if idx_item + 1 < len(cols):
            candidato = cols[idx_item + 1]
            if candidato.lower().startswith("unnamed"):
                col_dest = candidato
                log.warning("Coluna de destino com cabeçalho corrompido — usando fallback posicional (%s)", col_dest)

    if not all([col_uf, col_ano, col_mes, col_item, col_dest]):
        log.warning("CSV sem colunas esperadas (UF/ANO/Mês/item/destino). Colunas: %s", list(df.columns))
        return pd.DataFrame()

    df[col_uf] = df[col_uf].astype(str).str.strip().str.upper()
    df = df[df[col_uf].isin(ESTADOS)].copy()
    if df.empty:
        return pd.DataFrame()

    df[col_ano] = pd.to_numeric(df[col_ano], errors="coerce")
    df[col_mes] = pd.to_numeric(df[col_mes], errors="coerce")
    df = df.dropna(subset=[col_ano, col_mes])
    df = df[df[col_ano] >= ANO_INICIO].copy()
    if df.empty:
        return pd.DataFrame()

    df[col_item] = df[col_item].astype(str).str.strip()
    df[col_dest] = df[col_dest].astype(str).str.strip()
    df = df[~df[col_dest].str.upper().str.contains(DESTINO_EXCLUIR)].copy()
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

    df["ano"]                = df[col_ano].astype(int)
    df["mes"]                = df[col_mes].astype(int)
    df["sigla_uf"]            = df[col_uf]
    df["tipo_transferencia"]  = df[col_item]

    resultado = (
        df.groupby(["ano", "mes", "sigla_uf", "tipo_transferencia"])["valor_transferido"]
        .sum()
        .reset_index()
    )

    resultado = resultado[resultado["valor_transferido"] <= VALOR_MAX_POR_ESTADO]
    return resultado[resultado["valor_transferido"] > 0]


def carregar_supabase(client, tabela: str, df: pd.DataFrame):
    if df.empty:
        return
    registros = df.where(pd.notna(df), None).to_dict(orient="records")
    BATCH = 500
    total = 0
    for i in range(0, len(registros), BATCH):
        client.table(tabela).upsert(registros[i:i + BATCH]).execute()
        total += len(registros[i:i + BATCH])
        log.debug("Supabase (%s): %d/%d...", tabela, total, len(registros))
    log.info("  %d registros carregados em %s", total, tabela)


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

    try:
        client.table("fato_transferencias_mensal").select("id").limit(1).execute()
    except Exception as e:
        log.error(
            "Tabela fato_transferencias_mensal não existe ainda (%s). "
            "Rode o bloco SQL em criar_tabelas_supabase.sql no SQL Editor "
            "do Supabase antes de continuar — abortando sem tocar em nada.",
            e,
        )
        return

    arquivos = listar_arquivos_ckan()

    frames = []
    for i, arq in enumerate(arquivos, start=1):
        log.info("  [%d/%d] %s", i, len(arquivos), arq["nome"])
        df_raw  = baixar_csv_memoria(arq["url"])
        df_proc = processar_csv(df_raw)

        if not df_proc.empty:
            periodos = sorted(set(zip(df_proc["ano"], df_proc["mes"])))
            df_proc["_recurso_criado_em"] = arq.get("criado_em", "")
            frames.append(df_proc)
            log.info(
                "    ✓ R$ %.2fB · período(s) real(is): %s",
                df_proc["valor_transferido"].sum() / 1e9,
                periodos,
            )
        else:
            log.warning("    sem dados aproveitáveis")

        time.sleep(0.2)

    if not frames:
        log.error("Nenhum dado coletado — abortando carga")
        return

    # O CKAN às vezes republica o mesmo período (ano, mês) sob um recurso novo
    # — seja com conteúdo byte-a-byte idêntico (duplicata simples) ou com
    # conteúdo DIFERENTE (retificação: ex. março/2023 saiu em dois recursos
    # com 296 e 403 linhas). Nos dois casos a fonte de verdade para aquele
    # período é o recurso criado mais recentemente — nunca a soma das
    # versões, que dobraria qualquer linha que não seja idêntica entre elas.
    combinado = pd.concat(frames, ignore_index=True)
    criado_mais_recente_por_periodo = (
        combinado.groupby(["ano", "mes"])["_recurso_criado_em"].transform("max")
    )
    antes = len(combinado)
    combinado = combinado[
        combinado["_recurso_criado_em"] == criado_mais_recente_por_periodo
    ].copy()
    if len(combinado) < antes:
        log.warning(
            "%d linha(s) descartada(s) de recurso(s) CKAN superado(s) por uma "
            "republicação mais recente do mesmo período (ano, mês)",
            antes - len(combinado),
        )
    combinado = combinado.drop(columns=["_recurso_criado_em"])

    mensal = (
        combinado
        .groupby(["ano", "mes", "sigla_uf", "tipo_transferencia"])["valor_transferido"]
        .sum()
        .reset_index()
    )

    anual = (
        mensal.groupby(["ano", "sigla_uf", "tipo_transferencia"])["valor_transferido"]
        .sum()
        .reset_index()
    )

    # Auditoria de completude: a fonte já demonstrou pular a publicação de um
    # mês inteiro sem republicar depois sob outro nome (confirmado: ago/2020,
    # ago/2021, out/2022, nov/2023, nov/2024 — nenhum recurso, com qualquer
    # nome, contém esse período). Sem essa checagem, o pipeline somaria
    # silenciosamente um total incompleto como se fosse o total real do ano.
    hoje = date.today()
    periodos_presentes = set(zip(mensal["ano"], mensal["mes"]))
    lacunas = []
    for ano in range(ANO_INICIO, hoje.year + 1):
        # dados costumam ser publicados com ~1 mês de atraso pela fonte
        limite_mes = 12 if ano < hoje.year else max(hoje.month - 1, 1)
        for mes in range(1, limite_mes + 1):
            if (ano, mes) not in periodos_presentes:
                lacunas.append((ano, mes))

    if lacunas:
        log.warning(
            "%d período(s) (ano, mês) nunca publicado(s) pela fonte CKAN — "
            "totais desses anos estão INCOMPLETOS: %s",
            len(lacunas), lacunas,
        )
        os.makedirs("dados_processados", exist_ok=True)
        pd.DataFrame(lacunas, columns=["ano", "mes"]).to_csv(
            os.path.join("dados_processados", "auditoria_completude_ckan.csv"),
            index=False,
        )
    else:
        log.info("Auditoria de completude: todos os períodos esperados estão presentes.")

    log.info("=" * 60)
    log.info("Total geral coletado: R$ %.1fB (%d linhas mensais, %d linhas anuais)",
              mensal["valor_transferido"].sum() / 1e9, len(mensal), len(anual))
    for ano in sorted(anual["ano"].unique()):
        total_ano = anual.loc[anual["ano"] == ano, "valor_transferido"].sum()
        log.info("  %d: R$ %.1fB", ano, total_ano / 1e9)
    log.info("=" * 60)

    log.info("Limpando fato_transferencias e fato_transferencias_mensal...")
    client.table("fato_transferencias").delete().neq("id", 0).execute()
    client.table("fato_transferencias_mensal").delete().neq("id", 0).execute()
    log.info("Tabelas limpas")

    carregar_supabase(client, "fato_transferencias", anual)
    carregar_supabase(client, "fato_transferencias_mensal", mensal)

    log.info("=" * 60)
    log.info("Coleta e carga concluídas!")
    log.info("=" * 60)


if __name__ == "__main__":
    main()
