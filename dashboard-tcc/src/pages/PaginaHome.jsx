import { useState } from "react";

const ABAS = [
  {
    id: "visao-geral",
    label: "Visão Geral",
    tagline: "KPIs e série histórica",
    cor: "#1351B4",
    bg: "#EFF4FF",
    resumo: "Números gerais do Brasil: total repassado, variação anual e histórico desde 2016.",
    descricao: "É a tela principal. Você vê quanto o governo federal transferiu no total naquele ano, se aumentou ou diminuiu em relação ao anterior e quanto isso representa por habitante. Tem também o gráfico com a evolução desde 2016, onde dá pra ver o impacto da pandemia em 2020 e as variações nos anos seguintes com bastante clareza.",
    fontes: [
      {
        nome: "STN/SICONFI",
        detalhe: "Transferências consolidadas por estado e ano, coletadas da API pública do Tesouro Nacional.",
      },
      {
        nome: "IBGE",
        detalhe: "Estimativas populacionais anuais por estado, usadas para calcular os valores per capita.",
      },
    ],
    periodo: { min: 2016, max: 2025 },
    calculos: [
      { formula: "Total nacional = Σ transferido (todos os estados)", desc: "Soma de todos os repasses do ano para os 27 estados." },
      { formula: "Variação % = (atual − anterior) / anterior × 100", desc: "Crescimento ou queda do total em relação ao ano anterior." },
      { formula: "Per capita = total / população estimada", desc: "Valor médio transferido por habitante no Brasil naquele ano." },
    ],
    tutorial: [
      "Mude o ANO na barra lateral para navegar entre 2016 e 2025.",
      "O badge verde ou vermelho ao lado dos números mostra a variação em relação ao ano anterior.",
      "Passe o mouse no gráfico de linha para ver os valores de cada ano.",
      "Filtre por REGIÃO ou ESTADO para ver a série histórica de um recorte específico.",
    ],
  },
  {
    id: "regioes",
    label: "Por Região",
    tagline: "Distribuição regional",
    cor: "#C96A00",
    bg: "#FFF7ED",
    resumo: "Compara as cinco regiões: total absoluto, per capita e participação no montante nacional.",
    descricao: "Uma das comparações mais reveladoras do dashboard. O Nordeste e o Norte recebem muito mais por habitante do que o Sudeste, o que é esperado pelo critério redistributivo do FPE, mas o Sudeste ainda domina no total absoluto por causa do tamanho da sua população. Vale explorar com o filtro de região para ver o detalhe de cada estado.",
    fontes: [
      {
        nome: "STN/SICONFI",
        detalhe: "Os dados por estado são agrupados por região conforme a tabela de estados cadastrada no banco.",
      },
      {
        nome: "IBGE",
        detalhe: "População regional calculada somando as estimativas estaduais de cada ano.",
      },
    ],
    periodo: { min: 2016, max: 2025 },
    calculos: [
      { formula: "Total da região = Σ transferido (estados da região)", desc: "Soma de todos os repasses para os estados daquela região." },
      { formula: "Per capita regional = total da região / população da região", desc: "Valor médio por habitante dentro da região." },
      { formula: "Participação % = total da região / total nacional × 100", desc: "Quanto cada região representa do total distribuído no país." },
    ],
    tutorial: [
      "O gráfico de barras compara as regiões pelo total absoluto. Alterne para 'Per capita' para ver a ordem mudar.",
      "Norte e Nordeste costumam liderar o per capita, reflexo do critério redistributivo das transferências constitucionais.",
      "Selecione uma REGIÃO na barra lateral para ver só os estados dela nas outras abas.",
    ],
  },
  {
    id: "estados",
    label: "Por Estado",
    tagline: "Per capita e ranking",
    cor: "#4338CA",
    bg: "#EEF2FF",
    resumo: "Ranking dos 27 estados com valores absolutos e por habitante de transferências federais.",
    descricao: "Essa aba tem uma coisa interessante: quando você alterna de valor absoluto para per capita, o ranking vira completamente. São Paulo lidera no total porque tem 46 milhões de habitantes, mas Roraima e Amapá aparecem no topo por habitante porque têm populações pequenas e recebem repasses relativamente altos. Esse contraste é um dos pontos centrais do trabalho.",
    fontes: [
      {
        nome: "STN/SICONFI",
        detalhe: "Total de transferências por estado e ano, consolidado no banco de dados do projeto.",
      },
      {
        nome: "IBGE",
        detalhe: "Estimativas populacionais por estado e ano. 2022 usa o Censo; os outros anos usam as projeções intercensitárias do IBGE.",
      },
    ],
    periodo: { min: 2016, max: 2025 },
    calculos: [
      { formula: "Per capita = valor transferido / população do estado", desc: "Transferências divididas pela população estimada naquele ano." },
      { formula: "Ranking absoluto → decrescente por valor total", desc: "SP, MG e RJ lideram por tamanho absoluto." },
      { formula: "Ranking per capita → decrescente por valor/habitante", desc: "RR e AP frequentemente aparecem no topo." },
    ],
    tutorial: [
      "Por padrão o ranking ordena pelo total. Clique em 'Per capita' para ver a ordenação por habitante.",
      "Roraima e Amapá aparecem no topo do per capita porque têm populações pequenas e recebem repasses proporcionalmente altos.",
      "Use o filtro de REGIÃO para comparar só os estados de uma mesma região.",
    ],
  },
  {
    id: "tipos",
    label: "Tipos de Repasse",
    tagline: "Modalidades de transferência",
    cor: "#7C3AED",
    bg: "#F5F3FF",
    resumo: "FPE, FPM, Lei Kandir, CIDE, Royalties: quem recebe o quê e quanto.",
    descricao: "Nem toda transferência federal funciona da mesma forma. O FPE (Fundo de Participação dos Estados) é o maior repasse e segue um critério redistributivo definido em lei. Já os Royalties de petróleo dependem de onde o recurso é extraído, por isso Rio de Janeiro e Espírito Santo recebem muito mais nessa modalidade do que outros. Aqui você consegue ver a composição exata de cada estado.",
    fontes: [
      {
        nome: "STN/SICONFI",
        detalhe: "Tabela com granularidade por estado, ano e tipo de transferência, coletada da API do Tesouro Nacional.",
      },
    ],
    periodo: { min: 2016, max: 2025 },
    calculos: [
      { formula: "Participação do tipo = valor do tipo / total × 100", desc: "Quanto cada modalidade representa do total recebido." },
      { formula: "Ranking de tipos → decrescente por valor total", desc: "FPE historicamente concentra a maior fatia." },
    ],
    tutorial: [
      "O gráfico de pizza mostra a composição dos repasses por modalidade para o filtro selecionado.",
      "Filtre por um estado produtor de petróleo (como RJ ou ES) para ver o peso dos Royalties.",
      "A tabela abaixo traz uma descrição curta de cada tipo e a base legal correspondente.",
    ],
  },
  {
    id: "comparacao",
    label: "Comparação Fiscal",
    tagline: "Transferências vs. despesas",
    cor: "#166534",
    bg: "#F0FDF4",
    novo: true,
    resumo: "Quanto das despesas de cada estado é coberto por transferências federais.",
    descricao: "Essa foi a aba mais trabalhosa. Os dados de despesas exigiram uma coleta separada no SICONFI, usando o RREO (Relatório Resumido da Execução Orçamentária) de cada estado, especificamente o 6º bimestre, que acumula o ano inteiro. Com isso calculei o Índice de Dependência Fiscal: quanto por cento dos gastos do governo estadual vem de repasses federais. Amapá e Roraima costumam passar dos 60%.",
    fontes: [
      {
        nome: "STN/SICONFI - RREO Anexo 1",
        detalhe: "Relatório Resumido da Execução Orçamentária, 6º bimestre. Conta 'TOTAL DAS DESPESAS (XII)', coluna 'Despesas Liquidadas Até o Bimestre'. API pública do SICONFI.",
      },
      {
        nome: "STN/SICONFI (transferências)",
        detalhe: "O mesmo conjunto de dados das outras abas, com o total transferido por estado e ano.",
      },
    ],
    periodo: { min: 2016, max: 2025 },
    calculos: [
      { formula: "Índice de Dependência = (transferências / despesas liquidadas) × 100", desc: "Percentual das despesas estaduais coberto pelos repasses federais." },
      { formula: "Despesa per capita = despesas liquidadas / população", desc: "Quanto o governo estadual gastou por habitante naquele ano." },
      { formula: "Transferência per capita = transferências / população", desc: "Quanto o estado recebeu de repasses federais por habitante." },
    ],
    tutorial: [
      "Na visão 'Per capita' as barras azul (transferências) e roxo (despesas) aparecem lado a lado por estado.",
      "Na visão 'Dependência Fiscal' as barras ficam coloridas: verde é baixa dependência, âmbar é média e vermelho é alta.",
      "Estados do Norte e Nordeste costumam ter índice mais alto, pois gastam relativamente pouco com recursos próprios.",
      "Roraima e Amapá costumam passar dos 60%, o que significa que mais da metade dos seus gastos vem de Brasília.",
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
    <div className="page">

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
            TCC: Dados 100% Reais
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.25, marginBottom: 10 }}>
            Dashboard de Distribuição de Recursos Federais
          </h1>
          <p style={{ fontSize: 13.5, opacity: 0.85, lineHeight: 1.7, marginBottom: 28, textAlign: "justify" }}>
            Esse dashboard foi desenvolvido como TCC em Engenharia de Software na ULBRA Palmas.
            A ideia foi cruzar dados públicos do Tesouro Nacional com estimativas do IBGE para
            entender como o dinheiro federal chega nos estados e se essa divisão é proporcional
            quando você olha por habitante.
          </p>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {[
              ["Período", "2016 – 2025"],
              ["Estados", "27 UFs + DF"],
              ["Fonte", "STN / SICONFI"],
              ["Autor", "Emmanuel O. P. Duarte"],
              ["Curso", "Eng. de Software · ULBRA Palmas"],
            ].map(([k, v]) => (
              <div key={k} style={{ minWidth: 90 }}>
                <div style={{ fontSize: 10, opacity: 0.65, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 3 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid de seções ────────────────────────────── */}
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4, paddingLeft: 12, borderLeft: "3px solid var(--accent)" }}>
          O que tem aqui
        </h2>
        <p style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 20 }}>
          Clique em qualquer seção para ver de onde vêm os dados, como os cálculos funcionam e dicas de uso.
        </p>

        <div className="home-cards">
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
                    background: ativo ? "rgba(255,255,255,0.9)" : "#166534",
                    color: ativo ? "#166534" : "#fff",
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
                <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{aba.label}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 3 }}>{aba.tagline}</div>
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
          <div className="home-panel-body">

            {/* coluna esquerda */}
            <div>
              {/* descrição */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  O que é
                </div>
                <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.7, textAlign: "justify" }}>{aba.descricao}</p>
              </div>

              {/* período */}
              <div style={{
                background: "var(--surface-2)",
                borderRadius: 10, padding: "14px 16px",
                display: "flex", gap: 32, marginBottom: 24,
              }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Desde</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: aba.cor }}>{aba.periodo.min}</div>
                </div>
                <div style={{ width: 1, background: "var(--border)" }} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Até</div>
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
                  De onde vêm os dados
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {aba.fontes.map((f) => (
                    <div key={f.nome} style={{
                      border: "1px solid var(--border)",
                      borderRadius: 10, padding: "12px 14px",
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: aba.cor, marginBottom: 4 }}>{f.nome}</div>
                      <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, textAlign: "justify" }}>{f.detalhe}</div>
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
                  Como é calculado
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
                      <div style={{ fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.5, textAlign: "justify" }}>{c.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* tutorial */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                  Dicas de uso
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
                      <p style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.6, margin: 0, textAlign: "justify" }}>{t}</p>
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
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 16, paddingLeft: 12, borderLeft: "3px solid var(--accent)" }}>
          Escolhas metodológicas
        </h2>
        <div className="home-notas">
          {[
            { titulo: "Por que começa em 2016?", texto: "Antes disso os dados no SICONFI não estavam organizados com a estrutura atual do PCASP, então a série histórica ficaria inconsistente." },
            { titulo: "Por que vai até 2025?", texto: "O RREO do 6º bimestre (ano completo) é publicado pelos estados em janeiro/fevereiro do ano seguinte. O dado de 2025 já estava disponível quando esse trabalho foi concluído." },
            { titulo: "O que são Despesas Liquidadas?", texto: "É o estágio em que o serviço foi entregue e a dívida reconhecida, ou seja, gasto real, não só comprometido. É o indicador mais usado pra medir o que um governo efetivamente gastou." },
            { titulo: "Sobre as despesas intra-orçamentárias", texto: "O total de despesas usa a conta que já consolida tudo (extra e intra-orçamentárias juntas), evitando contar o mesmo gasto duas vezes." },
            { titulo: "Quais transferências estão incluídas?", texto: "Só as constitucionais e legais: FPE, FPM, IPI-Exportação, CIDE, Lei Kandir e Royalties. Convênios e emendas parlamentares ficaram fora do escopo." },
            { titulo: "De onde vem a população?", texto: "Estimativas anuais do IBGE. O ano de 2022 usa o Censo; os demais usam as projeções intercensitárias oficiais." },
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
              <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, paddingLeft: 21, textAlign: "justify" }}>{n.texto}</div>
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
        <div>TCC em Engenharia de Software · ULBRA Palmas · 2025</div>
        <div>Todos os dados são públicos e vêm diretamente de fontes oficiais do Governo Federal.</div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .home-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 12px;
        }
        .home-panel-body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          padding: 28px 28px 32px;
        }
        .home-notas {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
        }
        @media (max-width: 900px) {
          .home-panel-body { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .home-cards { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

    </div>
  );
}
