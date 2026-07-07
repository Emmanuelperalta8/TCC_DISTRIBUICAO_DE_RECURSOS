import { useFormato } from "../contexts/FormatoContext";
import { fmtBRL, fmtPerCapita, fmtPop } from "../utils/fmt";
import IndicadorFontePop from "./IndicadorFontePop";

const CORES = {
  Norte:          "#0077B6",
  Nordeste:       "#C96A00",
  Sudeste:        "#4338CA",
  Sul:            "#7C3AED",
  "Centro-Oeste": "#C2410C",
};

export default function RankingEstados({ dadosCompletos, anoSel, regiaoSel = "Todas" }) {
  const { detalhe } = useFormato();

  const validos = dadosCompletos.filter((d) => d.valor_per_capita > 0);

  const totalNac = validos.reduce((s, d) => s + Number(d.valor_total || 0), 0);
  const popNac   = validos.reduce((s, d) => s + Number(d.populacao || 0), 0);
  const mediaNac = popNac > 0 ? totalNac / popNac : 0;

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
          Top 10 — Qual estado recebe mais dinheiro por pessoa? · {anoSel}
        </div>
        <div className="card-sub">
          Ranking dos estados que recebem mais transferência federal por habitante · Média Brasil: {fmtPerCapita(mediaNac)}
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
                  {r.populacao > 0 ? fmtPop(r.populacao, detalhe) : "—"}
                  <IndicadorFontePop fontePop={r.fonte_pop} />
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
                  {fmtBRL(r.valor_total, detalhe)}
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
