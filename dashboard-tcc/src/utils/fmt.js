/**
 * Formata valor monetário em BRL.
 *
 * @param {number} v       - Valor em reais
 * @param {boolean} detalhe - false → compacto (R$ 1,5 bi); true → número completo
 */
export function fmtBRL(v, detalhe = false) {
  const n = Number(v) || 0;
  if (detalhe) {
    return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (n >= 1e9)
    return `R$ ${(n / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} bi`;
  if (n >= 1e6)
    return `R$ ${(n / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`;
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Sempre compacto — usar em eixos de gráfico onde espaço é limitado. */
export function fmtBRLCompact(v) {
  const n = Number(v) || 0;
  if (n >= 1e9)
    return `R$ ${(n / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} bi`;
  if (n >= 1e6)
    return `R$ ${(n / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`;
  return `R$ ${n.toLocaleString("pt-BR")}`;
}

export const fmtPerCapita = (v) =>
  `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtPop = (v) =>
  Number(v) >= 1e6
    ? `${(Number(v) / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi hab.`
    : `${Number(v).toLocaleString("pt-BR")} hab.`;

export const fmtPct = (v) =>
  `${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
