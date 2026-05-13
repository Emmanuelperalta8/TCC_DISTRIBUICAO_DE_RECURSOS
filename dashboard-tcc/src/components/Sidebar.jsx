const REGIOES = ["Todas", "Norte", "Nordeste", "Sudeste", "Sul", "Centro-Oeste"];

const PAGINAS = [
  { id: "visao-geral",  label: "Visão Geral",           desc: "KPIs e série histórica" },
  { id: "regioes",      label: "Por Região",             desc: "Distribuição regional" },
  { id: "estados",      label: "Por Estado",             desc: "Per capita e ranking" },
  { id: "tipos",        label: "Tipos de Repasse",       desc: "Modalidades de transferência" },
];

function IconGrid() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>
    </svg>
  );
}

function IconBar() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="4" height="9" rx="1"/>
      <rect x="10" y="6" width="4" height="15" rx="1"/>
      <rect x="17" y="3" width="4" height="18" rx="1"/>
    </svg>
  );
}

function IconList() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6h11M9 12h11M9 18h11"/>
      <circle cx="5" cy="6"  r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="5" cy="18" r="1.2" fill="currentColor" stroke="none"/>
    </svg>
  );
}

const ICONS = {
  "visao-geral": IconGrid,
  "regioes":     IconGlobe,
  "estados":     IconBar,
  "tipos":       IconList,
};

const CHEVRON_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`;

export default function Sidebar({
  pagina, setPagina,
  anos, anoSel, setAnoSel,
  estados, estadoSel, setEstadoSel,
  regiaoSel, setRegiaoSel,
  onLimpar, loading,
}) {
  const filtrosAtivos = estadoSel !== "Todos" || regiaoSel !== "Todas";

  return (
    <aside className="sidebar">

      {/* ── Brand ─────────────────────────── */}
      <div className="sb-brand">
        <div className="sb-brand-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <div>
          <div className="sb-brand-title">Recursos Federais</div>
          <div className="sb-brand-sub">ULBRA · Eng. de Software</div>
        </div>
      </div>

      {/* ── Navigation ────────────────────── */}
      <nav className="sb-nav">
        <span className="sb-section-label">Navegação</span>
        {PAGINAS.map((p) => {
          const Icon = ICONS[p.id];
          const ativo = pagina === p.id;
          return (
            <button
              key={p.id}
              className={`nav-item${ativo ? " active" : ""}`}
              onClick={() => setPagina(p.id)}
            >
              <span className="nav-icon"><Icon /></span>
              <span className="nav-label">{p.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Filters ───────────────────────── */}
      <div className="sb-sep" />
      <div className="sb-filters">
        <span className="sb-section-label">
          Filtros
          {loading && <span className="sb-pulse" />}
        </span>

        <div className="sb-filter-group">
          <label className="sb-filter-label">Ano</label>
          <select
            className="sb-select"
            style={{ backgroundImage: CHEVRON_SVG }}
            value={anoSel ?? ""}
            onChange={(e) => setAnoSel(Number(e.target.value))}
          >
            {anos.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className="sb-filter-group">
          <label className="sb-filter-label">Região</label>
          <select
            className="sb-select"
            style={{ backgroundImage: CHEVRON_SVG }}
            value={regiaoSel}
            onChange={(e) => { setRegiaoSel(e.target.value); setEstadoSel("Todos"); }}
          >
            {REGIOES.map((r) => (
              <option key={r} value={r}>{r === "Todas" ? "Todas as regiões" : r}</option>
            ))}
          </select>
        </div>

        <div className="sb-filter-group">
          <label className="sb-filter-label">Estado</label>
          <select
            className="sb-select"
            style={{ backgroundImage: CHEVRON_SVG }}
            value={estadoSel}
            onChange={(e) => setEstadoSel(e.target.value)}
          >
            <option value="Todos">Todos os estados</option>
            {estados
              .filter((e) => regiaoSel === "Todas" || e.regiao === regiaoSel)
              .map((e) => (
                <option key={e.sigla_uf} value={e.sigla_uf}>
                  {e.sigla_uf} — {e.nome_estado}
                </option>
              ))}
          </select>
        </div>

        {filtrosAtivos && (
          <button className="sb-clear-btn" onClick={onLimpar}>
            Limpar filtros
          </button>
        )}
      </div>

      {/* ── Footer ────────────────────────── */}
      <div className="sb-footer">
        <div className="sb-footer-line">Dados: Tesouro Nacional · IBGE</div>
        <div className="sb-footer-line">Emmanuel O. P. Duarte · 2025</div>
      </div>

    </aside>
  );
}
