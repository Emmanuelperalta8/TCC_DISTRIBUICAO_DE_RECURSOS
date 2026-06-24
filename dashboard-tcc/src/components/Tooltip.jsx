import { useState, useRef, useEffect } from "react";
import "../styles/tooltip.css";

/**
 * Componente Tooltip reutilizável
 * Uso:
 * <Tooltip texto="Gini" explicacao="Mede desigualdade" />
 *
 * Ou com children customizado:
 * <Tooltip explicacao="Seu texto">
 *   <span>Clique aqui</span>
 * </Tooltip>
 */
export default function Tooltip({
  texto = "",
  explicacao = "",
  children = null,
  posicao = "top", // top, bottom
}) {
  const [mostrar, setMostrar] = useState(false);
  const [posicaoFinal, setPosicaoFinal] = useState(posicao);
  const triggerRef = useRef(null);
  const popupRef = useRef(null);

  // Detectar se tooltip sai da tela
  useEffect(() => {
    if (!mostrar || !popupRef.current || !triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popupRect = popupRef.current.getBoundingClientRect();

    // Se tooltip sai do topo, colocar embaixo
    if (popupRect.top < 0 && posicaoFinal === "top") {
      setPosicaoFinal("bottom");
    }
    // Se sai do bottom, colocar no topo
    else if (popupRect.bottom > window.innerHeight && posicaoFinal === "bottom") {
      setPosicaoFinal("top");
    }
  }, [mostrar, posicaoFinal]);

  const mostrarTexto = children || `${texto} ?`;

  return (
    <div className="tooltip-wrapper">
      <button
        ref={triggerRef}
        className="tooltip-trigger"
        onMouseEnter={() => setMostrar(true)}
        onMouseLeave={() => setMostrar(false)}
        onFocus={() => setMostrar(true)}
        onBlur={() => setMostrar(false)}
        aria-label={`Informação: ${explicacao}`}
        type="button"
      >
        {mostrarTexto}
      </button>

      {mostrar && (
        <div
          ref={popupRef}
          className={`tooltip-popup tooltip-${posicaoFinal}`}
          role="tooltip"
          aria-hidden={!mostrar}
        >
          <div className="tooltip-content">{explicacao}</div>
          <div className="tooltip-arrow" />
        </div>
      )}
    </div>
  );
}
