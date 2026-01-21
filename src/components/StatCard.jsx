const StatCard = ({
  label,
  value,
  icon = null,
  helperText = "",
  accent = "blue",
}) => {
  const accentMap = {
    blue: "text-indigo-600 bg-gradient-to-br from-indigo-100 to-indigo-50 border-indigo-200/50",
    green:
      "text-emerald-600 bg-gradient-to-br from-emerald-100 to-emerald-50 border-emerald-200/50",
    yellow:
      "text-amber-600 bg-gradient-to-br from-amber-100 to-amber-50 border-amber-200/50",
    red: "text-rose-600 bg-gradient-to-br from-rose-100 to-rose-50 border-rose-200/50",
  };
  const badge = accentMap[accent] || accentMap.blue;

  return (
    <div
      className="card-premium group p-6 flex items-center justify-between gap-4 hover:border-indigo-300/50 transition-all duration-300 animate-fadeIn"
      style={{ animationDelay: "0ms" }}
    >
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-600 mb-2">{label}</p>
        <div className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          {value}
        </div>
        {helperText ? (
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {helperText}
          </p>
        ) : null}
      </div>
      {icon ? (
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${badge} border-2 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
        >
          {icon}
        </div>
      ) : null}
    </div>
  );
};

export default StatCard;
