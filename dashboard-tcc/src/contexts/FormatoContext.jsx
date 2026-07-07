import { createContext, useContext, useState, useMemo } from "react";

const FormatoContext = createContext({ detalhe: false, toggleDetalhe: () => {}, setDetalhe: () => {} });

export function FormatoProvider({ children }) {
  const [detalhe, setDetalhe] = useState(false);
  const toggleDetalhe = () => setDetalhe((v) => !v);
  const value = useMemo(() => ({ detalhe, toggleDetalhe, setDetalhe }), [detalhe]);
  return (
    <FormatoContext.Provider value={value}>
      {children}
    </FormatoContext.Provider>
  );
}

export const useFormato = () => useContext(FormatoContext);
