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
import { useFormato } from "../contexts/FormatoContext";
import { fmtBRL, fmtBRLCompact } from "../utils/fmt";

function TooltipCustom({ active, payload, label }) {
  const { detalhe } = useFormato();
  if (!active || !payload?.length) return null;
  const transf = payload.find((p) => p.dataKey === "total");
  return (
    <div className="tt">
      <div className="tt-label">{label}</div>
      <div className="tt-detail" style={{ color: "#1351B4", fontWeight: 700 }}>
        Transferência recebida: {fmtBRL(transf?.value ?? 0, detalhe)}
      </div>
    </div>
  );
}

export default function GraficoHistorico({ historicoTransf, estadoSel = "Todos", height = 230 }) {
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
        <div className="card-title">Evolução das transferências  {escopo}</div>
        <div className="card-sub">
          Total transferido por ano · fonte: Tesouro Nacional
          {variacao !== null && (
            <span
              style={{
                marginLeft: 10,
                color: variacao >= 0 ? "#166534" : "#991B1B",
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

      <figure
        role="img"
        aria-label={`Gráfico de linha: evolução das transferências anuais  ${escopo}. Último ano: ${ultimo?.ano}, transferência: ${fmtBRLCompact(ultimo?.total ?? 0)}`}
        style={{ margin: 0 }}
      >
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={historicoTransf}
          margin={{ top: 8, right: 12, left: 8, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#E8EEF5"
            vertical={false}
          />
          <XAxis
            dataKey="ano"
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
          <Tooltip content={<TooltipCustom />} cursor={{ stroke: "#E8EEF5", strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="total"
            name="Transferência recebida"
            stroke="#1351B4"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#1351B4", strokeWidth: 0 }}
          />
          {ultimo && (
            <ReferenceDot
              x={ultimo.ano}
              y={ultimo.total}
              r={4}
              fill="#1351B4"
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      </figure>

      <div className="legend-row">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "#1351B4" }} />Transferência recebida
        </span>
      </div>
    </div>
  );
}
