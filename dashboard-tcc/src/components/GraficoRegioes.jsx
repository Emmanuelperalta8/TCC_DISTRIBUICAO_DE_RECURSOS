import { useState } from "react";
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

const CORES = {
  Norte:          "#0077B6",
  Nordeste:       "#C96A00",
  Sudeste:        "#4338CA",
  Sul:            "#7C3AED",
  "Centro-Oeste": "#C2410C",
};

const fmtBRL = (v) => {
  if (v >= 1e9)
    return `R$ ${(v / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} bi`;
  if (v >= 1e6)
    return `R$ ${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`;
  return `R$ ${Number(v).toLocaleString("pt-BR")}`;
};

const fmtPerCapita = (v) =>
  `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtPop = (v) =>
  v >= 1e6
    ? `${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi hab.`
    : `${Number(v).toLocaleString("pt-BR")} hab.`;

const TooltipTotal = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="tt">
      <div className="tt-label">{d.regiao}</div>
      <div className="tt-value">{fmtBRL(d.valor_total)}</div>
      <div className="tt-detail">{d.pct.toFixed(1)}% do total nacional</div>
      {d.populacao > 0 && (
        <div className="tt-detail">{fmtPop(d.populacao)}</div>
      )}
      {d.valor_per_capita > 0 && (
        <div className="tt-detail">Per capita: {fmtPerCapita(d.valor_per_capita)}</div>
      )}
    </div>
  );
};

const TooltipPerCapita = ({ active, payload, mediaGeral }) => {
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
        <div className="tt-detail">{fmtPop(d.populacao)}</div>
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
};

export default function GraficoRegioes({ regioes, anoSel, height = 230 }) {
  const [vista, setVista] = useState("total");

  const totalGeral = regioes.reduce((s, r) => s + (r.valor_total || 0), 0);
  const popGeral   = regioes.reduce((s, r) => s + (r.populacao  || 0), 0);
  // Média per capita ponderada nacional
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

  if (!dados.length) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">Transferências por região</div>
          <div className="card-sub">Participação no total nacional · {anoSel}</div>
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
              ? `Participação de cada região no total transferido · ${anoSel}`
              : `Transferência por habitante por região · ${anoSel} · média: ${fmtPerCapita(mediaGeral)}`}
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
        aria-label={`Gráfico de barras horizontais: transferências por região em ${anoSel} — visão ${vista === "total" ? "total" : "per capita"}`}
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
          >
            {dados.map((entry) => (
              <Cell
                key={entry.regiao}
                fill={CORES[entry.regiao] || "#1351B4"}
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
    </div>
  );
}
