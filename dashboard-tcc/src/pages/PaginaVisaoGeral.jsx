import KPIs from "../components/KPIs";
import GraficoHistorico from "../components/GraficoHistorico";
import EstatisticasDescritivas from "../components/EstatisticasDescritivas";
import AnaliseAvancada from "../components/AnaliseAvancada";
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

export default function PaginaVisaoGeral({ dadosCompletos, historicoTransf, anoSel, estadoSel }) {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Visão Geral"
        title="Distribuição de Recursos Federais"
        description="Indicadores consolidados das transferências da União para os estados brasileiros valores absolutos, per capita e evolução histórica."
        acoes={
          <BotaoExportarCSV
            dados={dadosCompletos}
            colunas={COLUNAS_EXPORT}
            nomeArquivo={`transferencias_${anoSel}.csv`}
          />
        }
      />

      <KPIs dadosCompletos={dadosCompletos} anoSel={anoSel} estadoSel={estadoSel} />

      <GraficoHistorico
        historicoTransf={historicoTransf}
        estadoSel={estadoSel}
        height={380}
      />

      <EstatisticasDescritivas dadosCompletos={dadosCompletos} anoSel={anoSel} />

      <AnaliseAvancada dadosCompletos={dadosCompletos} anoSel={anoSel} />
    </div>
  );
}
