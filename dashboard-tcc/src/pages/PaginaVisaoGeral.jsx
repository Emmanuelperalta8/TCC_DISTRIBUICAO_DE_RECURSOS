import KPIs from "../components/KPIs";
import GraficoHistorico from "../components/GraficoHistorico";
import PageHeader from "../components/PageHeader";

export default function PaginaVisaoGeral({ dadosCompletos, historicoTransf, anoSel, estadoSel }) {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Visão Geral"
        title="Distribuição de Recursos Federais"
        description="Indicadores consolidados das transferências da União para os estados brasileiros — valores absolutos, per capita e evolução histórica."
      />

      <KPIs dadosCompletos={dadosCompletos} anoSel={anoSel} estadoSel={estadoSel} />

      <GraficoHistorico
        historicoTransf={historicoTransf}
        estadoSel={estadoSel}
        height={380}
      />
    </div>
  );
}
