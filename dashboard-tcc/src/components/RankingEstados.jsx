const CORES_REGIOES = {
  "Norte": "#00c9a7", "Nordeste": "#f59e0b", "Sudeste": "#3b82f6",
  "Sul": "#a78bfa",   "Centro-Oeste": "#f43f5e",
};

export default function RankingEstados({ dadosCompletos, anoSel }) {
  const ranking = [...dadosCompletos]
    .sort((a, b) => b.populacao - a.populacao)
    .slice(0, 10);

  const maxPop = ranking[0]?.populacao || 1;

  return (
    <div className="card">
      <div className="card-title">Ranking Populacional — Top 10 Estados · {anoSel}</div>
      <div className="card-sub">Estados com maior população estimada pelo IBGE</div>
      <table className="ranking">
        <thead>
          <tr>
            <th>#</th>
            <th>Estado</th>
            <th>Região</th>
            <th>Capital</th>
            <th>População</th>
            <th style={{ minWidth: 120 }}>Proporção</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((r, i) => (
            <tr key={r.sigla_uf}>
              <td><span className="rank-num">{i + 1}</span></td>
              <td>
                <span className="rank-uf">{r.sigla_uf}</span>
                <span style={{ marginLeft: 8, fontSize: 12, color: "var(--muted)" }}>{r.nome_estado}</span>
              </td>
              <td style={{ color: CORES_REGIOES[r.regiao], fontSize: 12 }}>{r.regiao}</td>
              <td style={{ color: "var(--muted)", fontSize: 12 }}>{r.capital}</td>
              <td style={{ color: "var(--accent)", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                {Number(r.populacao).toLocaleString("pt-BR")}
              </td>
              <td>
                <div className="rank-bar-wrap">
                  <div className="rank-bar" style={{ width: `${(r.populacao / maxPop) * 100}%` }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}