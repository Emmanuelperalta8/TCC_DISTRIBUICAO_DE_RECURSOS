import { useFormato } from "../contexts/FormatoContext";

const REGIOES = ["Todas", "Norte", "Nordeste", "Sudeste", "Sul", "Centro-Oeste"];

const PAGINAS = [
  { id: "home",         label: "Início",                 desc: "Sobre o dashboard" },
  { id: "visao-geral",  label: "Visão Geral",            desc: "KPIs e série histórica" },
  { id: "regioes",      label: "Por Região",             desc: "Distribuição regional" },
  { id: "estados",      label: "Por Estado",             desc: "Per capita e ranking" },
  { id: "tipos",        label: "Tipos de Repasse",       desc: "Modalidades de transferência" },
];

function IconUsers() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

function IconHome() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  );
}

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
  "home":        IconHome,
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
  perfil, onSair,
}) {
  const filtrosAtivos = estadoSel !== "Todos" || regiaoSel !== "Todas";
  const { detalhe, setDetalhe } = useFormato();
  const naHome = pagina === "home";

  return (
    <aside className="sidebar">

      {/* ── Brand ─────────────────────────── */}
      <div className="sb-brand">
        <img src="/logo.png" alt="DRF Logo" className="sb-logo" />
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

        {perfil?.role === "admin" && (
          <>
            <div className="sb-sep" style={{ margin: "6px 0" }} />
            <span className="sb-section-label">Admin</span>
            <button
              className={`nav-item${pagina === "admin" ? " active" : ""}`}
              onClick={() => setPagina("admin")}
            >
              <span className="nav-icon"><IconUsers /></span>
              <span className="nav-label">Usuários</span>
            </button>
          </>
        )}
      </nav>

      {/* ── Filters ───────────────────────── */}
      <div className="sb-sep" />
      <div className="sb-filters">
        <span className="sb-section-label">
          Filtros
          {loading && <span className="sb-pulse" />}
        </span>

        {naHome ? (
          <p className="sb-filter-note">
            Os filtros de Ano, Região e Estado se aplicam às telas de dados (Visão Geral, Região, Estado).
          </p>
        ) : (
          <>
            <div className="sb-filter-group">
              <label className="sb-filter-label" htmlFor="sb-ano">Ano</label>
              <select
                id="sb-ano"
                className="sb-select"
                style={{ backgroundImage: CHEVRON_SVG }}
                value={anoSel ?? ""}
                onChange={(e) => setAnoSel(Number(e.target.value))}
              >
                {anos.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="sb-filter-group">
              <label className="sb-filter-label" htmlFor="sb-regiao">Região</label>
              <select
                id="sb-regiao"
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
              <label className="sb-filter-label" htmlFor="sb-estado">Estado</label>
              <select
                id="sb-estado"
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
          </>
        )}

        <div className="sb-filter-group" style={{ marginTop: naHome ? 4 : 8 }}>
          <label className="sb-filter-label" id="sb-exibicao-label">Exibição de valores</label>
          <div className="sb-fmt-segment" role="group" aria-labelledby="sb-exibicao-label">
            <button
              type="button"
              className={`sb-fmt-option${!detalhe ? " active" : ""}`}
              onClick={() => setDetalhe(false)}
              title="Ex: R$ 1,5 bi"
            >
              Compacto
            </button>
            <button
              type="button"
              className={`sb-fmt-option${detalhe ? " active" : ""}`}
              onClick={() => setDetalhe(true)}
              title="Ex: R$ 1.500.000.000,00"
            >
              Completo
            </button>
          </div>
        </div>
      </div>

      {/* ── Footer ────────────────────────── */}
      <div className="sb-footer">
        {perfil && (
          <div className="sb-user">
            <div className="sb-user-avatar">
              {(perfil.nome_usuario || "U")[0].toUpperCase()}
            </div>
            <div className="sb-user-info">
              <div className="sb-user-name">{perfil.nome_usuario}</div>
              <div className="sb-user-role">
                {perfil.role === "admin" ? "Administrador" : "Usuário"}
              </div>
            </div>
            <button className="sb-logout-btn" onClick={onSair} title="Sair">
              <IconLogout />
            </button>
          </div>
        )}
        <div className="sb-footer-line" style={{ marginTop: perfil ? 10 : 0 }}>
          Dados: Tesouro Nacional · IBGE
        </div>
        <div className="sb-footer-line">Emmanuel O. P. Duarte · 2025</div>
      </div>

    </aside>
  );
}
