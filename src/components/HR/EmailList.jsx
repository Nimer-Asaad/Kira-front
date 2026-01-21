const EmailList = ({ emails, loading, onSelectEmail, selectedId, highlightQuery, linkedMap = {}, onOpenApplicant }) => {
  const highlight = (text, query) => {
    if (!text) return '';
    if (!query || !query.trim()) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${escaped})`, 'gi');
    const parts = String(text).split(re);
    return parts.map((part, i) =>
      re.test(part) ? (
        <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-1">{part}</mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return null;
  }

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();

    if (isToday) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-2">
      {emails.map((email) => {
        const linkedApplicantId = linkedMap[email.gmailId];
        return (
          <button
            key={email._id}
            onClick={() => onSelectEmail(email)}
            className={`w-full text-left p-4 rounded-lg border transition-all ${selectedId === email._id
                ? 'bg-blue-50 border-blue-300 shadow-md'
                : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
              }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* From & Subject */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate" title={email.fromName || email.fromEmail || 'Unknown'}>
                      {highlight(email.fromName || email.fromEmail || 'Unknown', highlightQuery)}
                    </p>
                    {!email.isRead && (
                      <span className="inline-block w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                    )}
                  </div>
                  {/* Date for Mobile (Hidden on Desktop) */}
                  <span className="block sm:hidden text-[10px] text-gray-500 font-medium flex-shrink-0">
                    {formatDate(email.date)}
                  </span>
                </div>

                {/* Subject */}
                <p className={`text-sm mb-2 line-clamp-2 ${email.isRead ? 'text-gray-600' : 'font-medium text-gray-900'}`}>
                  {highlight(email.subject || '(no subject)', highlightQuery)}
                </p>

                {/* Snippet */}
                <p className="text-xs text-gray-500 line-clamp-1">
                  {highlight(email.snippet || '', highlightQuery)}
                </p>

                {/* Badges */}
                <div className="flex gap-2 mt-2 flex-wrap items-center">
                  {!email.isRead && (
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      Unread
                    </span>
                  )}
                  {email.isStarred && (
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                      Starred
                    </span>
                  )}
                  {email.hasAttachments && (
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                      📎 Attachment
                    </span>
                  )}
                  {email.conversionStatus && email.conversionStatus !== 'none' && (
                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${email.conversionStatus === 'converted'
                          ? 'bg-green-100 text-green-700'
                          : email.conversionStatus === 'deleted-applicant'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                      {email.conversionStatus === 'converted' && 'Converted'}
                      {email.conversionStatus === 'deleted-applicant' && 'Applicant deleted'}
                      {email.conversionStatus === 'not-converted' && 'Not converted'}
                      {email.conversionStatus === 'blocked' && 'Blocked'}
                    </span>
                  )}
                  {linkedApplicantId && email.conversionStatus !== 'deleted-applicant' && (
                    <span className="inline-flex items-center gap-2 px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                      Applicant
                      {onOpenApplicant && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenApplicant(email, linkedApplicantId);
                          }}
                          className="underline text-green-700 hover:text-green-800"
                        >
                          Open
                        </button>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Date for Desktop (Hidden on Mobile) */}
              <div className="hidden sm:block text-xs text-gray-500 flex-shrink-0 font-medium">
                {formatDate(email.date)}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default EmailList;
