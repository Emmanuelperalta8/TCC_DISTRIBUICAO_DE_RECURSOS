// GraficoPerCapita.jsx
// Este componente será implementado na próxima etapa,
// após a coleta das transferências do Tesouro Nacional.
// Exibirá o valor transferido per capita por estado.

export default function GraficoPerCapita() {
  return (
    <div className="card">
      <div className="card-title">Per Capita por Estado</div>
      <div className="card-sub">Disponível após carga das transferências do Tesouro Nacional</div>
      <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13 }}>
        ⏳ Aguardando dados de transferências...
      </div>
    </div>
  );
}