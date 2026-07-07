import Tooltip from "./Tooltip";

const EXPLICACAO = "Projeção IBGE — ainda não recalibrada pelo Censo 2022. Tende a ficar cerca de 3% acima da Estimativa anual do IBGE.";

/**
 * Sinaliza quando a população de um ano vem de "IBGE Projeção" (tabela SIDRA
 * 7358, ainda não recalibrada pelo Censo 2022) em vez de "IBGE Estimativa" —
 * os dois são oficiais, mas divergem ~3% entre si e não dá pra comparar
 * anos de fontes diferentes sem essa ressalva.
 */
export default function IndicadorFontePop({ fontePop }) {
  if (!fontePop || fontePop === "IBGE Estimativa") return null;

  return (
    <Tooltip explicacao={EXPLICACAO} posicao="top">
      <span
        aria-label={`Fonte: ${fontePop}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "var(--warning-light)",
          color: "var(--warning)",
          fontSize: 10,
          fontWeight: 800,
          fontStyle: "italic",
          lineHeight: 1,
          marginLeft: 5,
          verticalAlign: "middle",
          textDecoration: "none",
        }}
      >
        i
      </span>
    </Tooltip>
  );
}
