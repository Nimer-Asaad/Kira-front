const TabsFilter = ({ tabs = [], activeId, onChange }) => {
  return (
    <div className="border-b border-gray-200 bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="flex flex-wrap px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange && onChange(tab.id)}
            className={`relative py-4 px-6 text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
              activeId === tab.id
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="relative z-10">{tab.label}</span>
            {typeof tab.count === "number" ? (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                activeId === tab.id 
                  ? "bg-blue-100 text-blue-700" 
                  : "bg-gray-100 text-gray-600"
              }`}>
                {tab.count}
              </span>
            ) : null}
            {activeId === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 transition-all duration-300 rounded-t"></span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabsFilter;
