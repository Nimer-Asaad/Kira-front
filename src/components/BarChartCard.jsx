import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

const BarChartCard = ({ data = [], barKey = "value", xKey = "name", title = "" }) => {
  return (
    <div className="card-premium p-6 h-80 animate-fadeIn" style={{ animationDelay: '150ms' }}>
      {title ? <h3 className="text-lg font-bold text-indigo-600 mb-6">{title}</h3> : null}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
          <XAxis dataKey={xKey} stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" allowDecimals={false} fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }} 
          />
          <Legend />
          <Bar dataKey={barKey} fill="url(#gradientBar)" radius={[8, 8, 0, 0]} />
          <defs>
            <linearGradient id="gradientBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartCard;
