import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

const CORES = {
  Norte:          "#38BDF8",
  Nordeste:       "#FBBF24",
  Sudeste:        "#818CF8",
  Sul:            "#A78BFA",
  "Centro-Oeste": "#FB923C",
};

const fmtEixo = (v) => {
  if (v >= 1000)
    return `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}K`;
  return `R$ ${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
};

const fmtPerCapita = (v) =>
  `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TooltipCustom = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="tt">
      <div className="tt-label">
        {d.nome_estado} ({d.sigla_uf})
      </div>
      <div className="tt-value">{fmtPerCapita(d.valor_per_capita)}</div>
      <div className="tt-detail" style={{ color: CORES[d.regiao] }}>
        {d.regiao}
      </div>
    </div>
  );
};

export default function GraficoPerCapita({ dadosCompletos, anoSel, estadoSel }) {
  const dados = [...dadosCompletos]
    .filter((d) => d.valor_per_capita > 0)
    .sort((a, b) => b.valor_per_capita - a.valor_per_capita);

  const media =
    dados.length
      ? dados.reduce((s, d) => s + d.valor_per_capita, 0) / dados.length
      : 0;

  if (!dados.length) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">Valor per capita por estado</div>
          <div className="card-sub">Transferência por habitante · {anoSel}</div>
        </div>
        <div className="empty-state">Sem dados para o período selecionado</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          Valor per capita por estado
          {estadoSel !== "Todos" && (
            <span style={{ color: "#3B82F6", fontWeight: 400, marginLeft: 8 }}>
              · {estadoSel}
            </span>
          )}
        </div>
        <div className="card-sub">
          Transferência por habitante · {anoSel} · média nacional:{" "}
          {fmtPerCapita(media)}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={dados}
          margin={{ top: 8, right: 12, left: 8, bottom: 4 }}
          barCategoryGap="22%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1F2937"
            vertical={false}
          />
          <XAxis
            dataKey="sigla_uf"
            tick={{ fill: "#64748B", fontSize: 10, fontFamily: "Nunito" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtEixo}
            tick={{ fill: "#64748B", fontSize: 10, fontFamily: "Nunito" }}
            axisLine={false}
            tickLine={false}
            width={68}
          />
          <Tooltip
            content={<TooltipCustom />}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <ReferenceLine
            y={media}
            stroke="#64748B"
            strokeDasharray="4 3"
            strokeWidth={1}
          />
          <Bar dataKey="valor_per_capita" radius={[4, 4, 0, 0]} maxBarSize={36}>
            {dados.map((entry) => (
              <Cell
                key={entry.sigla_uf}
                fill={CORES[entry.regiao] || "#3B82F6"}
                fillOpacity={
                  estadoSel === "Todos" || entry.sigla_uf === estadoSel
                    ? 1
                    : 0.25
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="legend-row">
        {Object.entries(CORES).map(([regiao, cor]) => (
          <span key={regiao} className="legend-item">
            <span className="legend-dot" style={{ background: cor }} />
            {regiao}
          </span>
        ))}
      </div>
    </div>
  );
}
