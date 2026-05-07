const REGIOES = ["Todas", "Norte", "Nordeste", "Sudeste", "Sul", "Centro-Oeste"];

export default function Filtros({
  anos,
  anoSel,
  setAnoSel,
  estados,
  estadoSel,
  setEstadoSel,
  regiaoSel,
  setRegiaoSel,
  onLimpar,
  loading,
}) {
  const filtrosAtivos =
    estadoSel !== "Todos" || regiaoSel !== "Todas";

  return (
    <div className="filtros">
      <div className="filtro-group">
        <label>Ano</label>
        <select
          value={anoSel ?? ""}
          onChange={(e) => setAnoSel(Number(e.target.value))}
        >
          {anos.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="filtro-group">
        <label>Região</label>
        <select
          value={regiaoSel}
          onChange={(e) => {
            setRegiaoSel(e.target.value);
            setEstadoSel("Todos");
          }}
        >
          {REGIOES.map((r) => (
            <option key={r} value={r}>
              {r === "Todas" ? "Todas as regiões" : r}
            </option>
          ))}
        </select>
      </div>

      <div className="filtro-group">
        <label>Estado</label>
        <select
          value={estadoSel}
          onChange={(e) => setEstadoSel(e.target.value)}
        >
          <option value="Todos">Todos os estados</option>
          {estados
            .filter(
              (e) => regiaoSel === "Todas" || e.regiao === regiaoSel
            )
            .map((e) => (
              <option key={e.sigla_uf} value={e.sigla_uf}>
                {e.sigla_uf} — {e.nome_estado}
              </option>
            ))}
        </select>
      </div>

      {filtrosAtivos && (
        <button className="btn-clear" onClick={onLimpar}>
          Limpar filtros
        </button>
      )}

      {loading && (
        <span className="filtro-loading">Atualizando...</span>
      )}
    </div>
  );
}
