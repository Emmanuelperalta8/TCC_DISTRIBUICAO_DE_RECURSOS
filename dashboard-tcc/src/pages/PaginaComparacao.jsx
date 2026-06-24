import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend, ReferenceLine,
} from "recharts";
import PageHeader from "../components/PageHeader";
import BotaoExportarCSV from "../components/BotaoExportarCSV";
import { useFormato } from "../contexts/FormatoContext";
import { fmtBRL, fmtPerCapita as fmtPC, fmtPct } from "../utils/fmt";

const CORES = {
  Norte:          "#0077B6",
  Nordeste:       "#C96A00",
  Sudeste:        "#4338CA",
  Sul:            "#7C3AED",
  "Centro-Oeste": "#C2410C",
};


// Cor semântica para o índice de dependência fiscal
function corDependencia(pct) {
  if (pct >= 60) return "#991B1B";   // vermelho: alta dependência
  if (pct >= 40) return "#92400E";   // âmbar: média dependência
  if (pct >= 20) return "#1e5631";   // verde escuro: baixa dependência
  return "#7090AA";                  // cinza: sem dados suficientes
}

const COLUNAS_EXPORT = [
  { key: "sigla_uf",          label: "UF" },
  { key: "nome_estado",       label: "Estado" },
  { key: "regiao",            label: "Região" },
  { key: "populacao",         label: "População" },
  { key: "valor_total",       label: "Transf. Recebida (R$)" },
  { key: "despesa_liquidada", label: "Despesa Liquidada (R$)" },
  { key: "transf_per_capita", label: "Transf. Per Capita (R$)" },
  { key: "desp_per_capita",   label: "Despesa Per Capita (R$)" },
  { key: "dependencia_pct",   label: "Índice Dependência (%)" },
];

function TooltipComparacao({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const transf  = payload.find((p) => p.dataKey === "transf_per_capita");
  const despesa = payload.find((p) => p.dataKey === "desp_per_capita");
  const d = payload[0]?.payload;
  return (
    <div className="tt">
      <div className="tt-label">{label} — {d?.nome_estado}</div>
      <div className="tt-detail" style={{ color: "#1351B4", fontWeight: 700 }}>
        Transf. per capita: {fmtPC(transf?.value ?? 0)}
      </div>
      <div className="tt-detail" style={{ color: "#6B21A8", fontWeight: 700 }}>
        Despesa per capita: {fmtPC(despesa?.value ?? 0)}
      </div>
      {d?.indice_dependencia > 0 && (
        <div className="tt-detail" style={{ color: corDependencia(d.indice_dependencia), marginTop: 4 }}>
          Dependência fiscal: {fmtPct(d.indice_dependencia)}
        </div>
      )}
    </div>
  );
}

function TooltipDependencia({ active, payload }) {
  const { detalhe } = useFormato();
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="tt">
      <div className="tt-label">{d?.sigla_uf} — {d?.nome_estado}</div>
      <div className="tt-value" style={{ color: corDependencia(d?.indice_dependencia ?? 0) }}>
        {fmtPct(d?.indice_dependencia ?? 0)} de dependência
      </div>
      <div className="tt-detail">{fmtBRL(d?.valor_total ?? 0, detalhe)} recebido</div>
      <div className="tt-detail">{fmtBRL(d?.despesa_liquidada ?? 0, detalhe)} gasto</div>
    </div>
  );
}

export default function PaginaComparacao({ dadosCompletos, anoSel, loading }) {
  const [vista, setVista] = useState("per_capita");

  // Filtra apenas estados com dados em ambas as dimensões
  const comDados = dadosCompletos
    .filter((d) => d.valor_total > 0 && d.despesa_liquidada > 0)
    .map((d) => ({
      ...d,
      transf_per_capita: d.populacao > 0 ? d.valor_total / d.populacao : 0,
      desp_per_capita:   d.populacao > 0 ? d.despesa_liquidada / d.populacao : 0,
      dependencia_pct:   d.indice_dependencia ?? 0,
    }));

  const semDados = dadosCompletos.filter(
    (d) => d.valor_total > 0 && d.despesa_liquidada === 0
  );

  const dadosOrdenados = [...comDados].sort((a, b) =>
    vista === "per_capita"
      ? b.transf_per_capita - a.transf_per_capita
      : b.dependencia_pct - a.dependencia_pct
  );

  const dadosExport = dadosOrdenados.map((d) => ({
    sigla_uf:          d.sigla_uf,
    nome_estado:       d.nome_estado,
    regiao:            d.regiao,
    populacao:         d.populacao,
    valor_total:       d.valor_total.toFixed(2),
    despesa_liquidada: d.despesa_liquidada.toFixed(2),
    transf_per_capita: d.transf_per_capita.toFixed(2),
    desp_per_capita:   d.desp_per_capita.toFixed(2),
    dependencia_pct:   d.dependencia_pct.toFixed(2) + "%",
  }));

  // KPIs nacionais
  const totalTransf   = comDados.reduce((s, d) => s + d.valor_total, 0);
  const totalDespesa  = comDados.reduce((s, d) => s + d.despesa_liquidada, 0);
  const totalPop      = comDados.reduce((s, d) => s + d.populacao, 0);
  const depMedia      = totalDespesa > 0 ? (totalTransf / totalDespesa) * 100 : 0;
  const transfPC      = totalPop > 0 ? totalTransf  / totalPop : 0;
  const despesaPC     = totalPop > 0 ? totalDespesa / totalPop : 0;

  const temDados = comDados.length > 0;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Comparação Fiscal"
        title="Transferências Recebidas vs. Despesas Executadas"
        description={`Relação entre o que cada estado recebe da União em transferências constitucionais e o total de despesas liquidadas pelo governo estadual em ${anoSel}. Fonte das despesas: SICONFI/STN — RREO Anexo 1.`}
        acoes={
          temDados && (
            <BotaoExportarCSV
              dados={dadosExport}
              colunas={COLUNAS_EXPORT}
              nomeArquivo={`comparacao_fiscal_${anoSel}.csv`}
            />
          )
        }
      />

      {/* ── KPIs ─────────────────────────────── */}
      {temDados && (
        <div className="kpi-grid" style={{ marginBottom: 24 }}>
          <div className="kpi-card">
            <div className="kpi-label">Total transferido</div>
            <div className="kpi-value">{fmtBRL(totalTransf)}</div>
            <div className="kpi-description">{fmtPC(transfPC)} por habitante</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Total despesas liquidadas</div>
            <div className="kpi-value">{fmtBRL(totalDespesa)}</div>
            <div className="kpi-description">{fmtPC(despesaPC)} por habitante</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Índice médio de dependência</div>
            <div className="kpi-value" style={{ color: corDependencia(depMedia) }}>
              {fmtPct(depMedia)}
            </div>
            <div className="kpi-description">transferências / despesas totais</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Estados com dados completos</div>
            <div className="kpi-value">{comDados.length}</div>
            <div className="kpi-description">
              {semDados.length > 0 ? `${semDados.length} aguardando SICONFI` : "todos disponíveis"}
            </div>
          </div>
        </div>
      )}

      {/* ── Aviso sem dados ──────────────────── */}
      {!temDados && !loading && (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)", marginBottom: 8 }}>
            Dados de despesas ainda não coletados
          </div>
          <div style={{ color: "var(--text-3)", fontSize: 13, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
            Execute o script de coleta para popular a tabela{" "}
            <code style={{ background: "var(--surface-2)", padding: "1px 5px", borderRadius: 4 }}>fato_despesas_uf</code>:
          </div>
          <pre style={{
            background: "var(--surface-2)", color: "var(--text)", fontSize: 12,
            padding: "12px 20px", borderRadius: 8, display: "inline-block",
            marginTop: 16, textAlign: "left",
          }}>
{`cd BACKEND
python coleta/coletar_despesas_estados.py`}
          </pre>
        </div>
      )}

      {/* ── Gráfico comparativo ──────────────── */}
      {temDados && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="card-title">
                {vista === "per_capita" ? "Per capita: Transferência vs. Despesa" : "Índice de Dependência Fiscal por Estado"}
              </div>
              <div className="card-sub">
                {vista === "per_capita"
                  ? `Comparação por habitante · ${anoSel}`
                  : `% das despesas cobertas por transferências federais · ${anoSel}`}
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              {["per_capita", "dependencia"].map((v) => (
                <button
                  key={v}
                  onClick={() => setVista(v)}
                  style={{
                    background: vista === v ? "var(--accent)" : "var(--surface-2)",
                    border: `1px solid ${vista === v ? "var(--accent)" : "var(--border-2)"}`,
                    color: vista === v ? "#fff" : "var(--text-2)",
                    borderRadius: 6, padding: "4px 10px", fontSize: 11,
                    fontFamily: "Nunito, sans-serif", fontWeight: 600,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {v === "per_capita" ? "Per capita" : "Dependência"}
                </button>
              ))}
            </div>
          </div>

          <figure role="img" aria-label={`Gráfico de barras agrupadas: comparação fiscal por estado em ${anoSel}`} style={{ margin: 0 }}>
            <ResponsiveContainer width="100%" height={340}>
              {vista === "per_capita" ? (
                <BarChart
                  data={dadosOrdenados}
                  margin={{ top: 8, right: 12, left: 8, bottom: 4 }}
                  barCategoryGap="20%"
                  barGap={2}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EEF5" vertical={false} />
                  <XAxis dataKey="sigla_uf" tick={{ fill: "#7090AA", fontSize: 10, fontFamily: "Nunito" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => v >= 1000 ? `R$${(v/1000).toFixed(0)}K` : `R$${v}`} tick={{ fill: "#7090AA", fontSize: 10, fontFamily: "Nunito" }} axisLine={false} tickLine={false} width={64} />
                  <Tooltip content={<TooltipComparacao />} cursor={{ fill: "rgba(19,81,180,0.04)" }} />
                  <Legend
                    formatter={(v) => v === "transf_per_capita" ? "Transferência" : "Despesa"}
                    wrapperStyle={{ fontSize: 11, fontFamily: "Nunito" }}
                  />
                  <Bar dataKey="transf_per_capita" name="transf_per_capita" fill="#1351B4" radius={[3, 3, 0, 0]} maxBarSize={18}>
                    {dadosOrdenados.map((d) => (
                      <Cell key={d.sigla_uf} fill={CORES[d.regiao] || "#1351B4"} />
                    ))}
                  </Bar>
                  <Bar dataKey="desp_per_capita" name="desp_per_capita" fill="#6B21A8" radius={[3, 3, 0, 0]} maxBarSize={18} fillOpacity={0.65} />
                </BarChart>
              ) : (
                <BarChart
                  data={dadosOrdenados}
                  margin={{ top: 8, right: 12, left: 8, bottom: 4 }}
                  barCategoryGap="25%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EEF5" vertical={false} />
                  <XAxis dataKey="sigla_uf" tick={{ fill: "#7090AA", fontSize: 10, fontFamily: "Nunito" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: "#7090AA", fontSize: 10, fontFamily: "Nunito" }} axisLine={false} tickLine={false} width={44} domain={[0, 100]} />
                  <Tooltip content={<TooltipDependencia />} cursor={{ fill: "rgba(19,81,180,0.04)" }} />
                  <ReferenceLine y={depMedia} stroke="#64748B" strokeDasharray="4 3" strokeWidth={1} label={{ value: "Média", fill: "#64748B", fontSize: 10 }} />
                  <Bar dataKey="dependencia_pct" radius={[3, 3, 0, 0]} maxBarSize={28}>
                    {dadosOrdenados.map((d) => (
                      <Cell key={d.sigla_uf} fill={corDependencia(d.dependencia_pct)} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </figure>

          {vista === "per_capita" && (
            <div className="legend-row">
              {Object.entries(CORES).map(([reg, cor]) => (
                <span key={reg} className="legend-item">
                  <span className="legend-dot" style={{ background: cor }} />{reg}
                </span>
              ))}
              <span className="legend-item">
                <span className="legend-dot" style={{ background: "#6B21A8", opacity: 0.65 }} />Despesa estadual
              </span>
            </div>
          )}
          {vista === "dependencia" && (
            <div className="legend-row">
              {[
                { cor: "#991B1B", label: "Alta dependência (≥ 60%)" },
                { cor: "#92400E", label: "Média (40–60%)" },
                { cor: "#1e5631", label: "Baixa (20–40%)" },
              ].map((item) => (
                <span key={item.label} className="legend-item">
                  <span className="legend-dot" style={{ background: item.cor }} />
                  {item.label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tabela ranking ───────────────────── */}
      {temDados && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Ranking de dependência fiscal · {anoSel}</div>
            <div className="card-sub">
              Índice = transferências recebidas ÷ despesas liquidadas × 100
            </div>
          </div>

          <table className="ranking" aria-label={`Tabela de comparação fiscal por estado em ${anoSel}`}>
            <thead>
              <tr>
                <th>#</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Transf. recebida</th>
                <th style={{ textAlign: "right" }}>Despesa liquidada</th>
                <th style={{ textAlign: "right" }}>Transf. per capita</th>
                <th style={{ textAlign: "right" }}>Despesa per capita</th>
                <th style={{ textAlign: "right" }}>Dependência</th>
              </tr>
            </thead>
            <tbody>
              {[...comDados]
                .sort((a, b) => b.dependencia_pct - a.dependencia_pct)
                .map((d, i) => (
                  <tr key={d.sigla_uf}>
                    <td style={{ color: "var(--text-3)", fontSize: 12, fontWeight: 700 }}>{i + 1}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="rank-regiao-dot" style={{ background: CORES[d.regiao] }} />
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{d.sigla_uf}</span>
                          <span style={{ color: "var(--text-3)", fontSize: 11, marginLeft: 4 }}>{d.nome_estado}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className="rank-valor">{fmtBRL(d.valor_total)}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className="rank-valor">{fmtBRL(d.despesa_liquidada)}</span>
                    </td>
                    <td style={{ textAlign: "right", fontSize: 12, color: "var(--text-2)" }}>
                      {fmtPC(d.transf_per_capita)}
                    </td>
                    <td style={{ textAlign: "right", fontSize: 12, color: "var(--text-2)" }}>
                      {fmtPC(d.desp_per_capita)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                        <span style={{ fontWeight: 800, fontSize: 13, color: corDependencia(d.dependencia_pct) }}>
                          {fmtPct(d.dependencia_pct)}
                        </span>
                        <div style={{
                          width: 80, height: 4, borderRadius: 2,
                          background: `linear-gradient(90deg, ${corDependencia(d.dependencia_pct)} ${Math.min(d.dependencia_pct, 100)}%, var(--surface-2) ${Math.min(d.dependencia_pct, 100)}%)`,
                        }} />
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {semDados.length > 0 && (
            <div style={{ padding: "12px 0 4px", fontSize: 11, color: "var(--text-3)" }}>
              Estados sem dados de despesas ({semDados.length}):{" "}
              {semDados.map((d) => d.sigla_uf).join(", ")} — execute o script de coleta para incluí-los.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
