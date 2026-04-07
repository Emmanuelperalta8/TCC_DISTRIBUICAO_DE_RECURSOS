import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const CORES_REGIOES = {
  "Norte": "#00c9a7", "Nordeste": "#f59e0b", "Sudeste": "#3b82f6",
  "Sul": "#a78bfa",   "Centro-Oeste": "#f43f5e",
};

export default function GraficoRegioes({ regioes, anoSel }) {
  return (
    <div className="card">
      <div className="card-title">População por Região — {anoSel}</div>
      <div className="card-sub">Participação de cada região na população total</div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={regioes}
            dataKey="populacao"
            nameKey="regiao"
            cx="50%" cy="50%"
            outerRadius={90}
            innerRadius={50}
            paddingAngle={3}
          >
            {regioes.map((entry, i) => (
              <Cell key={i} fill={CORES_REGIOES[entry.regiao] || "#3b82f6"} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => `${Number(v).toLocaleString("pt-BR")} hab.`} />
          <Legend formatter={(v) => <span style={{ fontSize: 11, color: "var(--muted)" }}>{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}