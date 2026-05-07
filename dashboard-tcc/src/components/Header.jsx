export default function Header() {
  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="header">
      <div>
        <div className="header-eyebrow">Painel Analítico · Brasil</div>
        <div className="header-title">Distribuição de Recursos Federais</div>
        <div className="header-sub">
          Análise das transferências da União para estados brasileiros por região,
          tipo e valor per capita.
        </div>
      </div>

      <div className="header-right">
        <div className="badge">
          Fontes: <strong>Tesouro Nacional</strong> · <strong>IBGE</strong>
        </div>
        <div className="badge-date">Atualizado em {hoje}</div>
      </div>
    </header>
  );
}
