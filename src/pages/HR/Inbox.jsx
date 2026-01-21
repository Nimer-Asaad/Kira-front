import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import API_PATHS, { API_BASE_URL } from '../../utils/apiPaths';
import HrLayout from '../../components/HrLayout';
import EmailList from '../../components/HR/EmailList';
import EmailDetailsModal from '../../components/HR/EmailDetailsModal';

const Inbox = () => {
  const { t } = useTranslation();
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
  const [label, setLabel] = useState('INBOX');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 20;
  const syncLimit = 500; // Allow syncing up to 500 emails based on filters
  const [autoSynced, setAutoSynced] = useState(false);
  const [totalEmails, setTotalEmails] = useState(0);
  const [linkedMap, setLinkedMap] = useState({});
  const [bulkConverting, setBulkConverting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  
  // Status
  const [gmailStatus, setGmailStatus] = useState(null);

  const handleConnectGmail = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user?.token) {
        navigate('/login');
        return;
      }
      const url = `${API_BASE_URL}/gmail/auth?token=${encodeURIComponent(user.token)}`;
      window.location.href = url;
    } catch (e) {
      console.error('Failed to start Gmail OAuth:', e);
    }
  };

  // Auto sync function
  const handleAutoSync = async () => {
    // Don't auto-sync, just set default date to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setStartDate(today.toISOString().split('T')[0]);
  };

  // Fetch Gmail status on mount and auto-sync
  useEffect(() => {
    checkGmailStatus();
    if (!autoSynced) {
      handleAutoSync();
      setAutoSynced(true);
    }
    // Load applicant links
    try {
      const raw = localStorage.getItem('kira_hr_email_applicant_map');
      setLinkedMap(raw ? JSON.parse(raw) : {});
    } catch (err) {
      console.error('Failed to load applicant map', err);
    }
  }, []);

  // Fetch emails when filters change
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
        // Set default empty status instead of error
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
      if (label !== 'ALL') params.labelIds = label;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      params.limit = limit;
      // Add skip for pagination (offset)
      params.skip = (page - 1) * limit;

      const response = await axiosInstance.get(API_PATHS.GMAIL_LOCAL_SEARCH, {
        params,
      });

      // Ensure emails are sorted by date descending (newest first)
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
        // Fallback: surface connect CTA even if message not matched
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
    const linkedId = linkedMap[email.gmailId];
    setSelectedEmail(linkedId ? { ...email, linkedApplicantId: linkedId } : email);
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

  const handleLinkedApplicant = (email, applicant) => {
    if (!email?.gmailId) return;
    // Only link if not marked as deleted
    if (email.conversionStatus === 'deleted-applicant') {
      return;
    }
    const updated = { ...linkedMap, [email.gmailId]: applicant._id || applicant.id || applicant.email };
    setLinkedMap(updated);
    try {
      localStorage.setItem('kira_hr_email_applicant_map', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to persist applicant map', err);
    }
  };

  const handleOpenApplicant = (email) => {
    const targetEmail = email?.fromEmail || email?.from || '';
    navigate('/hr/applicants', { state: { searchPrefill: targetEmail } });
  };

  const isCVEmail = (email) => {
    if (!email) return false;
    
    const subject = (email.subject || '').toLowerCase();
    const bodyText = (email.bodyText || email.snippet || '').toLowerCase();
    const fullText = `${subject} ${bodyText}`;
    
    // Keywords that indicate CV content
    const cvKeywords = [
      'cv', 'resume', 'curriculum vitae', 'سيرة ذاتية',
      'application', 'applying for',
      'experience', 'skills', 'qualification',
      'position', 'role', 'job',
    ];
    
    // Professional keywords that show real CV content
    const professionalKeywords = [
      'experience', 'years of experience', 'worked', 'worked at',
      'skills', 'expertise', 'proficient',
      'education', 'degree', 'graduated',
      'responsibility', 'achievements', 'project',
      'technical', 'programming', 'software',
      'languages', 'tools', 'technologies',
      'company', 'organization', 'department',
    ];
    
    // Check if it has CV keywords
    const cvKeywordMatches = cvKeywords.filter(kw => fullText.includes(kw)).length;
    
    // Check if it has professional content
    const professionalMatches = professionalKeywords.filter(kw => bodyText.includes(kw)).length;
    
    // Minimum content requirements
    const hasMinimumLength = bodyText.length > 100; // At least 100 chars of actual content
    const hasMultipleSentences = bodyText.split(/[.!?]/).filter(s => s.trim().length > 0).length >= 3;
    
    // Must have CV indicator + substantial professional content
    const isCVLike = cvKeywordMatches >= 1;
    const hasProfessionalContent = professionalMatches >= 2 || (hasMinimumLength && hasMultipleSentences);
    
    return isCVLike && hasProfessionalContent;
  };

  // Detect PDF attachment reliably (handle various mimeTypes)
  const findPdfAttachments = (email) => {
    if (!email || !Array.isArray(email.attachments)) return [];
    return email.attachments.filter((att) => {
      const name = (att.filename || '').toLowerCase();
      const mime = (att.mimeType || '').toLowerCase();
      // Accept .pdf extension OR pdf in mimeType (handles application/pdf, application/x-pdf, application/octet-stream + .pdf)
      const isPdf = name.endsWith('.pdf') || mime.includes('pdf');
      return isPdf;
    });
  };

  // Score CV likelihood (0-1) using keywords and heuristics
  const scoreCvLikelihood = (email) => {
    const subject = (email.subject || '').toLowerCase();
    const body = (email.bodyText || email.snippet || '').toLowerCase();
    const fullText = `${subject} ${body}`;
    const sender = (email.fromEmail || '').toLowerCase();

    let score = 0.5; // Base score

    // Positive keywords (CV/resume content)
    const cvKeywords = [
      'cv', 'resume', 'résumé', 'curriculum vitae',
      'application', 'job', 'position', 'role', 'candidate', 'hiring',
      'attached', 'portfolio', 'experience', 'skills', 'qualification',
      'years of experience', 'education', 'degree'
    ];
    const cvMatches = cvKeywords.filter(kw => fullText.includes(kw)).length;
    score += Math.min(cvMatches * 0.08, 0.25); // +0.08 per match, max +0.25

    // Negative keywords (NOT CV)
    const negativeKeywords = [
      'assignment', 'homework', 'coursework', 'quiz', 'exam',
      'invoice', 'receipt', 'payment', 'brochure', 'statement',
      'promotion', 'canva', 'marketing', 'newsletter', 'unsubscribe'
    ];
    const negativeMatches = negativeKeywords.filter(kw => fullText.includes(kw)).length;
    score -= negativeMatches * 0.15; // -0.15 per negative match

    // Newsletter sender
    if (sender.includes('linkedin') || sender.includes('canva') || sender.includes('noreply') || sender.includes('newsletter')) {
      score -= 0.3;
    }

    // Has PDF attachment (positive signal for CV)
    const pdfs = findPdfAttachments(email);
    if (pdfs.length > 0) {
      score += 0.15; // Boost for having PDF
    }

    // Content length and structure
    const bodyLength = (email.bodyText || '').length;
    if (bodyLength < 50) score -= 0.1; // Too short
    if (bodyLength > 200) score += 0.05; // Substantial content

    // Clamp score to 0-1
    return Math.max(0, Math.min(1, score));
  };

  // Strict PDF check with minimal size to avoid receipts or tiny PDFs
  const hasPdfAttachment = (email, minBytes = 0) => {
    if (!email || !Array.isArray(email.attachments)) return false;
    return email.attachments.some((att) => {
      const name = (att.filename || '').toLowerCase();
      const mime = (att.mimeType || '').toLowerCase();
      const size = Number(att.size || att.bodySize || 0);
      const isPdf = name.endsWith('.pdf') || mime.includes('pdf');
      // If size is 0 (unknown), assume it's ok; otherwise check minBytes
      return isPdf && (size === 0 || size >= minBytes);
    });
  };

  // Exclude common newsletter/marketing senders from auto-convert
  const isNewsletterSender = (email) => {
    const sender = (email.fromEmail || email.from || '').toLowerCase();
    return (
      sender.includes('linkedin') ||
      sender.includes('canva') ||
      sender.includes('noreply') ||
      sender.includes('no-reply') ||
      sender.includes('newsletter') ||
      sender.includes('notifications')
    );
  };

  // Blocklist certain subjects/content from being auto-converted (e.g., assignments, invoices)
  const isBlockedByKeywords = (email) => {
    const subject = (email.subject || '').toLowerCase();
    const body = (email.bodyText || email.snippet || '').toLowerCase();
    const text = `${subject} ${body}`;
    const blocked = [
      'assignment', 'homework', 'research assignment', 'coursework', 'quiz', 'exam',
      'invoice', 'receipt', 'payment', 'promotion', 'newsletter', 'marketing',
      'via linkedin', 'linkedin', 'canva', 'newsletter', 'noreply', 'no-reply'
    ];
    return blocked.some((kw) => text.includes(kw));
  };

  const handleBulkConvert = async () => {
    if (bulkConverting) return;
    if (!window.confirm('This will convert all emails with PDF attachments (based on current filters) into Applicants. Continue?')) {
      return;
    }

    setBulkConverting(true);
    setBulkProgress({ current: 0, total: 0 });

    try {
      const params = {};
      if (searchQuery) params.keyword = searchQuery;
      if (label !== 'ALL') params.labelIds = label;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      params.limit = 500;

      const response = await axiosInstance.get(API_PATHS.GMAIL_LOCAL_SEARCH, { params });
      const allEmails = response.data.emails || [];

      // Filter: must have at least one PDF attachment
      const emailsWithPdf = allEmails.filter((email) => hasPdfAttachment(email));

      if (emailsWithPdf.length === 0) {
        alert('No emails with PDF attachments found in current filters.');
        return;
      }

      // Score each email and filter by confidence threshold (0.55)
      const CV_CONFIDENCE_THRESHOLD = 0.55;
      const cvEmails = emailsWithPdf.filter((email) => {
        const score = scoreCvLikelihood(email);
        return score >= CV_CONFIDENCE_THRESHOLD;
      });

      const lowConfidenceCount = emailsWithPdf.length - cvEmails.length;

      if (cvEmails.length === 0 && lowConfidenceCount > 0) {
        alert(`Found ${lowConfidenceCount} email(s) with PDFs, but none scored high enough as CV (confidence < 0.55). You can open emails individually and fetch CV manually.`);
        return;
      }

      setBulkProgress({ current: 0, total: cvEmails.length });

      const currentMap = { ...linkedMap };
      let successCount = 0;
      let duplicateCount = 0;

      for (let i = 0; i < cvEmails.length; i++) {
        const email = cvEmails[i];

        // Check if already linked AND applicant still exists
        if (currentMap[email.gmailId]) {
          try {
            await axiosInstance.get(API_PATHS.HR_APPLICANT_BY_ID(currentMap[email.gmailId]));
            // Applicant exists, skip
            setBulkProgress({ current: i + 1, total: cvEmails.length });
            continue;
          } catch (err) {
            // Applicant deleted, remove from map and proceed to create new
            delete currentMap[email.gmailId];
          }
        }

        try {
          const safeText = `${email.subject || ''} ${email.bodyText || email.snippet || ''}`.trim();
          const compact = safeText.length > 220 ? `${safeText.slice(0, 220)}...` : safeText;
          const inferredPosition = (() => {
            if (!email.subject) return '';
            const parts = email.subject.split(/[-–|]|:/);
            return parts[0]?.trim() || '';
          })();
          const attachmentNote = `Attachments: ${email.attachments.map((a) => a.filename).filter(Boolean).join(', ')}`;
          const notesCombined = [compact || 'Imported from Gmail inbox.', attachmentNote].filter(Boolean).join('\n');

          const payload = {
            fullName: email.fromName || email.fromEmail || '',
            email: email.fromEmail || '',
            position: inferredPosition,
            notes: notesCombined,
            stage: 'Applied',
          };

          const createRes = await axiosInstance.post(API_PATHS.HR_APPLICANTS, payload);
          const created = createRes?.data || payload;

          // Attach the detected PDF CV
          try {
            await axiosInstance.post(API_PATHS.HR_GMAIL_EMAIL_ATTACH_CV(email._id), {
              applicantId: created._id || created.id,
            });
          } catch (cvErr) {
            console.warn(`Failed to attach CV for ${email.fromEmail}:`, cvErr.message);
          }

          // Mark email as converted in database
          try {
            await axiosInstance.patch(`/api/gmail/emails/${email._id}/mark-converted`, {
              applicantId: created._id || created.id,
            });
          } catch (markErr) {
            console.warn('Failed to mark email as converted:', markErr.message);
          }

          currentMap[email.gmailId] = created._id || created.id || created.email;
          successCount++;
        } catch (err) {
          const msg = err?.response?.data?.message || '';
          if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('exists')) {
            duplicateCount++;
            console.log(`Skipping duplicate: ${email.fromEmail}`);
          } else {
            console.error(`Failed to convert ${email.fromEmail}:`, err.message);
          }
        }

        setBulkProgress({ current: i + 1, total: cvEmails.length });
      }

      setLinkedMap(currentMap);
      try {
        localStorage.setItem('kira_hr_email_applicant_map', JSON.stringify(currentMap));
      } catch (err) {
        console.error('Failed to persist applicant map', err);
      }

      await fetchEmails();

      const createdMsg = `Bulk conversion complete: ${successCount} applicants created/updated out of ${cvEmails.length} emails.`;
      const dupMsg = duplicateCount ? `\n(${duplicateCount} duplicates already existed)` : '';
      alert(createdMsg + dupMsg);
    } catch (err) {
      console.error('Bulk convert error:', err);
      alert('Failed to perform bulk conversion. Check console for details.');
    } finally {
      setBulkConverting(false);
      setBulkProgress({ current: 0, total: 0 });
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
      <HrLayout>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("hr.inbox.title")}</h1>
            <p className="text-sm text-gray-500">{t("hr.inbox.subtitle")}</p>
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-yellow-700 flex-1 min-w-0 break-words">
              <strong>Gmail Not Connected:</strong> {statusError}
            </p>
            <button
              onClick={handleConnectGmail}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-600/30 whitespace-nowrap flex-shrink-0"
            >
              {t("hr.inbox.connectGmail")}
            </button>
          </div>
        </div>
      </HrLayout>
    );
  }

  return (
    <HrLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slideUp">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600">{t("hr.inbox.title")}</h1>
            <p className="text-sm text-slate-600 font-medium mt-1">{t("hr.inbox.subtitle")}</p>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className={`px-5 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm sm:text-base whitespace-nowrap shadow-lg ${
                syncing
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
                  <span className="truncate">{t("hr.inbox.syncing")} ({syncCount}/{syncLimit})</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{t("hr.inbox.syncEmails")}</span>
                </>
              )}
            </button>
            {syncing && estimatedTime !== null && (
              <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-blue-700">
                  {estimatedTime > 0 ? formatTimeRemaining(estimatedTime) : 'Almost done'} remaining
                </span>
              </div>
            )}
            <button
              onClick={handleBulkConvert}
              disabled={bulkConverting || syncing}
              className={`px-5 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm sm:text-base whitespace-nowrap shadow-lg ${
                bulkConverting || syncing
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-green-600/30 hover:shadow-xl hover:scale-105 active:scale-95'
              }`}
            >
              {bulkConverting ? (
                <>
                  <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="truncate">{t("hr.inbox.converting")} ({bulkProgress.current}/{bulkProgress.total})</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="truncate">{t("hr.inbox.bulkConvertApplicants")}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
          <div className="flex gap-4 flex-wrap items-end">
            {/* Label Filter */}
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t("hr.inbox.filterByLabel")}</label>
              <select
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="INBOX">{t("hr.inbox.allLabel")}</option>
                <option value="IMPORTANT">{t("hr.inbox.importantLabel")}</option>
                <option value="STARRED">{t("hr.inbox.starredLabel")}</option>
                <option value="SENT">{t("hr.inbox.sentLabel")}</option>
                <option value="ALL">{t("hr.inbox.allLabel")}</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t("hr.inbox.from")}</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">{t("hr.inbox.to")}</label>
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
                {t("hr.inbox.clearFilters")}
              </button>
            )}
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t("hr.inbox.search")}</label>
            <input
              type="text"
              placeholder={t("hr.inbox.searchEmails")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Active Filters Display */}
          {(startDate || endDate || label !== 'INBOX' || searchQuery) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
              <span className="text-xs font-semibold text-gray-600">Active Filters:</span>
              {label !== 'INBOX' && (
                <span className="inline-block px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                  Label: {label}
                </span>
              )}
              {startDate && (
                <span className="inline-block px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  From: {startDate}
                </span>
              )}
              {endDate && (
                <span className="inline-block px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  To: {endDate}
                </span>
              )}
              {searchQuery && (
                <span className="inline-block px-2.5 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                  Search: {searchQuery}
                </span>
              )}
            </div>
          )}

          {/* Status Info */}
          {gmailStatus && (
            <div className="flex items-center gap-4 text-xs border-t border-gray-200 pt-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700 font-medium">
                  Total emails: <span className="text-blue-600 font-semibold">{totalEmails || 0}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-600">
                  Last synced: {' '}
                  <span className="font-medium">
                    {gmailStatus.lastSync 
                      ? new Date(gmailStatus.lastSync).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : 'Never'
                    }
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Email List */}
        <EmailList
          emails={emails}
          loading={loading}
          onSelectEmail={handleSelectEmail}
          selectedId={selectedEmail?._id}
          highlightQuery={searchQuery}
          linkedMap={linkedMap}
          onOpenApplicant={handleOpenApplicant}
        />

        {/* Pagination & Load More */}
        {!loading && emails.length > 0 && (
          <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4 gap-4">
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                ← Previous
              </button>
              <span className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                Page {page}
              </span>
              <button
                onClick={handleNextPage}
                disabled={emails.length < limit}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next →
              </button>
            </div>
            
            {/* Load More Button */}
            <button
              onClick={handleNextPage}
              disabled={emails.length < limit}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 transition-all"
            >
              Load More ({emails.length} of {totalEmails || '?'})
            </button>
          </div>
        )}

        {/* No Emails */}
        {!loading && emails.length === 0 && !error && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-gray-500">{t("hr.inbox.noEmails")}</p>
          </div>
        )}
      </div>

      {/* Email Details Modal */}
      {selectedEmail && (
        <EmailDetailsModal
          email={selectedEmail}
          onClose={handleCloseModal}
          onUpdate={handleEmailUpdate}
          onLinkedApplicant={handleLinkedApplicant}
        />
      )}
    </HrLayout>
  );
};

export default Inbox;
