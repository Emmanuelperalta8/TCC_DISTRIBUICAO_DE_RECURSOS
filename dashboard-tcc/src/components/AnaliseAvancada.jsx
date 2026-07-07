/**
 * Análises para entender se o dinheiro federal é distribuído com justiça
 * - Índice de Gini: mede desigualdade
 * - Correlação: relação entre população e dinheiro recebido
 * - Teste de Normalidade: se os dados seguem padrão normal
 * - R²: quanto a população explica a distribuição
 * - Disparidade Regional: qual região ganhou/perdeu
 */

import { useState } from "react";
import { useFormato } from "../contexts/FormatoContext";
import { fmtPerCapita } from "../utils/fmt";
import "../styles/AnaliseAvancada.css";

// Tooltip component
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
          color: "var(--accent)",
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
            background: "var(--text)",
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
              borderTop: "4px solid var(--text)",
            }}
          />
        </div>
      )}
    </div>
  );
}

// Cálculo do Índice de Gini — mede desigualdade
function calcularGini(valores) {
  if (!valores.length) return 0;
  const sorted = [...valores].sort((a, b) => a - b);
  const n = sorted.length;
  const somaV = sorted.reduce((s, v) => s + v, 0);
  if (somaV === 0) return 0;

  let soma = 0;
  sorted.forEach((v, i) => {
    soma += (i + 1) * v;
  });

  const gini = (2 * soma) / (n * somaV) - (n + 1) / n;
  return Math.max(0, Math.min(1, gini));
}

// Correlação de Pearson — relação entre duas coisas
function calcularCorrelacao(x, y) {
  const n = x.length;
  if (n < 2) return 0;

  const mediaX = x.reduce((s, v) => s + v, 0) / n;
  const mediaY = y.reduce((s, v) => s + v, 0) / n;

  let numerador = 0;
  let somaQxDevX = 0;
  let somaQxDevY = 0;

  for (let i = 0; i < n; i++) {
    const devX = x[i] - mediaX;
    const devY = y[i] - mediaY;
    numerador += devX * devY;
    somaQxDevX += devX ** 2;
    somaQxDevY += devY ** 2;
  }

  const denominador = Math.sqrt(somaQxDevX * somaQxDevY);
  return denominador === 0 ? 0 : numerador / denominador;
}

// Regressão Linear — entender padrões
function calcularRegressao(x, y) {
  const n = x.length;
  if (n < 2) return null;

  const mediaX = x.reduce((s, v) => s + v, 0) / n;
  const mediaY = y.reduce((s, v) => s + v, 0) / n;

  let numerador = 0;
  let denominador = 0;

  for (let i = 0; i < n; i++) {
    const devX = x[i] - mediaX;
    numerador += devX * (y[i] - mediaY);
    denominador += devX ** 2;
  }

  const b = denominador === 0 ? 0 : numerador / denominador;
  const a = mediaY - b * mediaX;

  // R² — qual percentual é explicado
  let sstot = 0;
  let ssres = 0;
  for (let i = 0; i < n; i++) {
    const yPred = a + b * x[i];
    sstot += (y[i] - mediaY) ** 2;
    ssres += (y[i] - yPred) ** 2;
  }

  const r2 = sstot === 0 ? 0 : 1 - ssres / sstot;

  return { a, b, r2, mediaX, mediaY };
}

// Teste de Normalidade — dados têm padrão previsível?
function testeNormalidade(valores) {
  const n = valores.length;
  if (n < 3) return null;

  const sorted = [...valores].sort((a, b) => a - b);
  const media = sorted.reduce((s, v) => s + v, 0) / n;
  const desvio = Math.sqrt(
    sorted.reduce((s, v) => s + (v - media) ** 2, 0) / (n - 1)
  );

  if (desvio === 0) return null;

  const normalizado = sorted.map((v) => (v - media) / desvio);
  const skewness = normalizado.reduce((s, z) => s + z ** 3, 0) / (n - 1);
  const kurtosis =
    normalizado.reduce((s, z) => s + z ** 4, 0) / (n - 1) - 3;

  const jb = (n / 6) * (skewness ** 2 + (kurtosis ** 2) / 4);
  const pvalue = jb > 5.99 ? 0.05 : 0.5;

  return {
    skewness,
    kurtosis,
    jbStatistic: jb,
    pvalue,
    ehNormal: pvalue > 0.05,
  };
}

// Disparidade Regional — qual região ganhou/perdeu
function calcularDisparidadeRegional(dadosCompletos) {
  const porRegiao = {};

  dadosCompletos.forEach((d) => {
    if (!porRegiao[d.regiao]) {
      porRegiao[d.regiao] = [];
    }
    porRegiao[d.regiao].push(d.valor_per_capita);
  });

  const regioes = [];
  for (const [regiao, valores] of Object.entries(porRegiao)) {
    const media = valores.reduce((s, v) => s + v, 0) / valores.length;
    const desvio = Math.sqrt(
      valores.reduce((s, v) => s + (v - media) ** 2, 0) / (valores.length - 1)
    );
    regioes.push({
      regiao,
      media,
      desvio,
      min: Math.min(...valores),
      max: Math.max(...valores),
    });
  }

  const mediaNacional = dadosCompletos.reduce(
    (s, d) => s + d.valor_per_capita,
    0
  ) / dadosCompletos.length;

  const disparidade = regioes
    .map((r) => ({
      ...r,
      desvioPercentual: mediaNacional > 0 ? (r.desvio / mediaNacional) * 100 : 0,
      mediaPercentual:
        mediaNacional > 0 ? (r.media / mediaNacional) * 100 : 0,
    }))
    .sort((a, b) => b.desvioPercentual - a.desvioPercentual);

  return { disparidade, mediaNacional };
}

// Componente principal
export default function AnaliseAvancada({ dadosCompletos, anoSel }) {
  if (!dadosCompletos || !dadosCompletos.length) {
    return null;
  }

  const validos = dadosCompletos.filter((d) => d.valor_per_capita > 0);
  if (!validos.length) return null;

  const populacoes = validos.map((d) => Number(d.populacao));
  const transfPercapita = validos.map((d) => Number(d.valor_per_capita));
  const transferenciasTotal = validos.map((d) => Number(d.valor_total));

  const gini = calcularGini(transferenciasTotal);
  const correlacao = calcularCorrelacao(populacoes, transferenciasTotal);
  const regressao = calcularRegressao(populacoes, transferenciasTotal);
  const normalidade = testeNormalidade(transfPercapita);
  const { disparidade, mediaNacional } =
    calcularDisparidadeRegional(validos);

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-header">
        <div className="card-title">
          Será que o dinheiro federal é distribuído com justiça? · {anoSel}
        </div>
        <div className="card-sub">
          Análises para medir igualdade e validar se a distribuição faz sentido
        </div>
      </div>

      <div className="analise-grid">
        {/* Índice de Gini */}
        <div className="analise-box">
          <div className="analise-label">
            <Tooltip
              texto="Índice de Gini"
              explicacao="Mede se o dinheiro está bem distribuído entre estados. 0% = distribuição perfeita. 100% = tudo para um estado."
            />
          </div>
          <div className="analise-value">
            {(gini * 100).toFixed(1)}%
          </div>
          <div className="analise-sub">
            {gini < 0.3 && (
              <>
                ✅ Distribuição justa
                <br />
                O dinheiro está bem distribuído entre estados
              </>
            )}
            {gini >= 0.3 && gini < 0.5 && (
              <>
                ⚠️ Tem concentração
                <br />
                Alguns estados recebem bem mais que outros
              </>
            )}
            {gini >= 0.5 && (
              <>
                ❌ Muito concentrado
                <br />
                Poucos estados ficam com a maior parte
              </>
            )}
          </div>
          <div className="analise-nota">
            0% = todos recebem igual | 100% = tudo vai para um estado
          </div>
        </div>

        {/* Correlação População-Transferências */}
        <div className="analise-box">
          <div className="analise-label">
            <Tooltip
              texto="População ↔ Dinheiro"
              explicacao="Mostra se estados com mais gente recebem proporcionalmente mais dinheiro. 100% = relação perfeita."
            />
          </div>
          <div className="analise-value">
            {(correlacao * 100).toFixed(1)}%
          </div>
          <div className="analise-sub">
            {Math.abs(correlacao) > 0.8 && (
              <>
                ✅ Correlação forte
                <br />
                Estado grande = mais dinheiro (faz sentido!)
              </>
            )}
            {Math.abs(correlacao) > 0.5 && Math.abs(correlacao) <= 0.8 && (
              <>
                ⚠️ Correlação moderada
                <br />
                Além de população, há outros critérios
              </>
            )}
            {Math.abs(correlacao) <= 0.5 && (
              <>
                ⚠️ Correlação fraca
                <br />
                Política de redistribuição está sendo aplicada
              </>
            )}
          </div>
          <div className="analise-nota">
            Esperado: 85% a 95% (população deve ser fator principal)
          </div>
        </div>

        {/* Teste de Normalidade */}
        <div className="analise-box">
          <div className="analise-label">
            <Tooltip
              texto="Padrão dos Dados"
              explicacao="Verifica se os números seguem um padrão previsível ou se há casos muito fora da curva."
            />
          </div>
          <div
            className="analise-value"
            style={{
              color: normalidade?.ehNormal ? "var(--green)" : "var(--amber)",
            }}
          >
            {normalidade?.ehNormal ? "Normal" : "Tem outliers"}
          </div>
          <div className="analise-sub">
            {normalidade ? (
              <>
                p-value: {(normalidade.pvalue * 100).toFixed(1)}%
                <br />
                {normalidade.ehNormal
                  ? "Dados seguem padrão previsível"
                  : "Há casos muito fora do padrão (estados exceção)"}
              </>
            ) : (
              "Dados insuficientes"
            )}
          </div>
          <div className="analise-nota">
            Esperado: Não normal (estados grandes sempre são exceção)
          </div>
        </div>

        {/* R² da Regressão */}
        <div className="analise-box">
          <div className="analise-label">
            <Tooltip
              texto="R² (Poder Explicativo)"
              explicacao="Mostra quanto a população explica a diferença entre estados. 80% = população explica 80% da distribuição."
            />
          </div>
          <div className="analise-value">
            {regressao ? (regressao.r2 * 100).toFixed(1) : 0}%
          </div>
          <div className="analise-sub">
            {regressao && regressao.r2 > 0.7 && (
              <>
                ✅ Modelo faz sentido
                <br />
                População explica bem a distribuição
              </>
            )}
            {regressao && regressao.r2 > 0.4 && regressao.r2 <= 0.7 && (
              <>
                ⚠️ Modelo parcial
                <br />
                Outros fatores também interferem
              </>
            )}
            {regressao && regressao.r2 <= 0.4 && (
              <>
                ⚠️ Modelo fraco
                <br />
                Há critérios além de população
              </>
            )}
          </div>
          <div className="analise-nota">
            Esperado: 75% a 85% (população é principal fator)
          </div>
        </div>
      </div>

      {/* Disparidade Regional */}
      <div className="disparidade-section">
        <h3 style={{ marginBottom: 12, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--text)" }}>
          Qual região ganhou mais ou perdeu mais?
        </h3>
        <div className="disparidade-grid">
          {disparidade.map((r) => (
            <div key={r.regiao} className="disparidade-card">
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                {r.regiao}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 8 }}>
                Média por pessoa: {fmtPerCapita(r.media)}
                <br />
                Variação: {fmtPerCapita(r.desvio)}
              </div>

              {/* Barra visual */}
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: "flex",
                    height: 6,
                    background: "var(--border)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${r.mediaPercentual}%`,
                      background:
                        r.mediaPercentual > 110
                          ? "var(--success)"
                          : r.mediaPercentual > 90
                            ? "var(--accent)"
                            : "var(--error)",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  fontSize: 11,
                  color:
                    r.mediaPercentual > 110
                      ? "var(--success)"
                      : r.mediaPercentual > 90
                        ? "var(--accent)"
                        : "var(--error)",
                  fontWeight: 600,
                }}
              >
                {r.mediaPercentual > 100
                  ? `▲ ${(r.mediaPercentual - 100).toFixed(1)}% acima`
                  : `▼ ${(100 - r.mediaPercentual).toFixed(1)}% abaixo`}{" "}
                da média nacional
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 12 }}>
          <strong>O que significa:</strong> Barras verdes = região recebe bem.
          Barras azuis = alinhada. Barras vermelhas = está ficando para trás.
        </div>
      </div>

      {/* Resumo das conclusões */}
      <div className="conclusoes">
        <h3 style={{ marginBottom: 12, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--text)" }}>
          O que concluímos?
        </h3>
        <ul style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
          {gini < 0.3 && (
            <li>
              ✅ Distribuição equitativa: índice Gini {(gini * 100).toFixed(1)}% mostra que o dinheiro está bem distribuído
            </li>
          )}
          {gini >= 0.3 && (
            <li>
              ⚠️ Concentração detectada: índice Gini {(gini * 100).toFixed(1)}% sugere que alguns estados recebem bem mais que outros
            </li>
          )}
          {Math.abs(correlacao) > 0.8 && (
            <li>
              ✅ Correlação forte: {(correlacao * 100).toFixed(1)}% — estados com mais gente recebem proporcionalmente mais
            </li>
          )}
          {Math.abs(correlacao) <= 0.8 && (
            <li>
              ℹ️ Outros critérios: correlação {(correlacao * 100).toFixed(1)}% indica que além de população, há regras de redistribuição
            </li>
          )}
          {normalidade?.ehNormal ? (
            <li>ℹ️ Dados previsíveis: os números seguem padrão esperado</li>
          ) : (
            <li>⚠️ Dados com exceções: há estados que saem muito do padrão</li>
          )}
          {regressao && regressao.r2 > 0.7 && (
            <li>
              ✅ Modelo válido: R² = {(regressao.r2 * 100).toFixed(1)}% — população explica bem a distribuição
            </li>
          )}
          {regressao && regressao.r2 <= 0.7 && (
            <li>
              ℹ️ Modelo complexo: R² = {(regressao.r2 * 100).toFixed(1)}% — há critérios além de população na distribuição
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
