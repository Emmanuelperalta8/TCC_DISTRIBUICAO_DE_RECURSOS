/**
 * Números que ajudam a entender como o dinheiro está distribuído
 * - Média: quanto cada estado recebe em média
 * - Mediana: valor do meio (metade recebe mais, metade recebe menos)
 * - Desvio padrão: quanto as coisas variam
 * - Outliers: estados que saem muito do padrão
 */

import { useState } from "react";

const fmtPC = (v) =>
  `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtPct = (v) =>
  `${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

function Tooltip({ texto, explicacao }) {
  const [mostra, setMostra] = useState(false);

  return (
    <div style={{ display: "inline-block", position: "relative" }}>
      <span
        onMouseEnter={() => setMostra(true)}
        onMouseLeave={() => setMostra(false)}
        style={{
          cursor: "help",
          textDecoration: "underline dotted",
          color: "#3B82F6",
        }}
      >
        {texto} ?
      </span>
      {mostra && (
        <div
          style={{
            position: "absolute",
            bottom: "120%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1F2937",
            color: "#FFF",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            maxWidth: "200px",
            zIndex: 1000,
            whiteSpace: "normal",
          }}
        >
          {explicacao}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderTop: "4px solid #1F2937",
            }}
          />
        </div>
      )}
    </div>
  );
}

// Cálculos estatísticos
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

  const avg = media(valores);
  const med = mediana(valores);
  const std = desvioPadrao(valores, avg);
  const cv = avg > 0 ? (std / avg) * 100 : 0;
  const q1 = quantil(valores, 0.25);
  const q3 = quantil(valores, 0.75);
  const iqr = q3 - q1;
  const min = valores[0];
  const max = valores[valores.length - 1];

  const limiteInf = q1 - 1.5 * iqr;
  const limiteSup = q3 + 1.5 * iqr;

  const outliers = dados
    .filter((d) => {
      const v = Number(d.valor_per_capita);
      return v > 0 && (v < limiteInf || v > limiteSup);
    })
    .map((d) => ({
      sigla_uf: d.sigla_uf,
      nome_estado: d.nome_estado,
      valor_per_capita: Number(d.valor_per_capita),
      tipo: Number(d.valor_per_capita) > limiteSup ? "alto" : "baixo",
    }))
    .sort((a, b) => b.valor_per_capita - a.valor_per_capita);

  return { avg, med, std, cv, q1, q3, iqr, min, max, outliers, n: valores.length };
}

export default function EstatisticasDescritivas({ dadosCompletos, anoSel }) {
  const stats = calcularEstatisticas(dadosCompletos);

  if (!stats) {
    return null;
  }

  const { avg, med, std, cv, q1, q3, iqr, min, max, outliers, n } = stats;

  return (
    <div className="card stats-card" aria-label="Números que mostram como o dinheiro está distribuído">
      <div className="card-header">
        <div className="card-title">
          Números que mostram como o dinheiro está distribuído · {anoSel}
        </div>
        <div className="card-sub">
          Análise de {n} estados — método de Tukey para encontrar exceções
        </div>
      </div>

      {/* Métricas principais */}
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">
            <Tooltip
              texto="Média"
              explicacao="Quanto cada estado recebe em média. Soma tudo e divide por 27 estados."
            />
          </div>
          <div className="stat-value">{fmtPC(avg)}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">
            <Tooltip
              texto="Mediana"
              explicacao="Valor do meio. Metade dos estados recebe mais, metade recebe menos."
            />
          </div>
          <div className="stat-value">{fmtPC(med)}</div>
          {Math.abs(avg - med) / avg > 0.15 && (
            <div className="stat-note">
              ⚠️ Diferença detectada: a média e mediana não batem, pode ter desequilíbrio
            </div>
          )}
        </div>
        <div className="stat-item">
          <div className="stat-label">
            <Tooltip
              texto="Desvio Padrão"
              explicacao="Mostra quanto os valores variam. Número alto = muita variação. Número baixo = valores parecidos."
            />
          </div>
          <div className="stat-value">{fmtPC(std)}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">
            <Tooltip
              texto="Coef. Variação"
              explicacao="Compara a variação com a média em percentual. Ajuda a entender se a dispersão é grande ou pequena."
            />
          </div>
          <div className="stat-value" style={{ color: cv > 50 ? "var(--red)" : cv > 30 ? "var(--amber)" : "var(--green)" }}>
            {fmtPct(cv)}
          </div>
          <div className="stat-note">
            {cv > 50 ? "🔴 Muita variação entre estados" : cv > 30 ? "🟡 Variação moderada" : "🟢 Pouca variação"}
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">
            <Tooltip
              texto="Q1 (25%)"
              explicacao="Um quarto dos estados recebe menos que este valor."
            />
          </div>
          <div className="stat-value">{fmtPC(q1)}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">
            <Tooltip
              texto="Q3 (75%)"
              explicacao="Três quartos dos estados recebem menos que este valor."
            />
          </div>
          <div className="stat-value">{fmtPC(q3)}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">
            <Tooltip
              texto="Intervalo"
              explicacao="Diferença entre o maior e menor valor."
            />
          </div>
          <div className="stat-value">{fmtPC(iqr)}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">
            Menor para Maior
          </div>
          <div className="stat-value">{fmtPC(max - min)}</div>
          <div className="stat-note">{fmtPC(min)} → {fmtPC(max)}</div>
        </div>
      </div>

      {/* Estados fora do padrão */}
      {outliers.length > 0 && (
        <div className="stats-outliers">
          <div className="stats-outliers-title">
            ⚠️ Estados que saem do padrão ({outliers.length})
            <span className="stats-outliers-method">
              Fora do intervalo: [{fmtPC(q1 - 1.5 * iqr)} ; {fmtPC(q3 + 1.5 * iqr)}]
            </span>
          </div>
          <div className="stats-outliers-list">
            {outliers.map((o) => (
              <div key={o.sigla_uf} className={`outlier-tag outlier-${o.tipo}`}>
                <span className="outlier-sigla">{o.sigla_uf}</span>
                <span className="outlier-valor">{fmtPC(o.valor_per_capita)}</span>
                <span className="outlier-tipo">{o.tipo === "alto" ? "▲ acima do normal" : "▼ abaixo do normal"}</span>
              </div>
            ))}
          </div>
          <div className="stats-outliers-note">
            Esses estados recebem muito diferente dos outros. Pode ser por ter mais população (São Paulo) ou menos (Acre).
            Precisam ser investigados para entender o porquê.
          </div>
        </div>
      )}
    </div>
  );
}
