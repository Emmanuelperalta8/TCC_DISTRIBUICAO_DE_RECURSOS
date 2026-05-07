const CORES = {
  Norte:          "#38BDF8",
  Nordeste:       "#FBBF24",
  Sudeste:        "#818CF8",
  Sul:            "#A78BFA",
  "Centro-Oeste": "#FB923C",
};

const fmtPerCapita = (v) =>
  `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtBRL = (v) => {
  if (v >= 1e9)
    return `R$ ${(v / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} bi`;
  if (v >= 1e6)
    return `R$ ${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`;
  return `R$ ${Number(v).toLocaleString("pt-BR")}`;
};

export default function RankingEstados({ dadosCompletos, anoSel }) {
  const ranking = [...dadosCompletos]
    .filter((d) => d.valor_per_capita > 0)
    .sort((a, b) => b.valor_per_capita - a.valor_per_capita)
    .slice(0, 10);

  const maxPerCapita = ranking[0]?.valor_per_capita || 1;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          Ranking por transferência per capita — Top 10 · {anoSel}
        </div>
        <div className="card-sub">
          Estados com maior valor de transferência federal por habitante
        </div>
      </div>

      <table className="ranking">
        <thead>
          <tr>
            <th style={{ width: 40 }}>#</th>
            <th>Estado</th>
            <th>Região</th>
            <th style={{ textAlign: "right" }}>Per capita</th>
            <th style={{ textAlign: "right" }}>Total recebido</th>
            <th style={{ minWidth: 100 }}>Proporção</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((r, i) => (
            <tr key={r.sigla_uf}>
              <td>
                <span className="rank-pos">{i + 1}</span>
              </td>

              <td>
                <span className="rank-uf">{r.sigla_uf}</span>
                <span className="rank-nome">{r.nome_estado}</span>
              </td>

              <td>
                <span
                  className="rank-regiao-dot"
                  style={{ background: CORES[r.regiao] }}
                />
                <span style={{ fontSize: 12, color: "#94A3B8" }}>
                  {r.regiao}
                </span>
              </td>

              <td style={{ textAlign: "right" }}>
                <span className="rank-valor">
                  {fmtPerCapita(r.valor_per_capita)}
                </span>
              </td>

              <td style={{ textAlign: "right", color: "#64748B", fontSize: 12 }}>
                {fmtBRL(r.valor_total)}
              </td>

              <td>
                <div className="rank-bar-wrap">
                  <div
                    className="rank-bar"
                    style={{
                      width: `${(r.valor_per_capita / maxPerCapita) * 100}%`,
                    }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
