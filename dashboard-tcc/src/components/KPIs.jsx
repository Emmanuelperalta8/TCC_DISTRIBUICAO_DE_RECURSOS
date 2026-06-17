import { useFormato } from "../contexts/FormatoContext";
import { fmtBRL, fmtPerCapita, fmtPop } from "../utils/fmt";

function DesvioMedia({ valor, media }) {
  if (!media || !valor) return null;
  const pct = ((valor - media) / media) * 100;
  const acima = pct >= 0;
  return (
    <div className="kpi-desvio">
      <span className={`kpi-desvio-badge ${acima ? "acima" : "abaixo"}`}>
        {acima ? "▲" : "▼"} {Math.abs(pct).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%{" "}
        {acima ? "acima" : "abaixo"} da média
      </span>
      <span className="kpi-desvio-ref">Média: {fmtPerCapita(media)}</span>
    </div>
  );
}

export default function KPIs({ dadosCompletos, anoSel, estadoSel }) {
  const { detalhe } = useFormato();

  const popTotal    = dadosCompletos.reduce((s, r) => s + Number(r.populacao || 0), 0);
  const totalTransf = dadosCompletos.reduce((s, r) => s + Number(r.valor_total || 0), 0);
  const perCapita   = popTotal > 0 ? totalTransf / popTotal : 0;

  const validos = dadosCompletos.filter((d) => d.valor_per_capita > 0);
  const maior   = [...validos].sort((a, b) => b.valor_per_capita - a.valor_per_capita)[0];
  const menor   = [...validos].sort((a, b) => a.valor_per_capita - b.valor_per_capita)[0];

  const escopo = estadoSel !== "Todos" ? estadoSel : "Brasil";

  return (
    <div className="kpis">
      <div className="kpi" style={{ "--kpi-color": "#1351B4" }}>
        <div className="kpi-label">Total transferido</div>
        <div className="kpi-value">{fmtBRL(totalTransf, detalhe)}</div>
        <div className="kpi-sub">{escopo} · {anoSel} · {fmtPop(popTotal)}</div>
      </div>

      <div className="kpi" style={{ "--kpi-color": "#16A34A" }}>
        <div className="kpi-label">Média per capita</div>
        <div className="kpi-value">{fmtPerCapita(perCapita)}</div>
        <div className="kpi-sub">por habitante · {escopo} · {anoSel}</div>
        <div className="kpi-sub" style={{ marginTop: 4 }}>
          Base: {fmtPop(popTotal)}
        </div>
      </div>

      <div className="kpi" style={{ "--kpi-color": "#D97706" }}>
        <div className="kpi-label">Maior per capita</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div className="kpi-value" style={{ fontSize: 26 }}>
            {maior?.sigla_uf || "—"}
          </div>
          {maior && (
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
              {fmtPerCapita(maior.valor_per_capita)}
            </div>
          )}
        </div>
        <div className="kpi-sub">
          {maior?.regiao || ""}
          {maior?.populacao > 0 ? ` · ${fmtPop(maior.populacao)}` : ""}
        </div>
        <DesvioMedia valor={maior?.valor_per_capita} media={perCapita} />
      </div>

      <div className="kpi" style={{ "--kpi-color": "#DC2626" }}>
        <div className="kpi-label">Menor per capita</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div className="kpi-value" style={{ fontSize: 26 }}>
            {menor?.sigla_uf || "—"}
          </div>
          {menor && (
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
              {fmtPerCapita(menor.valor_per_capita)}
            </div>
          )}
        </div>
        <div className="kpi-sub">
          {menor?.regiao || ""}
          {menor?.populacao > 0 ? ` · ${fmtPop(menor.populacao)}` : ""}
        </div>
        <DesvioMedia valor={menor?.valor_per_capita} media={perCapita} />
      </div>
    </div>
  );
}
