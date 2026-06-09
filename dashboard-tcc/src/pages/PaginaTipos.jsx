import GraficoTipos from "../components/GraficoTipos";
import BotaoExportarCSV from "../components/BotaoExportarCSV";
import PageHeader from "../components/PageHeader";

const CONCEITOS = {
  "FPE":                   "Repasse constitucional de 21,5% do IR e IPI destinado aos 26 estados e ao DF.",
  "FPM":                   "Repasse constitucional de 22,5% do IR e IPI destinado aos municípios brasileiros.",
  "IPI-EXP":               "Compensação pela desoneração do IPI nas exportações, proporcional às exportações estaduais.",
  "IPI-Exp":               "Compensação pela desoneração do IPI nas exportações, proporcional às exportações estaduais.",
  "ICMS":                  "LC 87/96 (Lei Kandir) — compensação pela perda de arrecadação de ICMS nas exportações.",
  "ITR":                   "50% do ITR arrecadado é repassado ao município onde o imóvel rural está localizado.",
  "CIDE/Combustível":      "CIDE-Combustíveis — parte da contribuição sobre combustíveis rateada entre estados e municípios.",
  "CIDE-Combustíveis":     "CIDE-Combustíveis — parte da contribuição sobre combustíveis rateada entre estados e municípios.",
  "FEP":                   "Fundo Especial do Petróleo — parte dos royalties distribuída a estados e municípios não produtores.",
  "CFH":                   "Compensação paga por usinas hidrelétricas pelo uso de potencial hídrico, repassada a estados e municípios.",
  "CFEM":                  "Compensação paga por empresas de mineração, distribuída à União, estados e municípios.",
  "IPVA":                  "Parcela FUNDEB — contribuição dos estados ao fundo com base na arrecadação do IPVA.",
  "ITCMD":                 "Parcela FUNDEB — contribuição dos estados ao fundo com base na arrecadação do ITCMD.",
  "LC 87/96 (Lei Kandir)": "Compensação federal pela desoneração de ICMS nas exportações de produtos primários.",
  "LC 173/2020 (PFEC)":    "Auxílio emergencial da União a estados e municípios durante a pandemia de COVID-19.",
  "LC 176/2020 (ADO25)":   "Compensação pelo adiamento de precatórios reconhecidos no âmbito da ADO 25 do STF.",
  "LC 201/2023 – COMPENSAÇÃO ICMS": "Compensação pela perda de arrecadação decorrente da desoneração do ICMS sobre combustíveis.",
  "Royalties":             "Compensações financeiras pela exploração de recursos naturais (petróleo, gás, minerais).",
  "FPM 1%":                "Parcela extra de 1% do FPM repassada em julho e dezembro conforme EC 55/2007.",
  "AFM/AFE":               "Auxílio Financeiro aos Municípios/Estados — transferência discricionária para apoio pontual.",
  "IOF-Ouro":              "70% do IOF sobre ouro como ativo financeiro repassado aos municípios de origem da extração.",
  "FEX":                   "Compensação pela perda de arrecadação de ICMS nas exportações, complementar à Lei Kandir.",
  "AJUSTE FUNDEB":         "Correção de diferenças nas contribuições ao Fundo de Manutenção da Educação Básica.",
};

const fmtBRL = (v) => {
  if (v >= 1e9) return `R$ ${(v / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} bi`;
  if (v >= 1e6) return `R$ ${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`;
  return `R$ ${Number(v).toLocaleString("pt-BR")}`;
};

const COLUNAS_EXPORT = [
  { key: "tipo_transferencia", label: "Modalidade" },
  { key: "valor_total",        label: "Valor Total (R$)" },
  { key: "pct",                label: "% do Total" },
];

export default function PaginaTipos({ tiposTransf, anoSel, estadoSel }) {
  const escopo = estadoSel !== "Todos" ? estadoSel : "Brasil";
  const total = (tiposTransf ?? []).reduce((s, d) => s + Number(d.valor_total), 0);

  const dadosOrdenados = [...(tiposTransf ?? [])]
    .map((d) => ({
      ...d,
      valor_total: Number(d.valor_total),
      pct: total > 0 ? (Number(d.valor_total) / total) * 100 : 0,
    }))
    .sort((a, b) => b.valor_total - a.valor_total);

  const dadosExport = dadosOrdenados.map((d) => ({
    ...d,
    pct: d.pct.toFixed(2) + "%",
  }));

  return (
    <div className="page">
      <PageHeader
        eyebrow="Tipos de Repasse"
        title="Modalidades de Transferência"
        description={`Principais categorias de transferência federal para ${escopo} em ${anoSel}, ordenadas por volume total. Exibe as 15 maiores modalidades.`}
        acoes={
          <BotaoExportarCSV
            dados={dadosExport}
            colunas={COLUNAS_EXPORT}
            nomeArquivo={`tipos_transferencia_${anoSel}.csv`}
          />
        }
      />

      <GraficoTipos
        tiposTransf={tiposTransf}
        anoSel={anoSel}
        height={560}
        limit={15}
      />

      {dadosOrdenados.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <div className="card-title">Detalhamento por modalidade · {anoSel}</div>
            <div className="card-sub">
              {dadosOrdenados.length} modalidades · total: {fmtBRL(total)}
            </div>
          </div>

          <table className="ranking" aria-label={`Tabela de modalidades de transferência em ${anoSel}`}>
            <thead>
              <tr>
                <th style={{ width: 32 }}>#</th>
                <th>Modalidade</th>
                <th style={{ textAlign: "right" }}>Valor total</th>
                <th style={{ textAlign: "right", width: 80 }}>% do total</th>
                <th>Descrição</th>
              </tr>
            </thead>
            <tbody>
              {dadosOrdenados.map((d, i) => {
                const conceito = CONCEITOS[d.tipo_transferencia] ?? null;
                const larguraBarra = Math.max(2, Math.round(d.pct));
                return (
                  <tr key={d.tipo_transferencia}>
                    <td style={{ color: "var(--text-3)", fontSize: 12, fontWeight: 700 }}>
                      {i + 1}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                          {d.tipo_transferencia}
                        </span>
                        <div style={{
                          height: 4, borderRadius: 2,
                          background: `linear-gradient(90deg, var(--accent) ${larguraBarra}%, var(--surface-2) ${larguraBarra}%)`,
                          width: "100%", maxWidth: 160,
                        }} />
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className="rank-valor">{fmtBRL(d.valor_total)}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: d.pct >= 20 ? "var(--accent)" : "var(--text-2)",
                      }}>
                        {d.pct.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: "var(--text-3)", maxWidth: 400, lineHeight: 1.4 }}>
                      {conceito ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
