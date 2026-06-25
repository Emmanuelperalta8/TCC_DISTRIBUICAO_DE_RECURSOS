import { useFormato } from "../contexts/FormatoContext";
import { fmtBRL, fmtPerCapita, fmtPop } from "../utils/fmt";
import styles from "./KPIs/KPIs.module.css";

export default function KPIs({ dadosCompletos, anoSel, estadoSel }) {
  const { detalhe } = useFormato();

  const popTotal    = dadosCompletos.reduce((s, r) => s + Number(r.populacao || 0), 0);
  const totalTransf = dadosCompletos.reduce((s, r) => s + Number(r.valor_total || 0), 0);
  const perCapita   = popTotal > 0 ? totalTransf / popTotal : 0;

  const escopo = estadoSel !== "Todos" ? estadoSel : "Brasil";

  return (
    <div className={styles.kpis}>
      <div className={styles.kpi} style={{ "--kpi-color": "var(--accent)" }}>
        <div className={styles.label}>Valor transferido</div>
        <div className={styles.value}>{fmtBRL(totalTransf, detalhe)}</div>
        <div className={styles.sub}>{escopo} · {anoSel}</div>
      </div>

      <div className={styles.kpi} style={{ "--kpi-color": "var(--success)" }}>
        <div className={styles.label}>Habitantes</div>
        <div className={styles.value}>{fmtPop(popTotal, detalhe)}</div>
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
