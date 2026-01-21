import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAssistant } from "../../context/AssistantContext";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { Trash2, History } from "lucide-react";

// THEME CONSTANTS - Enhanced Design
const GRADIENT_HEADER = "bg-indigo-600 shadow-lg";
const USER_GRADIENT = "bg-indigo-500 text-white shadow-md";
const ASSISTANT_BUBBLE = "bg-gradient-to-br from-gray-50 to-white text-gray-800 border border-gray-200 shadow-sm";
const TAB_ACTIVE = "bg-indigo-600 text-white shadow-lg transform scale-105";
const TAB_INACTIVE = "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-all duration-200";
const CHIP = "border-2 border-indigo-200 bg-gradient-to-r from-white to-indigo-50 text-indigo-700 hover:from-indigo-50 hover:to-indigo-100 hover:border-indigo-300 hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium cursor-pointer";
const CHIP_ACTIVE = "bg-indigo-500 text-white border-0 shadow-md";

// SMART routeKey detection
const getRouteKey = (pathname) => {
  if (pathname.includes("/tasks")) return "tasks";
  if (pathname.includes("/inbox")) return "inbox";
  if (pathname.includes("/dashboard")) return "dashboard";
  return "other";
};

// SMART suggestions with icons
const getSuggestions = (routeKey) => {
  switch (routeKey) {
    case "tasks":
      return [
        { icon: "📝", text: "How do I create a task?" },
        { icon: "⚡", text: "What does priority mean?" },
        { icon: "⏰", text: "Show my overdue tasks" },
      ];
    case "inbox":
      return [
        { icon: "🔄", text: "How to sync emails?" },
        { icon: "🏷️", text: "How to filter by label/date?" },
      ];
    case "dashboard":
      return [
        { icon: "📊", text: "Explain these stats" },
        { icon: "🧭", text: "What can I do here?" },
      ];
    default:
      return [{ icon: "💡", text: "How can I use this page?" }];
  }
};

const LOCAL_KEY = "kira_assistant_conversation";

// DRAFT MODE SMART UI
const DRAFT_TYPES = [
  { value: "message_late", label: "Late message", icon: "⏰" },
  { value: "email_supplier_damage", label: "Supplier damaged items email", icon: "📦" },
  { value: "message_interview_invite", label: "Interview invitation", icon: "🎤" },
  { value: "email_followup", label: "Follow-up email", icon: "🔁" },
];
const DRAFT_FIELDS = {
  message_late: [
    { name: "name", label: "Recipient Name", type: "text" },
    { name: "reason", label: "Reason", type: "text" },
  ],
  email_supplier_damage: [
    { name: "name", label: "Supplier Name", type: "text" },
    { name: "orderId", label: "Order ID", type: "text" },
    { name: "company", label: "Your Company", type: "text" },
  ],
  message_interview_invite: [
    { name: "name", label: "Candidate Name", type: "text" },
    { name: "time", label: "Interview Time", type: "text" },
    { name: "company", label: "Your Company", type: "text" },
  ],
  email_followup: [
    { name: "name", label: "Recipient Name", type: "text" },
    { name: "reason", label: "Reason", type: "text" },
    { name: "company", label: "Your Company", type: "text" },
  ],
};

// Memory helpers
const MEMORY_KEY = "kira_assistant_memory";
function getMemory() {
  try {
    return JSON.parse(localStorage.getItem(MEMORY_KEY)) || {};
  } catch { return {}; }
}
function setMemory(mem) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(mem));
}
function getSessionMemory() {
  try {
    return JSON.parse(localStorage.getItem(MEMORY_KEY)) || {};
  } catch { return {}; }
}
function setSessionMemory(mem) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(mem));
}

const AssistantDrawer = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const { open, closeDrawer, enableHistory, toggleHistory } = useAssistant();
  const [memory, setMemoryState] = useState(getMemory());
  const [mode, setMode] = useState(memory.lastTab || "help");
  const [detectedLang, setDetectedLang] = useState(memory.lang || "auto");
  const [showTyping, setShowTyping] = useState(false);
  const [suggestedFollowups, setSuggestedFollowups] = useState([]);
  const [messages, setMessages] = useState(() => {
    try {
      if (enableHistory) {
        return JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
      }
      return [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [draftType, setDraftType] = useState(DRAFT_TYPES[0].value);
  const [draftFields, setDraftFields] = useState({});
  const [draftResult, setDraftResult] = useState(null);
  const [sessionMemory, setSessionMemoryState] = useState(getSessionMemory());
  const [lastIntent, setLastIntent] = useState(sessionMemory.lastIntent || "");
  const [saidNo, setSaidNo] = useState(sessionMemory.saidNo || false);
  const [saidGeneric, setSaidGeneric] = useState(sessionMemory.saidGeneric || false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (enableHistory) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(messages));
    }
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, enableHistory]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    const handleEsc = (e) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [open, closeDrawer]);

  useEffect(() => {
    setMemory({ ...memory, lastTab: mode, lang: detectedLang });
    setMemoryState({ ...memory, lastTab: mode, lang: detectedLang });
  }, [mode, detectedLang]);

  useEffect(() => {
    setSessionMemory({
      ...sessionMemory,
      lastTab: mode,
      lang: detectedLang,
      lastIntent,
      saidNo,
      saidGeneric,
    });
    setSessionMemoryState({
      ...sessionMemory,
      lastTab: mode,
      lang: detectedLang,
      lastIntent,
      saidNo,
      saidGeneric,
    });
  }, [mode, detectedLang, lastIntent, saidNo, saidGeneric]);

  function detectLang(text) {
    return /[\u0600-\u06FF]/.test(text) ? "ar" : "en";
  }

  function isArabic(text) {
    if (!text || typeof text !== 'string') return false;
    return /[\u0600-\u06FF]/.test(text);
  }

  function detectIntent(text) {
    if (/^(نعم|ok|yes)$/i.test(text.trim())) return "continue_previous";
    if (/[ا]شرح|explain/i.test(text)) return "explain";
    if (/كيف/i.test(text)) return "how_to";
    if (/^لا$/i.test(text.trim())) return "no";
    return "general";
  }

  async function handleSend(msg) {
    if (!msg?.trim()) return;
    const lang = detectLang(msg);
    setDetectedLang(lang);
    const intent = detectIntent(msg);
    setLastIntent(intent);
    if (intent === "no") {
      setSaidNo(true);
      setMessages((prev) => [...prev, { from: "user", text: msg, mode }]);
      setShowTyping(false);
      setSuggestedFollowups([]);
      setMessages((prev) => [
        ...prev,
        { from: "assistant", text: lang === "ar" ? "شكرًا لتواصلك. إذا احتجت شيئًا آخر، أنا هنا." : "Thank you for chatting. Let me know if you need anything else.", mode, lang },
      ]);
      return;
    }
    if (saidNo) return;
    setMessages((prev) => [...prev, { from: "user", text: msg, mode }]);
    setShowTyping(true);
    setInput("");
    await new Promise(r => setTimeout(r, 500 + Math.random() * 400));

    const currentRouteKey = getRouteKey(location.pathname.toLowerCase());

    let context = {
      routeKey: currentRouteKey,
      role: user?.role,
      lastIntent: intent
    };
    if (mode === "draft") {
      context = { ...context, draftType, fields: draftFields, language: lang, tone: "normal" };
    }

    try {
      const res = await axiosInstance.post(API_PATHS.ASSISTANT_PUBLIC, {
        mode,
        message: msg,
        context,
      });
      setShowTyping(false);

      const reply = res.data.reply || res.data.summaryText || res.data.body || "Sorry, I couldn't process your request.";

      const backendSuggestions = res.data.suggestions || [];
      if (backendSuggestions.length > 0) {
        setSuggestedFollowups(
          backendSuggestions.map((s, idx) => ({
            icon: ["📝", "⚡", "⏰", "🧭", "💡"][idx] || "💡",
            text: s
          }))
        );
      } else {
        setSuggestedFollowups([]);
      }

      setMessages((prev) => [
        ...prev,
        { from: "assistant", text: reply, mode, lang, suggestions: backendSuggestions },
      ]);
    } catch (e) {
      setShowTyping(false);
      console.error("Assistant error:", e.response || e);
      const errorMessage = e.response?.data?.error || e.response?.data?.message || e.message || "Unknown error";
      const statusCode = e.response?.status || "N/A";
      const userFriendlyMessage = detectedLang === "ar"
        ? `حدث خطأ. حاول مرة أخرى.`
        : "Sorry, something went wrong.";
      const debugMessage = import.meta.env.DEV
        ? ` (${statusCode}: ${errorMessage})`
        : "";
      setMessages((prev) => [
        ...prev,
        {
          from: "assistant",
          text: userFriendlyMessage + debugMessage,
          mode,
          error: true
        },
      ]);
    }
  }

  const handleClearChat = () => {
    if (confirm(enableHistory
      ? "Clear chat history? This cannot be undone."
      : "Clear chat? (You can re-enable history to keep future chats)")) {
      setMessages([]);
      setSuggestedFollowups([]);
      if (enableHistory) {
        localStorage.removeItem(LOCAL_KEY);
      }
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) closeDrawer();
  };

  function renderTasksSummary(msg) {
    if (!msg || typeof msg !== "object") return null;
    const { overdue, today, upcoming, highPriority, summaryText, recommendations, topTasks } = msg.draft || msg;
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-2">
        <div className="font-semibold text-blue-800 mb-2">Task Summary</div>
        <ul className="text-sm text-blue-900 mb-2 space-y-1">
          <li>⏰ <b>{overdue}</b> overdue</li>
          <li>📅 <b>{today}</b> due today</li>
          <li>🗓️ <b>{upcoming}</b> upcoming (next 7 days)</li>
          <li>⭐ <b>{highPriority}</b> high priority</li>
        </ul>
        {summaryText && <div className="text-blue-700 mb-2">{summaryText}</div>}
        {recommendations && (
          <div className="text-xs text-blue-700 mb-1">💡 {recommendations}</div>
        )}
        {topTasks && topTasks.length > 0 && (
          <div className="mt-2">
            <div className="font-semibold text-xs text-blue-700 mb-1">Top Tasks:</div>
            <ul className="list-disc list-inside text-xs text-blue-900">
              {topTasks.slice(0, 3).map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  function renderHelpText(text) {
    if (!text) return null;
    if (text.includes("\n- ") || text.includes("\n• ")) {
      const items = text.split(/\n[-•] /).filter(Boolean);
      return (
        <ul className="list-disc list-inside text-blue-900 text-sm space-y-1">
          {items.map((item, i) => <li key={i}>{item.trim()}</li>)}
        </ul>
      );
    }
    if (text.match(/\n\d+\. /)) {
      const items = text.split(/\n\d+\. /).filter(Boolean);
      return (
        <ol className="list-decimal list-inside text-blue-900 text-sm space-y-1">
          {items.map((item, i) => <li key={i}>{item.trim()}</li>)}
        </ol>
      );
    }
    return <div className="text-blue-900 text-sm whitespace-pre-line">{text}</div>;
  }

  if (!open) return null;

  const routeKey = getRouteKey(location.pathname.toLowerCase());
  const suggestions = getSuggestions(routeKey);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-end"
      style={{ backdropFilter: "blur(6px)", background: "rgba(30,41,59,0.30)" }}
      role="dialog"
      aria-label="Kira Assistant Drawer"
      tabIndex={-1}
      onClick={handleOverlayClick}
    >
      <div
        className={`w-full md:w-[500px] h-full md:h-[96vh] rounded-l-3xl shadow-2xl border-2 border-indigo-100 flex flex-col transition-all duration-300 ease-out bg-white backdrop-blur-sm ${open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}
        style={{ minWidth: 320, maxWidth: 540 }}
      >
        {/* Enhanced Gradient Header */}
        <div className={`flex items-center justify-between px-6 py-4 ${GRADIENT_HEADER} rounded-tl-3xl rounded-tr-none rounded-br-none rounded-bl-none shadow-xl`}>
          <div className="flex items-center gap-3">
            <span className="inline-block w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-lg border-2 border-white/30 animate-pulse">🤖</span>
            <div>
              <div className="font-bold text-xl text-white drop-shadow-md">Kira Assistant</div>
              <div className="text-xs text-white/90 mt-0.5 font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>You are on: <span className="capitalize font-semibold">{routeKey}</span></span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              className={`p-2 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none ${enableHistory ? "bg-white/30 text-white" : "text-white/70 hover:bg-white/20"}`}
              aria-label={enableHistory ? "History enabled" : "History disabled"}
              onClick={toggleHistory}
              title={enableHistory ? "History enabled - Click to disable" : "History disabled - Click to enable"}
            >
              <History className="w-5 h-5" />
            </button>

            <button
              className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none"
              aria-label="Clear chat"
              onClick={handleClearChat}
              title="Clear chat history"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <button
              className="text-white/90 hover:text-white hover:bg-white/20 rounded-full p-2 text-2xl font-bold transition-all duration-200 hover:scale-110 focus:outline-none"
              aria-label="Close assistant"
              onClick={closeDrawer}
            >×</button>
          </div>
        </div>
        {/* Enhanced Tabs */}
        <div className="px-6 pt-4 pb-2 bg-gradient-to-b from-white to-gray-50">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { id: "help", label: t("assistant.tabHelp") },
              { id: "tasks", label: t("assistant.tabTasks") },
              { id: "draft", label: t("assistant.tabDraft") },
              { id: "general", label: t("assistant.tabGeneral") },
            ].map(tab => (
              <button
                key={tab.id}
                className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 focus:outline-none whitespace-nowrap ${mode === tab.id ? TAB_ACTIVE : TAB_INACTIVE}`}
                onClick={() => setMode(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {/* Enhanced Suggestion Chips */}
        {messages.length === 0 && (
          <div className="px-6 pt-3 pb-3 bg-gradient-to-b from-gray-50 to-white">
            <div className="flex flex-wrap gap-2">
              {[
                { icon: "💬", text: t("assistant.suggestHelpMe") },
                { icon: "✅", text: t("assistant.suggestSummarizeTasks") },
                { icon: "🧭", text: t("assistant.suggestQuickTour") },
                { icon: "📨", text: t("assistant.suggestDraftEmail") },
              ].map((s, i) => (
                <button
                  key={i}
                  className={CHIP}
                  onClick={() => setInput(s.text)}
                >
                  <span className="text-lg">{s.icon}</span>
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Enhanced Chat Area */}
        <div className="flex-1 px-6 py-4 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[120px] bg-gradient-to-b from-gray-50 via-white to-gray-50">
          {messages.length === 0 && (
            <div className="text-gray-400 text-base text-center mt-12 flex flex-col items-center gap-2">
              <span className="text-4xl animate-bounce">👋</span>
              <span>How can I help you today?</span>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex items-start gap-3 mb-4 ${m.from === "user" ? "justify-end" : "justify-start"}`}>
              {m.from === "assistant" && (
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xl shadow-md border-2 border-white flex-shrink-0">🤖</span>
              )}
              <div className={`flex flex-col ${m.from === "user" ? "items-end" : "items-start"} max-w-[75%]`}>
                {m.mode === "help" ? (
                  <div
                    dir={isArabic(m.text) ? "rtl" : "ltr"}
                    className={`rounded-2xl px-5 py-3 text-base shadow-md relative ${m.from === "user" ? USER_GRADIENT : ASSISTANT_BUBBLE} ${m.error ? "border-2 border-red-300" : ""} ${m.from === "user" ? "rounded-tr-sm" : "rounded-tl-sm"} ${isArabic(m.text) ? "text-right" : "text-left"}`}
                  >
                    {renderHelpText(m.text)}
                    {m.error && import.meta.env.DEV && (
                      <div className="text-xs text-gray-500 mt-1 pt-1 border-t border-gray-200">
                        {m.text.split("(")[1]?.replace(")", "")}
                      </div>
                    )}
                  </div>
                ) : m.mode === "tasks" && typeof m.text === "object" ? renderTasksSummary(m) : (
                  <div
                    dir={isArabic(m.text) ? "rtl" : "ltr"}
                    className={`rounded-2xl px-5 py-3 text-base shadow-md relative ${m.from === "user" ? USER_GRADIENT : ASSISTANT_BUBBLE} ${m.error ? "border-2 border-red-300" : ""} ${m.from === "user" ? "rounded-tr-sm" : "rounded-tl-sm"} ${isArabic(m.text) ? "text-right" : "text-left"} break-words`}
                  >
                    <div className="whitespace-pre-wrap break-words">{m.text}</div>
                    {m.error && import.meta.env.DEV && (
                      <div className="text-xs text-gray-500 mt-1 pt-1 border-t border-gray-200">
                        {m.text.split("(")[1]?.replace(")", "")}
                      </div>
                    )}
                  </div>
                )}
                {m.from === "assistant" && m.suggestions && m.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 w-full">
                    {m.suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        className={CHIP}
                        onClick={() => setInput(s)}
                      >
                        <span className="text-base">{["📝", "⚡", "⏰", "🧭", "💡"][idx] || "💡"}</span>
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {m.from === "user" && (
                <span className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center text-lg font-bold shadow-md border-2 border-white flex-shrink-0">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </span>
              )}
            </div>
          ))}
          {showTyping && (
            <div className="flex items-start gap-3 mb-4 justify-start">
              <span className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xl shadow-md border-2 border-white flex-shrink-0">🤖</span>
              <div className="rounded-2xl rounded-tl-sm px-5 py-3 max-w-[75%] text-base shadow-md bg-gradient-to-br from-gray-50 to-white text-gray-800 border border-gray-200 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="inline-block w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
          {mode === "draft" && (
            <div className="mb-4 bg-white rounded-xl p-4 border border-blue-100 shadow-sm">
              <div className="flex flex-wrap gap-2 mb-2">
                <select
                  className="border rounded-lg px-3 py-2 text-sm font-semibold bg-gradient-to-r from-blue-50 to-purple-50 focus:ring-2 focus:ring-blue-400"
                  value={draftType}
                  onChange={e => { setDraftType(e.target.value); setDraftFields({}); setDraftResult(null); }}
                >
                  {DRAFT_TYPES.map(dt => (
                    <option key={dt.value} value={dt.value}>{dt.icon} {dt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                {DRAFT_FIELDS[draftType]?.map(field => (
                  <input
                    key={field.name}
                    type={field.type}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder={field.label}
                    value={draftFields[field.name] || ""}
                    onChange={e => setDraftFields(f => ({ ...f, [field.name]: e.target.value }))}
                  />
                ))}
              </div>
              <button
                className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all duration-200"
                onClick={() => handleSend("generate draft")}
                disabled={loading}
              >Generate Draft</button>
              {draftResult && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  {draftResult.subject && <div className="font-semibold mb-1">Subject: {draftResult.subject}</div>}
                  <div className="whitespace-pre-line font-mono text-sm mb-2">{draftResult.body}</div>
                  {draftResult.tips && <div className="text-xs text-blue-700">💡 {draftResult.tips}</div>}
                  <button
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-semibold text-xs"
                    onClick={() => navigator.clipboard.writeText(draftResult.subject ? `${draftResult.subject}\n${draftResult.body}` : draftResult.body)}
                  >Copy</button>
                </div>
              )}
            </div>
          )}
          {suggestedFollowups.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {suggestedFollowups.map((s, i) => (
                <button key={i} className={CHIP} onClick={() => setInput(s.text)}>
                  <span>{s.icon}</span>{s.text}
                </button>
              ))}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        {/* Enhanced Input */}
        <form className="flex items-end gap-3 px-6 py-4 border-t-2 border-indigo-100 bg-gradient-to-b from-white to-gray-50 shadow-lg sticky bottom-0" onSubmit={e => { e.preventDefault(); handleSend(input); }}>
          <textarea
            ref={inputRef}
            className="flex-1 border-2 border-indigo-200 rounded-2xl px-5 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 resize-none bg-white shadow-sm transition-all duration-200"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={loading}
            rows={1}
            style={{ minHeight: 48, maxHeight: 120 }}
            dir={/[ -ÿ]+/.test(input) ? "ltr" : "rtl"}
          />
          <button
            type="submit"
            className={`bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold text-base shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${!input.trim() ? "opacity-50" : ""}`}
            disabled={loading || !input.trim()}
          >
            {loading ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AssistantDrawer;
