import { useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
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
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const popupRef = useRef(null);

  // Calcula a posição em coordenadas fixas (viewport) via portal, pra não
  // depender de nenhum ancestral — cards com overflow:hidden (usado pro
  // ::before colorido) cortavam o popup quando ele era position:absolute
  // dentro da hierarquia normal.
  useLayoutEffect(() => {
    if (!mostrar) {
      setCoords(null);
      return;
    }
    if (!triggerRef.current || !popupRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popupRect = popupRef.current.getBoundingClientRect();
    const margem = 8;

    let posicaoFinal = posicao;
    if (posicaoFinal === "top" && triggerRect.top - popupRect.height - margem < 0) {
      posicaoFinal = "bottom";
    } else if (posicaoFinal === "bottom" && triggerRect.bottom + popupRect.height + margem > window.innerHeight) {
      posicaoFinal = "top";
    }

    setCoords({
      left: triggerRect.left + triggerRect.width / 2,
      top: posicaoFinal === "top"
        ? triggerRect.top - popupRect.height - margem
        : triggerRect.bottom + margem,
      posicaoFinal,
    });
  }, [mostrar, posicao]);

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

      {mostrar && createPortal(
        <div
          ref={popupRef}
          className={`tooltip-popup tooltip-${coords?.posicaoFinal ?? posicao}`}
          role="tooltip"
          aria-hidden={!mostrar}
          style={{
            position: "fixed",
            top: coords ? coords.top : -9999,
            left: coords ? coords.left : -9999,
            bottom: "auto",
            visibility: coords ? "visible" : "hidden",
          }}
        >
          <div className="tooltip-content">{explicacao}</div>
          <div className="tooltip-arrow" />
        </div>,
        document.body
      )}
    </div>
  );
}
