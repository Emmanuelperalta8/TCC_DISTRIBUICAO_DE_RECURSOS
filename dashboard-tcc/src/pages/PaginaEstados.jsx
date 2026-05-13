import GraficoPerCapita from "../components/GraficoPerCapita";
import RankingEstados from "../components/RankingEstados";
import PageHeader from "../components/PageHeader";

export default function PaginaEstados({ dadosCompletos, dadosNacionais, anoSel, estadoSel, regiaoSel }) {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Por Estado"
        title="Transferências por Estado"
        description="Comparativo per capita entre todos os estados. A linha tracejada indica a média nacional ponderada pela população. O ranking exibe os 10 estados com maior recebimento per capita."
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
    </div>
  );
}
