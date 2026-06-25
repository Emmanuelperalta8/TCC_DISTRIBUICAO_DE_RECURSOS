import { useState, useEffect, useRef } from "react";
import { supabase } from "../services/supabaseClient";
import { MESES } from "../utils/meses";

export function useDados(anoSel, estadoSel = "Todos", regiaoSel = "Todas", mesSel = null) {
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [anos, setAnos]                       = useState([]);
  const [estados, setEstados]                 = useState([]);
  const [populacao, setPopulacao]             = useState([]);
  const [historicoRaw, setHistoricoRaw]       = useState([]);
  const [aggEstadoAnoRaw, setAggEstadoAnoRaw] = useState([]);
  const [transf, setTransf]                   = useState([]);
  const [tiposTransf, setTiposTransf]         = useState([]);
  const [aggEstadoMesAno, setAggEstadoMesAno] = useState([]);

  // Ref para acessar estados dentro do effect sem criar dependência circular
  const estadosRef = useRef([]);

  // ── Dados estáticos (carregam uma vez) ──────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const [anosRes, estadosRes, histPopRes, histTransfRes] = await Promise.all([
          supabase.from("agg_por_estado_ano").select("ano").order("ano"),
          supabase.from("dim_estado").select("*").order("nome_estado"),
          supabase.from("dim_populacao").select("sigla_uf, ano, populacao").order("ano"),
          supabase.from("agg_por_estado_ano")
            .select("ano, sigla_uf, valor_total, populacao, valor_per_capita")
            .order("ano"),
        ]);

        const erros = [anosRes, estadosRes, histPopRes, histTransfRes]
          .map((r) => r.error)
          .filter(Boolean);
        if (erros.length) {
          throw new Error(`Erro ao carregar dados estáticos: ${erros[0].message}`);
        }

        if (anosRes.data) {
          const anosUnicos = [...new Set(anosRes.data.map((r) => r.ano))].sort((a, b) => a - b);
          setAnos(anosUnicos);
        }
        if (estadosRes.data) {
          setEstados(estadosRes.data);
          estadosRef.current = estadosRes.data;
        }
        if (histPopRes.data)    setHistoricoRaw(histPopRes.data);
        if (histTransfRes.data) setAggEstadoAnoRaw(histTransfRes.data);
      } catch (err) {
        setError(err.message || "Falha ao conectar com o banco de dados.");
      }
    }
    init();
  }, []);

  // ── Dados reativos: recarregam quando ano, estado, região ou mês mudam ──
  useEffect(() => {
    async function carregarAno() {
      if (!anoSel) return;
      setLoading(true);
      setError(null);

      try {
        const ufsRegiao =
          regiaoSel !== "Todas" && estadosRef.current.length
            ? estadosRef.current
                .filter((e) => e.regiao === regiaoSel)
                .map((e) => e.sigla_uf)
            : null;

        // Total por estado: anual (agg_por_estado_ano) ou de um mês específico
        // (agg_por_estado_mes — não traz população/per capita pronto, calculamos abaixo).
        const transfQuery = mesSel
          ? supabase.from("agg_por_estado_mes")
              .select("ano, sigla_uf, regiao, valor_total")
              .eq("ano", anoSel)
              .eq("mes", mesSel)
          : supabase.from("agg_por_estado_ano").select("*").eq("ano", anoSel);

        // Tipos de transferência: troca a tabela/visão de acordo com o escopo
        // (estado / região / nacional) e com o mês, quando selecionado.
        const tiposQuery = (() => {
          if (estadoSel !== "Todos") {
            return mesSel
              ? supabase.from("fato_transferencias_mensal")
                  .select("tipo_transferencia, valor_transferido")
                  .eq("ano", anoSel).eq("mes", mesSel).eq("sigla_uf", estadoSel)
              : supabase.from("fato_transferencias")
                  .select("tipo_transferencia, valor_transferido")
                  .eq("ano", anoSel).eq("sigla_uf", estadoSel);
          }
          if (ufsRegiao?.length) {
            return mesSel
              ? supabase.from("fato_transferencias_mensal")
                  .select("tipo_transferencia, valor_transferido")
                  .eq("ano", anoSel).eq("mes", mesSel).in("sigla_uf", ufsRegiao)
              : supabase.from("fato_transferencias")
                  .select("tipo_transferencia, valor_transferido")
                  .eq("ano", anoSel).in("sigla_uf", ufsRegiao);
          }
          return mesSel
            ? supabase.from("agg_por_tipo_mes")
                .select("tipo_transferencia, valor_total")
                .eq("ano", anoSel).eq("mes", mesSel)
                .order("valor_total", { ascending: false })
            : supabase.from("agg_por_tipo_ano")
                .select("tipo_transferencia, valor_total")
                .eq("ano", anoSel)
                .order("valor_total", { ascending: false });
        })();

        // Quando há mês selecionado, busca também todos os meses do ano (para
        // o gráfico de evolução mostrar Jan–Dez em vez de ano a ano).
        const mensalAnoQuery = mesSel
          ? supabase.from("agg_por_estado_mes")
              .select("ano, mes, sigla_uf, regiao, valor_total")
              .eq("ano", anoSel)
          : Promise.resolve({ data: null, error: null });

        const [popRes, transfRes, tiposRes, mensalAnoRes] = await Promise.all([
          supabase.from("dim_populacao")
            .select("sigla_uf, populacao, fonte")
            .eq("ano", anoSel)
            .order("sigla_uf"),
          transfQuery,
          tiposQuery,
          mensalAnoQuery,
        ]);

        if (popRes.error)    throw new Error(`População: ${popRes.error.message}`);
        if (transfRes.error) throw new Error(`Transferências: ${transfRes.error.message}`);
        if (tiposRes.error)  throw new Error(`Tipos: ${tiposRes.error.message}`);

        if (popRes.data)    setPopulacao(popRes.data);
        if (transfRes.data) setTransf(transfRes.data);
        setAggEstadoMesAno(mensalAnoRes.data || []);

        if (tiposRes.data) {
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
      } catch (err) {
        setError(err.message || "Erro ao carregar dados do período selecionado.");
      } finally {
        setLoading(false);
      }
    }
    carregarAno();
  }, [anoSel, estadoSel, regiaoSel, mesSel]);

  // ── Dados completos por estado (população + transferências do período) ──
  const dadosCompletos = estados.map((estado) => {
    const pop = populacao.find((p) => p.sigla_uf === estado.sigla_uf);
    const t   = transf.find((t)   => t.sigla_uf === estado.sigla_uf);
    const pop_n = Number(pop?.populacao) || 0;
    const transf_n = Number(t?.valor_total) || 0;
    return {
      ...estado,
      populacao:             pop_n,
      fonte_pop:             pop?.fonte || "",
      valor_total:           transf_n,
      valor_per_capita:      pop_n > 0 ? transf_n / pop_n : 0,
    };
  });

  // ── Série histórica filtrada por estado OU região ────────────────────────
  // Sem mês selecionado: evolução ano a ano (todo o histórico).
  // Com mês selecionado: evolução mês a mês dentro do ano selecionado.
  const historicoTransf = mesSel
    ? (() => {
        let base = aggEstadoMesAno;
        if (estadoSel !== "Todos") {
          base = base.filter((d) => d.sigla_uf === estadoSel);
        } else if (regiaoSel !== "Todas") {
          base = base.filter((d) => d.regiao === regiaoSel);
        }

        const porMes = {};
        base.forEach(({ mes, valor_total }) => {
          porMes[mes] = (porMes[mes] || 0) + (Number(valor_total) || 0);
        });

        // Meses sem nenhuma linha na consulta ficam null (não 0) — ausência de
        // dado publicado, não estado recebendo zero.
        return MESES.map(({ value: mes, label }) => ({
          ano: label,
          total: mes in porMes ? porMes[mes] : null,
        }));
      })()
    : (() => {
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
    loading, error, anos, estados, populacao,
    dadosCompletos, regioes,
    historicoPop, historicoTransf,
    tiposTransf,
  };
}
