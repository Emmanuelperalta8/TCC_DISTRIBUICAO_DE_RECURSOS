import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const TIPOS_TRANSFERENCIA = [
  "FPE - Fundo de Participação dos Estados",
  "FPM - Fundo de Participação dos Municípios",
  "ITR - Imposto sobre Propriedade Territorial Rural",
  "Transferências Obrigatórias (CIDE, Salário Educação)",
  "Transferências Voluntárias",
];

const ANOS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

async function popularTransferencias() {
  console.log("🔄 Iniciando população de transferências...\n");

  try {
    // 1. Buscar estados
    const { data: estados, error: erroEstados } = await supabase
      .from("dim_estado")
      .select("id_estado, sigla_uf, nome_estado");

    if (erroEstados) throw erroEstados;
    console.log(`✓ ${estados.length} estados carregados`);

    // 2. Buscar população por UF/ano
    const { data: populacao, error: erroPop } = await supabase
      .from("dim_populacao")
      .select("sigla_uf, ano, populacao");

    if (erroPop) throw erroPop;
    console.log(`✓ ${populacao.length} registros de população carregados`);

    // 3. Buscar despesas por UF/ano
    const { data: despesas, error: erroDesp } = await supabase
      .from("fato_despesas_uf")
      .select("sigla_uf, ano, despesa_liquidada");

    if (erroDesp) throw erroDesp;
    console.log(`✓ ${despesas.length} registros de despesas carregados\n`);

    // 4. Buscar tipos de transferência (ou criar)
    const { data: tiposExistentes, error: erroTipos } = await supabase
      .from("dim_tipo_transferencia")
      .select("id_tipo, tipo_transferencia");

    if (erroTipos) throw erroTipos;

    let tiposMap = {};
    if (tiposExistentes.length === 0) {
      console.log("📝 Criando tipos de transferência...");
      for (const tipo of TIPOS_TRANSFERENCIA) {
        const { data: inserted, error: erroInsert } = await supabase
          .from("dim_tipo_transferencia")
          .insert({ tipo_transferencia: tipo, categoria: "Federal" })
          .select();

        if (erroInsert) throw erroInsert;
        tiposMap[tipo] = inserted[0].id_tipo;
      }
    } else {
      tiposExistentes.forEach((t) => {
        tiposMap[t.tipo_transferencia] = t.id_tipo;
      });
    }
    console.log(`✓ ${Object.keys(tiposMap).length} tipos de transferência\n`);

    // 5. Calcular e inserir transferências
    const transferencias = [];
    const mapPop = {};
    const mapDesp = {};
    const mapEstado = {};

    // Índices para lookup rápido
    populacao.forEach((p) => {
      const key = `${p.sigla_uf}_${p.ano}`;
      mapPop[key] = p.populacao;
    });

    despesas.forEach((d) => {
      const key = `${d.sigla_uf}_${d.ano}`;
      mapDesp[key] = d.despesa_liquidada;
    });

    estados.forEach((e) => {
      mapEstado[e.sigla_uf] = e;
    });

    // Cálculo de transferências por estado/ano
    const populacaoTotal2016 = populacao
      .filter((p) => p.ano === 2016)
      .reduce((s, p) => s + p.populacao, 0);

    console.log("📊 Calculando distribuição de transferências...");

    for (const estado of estados) {
      for (const ano of ANOS) {
        const popKey = `${estado.sigla_uf}_${ano}`;
        const despKey = `${estado.sigla_uf}_${ano}`;

        const pop = mapPop[popKey] || 0;
        const desp = mapDesp[despKey] || 0;

        if (pop === 0 || desp === 0) continue;

        // Cálculo base: transferência cobre 30-40% das despesas
        const cobertura = 0.3 + Math.random() * 0.1;
        const valorBase = desp * cobertura;

        // Aplicar fator de crescimento anual (5-7%)
        const anoBase = 2016;
        const crescimentoAnual = 1.06 + (Math.random() - 0.5) * 0.02;
        const fatorAno = Math.pow(crescimentoAnual, ano - anoBase);
        const valorAjustado = valorBase * fatorAno;

        // Distribuir entre tipos de transferência
        const distribuicaoTipos = {
          "FPE - Fundo de Participação dos Estados": 0.35,
          "FPM - Fundo de Participação dos Municípios": 0.35,
          "ITR - Imposto sobre Propriedade Territorial Rural": 0.1,
          "Transferências Obrigatórias (CIDE, Salário Educação)": 0.15,
          "Transferências Voluntárias": 0.05,
        };

        for (const [tipo, percentual] of Object.entries(distribuicaoTipos)) {
          const valorTransf = valorAjustado * percentual;
          const popBase = mapPop[`${estado.sigla_uf}_${anoBase}`] || pop;
          const valorPerCapita = popBase > 0 ? valorTransf / popBase : 0;

          transferencias.push({
            sigla_uf: estado.sigla_uf,
            ano,
            tipo_transferencia: tipo,
            valor_transferido: Math.round(valorTransf * 100) / 100,
            populacao: pop,
            valor_per_capita: Math.round(valorPerCapita * 100) / 100,
          });
        }
      }
    }

    console.log(`✓ ${transferencias.length} registros calculados\n`);

    // 6. Limpar dados anteriores e inserir em lotes
    console.log("🗑️  Limpando tabela fato_transferencias...");
    const { error: erroDelete } = await supabase
      .from("fato_transferencias")
      .delete()
      .neq("id", 0);

    if (erroDelete && erroDelete.code !== "PGRST116") throw erroDelete;

    console.log("✓ Tabela limpa\n");

    // Inserir em lotes de 500
    const batchSize = 500;
    for (let i = 0; i < transferencias.length; i += batchSize) {
      const batch = transferencias.slice(i, i + batchSize);
      const { error: erroInsert, data: inserted } = await supabase
        .from("fato_transferencias")
        .insert(batch);

      if (erroInsert) {
        console.error(`❌ Erro ao inserir lote ${i / batchSize + 1}:`, erroInsert);
        throw erroInsert;
      }

      console.log(
        `✓ Lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(transferencias.length / batchSize)} inserido (${batch.length} registros)`
      );
    }

    console.log("\n✅ População de transferências concluída com sucesso!");
    console.log(
      `📈 Total: ${transferencias.length} registros de transferências criados\n`
    );

    // Exibir estatísticas
    const totalPorAno = {};
    transferencias.forEach((t) => {
      if (!totalPorAno[t.ano]) totalPorAno[t.ano] = 0;
      totalPorAno[t.ano] += t.valor_transferido;
    });

    console.log("📊 Resumo por ano (em bilhões de R$):");
    Object.entries(totalPorAno)
      .sort((a, b) => a[0] - b[0])
      .forEach(([ano, total]) => {
        console.log(
          `   ${ano}: R$ ${(total / 1e9).toFixed(2)}B`
        );
      });
  } catch (error) {
    console.error("❌ Erro crítico:", error.message);
    process.exit(1);
  }
}

popularTransferencias();
