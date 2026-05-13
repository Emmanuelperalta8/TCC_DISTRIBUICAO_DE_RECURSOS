import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

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
      <div className="tt-label" style={{ maxWidth: 220 }}>{d.name}</div>
      <div className="tt-value">{fmtBRL(d.value)}</div>
      <div className="tt-detail">
        {d.percent.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% do total
      </div>
    </div>
  );
};

const truncar = (str, max = 30) =>
  str.length > max ? str.slice(0, max - 1) + "…" : str;

export default function GraficoTipos({ tiposTransf, anoSel, height = 280, limit = 10 }) {
  if (!tiposTransf?.length) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">Tipos de transferência</div>
          <div className="card-sub">Top 10 modalidades · {anoSel}</div>
        </div>
        <div className="empty-state">Sem dados para o período selecionado</div>
      </div>
    );
  }

  const total = tiposTransf.reduce((s, d) => s + Number(d.valor_total), 0);

  const dados = tiposTransf
    .map((d) => ({
      name:    d.tipo_transferencia,
      value:   Number(d.valor_total),
      percent: (Number(d.valor_total) / total) * 100,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  const maxLabelLen = Math.max(...dados.map((d) => Math.min(d.name.length, 30)));
  const yWidth = Math.min(Math.max(maxLabelLen * 6, 110), 200);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Tipos de transferência</div>
        <div className="card-sub">
          Top 10 modalidades · {anoSel} · total: {fmtBRL(total)}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={dados}
          layout="vertical"
          margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
          barCategoryGap="24%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#E8EEF5"
            horizontal={false}
          />
          <XAxis
            type="number"
            tickFormatter={fmtBRL}
            tick={{ fill: "#7090AA", fontSize: 10, fontFamily: "Nunito" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={yWidth}
            tick={{ fill: "#7090AA", fontSize: 10, fontFamily: "Nunito" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => truncar(v)}
          />
          <Tooltip
            content={<TooltipCustom />}
            cursor={{ fill: "rgba(19,81,180,0.04)" }}
          />
          <Bar dataKey="value" fill="#1351B4" radius={[0, 4, 4, 0]} maxBarSize={20}>
            <LabelList
              dataKey="percent"
              position="right"
              formatter={(v) =>
                `${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%`
              }
              style={{ fill: "#7090AA", fontSize: 10, fontFamily: "Nunito" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
