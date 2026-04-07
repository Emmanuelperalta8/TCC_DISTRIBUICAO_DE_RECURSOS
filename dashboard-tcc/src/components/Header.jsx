export default function Header() {
  return (
    <header className="header">
      <div>
        <div className="header-title">
          Distribuição de <span>Recursos Federais</span>
        </div>
        <div className="header-sub">
          TCC · Emmanuel Peralta · ULBRA Palmas · Engenharia de Software
        </div>
      </div>
      <div className="badge">
        Fonte: <strong>IBGE</strong> + <strong>Tesouro Nacional</strong>
      </div>
    </header>
  );
}