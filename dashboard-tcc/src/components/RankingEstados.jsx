const CORES = {
  Norte:          "#0077B6",
  Nordeste:       "#C96A00",
  Sudeste:        "#4338CA",
  Sul:            "#7C3AED",
  "Centro-Oeste": "#C2410C",
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

const fmtPop = (v) =>
  v >= 1e6
    ? `${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`
    : `${Number(v).toLocaleString("pt-BR")}`;

export default function RankingEstados({ dadosCompletos, anoSel, regiaoSel = "Todas" }) {
  const validos = dadosCompletos.filter((d) => d.valor_per_capita > 0);

  // Média ponderada nacional — sempre calculada sobre todos os estados (benchmark)
  const totalNac = validos.reduce((s, d) => s + Number(d.valor_total || 0), 0);
  const popNac   = validos.reduce((s, d) => s + Number(d.populacao || 0), 0);
  const mediaNac = popNac > 0 ? totalNac / popNac : 0;

  // Lista do ranking: filtra por região se selecionada
  const listagem = regiaoSel !== "Todas"
    ? validos.filter((d) => d.regiao === regiaoSel)
    : validos;

  const ranking = [...listagem]
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
          Estados com maior valor de transferência federal por habitante · média nacional:{" "}
          {fmtPerCapita(mediaNac)}
        </div>
      </div>

      <table className="ranking">
        <thead>
          <tr>
            <th style={{ width: 40 }}>#</th>
            <th>Estado</th>
            <th>Região</th>
            <th style={{ textAlign: "right" }}>Habitantes</th>
            <th style={{ textAlign: "right" }}>Per capita</th>
            <th style={{ textAlign: "right" }}>vs. média nacional</th>
            <th style={{ textAlign: "right" }}>Total recebido</th>
            <th style={{ minWidth: 100 }}>Proporção</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((r, i) => {
            const desvio = mediaNac > 0
              ? ((r.valor_per_capita - mediaNac) / mediaNac) * 100
              : null;
            return (
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
                  <span style={{ fontSize: 12, color: "#7090AA" }}>
                    {r.regiao}
                  </span>
                </td>

                <td style={{ textAlign: "right", color: "#7090AA", fontSize: 12 }}>
                  {r.populacao > 0 ? fmtPop(r.populacao) : "—"}
                </td>

                <td style={{ textAlign: "right" }}>
                  <span className="rank-valor">
                    {fmtPerCapita(r.valor_per_capita)}
                  </span>
                </td>

                <td style={{ textAlign: "right" }}>
                  {desvio !== null && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: desvio >= 0 ? "#166534" : "#991B1B",
                      }}
                    >
                      {desvio >= 0 ? "▲" : "▼"}{" "}
                      {Math.abs(desvio).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                    </span>
                  )}
                </td>

                <td style={{ textAlign: "right", color: "#7090AA", fontSize: 12 }}>
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
