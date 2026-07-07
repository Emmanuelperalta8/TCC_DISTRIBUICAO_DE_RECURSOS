import { useFormato } from "../contexts/FormatoContext";
import { fmtBRL, fmtPerCapita, fmtPop } from "../utils/fmt";
import { nomeMes } from "../utils/meses";
import IndicadorFontePop from "./IndicadorFontePop";
import styles from "./KPIs/KPIs.module.css";

export default function KPIs({ dadosCompletos, anoSel, estadoSel, mesSel }) {
  const { detalhe } = useFormato();

  const popTotal    = dadosCompletos.reduce((s, r) => s + Number(r.populacao || 0), 0);
  const totalTransf = dadosCompletos.reduce((s, r) => s + Number(r.valor_total || 0), 0);
  const perCapita   = popTotal > 0 ? totalTransf / popTotal : 0;
  // Todos os estados de um mesmo ano compartilham a mesma fonte de população.
  const fontePop    = dadosCompletos.find((r) => r.fonte_pop)?.fonte_pop;

  const escopo = estadoSel !== "Todos" ? estadoSel : "Brasil";
  const periodo = mesSel ? `${nomeMes(mesSel)}/${anoSel}` : anoSel;

  return (
    <div className={styles.kpis}>
      <div className={styles.kpi} style={{ "--kpi-color": "var(--accent)" }}>
        <div className={styles.label}>Valor transferido</div>
        <div className={styles.value}>{fmtBRL(totalTransf, detalhe)}</div>
        <div className={styles.sub}>{escopo} · {periodo}</div>
      </div>

      <div className={styles.kpi} style={{ "--kpi-color": "var(--success)" }}>
        <div className={styles.label}>Habitantes</div>
        <div className={styles.value}>
          {fmtPop(popTotal, detalhe)}
          <IndicadorFontePop fontePop={fontePop} />
        </div>
        <div className={styles.sub}>{escopo} · {periodo}</div>
      </div>

      <div className={styles.kpi} style={{ "--kpi-color": "var(--warning)" }}>
        <div className={styles.label}>Per capita</div>
        <div className={styles.value}>{fmtPerCapita(perCapita)}</div>
        <div className={styles.sub}>valor transferido ÷ habitantes</div>
      </div>
    </div>
  );
}
