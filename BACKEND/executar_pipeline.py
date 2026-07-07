#!/usr/bin/env python3
"""
Pipeline completo: coleta → processamento → carga
Executa todos os scripts em sequência.

Uso:
  python executar_pipeline.py
"""

import logging
import subprocess
import sys
import time

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

ETAPAS = [
    ("Coletando Transferências Federais",   "coleta/coletar_transferencias.py"),
    ("Coletando Estados e População (IBGE)", "coleta/coletar_ibge.py"),
    ("Coletando Despesas Estaduais (SICONFI)", "coleta/coletar_despesas_estados.py"),
    ("ETL → Supabase",                       "ETL/etl_supabase.py"),
]


def main():
    log.info("=" * 60)
    log.info("  PIPELINE COMPLETO - TCC EMMANUEL PERALTA")
    log.info("  Dashboard de Distribuição de Recursos Federais")
    log.info("  ULBRA Palmas - Engenharia de Software")
    log.info("=" * 60)

    inicio_total = time.time()

    for i, (descricao, script) in enumerate(ETAPAS, 1):
        log.info("─" * 60)
        log.info("  Etapa %d/%d: %s", i, len(ETAPAS), descricao)
        log.info("─" * 60)

        inicio = time.time()
        resultado = subprocess.run(
            [sys.executable, script],
            capture_output=False,
        )
        elapsed = time.time() - inicio

        if resultado.returncode != 0:
            log.error("Erro na etapa %d (%s). Pipeline interrompido.", i, script)
            sys.exit(1)

        log.info("  Etapa %d concluída em %.1fs", i, elapsed)

    total = time.time() - inicio_total
    log.info("=" * 60)
    log.info("Pipeline concluído em %.1fs", total)
    log.info("Próximo passo: cd dashboard-tcc && npm install && npm run dev")
    log.info("=" * 60)


if __name__ == "__main__":
    main()
