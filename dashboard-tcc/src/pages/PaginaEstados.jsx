import GraficoPerCapita from "../components/GraficoPerCapita";
import RankingEstados from "../components/RankingEstados";
import EstatisticasDescritivas from "../components/EstatisticasDescritivas";
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

export default function PaginaEstados({ dadosCompletos, dadosNacionais, anoSel, estadoSel, regiaoSel }) {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Por Estado"
        title="Transferências por Estado"
        description="Comparativo per capita entre todos os estados. A linha tracejada indica a média nacional ponderada pela população. O ranking exibe os 10 estados com maior recebimento per capita."
        acoes={
          <BotaoExportarCSV
            dados={dadosNacionais}
            colunas={COLUNAS_EXPORT}
            nomeArquivo={`estados_${anoSel}.csv`}
          />
        }
      />

      <GraficoPerCapita
        dadosCompletos={dadosCompletos}
        anoSel={anoSel}
        estadoSel={estadoSel}
        height={340}
      />

      <div style={{ marginTop: 16 }}>
        <RankingEstados dadosCompletos={dadosNacionais} anoSel={anoSel} regiaoSel={regiaoSel} />
      </div>

      <EstatisticasDescritivas dadosCompletos={dadosNacionais} anoSel={anoSel} />
    </div>
  );
}
