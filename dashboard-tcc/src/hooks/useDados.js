import { useState, useEffect, useRef } from "react";
import { supabase } from "../services/supabaseClient";

export function useDados(anoSel, estadoSel = "Todos", regiaoSel = "Todas") {
  const [loading, setLoading]                 = useState(true);
  const [anos, setAnos]                       = useState([]);
  const [estados, setEstados]                 = useState([]);
  const [populacao, setPopulacao]             = useState([]);
  const [historicoRaw, setHistoricoRaw]       = useState([]);
  const [aggEstadoAnoRaw, setAggEstadoAnoRaw] = useState([]);
  const [transf, setTransf]                   = useState([]);
  const [tiposTransf, setTiposTransf]         = useState([]);

  // Ref para acessar estados dentro do effect sem criar dependência circular
  const estadosRef = useRef([]);

  // ── Dados estáticos (carregam uma vez) ──────────────────────────────────
  useEffect(() => {
    async function init() {
      const [anosRes, estadosRes, histPopRes, histTransfRes] = await Promise.all([
        supabase.from("agg_por_estado_ano").select("ano").order("ano"),
        supabase.from("dim_estado").select("*").order("nome_estado"),
        supabase.from("dim_populacao").select("sigla_uf, ano, populacao").order("ano"),
        supabase.from("agg_por_estado_ano")
          .select("ano, sigla_uf, valor_total, populacao, valor_per_capita")
          .order("ano"),
      ]);

      if (anosRes.data) {
        const anosUnicos = [...new Set(anosRes.data.map((r) => r.ano))].sort((a, b) => a - b);
        setAnos(anosUnicos);
      }
      if (estadosRes.data) {
        setEstados(estadosRes.data);
        estadosRef.current = estadosRes.data; // mantém ref sincronizado para uso no effect abaixo
      }
      if (histPopRes.data)    setHistoricoRaw(histPopRes.data);
      if (histTransfRes.data) setAggEstadoAnoRaw(histTransfRes.data);
    }
    init();
  }, []);

  // ── Dados reativos: recarregam quando ano, estado ou região mudam ───────
  useEffect(() => {
    async function carregarAno() {
      if (!anoSel) return;
      setLoading(true);

      // UFs da região selecionada — disponível via ref após init() completar
      const ufsRegiao =
        regiaoSel !== "Todas" && estadosRef.current.length
          ? estadosRef.current
              .filter((e) => e.regiao === regiaoSel)
              .map((e) => e.sigla_uf)
          : null;

      const tiposQuery = (() => {
        if (estadoSel !== "Todos") {
          // Estado específico
          return supabase
            .from("fato_transferencias")
            .select("tipo_transferencia, valor_transferido")
            .eq("ano", anoSel)
            .eq("sigla_uf", estadoSel);
        }
        if (ufsRegiao?.length) {
          // Região específica: busca todos os estados da região
          return supabase
            .from("fato_transferencias")
            .select("tipo_transferencia, valor_transferido")
            .eq("ano", anoSel)
            .in("sigla_uf", ufsRegiao);
        }
        // Nacional
        return supabase
          .from("agg_por_tipo_ano")
          .select("tipo_transferencia, valor_total")
          .eq("ano", anoSel)
          .order("valor_total", { ascending: false });
      })();

      const [popRes, transfRes, tiposRes] = await Promise.all([
        supabase.from("dim_populacao")
          .select("sigla_uf, populacao, fonte")
          .eq("ano", anoSel)
          .order("sigla_uf"),
        supabase.from("agg_por_estado_ano").select("*").eq("ano", anoSel),
        tiposQuery,
      ]);

      if (popRes.data)    setPopulacao(popRes.data);
      if (transfRes.data) setTransf(transfRes.data);

      if (tiposRes.data) {
        // Agrupa por tipo (fato_transferencias pode ter múltiplas linhas por tipo)
        const agrupado = tiposRes.data.reduce((acc, d) => {
          const tipo = d.tipo_transferencia;
          const val  = Number(d.valor_total ?? d.valor_transferido ?? 0);
          if (!acc[tipo]) acc[tipo] = { tipo_transferencia: tipo, valor_total: 0 };
          acc[tipo].valor_total += val;
          return acc;
        }, {});
        setTiposTransf(
          Object.values(agrupado).sort((a, b) => b.valor_total - a.valor_total)
        );
      }

      setLoading(false);
    }
    carregarAno();
  }, [anoSel, estadoSel, regiaoSel]); // ← regiaoSel agora é dependência

  // ── Dados completos por estado (população + transferências do ano) ───────
  const dadosCompletos = estados.map((estado) => {
    const pop = populacao.find((p) => p.sigla_uf === estado.sigla_uf);
    const t   = transf.find((t)   => t.sigla_uf === estado.sigla_uf);
    return {
      ...estado,
      populacao:        Number(pop?.populacao)      || 0,
      fonte_pop:        pop?.fonte                  || "",
      valor_total:      Number(t?.valor_total)      || 0,
      valor_per_capita: Number(t?.valor_per_capita) || 0,
    };
  });

  // ── Série histórica filtrada por estado OU região ────────────────────────
  const historicoTransf = (() => {
    let base;
    if (estadoSel !== "Todos") {
      base = aggEstadoAnoRaw.filter((d) => d.sigla_uf === estadoSel);
    } else if (regiaoSel !== "Todas") {
      const ufsSet = new Set(
        estados.filter((e) => e.regiao === regiaoSel).map((e) => e.sigla_uf)
      );
      base = aggEstadoAnoRaw.filter((d) => ufsSet.has(d.sigla_uf));
    } else {
      base = aggEstadoAnoRaw;
    }

    const porAno = {};
    base.forEach(({ ano, valor_total, populacao: pop }) => {
      if (!porAno[ano]) porAno[ano] = { ano, total: 0, populacao: 0 };
      porAno[ano].total     += Number(valor_total) || 0;
      porAno[ano].populacao += Number(pop)         || 0;
    });
    return Object.values(porAno)
      .map((d) => ({
        ano:        d.ano,
        total:      d.total,
        per_capita: d.populacao > 0 ? d.total / d.populacao : 0,
      }))
      .sort((a, b) => a.ano - b.ano);
  })();

  // ── Regiões: sempre nacional (página Por Região precisa comparar todas) ──
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

  // ── Histórico de população (referência) ─────────────────────────────────
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
