import { useState } from "react";

const ABAS = [
  {
    id: "visao-geral",
    label: "Visão Geral",
    tagline: "KPIs e série histórica",
    cor: "#1351B4",
    bg: "#EFF4FF",
    resumo: "Panorama nacional das transferências federais com indicadores consolidados e evolução temporal.",
    descricao: "Painel principal do dashboard. Apresenta os principais indicadores nacionais de transferências constitucionais para o ano selecionado: total transferido, variação em relação ao ano anterior, valor per capita nacional e distribuição por região. Inclui também a série histórica completa (2016–2024) com gráfico interativo de evolução anual.",
    fontes: [
      {
        nome: "STN — SICONFI",
        detalhe: "Tabela agg_por_estado_ano — agregação anual por estado de todos os repasses registrados no sistema SICONFI do Tesouro Nacional.",
      },
      {
        nome: "IBGE",
        detalhe: "Estimativas populacionais anuais por estado (dim_populacao), usadas para calcular os valores per capita.",
      },
    ],
    periodo: { min: 2016, max: 2024 },
    calculos: [
      { formula: "Total nacional = Σ valor transferido (todos os estados)", desc: "Soma de todos os repasses do ano selecionado para os 27 estados." },
      { formula: "Variação % = (valorAtual − valorAnterior) / valorAnterior × 100", desc: "Crescimento ou redução do montante total em relação ao ano anterior." },
      { formula: "Per capita = total / população estimada", desc: "Valor médio transferido por habitante no Brasil no ano selecionado." },
    ],
    tutorial: [
      "Use o filtro de ANO na sidebar para navegar entre os exercícios de 2016 a 2024.",
      "Os KPIs no topo mostram os totais do ano escolhido. O badge verde/vermelho indica a variação vs. ano anterior.",
      "O gráfico de linha mostra a evolução histórica. Passe o mouse sobre os pontos para ver os valores exatos.",
      "Use o filtro de REGIÃO ou ESTADO para ver a série histórica filtrada.",
    ],
  },
  {
    id: "regioes",
    label: "Por Região",
    tagline: "Distribuição regional",
    cor: "#C96A00",
    bg: "#FFF7ED",
    resumo: "Comparação das 5 regiões brasileiras quanto ao volume e per capita de transferências recebidas.",
    descricao: "Analisa como as transferências constitucionais se distribuem entre as cinco regiões do Brasil: Norte, Nordeste, Sudeste, Sul e Centro-Oeste. Mostra o total absoluto, o valor per capita e a participação percentual de cada região no total nacional. Permite identificar assimetrias regionais e comparar a relação entre tamanho populacional e recursos recebidos.",
    fontes: [
      {
        nome: "STN — SICONFI",
        detalhe: "Transferências agregadas por estado e somadas por região conforme o campo 'regiao' da tabela dim_estado.",
      },
      {
        nome: "IBGE",
        detalhe: "População regional = soma das populações estaduais estimadas para o ano selecionado.",
      },
    ],
    periodo: { min: 2016, max: 2024 },
    calculos: [
      { formula: "Total da região = Σ valor transferido (estados da região)", desc: "Soma de todos os repasses aos estados pertencentes à região." },
      { formula: "Per capita regional = total da região / população da região", desc: "Valor médio por habitante dentro de cada região." },
      { formula: "Participação % = total da região / total nacional × 100", desc: "Peso de cada região no montante total distribuído no país." },
    ],
    tutorial: [
      "O gráfico de barras compara as regiões pelo total absoluto. Clique nas barras para destacar.",
      "Alterne para 'Per capita' para ver qual região recebe mais por habitante — geralmente Norte e Nordeste lideram.",
      "Use o filtro REGIÃO na sidebar para isolar uma região e ver seus estados individualmente nas demais abas.",
    ],
  },
  {
    id: "estados",
    label: "Por Estado",
    tagline: "Per capita e ranking",
    cor: "#4338CA",
    bg: "#EEF2FF",
    resumo: "Ranking dos 27 estados e o DF com valores absolutos e per capita de transferências federais.",
    descricao: "Apresenta o ranking completo dos 27 estados e o Distrito Federal com os valores de transferências recebidas. Permite comparar os estados tanto pelo volume absoluto quanto pelo valor per capita — que revela quais unidades federativas são mais dependentes dos repasses federais em relação à sua população. Inclui mapa de calor e gráfico de barras horizontais.",
    fontes: [
      {
        nome: "STN — SICONFI",
        detalhe: "Tabela agg_por_estado_ano com o total de transferências por estado/ano, previamente calculado pelo ETL.",
      },
      {
        nome: "IBGE",
        detalhe: "dim_populacao com estimativas populacionais por estado e ano. Anos censitários usam dado do Censo; demais usam projeções intercensitárias.",
      },
    ],
    periodo: { min: 2016, max: 2024 },
    calculos: [
      { formula: "Per capita = valor transferido / população estimada", desc: "Transferências recebidas divididas pela população do estado no mesmo ano." },
      { formula: "Ranking absoluto = ordenação decrescente por valor total", desc: "SP, MG e RJ tendem a liderar por tamanho absoluto do orçamento." },
      { formula: "Ranking per capita = ordenação decrescente por valor/habitante", desc: "Estados pequenos do Norte frequentemente lideram o ranking per capita." },
    ],
    tutorial: [
      "Por padrão o ranking ordena pelo valor total. Clique em 'Per capita' para ver a ordenação por habitante.",
      "Estados como Roraima e Amapá aparecem no topo do per capita por terem pequenas populações e receberem repasses proporcionalmente altos.",
      "Use o filtro REGIÃO para comparar apenas os estados de uma região específica.",
    ],
  },
  {
    id: "tipos",
    label: "Tipos de Repasse",
    tagline: "Modalidades de transferência",
    cor: "#7C3AED",
    bg: "#F5F3FF",
    resumo: "Detalhamento por modalidade: FPE, FPM, Lei Kandir, CIDE, Royalties e mais de 20 tipos.",
    descricao: "Detalha as diferentes modalidades de transferência constitucional e legal da União para os estados. Cada tipo possui uma base legal específica que define os critérios de partilha. As principais modalidades são o FPE (Fundo de Participação dos Estados), FPM (Fundo de Participação dos Municípios repassado via estado), IPI-Exportação, CIDE-Combustíveis, Desoneração do ICMS (Lei Kandir) e Royalties de Petróleo e Mineração (CFEM/CFURH).",
    fontes: [
      {
        nome: "STN — SICONFI (fato_transferencias)",
        detalhe: "Tabela com granularidade por estado, ano e tipo de transferência. Permite filtrar por estado ou região para ver a composição específica dos repasses.",
      },
    ],
    periodo: { min: 2016, max: 2024 },
    calculos: [
      { formula: "Participação do tipo = valor do tipo / total de todos os tipos × 100", desc: "Peso relativo de cada modalidade no montante total transferido." },
      { formula: "Ranking de tipos = ordenação decrescente por valor_total", desc: "FPE e FPM concentram historicamente a maior parte dos repasses." },
    ],
    tutorial: [
      "O gráfico de pizza mostra a distribuição por modalidade para o ano e filtro selecionados.",
      "Filtre por estado para ver quais tipos de repasse são mais relevantes para aquela UF (ex: estados produtores de petróleo recebem muito em Royalties).",
      "A tabela abaixo do gráfico exibe a descrição de cada tipo e sua base legal.",
    ],
  },
  {
    id: "comparacao",
    label: "Comparação Fiscal",
    tagline: "Transferências vs. despesas",
    cor: "#166534",
    bg: "#F0FDF4",
    novo: true,
    resumo: "Índice de Dependência Fiscal: quanto das despesas de cada estado é financiado por transferências federais.",
    descricao: "Confronta o total de transferências constitucionais recebidas da União com o total de despesas liquidadas pelo próprio governo estadual. Calcula o Índice de Dependência Fiscal de cada estado — quanto por cento de seu orçamento executado é financiado por repasses federais. Estados com índice acima de 60% são altamente dependentes da União. Também compara os valores per capita de transferências e despesas.",
    fontes: [
      {
        nome: "STN — SICONFI RREO Anexo 1 (fato_despesas_uf)",
        detalhe: "Relatório Resumido da Execução Orçamentária, 6º bimestre (acumulado anual). Conta 'TOTAL DAS DESPESAS (XII)' — coluna 'Despesas Liquidadas Até o Bimestre'. Coletado via API pública do SICONFI.",
      },
      {
        nome: "STN — SICONFI (transferências)",
        detalhe: "Mesmo conjunto de dados das demais abas — agg_por_estado_ano com o valor total transferido por estado e ano.",
      },
    ],
    periodo: { min: 2016, max: 2024 },
    calculos: [
      { formula: "Índice de Dependência = (transferências / despesas liquidadas) × 100", desc: "Percentual das despesas estaduais que é coberto pelos repasses federais." },
      { formula: "Despesa per capita = despesas liquidadas / população estimada", desc: "Total de despesas do governo estadual dividido pela população." },
      { formula: "Transferência per capita = transferências / população estimada", desc: "Repasses federais recebidos divididos pela população do estado." },
    ],
    tutorial: [
      "Na visão 'Per capita' o gráfico agrupa barras azuis (transferências) e roxas (despesas) por estado.",
      "Na visão 'Dependência Fiscal' as barras são coloridas: verde = baixa dependência, âmbar = média, vermelho = alta.",
      "Estados do Norte e Nordeste tendem a ter índice mais alto — recebem proporcionalmente mais do que gastam por conta própria.",
      "Roraima e Amapá frequentemente ultrapassam 60% — mais da metade de seus gastos vem de repasses federais.",
    ],
  },
];

function IconeAba({ id, size = 28 }) {
  const s = { width: size, height: size };
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  if (id === "visao-geral") return (
    <svg {...s} viewBox="0 0 24 24" {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  );
  if (id === "regioes") return (
    <svg {...s} viewBox="0 0 24 24" {...p}>
      <circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>
    </svg>
  );
  if (id === "estados") return (
    <svg {...s} viewBox="0 0 24 24" {...p}>
      <rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="6" width="4" height="15" rx="1"/>
      <rect x="17" y="3" width="4" height="18" rx="1"/>
    </svg>
  );
  if (id === "tipos") return (
    <svg {...s} viewBox="0 0 24 24" {...p}>
      <path d="M9 6h11M9 12h11M9 18h11"/>
      <circle cx="5" cy="6" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="5" cy="18" r="1.2" fill="currentColor" stroke="none"/>
    </svg>
  );
  return (
    <svg {...s} viewBox="0 0 24 24" {...p}>
      <line x1="12" y1="3" x2="12" y2="21"/>
      <path d="M3 9l9-6 9 6"/><path d="M6 12l-3 6h6l-3-6z"/><path d="M18 12l-3 6h6l-3-6z"/>
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

export default function PaginaHome({ setPagina }) {
  const [sel, setSel] = useState(null);

  const aba = ABAS.find((a) => a.id === sel);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>

      {/* ── Hero ──────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #1351B4 0%, #0D3E8A 100%)",
        borderRadius: 16,
        padding: "36px 44px",
        color: "#fff",
        marginBottom: 32,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -40, top: -40, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", right: 60, bottom: -60, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "relative" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 20, padding: "4px 12px",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
            marginBottom: 16,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", display: "inline-block" }} />
            Trabalho de Conclusão de Curso — Dados Reais
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.25, marginBottom: 10 }}>
            Dashboard de Distribuição de Recursos Federais
          </h1>
          <p style={{ fontSize: 13.5, opacity: 0.85, maxWidth: 540, lineHeight: 1.7, marginBottom: 28 }}>
            Ferramenta analítica com dados oficiais do Tesouro Nacional (STN/SICONFI) e do IBGE.
            Analisa como as transferências constitucionais são distribuídas entre os 27 estados
            brasileiros e se essa distribuição é proporcional às necessidades de cada ente federado.
          </p>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {[
              ["Período", "2016 – 2024"],
              ["Estados", "27 UFs + DF"],
              ["Fonte", "STN / SICONFI"],
              ["Autor", "Emmanuel O. P. Duarte"],
              ["Curso", "Eng. de Software · ULBRA Palmas"],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 10, opacity: 0.65, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 3 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid de seções ────────────────────────────── */}
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
          Consultas disponíveis no dashboard
        </h2>
        <p style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 20 }}>
          Clique em uma seção para ver a descrição completa, fontes de dados e tutorial de uso.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 12,
        }}>
          {ABAS.map((a) => {
            const ativo = sel === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setSel(ativo ? null : a.id)}
                style={{
                  background: ativo ? a.cor : "var(--surface)",
                  border: `2px solid ${ativo ? a.cor : "var(--border)"}`,
                  borderRadius: 14,
                  padding: "22px 16px 18px",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.18s",
                  position: "relative",
                  color: ativo ? "#fff" : "var(--text)",
                }}
                onMouseEnter={(e) => {
                  if (!ativo) {
                    e.currentTarget.style.borderColor = a.cor;
                    e.currentTarget.style.background = a.bg;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!ativo) {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "var(--surface)";
                  }
                }}
              >
                {a.novo && (
                  <div style={{
                    position: "absolute", top: 10, right: 10,
                    background: "#166534", color: "#fff",
                    fontSize: 9, fontWeight: 800, letterSpacing: "0.05em",
                    borderRadius: 4, padding: "2px 6px", textTransform: "uppercase",
                  }}>Novo</div>
                )}
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: ativo ? "rgba(255,255,255,0.2)" : a.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 12px",
                  color: ativo ? "#fff" : a.cor,
                }}>
                  <IconeAba id={a.id} size={26} />
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>{a.label}</div>
                <div style={{ fontSize: 11, opacity: ativo ? 0.8 : 0, color: ativo ? "#fff" : "var(--text-3)", transition: "opacity 0.15s" }}>
                  {a.tagline}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Painel de detalhe ─────────────────────────── */}
      {aba && (
        <div style={{
          marginTop: 16,
          background: "var(--surface)",
          border: `2px solid ${aba.cor}`,
          borderRadius: 16,
          overflow: "hidden",
          animation: "fadeIn 0.2s ease",
        }}>
          {/* cabeçalho do painel */}
          <div style={{
            background: aba.cor,
            padding: "20px 28px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", flexShrink: 0,
              }}>
                <IconeAba id={aba.id} size={24} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
                  Seção do Dashboard
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{aba.label}</div>
              </div>
            </div>
            <button
              onClick={() => setPagina(aba.id)}
              style={{
                background: "#fff",
                color: aba.cor,
                border: "none",
                borderRadius: 8,
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
              }}
            >
              Acessar seção <IconArrow />
            </button>
          </div>

          {/* corpo do painel */}
          <div style={{ padding: "28px 28px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>

            {/* coluna esquerda */}
            <div>
              {/* descrição */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Sobre esta seção
                </div>
                <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.7 }}>{aba.descricao}</p>
              </div>

              {/* período */}
              <div style={{
                background: "var(--surface-2)",
                borderRadius: 10, padding: "14px 16px",
                display: "flex", gap: 32, marginBottom: 24,
              }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Período mínimo</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: aba.cor }}>{aba.periodo.min}</div>
                </div>
                <div style={{ width: 1, background: "var(--border)" }} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Período máximo</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: aba.cor }}>{aba.periodo.max}</div>
                </div>
                <div style={{ width: 1, background: "var(--border)" }} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Cobertura</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: aba.cor }}>27 UFs</div>
                </div>
              </div>

              {/* fontes */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                  Fontes de dados
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {aba.fontes.map((f) => (
                    <div key={f.nome} style={{
                      border: "1px solid var(--border)",
                      borderRadius: 10, padding: "12px 14px",
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: aba.cor, marginBottom: 4 }}>{f.nome}</div>
                      <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>{f.detalhe}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* coluna direita */}
            <div>
              {/* cálculos */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                  Cálculos utilizados
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {aba.calculos.map((c) => (
                    <div key={c.formula} style={{
                      background: `${aba.cor}08`,
                      border: `1px solid ${aba.cor}22`,
                      borderRadius: 10, padding: "12px 14px",
                    }}>
                      <div style={{
                        fontFamily: "monospace",
                        fontSize: 12, fontWeight: 700,
                        color: aba.cor, marginBottom: 5,
                        lineHeight: 1.4,
                      }}>
                        {c.formula}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.5 }}>{c.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* tutorial */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                  Como usar
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {aba.tutorial.map((t, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%",
                        background: aba.cor, color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 800, flexShrink: 0, marginTop: 1,
                      }}>{i + 1}</div>
                      <p style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>{t}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setPagina(aba.id)}
                  style={{
                    marginTop: 20,
                    width: "100%",
                    background: aba.cor,
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "12px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  Ir para {aba.label} <IconArrow />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Notas metodológicas (compactas) ──────────── */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>
          Notas metodológicas
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            { titulo: "Período mínimo: 2016", texto: "Limite inferior definido pela disponibilidade consistente dos dados de transferências no SICONFI com a estrutura atual do PCASP." },
            { titulo: "Período máximo: 2024", texto: "O RREO do 6º bimestre de 2025 só será publicado pelos estados em fevereiro de 2026. Dados incompletos não foram incluídos." },
            { titulo: "Despesas Liquidadas", texto: "Estágio em que o serviço foi entregue e a dívida reconhecida (Lei 4.320/1964, art. 63). Superior a 'empenhadas' para análise de gasto efetivo." },
            { titulo: "Intra-orçamentárias", texto: "Os totais de despesas usam a conta TOTAL DAS DESPESAS (XII) que consolida despesas extra e intra-orçamentárias, evitando dupla contagem." },
            { titulo: "Transferências incluídas", texto: "Transferências constitucionais e legais: FPE, FPM, IPI-Exportação, CIDE, Lei Kandir, Royalties. Não inclui transferências voluntárias (convênios)." },
            { titulo: "Dados de população", texto: "Estimativas populacionais anuais do IBGE. Ano de Censo (2022) usa dado censitário; demais anos usam projeções intercensitárias oficiais." },
          ].map((n) => (
            <div key={n.titulo} style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "14px 16px",
            }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ color: "var(--accent)", marginTop: 1, flexShrink: 0 }}><IconCheck /></div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)" }}>{n.titulo}</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, paddingLeft: 21 }}>{n.texto}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Rodapé ────────────────────────────────────── */}
      <div style={{
        textAlign: "center",
        padding: "28px 0 12px",
        marginTop: 36,
        borderTop: "1px solid var(--border)",
        fontSize: 12,
        color: "var(--text-3)",
        lineHeight: 1.9,
      }}>
        <div style={{ fontWeight: 700, color: "var(--text-2)" }}>Emmanuel de Oliveira Peralta Duarte</div>
        <div>TCC — Engenharia de Software · ULBRA Palmas · 2025</div>
        <div>Todos os dados são públicos, provenientes de fontes oficiais do Governo Federal Brasileiro.</div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

    </div>
  );
}
