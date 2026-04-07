import { useState, useMemo } from "react";
import { useDados } from "./hooks/useDados";
import Header from "./components/Header";
import Filtros from "./components/Filtros";
import KPIs from "./components/KPIs";
import GraficoEstados from "./components/GraficoEstados";
import GraficoRegioes from "./components/GraficoRegioes";
import GraficoHistorico from "./components/GraficoHistorico";
import GraficoPerCapita from "./components/GraficoPerCapita";
import GraficoTipos from "./components/GraficoTipos";
import RankingEstados from "./components/RankingEstados";
import "./styles/global.css";

export default function App() {
  const [anoSel,    setAnoSel]    = useState(2025);
  const [estadoSel, setEstadoSel] = useState("Todos");

  const { loading, anos, estados, dadosCompletos, regioes, historicoPop } = useDados(anoSel);

  // Quando anos carregarem, atualiza para o mais recente
  const anoAtivo = anos.length ? Math.max(...anos) : anoSel;

  const handleAnoChange = (ano) => setAnoSel(ano);

  const dadosFiltrados = useMemo(() => {
    if (estadoSel === "Todos") return dadosCompletos;
    return dadosCompletos.filter((d) => d.sigla_uf === estadoSel);
  }, [dadosCompletos, estadoSel]);

  if (loading && !dadosCompletos.length) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span style={{ color: "var(--muted)", fontSize: 13 }}>Carregando dados do IBGE...</span>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />

      <Filtros
        anos={anos}
        anoSel={anoSel}
        setAnoSel={handleAnoChange}
        estados={estados}
        estadoSel={estadoSel}
        setEstadoSel={setEstadoSel}
        loading={loading}
      />

      <KPIs dadosCompletos={dadosFiltrados} anoSel={anoSel} estadoSel={estadoSel} />

      <GraficoEstados dadosCompletos={dadosFiltrados} anoSel={anoSel} estadoSel={estadoSel} />

      <div className="grid-2">
        <GraficoHistorico historicoPop={historicoPop} />
        <GraficoRegioes regioes={estadoSel === "Todos" ? regioes : regioes} anoSel={anoSel} />
      </div>

      <div className="grid-2">
        <GraficoPerCapita />
        <GraficoTipos />
      </div>

      <RankingEstados dadosCompletos={dadosCompletos} anoSel={anoSel} />

      <div style={{ textAlign: "center", padding: "32px 0 16px", color: "var(--muted)", fontSize: 11 }}>
        TCC · Emmanuel de Oliveira Peralta Duarte · ULBRA Palmas · Engenharia de Software · {new Date().getFullYear()}
      </div>
    </div>
  );
}