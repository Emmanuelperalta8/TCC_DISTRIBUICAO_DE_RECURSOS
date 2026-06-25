import { useState, useMemo, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { FormatoProvider } from "./contexts/FormatoContext";
import { useDados } from "./hooks/useDados";
import Sidebar from "./components/Sidebar";
import ErrorBoundary from "./components/ErrorBoundary";
import PaginaVisaoGeral from "./pages/PaginaVisaoGeral";
import PaginaRegioes from "./pages/PaginaRegioes";
import PaginaEstados from "./pages/PaginaEstados";
import PaginaTipos from "./pages/PaginaTipos";
import PaginaHome from "./pages/PaginaHome";
import PaginaAdmin from "./pages/PaginaAdmin";
import PaginaLogin from "./pages/PaginaLogin";
import PaginaCadastro from "./pages/PaginaCadastro";
import "./styles/global.css";

function ErroConexao({ mensagem, onRetry }) {
  return (
    <div className="error-full" role="alert">
      <div className="error-full-icon">⚠</div>
      <div className="error-full-title">Falha ao carregar dados</div>
      <div className="error-full-msg">{mensagem}</div>
      <button className="error-boundary-btn" onClick={onRetry}>
        Recarregar página
      </button>
    </div>
  );
}

function Dashboard() {
  const { perfil, sair } = useAuth();
  const [pagina, setPagina] = useState("home");
  const [anoSel, setAnoSel] = useState(2025);
  const [estadoSel, setEstadoSel] = useState("Todos");
  const [regiaoSel, setRegiaoSel] = useState("Todas");
  const [mesSel, setMesSel] = useState(null);

  const {
    loading, error, anos, estados,
    dadosCompletos, regioes, historicoTransf, tiposTransf,
  } = useDados(anoSel, estadoSel, regiaoSel, mesSel);

  // Ao carregar os anos disponíveis, ajusta para o mais recente se o padrão não existir
  useEffect(() => {
    if (anos.length > 0 && !anos.includes(anoSel)) {
      setAnoSel(anos[anos.length - 1]);
    }
  }, [anos]);

  const dadosFiltrados = useMemo(() => {
    let r = dadosCompletos;
    if (estadoSel !== "Todos") r = r.filter(d => d.sigla_uf === estadoSel);
    if (regiaoSel !== "Todas") r = r.filter(d => d.regiao === regiaoSel);
    return r;
  }, [dadosCompletos, estadoSel, regiaoSel]);

  if (error) {
    return <ErroConexao mensagem={error} onRetry={() => window.location.reload()} />;
  }

  const paginaProps = {
    dadosCompletos:  dadosFiltrados,
    dadosNacionais:  dadosCompletos,
    estados,
    regioes,
    historicoTransf,
    tiposTransf,
    anoSel,
    estadoSel,
    regiaoSel,
    mesSel,
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
        mesSel={mesSel}
        setMesSel={setMesSel}
        onLimpar={() => { setEstadoSel("Todos"); setRegiaoSel("Todas"); setMesSel(null); }}
        loading={loading}
        perfil={perfil}
        onSair={sair}
      />

      {pagina === "admin" ? (
        <PaginaAdmin />
      ) : (
        <main className="page-content">
          {pagina === "home" ? (
            <ErrorBoundary>
              <PaginaHome setPagina={setPagina} />
            </ErrorBoundary>
          ) : loading && !dadosCompletos.length ? (
            <div className="loading">
              <div className="spinner" />
              <span style={{ color: "var(--text-3)", fontSize: 13 }}>
                Carregando dados…
              </span>
            </div>
          ) : pagina === "visao-geral" ? (
            <ErrorBoundary>
              <PaginaVisaoGeral {...paginaProps} />
            </ErrorBoundary>
          ) : pagina === "regioes" ? (
            <ErrorBoundary>
              <PaginaRegioes {...paginaProps} />
            </ErrorBoundary>
          ) : pagina === "estados" ? (
            <ErrorBoundary>
              <PaginaEstados {...paginaProps} />
            </ErrorBoundary>
          ) : (
            <ErrorBoundary>
              <PaginaTipos {...paginaProps} />
            </ErrorBoundary>
          )}
        </main>
      )}
    </div>
  );
}

function AppInner() {
  const { usuario, carregando } = useAuth();
  const [telaAuth, setTelaAuth] = useState("login");

  if (carregando) {
    return (
      <div className="loading" style={{ height: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!usuario) {
    if (telaAuth === "cadastro") {
      return <PaginaCadastro onIrLogin={() => setTelaAuth("login")} />;
    }
    return <PaginaLogin onIrCadastro={() => setTelaAuth("cadastro")} />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <FormatoProvider>
        <AppInner />
      </FormatoProvider>
    </AuthProvider>
  );
}
