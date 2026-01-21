import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const defaultColors = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#6366f1", "#14b8a6"];

const DonutChart = ({ data = [], innerRadius = 60, outerRadius = 90, title = "" }) => {
  const chartData = data.map((item, idx) => ({ ...item, fill: item.color || defaultColors[idx % defaultColors.length] }));

  return (
    <div className="card-premium p-6 h-80 animate-fadeIn" style={{ animationDelay: '100ms' }}>
      {title ? <h3 className="text-lg font-bold text-indigo-600 mb-6">{title}</h3> : null}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius} paddingAngle={2}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DonutChart;
