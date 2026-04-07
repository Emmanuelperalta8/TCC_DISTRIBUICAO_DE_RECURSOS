# 📊 Dashboard de Distribuição de Recursos Federais

**TCC — Engenharia de Software — ULBRA Palmas**
**Autor:** Emmanuel de Oliveira Peralta Duarte
**Orientadora:** Fernanda Pereira Gomes

---

## 📋 Sobre o Projeto

Dashboard interativo para acompanhar a distribuição das transferências de recursos federais para os estados brasileiros. O sistema integra dados do **IBGE** (estimativas populacionais) e do **Tesouro Nacional** (transferências constitucionais) para oferecer visualizações comparativas por estado, região e período.

---

## 🏗️ Estrutura do Projeto

```
TCC/
├── BACKEND/
│   ├── coleta/
│   │   ├── coletar_ibge.py              # Coleta estados e população via API IBGE
│   │   └── coletar_transferencias.py    # Coleta transferências do Tesouro Nacional
│   ├── ETL/
│   │   └── etl_supabase.py              # Integração e carga no Supabase
│   ├── dados_brutos/                    # CSVs coletados (gerado automaticamente)
│   ├── dados_processados/               # Dados tratados (gerado automaticamente)
│   ├── .env                             # Variáveis de ambiente (não versionar!)
│   └── requirements.txt                 # Dependências Python
│
└── dashboard-tcc/                       # Frontend React
    └── src/
        ├── components/                  # Componentes visuais
        │   ├── Header.jsx
        │   ├── Filtros.jsx
        │   ├── KPIs.jsx
        │   ├── GraficoEstados.jsx
        │   ├── GraficoRegioes.jsx
        │   ├── GraficoHistorico.jsx
        │   ├── GraficoPerCapita.jsx
        │   ├── GraficoTipos.jsx
        │   └── RankingEstados.jsx
        ├── hooks/
        │   └── useDados.js              # Hook de acesso ao Supabase
        ├── services/
        │   └── supabaseClient.js        # Configuração do cliente Supabase
        ├── styles/
        │   └── global.css              # Estilos globais
        └── App.js                       # Componente principal
```

---

## ⚙️ Pré-requisitos

- **Python** 3.10+
- **Node.js** 18+
- **npm** 9+
- Conta gratuita no **[Supabase](https://supabase.com)**
- Chave de API do **[Portal da Transparência](https://portaldatransparencia.gov.br/api-de-dados/cadastros/api)**

---

## 🚀 Como Executar

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/tcc-dashboard.git
cd tcc-dashboard
```

---

### 2. Configurar o Backend

```bash
cd BACKEND
```

#### Instalar dependências Python

```bash
pip install -r requirements.txt
```

#### Configurar variáveis de ambiente

Crie o arquivo `.env` na pasta `BACKEND/` com o conteúdo:

```env
# Portal da Transparência
PORTAL_TRANSPARENCIA_API_KEY=sua_chave_aqui

# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...
```

#### Criar as tabelas no Supabase

Acesse o **SQL Editor** do seu projeto Supabase e execute o arquivo:

```
BACKEND/criar_tabelas_supabase.sql
```

#### Executar a coleta de dados

```bash
# Coleta estados e população via API IBGE (sem autenticação)
python coleta/coletar_ibge.py

# Coleta transferências constitucionais do Tesouro Nacional
python coleta/coletar_transferencias.py

# Processa e carrega tudo no Supabase
python ETL/etl_supabase.py
```

---

### 3. Configurar o Frontend

```bash
cd ../dashboard-tcc
```

#### Instalar dependências Node

```bash
npm install
```

#### Configurar variáveis de ambiente

Crie o arquivo `.env` na pasta `dashboard-tcc/` com o conteúdo:

```env
REACT_APP_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGci...
```

#### Iniciar o dashboard

```bash
npm start
```

Acesse em: **http://localhost:3000**

---

## 🗄️ Banco de Dados (Supabase)

### Modelo Estrela — Data Mart

| Tabela | Descrição |
|---|---|
| `dim_estado` | 27 estados com sigla, nome, região, capital e ID IBGE |
| `dim_populacao` | Estimativas populacionais por estado e ano (2010–2025) |
| `dim_tempo` | Dimensão temporal (ano, década) |
| `dim_tipo_transferencia` | Tipos de transferência (FPE, IPI, ICMS, etc.) |
| `fato_transferencias` | Tabela fato com valores transferidos e per capita |
| `agg_por_estado_ano` | Agregação por estado e ano |
| `agg_por_regiao_ano` | Agregação por região e ano |
| `agg_por_tipo_ano` | Agregação por tipo de transferência e ano |
| `agg_ranking_estados` | Ranking de estados por valor per capita |

---

## 📡 Fontes de Dados

| Fonte | Dado | Endpoint |
|---|---|---|
| IBGE Localidades | Estados e regiões | `servicodados.ibge.gov.br/api/v1/localidades/estados` |
| IBGE SIDRA | Censo 2010 | Tabela 1552, variável 93 |
| IBGE SIDRA | Estimativas 2011–2021 e 2023–2025 | Tabela 6579, variável 9324 |
| IBGE SIDRA | Censo 2022 | Tabela 9514, variável 93 |
| Tesouro Nacional | Transferências Constitucionais | CSVs mensais `Transferencia_Mensal_Estados_AAAAMM.csv` |

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | React 18, Recharts, Supabase JS |
| Backend | Python 3, Pandas, Requests |
| Banco de Dados | PostgreSQL via Supabase |
| Estilo | CSS customizado com variáveis |
| Fontes | Google Fonts (Syne + DM Mono) |

---

## 📚 Referências

- IBGE. *Estimativas Populacionais*. Disponível em: https://servicodados.ibge.gov.br
- Tesouro Nacional. *Transferências Constitucionais para Estados*. Disponível em: https://www.tesourotransparente.gov.br
- Portal da Transparência. *API de Dados*. Disponível em: https://portaldatransparencia.gov.br/api-de-dados
- KIMBALL, R.; ROSS, M. *The Data Warehouse Toolkit*. 3. ed. Indianapolis: Wiley, 2013.

---

## 📄 Licença

Projeto acadêmico — ULBRA Palmas, 2025.

---

## 🔄 Como o ETL Funciona Hoje

### Fluxo Atual

```
API IBGE Localidades          API IBGE SIDRA
       │                            │
       ▼                            ▼
  27 estados                 405 registros
  sigla, nome,               população por
  região, capital            estado e ano
       │                            │
       └──────────┬─────────────────┘
                  ▼
           coletar_ibge.py
           (Extração + Transformação)
                  │
                  ▼
    ┌─────────────────────────┐
    │  Transformações:        │
    │  - mapeia nome → sigla  │
    │  - remove duplicatas    │
    │  - ordena por ano e UF  │
    └─────────────────────────┘
                  │
                  ▼
            Supabase
    ┌─────────────────────────┐
    │  dim_estado (27 linhas) │
    │  dim_populacao (405)    │
    └─────────────────────────┘
```

### Detalhamento por Etapa

**E — Extração**
- `coletar_ibge.py` consome duas APIs públicas do IBGE sem autenticação
- API de Localidades → 27 estados com sigla, nome, região e capital
- API SIDRA tabela 1552 → Censo 2010
- API SIDRA tabela 6579 → Estimativas 2011–2021 e 2023–2025
- API SIDRA tabela 9514 → Censo 2022

**T — Transformação**
- Mapeia nome completo do estado para sigla UF
- Remove registros com sigla nula ou população zerada
- Elimina duplicatas mantendo o dado mais recente por estado/ano
- Ordena por sigla e ano antes de carregar

**L — Carga**
- Insere no Supabase via biblioteca `supabase-py`
- Usa `upsert` para não duplicar em reexecuções
- Carrega em lotes de 500 registros
- Tabelas carregadas: `dim_estado` e `dim_populacao`

### Status das Etapas

| Etapa | Descrição | Status |
|---|---|---|
| Estados e população IBGE | 27 estados × 16 anos (2010–2025) | ✅ Concluído |
| Transferências Tesouro Nacional | CSVs mensais por estado e tipo | ⏳ Próxima etapa |
| Cálculo per capita | Valor transferido ÷ população | ⏳ Após transferências |
| Agregações por região e tipo | Totais agrupados para o dashboard | ⏳ Após transferências |
| Tabela fato completa | Modelo estrela finalizado | ⏳ Após transferências |
