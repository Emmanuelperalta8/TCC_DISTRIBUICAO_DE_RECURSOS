import { useState, useMemo } from "react";
import { useDados } from "./hooks/useDados";
import Sidebar from "./components/Sidebar";
import PaginaVisaoGeral from "./pages/PaginaVisaoGeral";
import PaginaRegioes from "./pages/PaginaRegioes";
import PaginaEstados from "./pages/PaginaEstados";
import PaginaTipos from "./pages/PaginaTipos";
import "./styles/global.css";

export default function App() {
  const [pagina,    setPagina]    = useState("visao-geral");
  const [anoSel,    setAnoSel]    = useState(2025);
  const [estadoSel, setEstadoSel] = useState("Todos");
  const [regiaoSel, setRegiaoSel] = useState("Todas");

  const {
    loading, anos, estados,
    dadosCompletos, regioes, historicoTransf, tiposTransf,
  } = useDados(anoSel, estadoSel, regiaoSel);

  // dadosFiltrados: responde ao filtro de região e estado (para gráficos por estado)
  const dadosFiltrados = useMemo(() => {
    let r = dadosCompletos;
    if (estadoSel !== "Todos") r = r.filter((d) => d.sigla_uf === estadoSel);
    if (regiaoSel !== "Todas") r = r.filter((d) => d.regiao === regiaoSel);
    return r;
  }, [dadosCompletos, estadoSel, regiaoSel]);

  const handleLimpar = () => {
    setEstadoSel("Todos");
    setRegiaoSel("Todas");
  };

  const paginaProps = {
    dadosCompletos:  dadosFiltrados,
    dadosNacionais:  dadosCompletos,
    regioes,
    historicoTransf,
    tiposTransf,
    anoSel,
    estadoSel,
    regiaoSel,
    loading,
  };

  return (
    <div className="app-layout">
      <Sidebar
        pagina={pagina}
        setPagina={setPagina}
        anos={anos}
        anoSel={anoSel}
        setAnoSel={setAnoSel}
        estados={estados}
        estadoSel={estadoSel}
        setEstadoSel={setEstadoSel}
        regiaoSel={regiaoSel}
        setRegiaoSel={setRegiaoSel}
        onLimpar={handleLimpar}
        loading={loading}
      />

      <main className="page-content">
        {loading && !dadosCompletos.length ? (
          <div className="loading">
            <div className="spinner" />
            <span style={{ color: "var(--text-3)", fontSize: 13 }}>
              Carregando dados...
            </span>
          </div>
        ) : pagina === "visao-geral" ? (
          <PaginaVisaoGeral {...paginaProps} />
        ) : pagina === "regioes" ? (
          <PaginaRegioes {...paginaProps} />
        ) : pagina === "estados" ? (
          <PaginaEstados {...paginaProps} />
        ) : (
          <PaginaTipos {...paginaProps} />
        )}
      </main>
    </div>
  );
}
