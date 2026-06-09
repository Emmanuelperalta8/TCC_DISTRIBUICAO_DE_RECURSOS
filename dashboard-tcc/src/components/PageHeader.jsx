export default function PageHeader({ eyebrow, title, description, extra, acoes }) {
  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div className="page-header">
      <div>
        {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-desc">{description}</p>}
      </div>
      <div className="page-header-right">
        {extra}
        {acoes && <div className="page-header-acoes">{acoes}</div>}
        <div className="badge">
          Fontes: <strong>Tesouro Nacional</strong> · <strong>IBGE</strong>
        </div>
        <div className="badge-date">{hoje}</div>
      </div>
    </div>
  );
}
