import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { useDrillDown } from "../hooks/useDrillDown";
import GraficoTipoMensal from "./GraficoTipoMensal";
import { nomeMes } from "../utils/meses";

const CONCEITOS = {
  "FPE":                   "Fundo de Participação dos Estados — repasse constitucional de 21,5% da arrecadação federal de IR e IPI destinado aos 26 estados e ao DF.",
  "FPM":                   "Fundo de Participação dos Municípios — repasse constitucional de 22,5% do IR e IPI aos municípios brasileiros.",
  "IPI-EXP":               "IPI Exportação — compensação constitucional pela desoneração do IPI nas exportações, distribuída proporcionalmente às exportações estaduais.",
  "IPI-Exp":               "IPI Exportação — compensação constitucional pela desoneração do IPI nas exportações, distribuída proporcionalmente às exportações estaduais.",
  "ICMS":                  "Parcela do ICMS estadual contabilizada nesta transferência específica (distinta da compensação Lei Kandir, listada separadamente como ICMS/LC 87/96).",
  "ICMS/LC 87/96 - Lei Kandir": "Lei Kandir (LC 87/96) — compensação federal aos estados pela perda de arrecadação de ICMS decorrente da desoneração de exportações de produtos primários.",
  "ITR":                   "Imposto Territorial Rural — 50% do ITR arrecadado é repassado ao município onde o imóvel rural está localizado.",
  "ANP":                   "Royalties e participações especiais sobre a exploração de petróleo, gás natural e outros hidrocarbonetos fluidos, repassados conforme regulamentação da ANP.",
  "PEA":                   "Participação Especial — compensação financeira adicional devida pela exploração de campos de grande volume de petróleo e gás (Lei do Petróleo, Lei 9.478/1997).",
  "AUX":                   "Auxílio Financeiro aos Estados (AFM/AFE) — repasse complementar da União para apoio financeiro pontual.",
  "CFM":                   "Compensação Financeira pela Exploração de Recursos Minerais — mesma natureza da CFEM, registrada sob este código em parte da série (destino real: Royalties).",
  "PBAEA":                 "Cessão Onerosa — compensação pela cessão de áreas do pré-sal à União sem licitação, repassada a estados produtores.",
  "PBAEB":                 "Cessão Onerosa — compensação pela cessão de áreas do pré-sal à União sem licitação, repassada a estados produtores.",
  "LC 87":                 "Lei Kandir (LC 87/96) — mesma compensação por desoneração de ICMS nas exportações, rótulo usado em período diferente da série.",
  "LC 173/2020 - PFEC INCISO I":  "Programa Federativo de Enfrentamento ao Coronavírus (LC 173/2020), inciso I — recomposição de perdas de FPE, FPM, ICMS e IPVA durante a pandemia.",
  "LC 173/2020 - PFEC INCISO II": "Programa Federativo de Enfrentamento ao Coronavírus (LC 173/2020), inciso II — suspensão do pagamento de dívidas dos estados com a União durante a pandemia.",
  "IOF Ouro":              "IOF sobre Ouro — 70% do IOF incidente sobre operações com ouro como ativo financeiro é repassado aos municípios de origem da extração.",
  "ITA":                   "Compensação financeira pela Usina de Itaipu Binacional, prevista em tratado — concentrada no Paraná, onde a usina está localizada.",
  "LC 201/2023 ? COMPENSAÇÃO ICMS": "LC 201/2023 — compensação federal pela perda de arrecadação dos estados decorrente da desoneração do ICMS sobre combustíveis.",
  "CIDE/Combustível":      "CIDE-Combustíveis — Contribuição de Intervenção no Domínio Econômico sobre a importação e comercialização de combustíveis. Parte é rateada entre estados e municípios.",
  "CIDE-Combustíveis":     "CIDE-Combustíveis — Contribuição de Intervenção no Domínio Econômico sobre a importação e comercialização de combustíveis. Parte é rateada entre estados e municípios.",
  "FEP":                   "Fundo Especial do Petróleo — parte dos royalties do petróleo distribuída a estados e municípios não produtores.",
  "CFH":                   "Compensação Financeira pelo uso de Recursos Hídricos — paga pelas usinas hidrelétricas pela utilização de potencial de energia hidráulica, repassada a estados e municípios.",
  "CFEM":                  "Compensação Financeira pela Exploração de Recursos Minerais — paga pelas empresas de mineração, distribuída à União, estados e municípios.",
  "IPVA":                  "IPVA (parcela FUNDEB) — contribuição dos estados ao FUNDEB com base na arrecadação do Imposto sobre Propriedade de Veículos Automotores.",
  "ITCMD":                 "ITCMD (parcela FUNDEB) — contribuição dos estados ao FUNDEB com base na arrecadação do Imposto sobre Transmissão Causa Mortis e Doação.",
  "LC 87/96 (Lei Kandir)": "Lei Kandir — compensação federal pela desoneração de ICMS nas exportações de produtos primários e semielaborados.",
  "LC 173/2020 (PFEC)":    "LC 173/2020 — auxílio financeiro emergencial da União a estados e municípios durante a pandemia de COVID-19 (Programa Federativo de Enfrentamento ao Coronavírus).",
  "LC 176/2020 (ADO25)":   "LC 176/2020 — compensação da União pelo adiamento de precatórios reconhecidos no âmbito da ADO 25 do STF.",
  "Royalties":             "Royalties — compensações financeiras pagas pelas empresas pela exploração de recursos naturais (petróleo, gás, recursos hídricos e minerais).",
  "FPM 1%":                "FPM 1% adicional — parcela extra de 1% do FPM repassada em julho e dezembro de cada ano, conforme EC 55/2007.",
  "AFM/AFE":               "Auxílio Financeiro aos Municípios/Estados — transferência federal discricionária para apoio em situações específicas.",
  "IOF-Ouro":              "IOF sobre Ouro — 70% do IOF incidente sobre operações com ouro como ativo financeiro é repassado aos municípios de origem da extração.",
  "FEX":                   "Fundo de Exportação — compensação pela perda de arrecadação de ICMS nas exportações, complementar à Lei Kandir.",
  "AJUSTE FUNDEB":         "Ajuste FUNDEB — correção de diferenças nas contribuições ao Fundo de Manutenção e Desenvolvimento da Educação Básica.",
};

const fmtBRL = (v) => {
  if (v >= 1e9)
    return `R$ ${(v / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} bi`;
  if (v >= 1e6)
    return `R$ ${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`;
  return `R$ ${Number(v).toLocaleString("pt-BR")}`;
};

const fmtBRLCompleto = (v) =>
  `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TooltipCustom = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const conceito = CONCEITOS[d.name] ?? null;
  return (
    <div className="tt tt-tipos">
      <div className="tt-label">{d.name}</div>
      <div className="tt-value">{fmtBRLCompleto(d.value)}</div>
      <div className="tt-detail" style={{ marginTop: 2 }}>
        {fmtBRL(d.value)} · {d.percent.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% do total
      </div>
      {conceito && (
        <div className="tt-conceito">{conceito}</div>
      )}
    </div>
  );
};

const truncar = (str, max = 30) =>
  str.length > max ? str.slice(0, max - 1) + "…" : str;

export default function GraficoTipos({
  tiposTransf,
  anoSel,
  mesSel = null,
  height = 280,
  limit = 10,
  estadoSel = "Todos",
  regiaoSel = "Todas",
  estados = [],
}) {
  const [tipoAberto, setTipoAberto] = useState(null);
  const [mensal, setMensal] = useState(null);
  const [loadingMensal, setLoadingMensal] = useState(false);

  const { buscarMensalPorTipo } = useDrillDown();

  const periodo = mesSel ? `${nomeMes(mesSel)}/${anoSel}` : anoSel;

  // Trocar ano/mês/estado/região invalida a série mensal aberta (seria de outro escopo).
  useEffect(() => {
    setTipoAberto(null);
    setMensal(null);
  }, [anoSel, mesSel, estadoSel, regiaoSel]);

  async function handleClickTipo(tipo) {
    if (tipoAberto === tipo) {
      setTipoAberto(null);
      setMensal(null);
      return;
    }
    setTipoAberto(tipo);
    setMensal(null);
    setLoadingMensal(true);

    const ufsRegiao = regiaoSel !== "Todas"
      ? estados.filter((e) => e.regiao === regiaoSel).map((e) => e.sigla_uf)
      : null;

    const dados = await buscarMensalPorTipo(tipo, anoSel, {
      sigla_uf: estadoSel !== "Todos" ? estadoSel : null,
      ufsRegiao: estadoSel === "Todos" ? ufsRegiao : null,
    });
    setMensal(dados);
    setLoadingMensal(false);
  }

  if (!tiposTransf?.length) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">Tipos de transferência</div>
          <div className="card-sub">Top 10 modalidades · {periodo}</div>
        </div>
        <div className="empty-state">Sem dados para o período selecionado</div>
      </div>
    );
  }

  const escopo = estadoSel !== "Todos" ? estadoSel : regiaoSel !== "Todas" ? regiaoSel : "Brasil";
  const total = tiposTransf.reduce((s, d) => s + Number(d.valor_total), 0);

  const dados = tiposTransf
    .map((d) => ({
      name:    d.tipo_transferencia,
      value:   Number(d.valor_total),
      percent: (Number(d.valor_total) / total) * 100,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  const maxLabelLen = Math.max(...dados.map((d) => Math.min(d.name.length, 30)));
  const yWidth = Math.min(Math.max(maxLabelLen * 6, 110), 200);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Tipos de transferência</div>
        <div className="card-sub">
          Top {limit} modalidades · {periodo} · total: {fmtBRL(total)} · clique numa barra para ver a série mensal
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={dados}
          layout="vertical"
          margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
          barCategoryGap="24%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#E8EEF5"
            horizontal={false}
          />
          <XAxis
            type="number"
            tickFormatter={fmtBRL}
            tick={{ fill: "#7090AA", fontSize: 10, fontFamily: "Nunito" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={yWidth}
            tick={{ fill: "#7090AA", fontSize: 10, fontFamily: "Nunito" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => truncar(v)}
          />
          <Tooltip
            content={<TooltipCustom />}
            cursor={{ fill: "rgba(19,81,180,0.04)" }}
          />
          <Bar
            dataKey="value"
            fill="#1351B4"
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
            onClick={(entry) => handleClickTipo(entry.name)}
            style={{ cursor: "pointer" }}
          >
            <LabelList
              dataKey="percent"
              position="right"
              formatter={(v) =>
                `${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%`
              }
              style={{ fill: "#7090AA", fontSize: 10, fontFamily: "Nunito" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {tipoAberto && (
        <GraficoTipoMensal
          dados={mensal}
          tipo={tipoAberto}
          ano={anoSel}
          escopo={escopo}
          loading={loadingMensal}
          onClose={() => { setTipoAberto(null); setMensal(null); }}
        />
      )}
    </div>
  );
}
