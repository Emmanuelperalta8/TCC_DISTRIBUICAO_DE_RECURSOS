import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";

const fmtBRL = (v) => {
  if (v >= 1e9)
    return `R$ ${(v / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })} bi`;
  if (v >= 1e6)
    return `R$ ${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })} mi`;
  return `R$ ${Number(v).toLocaleString("pt-BR")}`;
};

const TooltipCustom = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div className="tt">
      <div className="tt-label">{label}</div>
      <div className="tt-value">{fmtBRL(v)}</div>
    </div>
  );
};

export default function GraficoHistorico({ historicoTransf, estadoSel = "Todos" }) {
  if (!historicoTransf?.length) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">Evolução das transferências</div>
          <div className="card-sub">Total transferido por ano</div>
        </div>
        <div className="empty-state">Carregando histórico...</div>
      </div>
    );
  }

  const ultimo = historicoTransf[historicoTransf.length - 1];
  const penultimo = historicoTransf[historicoTransf.length - 2];
  const variacao =
    penultimo?.total > 0
      ? ((ultimo.total - penultimo.total) / penultimo.total) * 100
      : null;

  const escopo = estadoSel === "Todos" ? "Brasil" : estadoSel;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Evolução das transferências — {escopo}</div>
        <div className="card-sub">
          Total anual transferido pela União · fonte: Tesouro Nacional
          {variacao !== null && (
            <span
              style={{
                marginLeft: 10,
                color: variacao >= 0 ? "#22C55E" : "#EF4444",
                fontWeight: 600,
              }}
            >
              {variacao >= 0 ? "+" : ""}
              {variacao.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
              {" "}vs. {penultimo.ano}
            </span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <LineChart
          data={historicoTransf}
          margin={{ top: 8, right: 12, left: 8, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1F2937"
            vertical={false}
          />
          <XAxis
            dataKey="ano"
            tick={{ fill: "#64748B", fontSize: 11, fontFamily: "Inter" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtBRL}
            tick={{ fill: "#64748B", fontSize: 10, fontFamily: "Inter" }}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <Tooltip content={<TooltipCustom />} cursor={{ stroke: "#1F2937", strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#3B82F6", strokeWidth: 0 }}
          />
          {ultimo && (
            <ReferenceDot
              x={ultimo.ano}
              y={ultimo.total}
              r={4}
              fill="#3B82F6"
              stroke="#111827"
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
