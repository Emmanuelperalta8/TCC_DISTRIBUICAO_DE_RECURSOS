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

export default function GraficoTipos({ tiposTransf, anoSel }) {
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
    .slice(0, 10);

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

      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={dados}
          layout="vertical"
          margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
          barCategoryGap="24%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1F2937"
            horizontal={false}
          />
          <XAxis
            type="number"
            tickFormatter={fmtBRL}
            tick={{ fill: "#64748B", fontSize: 10, fontFamily: "Inter" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={yWidth}
            tick={{ fill: "#94A3B8", fontSize: 10, fontFamily: "Inter" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => truncar(v)}
          />
          <Tooltip
            content={<TooltipCustom />}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} maxBarSize={20}>
            <LabelList
              dataKey="percent"
              position="right"
              formatter={(v) =>
                `${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%`
              }
              style={{ fill: "#64748B", fontSize: 10, fontFamily: "Inter" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
