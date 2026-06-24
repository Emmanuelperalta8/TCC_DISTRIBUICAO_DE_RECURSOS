import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import '../styles/PaginaYTD.css';

const PaginaYTD = () => {
  const [dados, setDados] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mesSelected, setMesSelected] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    carregarDados();
  }, [mesSelected]);

  const carregarDados = async () => {
    setLoading(true);
    setErro(null);

    try {
      // Buscar meses disponíveis
      let query = supabase
        .from('agg_mes_estado')
        .select('mes_referencia')
        .order('mes_referencia', { ascending: false })
        .limit(1);

      const { data: ultimoMes, error: errorUltimo } = await query;

      if (errorUltimo) throw errorUltimo;

      const mes = mesSelected || (ultimoMes?.[0]?.mes_referencia);

      if (!mes) {
        setErro('Nenhum dado disponível. Execute o pipeline mensal primeiro.');
        setLoading(false);
        return;
      }

      // Buscar KPIs do mês selecionado
      const { data: kpis, error: errorKpis } = await supabase
        .from('agg_mes_estado')
        .select('*')
        .eq('mes_referencia', mes)
        .order('valor_ytd', { ascending: false });

      if (errorKpis) throw errorKpis;

      setDados(kpis || []);
      setMesSelected(mes);

      // Calcular resumo nacional
      if (kpis && kpis.length > 0) {
        const totalMes = kpis.reduce((sum, d) => sum + (d.valor_total_mes || 0), 0);
        const totalYtd = kpis.reduce((sum, d) => sum + (d.valor_ytd || 0), 0);
        const populacao = kpis.reduce((sum, d) => sum + (d.populacao_mes || 0), 0);

        setResumo({
          mes: new Date(mes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          totalMes,
          totalYtd,
          perCapitaMes: populacao > 0 ? (totalMes / populacao).toFixed(2) : 0,
          perCapitaYtd: populacao > 0 ? (totalYtd / populacao).toFixed(2) : 0,
          populacao,
          qtdEstados: kpis.length
        });
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setErro('Erro ao carregar dados. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      compactDisplay: 'short'
    }).format(valor || 0);
  };

  const formatarNumero = (valor) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(valor || 0));
  };

  const obterCor = (status) => {
    switch (status) {
      case 'verde':
        return '#10b981';
      case 'amarelo':
        return '#f59e0b';
      case 'vermelho':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="pagina-ytd">
      <header className="header-ytd">
        <h1>📊 KPIs Year-to-Date (YTD)</h1>
        <p>Acompanhamento mensal de transferências federais com indicadores acumulados</p>
      </header>

      {loading && <div className="loading">Carregando dados...</div>}
      {erro && <div className="erro-mensagem">{erro}</div>}

      {resumo && !loading && (
        <>
          <section className="resumo-nacional">
            <h2>Resumo Nacional - {resumo.mes}</h2>
            <div className="cards-resumo">
              <div className="card-resumo">
                <label>Total Mês</label>
                <div className="valor">{formatarMoeda(resumo.totalMes)}</div>
              </div>

              <div className="card-resumo">
                <label>Total YTD</label>
                <div className="valor highlight">{formatarMoeda(resumo.totalYtd)}</div>
              </div>

              <div className="card-resumo">
                <label>Per Capita Mês</label>
                <div className="valor">{formatarMoeda(resumo.perCapitaMes)}</div>
              </div>

              <div className="card-resumo">
                <label>Per Capita YTD</label>
                <div className="valor highlight">{formatarMoeda(resumo.perCapitaYtd)}</div>
              </div>

              <div className="card-resumo">
                <label>População Total</label>
                <div className="valor">{formatarNumero(resumo.populacao)}</div>
              </div>

              <div className="card-resumo">
                <label>Estados com Dados</label>
                <div className="valor">{resumo.qtdEstados} / 27</div>
              </div>
            </div>
          </section>

          <section className="tabela-estados">
            <h2>Detalhamento por Estado</h2>
            <div className="tabela-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>UF</th>
                    <th>Região</th>
                    <th>Valor Mês</th>
                    <th>Valor YTD</th>
                    <th>Per Capita Mês</th>
                    <th>Per Capita YTD</th>
                    <th>Gini</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.map((row, idx) => (
                    <tr key={idx}>
                      <td className="uf-col"><strong>{row.sigla_uf}</strong></td>
                      <td>{row.regiao}</td>
                      <td>{formatarMoeda(row.valor_total_mes)}</td>
                      <td className="highlight">{formatarMoeda(row.valor_ytd)}</td>
                      <td>{formatarMoeda(row.valor_per_capita_mes)}</td>
                      <td className="highlight">{formatarMoeda(row.valor_per_capita_ytd)}</td>
                      <td>{row.indice_gini ? row.indice_gini.toFixed(2) : 'N/A'}</td>
                      <td>
                        <span
                          className="badge-status"
                          style={{ backgroundColor: obterCor(row.status_alerta) }}
                        >
                          {row.status_alerta || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {!loading && dados.length === 0 && !erro && (
        <div className="info-vazia">
          <p>Nenhum dado disponível. Execute o pipeline mensal para gerar os primeiros KPIs.</p>
        </div>
      )}
    </div>
  );
};

export default PaginaYTD;
