import KPIs from "../components/KPIs";
import GraficoHistorico from "../components/GraficoHistorico";
import GraficoRegioes from "../components/GraficoRegioes";
import BotaoExportarCSV from "../components/BotaoExportarCSV";
import PageHeader from "../components/PageHeader";

const COLUNAS_EXPORT = [
  { key: "sigla_uf",         label: "UF" },
  { key: "nome_estado",      label: "Estado" },
  { key: "regiao",           label: "Região" },
  { key: "populacao",        label: "População" },
  { key: "valor_total",      label: "Total Transferido (R$)" },
  { key: "valor_per_capita", label: "Per Capita (R$)" },
];

export default function PaginaVisaoGeral({ dadosCompletos, dadosNacionais, regioes, historicoTransf, anoSel, estadoSel, mesSel }) {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Visão Geral"
        title="Distribuição de Recursos Federais"
        description="Indicadores consolidados das transferências da União para os estados brasileiros — valores absolutos, per capita e evolução histórica."
        acoes={
          <BotaoExportarCSV
            dados={dadosCompletos}
            colunas={COLUNAS_EXPORT}
            nomeArquivo={`transferencias_${anoSel}.csv`}
          />
        }
      />

      <KPIs dadosCompletos={dadosCompletos} anoSel={anoSel} estadoSel={estadoSel} mesSel={mesSel} />

      <div className="grid-6040">
        <GraficoHistorico
          historicoTransf={historicoTransf}
          estadoSel={estadoSel}
          anoSel={anoSel}
          mesSel={mesSel}
          height={320}
        />
        <GraficoRegioes regioes={regioes} anoSel={anoSel} mesSel={mesSel} height={320} dadosNacionais={dadosNacionais} />
      </div>
    </div>
  );
}
