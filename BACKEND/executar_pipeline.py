#!/usr/bin/env python3
"""
Pipeline completo: coleta → processamento → carga
Executa todos os scripts em sequência.

Uso:
  python executar_pipeline.py
"""

import subprocess
import sys
import time

ETAPAS = [
    ("Coletando Transferências Federais", "coletar_transferencias.py"),
    ("Coletando População (IBGE)",         "coletar_populacao_ibge.py"),
    ("ETL → Supabase",                     "etl_supabase.py"),
]

def main():
    print("\n" + "=" * 60)
    print("  PIPELINE COMPLETO - TCC EMMANUEL PERALTA")
    print("  Dashboard de Distribuição de Recursos Federais")
    print("  ULBRA Palmas - Engenharia de Software")
    print("=" * 60 + "\n")

    inicio_total = time.time()

    for i, (descricao, script) in enumerate(ETAPAS, 1):
        print(f"\n{'─'*60}")
        print(f"  Etapa {i}/{len(ETAPAS)}: {descricao}")
        print(f"{'─'*60}\n")

        inicio = time.time()
        resultado = subprocess.run(
            [sys.executable, script],
            capture_output=False,
        )
        elapsed = time.time() - inicio

        if resultado.returncode != 0:
            print(f"\n✗ Erro na etapa {i}. Pipeline interrompido.")
            sys.exit(1)

        print(f"\n  ⏱ Tempo: {elapsed:.1f}s")

    total = time.time() - inicio_total
    print(f"\n{'='*60}")
    print(f"✓ Pipeline concluído em {total:.1f}s")
    print(f"\nPróximo passo: iniciar o dashboard React")
    print(f"  cd dashboard && npm install && npm start")
    print("=" * 60)


if __name__ == "__main__":
    main()
