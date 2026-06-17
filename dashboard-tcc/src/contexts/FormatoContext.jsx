import { createContext, useContext, useState } from "react";

const FormatoContext = createContext({ detalhe: false, toggleDetalhe: () => {} });

export function FormatoProvider({ children }) {
  const [detalhe, setDetalhe] = useState(false);
  const toggleDetalhe = () => setDetalhe((v) => !v);
  return (
    <FormatoContext.Provider value={{ detalhe, toggleDetalhe }}>
      {children}
    </FormatoContext.Provider>
  );
}

export const useFormato = () => useContext(FormatoContext);
