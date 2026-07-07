import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  ReferenceLine,
} from "recharts";
import { useFormato } from "../contexts/FormatoContext";
import { fmtBRL, fmtPerCapita, fmtPop } from "../utils/fmt";
import { nomeMes } from "../utils/meses";
import { useDrillDown } from "../hooks/useDrillDown";

const CORES = {
  Norte:          "#0077B6",
  Nordeste:       "#C96A00",
  Sudeste:        "#4338CA",
  Sul:            "#7C3AED",
  "Centro-Oeste": "#C2410C",
};

function TooltipTotal({ active, payload }) {
  const { detalhe } = useFormato();
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="tt">
      <div className="tt-label">{d.regiao}</div>
      <div className="tt-value">{fmtBRL(d.valor_total, detalhe)}</div>
      <div className="tt-detail">{d.pct.toFixed(1)}% do total nacional</div>
      {d.populacao > 0 && (
        <div className="tt-detail">{fmtPop(d.populacao, detalhe)}</div>
      )}
      {d.valor_per_capita > 0 && (
        <div className="tt-detail">Per capita: {fmtPerCapita(d.valor_per_capita)}</div>
      )}
    </div>
  );
}

function TooltipPerCapita({ active, payload, mediaGeral }) {
  const { detalhe } = useFormato();
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const desvio = mediaGeral > 0
    ? ((d.valor_per_capita - mediaGeral) / mediaGeral) * 100
    : null;
  return (
    <div className="tt">
      <div className="tt-label">{d.regiao}</div>
      <div className="tt-value">{fmtPerCapita(d.valor_per_capita)}</div>
      {d.populacao > 0 && (
        <div className="tt-detail">{fmtPop(d.populacao, detalhe)}</div>
      )}
      {desvio !== null && (
        <div
          className="tt-detail"
          style={{ color: desvio >= 0 ? "#166534" : "#991B1B", marginTop: 4 }}
        >
          {desvio >= 0 ? "▲" : "▼"}{" "}
          {Math.abs(desvio).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%{" "}
          {desvio >= 0 ? "acima" : "abaixo"} da média nacional
        </div>
      )}
    </div>
  );
}

// Lista horizontal de barras simples, usada para os dois níveis de
// drill-down (estados de uma região / tipos de repasse de um estado).
function ListaDrillDown({ titulo, itens, valorKey, labelKey, corPorItem, onItemClick, itemAtivo }) {
  const { detalhe } = useFormato();
  const max = Math.max(...itens.map((i) => i[valorKey] || 0), 1);
  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
        color: "var(--text-3)", marginBottom: 8, textTransform: "uppercase",
      }}>
        {titulo}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {itens.map((item) => {
          const chave = item[labelKey];
          const ativo = itemAtivo === chave;
          return (
            <button
              key={chave}
              onClick={() => onItemClick?.(item)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: ativo ? "var(--surface-2)" : "transparent",
                border: `1px solid ${ativo ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 6, padding: "6px 10px", width: "100%",
                textAlign: "left", cursor: onItemClick ? "pointer" : "default",
                font: "inherit",
              }}
            >
              <span
                title={chave}
                style={{
                  width: 120, fontSize: 12, fontWeight: 700, color: "var(--text)", flexShrink: 0,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}
              >
                {chave}
              </span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--surface-2)", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${((item[valorKey] || 0) / max) * 100}%`,
                  background: corPorItem ? corPorItem(item) : "var(--accent)",
                }} />
              </div>
              <span style={{
                fontSize: 11, color: "var(--text-2)", flexShrink: 0, minWidth: 64,
                textAlign: "right", whiteSpace: "nowrap",
              }}>
                {fmtBRL(item[valorKey], detalhe)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function GraficoRegioes({ regioes, anoSel, mesSel = null, height = 230, dadosNacionais = [] }) {
  const [vista, setVista] = useState("total");
  const [regiaoAberta, setRegiaoAberta] = useState(null);
  const [estadoAberto, setEstadoAberto] = useState(null);
  const [tiposEstado, setTiposEstado] = useState(null);
  const [loadingTipos, setLoadingTipos] = useState(false);

  const { buscarTiposPorEstado } = useDrillDown();

  const periodo = mesSel ? `${nomeMes(mesSel)}/${anoSel}` : anoSel;

  // Trocar ano ou mês invalida qualquer drill-down aberto (os dados seriam de outro período).
  useEffect(() => {
    setRegiaoAberta(null);
    setEstadoAberto(null);
    setTiposEstado(null);
  }, [anoSel, mesSel]);

  const podeDetalhar = dadosNacionais.length > 0;

  function handleClickRegiao(regiao) {
    if (!podeDetalhar) return;
    setEstadoAberto(null);
    setTiposEstado(null);
    setRegiaoAberta((atual) => (atual === regiao ? null : regiao));
  }

  async function handleClickEstado(sigla_uf) {
    if (estadoAberto === sigla_uf) {
      setEstadoAberto(null);
      setTiposEstado(null);
      return;
    }
    setEstadoAberto(sigla_uf);
    setTiposEstado(null);
    setLoadingTipos(true);
    const dados = await buscarTiposPorEstado(sigla_uf, anoSel, mesSel);
    setTiposEstado(dados);
    setLoadingTipos(false);
  }

  const totalGeral = regioes.reduce((s, r) => s + (r.valor_total || 0), 0);
  const popGeral   = regioes.reduce((s, r) => s + (r.populacao  || 0), 0);
  const mediaGeral = popGeral > 0 ? totalGeral / popGeral : 0;

  const dados = regioes
    .filter((r) => r.valor_total > 0)
    .map((r) => ({
      ...r,
      valor_per_capita: r.populacao > 0 ? r.valor_total / r.populacao : 0,
      pct: totalGeral > 0 ? (r.valor_total / totalGeral) * 100 : 0,
    }))
    .sort((a, b) =>
      vista === "total"
        ? b.valor_total - a.valor_total
        : b.valor_per_capita - a.valor_per_capita
    );

  const estadosDaRegiao = regiaoAberta
    ? dadosNacionais
        .filter((e) => e.regiao === regiaoAberta && e.valor_total > 0)
        .map((e) => ({ sigla_uf: e.sigla_uf, valor_total: e.valor_total }))
        .sort((a, b) => b.valor_total - a.valor_total)
    : [];

  const tiposDoEstado = (tiposEstado || [])
    .filter((t) => t.valor_total > 0)
    .slice(0, 8)
    .map((t) => ({ tipo_transferencia: t.tipo_transferencia, valor_total: t.valor_total }));

  if (!dados.length) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">Transferências por região</div>
          <div className="card-sub">Participação no total nacional · {periodo}</div>
        </div>
        <div className="empty-state">Sem dados disponíveis</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="card-title">Transferências por região</div>
          <div className="card-sub">
            {vista === "total"
              ? `Participação de cada região no total transferido · ${periodo}`
              : `Transferência por habitante por região · ${periodo} · média: ${fmtPerCapita(mediaGeral)}`}
            {podeDetalhar && " · clique numa região para detalhar"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {["total", "per_capita"].map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              style={{
                background: vista === v ? "var(--accent)" : "var(--surface-2)",
                border: `1px solid ${vista === v ? "var(--accent)" : "var(--border-2)"}`,
                color: vista === v ? "#fff" : "var(--text-2)",
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 11,
                fontFamily: "Nunito, sans-serif",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {v === "total" ? "Total" : "Per capita"}
            </button>
          ))}
        </div>
      </div>

      <figure
        role="img"
        aria-label={`Gráfico de barras horizontais: transferências por região em ${periodo} — visão ${vista === "total" ? "total" : "per capita"}`}
        style={{ margin: 0 }}
      >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={dados}
          layout="vertical"
          margin={{ top: 4, right: 72, left: 4, bottom: 4 }}
          barCategoryGap="30%"
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="regiao"
            width={92}
            tick={{ fill: "#7090AA", fontSize: 12, fontFamily: "Nunito" }}
            axisLine={false}
            tickLine={false}
          />
          {vista === "per_capita" && mediaGeral > 0 && (
            <ReferenceLine
              x={mediaGeral}
              stroke="#64748B"
              strokeDasharray="4 3"
              strokeWidth={1}
            />
          )}
          <Tooltip
            content={
              vista === "total"
                ? <TooltipTotal />
                : <TooltipPerCapita mediaGeral={mediaGeral} />
            }
            cursor={{ fill: "rgba(19,81,180,0.04)" }}
          />
          <Bar
            dataKey={vista === "total" ? "valor_total" : "valor_per_capita"}
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
            onClick={(entry) => handleClickRegiao(entry.regiao)}
            style={{ cursor: podeDetalhar ? "pointer" : "default" }}
          >
            {dados.map((entry) => (
              <Cell
                key={entry.regiao}
                fill={CORES[entry.regiao] || "#1351B4"}
                stroke={regiaoAberta === entry.regiao ? "#0B1F3A" : "none"}
                strokeWidth={regiaoAberta === entry.regiao ? 1 : 0}
              />
            ))}
            <LabelList
              dataKey={vista === "total" ? "pct" : "valor_per_capita"}
              position="right"
              formatter={(v) =>
                vista === "total"
                  ? `${Number(v).toFixed(0)}%`
                  : fmtPerCapita(v)
              }
              style={{ fill: "#7090AA", fontSize: 11, fontFamily: "Nunito" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </figure>

      {regiaoAberta && (
        <>
          <ListaDrillDown
            titulo={`Estados — ${regiaoAberta} (clique para ver os tipos de repasse)`}
            itens={estadosDaRegiao}
            valorKey="valor_total"
            labelKey="sigla_uf"
            corPorItem={() => CORES[regiaoAberta] || "var(--accent)"}
            onItemClick={(item) => handleClickEstado(item.sigla_uf)}
            itemAtivo={estadoAberto}
          />

          {estadoAberto && (
            loadingTipos ? (
              <div className="empty-state" style={{ height: 80 }}>Carregando tipos de repasse...</div>
            ) : tiposDoEstado.length > 0 ? (
              <ListaDrillDown
                titulo={`Tipos de repasse — ${estadoAberto} · ${periodo}`}
                itens={tiposDoEstado}
                valorKey="valor_total"
                labelKey="tipo_transferencia"
              />
            ) : (
              <div className="empty-state" style={{ height: 80 }}>Sem dados de tipos de repasse para {estadoAberto}.</div>
            )
          )}
        </>
      )}
    </div>
  );
}
