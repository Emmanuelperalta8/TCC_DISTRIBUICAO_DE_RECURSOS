#!/usr/bin/env python3
"""
Upload de dados mensais para o Supabase
Valida e insere dados brutos mensais na tabela fact_transferencias_raw

Uso:
  python upload_dados_mensais.py <arquivo_csv>
  python upload_dados_mensais.py dados_junho_2026.csv
"""

import argparse
import csv
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

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

UFS_VALIDAS = {
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
}

TIPOS_TRANSFERENCIA = {
    "FPE", "FPM", "IPI-EXP", "ICMS", "IRRF", "CIDE", "BRDE", "SUDENE", "SUDAM", "FCO"
}


def _supabase_client():
    from supabase import create_client
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("Configure SUPABASE_URL e SUPABASE_SERVICE_KEY no .env")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def validar_csv(df: pd.DataFrame) -> tuple[bool, list]:
    """Valida colunas e tipos do CSV"""
    erros = []

    colunas_esperadas = {"mes", "sigla_uf", "tipo_transferencia", "valor_transferido"}
    colunas_faltantes = colunas_esperadas - set(df.columns)
    if colunas_faltantes:
        erros.append(f"Colunas faltantes: {colunas_faltantes}")
        return False, erros

    for idx, row in df.iterrows():
        linha = idx + 2  # +2 porque linha 1 é header e índice é 0-based

        try:
            mes = pd.to_datetime(row["mes"])
        except:
            erros.append(f"Linha {linha}: 'mes' inválida: {row['mes']}")
            continue

        uf = str(row["sigla_uf"]).upper().strip()
        if uf not in UFS_VALIDAS:
            erros.append(f"Linha {linha}: UF inválida: {uf}")

        tipo = str(row["tipo_transferencia"]).upper().strip()
        if tipo not in TIPOS_TRANSFERENCIA:
            erros.append(f"Linha {linha}: tipo_transferencia inválida: {tipo}")

        try:
            valor = float(row["valor_transferido"])
            if valor < 0:
                erros.append(f"Linha {linha}: valor_transferido negativo: {valor}")
        except:
            erros.append(f"Linha {linha}: valor_transferido inválido: {row['valor_transferido']}")

    return len(erros) == 0, erros


def inserir_raw(arquivo: str) -> int:
    """Lê CSV e insere na tabela fact_transferencias_raw"""
    log.info("=" * 60)
    log.info("  UPLOAD DE DADOS MENSAIS")
    log.info("=" * 60)

    if not os.path.exists(arquivo):
        log.error("Arquivo não encontrado: %s", arquivo)
        return 1

    log.info("Lendo %s...", arquivo)
    df = pd.read_csv(arquivo)

    log.info("Validando dados...")
    valido, erros = validar_csv(df)

    if not valido:
        log.error("Validação falhou com %d erro(s):", len(erros))
        for erro in erros[:10]:  # mostra apenas primeiros 10
            log.error("  - %s", erro)
        if len(erros) > 10:
            log.error("  ... e mais %d erro(s)", len(erros) - 10)
        return 1

    log.info("✓ Validação OK (%d registros)", len(df))

    # Preparar dados para inserção
    dados_inserir = []
    for _, row in df.iterrows():
        mes = pd.to_datetime(row["mes"]).date()
        dados_inserir.append({
            "mes_referencia": str(mes),
            "sigla_uf": str(row["sigla_uf"]).upper().strip(),
            "tipo_transferencia": str(row["tipo_transferencia"]).upper().strip(),
            "valor_transferido": float(row["valor_transferido"]),
            "status_validacao": "pendente",
            "mensagem_erro": None,
        })

    # Inserir no Supabase
    log.info("Conectando ao Supabase...")
    client = _supabase_client()

    log.info("Inserindo %d registros em fact_transferencias_raw...", len(dados_inserir))
    try:
        response = client.table("fact_transferencias_raw").insert(dados_inserir).execute()
        log.info("✅ %d registros inseridos com sucesso", len(dados_inserir))
    except Exception as e:
        log.error("❌ Erro ao inserir: %s", str(e))
        return 1

    log.info("=" * 60)
    log.info("Próximo passo: python pipeline_mensal.py")
    log.info("=" * 60)

    return 0


def main():
    parser = argparse.ArgumentParser(
        description="Upload de dados mensais para o Supabase"
    )
    parser.add_argument("arquivo", help="Arquivo CSV a fazer upload")
    args = parser.parse_args()

    return inserir_raw(args.arquivo)


if __name__ == "__main__":
    sys.exit(main())
