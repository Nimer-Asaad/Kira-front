import moment from "moment";

const EmailList = ({ emails, selectedEmail, onSelectEmail, loading }) => {
  const getCategoryColor = (category) => {
    const colors = {
      Work: "bg-blue-100 text-blue-800",
      Bills: "bg-red-100 text-red-800",
      Social: "bg-green-100 text-green-800",
      Promotions: "bg-purple-100 text-purple-800",
      Urgent: "bg-orange-100 text-orange-800",
      Other: "bg-gray-100 text-gray-800",
    };
    return colors[category] || colors.Other;
  };

  const getImportanceColor = (importance) => {
    if (importance >= 4) return "bg-red-500";
    if (importance >= 3) return "bg-orange-500";
    return "bg-gray-400";
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card-premium p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="card-premium p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No emails</h3>
        <p className="mt-2 text-sm text-gray-500">Sync your Gmail to see emails here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {emails.map((email) => (
        <div
          key={email._id}
          onClick={() => onSelectEmail(email)}
          className={`card-premium p-4 cursor-pointer transition-all hover:shadow-md hover:bg-gray-50 ${
            selectedEmail?._id === email._id ? "ring-2 ring-purple-500 bg-purple-50" : ""
          } ${!email.isRead ? "bg-blue-50" : ""}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-bold text-gray-900 mb-1">
                {email.fromName || email.fromEmail}
              </p>
              <p className="text-sm font-medium text-gray-800 mb-1">
                {email.subject}
              </p>
              <p className="text-xs text-gray-600 line-clamp-2">
                {email.snippet}
              </p>
            </div>
            <div className="text-xs text-gray-500 whitespace-nowrap">
              {moment(email.receivedAt).format("MMM D")}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmailList;

