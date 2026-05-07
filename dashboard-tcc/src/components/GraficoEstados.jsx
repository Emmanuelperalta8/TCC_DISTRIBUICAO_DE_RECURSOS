import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";

const CORES_REGIOES = {
  "Norte":        "#00c9a7",
  "Nordeste":     "#f59e0b",
  "Sudeste":      "#3b82f6",
  "Sul":          "#a78bfa",
  "Centro-Oeste": "#f43f5e",
};

const fmtBRL = (v) => {
  if (v >= 1e9) return `R$ ${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(1)}M`;
  return `R$ ${Number(v).toLocaleString("pt-BR")}`;
};

const TooltipCustom = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="tt">
      <div className="tt-label">{d.nome_estado || label} ({d.sigla_uf})</div>
      <div className="tt-value">{fmtBRL(d.valor_total)}</div>
      <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
        Per capita: R$ {Number(d.valor_per_capita).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </div>
      <div style={{ fontSize: 10, color: CORES_REGIOES[d.regiao], marginTop: 2 }}>{d.regiao}</div>
    </div>
  );
};

export default function GraficoEstados({ dadosCompletos, anoSel, estadoSel }) {
  const dados = [...dadosCompletos]
    .filter((d) => d.valor_total > 0)
    .sort((a, b) => b.valor_total - a.valor_total);

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-title">
        Transferências por Estado — {anoSel}
        {estadoSel !== "Todos" && (
          <span style={{ color: "var(--accent)", marginLeft: 8, fontSize: 13 }}>· {estadoSel}</span>
        )}
      </div>
      <div className="card-sub">Total transferido pela União · ordenado do maior para o menor</div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={dados} margin={{ top: 20, right: 20, left: 10, bottom: 5 }} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
          <XAxis
            dataKey="sigla_uf"
            tick={{ fill: "#64748b", fontSize: 11, fontFamily: "DM Mono" }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tickFormatter={fmtBRL}
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false} tickLine={false} width={65}
          />
          <Tooltip content={<TooltipCustom />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="valor_total" radius={[6, 6, 0, 0]} maxBarSize={40}>
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
