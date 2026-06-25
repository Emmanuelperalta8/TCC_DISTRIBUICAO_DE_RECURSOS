import { useFormato } from "../contexts/FormatoContext";
import { fmtBRL, fmtPerCapita, fmtPop } from "../utils/fmt";
import styles from "./KPIs/KPIs.module.css";

function DesvioMedia({ valor, media }) {
  if (!media || !valor) return null;
  const pct = ((valor - media) / media) * 100;
  const acima = pct >= 0;
  return (
    <div className={styles.desvio}>
      <span className={`${styles.desvio_badge} ${acima ? styles.acima : styles.abaixo}`}>
        {acima ? "▲" : "▼"} {Math.abs(pct).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%{" "}
        {acima ? "acima" : "abaixo"} da média nacional
      </span>
      <span className={styles.desvio_ref}>Comparação: {fmtPerCapita(media)}</span>
    </div>
  );
}

export default function KPIs({ dadosCompletos, anoSel, estadoSel }) {
  const { detalhe } = useFormato();

  const popTotal    = dadosCompletos.reduce((s, r) => s + Number(r.populacao || 0), 0);
  const totalTransf = dadosCompletos.reduce((s, r) => s + Number(r.valor_total || 0), 0);
  const perCapita   = popTotal > 0 ? totalTransf / popTotal : 0;

  const escopo = estadoSel !== "Todos" ? estadoSel : "Brasil";

  // Com um único estado selecionado, "maior/menor per capita" não fazem
  // sentido (sobra um só estado para comparar com ele mesmo) — mostra os
  // três números diretos: valor transferido, habitantes e a divisão entre eles.
  if (estadoSel !== "Todos") {
    return (
      <div className={styles.kpis} style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className={styles.kpi} style={{ "--kpi-color": "var(--accent)" }}>
          <div className={styles.label}>Valor transferido</div>
          <div className={styles.value}>{fmtBRL(totalTransf, detalhe)}</div>
          <div className={styles.sub}>{escopo} · {anoSel}</div>
        </div>

        <div className={styles.kpi} style={{ "--kpi-color": "var(--success)" }}>
          <div className={styles.label}>Habitantes</div>
          <div className={styles.value}>{fmtPop(popTotal)}</div>
          <div className={styles.sub}>{escopo} · {anoSel}</div>
        </div>

        <div className={styles.kpi} style={{ "--kpi-color": "var(--warning)" }}>
          <div className={styles.label}>Per capita</div>
          <div className={styles.value}>{fmtPerCapita(perCapita)}</div>
          <div className={styles.sub}>valor transferido ÷ habitantes</div>
        </div>
      </div>
    );
  }

  const validos = dadosCompletos.filter((d) => d.valor_per_capita > 0);
  const maior   = [...validos].sort((a, b) => b.valor_per_capita - a.valor_per_capita)[0];
  const menor   = [...validos].sort((a, b) => a.valor_per_capita - b.valor_per_capita)[0];

  return (
    <div className={styles.kpis}>
      <div className={styles.kpi} style={{ "--kpi-color": "var(--accent)" }}>
        <div className={styles.label}>Total transferido</div>
        <div className={styles.value}>{fmtBRL(totalTransf, detalhe)}</div>
        <div className={styles.sub}>{escopo} · {anoSel} · {fmtPop(popTotal)}</div>
      </div>

      <div className={styles.kpi} style={{ "--kpi-color": "var(--success)" }}>
        <div className={styles.label}>Média per capita</div>
        <div className={styles.value}>{fmtPerCapita(perCapita)}</div>
        <div className={styles.sub}>por habitante · {escopo} · {anoSel}</div>
        <div className={styles.sub} style={{ marginTop: 4 }}>
          Base: {fmtPop(popTotal)}
        </div>
      </div>

      <div className={styles.kpi} style={{ "--kpi-color": "var(--warning)" }}>
        <div className={styles.label}>Maior per capita</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div className={styles.value} style={{ fontSize: "var(--text-2xl)" }}>
            {maior?.sigla_uf || "—"}
          </div>
          {maior && (
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text)" }}>
              {fmtPerCapita(maior.valor_per_capita)}
            </div>
          )}
        </div>
        <div className={styles.sub}>
          {maior?.regiao || ""}
          {maior?.populacao > 0 ? ` · ${fmtPop(maior.populacao)}` : ""}
        </div>
        <DesvioMedia valor={maior?.valor_per_capita} media={perCapita} />
      </div>

      <div className={styles.kpi} style={{ "--kpi-color": "var(--error)" }}>
        <div className={styles.label}>Menor per capita</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div className={styles.value} style={{ fontSize: "var(--text-2xl)" }}>
            {menor?.sigla_uf || "—"}
          </div>
          {menor && (
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text)" }}>
              {fmtPerCapita(menor.valor_per_capita)}
            </div>
          )}
        </div>
        <div className={styles.sub}>
          {menor?.regiao || ""}
          {menor?.populacao > 0 ? ` · ${fmtPop(menor.populacao)}` : ""}
        </div>
        <DesvioMedia valor={menor?.valor_per_capita} media={perCapita} />
      </div>
    </div>
  );
}
