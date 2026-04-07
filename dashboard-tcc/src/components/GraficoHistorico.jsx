import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const fmtPop = (v) => `${(v / 1e6).toFixed(0)}M`;

const TooltipCustom = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="tt">
      <div className="tt-label">{label}</div>
      <div className="tt-value">{Number(payload[0].value).toLocaleString("pt-BR")} hab.</div>
    </div>
  );
};

export default function GraficoHistorico({ historicoPop }) {
  return (
    <div className="card">
      <div className="card-title">Evolução Populacional — Brasil</div>
      <div className="card-sub">Total de habitantes por ano · fonte IBGE (Censo + Estimativas)</div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={historicoPop} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
          <XAxis dataKey="ano" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtPop} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
          <Tooltip content={<TooltipCustom />} />
          <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}