# 📊 Implementação de KPIs Year-to-Date (YTD)

Este documento explica como implementar e usar o sistema de captura mensal de dados para KPIs Year-to-Date.

---

## 📋 Pré-requisitos

- Python 3.10+
- Supabase CLI instalado
- Node.js 18+ (para React)
- Arquivo `.env` configurado no BACKEND com:
  ```
  SUPABASE_URL=https://seu-projeto.supabase.co
  SUPABASE_SERVICE_KEY=sua-service-key
  ```

---

## 🚀 PASSO 1: Criar Tabelas no Supabase

### 1.1 Via SQL Editor (Recomendado)

1. Acesse seu projeto Supabase
2. Vá para **SQL Editor**
3. Cole o conteúdo do arquivo `criar_tabelas_supabase.sql`
4. Execute

Isso criará automaticamente:
- Tabelas para capturar dados mensais
- Views para KPIs YTD
- Índices para performance
- Políticas de Row Level Security (RLS)

### 1.2 Via Supabase CLI

```bash
cd BACKEND
supabase db push
```

---

## 💾 PASSO 2: Preparar Dados Mensais

### Formato do CSV

Crie um arquivo CSV com as seguintes colunas:

```csv
mes,sigla_uf,tipo_transferencia,valor_transferido
2026-06-01,SP,FPE,5000000000
2026-06-01,MG,FPE,3500000000
2026-06-01,RJ,FPE,2500000000
```

**Colunas obrigatórias:**
- `mes`: Data no formato YYYY-MM-DD
- `sigla_uf`: Código de 2 letras (SP, MG, RJ, etc.)
- `tipo_transferencia`: FPE, FPM, IPI-EXP, ICMS, etc.
- `valor_transferido`: Número positivo em reais

**Arquivo de exemplo:**
- `dados_brutos/exemplo_dados_junho_2026.csv`

---

## 📤 PASSO 3: Upload de Dados

### Opção A: Script Python (Recomendado)

```bash
cd BACKEND
python upload_dados_mensais.py dados_brutos/seu_arquivo.csv
```

**Saída esperada:**
```
[INFO] Lendo seu_arquivo.csv...
[INFO] Validando dados...
[INFO] ✓ Validação OK (20 registros)
[INFO] Conectando ao Supabase...
[INFO] Inserindo 20 registros em fact_transferencias_raw...
[INFO] ✅ 20 registros inseridos com sucesso
```

### Opção B: Manual via Supabase

1. Vá para **SQL Editor**
2. Use INSERT direto:

```sql
INSERT INTO fact_transferencias_raw 
  (mes_referencia, sigla_uf, tipo_transferencia, valor_transferido, status_validacao)
VALUES 
  ('2026-06-01', 'SP', 'FPE', 5000000000, 'pendente'),
  ('2026-06-01', 'MG', 'FPE', 3500000000, 'pendente');
```

---

## 🔄 PASSO 4: Executar Pipeline Mensal

O pipeline processa dados brutos e calcula KPIs YTD automaticamente.

### Executar

```bash
cd BACKEND
python pipeline_mensal.py
```

**Saída esperada:**
```
============================================================
  PIPELINE MENSAL - KPIs YEAR-TO-DATE
  Mês de referência: June/2026
============================================================

  ETAPA 1: EXTRAÇÃO DE DADOS BRUTOS
  ✓ 20 registros extraídos

  ETAPA 2: VALIDAÇÃO
  ✓ 20 válidos, 0 inválidos

  ETAPA 3: CONSOLIDAÇÃO
  ✓ 20 registros consolidados

  ETAPA 4: CÁLCULO DE INDICADORES
  ✓ Indicadores calculados

  ETAPA 5: PERSISTÊNCIA
  ✓ 20 registros em fato_transferencias_mes
  ✓ 10 registros em agg_mes_estado
  ✓ 5 registros em agg_mes_regiao
  ✓ Dados brutos marcados como processados

============================================================
✅ PIPELINE CONCLUÍDO COM SUCESSO!
============================================================
```

### Executar para mês específico

```bash
python pipeline_mensal.py --mes 2026-05-01
```

---

## 📊 PASSO 5: Visualizar no Dashboard

### Adicionar PaginaYTD ao App.jsx

```jsx
// dashboard-tcc/src/App.jsx
import PaginaYTD from './components/PaginaYTD';

function App() {
  return (
    <div className="App">
      <Route path="/ytd" element={<PaginaYTD />} />
    </div>
  );
}
```

### Acessar no navegador

```
http://localhost:3000/ytd
```

Você verá:
- Resumo nacional (totais, per capita, YTD)
- Tabela com detalhamento por estado
- Índice Gini, status de alerta, crescimento

---

## 📈 O que é calculado automaticamente

### ETAPA 1: Extração
- Lê dados brutos pendentes (`fact_transferencias_raw`)

### ETAPA 2: Validação
- Verifica UF válida (27 estados)
- Verifica tipo de transferência válido
- Verifica valor positivo
- Marca inválidos no banco

### ETAPA 3: Consolidação
- Agrupa por estado e tipo
- Calcula per capita
- Calcula Year-to-Date (acumula desde janeiro)

### ETAPA 4: Indicadores
- Calcula índice Gini por estado
- Determina status de alerta (verde/amarelo/vermelho)

### ETAPA 5: Persistência
- Insere em `fato_transferencias_mes`
- Agrupa por estado em `agg_mes_estado`
- Agrupa por região em `agg_mes_regiao`
- Marca dados brutos como "processado"

---

## 🎯 Exemplo Completo: Junho 2026

### 1. Preparar CSV
```csv
mes,sigla_uf,tipo_transferencia,valor_transferido
2026-06-01,SP,FPE,5000000000
2026-06-01,SP,FPM,3000000000
2026-06-01,MG,FPE,3500000000
```

### 2. Upload
```bash
python upload_dados_mensais.py dados_junho.csv
```

### 3. Pipeline
```bash
python pipeline_mensal.py
```

### 4. Ver no Dashboard
```
http://localhost:3000/ytd
```

**Resultado:**
- Total YTD para SP: R$ 8.000.000.000 (junho acumulado desde janeiro)
- Total YTD para MG: R$ 3.500.000.000
- Per capita YTD calculado automaticamente
- Índice Gini e status de alerta

---

## 🔍 Consultas SQL Úteis

### Ver dados brutos pendentes
```sql
SELECT * FROM fact_transferencias_raw 
WHERE status_validacao = 'pendente' 
ORDER BY mes_referencia DESC;
```

### Ver KPIs do mês
```sql
SELECT * FROM agg_mes_estado 
WHERE mes_referencia = '2026-06-01' 
ORDER BY valor_ytd DESC;
```

### Ver agregação por região
```sql
SELECT * FROM agg_mes_regiao 
WHERE mes_referencia = '2026-06-01';
```

### View de KPI YTD
```sql
SELECT * FROM vw_kpi_ytd;
```

### View de alertas
```sql
SELECT * FROM vw_alerta_desvios;
```

---

## 🐛 Troubleshooting

### Erro: "Configure SUPABASE_URL e SUPABASE_SERVICE_KEY"
**Solução:** Crie arquivo `.env` no BACKEND com suas credenciais Supabase

### Erro: "Nenhum dado bruto pendente"
**Solução:** Execute `upload_dados_mensais.py` primeiro

### Erro: "Tabela não existe"
**Solução:** Execute o SQL em `criar_tabelas_supabase.sql` no Supabase

### CSV não é validado
**Solução:** Verifique:
- Colunas: `mes`, `sigla_uf`, `tipo_transferencia`, `valor_transferido`
- UF válida (SP, MG, RJ, etc.)
- Tipo válido (FPE, FPM, IPI-EXP, etc.)
- Valor positivo

### Dashboard mostra "Nenhum dado disponível"
**Solução:**
1. Rode o pipeline: `python pipeline_mensal.py`
2. Verifique conexão Supabase em `dashboard-tcc/.env`
3. Abra console do navegador (F12) e procure erros

---

## ⚙️ Automação Futura

Para automatizar a execução mensal:

### Windows Task Scheduler
```batch
@echo off
cd C:\caminho\para\tcc\BACKEND
python pipeline_mensal.py
```

### Linux/Mac Cron
```bash
0 1 1 * * cd /caminho/para/tcc/BACKEND && python pipeline_mensal.py
```

### GitHub Actions
```yaml
name: Pipeline Mensal
on:
  schedule:
    - cron: '0 1 1 * *'  # 1º de cada mês às 1h da manhã
jobs:
  pipeline:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Executar pipeline
        run: python BACKEND/pipeline_mensal.py
```

---

## 📞 Próximas Etapas

1. ✅ Executar SQL: `criar_tabelas_supabase.sql`
2. ✅ Preparar CSV mensal
3. ✅ Upload: `python upload_dados_mensais.py dados.csv`
4. ✅ Pipeline: `python pipeline_mensal.py`
5. ✅ Visualizar: `http://localhost:3000/ytd`

**Pronto! Sistema operacional.** 🎉
