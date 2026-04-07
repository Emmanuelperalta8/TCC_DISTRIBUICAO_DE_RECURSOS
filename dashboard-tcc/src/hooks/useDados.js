import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export function useDados(anoSel) {
  const [loading, setLoading]         = useState(true);
  const [anos, setAnos]               = useState([]);
  const [estados, setEstados]         = useState([]);
  const [populacao, setPopulacao]     = useState([]);
  const [historicoPop, setHistoricoPop] = useState([]);

  // Carrega anos disponíveis, estados e histórico na montagem
  useEffect(() => {
    async function init() {
      // Anos disponíveis
      const { data: anosData } = await supabase
        .from("dim_populacao")
        .select("ano")
        .order("ano");

      // Estados com nome, região e capital
      const { data: estadosData } = await supabase
        .from("dim_estado")
        .select("*")
        .order("nome_estado");

      // Histórico completo para o gráfico de linha
      const { data: histData } = await supabase
        .from("dim_populacao")
        .select("sigla_uf, ano, populacao")
        .order("ano");

      if (anosData) {
        const anosUnicos = [...new Set(anosData.map((r) => r.ano))].sort((a, b) => a - b);
        setAnos(anosUnicos);
      }

      if (estadosData) setEstados(estadosData);

      if (histData) {
        // Agrega por ano (total Brasil)
        const porAno = {};
        histData.forEach(({ ano, populacao }) => {
          if (!porAno[ano]) porAno[ano] = { ano, total: 0 };
          porAno[ano].total += Number(populacao) || 0;
        });
        setHistoricoPop(Object.values(porAno).sort((a, b) => a.ano - b.ano));
      }
    }
    init();
  }, []);

  // Carrega população do ano selecionado
  useEffect(() => {
    async function carregarPopulacao() {
      if (!anoSel) return;
      setLoading(true);

      const { data: pop } = await supabase
        .from("dim_populacao")
        .select("sigla_uf, populacao, fonte")
        .eq("ano", anoSel)
        .order("sigla_uf");

      if (pop) setPopulacao(pop);
      setLoading(false);
    }

    carregarPopulacao();
  }, [anoSel]);

  // Junta estados com população do ano selecionado
  const dadosCompletos = estados.map((estado) => {
    const pop = populacao.find((p) => p.sigla_uf === estado.sigla_uf);
    return {
      ...estado,
      populacao:  pop?.populacao || 0,
      fonte_pop:  pop?.fonte || "",
    };
  });

  // Agrupa por região
  const dadosPorRegiao = dadosCompletos.reduce((acc, estado) => {
    const reg = estado.regiao;
    if (!acc[reg]) acc[reg] = { regiao: reg, populacao: 0, qtd_estados: 0 };
    acc[reg].populacao   += estado.populacao;
    acc[reg].qtd_estados += 1;
    return acc;
  }, {});
  const regioes = Object.values(dadosPorRegiao).sort((a, b) => b.populacao - a.populacao);

  return { loading, anos, estados, populacao, dadosCompletos, regioes, historicoPop };
}