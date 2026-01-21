const InboxFilters = ({ searchQuery, onSearchChange, category, onCategoryChange, importance, onImportanceChange, fromDate, onFromDateChange, toDate, onToDateChange, onClearFilters }) => {
  const hasActiveFilters = category !== "all" || importance !== "all" || searchQuery || fromDate || toDate;

  return (
    <div className="card-premium p-4 space-y-4">
      {/* Search */}
      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search emails..."
          className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-slate-900"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-slate-900"
          >
            <option value="all">All</option>
            <option value="Work">Work</option>
            <option value="Bills">Bills</option>
            <option value="Social">Social</option>
            <option value="Promotions">Promotions</option>
            <option value="Urgent">Urgent</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Importance</label>
          <select
            value={importance}
            onChange={(e) => onImportanceChange(e.target.value)}
            className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-slate-900"
          >
            <option value="all">All</option>
            <option value="5">5 - Very Important</option>
            <option value="4">4 - Important</option>
            <option value="3">3 - Normal</option>
            <option value="2">2 - Low</option>
            <option value="1">1 - Very Low</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default InboxFilters;

