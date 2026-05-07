import { useState, useMemo } from "react";
import { useDados } from "./hooks/useDados";
import Header from "./components/Header";
import Filtros from "./components/Filtros";
import KPIs from "./components/KPIs";
import GraficoHistorico from "./components/GraficoHistorico";
import GraficoRegioes from "./components/GraficoRegioes";
import GraficoPerCapita from "./components/GraficoPerCapita";
import GraficoTipos from "./components/GraficoTipos";
import RankingEstados from "./components/RankingEstados";
import "./styles/global.css";

export default function App() {
  const [anoSel,    setAnoSel]    = useState(2025);
  const [estadoSel, setEstadoSel] = useState("Todos");
  const [regiaoSel, setRegiaoSel] = useState("Todas");

  const {
    loading, anos, estados,
    dadosCompletos, regioes, historicoTransf, tiposTransf,
  } = useDados(anoSel, estadoSel);

  const dadosFiltrados = useMemo(() => {
    let resultado = dadosCompletos;
    if (estadoSel !== "Todos")
      resultado = resultado.filter((d) => d.sigla_uf === estadoSel);
    if (regiaoSel !== "Todas")
      resultado = resultado.filter((d) => d.regiao === regiaoSel);
    return resultado;
  }, [dadosCompletos, estadoSel, regiaoSel]);

  const handleLimpar = () => {
    setEstadoSel("Todos");
    setRegiaoSel("Todas");
  };

  if (loading && !dadosCompletos.length) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span style={{ color: "var(--text-3)", fontSize: 13 }}>
          Carregando dados...
        </span>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />

      <Filtros
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

      <KPIs
        dadosCompletos={dadosFiltrados}
        anoSel={anoSel}
        estadoSel={estadoSel}
      />

      <div className="grid-2">
        <GraficoHistorico
          historicoTransf={historicoTransf}
          estadoSel={estadoSel}
        />
        <GraficoRegioes regioes={regioes} anoSel={anoSel} />
      </div>

      <div className="grid-2">
        <GraficoPerCapita
          dadosCompletos={dadosFiltrados}
          anoSel={anoSel}
          estadoSel={estadoSel}
        />
        <GraficoTipos tiposTransf={tiposTransf} anoSel={anoSel} />
      </div>

      <RankingEstados dadosCompletos={dadosCompletos} anoSel={anoSel} />

      <div className="footer">
        TCC · Emmanuel de Oliveira Peralta Duarte · ULBRA Palmas · Engenharia de Software<br />
        Dados: Tesouro Nacional · IBGE · {new Date().getFullYear()}
      </div>
    </div>
  );
}
