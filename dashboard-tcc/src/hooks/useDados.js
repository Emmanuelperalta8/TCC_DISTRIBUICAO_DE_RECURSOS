import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export function useDados(anoSel, estadoSel = "Todos") {
  const [loading, setLoading]               = useState(true);
  const [anos, setAnos]                     = useState([]);
  const [estados, setEstados]               = useState([]);
  const [populacao, setPopulacao]           = useState([]);
  const [historicoRaw, setHistoricoRaw]     = useState([]);
  const [aggEstadoAnoRaw, setAggEstadoAnoRaw] = useState([]);
  const [transf, setTransf]                 = useState([]);
  const [tiposTransf, setTiposTransf]       = useState([]);

  // Dados estáticos (carregam uma vez)
  useEffect(() => {
    async function init() {
      const [anosRes, estadosRes, histPopRes, histTransfRes] = await Promise.all([
        supabase.from("agg_por_estado_ano").select("ano").order("ano"),
        supabase.from("dim_estado").select("*").order("nome_estado"),
        supabase.from("dim_populacao").select("sigla_uf, ano, populacao").order("ano"),
        supabase.from("agg_por_estado_ano").select("ano, sigla_uf, valor_total, populacao, valor_per_capita").order("ano"),
      ]);

      if (anosRes.data) {
        const anosUnicos = [...new Set(anosRes.data.map((r) => r.ano))].sort((a, b) => a - b);
        setAnos(anosUnicos);
      }
      if (estadosRes.data)    setEstados(estadosRes.data);
      if (histPopRes.data)    setHistoricoRaw(histPopRes.data);
      if (histTransfRes.data) setAggEstadoAnoRaw(histTransfRes.data);
    }
    init();
  }, []);

  // Dados do ano/estado selecionado
  useEffect(() => {
    async function carregarAno() {
      if (!anoSel) return;
      setLoading(true);

      const tiposQuery = estadoSel === "Todos"
        ? supabase.from("agg_por_tipo_ano").select("tipo_transferencia, valor_total").eq("ano", anoSel).order("valor_total", { ascending: false })
        : supabase.from("fato_transferencias").select("tipo_transferencia, valor_transferido").eq("ano", anoSel).eq("sigla_uf", estadoSel);

      const [popRes, transfRes, tiposRes] = await Promise.all([
        supabase.from("dim_populacao").select("sigla_uf, populacao, fonte").eq("ano", anoSel).order("sigla_uf"),
        supabase.from("agg_por_estado_ano").select("*").eq("ano", anoSel),
        tiposQuery,
      ]);

      if (popRes.data)    setPopulacao(popRes.data);
      if (transfRes.data) setTransf(transfRes.data);

      if (tiposRes.data) {
        const normalizado = tiposRes.data
          .map((d) => ({
            tipo_transferencia: d.tipo_transferencia,
            valor_total: Number(d.valor_total ?? d.valor_transferido ?? 0),
          }))
          .sort((a, b) => b.valor_total - a.valor_total);
        setTiposTransf(normalizado);
      }

      setLoading(false);
    }
    carregarAno();
  }, [anoSel, estadoSel]);

  // Dados completos por estado (população + transferências)
  const dadosCompletos = estados.map((estado) => {
    const pop = populacao.find((p) => p.sigla_uf === estado.sigla_uf);
    const t   = transf.find((t) => t.sigla_uf === estado.sigla_uf);
    return {
      ...estado,
      populacao:        Number(pop?.populacao)      || 0,
      fonte_pop:        pop?.fonte                  || "",
      valor_total:      Number(t?.valor_total)      || 0,
      valor_per_capita: Number(t?.valor_per_capita) || 0,
    };
  });

  // Série histórica de transferências (nacional ou por estado)
  const historicoTransf = (() => {
    const base = estadoSel === "Todos"
      ? aggEstadoAnoRaw
      : aggEstadoAnoRaw.filter((d) => d.sigla_uf === estadoSel);
    const porAno = {};
    base.forEach(({ ano, valor_total, populacao: pop }) => {
      if (!porAno[ano]) porAno[ano] = { ano, total: 0, populacao: 0 };
      porAno[ano].total      += Number(valor_total) || 0;
      porAno[ano].populacao  += Number(pop)         || 0;
    });
    return Object.values(porAno)
      .map((d) => ({
        ano:       d.ano,
        total:     d.total,
        per_capita: d.populacao > 0 ? d.total / d.populacao : 0,
      }))
      .sort((a, b) => a.ano - b.ano);
  })();

  // Regiões com população E transferências agregadas
  const regioes = Object.values(
    dadosCompletos.reduce((acc, estado) => {
      const reg = estado.regiao;
      if (!acc[reg]) acc[reg] = { regiao: reg, populacao: 0, valor_total: 0, qtd_estados: 0 };
      acc[reg].populacao   += estado.populacao;
      acc[reg].valor_total += estado.valor_total;
      acc[reg].qtd_estados += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.valor_total - a.valor_total);

  // Histórico de população (para referência)
  const historicoPop = (() => {
    if (estadoSel === "Todos") {
      const porAno = {};
      historicoRaw.forEach(({ ano, populacao }) => {
        if (!porAno[ano]) porAno[ano] = { ano, total: 0 };
        porAno[ano].total += Number(populacao) || 0;
      });
      return Object.values(porAno).sort((a, b) => a.ano - b.ano);
    }
    return historicoRaw
      .filter((d) => d.sigla_uf === estadoSel)
      .map((d) => ({ ano: d.ano, total: Number(d.populacao) }))
      .sort((a, b) => a.ano - b.ano);
  })();

  return {
    loading, anos, estados, populacao,
    dadosCompletos, regioes,
    historicoPop, historicoTransf,
    tiposTransf,
  };
}
