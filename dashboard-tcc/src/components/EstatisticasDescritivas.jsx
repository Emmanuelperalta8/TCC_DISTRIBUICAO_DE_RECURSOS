/**
 * Análise estatística descritiva dos valores per capita por estado.
 *
 * Métricas calculadas:
 *   - Média aritmética
 *   - Mediana
 *   - Desvio padrão
 *   - Coeficiente de variação (CV = σ/μ × 100)
 *   - Intervalo interquartil (IQR = Q3 − Q1)
 *   - Outliers (valores fora de [Q1 − 1,5·IQR ; Q3 + 1,5·IQR])
 *
 * Referência metodológica: TUKEY, J.W. (1977). Exploratory Data Analysis.
 */

const fmtPC = (v) =>
  `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtPct = (v) =>
  `${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

// ── Funções estatísticas ──────────────────────────────────────────────────

function media(valores) {
  if (!valores.length) return 0;
  return valores.reduce((s, v) => s + v, 0) / valores.length;
}

function mediana(ordenados) {
  const n = ordenados.length;
  if (!n) return 0;
  const meio = Math.floor(n / 2);
  return n % 2 !== 0 ? ordenados[meio] : (ordenados[meio - 1] + ordenados[meio]) / 2;
}

function desvioPadrao(valores, avg) {
  if (valores.length < 2) return 0;
  const variancia = valores.reduce((s, v) => s + (v - avg) ** 2, 0) / (valores.length - 1);
  return Math.sqrt(variancia);
}

function quantil(ordenados, p) {
  const idx = (ordenados.length - 1) * p;
  const low = Math.floor(idx);
  const high = Math.ceil(idx);
  return ordenados[low] + (ordenados[high] - ordenados[low]) * (idx - low);
}

function calcularEstatisticas(dados) {
  const valores = dados
    .map((d) => Number(d.valor_per_capita))
    .filter((v) => v > 0)
    .sort((a, b) => a - b);

  if (!valores.length) return null;

  const avg  = media(valores);
  const med  = mediana(valores);
  const std  = desvioPadrao(valores, avg);
  const cv   = avg > 0 ? (std / avg) * 100 : 0;
  const q1   = quantil(valores, 0.25);
  const q3   = quantil(valores, 0.75);
  const iqr  = q3 - q1;
  const min  = valores[0];
  const max  = valores[valores.length - 1];

  const limiteInf = q1 - 1.5 * iqr;
  const limiteSup = q3 + 1.5 * iqr;

  const outliers = dados
    .filter((d) => {
      const v = Number(d.valor_per_capita);
      return v > 0 && (v < limiteInf || v > limiteSup);
    })
    .map((d) => ({
      sigla_uf:        d.sigla_uf,
      nome_estado:     d.nome_estado,
      valor_per_capita: Number(d.valor_per_capita),
      tipo:            Number(d.valor_per_capita) > limiteSup ? "alto" : "baixo",
    }))
    .sort((a, b) => b.valor_per_capita - a.valor_per_capita);

  return { avg, med, std, cv, q1, q3, iqr, min, max, outliers, n: valores.length };
}

// ── Componente principal ──────────────────────────────────────────────────

export default function EstatisticasDescritivas({ dadosCompletos, anoSel }) {
  const stats = calcularEstatisticas(dadosCompletos);

  if (!stats) {
    return null;
  }

  const { avg, med, std, cv, q1, q3, iqr, min, max, outliers, n } = stats;

  return (
    <div className="card stats-card" aria-label="Análise estatística descritiva dos valores per capita">
      <div className="card-header">
        <div className="card-title">Análise Estatística Per Capita · {anoSel}</div>
        <div className="card-sub">
          Base: {n} estados com dados · método IQR (Tukey, 1977) para detecção de outliers
        </div>
      </div>

      {/* Métricas principais */}
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">Média</div>
          <div className="stat-value">{fmtPC(avg)}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Mediana</div>
          <div className="stat-value">{fmtPC(med)}</div>
          {Math.abs(avg - med) / avg > 0.15 && (
            <div className="stat-note">Assimetria detectada (média ≠ mediana)</div>
          )}
        </div>
        <div className="stat-item">
          <div className="stat-label">Desvio Padrão (σ)</div>
          <div className="stat-value">{fmtPC(std)}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Coef. de Variação</div>
          <div className="stat-value" style={{ color: cv > 50 ? "var(--red)" : cv > 30 ? "var(--amber)" : "var(--green)" }}>
            {fmtPct(cv)}
          </div>
          <div className="stat-note">
            {cv > 50 ? "Alta dispersão" : cv > 30 ? "Dispersão moderada" : "Baixa dispersão"}
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Q1 (25%)</div>
          <div className="stat-value">{fmtPC(q1)}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Q3 (75%)</div>
          <div className="stat-value">{fmtPC(q3)}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">IQR (Q3 − Q1)</div>
          <div className="stat-value">{fmtPC(iqr)}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Amplitude (max − min)</div>
          <div className="stat-value">{fmtPC(max - min)}</div>
          <div className="stat-note">{fmtPC(min)} → {fmtPC(max)}</div>
        </div>
      </div>

      {/* Outliers */}
      {outliers.length > 0 && (
        <div className="stats-outliers">
          <div className="stats-outliers-title">
            Outliers detectados ({outliers.length} estado{outliers.length > 1 ? "s" : ""})
            <span className="stats-outliers-method">
              Limite: [{fmtPC(q1 - 1.5 * iqr)} ; {fmtPC(q3 + 1.5 * iqr)}]
            </span>
          </div>
          <div className="stats-outliers-list">
            {outliers.map((o) => (
              <div key={o.sigla_uf} className={`outlier-tag outlier-${o.tipo}`}>
                <span className="outlier-sigla">{o.sigla_uf}</span>
                <span className="outlier-valor">{fmtPC(o.valor_per_capita)}</span>
                <span className="outlier-tipo">{o.tipo === "alto" ? "▲ acima" : "▼ abaixo"}</span>
              </div>
            ))}
          </div>
          <div className="stats-outliers-note">
            Outliers são estados cujo per capita está além de 1,5× o IQR dos quartis.
            Esses casos merecem investigação qualitativa sobre critérios redistributivos.
          </div>
        </div>
      )}
    </div>
  );
}
