import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

const CORES = {
  Norte:          "#38BDF8",
  Nordeste:       "#FBBF24",
  Sudeste:        "#818CF8",
  Sul:            "#A78BFA",
  "Centro-Oeste": "#FB923C",
};

const fmtBRL = (v) => {
  if (v >= 1e9)
    return `R$ ${(v / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} bi`;
  if (v >= 1e6)
    return `R$ ${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`;
  return `R$ ${Number(v).toLocaleString("pt-BR")}`;
};

const TooltipCustom = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="tt">
      <div className="tt-label">{d.regiao}</div>
      <div className="tt-value">{fmtBRL(d.valor_total)}</div>
      <div className="tt-detail">{d.pct.toFixed(1)}% do total nacional</div>
    </div>
  );
};

export default function GraficoRegioes({ regioes, anoSel }) {
  const totalGeral = regioes.reduce((s, r) => s + (r.valor_total || 0), 0);

  const dados = regioes
    .filter((r) => r.valor_total > 0)
    .map((r) => ({
      ...r,
      pct: totalGeral > 0 ? (r.valor_total / totalGeral) * 100 : 0,
    }))
    .sort((a, b) => b.valor_total - a.valor_total);

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
      <div className="card-header">
        <div className="card-title">Transferências por região</div>
        <div className="card-sub">
          Participação de cada região no total transferido · {anoSel}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <BarChart
          data={dados}
          layout="vertical"
          margin={{ top: 4, right: 56, left: 4, bottom: 4 }}
          barCategoryGap="30%"
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="regiao"
            width={92}
            tick={{ fill: "#94A3B8", fontSize: 12, fontFamily: "Nunito" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<TooltipCustom />}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar dataKey="valor_total" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {dados.map((entry) => (
              <Cell
                key={entry.regiao}
                fill={CORES[entry.regiao] || "#3B82F6"}
              />
            ))}
            <LabelList
              dataKey="pct"
              position="right"
              formatter={(v) => `${v.toFixed(0)}%`}
              style={{ fill: "#94A3B8", fontSize: 11, fontFamily: "Nunito" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
