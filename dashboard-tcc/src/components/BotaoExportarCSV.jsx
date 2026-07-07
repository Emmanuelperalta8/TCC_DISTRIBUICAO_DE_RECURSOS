function converterParaCSV(dados, colunas) {
  const cabecalho = colunas.map((c) => c.label).join(";");
  const linhas = dados.map((row) =>
    colunas
      .map((c) => {
        const val = row[c.key] ?? "";
        const str = String(val).replace(/"/g, '""');
        return str.includes(";") ? `"${str}"` : str;
      })
      .join(";")
  );
  return [cabecalho, ...linhas].join("\n");
}

function baixarCSV(conteudo, nomeArquivo) {
  const bom = "﻿"; // BOM para Excel reconhecer UTF-8
  const blob = new Blob([bom + conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}

export default function BotaoExportarCSV({ dados, colunas, nomeArquivo = "dados.csv", label = "Exportar CSV" }) {
  if (!dados?.length) return null;

  function handleClick() {
    const csv = converterParaCSV(dados, colunas);
    baixarCSV(csv, nomeArquivo);
  }

  return (
    <button
      className="btn-exportar"
      onClick={handleClick}
      title={`Baixar ${nomeArquivo}`}
      aria-label={`Exportar dados como CSV: ${nomeArquivo}`}
    >
      ↓ {label}
    </button>
  );
}
