const PersonalAssistant = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slideUp">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-indigo-600 mb-2">
            Kira Assistant
          </h1>
          <p className="text-sm text-slate-600 font-medium">Get help and answers from your AI assistant</p>
        </div>
      </div>

      <div className="card-premium p-8 text-center">
        <p className="text-slate-600">Assistant interface will be displayed here</p>
      </div>
    </div>
  );
};

export default PersonalAssistant;


