import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList
} from "recharts";

const CORES_REGIOES = {
  "Norte":        "#00c9a7",
  "Nordeste":     "#f59e0b",
  "Sudeste":      "#3b82f6",
  "Sul":          "#a78bfa",
  "Centro-Oeste": "#f43f5e",
};

const fmtPop = (v) =>
  v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1e3).toFixed(0)}K`;

const TooltipCustom = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="tt">
      <div className="tt-label">{d.nome_estado || label}</div>
      <div className="tt-value">{Number(payload[0].value).toLocaleString("pt-BR")} hab.</div>
      <div style={{ fontSize: 10, color: CORES_REGIOES[d.regiao], marginTop: 4 }}>{d.regiao}</div>
    </div>
  );
};

export default function GraficoEstados({ dadosCompletos, anoSel, estadoSel }) {
  const dados = [...dadosCompletos].sort((a, b) => b.populacao - a.populacao);

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-title">
        População por Estado — {anoSel}
        {estadoSel !== "Todos" && (
          <span style={{ color: "var(--accent)", marginLeft: 8, fontSize: 13 }}>
            · {estadoSel}
          </span>
        )}
      </div>
      <div className="card-sub">Estimativa IBGE · ordenado do maior para o menor</div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={dados}
          margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
          <XAxis
            dataKey="sigla_uf"
            tick={{ fill: "#64748b", fontSize: 11, fontFamily: "DM Mono" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtPop}
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={55}
          />
          <Tooltip content={<TooltipCustom />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="populacao" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {dados.map((entry, i) => (
              <Cell
                key={i}
                fill={CORES_REGIOES[entry.regiao] || "#3b82f6"}
                fillOpacity={estadoSel === "Todos" || entry.sigla_uf === estadoSel ? 1 : 0.3}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legenda */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 16 }}>
        {Object.entries(CORES_REGIOES).map(([r, c]) => (
          <span key={r} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: "inline-block" }} />
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}