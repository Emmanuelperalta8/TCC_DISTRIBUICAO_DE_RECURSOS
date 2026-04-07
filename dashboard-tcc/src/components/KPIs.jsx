const fmtPop = (v) =>
  v >= 1e6
    ? `${(v / 1e6).toFixed(1)}M hab.`
    : `${Number(v).toLocaleString("pt-BR")} hab.`;

export default function KPIs({ dadosCompletos, anoSel }) {
  const popTotal    = dadosCompletos.reduce((s, r) => s + Number(r.populacao || 0), 0);
  const maiorEstado = [...dadosCompletos].sort((a, b) => b.populacao - a.populacao)[0];
  const menorEstado = [...dadosCompletos].sort((a, b) => a.populacao - b.populacao)[0];
  const qtdEstados  = dadosCompletos.length;

  return (
    <div className="kpis">
      <div className="kpi" style={{ "--kpi-color": "var(--accent)" }}>
        <div className="kpi-label">População Total Brasil</div>
        <div className="kpi-value">{fmtPop(popTotal)}</div>
        <div className="kpi-sub">estimativa IBGE {anoSel}</div>
      </div>

      <div className="kpi" style={{ "--kpi-color": "var(--accent2)" }}>
        <div className="kpi-label">Estados Monitorados</div>
        <div className="kpi-value">{qtdEstados}</div>
        <div className="kpi-sub">unidades da federação</div>
      </div>

      <div className="kpi" style={{ "--kpi-color": "var(--warn)" }}>
        <div className="kpi-label">Estado Mais Populoso</div>
        <div className="kpi-value" style={{ fontSize: 20 }}>{maiorEstado?.nome_estado}</div>
        <div className="kpi-sub">{fmtPop(maiorEstado?.populacao || 0)}</div>
      </div>

      <div className="kpi" style={{ "--kpi-color": "var(--danger)" }}>
        <div className="kpi-label">Estado Menos Populoso</div>
        <div className="kpi-value" style={{ fontSize: 20 }}>{menorEstado?.nome_estado}</div>
        <div className="kpi-sub">{fmtPop(menorEstado?.populacao || 0)}</div>
      </div>
    </div>
  );
}