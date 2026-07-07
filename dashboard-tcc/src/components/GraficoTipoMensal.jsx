import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fmtBRL, fmtBRLCompact } from "../utils/fmt";

function TooltipMensal({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (d.valor == null) {
    return (
      <div className="tt">
        <div className="tt-label">{label}</div>
        <div className="tt-detail">Sem dado publicado pela fonte oficial neste mês</div>
      </div>
    );
  }
  return (
    <div className="tt">
      <div className="tt-label">{label}</div>
      <div className="tt-value">{fmtBRL(d.valor, true)}</div>
    </div>
  );
}

export default function GraficoTipoMensal({ dados, tipo, ano, escopo, loading, height = 200, onClose }) {
  const temAlgumDado = dados?.some((d) => d.valor != null);

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="card-title">{tipo} · série mensal</div>
          <div className="card-sub">
            {escopo} · {ano} — meses sem ponto na linha não têm dado publicado pela fonte oficial
          </div>
        </div>
        <button className="btn-clear" onClick={onClose}>Fechar</button>
      </div>

      {loading ? (
        <div className="empty-state">Carregando série mensal...</div>
      ) : !temAlgumDado ? (
        <div className="empty-state">Sem dados mensais publicados para esse período.</div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={dados} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EEF5" vertical={false} />
            <XAxis
              dataKey="mesLabel"
              tick={{ fill: "#7090AA", fontSize: 11, fontFamily: "Nunito" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmtBRLCompact}
              tick={{ fill: "#7090AA", fontSize: 10, fontFamily: "Nunito" }}
              axisLine={false}
              tickLine={false}
              width={72}
            />
            <Tooltip content={<TooltipMensal />} cursor={{ stroke: "#E8EEF5", strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="valor"
              stroke="#1351B4"
              strokeWidth={2}
              dot={{ r: 3, fill: "#1351B4", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#1351B4", strokeWidth: 0 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
