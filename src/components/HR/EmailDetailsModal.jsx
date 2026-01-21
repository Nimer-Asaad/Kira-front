import { useState, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import API_PATHS from '../../utils/apiPaths';

const STORAGE_KEY = 'kira_hr_email_applicant_map';

const loadLinkMap = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to read applicant map', err);
    return {};
  }
};

const saveLinkMap = (map) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.error('Failed to save applicant map', err);
  }
};

const EmailDetailsModal = ({ email, onClose, onUpdate, onLinkedApplicant }) => {
  const [aiSummary, setAiSummary] = useState(email.aiSummary);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [showConvert, setShowConvert] = useState(false);
  const [convertError, setConvertError] = useState(null);
  const [savingApplicant, setSavingApplicant] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const uploadInputRef = useRef(null);
  const { user } = useAuth();

  const hasPdfAttachment = (em) => {
    if (!em || !Array.isArray(em.attachments)) return false;
    return em.attachments.some((att) => {
      const name = (att.filename || '').toLowerCase();
      const mime = (att.mimeType || '').toLowerCase();
      // Accept .pdf extension OR pdf in mimeType
      const isPdf = name.endsWith('.pdf') || mime.includes('pdf');
      return isPdf;
    });
  };
  const isBlockedByKeywords = (em) => {
    const subject = (em.subject || '').toLowerCase();
    const bodyText = (em.bodyText || em.snippet || '').toLowerCase();
    const text = `${subject} ${bodyText}`;
    const blocked = [
      'assignment', 'homework', 'research assignment', 'coursework', 'quiz', 'exam',
      'invoice', 'receipt', 'payment', 'promotion', 'newsletter', 'marketing',
      'via linkedin', 'linkedin', 'canva', 'noreply', 'no-reply'
    ];
    return blocked.some((kw) => text.includes(kw));
  };
  const isMarkedBlocked = ['blocked', 'not-converted'].includes(email.conversionStatus);
  const isDeletedApplicant = email.conversionStatus === 'deleted-applicant';
  const canConvertStrict = hasPdfAttachment(email) && !isBlockedByKeywords(email) && !isMarkedBlocked;

  const canConvert = useMemo(() => {
    const role = (user?.role || '').toLowerCase();
    return role === 'admin' || role === 'hr';
  }, [user]);

  const defaultConvertForm = useMemo(() => {
    const safeText = `${email.subject || ''} ${email.bodyText || email.snippet || ''}`.trim();
    const compact = safeText.length > 220 ? `${safeText.slice(0, 220)}...` : safeText;
    // Try to infer position from subject (before dash or first phrase)
    const inferredPosition = (() => {
      if (!email.subject) return '';
      const parts = email.subject.split(/[-–|]|:/);
      return parts[0]?.trim() || '';
    })();
    const attachmentNote = (email.attachments && email.attachments.length)
      ? `Attachments (${email.attachments.length}): ${email.attachments.map(a => a.filename).filter(Boolean).join(', ')}`
      : '';
    const notesCombined = [compact || 'Imported from Gmail inbox.', attachmentNote].filter(Boolean).join('\n');
    return {
      fullName: email.fromName || email.fromEmail || '',
      email: email.fromEmail || '',
      position: inferredPosition,
      notes: notesCombined,
    };
  }, [email]);
  const [convertForm, setConvertForm] = useState(defaultConvertForm);

  const openConvert = () => {
    setConvertForm(defaultConvertForm);
    setConvertError(null);
    setShowConvert(true);
  };

  const attachCvFromGmail = async (applicantId) => {
    if (!applicantId) return;
    if (!email.hasAttachments && !(email.attachments && email.attachments.length)) {
      setConvertError('No attachments found on this email.');
      return;
    }

    try {
      setUploadingCv(true);
      // Verify applicant exists; recreate if deleted
      if (applicantId) {
        try {
          await axiosInstance.get(API_PATHS.HR_APPLICANT_BY_ID(applicantId));
        } catch (e) {
          applicantId = null;
        }
      }
      if (!applicantId) {
        const created = await createApplicant({ ...defaultConvertForm, stage: 'Applied' }, undefined, { skipAutoCvFetch: true });
        applicantId = created._id || created.id;
      }

      await axiosInstance.post(API_PATHS.HR_GMAIL_EMAIL_ATTACH_CV(email._id), { applicantId });
      alert('CV fetched from Gmail and attached to applicant');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to fetch CV from Gmail. Download and upload manually.';
      setConvertError(msg);
    } finally {
      setUploadingCv(false);
    }
  };

  const createApplicant = async (payload, onSuccess, options = {}) => {
    setSavingApplicant(true);
    setConvertError(null);
    try {
      const response = await axiosInstance.post(API_PATHS.HR_APPLICANTS, payload);
      const created = response?.data || payload;
      const currentMap = loadLinkMap();
      if (email.gmailId) {
        currentMap[email.gmailId] = created._id || created.id || created.email;
        saveLinkMap(currentMap);
      }
      onUpdate?.({ ...email, linkedApplicantId: created._id || created.id, linkedApplicantEmail: created.email });
      onLinkedApplicant?.(email, created);
      onSuccess?.(created);
      // Auto-fetch CV from Gmail if available (unless explicitly skipped)
      if (!options.skipAutoCvFetch && (email.hasAttachments || (email.attachments && email.attachments.length)) && email._id) {
        try {
          await attachCvFromGmail(created._id || created.id);
        } catch (cvErr) {
          console.error('Auto CV fetch failed', cvErr);
        }
      }
      // Mark email as converted in database
      try {
        if (email._id) {
          await axiosInstance.patch(`/api/gmail/emails/${email._id}/mark-converted`, {
            applicantId: created._id || created.id,
          });
        }
      } catch (markErr) {
        console.warn('Failed to mark email as converted:', markErr.message);
      }
      alert('Applicant created successfully');
      return created;
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create applicant';
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('exists')) {
        setConvertError('This email already exists as an applicant. You can open the Applicants page to view it.');
      } else {
        setConvertError(msg);
      }
    } finally {
      setSavingApplicant(false);
    }
  };

  const handleUploadCv = async (file) => {
    if (!file) return;
    let applicantId = email.linkedApplicantId;
    // Ensure applicant exists; recreate if deleted or missing
    if (applicantId) {
      try {
        await axiosInstance.get(API_PATHS.HR_APPLICANT_BY_ID(applicantId));
      } catch (e) {
        applicantId = null;
      }
    }
    if (!applicantId) {
      const created = await createApplicant({ ...defaultConvertForm, stage: 'Applied' }, undefined, { skipAutoCvFetch: true });
      applicantId = created._id || created.id;
    }
    const formData = new FormData();
    formData.append('cv', file);
    try {
      setUploadingCv(true);
      await axiosInstance.post(API_PATHS.HR_APPLICANT_CV(applicantId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('CV uploaded to applicant successfully');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to upload CV';
      alert(msg);
    } finally {
      setUploadingCv(false);
      if (uploadInputRef.current) {
        uploadInputRef.current.value = '';
      }
    }
  };



  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    setSummaryError(null);
    try {
      const response = await axiosInstance.post(
        API_PATHS.HR_GMAIL_EMAIL_AI_SUMMARY(email._id)
      );
      setAiSummary(response.data.aiSummary);
      onUpdate({ ...email, aiSummary: response.data.aiSummary });
    } catch (err) {
      if (err.response?.status === 503) {
        setSummaryError('OpenAI is not configured on the server.');
      } else if (err.response?.status === 400) {
        setSummaryError('Email body is empty; cannot summarize.');
      } else {
        setSummaryError('Failed to generate summary');
      }
      console.error('Summary error:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-6">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 mb-1 break-words">
              {email.subject || '(no subject)'}
            </h2>
            <div className="space-y-1 text-sm text-gray-600 text-start">
              <p>
                <span className="font-semibold">From:</span>{' '}
                {email.fromName || email.fromEmail || 'Unknown'}
              </p>
              <p>
                <span className="font-semibold">To:</span> {email.to?.join(', ') || 'Unknown'}
              </p>
              <p>
                <span className="font-semibold">Date:</span> {formatDate(email.date)}
              </p>
            </div>
          </div>
          {/* Action Buttons */}
          {canConvert && (
            <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
              <button
                onClick={() => createApplicant({ ...defaultConvertForm, stage: 'Applied' }, () => setShowConvert(false))}
                disabled={savingApplicant || !canConvertStrict}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-semibold border ${savingApplicant || !canConvertStrict ? 'bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'}`}
              >
                {savingApplicant ? 'Converting...' : 'Convert to Applicant'}
              </button>

              {isDeletedApplicant && (
                <p className="text-xs text-blue-600 mt-1 font-medium">ℹ️ Applicant was deleted. Click "Convert" to re-add.</p>
              )}

              {!canConvertStrict && !isDeletedApplicant && (
                <p className="text-xs text-gray-500 mt-1 max-w-[200px] text-start sm:text-end">
                  {isMarkedBlocked
                    ? (email.conversionStatus === 'blocked'
                      ? 'Blocked.'
                      : 'Marked not converted.')
                    : 'Requires PDF CV.'}
                </p>
              )}

              <div className="flex flex-col items-start sm:items-end gap-2 w-full">
                <button
                  onClick={openConvert}
                  className="text-xs text-blue-600 hover:text-blue-700 underline"
                  disabled={savingApplicant}
                >
                  Edit details before saving
                </button>
                {hasPdfAttachment(email) && (
                  <button
                    onClick={() => attachCvFromGmail(email.linkedApplicantId)}
                    disabled={uploadingCv}
                    className="text-xs text-green-700 hover:text-green-800 underline"
                  >
                    {uploadingCv ? 'Fetching CV...' : 'Fetch CV from Gmail'}
                  </button>
                )}
                <button
                  onClick={() => { uploadInputRef.current?.click(); }}
                  disabled={uploadingCv}
                  className="w-full sm:w-auto text-center px-4 py-2 border border-green-600 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-50"
                >
                  {uploadingCv ? 'Uploading...' : 'Upload CV'}
                </button>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  ref={uploadInputRef}
                  onChange={(e) => handleUploadCv(e.target.files?.[0])}
                />
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:relative sm:top-0 sm:right-0 text-gray-500 hover:text-gray-700 text-2xl leading-none flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Email Body */}
          {(email.bodyHtml || email.bodyText || email.snippet) && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Preview</h3>
              {email.bodyHtml ? (
                <div
                  className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-sm text-gray-700 max-h-80 overflow-y-auto overflow-x-auto"
                  style={{ wordBreak: 'break-word' }}
                  dangerouslySetInnerHTML={{
                    __html: `<style>img{max-width:100% !important;height:auto !important;} table{width:100% !important; table-layout: fixed !important;} body{width:100% !important; overflow-wrap: break-word !important;}</style>${email.bodyHtml}`,
                  }}
                />
              ) : (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-sm text-gray-700 whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                  {email.bodyText || email.snippet}
                </div>
              )}
            </div>
          )}

          {/* Snippet fallback */}
          {!email.bodyText && !email.bodyHtml && email.snippet && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Preview</h3>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
                {email.snippet}
              </div>
            </div>
          )}

          {/* AI Summary Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">AI Summary</h3>
              <button
                onClick={handleGenerateSummary}
                disabled={loadingSummary}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${loadingSummary
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                {loadingSummary ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Analyzing...
                  </span>
                ) : aiSummary ? (
                  'Regenerate'
                ) : (
                  'Summarize'
                )}
              </button>
            </div>

            {summaryError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700">{summaryError}</p>
              </div>
            )}

            {aiSummary ? (
              <div className="space-y-4">
                {/* Summary */}
                {aiSummary.summary && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Summary</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded p-3 border border-gray-200">
                      {aiSummary.summary}
                    </p>
                  </div>
                )}

                {/* Key Points */}
                {aiSummary.key_points && aiSummary.key_points.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Points</h4>
                    <ul className="space-y-1">
                      {aiSummary.key_points.map((point, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-blue-600 font-bold flex-shrink-0 mt-0.5">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Items */}
                {aiSummary.action_items && aiSummary.action_items.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Action Items</h4>
                    <ul className="space-y-1">
                      {aiSummary.action_items.map((item, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-green-600 font-bold flex-shrink-0 mt-0.5">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Urgency & Stage */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {aiSummary.urgency && (
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-1">Urgency</p>
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${aiSummary.urgency === 'high'
                          ? 'bg-red-100 text-red-700'
                          : aiSummary.urgency === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                          }`}
                      >
                        {aiSummary.urgency.charAt(0).toUpperCase() + aiSummary.urgency.slice(1)}
                      </span>
                    </div>
                  )}
                  {aiSummary.suggested_stage && (
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-1">Suggested Stage</p>
                      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        {aiSummary.suggested_stage.charAt(0).toUpperCase() +
                          aiSummary.suggested_stage.slice(1).replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Generated At */}
                {aiSummary.generatedAt && (
                  <p className="text-xs text-gray-500 border-t border-gray-200 pt-3">
                    Generated: {new Date(aiSummary.generatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <svg className="mx-auto h-10 w-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="text-sm text-gray-600">No summary yet. Click "Summarize" to generate one.</p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="border-t border-gray-200 pt-4 text-xs text-gray-500 space-y-1">
            {email.hasAttachments && <p>📎 Has attachments</p>}
            <p>Gmail ID: {email.gmailId}</p>
            {email.threadId && <p>Thread ID: {email.threadId}</p>}
          </div>
        </div>
      </div>

      {
        showConvert && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-gray-200">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Convert to Applicant</h3>
                  <p className="text-xs text-gray-500">Pre-fill details from this email</p>
                </div>
                <button onClick={() => setShowConvert(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
              </div>
              <div className="px-5 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    name="fullName"
                    value={convertForm.fullName}
                    onChange={(e) => setConvertForm({ ...convertForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={convertForm.email}
                    onChange={(e) => setConvertForm({ ...convertForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <input
                    name="position"
                    value={convertForm.position}
                    onChange={(e) => setConvertForm({ ...convertForm, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. Product Designer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={convertForm.notes}
                    onChange={(e) => setConvertForm({ ...convertForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
                  />
                </div>
                {convertError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">
                    {convertError}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => setShowConvert(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                  disabled={savingApplicant}
                >
                  Cancel
                </button>
                <button
                  onClick={() => createApplicant({ ...convertForm, stage: 'Applied' }, () => setShowConvert(false))}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${savingApplicant ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                  disabled={savingApplicant}
                >
                  {savingApplicant ? 'Saving...' : 'Create Applicant'}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default EmailDetailsModal;
