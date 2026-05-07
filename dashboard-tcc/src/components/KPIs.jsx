const fmtBRL = (v) => {
  if (v >= 1e9)
    return `R$ ${(v / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} bi`;
  if (v >= 1e6)
    return `R$ ${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`;
  return `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtPop = (v) =>
  v >= 1e6
    ? `${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi hab.`
    : `${Number(v).toLocaleString("pt-BR")} hab.`;

const fmtPerCapita = (v) =>
  `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function KPIs({ dadosCompletos, anoSel, estadoSel }) {
  const popTotal    = dadosCompletos.reduce((s, r) => s + Number(r.populacao || 0), 0);
  const totalTransf = dadosCompletos.reduce((s, r) => s + Number(r.valor_total || 0), 0);
  const perCapita   = popTotal > 0 ? totalTransf / popTotal : 0;

  const validos = dadosCompletos.filter((d) => d.valor_per_capita > 0);
  const maior   = [...validos].sort((a, b) => b.valor_per_capita - a.valor_per_capita)[0];
  const menor   = [...validos].sort((a, b) => a.valor_per_capita - b.valor_per_capita)[0];

  const escopo = estadoSel !== "Todos" ? estadoSel : "Brasil";

  return (
    <div className="kpis">
      <div className="kpi" style={{ "--kpi-color": "#3B82F6" }}>
        <div className="kpi-label">Total transferido</div>
        <div className="kpi-value">{fmtBRL(totalTransf)}</div>
        <div className="kpi-sub">{escopo} · {anoSel} · {fmtPop(popTotal)}</div>
      </div>

      <div className="kpi" style={{ "--kpi-color": "#22C55E" }}>
        <div className="kpi-label">Média per capita</div>
        <div className="kpi-value">{fmtPerCapita(perCapita)}</div>
        <div className="kpi-sub">por habitante · {escopo} · {anoSel}</div>
      </div>

      <div className="kpi" style={{ "--kpi-color": "#F59E0B" }}>
        <div className="kpi-label">Maior per capita</div>
        <div className="kpi-value" style={{ fontSize: 26 }}>
          {maior?.sigla_uf || "—"}
        </div>
        <div className="kpi-sub">
          {maior ? fmtPerCapita(maior.valor_per_capita) : ""}
          {maior ? ` · ${maior.regiao}` : ""}
        </div>
      </div>

      <div className="kpi" style={{ "--kpi-color": "#EF4444" }}>
        <div className="kpi-label">Menor per capita</div>
        <div className="kpi-value" style={{ fontSize: 26 }}>
          {menor?.sigla_uf || "—"}
        </div>
        <div className="kpi-sub">
          {menor ? fmtPerCapita(menor.valor_per_capita) : ""}
          {menor ? ` · ${menor.regiao}` : ""}
        </div>
      </div>
    </div>
  );
}
