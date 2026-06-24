# 🚀 Guia Rápido - Implementação KPIs Year-to-Date

**Tempo total: ~30 minutos** (Setup) + **5 minutos/mês** (Operacional)

---

## 📍 O que foi implementado

✅ **SQL** - Tabelas para capturar dados mensais  
✅ **Python** - Scripts para validação e processamento  
✅ **React** - Componente para visualizar KPIs  
✅ **Documentação** - Guias completos de uso

---

## 🎯 3 Passos para Começar

### PASSO 1️⃣: Setup Supabase (5 min)

```bash
# Copie TODO o conteúdo de:
BACKEND/criar_tabelas_supabase.sql

# E cole no SQL Editor do seu projeto Supabase
# https://app.supabase.com → SQL Editor → New Query
```

✅ Tabelas criadas automaticamente

---

### PASSO 2️⃣: Upload de Dados (10 min)

#### Preparar CSV

Crie arquivo `dados_junho.csv`:
```csv
mes,sigla_uf,tipo_transferencia,valor_transferido
2026-06-01,SP,FPE,5000000000
2026-06-01,MG,FPE,3500000000
2026-06-01,RJ,FPE,2500000000
```

#### Fazer Upload

```bash
cd BACKEND
python upload_dados_mensais.py dados_junho.csv
```

✅ Dados armazenados em `fact_transferencias_raw`

---

### PASSO 3️⃣: Processar e Visualizar (10 min)

#### Executar Pipeline

```bash
cd BACKEND
python pipeline_mensal.py
```

**Isso vai:**
- Validar dados
- Calcular Year-to-Date
- Calcular Gini e indicadores
- Atualizar agregações

#### Ver no Dashboard

```bash
# Terminal 1: Dashboard React
cd dashboard-tcc
npm start

# Terminal 2: Abra no navegador
http://localhost:3000/ytd
```

✅ KPIs em tempo real!

---

## 📊 O que você verá no Dashboard

```
┌─────────────────────────────────────────────┐
│  KPIs Year-to-Date (YTD) - Junho 2026      │
├─────────────────────────────────────────────┤
│                                             │
│  Total Mês: R$ 25,5 bi    Total YTD: R$ ... │
│  Per Capita: R$ 121      Per Capita YTD: R$ │
│                                             │
├─────────────────────────────────────────────┤
│  UF │ Região      │ Valor Mês  │ Valor YTD  │
├─────┼─────────────┼────────────┼────────────┤
│ SP  │ Sudeste     │ R$ 8.0B    │ R$ 42.5B   │
│ MG  │ Sudeste     │ R$ 3.5B    │ R$ 18.2B   │
│ RJ  │ Sudeste     │ R$ 2.5B    │ R$ 13.1B   │
│ ... │ ...         │ ...        │ ...        │
└─────────────────────────────────────────────┘
```

---

## 🔄 Fluxo Mensal (Repetir todo mês)

```
1. Preparar CSV
   └─→ dados_julho_2026.csv
   
2. Upload
   └─→ python upload_dados_mensais.py dados_julho_2026.csv
   
3. Pipeline
   └─→ python pipeline_mensal.py
   
4. Ver Dashboard
   └─→ http://localhost:3000/ytd
```

⏱️ **5 minutos por mês após setup!**

---

## 📁 Arquivos Criados

```
BACKEND/
├── criar_tabelas_supabase.sql       ← SQL para Supabase
├── upload_dados_mensais.py          ← Script de upload
├── pipeline_mensal.py               ← Script de processamento
├── dados_brutos/
│   └── exemplo_dados_junho_2026.csv ← Arquivo de exemplo
└── IMPLEMENTACAO_KPI_YTD.md         ← Documentação detalhada

dashboard-tcc/src/
├── components/
│   └── PaginaYTD.jsx                ← Componente React
└── styles/
    └── PaginaYTD.css                ← Estilos
```

---

## 🛠️ Arquitetura em 1 Imagem

```
CSV Mensal
    ↓
[upload_dados_mensais.py]
    ↓
fact_transferencias_raw (dados brutos)
    ↓
[pipeline_mensal.py] ← Validação, Consolidação, YTD
    ↓
fato_transferencias_mes (consolidado)
agg_mes_estado (por estado)
agg_mes_regiao (por região)
    ↓
[PaginaYTD.jsx] ← Dashboard em tempo real
```

---

## ❓ Perguntas Frequentes

### P: Posso executar para um mês passado?
**R:** Sim! 
```bash
python pipeline_mensal.py --mes 2026-05-01
```

### P: O que acontece se o dado estiver errado?
**R:** O script valida e marca como "inválido". Você corrige e re-executa.

### P: Como automizar para rodar todo mês automaticamente?
**R:** Veja `IMPLEMENTACAO_KPI_YTD.md` seção "Automação Futura" para:
- Windows Task Scheduler
- Linux Cron
- GitHub Actions

### P: Posso adicionar mais indicadores?
**R:** Sim! Edite `pipeline_mensal.py` na ETAPA 4 (Indicadores).

### P: Os dados históricos são considerados?
**R:** Sim! Year-to-Date acumula desde janeiro automaticamente.

---

## 🔍 Verificar se tudo funcionou

### 1. Verificar tabelas criadas

No SQL Editor do Supabase:
```sql
SELECT * FROM fact_transferencias_raw LIMIT 5;
SELECT * FROM fato_transferencias_mes LIMIT 5;
SELECT * FROM agg_mes_estado LIMIT 5;
```

### 2. Verificar dados brutos

```bash
cd BACKEND
python -c "
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
client = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)
result = client.table('fact_transferencias_raw').select('*').execute()
print(f'Total de registros: {len(result.data)}')
"
```

### 3. Verificar Dashboard

```
http://localhost:3000/ytd
```

Se mostrar dados = ✅ **SUCESSO!**

---

## 🆘 Problemas Comuns

| Problema | Solução |
|----------|---------|
| "Nenhum dado no dashboard" | Execute: `python pipeline_mensal.py` |
| "Erro: Configure SUPABASE_URL" | Crie `.env` em BACKEND com credenciais |
| "CSV não valida" | Verifique: colunas, UF, tipos, valores positivos |
| "Tabela não existe" | Cole SQL do `criar_tabelas_supabase.sql` no Supabase |
| "Conexão recusada" | Verifique `.env` → SUPABASE_URL e SUPABASE_SERVICE_KEY |

---

## 📚 Para Aprender Mais

- **Detalhes técnicos:** `IMPLEMENTACAO_KPI_YTD.md`
- **Estrutura SQL:** `criar_tabelas_supabase.sql`
- **Validação de dados:** `upload_dados_mensais.py`
- **Processamento:** `pipeline_mensal.py`
- **Visualização:** `components/PaginaYTD.jsx`

---

## 🎉 Próximas Etapas

1. ✅ Execute SQL no Supabase
2. ✅ Faça upload do CSV de exemplo
3. ✅ Rode pipeline_mensal.py
4. ✅ Veja no Dashboard
5. 🚀 Personalize conforme necessário

---

**Pronto! Seu sistema de KPIs Year-to-Date está operacional!** 🎊
