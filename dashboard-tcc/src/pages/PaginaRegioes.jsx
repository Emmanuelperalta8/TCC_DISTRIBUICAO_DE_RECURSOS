import GraficoRegioes from "../components/GraficoRegioes";
import BotaoExportarCSV from "../components/BotaoExportarCSV";
import PageHeader from "../components/PageHeader";
import IndicadorFontePop from "../components/IndicadorFontePop";
import { nomeMes } from "../utils/meses";

const fmtBRL = (v) => {
  if (v >= 1e9) return `R$ ${(v / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} bi`;
  if (v >= 1e6) return `R$ ${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`;
  return `R$ ${Number(v).toLocaleString("pt-BR")}`;
};

const fmtPop = (v) =>
  `${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi hab.`;

const fmtPC = (v) =>
  `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CORES = {
  Norte:          "#0077B6",
  Nordeste:       "#C96A00",
  Sudeste:        "#4338CA",
  Sul:            "#7C3AED",
  "Centro-Oeste": "#C2410C",
};

const COLUNAS_EXPORT = [
  { key: "regiao",           label: "Região" },
  { key: "qtd_estados",      label: "Nº Estados" },
  { key: "populacao",        label: "População" },
  { key: "valor_total",      label: "Total Transferido (R$)" },
  { key: "valor_per_capita", label: "Per Capita (R$)" },
  { key: "pct",              label: "% do Total Nacional" },
];

export default function PaginaRegioes({ regioes, anoSel, mesSel, dadosNacionais }) {
  const periodo = mesSel ? `${nomeMes(mesSel)}/${anoSel}` : anoSel;
  // Todos os estados de um mesmo ano compartilham a mesma fonte de população.
  const fontePop = dadosNacionais?.find((r) => r.fonte_pop)?.fonte_pop;
  const totalGeral = regioes.reduce((s, r) => s + (r.valor_total || 0), 0);
  const popGeral   = regioes.reduce((s, r) => s + (r.populacao  || 0), 0);
  const mediaPC    = popGeral > 0 ? totalGeral / popGeral : 0;

  const regioesComPC = regioes
    .filter((r) => r.valor_total > 0)
    .map((r) => ({
      ...r,
      valor_per_capita: r.populacao > 0 ? r.valor_total / r.populacao : 0,
      pct: totalGeral > 0 ? (r.valor_total / totalGeral) * 100 : 0,
    }))
    .sort((a, b) => b.valor_total - a.valor_total);

  const dadosExport = regioesComPC.map((r) => ({
    ...r,
    pct: r.pct.toFixed(1) + "%",
  }));

  return (
    <div className="page">
      <PageHeader
        eyebrow="Por Região"
        title="Transferências por Região"
        description="Comparativo regional do volume total transferido e valor per capita por habitante. Use o toggle Total / Per capita para alternar a visão."
        acoes={
          <BotaoExportarCSV
            dados={dadosExport}
            colunas={COLUNAS_EXPORT}
            nomeArquivo={`regioes_${anoSel}.csv`}
          />
        }
      />

      <GraficoRegioes regioes={regioes} anoSel={anoSel} mesSel={mesSel} height={420} dadosNacionais={dadosNacionais} />

      {/* Tabela resumo por região */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div className="card-title">Resumo por região · {periodo}</div>
          <div className="card-sub">Média nacional per capita: {fmtPC(mediaPC)}</div>
        </div>

        <table className="ranking" aria-label={`Tabela de transferências por região em ${periodo}`}>
          <thead>
            <tr>
              <th>Região</th>
              <th style={{ textAlign: "right" }}>Estados</th>
              <th style={{ textAlign: "right" }}>Habitantes</th>
              <th style={{ textAlign: "right" }}>Total transferido</th>
              <th style={{ textAlign: "right" }}>Per capita</th>
              <th style={{ textAlign: "right" }}>vs. média nacional</th>
            </tr>
          </thead>
          <tbody>
            {regioesComPC.map((r) => {
              const desvio = mediaPC > 0 ? ((r.valor_per_capita - mediaPC) / mediaPC) * 100 : null;
              return (
                <tr key={r.regiao}>
                  <td>
                    <span className="rank-regiao-dot" style={{ background: CORES[r.regiao] }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{r.regiao}</span>
                  </td>
                  <td style={{ textAlign: "right", color: "var(--text-2)", fontSize: 12 }}>
                    {r.qtd_estados}
                  </td>
                  <td style={{ textAlign: "right", color: "var(--text-2)", fontSize: 12 }}>
                    {r.populacao > 0 ? fmtPop(r.populacao) : "—"}
                    <IndicadorFontePop fontePop={fontePop} />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className="rank-valor">{fmtBRL(r.valor_total)}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className="rank-valor">{fmtPC(r.valor_per_capita)}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {desvio !== null && (
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: desvio >= 0 ? "#166534" : "#991B1B",
                      }}>
                        {desvio >= 0 ? "▲" : "▼"}{" "}
                        {Math.abs(desvio).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
