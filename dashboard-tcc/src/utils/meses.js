export const MESES = [
  { value: 1,  label: "Jan", nome: "Janeiro" },
  { value: 2,  label: "Fev", nome: "Fevereiro" },
  { value: 3,  label: "Mar", nome: "Março" },
  { value: 4,  label: "Abr", nome: "Abril" },
  { value: 5,  label: "Mai", nome: "Maio" },
  { value: 6,  label: "Jun", nome: "Junho" },
  { value: 7,  label: "Jul", nome: "Julho" },
  { value: 8,  label: "Ago", nome: "Agosto" },
  { value: 9,  label: "Set", nome: "Setembro" },
  { value: 10, label: "Out", nome: "Outubro" },
  { value: 11, label: "Nov", nome: "Novembro" },
  { value: 12, label: "Dez", nome: "Dezembro" },
];

export const nomeMes = (mes) => MESES.find((m) => m.value === mes)?.nome ?? "";
