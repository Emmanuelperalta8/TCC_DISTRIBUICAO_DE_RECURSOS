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
  Norte:          "#0077B6",
  Nordeste:       "#C96A00",
  Sudeste:        "#4338CA",
  Sul:            "#7C3AED",
  "Centro-Oeste": "#C2410C",
};

const fmtEixo = (v) => {
  if (v >= 1000)
    return `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}K`;
  return `R$ ${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
};

const fmtPerCapita = (v) =>
  `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtPop = (v) =>
  v >= 1e6
    ? `${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi hab.`
    : `${Number(v).toLocaleString("pt-BR")} hab.`;

const TooltipCustom = ({ active, payload, media }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const desvio = media > 0 ? ((d.valor_per_capita - media) / media) * 100 : null;
  return (
    <div className="tt">
      <div className="tt-label">
        {d.nome_estado} ({d.sigla_uf})
      </div>
      <div className="tt-value">{fmtPerCapita(d.valor_per_capita)}</div>
      <div className="tt-detail" style={{ color: CORES[d.regiao] }}>
        {d.regiao}
      </div>
      {d.populacao > 0 && (
        <div className="tt-detail">{fmtPop(d.populacao)}</div>
      )}
      {desvio !== null && (
        <div
          className="tt-detail"
          style={{ color: desvio >= 0 ? "#166534" : "#991B1B", marginTop: 4 }}
        >
          {desvio >= 0 ? "▲" : "▼"}{" "}
          {Math.abs(desvio).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%{" "}
          {desvio >= 0 ? "acima" : "abaixo"} da média
        </div>
      )}
    </div>
  );
};

export default function GraficoPerCapita({ dadosCompletos, anoSel, estadoSel, height = 280 }) {
  const dados = [...dadosCompletos]
    .filter((d) => d.valor_per_capita > 0)
    .sort((a, b) => b.valor_per_capita - a.valor_per_capita);

  // Média ponderada pela população — correto para distribuição per capita
  const totalTransf = dados.reduce((s, d) => s + Number(d.valor_total || 0), 0);
  const popTotal    = dados.reduce((s, d) => s + Number(d.populacao || 0), 0);
  const media       = popTotal > 0 ? totalTransf / popTotal : 0;

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
            <span style={{ color: "#1351B4", fontWeight: 400, marginLeft: 8 }}>
              · {estadoSel}
            </span>
          )}
        </div>
        <div className="card-sub">
          Transferência por habitante · {anoSel} · média nacional:{" "}
          {fmtPerCapita(media)}
        </div>
      </div>

      <figure
        role="img"
        aria-label={`Gráfico de barras: valor per capita por estado em ${anoSel}. Maior: ${dados[0]?.sigla_uf} com ${fmtPerCapita(dados[0]?.valor_per_capita ?? 0)}. Média nacional: ${fmtPerCapita(media)}`}
        style={{ margin: 0 }}
      >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={dados}
          margin={{ top: 8, right: 12, left: 8, bottom: 4 }}
          barCategoryGap="22%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#E8EEF5"
            vertical={false}
          />
          <XAxis
            dataKey="sigla_uf"
            tick={{ fill: "#7090AA", fontSize: 10, fontFamily: "Nunito" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtEixo}
            tick={{ fill: "#7090AA", fontSize: 10, fontFamily: "Nunito" }}
            axisLine={false}
            tickLine={false}
            width={68}
          />
          <Tooltip
            content={<TooltipCustom media={media} />}
            cursor={{ fill: "rgba(19,81,180,0.04)" }}
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
                fill={CORES[entry.regiao] || "#1351B4"}
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
      </figure>

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
