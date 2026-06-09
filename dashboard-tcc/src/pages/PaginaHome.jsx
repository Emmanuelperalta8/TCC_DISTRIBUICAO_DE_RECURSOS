const ABAS = [
  {
    id: "visao-geral",
    label: "Visão Geral",
    cor: "#1351B4",
    descricao:
      "Painel consolidado com os principais indicadores nacionais de transferências constitucionais. Apresenta o total transferido no ano selecionado, evolução histórica em série temporal, variação ano a ano e distribuição por região.",
    dados: "STN — Sistema de Informações Contábeis e Fiscais (SICONFI)",
    calculos: [
      "Total transferido = soma de todas as transferências do ano selecionado",
      "Variação % = (valor atual − valor anterior) / valor anterior × 100",
      "Série histórica = agregação anual de todos os estados",
    ],
  },
  {
    id: "regioes",
    label: "Por Região",
    cor: "#C96A00",
    descricao:
      "Compara as cinco regiões brasileiras quanto ao volume total recebido, valor per capita e participação percentual no total nacional. Permite identificar assimetrias regionais na distribuição dos recursos federais.",
    dados: "STN — SICONFI (transferências) · IBGE — Estimativas Populacionais (população)",
    calculos: [
      "Per capita regional = total transferido à região / população da região",
      "Participação % = total da região / total nacional × 100",
    ],
  },
  {
    id: "estados",
    label: "Por Estado",
    cor: "#4338CA",
    descricao:
      "Ranking dos 27 estados e o Distrito Federal com valores absolutos e per capita. Mostra quais unidades federativas recebem mais recursos em termos absolutos e relativos à sua população.",
    dados: "STN — SICONFI (transferências) · IBGE — Estimativas Populacionais (população)",
    calculos: [
      "Per capita = valor transferido ao estado / população estimada do estado",
      "Ranking absoluto = ordenação decrescente pelo valor total recebido",
      "Ranking per capita = ordenação decrescente pelo valor por habitante",
    ],
  },
  {
    id: "tipos",
    label: "Tipos de Repasse",
    cor: "#7C3AED",
    descricao:
      "Detalha as modalidades de transferência constitucional — FPE, FPM, Lei Kandir, CIDE, Royalties de Petróleo e outras. Cada modalidade possui base legal específica que define os critérios de partilha entre os entes federados.",
    dados: "STN — SICONFI · fato_transferencias (granularidade por tipo e estado)",
    calculos: [
      "Participação do tipo = valor do tipo / total nacional × 100",
      "Distribuição pode ser filtrada por estado ou região individualmente",
    ],
  },
  {
    id: "comparacao",
    label: "Comparação Fiscal",
    cor: "#166534",
    descricao:
      "Confronta o total de transferências recebidas da União com o total de despesas liquidadas pelo próprio governo estadual. Calcula o Índice de Dependência Fiscal — quanto das despesas do estado são financiadas por transferências federais.",
    dados:
      "STN — SICONFI RREO Anexo 1 (despesas liquidadas, 6º bimestre) · STN — SICONFI (transferências recebidas)",
    calculos: [
      "Índice de Dependência Fiscal = (transferências recebidas / despesas liquidadas) × 100",
      "Despesa per capita = despesas liquidadas / população estimada",
      "Transferência per capita = transferências recebidas / população estimada",
      "Despesas Liquidadas = estágio em que o serviço foi entregue e a dívida reconhecida (Lei 4.320/1964, art. 63)",
    ],
  },
];

const FONTES = [
  {
    nome: "STN — SICONFI",
    descricao: "Sistema de Informações Contábeis e Fiscais do Setor Público Brasileiro",
    url: "https://siconfi.tesouro.gov.br",
    uso: "Transferências constitucionais e despesas liquidadas dos governos estaduais",
    acesso: "API pública, sem autenticação",
  },
  {
    nome: "IBGE",
    descricao: "Instituto Brasileiro de Geografia e Estatística",
    url: "https://ibge.gov.br",
    uso: "Estimativas populacionais anuais por estado (Censo e projeções intercensitárias)",
    acesso: "Dados públicos",
  },
];

function IconeAba({ id }) {
  const s = { width: 20, height: 20, flexShrink: 0 };
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
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

export default function PaginaHome({ setPagina }) {
  return (
    <div className="page" style={{ maxWidth: 940, margin: "0 auto" }}>

      {/* ── Hero ──────────────────────────────────────── */}
      <div style={{
        background: "var(--accent)",
        borderRadius: 16,
        padding: "40px 48px",
        color: "#fff",
        marginBottom: 36,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.06,
          backgroundImage: "radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)",
        }} />
        <div style={{ position: "relative" }}>
          <div style={{
            display: "inline-block",
            background: "rgba(255,255,255,0.18)",
            borderRadius: 6,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}>
            Trabalho de Conclusão de Curso — Dados Reais
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 12 }}>
            Dashboard de Distribuição de<br />Recursos Federais
          </h1>
          <p style={{ fontSize: 14, opacity: 0.88, maxWidth: 560, lineHeight: 1.6, marginBottom: 24 }}>
            Ferramenta analítica desenvolvida como TCC do curso de Engenharia de Software — ULBRA Palmas.
            Consolida dados oficiais do Tesouro Nacional e do IBGE para analisar como os recursos federais
            são distribuídos entre os estados e se essa distribuição é proporcional às suas necessidades.
          </p>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { label: "Período coberto", valor: "2016 – 2024" },
              { label: "Estados analisados", valor: "27 UFs + DF" },
              { label: "Fonte principal", valor: "STN / SICONFI" },
              { label: "Autor", valor: "Emmanuel O. P. Duarte" },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{item.valor}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Páginas ───────────────────────────────────── */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>
        O que você encontra em cada seção
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
        {ABAS.map((aba) => (
          <button
            key={aba.id}
            onClick={() => setPagina(aba.id)}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "20px 22px",
              textAlign: "left",
              cursor: "pointer",
              transition: "box-shadow 0.15s, border-color 0.15s",
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "0 16px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(19,81,180,0.10)";
              e.currentTarget.style.borderColor = aba.cor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            {/* ícone */}
            <div style={{
              width: 40, height: 40,
              background: `${aba.cor}15`,
              borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: aba.cor,
              gridRow: "1 / 3",
              alignSelf: "start",
              marginTop: 2,
            }}>
              <IconeAba id={aba.id} />
            </div>

            {/* título */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{aba.label}</span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: aba.cor,
                background: `${aba.cor}15`,
                borderRadius: 4, padding: "2px 6px",
                textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                {aba.id === "comparacao" ? "RREO + Transferências" :
                 aba.id === "tipos"      ? "Por modalidade" :
                 aba.id === "estados"    ? "27 estados" :
                 aba.id === "regioes"    ? "5 regiões" : "Nacional"}
              </span>
            </div>

            {/* corpo */}
            <div style={{ marginTop: 6 }}>
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 10 }}>
                {aba.descricao}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Fonte ·{" "}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-2)" }}>{aba.dados}</span>
                </div>
              </div>
              <ul style={{ marginTop: 8, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 3 }}>
                {aba.calculos.map((c) => (
                  <li key={c} style={{ fontSize: 11, color: "var(--text-3)", display: "flex", gap: 6 }}>
                    <span style={{ color: aba.cor, fontWeight: 700, flexShrink: 0 }}>f(x)</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </button>
        ))}
      </div>

      {/* ── Fontes de dados ───────────────────────────── */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>
        Fontes de dados
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 40 }}>
        {FONTES.map((f) => (
          <div key={f.nome} className="card">
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", marginBottom: 4 }}>{f.nome}</div>
            <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 8 }}>{f.descricao}</div>
            <div style={{ fontSize: 12, color: "var(--text)", marginBottom: 4 }}>
              <strong>Uso:</strong> {f.uso}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>
              <strong>Acesso:</strong> {f.acesso}
            </div>
          </div>
        ))}
      </div>

      {/* ── Notas metodológicas ───────────────────────── */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>
        Notas metodológicas
      </h2>

      <div className="card" style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            {
              titulo: "Período mínimo",
              texto: "2016 — limite inferior definido pela disponibilidade consistente dos dados de transferências no SICONFI com a estrutura atual do PCASP (Plano de Contas Aplicado ao Setor Público).",
            },
            {
              titulo: "Período máximo",
              texto: "2024 — os dados de despesas estaduais (RREO Anexo 1) são apurados ao final do 6º bimestre de cada exercício (novembro/dezembro). O RREO de 2025 só será publicado em fevereiro de 2026.",
            },
            {
              titulo: "Despesas Liquidadas vs. Pagas",
              texto: "Utilizamos despesas liquidadas (e não pagas) pois representam o compromisso efetivamente reconhecido pelo estado no exercício — conforme Lei 4.320/1964, art. 63. Despesas pagas podem diferir por atrasos de pagamento.",
            },
            {
              titulo: "Intra-orçamentárias",
              texto: "Os totais de despesas incluem operações intra-orçamentárias (conta TOTAL DAS DESPESAS — XII), que consolidam despesas extra e intra-orçamentárias, evitando dupla contagem nos repasses entre órgãos do mesmo governo.",
            },
            {
              titulo: "Transferências consideradas",
              texto: "Abrange transferências constitucionais e legais — FPE, FPM, IPI-Exportação, CIDE-Combustíveis, Lei Kandir (ICMS-Desoneração), Royalties de Petróleo (CFEM/CFURH), entre outras. Não inclui transferências voluntárias (convênios).",
            },
            {
              titulo: "Dados de população",
              texto: "Estimativas populacionais anuais do IBGE. Anos de Censo (2022) usam dado censitário; demais anos usam projeções intercensitárias oficiais.",
            },
          ].map((n) => (
            <div key={n.titulo} style={{ borderLeft: "3px solid var(--accent-dim)", paddingLeft: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>{n.titulo}</div>
              <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>{n.texto}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Rodapé ────────────────────────────────────── */}
      <div style={{
        textAlign: "center",
        padding: "24px 0 8px",
        borderTop: "1px solid var(--border)",
        fontSize: 12,
        color: "var(--text-3)",
        lineHeight: 1.8,
      }}>
        <div>TCC — Engenharia de Software · ULBRA Palmas · 2025</div>
        <div>Emmanuel de Oliveira Peralta Duarte</div>
        <div style={{ marginTop: 4 }}>
          Todos os dados são públicos e provenientes de fontes oficiais do Governo Federal Brasileiro.
        </div>
      </div>

    </div>
  );
}
