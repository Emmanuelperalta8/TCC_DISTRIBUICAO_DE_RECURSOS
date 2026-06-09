"""
Testes unitários para as funções críticas do pipeline ETL.

Autor: Emmanuel de Oliveira Peralta Duarte
TCC - Engenharia de Software - ULBRA Palmas

Executar com:
  cd BACKEND
  pytest tests/ -v
"""

import sys
import os

import pandas as pd
import pytest

# Adiciona o diretório raiz do BACKEND ao path para importações relativas
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from ETL.etl_supabase import (
    construir_dim_estado,
    construir_dim_tempo,
    construir_dim_tipo_transferencia,
    construir_fato_transferencias,
    construir_agregacoes,
)
from coleta.coletar_ibge import parsear_series
from coleta.coletar_transferencias import processar_csv


# ──────────────────────────────────────────────────────────────
# Fixtures reutilizáveis
# ──────────────────────────────────────────────────────────────

@pytest.fixture
def df_transferencias_simples():
    """Dataset mínimo de transferências para testes."""
    return pd.DataFrame({
        "ano":                [2022, 2022, 2022, 2023],
        "sigla_uf":           ["SP", "RJ", "AC", "SP"],
        "tipo_transferencia": ["FPE", "FPE", "FPE", "IPI"],
        "valor_transferido":  [1_000_000.0, 800_000.0, 200_000.0, 50_000.0],
    })


@pytest.fixture
def df_populacao_simples():
    """Dataset mínimo de população para testes."""
    return pd.DataFrame({
        "sigla_uf":  ["SP", "RJ", "AC", "SP"],
        "ano":       [2022, 2022, 2022, 2023],
        "populacao": [46_000_000, 17_000_000, 900_000, 46_500_000],
        "fonte":     ["IBGE Estimativa"] * 4,
    })


# ──────────────────────────────────────────────────────────────
# Testes: parsear_series (coleta IBGE)
# ──────────────────────────────────────────────────────────────

class TestParsearSeries:
    def test_parseia_registro_valido(self):
        dados = [{
            "resultados": [{
                "series": [{
                    "localidade": {"nome": "São Paulo"},
                    "serie": {"2022": "46649132"},
                }]
            }]
        }]
        resultado = parsear_series(dados, "IBGE Estimativa")
        assert len(resultado) == 1
        assert resultado[0]["nome_estado"] == "São Paulo"
        assert resultado[0]["ano"] == 2022
        assert resultado[0]["populacao"] == 46_649_132
        assert resultado[0]["fonte"] == "IBGE Estimativa"

    def test_ignora_valor_nao_numerico(self):
        dados = [{
            "resultados": [{
                "series": [{
                    "localidade": {"nome": "Amapá"},
                    "serie": {"2022": "..."},  # valor inválido da API IBGE
                }]
            }]
        }]
        resultado = parsear_series(dados, "IBGE Estimativa")
        assert len(resultado) == 0

    def test_processa_multiplos_anos(self):
        dados = [{
            "resultados": [{
                "series": [{
                    "localidade": {"nome": "Acre"},
                    "serie": {"2020": "881935", "2021": "898502", "2022": "906876"},
                }]
            }]
        }]
        resultado = parsear_series(dados, "IBGE Estimativa")
        assert len(resultado) == 3
        anos = [r["ano"] for r in resultado]
        assert sorted(anos) == [2020, 2021, 2022]

    def test_lista_vazia_retorna_vazio(self):
        assert parsear_series([], "fonte") == []


# ──────────────────────────────────────────────────────────────
# Testes: processar_csv (coleta Tesouro Nacional)
# ──────────────────────────────────────────────────────────────

class TestProcessarCsv:
    def _csv_base(self):
        return pd.DataFrame({
            "UF":                ["SP", "RJ", "AC"],
            "Item transferência": ["FPE", "FPE", "FPE"],
            "1º Decêndio":       [500_000.0, 400_000.0, 100_000.0],
            "2º Decêndio":       [300_000.0, 200_000.0,  50_000.0],
            "3º Decêndio":       [200_000.0, 200_000.0,  50_000.0],
        })

    def test_soma_decendios_corretamente(self):
        df = self._csv_base()
        resultado = processar_csv(df, 2022)
        sp = resultado[resultado["sigla_uf"] == "SP"]
        assert sp.iloc[0]["valor_transferido"] == pytest.approx(1_000_000.0)

    def test_exclui_ajuste_fundeb(self):
        df = self._csv_base()
        df = pd.concat([df, pd.DataFrame({
            "UF": ["SP"],
            "Item transferência": ["AJUSTE FUNDEB VAAR"],
            "1º Decêndio": [999_999.0],
            "2º Decêndio": [0.0],
            "3º Decêndio": [0.0],
        })], ignore_index=True)
        resultado = processar_csv(df, 2022)
        tipos = resultado["tipo_transferencia"].unique()
        assert "AJUSTE FUNDEB VAAR" not in tipos

    def test_exclui_estados_invalidos(self):
        df = pd.DataFrame({
            "UF": ["XX", "ZZ"],
            "Item transferência": ["FPE", "FPE"],
            "1º Decêndio": [100.0, 200.0],
            "2º Decêndio": [0.0, 0.0],
            "3º Decêndio": [0.0, 0.0],
        })
        resultado = processar_csv(df, 2022)
        assert resultado.empty

    def test_df_vazio_retorna_vazio(self):
        resultado = processar_csv(pd.DataFrame(), 2022)
        assert resultado.empty

    def test_exclui_valores_zerados(self):
        df = pd.DataFrame({
            "UF": ["SP"],
            "Item transferência": ["FPE"],
            "1º Decêndio": [0.0],
            "2º Decêndio": [0.0],
            "3º Decêndio": [0.0],
        })
        resultado = processar_csv(df, 2022)
        assert resultado.empty

    def test_detecta_valores_em_centavos(self, capsys):
        # Média > 1 bi → deve dividir por 100
        df = pd.DataFrame({
            "UF": ["SP"],
            "Item transferência": ["FPE"],
            "1º Decêndio": [500_000_000_000.0],  # 500 bi → centavos → 5 bi reais
            "2º Decêndio": [0.0],
            "3º Decêndio": [0.0],
        })
        resultado = processar_csv(df, 2022)
        assert resultado.iloc[0]["valor_transferido"] == pytest.approx(5_000_000_000.0)


# ──────────────────────────────────────────────────────────────
# Testes: construir_dim_estado
# ──────────────────────────────────────────────────────────────

class TestConstruirDimEstado:
    def test_cria_dimensao_com_colunas_corretas(self, df_transferencias_simples):
        dim = construir_dim_estado(df_transferencias_simples)
        assert set(["id_estado", "sigla_uf", "nome_estado", "regiao"]).issubset(dim.columns)

    def test_estados_unicos(self, df_transferencias_simples):
        dim = construir_dim_estado(df_transferencias_simples)
        assert dim["sigla_uf"].nunique() == dim["sigla_uf"].count()

    def test_id_estado_sequencial(self, df_transferencias_simples):
        dim = construir_dim_estado(df_transferencias_simples)
        assert dim["id_estado"].min() == 1
        assert dim["id_estado"].max() == len(dim)

    def test_regiao_preenchida(self, df_transferencias_simples):
        dim = construir_dim_estado(df_transferencias_simples)
        assert dim["regiao"].notna().all()
        assert (dim["regiao"] != "Desconhecida").all()


# ──────────────────────────────────────────────────────────────
# Testes: construir_dim_tempo
# ──────────────────────────────────────────────────────────────

class TestConstruirDimTempo:
    def test_cria_dimensao_com_colunas_corretas(self):
        dim = construir_dim_tempo([2016, 2020, 2023])
        assert set(["id_tempo", "ano", "decada", "periodo_presidencial"]).issubset(dim.columns)

    def test_anos_corretos(self):
        anos = [2018, 2022, 2024]
        dim = construir_dim_tempo(anos)
        assert sorted(dim["ano"].tolist()) == sorted(anos)

    def test_periodos_presidenciais_conhecidos(self):
        dim = construir_dim_tempo([2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024])
        periodos = set(dim["periodo_presidencial"].tolist())
        assert periodos.issubset({"Temer", "Bolsonaro", "Lula III", "FHC", "Lula I/II", "Dilma I", "Dilma II"})

    def test_decada_formato_correto(self):
        dim = construir_dim_tempo([2016, 2022])
        assert all(d.endswith("s") for d in dim["decada"])
        assert "2010s" in dim["decada"].values
        assert "2020s" in dim["decada"].values


# ──────────────────────────────────────────────────────────────
# Testes: construir_fato_transferencias
# ──────────────────────────────────────────────────────────────

class TestConstruirFatoTransferencias:
    def _montar_dims(self, df_transf, df_pop):
        dim_estado = construir_dim_estado(df_transf)
        dim_tempo  = construir_dim_tempo(df_transf["ano"].unique().tolist())
        dim_tipo   = construir_dim_tipo_transferencia(df_transf)
        return dim_estado, dim_tempo, dim_tipo

    def test_calcula_per_capita_correto(self, df_transferencias_simples, df_populacao_simples):
        dim_e, dim_t, dim_tp = self._montar_dims(df_transferencias_simples, df_populacao_simples)
        fato = construir_fato_transferencias(
            df_transferencias_simples, df_populacao_simples, dim_e, dim_t, dim_tp
        )
        sp = fato[(fato["sigla_uf"] == "SP") & (fato["ano"] == 2022)]
        esperado = round(1_000_000.0 / 46_000_000, 2)
        assert sp.iloc[0]["valor_per_capita"] == pytest.approx(esperado, abs=0.01)

    def test_per_capita_zero_para_populacao_zero(self, df_transferencias_simples):
        df_pop_sem = pd.DataFrame({
            "sigla_uf":  ["SP", "RJ", "AC", "SP"],
            "ano":       [2022, 2022, 2022, 2023],
            "populacao": [0, 0, 0, 0],
        })
        dim_e, dim_t, dim_tp = self._montar_dims(df_transferencias_simples, df_pop_sem)
        fato = construir_fato_transferencias(
            df_transferencias_simples, df_pop_sem, dim_e, dim_t, dim_tp
        )
        assert (fato["valor_per_capita"] == 0).all()

    def test_colunas_obrigatorias_presentes(self, df_transferencias_simples, df_populacao_simples):
        dim_e, dim_t, dim_tp = self._montar_dims(df_transferencias_simples, df_populacao_simples)
        fato = construir_fato_transferencias(
            df_transferencias_simples, df_populacao_simples, dim_e, dim_t, dim_tp
        )
        obrigatorias = ["id_estado", "id_tempo", "id_tipo", "sigla_uf", "ano",
                        "tipo_transferencia", "valor_transferido", "populacao", "valor_per_capita"]
        for col in obrigatorias:
            assert col in fato.columns, f"Coluna ausente: {col}"

    def test_sem_nan_em_ids(self, df_transferencias_simples, df_populacao_simples):
        dim_e, dim_t, dim_tp = self._montar_dims(df_transferencias_simples, df_populacao_simples)
        fato = construir_fato_transferencias(
            df_transferencias_simples, df_populacao_simples, dim_e, dim_t, dim_tp
        )
        assert fato["id_estado"].notna().all()
        assert fato["id_tempo"].notna().all()
        assert fato["id_tipo"].notna().all()


# ──────────────────────────────────────────────────────────────
# Testes: construir_agregacoes
# ──────────────────────────────────────────────────────────────

class TestConstruirAgregacoes:
    def _fato_minimo(self):
        df_transf = pd.DataFrame({
            "ano":                [2022, 2022, 2022, 2022],
            "sigla_uf":           ["SP", "RJ", "AC", "SP"],
            "tipo_transferencia": ["FPE", "FPE", "FPE", "IPI"],
            "valor_transferido":  [1_000_000.0, 800_000.0, 200_000.0, 50_000.0],
        })
        df_pop = pd.DataFrame({
            "sigla_uf":  ["SP", "RJ", "AC"],
            "ano":       [2022, 2022, 2022],
            "populacao": [46_000_000, 17_000_000, 900_000],
        })
        dim_e  = construir_dim_estado(df_transf)
        dim_t  = construir_dim_tempo([2022])
        dim_tp = construir_dim_tipo_transferencia(df_transf)
        return construir_fato_transferencias(df_transf, df_pop, dim_e, dim_t, dim_tp)

    def test_retorna_chaves_esperadas(self):
        fato = self._fato_minimo()
        agg = construir_agregacoes(fato)
        assert "por_estado_ano" in agg
        assert "por_regiao_ano" in agg
        assert "por_tipo_ano" in agg

    def test_por_estado_ano_agrupa_tipos(self):
        fato = self._fato_minimo()
        agg = construir_agregacoes(fato)
        sp_2022 = agg["por_estado_ano"][
            (agg["por_estado_ano"]["sigla_uf"] == "SP") &
            (agg["por_estado_ano"]["ano"] == 2022)
        ]
        # SP tem FPE=1M e IPI=50K → total=1.05M
        assert sp_2022.iloc[0]["valor_total"] == pytest.approx(1_050_000.0)

    def test_per_capita_positivo_para_estados_com_populacao(self):
        fato = self._fato_minimo()
        agg = construir_agregacoes(fato)
        validos = agg["por_estado_ano"][agg["por_estado_ano"]["populacao"] > 0]
        assert (validos["valor_per_capita"] > 0).all()

    def test_por_regiao_ano_sem_nan(self):
        fato = self._fato_minimo()
        agg = construir_agregacoes(fato)
        assert agg["por_regiao_ano"]["regiao"].notna().all()
        assert agg["por_regiao_ano"]["valor_total"].notna().all()
