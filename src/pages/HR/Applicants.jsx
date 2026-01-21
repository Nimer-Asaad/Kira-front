import { useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import HrLayout from "../../components/HrLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import AddApplicantModal from "../../components/HR/AddApplicantModal";
import ApplicantDetailsModal from "../../components/HR/ApplicantDetailsModal";

const stageOptions = ["All", "Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"];

const popularSkills = [
  "React", "Node.js", "JavaScript", "TypeScript", "Python", "Java",
  "MongoDB", "PostgreSQL", "MySQL", "Express", "Next.js", "Vue.js",
  "Angular", "HTML", "CSS", "Tailwind CSS", "Bootstrap", "Git",
  "Docker", "Kubernetes", "AWS", "Azure", "REST API", "GraphQL",
  "React Native", "Flutter", "Swift", "Kotlin", "C#", ".NET",
  "Django", "Flask", "Spring Boot", "Laravel", "PHP", "Ruby on Rails",
  "Redux", "Webpack", "Vite", "CI/CD", "Jenkins", "Agile",
  "UI/UX", "Figma", "Adobe XD", "Photoshop", "Testing", "Jest"
];

const Applicants = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const skillsDropdownRef = useRef(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [experienceFilter, setExperienceFilter] = useState(""); // "0-2", "2-5", "5-10", "10+"
  const [jobTypeFilter, setJobTypeFilter] = useState(""); // "frontend", "backend", "fullstack", "ui-ux", "mobile", "devops"
  const [skillsFilter, setSkillsFilter] = useState([]); // array of skills
  const [skillsInput, setSkillsInput] = useState("");
  const [showSkillsSuggestions, setShowSkillsSuggestions] = useState(false);
  const [sortOrder, setSortOrder] = useState("match"); // "match", "date", "name"
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkDone, setBulkDone] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);

  const filters = useMemo(
    () => ({ stage: stageFilter, search, experience: experienceFilter, jobType: jobTypeFilter, skills: skillsFilter.join(",") }),
    [stageFilter, search, experienceFilter, jobTypeFilter, skillsFilter]
  );

  const calculateMatchScore = (applicant) => {
    let score = 0;
    const aiSummary = applicant.aiSummary || {};
    const notes = (applicant.notes || '').toLowerCase();
    const position = (applicant.position || '').toLowerCase();
    const fullInfo = `${notes} ${position}`;

    // Job type matching
    if (jobTypeFilter) {
      const jobTypeLower = jobTypeFilter.toLowerCase();
      const jobKeywords = {
        frontend: ['react', 'vue', 'angular', 'frontend', 'js', 'javascript', 'html', 'css', 'ui'],
        backend: ['nodejs', 'python', 'java', 'backend', 'api', 'rest', 'express', 'django', 'spring'],
        fullstack: ['full', 'fullstack', 'full-stack', 'mern', 'mean'],
        'ui-ux': ['ui', 'ux', 'design', 'figma', 'adobe', 'design system'],
        mobile: ['react native', 'ios', 'android', 'flutter', 'swift', 'kotlin', 'mobile'],
        devops: ['docker', 'kubernetes', 'aws', 'devops', 'ci/cd', 'jenkins', 'gitlab'],
      };
      const keywords = jobKeywords[jobTypeLower] || [];
      const matches = keywords.filter(kw => fullInfo.includes(kw)).length;
      score += Math.min(matches * 15, 30);
    }

    // Skills matching
    if (skillsFilter.length) {
      const reqSkills = skillsFilter.map(s => s.trim().toLowerCase()).filter(Boolean);
      const appSkills = (aiSummary.top_skills || []).map(s => s.toLowerCase());
      const allSkillsStr = `${fullInfo} ${appSkills.join(' ')}`.toLowerCase();
      
      // Count matches - each required skill found adds to score
      let matchCount = 0;
      reqSkills.forEach(reqSkill => {
        // Check if skill appears in notes/position or top_skills
        if (allSkillsStr.includes(reqSkill)) {
          matchCount++;
        } else {
          // Check for partial matches in top_skills array
          const partialMatch = appSkills.some(appSkill => 
            appSkill.includes(reqSkill) || reqSkill.includes(appSkill)
          );
          if (partialMatch) matchCount += 0.5; // Partial match counts as half
        }
      });
      
      score += Math.min(matchCount * 10, 25);
    }

    // Experience matching
    if (experienceFilter) {
      const yearsMatch = fullInfo.match(/(\d+)\s*(?:years?|yrs?|سنوات)/i);
      const yearsExp = yearsMatch ? parseInt(yearsMatch[1]) : 0;
      const [minYrs, maxYrs] = {
        '0-2': [0, 2],
        '2-5': [2, 5],
        '5-10': [5, 10],
        '10+': [10, 100],
      }[experienceFilter] || [0, 0];
      if (yearsExp >= minYrs && yearsExp <= maxYrs) score += 25;
    }

    // CV presence bonus
    if (applicant.cv?.url) score += 10;
    // AI summary bonus
    if (applicant.aiSummary) score += 5;

    return score;
  };

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (filters.stage && filters.stage !== "All") params.stage = filters.stage;
      if (filters.search) params.search = filters.search;
      const { data } = await axiosInstance.get(API_PATHS.HR_APPLICANTS, { params });
      // Deduplicate by email: keep the most recently updated record
      const byEmail = new Map();
      (data || []).forEach((a) => {
        const key = (a.email || '').toLowerCase();
        const prev = byEmail.get(key);
        const prevTime = prev ? new Date(prev.updatedAt || prev.createdAt).getTime() : -Infinity;
        const curTime = new Date(a.updatedAt || a.createdAt).getTime();
        if (!prev || curTime >= prevTime) {
          byEmail.set(key, a);
        }
      });
      setApplicants(Array.from(byEmail.values()));
    } catch (err) {
      console.error("Error loading applicants", err);
      setError("Failed to load applicants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Prefill search when navigating with state
    if (location.state?.searchPrefill) {
      setSearch(location.state.searchPrefill);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    fetchApplicants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.stage, filters.search, filters.experience, filters.jobType, filters.skills]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (skillsDropdownRef.current && !skillsDropdownRef.current.contains(event.target)) {
        setShowSkillsSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate match scores and sort applicants
  const processedApplicants = useMemo(() => {
    let result = [...applicants];

    // When stageFilter is All, include every stage (including Hired)

    // Calculate scores for all applicants
    const withScores = result.map(app => ({
      ...app,
      matchScore: calculateMatchScore(app)
    }));

    // Sort based on selected order
    if (sortOrder === 'match') {
      withScores.sort((a, b) => b.matchScore - a.matchScore);
    } else if (sortOrder === 'date') {
      withScores.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortOrder === 'name') {
      withScores.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }

    return withScores;
  }, [applicants, sortOrder, jobTypeFilter, experienceFilter, skillsFilter]);

  const filteredCount = processedApplicants.length;

  // Filter skill suggestions based on input and already selected skills
  const skillSuggestions = useMemo(() => {
    if (!skillsInput.trim()) return popularSkills;
    const input = skillsInput.toLowerCase();
    const selectedLower = skillsFilter.map(s => s.toLowerCase());
    return popularSkills.filter(skill => 
      skill.toLowerCase().includes(input) && !selectedLower.includes(skill.toLowerCase())
    );
  }, [skillsInput, skillsFilter]);

  const addSkillFromInput = () => {
    const raw = skillsInput.replace(/,+/g, " ").trim();
    if (!raw) return;
    const pieces = raw.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
    if (!pieces.length) return;
    setSkillsFilter((prev) => {
      const existingLower = new Set(prev.map((s) => s.toLowerCase()));
      const additions = pieces.filter((p) => !existingLower.has(p.toLowerCase()));
      return additions.length ? [...prev, ...additions] : prev;
    });
    setSkillsInput("");
  };

  const removeSkill = (skill) => {
    setSkillsFilter((prev) => prev.filter((s) => s !== skill));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkillFromInput();
    } else if (e.key === "Escape") {
      setShowSkillsSuggestions(false);
    }
  };

  const selectSkillFromSuggestion = (skill) => {
    setSkillsFilter((prev) => {
      const existingLower = new Set(prev.map((s) => s.toLowerCase()));
      if (existingLower.has(skill.toLowerCase())) return prev;
      return [...prev, skill];
    });
    setSkillsInput("");
    setShowSkillsSuggestions(false);
  };

  const handleAdd = async (form) => {
    try {
      setSaving(true);
      await axiosInstance.post(API_PATHS.HR_APPLICANTS, form);
      setIsAddOpen(false);
      fetchApplicants();
    } catch (err) {
      console.error("Error creating applicant", err);
      alert(err?.response?.data?.message || "Failed to create applicant");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id, payload) => {
    try {
      const { data } = await axiosInstance.patch(API_PATHS.HR_APPLICANT_BY_ID(id), payload);
      setApplicants((prev) => prev.map((a) => (a._id === id ? data : a)));
      setSelected(data);
    } catch (err) {
      console.error("Error updating applicant", err);
      alert(err?.response?.data?.message || "Failed to update applicant");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this applicant?")) return;
    try {
      await axiosInstance.delete(API_PATHS.HR_APPLICANT_BY_ID(id));
      setApplicants((prev) => prev.filter((a) => a._id !== id));
      setSelected(null);
    } catch (err) {
      console.error("Error deleting applicant", err);
      alert(err?.response?.data?.message || "Failed to delete applicant");
    }
  };

  const handleUploadCv = async (id, file) => {
    const formData = new FormData();
    formData.append("cv", file);
    try {
      const { data } = await axiosInstance.post(API_PATHS.HR_APPLICANT_CV(id), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setApplicants((prev) => prev.map((a) => (a._id === id ? data : a)));
      setSelected(data);
    } catch (err) {
      console.error("Error uploading CV", err);
      alert(err?.response?.data?.message || "Failed to upload CV");
    }
  };

  const handleGenerateAiSummary = async (id) => {
    try {
      const { data } = await axiosInstance.post(API_PATHS.HR_APPLICANT_AI_SUMMARY(id));
      setApplicants((prev) => prev.map((a) => (a._id === id ? { ...a, aiSummary: data } : a)));
      setSelected((prev) => (prev && prev._id === id ? { ...prev, aiSummary: data } : prev));
    } catch (err) {
      console.error("Error generating AI summary", err);
      alert(err?.response?.data?.message || "Failed to generate AI summary");
    }
  };

  const handleBulkGenerate = async () => {
    if (bulkGenerating) return;
    try {
      setBulkGenerating(true);
      setBulkDone(0);
      // Work on currently loaded applicants list
      const targets = applicants.filter(
        (a) => a.cv?.filename && !a.aiSummary
      );
      setBulkTotal(targets.length);
      for (const a of targets) {
        try {
          const { data } = await axiosInstance.post(
            API_PATHS.HR_APPLICANT_AI_SUMMARY(a._id)
          );
          setApplicants((prev) => prev.map((x) => (x._id === a._id ? { ...x, aiSummary: data } : x)));
          setSelected((prev) => (prev && prev._id === a._id ? { ...prev, aiSummary: data } : prev));
        } catch (err) {
          console.error("Bulk AI summary error", err);
          // Continue on error; show alert once per item to inform user
          alert(err?.response?.data?.message || `Failed to summarize ${a.fullName}`);
        } finally {
          setBulkDone((d) => d + 1);
        }
      }
    } finally {
      setBulkGenerating(false);
    }
  };

  return (
    <HrLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slideUp">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600">{t("hr.applicants.title")}</h1>
          <p className="text-sm text-slate-600 font-medium mt-1">{t("hr.applicants.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleBulkGenerate}
            disabled={bulkGenerating}
            className="px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base font-semibold whitespace-nowrap"
          >
            {bulkGenerating && (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
            <span className="truncate">{bulkGenerating ? `${t("hr.applicants.generating")} (${bulkDone}/${bulkTotal})` : t("hr.applicants.generateAISummaries")}</span>
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 text-sm sm:text-base font-semibold whitespace-nowrap"
            disabled={saving}
          >
            {saving ? t("hr.applicants.saving") : t("hr.applicants.addApplicant")}
          </button>
        </div>
      </div>

      <div className="card-premium p-4 flex flex-col gap-4 animate-fadeIn" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7" />
            </svg>
            <span>{filteredCount} {t("hr.applicants.applicants")}</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("hr.applicants.searchPlaceholder")}
              className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </div>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          >
            {stageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <select
            value={experienceFilter}
            onChange={(e) => setExperienceFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
          >
            <option value="">{t("hr.applicants.allExperience")}</option>
            <option value="0-2">0-2 years</option>
            <option value="2-5">2-5 years</option>
            <option value="5-10">5-10 years</option>
            <option value="10+">10+ years</option>
          </select>
          <select
            value={jobTypeFilter}
            onChange={(e) => setJobTypeFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
          >
            <option value="">{t("hr.applicants.allJobTypes")}</option>
            <option value="frontend">Frontend</option>
            <option value="backend">Backend</option>
            <option value="fullstack">Full Stack</option>
            <option value="mobile">Mobile</option>
            <option value="ui-ux">UI/UX Design</option>
            <option value="devops">DevOps</option>
          </select>
          <div className="w-full md:w-auto md:flex-1 md:min-w-64 relative" ref={skillsDropdownRef}>
            <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent bg-white">
              <input
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                onFocus={() => setShowSkillsSuggestions(true)}
                placeholder={t("hr.applicants.skillsPlaceholder")}
                className="flex-1 text-sm outline-none bg-transparent min-w-0"
              />
              <button
                type="button"
                onClick={addSkillFromInput}
                className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
            
            {showSkillsSuggestions && skillSuggestions.length > 0 && (
              <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {skillSuggestions.slice(0, 20).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => selectSkillFromSuggestion(skill)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            )}
          </div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
          >
            <option value="match">Best Match</option>
            <option value="date">Newest First</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>

        {skillsFilter.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            {skillsFilter.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-200"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="text-blue-600 hover:text-blue-800 focus:outline-none font-bold text-base leading-none"
                  aria-label="Remove skill"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 text-red-600 font-semibold">{error}</div>
      ) : applicants.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center text-gray-500">
          No applicants found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedApplicants.map((applicant, idx) => (
            <div key={applicant._id} className="card-premium p-6 animate-fadeIn hover:-translate-y-1" style={{ animationDelay: `${150 + idx * 50}ms` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate" title={applicant.fullName}>{applicant.fullName}</h3>
                  <p className="text-sm text-gray-500 truncate" title={applicant.email}>{applicant.email}</p>
                  <p className="text-sm text-gray-600 mt-1 truncate" title={applicant.position || "-"}>{applicant.position || "-"}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-xs font-bold border border-blue-200 shadow-sm">
                    {applicant.stage}
                  </span>
                  {applicant.matchScore !== undefined && (applicant.matchScore > 0 || sortOrder === 'match') && (
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border ${applicant.matchScore >= 70 ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200' : applicant.matchScore >= 40 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border-yellow-200' : 'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-700 border-slate-200'}`}>
                      {applicant.matchScore}% Match
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                  </svg>
                  <span>{applicant.cv?.url ? "CV uploaded" : "No CV"}</span>
                </div>
                <div className="flex items-center gap-2">
                  {applicant.aiSummary ? (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">AI</span>
                  ) : null}
                  <span className="text-xs text-gray-400">{new Date(applicant.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelected(applicant)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
                >
                  Details
                </button>
                <button
                  onClick={() => handleDelete(applicant._id)}
                  className="px-3 py-2 text-sm font-semibold text-red-600 hover:text-red-700"
                >
                  {t("hr.applicants.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddApplicantModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSubmit={handleAdd} />

      <ApplicantDetailsModal
        isOpen={!!selected}
        applicant={selected}
        onClose={() => setSelected(null)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onUploadCv={handleUploadCv}
        onGenerateAiSummary={handleGenerateAiSummary}
      />
    </HrLayout>
  );
};

export default Applicants;
