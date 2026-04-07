export default function Filtros({ anos, anoSel, setAnoSel, estados, estadoSel, setEstadoSel, loading }) {
  return (
    <div className="filtros">
      <div className="filtro-group">
        <label>Ano</label>
        <select value={anoSel ?? ""} onChange={(e) => setAnoSel(Number(e.target.value))}>
          {anos.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div className="filtro-group">
        <label>Estado</label>
        <select value={estadoSel} onChange={(e) => setEstadoSel(e.target.value)}>
          <option value="Todos">Todos os estados</option>
          {estados.map((e) => (
            <option key={e.sigla_uf} value={e.sigla_uf}>
              {e.sigla_uf} — {e.nome_estado}
            </option>
          ))}
        </select>
      </div>
      {loading && (
        <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: "auto" }}>
          ↻ atualizando...
        </span>
      )}
    </div>
  );
}