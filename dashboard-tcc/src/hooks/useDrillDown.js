import { useState, useCallback } from "react";
import { supabase } from "../services/supabaseClient";
import { MESES } from "../utils/meses";

// Meses sem linha na consulta ficam null (não 0) — a fonte oficial não
// publicou o dado, e 0 sugeriria que o estado não recebeu nada no mês.
function montarSerieMensal(valoresPorMes) {
  return MESES.map(({ value: mes, label: mesLabel }) => ({
    mes,
    mesLabel,
    valor: valoresPorMes.has(mes) ? valoresPorMes.get(mes) : null,
  }));
}

/**
 * Buscas sob demanda para os drill-downs dos gráficos de Região e Tipos de
 * Repasse. Só disparam quando o usuário clica em algo (não no mount), para
 * não pesar a carga inicial do dashboard. Resultados ficam em cache por
 * chave (ano + escopo) para não refazer a mesma consulta ao reabrir.
 */
export function useDrillDown() {
  const [cacheTipos, setCacheTipos] = useState({});
  const [cacheMensal, setCacheMensal] = useState({});
  const [error, setError] = useState(null);

  const buscarTiposPorEstado = useCallback(async (sigla_uf, ano, mes = null) => {
    const chave = `${ano}-${mes ?? "todos"}-${sigla_uf}`;
    if (cacheTipos[chave]) return cacheTipos[chave];

    setError(null);
    try {
      const query = mes
        ? supabase
            .from("fato_transferencias_mensal")
            .select("tipo_transferencia, valor_transferido")
            .eq("ano", ano)
            .eq("mes", mes)
            .eq("sigla_uf", sigla_uf)
        : supabase
            .from("fato_transferencias")
            .select("tipo_transferencia, valor_transferido")
            .eq("ano", ano)
            .eq("sigla_uf", sigla_uf);
      const { data, error: err } = await query;
      if (err) throw new Error(err.message);

      const agrupado = (data || []).reduce((acc, d) => {
        const tipo = d.tipo_transferencia;
        if (!acc[tipo]) acc[tipo] = { tipo_transferencia: tipo, valor_total: 0 };
        acc[tipo].valor_total += Number(d.valor_transferido) || 0;
        return acc;
      }, {});
      const resultado = Object.values(agrupado).sort((a, b) => b.valor_total - a.valor_total);

      setCacheTipos((prev) => ({ ...prev, [chave]: resultado }));
      return resultado;
    } catch (err) {
      setError(err.message || "Erro ao buscar tipos de transferência do estado.");
      return [];
    }
  }, [cacheTipos]);

  const buscarMensalPorTipo = useCallback(async (tipo_transferencia, ano, { sigla_uf = null, ufsRegiao = null } = {}) => {
    const escopo = sigla_uf ? `uf:${sigla_uf}` : ufsRegiao?.length ? `reg:${ufsRegiao.join(",")}` : "br";
    const chave = `${ano}-${tipo_transferencia}-${escopo}`;
    if (cacheMensal[chave]) return cacheMensal[chave];

    setError(null);
    try {
      let linhas = [];
      if (sigla_uf) {
        const { data, error: err } = await supabase
          .from("fato_transferencias_mensal")
          .select("mes, valor_transferido")
          .eq("ano", ano)
          .eq("tipo_transferencia", tipo_transferencia)
          .eq("sigla_uf", sigla_uf);
        if (err) throw new Error(err.message);
        linhas = data || [];
      } else if (ufsRegiao?.length) {
        const { data, error: err } = await supabase
          .from("fato_transferencias_mensal")
          .select("mes, valor_transferido")
          .eq("ano", ano)
          .eq("tipo_transferencia", tipo_transferencia)
          .in("sigla_uf", ufsRegiao);
        if (err) throw new Error(err.message);
        linhas = data || [];
      } else {
        const { data, error: err } = await supabase
          .from("agg_por_tipo_mes")
          .select("mes, valor_total")
          .eq("ano", ano)
          .eq("tipo_transferencia", tipo_transferencia);
        if (err) throw new Error(err.message);
        linhas = (data || []).map((d) => ({ mes: d.mes, valor_transferido: d.valor_total }));
      }

      const valoresPorMes = new Map();
      linhas.forEach(({ mes, valor_transferido }) => {
        valoresPorMes.set(mes, (valoresPorMes.get(mes) || 0) + (Number(valor_transferido) || 0));
      });

      const resultado = montarSerieMensal(valoresPorMes);
      setCacheMensal((prev) => ({ ...prev, [chave]: resultado }));
      return resultado;
    } catch (err) {
      setError(err.message || "Erro ao buscar série mensal.");
      return [];
    }
  }, [cacheMensal]);

  return { error, buscarTiposPorEstado, buscarMensalPorTipo };
}
