import GraficoTipos from "../components/GraficoTipos";
import PageHeader from "../components/PageHeader";

export default function PaginaTipos({ tiposTransf, anoSel, estadoSel }) {
  const escopo = estadoSel !== "Todos" ? estadoSel : "Brasil";

  return (
    <div className="page">
      <PageHeader
        eyebrow="Tipos de Repasse"
        title="Modalidades de Transferência"
        description={`Principais categorias de transferência federal para ${escopo} em ${anoSel}, ordenadas por volume total. Exibe as 15 maiores modalidades.`}
      />

      <GraficoTipos
        tiposTransf={tiposTransf}
        anoSel={anoSel}
        height={560}
        limit={15}
      />
    </div>
  );
}
