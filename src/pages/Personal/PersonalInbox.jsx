import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import API_PATHS, { API_BASE_URL } from '../../utils/apiPaths';
import PersonalEmailList from '../../components/personal/inbox/PersonalEmailList';
import PersonalEmailDetailsModal from '../../components/personal/inbox/PersonalEmailDetailsModal';

const PersonalInbox = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncCount, setSyncCount] = useState(0);
  const [syncStartTime, setSyncStartTime] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [error, setError] = useState(null);
  const [statusError, setStatusError] = useState(null);

  // Filter & Search
  // Default to ALL to ensure all emails are visible (HR Parity/User Request)
  const [label, setLabel] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 20;
  const syncLimit = 500; // Allow syncing up to 500 emails based on filters
  const [totalEmails, setTotalEmails] = useState(0);

  // Status
  const [gmailStatus, setGmailStatus] = useState(null);
  const [autoSynced, setAutoSynced] = useState(false);

  const handleConnectGmail = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user?.token) {
        navigate('/login');
        return;
      }
      const url = `${API_BASE_URL}/gmail/auth?token=${encodeURIComponent(user.token)}&redirect=personal`;
      window.location.href = url;
    } catch (e) {
      console.error('Failed to start Gmail OAuth:', e);
    }
  };

  // Auto sync function (Exact match to HR)
  const handleAutoSync = async () => {
    // Set default date to today (Matches HR Inbox logic)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setStartDate(today.toISOString().split('T')[0]);
  };

  // Fetch Gmail status on mount and auto-sync (Exact match to HR)
  useEffect(() => {
    checkGmailStatus();
    if (!autoSynced) {
      handleAutoSync();
      setAutoSynced(true);
    }
  }, []);

  // Handle OAuth Redirect processing
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gmailParam = urlParams.get("gmail");

    if (gmailParam === "connected") {
      window.history.replaceState({}, "", window.location.pathname);
      checkGmailStatus().then(() => {
        handleSync(); // Auto sync on connect
      });
    } else if (gmailParam === "error") {
      const msg = urlParams.get("message") || "Failed to connect Gmail";
      setError(msg);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Fetch emails when filters change (Exact match to HR)
  useEffect(() => {
    if (!statusError) {
      fetchEmails();
    }
  }, [label, searchQuery, page, statusError, startDate, endDate]);

  const checkGmailStatus = async () => {
    try {
      // Get sync state
      const syncStateResponse = await axiosInstance.get(API_PATHS.GMAIL_SYNC_STATE, {
        params: { scope: 'inbox' },
      });

      const syncState = syncStateResponse.data || {};

      // Get actual total count from database
      const emailsCountResponse = await axiosInstance.get(API_PATHS.GMAIL_LOCAL_SEARCH, {
        params: { limit: 1 }, // Just need the count, not all emails
      });

      // Use the count field from response (actual DB count)
      const totalCount = emailsCountResponse.data?.count || 0;
      const lastSync = syncState.lastSyncedAt || syncState.updatedAt || null;

      setGmailStatus({
        lastSync,
        totalMessages: totalCount,
        syncedCount: totalCount,
      });
      setStatusError(null);
    } catch (err) {
      if (err.response?.status === 503) {
        setStatusError('Gmail is not configured on the server. Contact admin to set up Google credentials.');
      } else if (err.response?.status === 401) {
        setStatusError('Gmail not connected. Please connect your account.');
      } else {
        console.error('Status error:', err);
        setGmailStatus({
          lastSync: null,
          totalMessages: 0,
          syncedCount: 0,
        });
      }
    }
  };

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchQuery) params.keyword = searchQuery;
      // HR Logic: If label is ALL, do not send labelIds to search all
      if (label !== 'ALL') params.labelIds = label;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      params.limit = limit;
      // Add skip for pagination (offset)
      params.skip = (page - 1) * limit;

      const response = await axiosInstance.get(API_PATHS.GMAIL_LOCAL_SEARCH, {
        params,
      });

      // Ensure emails are sorted by date descending (newest first) - Frontend safety sort needed by HR
      const emails = (response.data.emails || []).sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
      setEmails(emails);
      // Update total count based on current filters
      setTotalEmails(response.data.count || 0);
    } catch (err) {
      setError('Failed to fetch emails');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync Logic (Exact copy of HR handleSync structure)
  const handleSync = async () => {
    setSyncing(true);
    setSyncCount(0);
    const startTime = Date.now();
    setSyncStartTime(startTime);
    setEstimatedTime(null);
    setError(null);
    try {
      let pageToken = null;
      let totalSynced = 0;
      let totalSkipped = 0;
      let totalProcessed = 0; // Track total emails checked

      while (totalProcessed < syncLimit) {
        const requestStartTime = Date.now();

        // Build sync request with current filters
        const syncRequest = {
          limit: Math.min(20, syncLimit - totalProcessed),
          pageToken,
          labelIds: label === 'ALL' ? ['INBOX'] : [label],
          scope: label === 'ALL' ? 'inbox' : label.toLowerCase(),
        };

        // Add date range filters if set
        if (startDate) syncRequest.startDate = startDate;
        if (endDate) syncRequest.endDate = endDate;

        const response = await axiosInstance.post(API_PATHS.GMAIL_SYNC_PAGE, syncRequest);

        const requestDuration = Date.now() - requestStartTime;
        const syncedThisPage = response.data.synced || 0;
        const skippedThisPage = response.data.skipped || 0;
        const processedThisPage = syncedThisPage + skippedThisPage;

        totalSynced += syncedThisPage;
        totalSkipped += skippedThisPage;
        totalProcessed += processedThisPage;

        // Update counter with processed count
        setSyncCount(totalProcessed);

        // Calculate estimated time remaining based on actual request performance
        if (totalProcessed > 0 && totalProcessed < syncLimit && response.data.nextPageToken) {
          const totalElapsed = Date.now() - startTime;
          const avgTimePerBatch = totalElapsed / Math.ceil(totalProcessed / 20);
          const remaining = syncLimit - totalProcessed;

          // Estimate based on how many requests we'll need
          const requestsRemaining = Math.ceil(remaining / 20);
          const estimatedMs = avgTimePerBatch * requestsRemaining;

          const estimatedSeconds = Math.max(1, Math.ceil(estimatedMs / 1000));
          setEstimatedTime(estimatedSeconds);
        } else {
          setEstimatedTime(0);
        }

        // Stop if we've processed enough or no more pages
        if (totalProcessed >= syncLimit || !response.data.nextPageToken) break;
        pageToken = response.data.nextPageToken;
      }

      setPage(1);
      await fetchEmails();
      await checkGmailStatus(); // Refresh status after sync
      setError(null);
      setSyncCount(0);
      setEstimatedTime(null);
    } catch (err) {
      const msg = err?.response?.data?.message || '';
      if (err.response?.status === 503) {
        setError('Gmail not configured. Please set up Google credentials.');
      } else if (
        err.response?.status === 401 ||
        msg.toLowerCase().includes('gmail') ||
        msg.includes('No Gmail tokens') ||
        msg.includes('انتهت صلاحية')
      ) {
        setStatusError('Gmail not connected for this account. Please connect to proceed.');
      } else {
        setError('Failed to sync emails');
        setStatusError(
          'Gmail may not be connected for this account. Please click Connect Gmail and authorize.'
        );
      }
      console.error('Sync error:', err);
      setSyncCount(0);
      setEstimatedTime(null);
    } finally {
      setSyncing(false);
      setSyncStartTime(null);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleSelectEmail = (email) => {
    setSelectedEmail(email);
  };

  const handleCloseModal = () => {
    setSelectedEmail(null);
  };

  const handleEmailUpdate = (updatedEmail) => {
    setEmails(emails.map(e => e._id === updatedEmail._id ? updatedEmail : e));
    if (selectedEmail?._id === updatedEmail._id) {
      setSelectedEmail(updatedEmail);
    }
  };

  const handleNextPage = () => {
    setPage(page + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const formatTimeRemaining = (seconds) => {
    if (seconds < 60) {
      return `~${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `~${minutes}m`;
    }
    return `~${minutes}m ${remainingSeconds}s`;
  };

  if (statusError) {
    return (
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inbox</h1>
            <p className="text-sm text-gray-500">Gmail inbox (read-only)</p>
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-yellow-700 flex-1 min-w-0 break-words">
              {statusError}
            </p>
            <button
              onClick={handleConnectGmail}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-600/30 whitespace-nowrap flex-shrink-0"
            >
              {t('personal.inbox.connectGmail')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slideUp flex-shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600">{t('personal.inbox.title')}</h1>
          <p className="text-sm text-slate-600 font-medium mt-1">{t('personal.inbox.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`px-5 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm sm:text-base whitespace-nowrap shadow-lg ${syncing
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/30 hover:shadow-xl hover:scale-105 active:scale-95'
              }`}
          >
            {syncing ? (
              <>
                <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="truncate">{t('personal.inbox.syncing')} ({syncCount}/{syncLimit})</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{t('personal.inbox.syncEmails')}</span>
              </>
            )}
          </button>
          {syncing && estimatedTime !== null && (
            <div className={`flex items-center gap-2 text-xs text-gray-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-blue-700">
                {estimatedTime > 0 ? formatTimeRemaining(estimatedTime) : t('personal.inbox.almostDone')} {t('personal.inbox.remaining')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded flex-shrink-0">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4 flex-shrink-0">
        <div className="flex gap-4 flex-wrap items-end">
          {/* Label Filter */}
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('personal.inbox.filterByLabel')}</label>
            <select
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="INBOX">{t('personal.inbox.allLabel')}</option>
              <option value="IMPORTANT">{t('personal.inbox.importantLabel')}</option>
              <option value="STARRED">{t('personal.inbox.starredLabel')}</option>
              <option value="SENT">{t('personal.inbox.sentLabel')}</option>
              <option value="ALL">{t('personal.inbox.allLabel')}</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('personal.inbox.from')}</label>
            <input
              type="date"
              value={startDate || ''}
              onChange={(e) => {
                setStartDate(e.target.value || null);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* End Date */}
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('personal.inbox.to')}</label>
            <input
              type="date"
              value={endDate || ''}
              onChange={(e) => {
                setEndDate(e.target.value || null);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Clear Filters */}
          {(startDate || endDate || label !== 'INBOX' || searchQuery) && (
            <button
              onClick={() => {
                setLabel('INBOX');
                setSearchQuery('');
                setStartDate(null);
                setEndDate(null);
                setPage(1);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-all"
            >
              {t('personal.inbox.clearFilters')}
            </button>
          )}
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('personal.inbox.search')}</label>
          <input
            type="text"
            placeholder={t('personal.inbox.searchEmails')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${i18n.language === 'ar' ? 'text-right' : ''}`}
          />
        </div>

        {/* Active Filters Display */}
        {(startDate || endDate || label !== 'INBOX' || searchQuery) && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
            <span className="text-xs font-semibold text-gray-600">{t('personal.inbox.activeFilters')}:</span>
            {label !== 'INBOX' && (
              <span className="inline-block px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                {t('personal.inbox.filterByLabel')}: {label}
              </span>
            )}
            {startDate && (
              <span className="inline-block px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                {t('common.today')}: {startDate}
              </span>
            )}
            {endDate && (
              <span className="inline-block px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                {t('personal.inbox.to')}: {endDate}
              </span>
            )}
            {searchQuery && (
              <span className="inline-block px-2.5 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                {t('personal.inbox.search')}: {searchQuery}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Email List */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto min-h-0">
          <PersonalEmailList
            emails={emails}
            loading={loading}
            onSelectEmail={handleSelectEmail}
            selectedId={selectedEmail?._id}
            highlightQuery={searchQuery}
          />
        </div>

        {/* Pagination */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <button
            onClick={handlePrevPage}
            disabled={page === 1}
            className={`px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-all ${page === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}
          >
            {t('common.previous')}
          </button>
          <span className="text-sm font-medium text-gray-600">
            {t('common.page')} {page} {totalEmails > 0 && `${t('dashboard.of')} ${Math.ceil(totalEmails / limit)}`}
          </span>
          <button
            onClick={handleNextPage}
            disabled={emails.length < limit}
            className={`px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-all ${emails.length < limit
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}
          >
            {t('common.next')}
          </button>
        </div>
      </div>

      {/* Email Modal */}
      {selectedEmail && (
        <PersonalEmailDetailsModal
          email={selectedEmail}
          onClose={handleCloseModal}
          onUpdate={handleEmailUpdate}
        />
      )}
    </div>
  );
};

export default PersonalInbox;
