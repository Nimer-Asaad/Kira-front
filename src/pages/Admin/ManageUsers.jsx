import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import ChatButton from "../../components/ChatButton";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { downloadCSV } from "../../utils/helper";
import { useAuth } from "../../context/AuthContext";

const ManageUsers = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();

  const adminLinks = [
    {
      path: "/admin/dashboard",
      label: t("nav.dashboard"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      path: "/admin/tasks",
      label: t("nav.manageTasks"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
    },
    {
      path: "/admin/create-task",
      label: t("nav.createTask"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
    },
    {
      path: "/admin/users",
      label: t("nav.teamMembers"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
  ];

  const [teamStats, setTeamStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, member: null });
  const [roleChangeModal, setRoleChangeModal] = useState({ show: false, member: null, selectedRole: null });
  const [showAddUser, setShowAddUser] = useState(false);
  const [cvFile, setCvFile] = useState(null);
  const [cvError, setCvError] = useState("");
  const [addUserForm, setAddUserForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "user",
    isActive: true,
    phone: "",
    department: "",
    position: "",
  });
  const [addingUser, setAddingUser] = useState(false);

  // Evaluated Trainees states
  const [activeTab, setActiveTab] = useState("team"); // "team" or "trainees"
  const [evaluatedTrainees, setEvaluatedTrainees] = useState([]);
  const [traineesLoading, setTraineesLoading] = useState(false);
  const [promoteModal, setPromoteModal] = useState({ show: false, trainee: null, employmentType: "full_time" });

  useEffect(() => {
    fetchTeamStats();
    // Check if we should open the trainees tab
    if (location.state?.openEvaluatedTraineesTab) {
      setActiveTab("trainees");
      fetchEvaluatedTrainees();
    } else if (activeTab === "trainees") {
      fetchEvaluatedTrainees();
    }
  }, [activeTab, location.state]);

  const fetchEvaluatedTrainees = async () => {
    try {
      setTraineesLoading(true);
      const response = await axiosInstance.get(API_PATHS.HR_DASHBOARD_TRAINEES);
      const trainees = Array.isArray(response.data) ? response.data : [];
      // Show any trainee that has an HR score or marked decision, regardless of trainingStatus
      const evaluated = trainees
        .filter((t) => t.hrFinalScore != null || t.hrDecision)
        .filter((t) => t.status !== "promoted");

      // Sort by score descending (fallback 0)
      evaluated.sort((a, b) => (b.hrFinalScore || 0) - (a.hrFinalScore || 0));

      setEvaluatedTrainees(evaluated);
    } catch (error) {
      console.error("Error fetching evaluated trainees:", error);
    } finally {
      setTraineesLoading(false);
    }
  };

  const fetchTeamStats = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        axiosInstance.get(API_PATHS.USERS),
        axiosInstance.get(API_PATHS.TEAM_STATS),
      ]);

      const users = Array.isArray(usersRes.data) ? usersRes.data : [];
      const statsArr = Array.isArray(statsRes.data) ? statsRes.data : [];

      const statsMap = new Map();
      statsArr.forEach((member) => {
        const user = member.user || member;
        const stats = member.stats || {};
        const id = user?._id || member._id;
        statsMap.set(id, {
          pending: stats.pending || 0,
          inProgress: stats.inProgress || 0,
          completed: stats.completed || 0,
        });
      });

      const normalized = users.map((u) => ({
        id: u._id,
        fullName: u.fullName || "User",
        email: u.email || "",
        role: u.role || "user",
        avatar: u.avatar || "",
        stats: statsMap.get(u._id) || { pending: 0, inProgress: 0, completed: 0 },
      }));

      setTeamStats(normalized);
    } catch (error) {
      console.error("Error fetching team stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (member) => {
    const nextRole = member.role === "hr" ? "user" : "hr";
    try {
      setActionLoadingId(member.id);
      await axiosInstance.patch(API_PATHS.UPDATE_USER_ROLE(member.id), { role: nextRole });
      await fetchTeamStats();
    } catch (error) {
      console.error("Error updating role:", error);
      alert(error?.response?.data?.message || "Failed to update role");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRoleChangeModal = (member) => {
    setRoleChangeModal({ show: true, member, selectedRole: member.role });
  };

  const handleChangeRole = async () => {
    if (!roleChangeModal.member || !roleChangeModal.selectedRole) return;

    const oldRole = roleChangeModal.member.role;
    const newRole = roleChangeModal.selectedRole;

    // Prevent accidental same role changes
    if (oldRole === newRole) {
      setRoleChangeModal({ show: false, member: null, selectedRole: null });
      return;
    }

    try {
      setActionLoadingId(roleChangeModal.member.id);
      await axiosInstance.patch(
        API_PATHS.UPDATE_USER_ROLE(roleChangeModal.member.id),
        { role: newRole }
      );
      setRoleChangeModal({ show: false, member: null, selectedRole: null });
      await fetchTeamStats();
      // Show success message
      alert(`Role updated from ${oldRole.toUpperCase()} to ${newRole.toUpperCase()}`);
    } catch (error) {
      console.error("Error updating role:", error);
      alert(error?.response?.data?.message || "Failed to update role");
    } finally {
      setActionLoadingId(null);
    }
  };;

  const handleDeleteUser = async () => {
    if (!deleteConfirm.member) return;

    try {
      setActionLoadingId(deleteConfirm.member.id);
      await axiosInstance.delete(API_PATHS.DELETE_USER(deleteConfirm.member.id));
      setDeleteConfirm({ show: false, member: null });
      await fetchTeamStats();
      alert("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(error?.response?.data?.message || "Failed to delete user");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePromoteTrainee = async () => {
    if (!promoteModal.trainee) return;

    try {
      setActionLoadingId(promoteModal.trainee.traineeId);
      await axiosInstance.post(
        API_PATHS.HR_TRAINEE_PROMOTE(promoteModal.trainee.traineeId),
        { employmentType: promoteModal.employmentType }
      );

      const roleType = promoteModal.employmentType === "part_time" ? "Part-Time" : "Full-Time";
      alert(`${promoteModal.trainee.displayName} has been promoted to ${roleType} Employee!`);

      setPromoteModal({ show: false, trainee: null, employmentType: "full_time" });
      await fetchEvaluatedTrainees();
      await fetchTeamStats();
    } catch (error) {
      console.error("Error promoting trainee:", error);
      alert(error?.response?.data?.message || "Failed to promote trainee");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCVFileChange = (e) => {
    const file = e.target.files?.[0];
    setCvError("");

    if (!file) {
      setCvFile(null);
      return;
    }

    // Validate file type (PDF only)
    if (file.type !== "application/pdf") {
      setCvError("Only PDF files are accepted. Please select a PDF file.");
      e.target.value = "";
      return;
    }

    // Validate file size (max 5MB)
    const maxSizeInMB = 5;
    if (file.size > maxSizeInMB * 1024 * 1024) {
      setCvError(`File size must be less than ${maxSizeInMB}MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      e.target.value = "";
      return;
    }

    setCvFile(file);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!addUserForm.fullName || !addUserForm.email) {
      alert("Full name and email are required");
      return;
    }

    try {
      setAddingUser(true);
      setCvError("");

      // Create FormData for multipart request
      const formData = new FormData();
      formData.append("fullName", addUserForm.fullName);
      formData.append("email", addUserForm.email);
      formData.append("password", addUserForm.password);
      formData.append("role", addUserForm.role);
      formData.append("isActive", addUserForm.isActive);
      formData.append("phone", addUserForm.phone);
      formData.append("department", addUserForm.department);
      formData.append("position", addUserForm.position);

      // Append CV file if selected
      if (cvFile) {
        formData.append("cvFile", cvFile);
      }

      const { data } = await axiosInstance.post(API_PATHS.CREATE_USER, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Show appropriate success message
      let successMsg = t('pages.teamMembers.userCreated');
      if (cvFile && data.cvParsedData) {
        successMsg = t('pages.teamMembers.msgUserCreatedCV');
      } else if (cvFile && !data.cvParsedData) {
        successMsg = t('pages.teamMembers.msgUserCreatedCVFailed');
      }

      alert(successMsg);
      setShowAddUser(false);
      setCvFile(null);
      setCvError("");
      setAddUserForm({
        fullName: "",
        email: "",
        password: "",
        role: "user",
        isActive: true,
        phone: "",
        department: "",
        position: "",
      });
      await fetchTeamStats();
    } catch (error) {
      console.error("Error creating user:", error);
      alert(error?.response?.data?.message || "Failed to create user");
    } finally {
      setAddingUser(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.TEAM_REPORT, {
        params: { format: "csv" },
        responseType: "blob",
      });

      const contentType = response.headers["content-type"] || "";

      if (contentType.includes("application/json")) {
        const text = await response.data.text();
        const json = JSON.parse(text);
        downloadCSV(json, "team-report");
        return;
      }

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "team-report.csv";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading report:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gray-50">
        <Sidebar links={adminLinks} />
        <main className="lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64 min-h-screen w-full overflow-x-auto animate-fadeIn">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <Sidebar links={adminLinks} />
      <main className="lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64 min-h-screen w-full overflow-x-auto">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">{t("pages.teamMembers.description")}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">{t("pages.teamMembers.title")}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddUser(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t("pages.teamMembers.addMember")}
              </button>
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3 3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t("pages.teamMembers.downloadReport")}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab("team")}
              className={`px-4 py-2 font-medium transition-all ${activeTab === "team"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
                }`}
            >
              Team Members ({teamStats.length})
            </button>
            <button
              onClick={() => setActiveTab("trainees")}
              className={`px-4 py-2 font-medium transition-all ${activeTab === "trainees"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
                }`}
            >
              {t('pages.teamMembers.evaluatedTrainees')} ({evaluatedTrainees.length})
            </button>
          </div>

          {/* Team Members Tab */}
          {activeTab === "team" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{teamStats.map((member) => (
                <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6">
                  <div className="flex flex-col items-center mb-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-2xl font-bold mb-3 shadow-lg">
                      {member.fullName ? member.fullName.charAt(0).toUpperCase() : "U"}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 text-center text-truncate-1 w-full px-2" title={member.fullName}>{member.fullName}</h3>
                    <p className="text-sm text-gray-500 text-center truncate w-full px-2" title={member.email}>{member.email}</p>
                    <span className="mt-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
                      {member.role.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm" />
                        <span className="text-sm text-gray-600 font-medium">{t("pages.teamMembers.pendingTasks")}</span>
                      </div>
                      <span className="font-bold text-gray-900 text-lg">{member.stats.pending}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" />
                        <span className="text-sm text-gray-600 font-medium">{t("pages.teamMembers.inProgressTasks")}</span>
                      </div>
                      <span className="font-bold text-gray-900 text-lg">{member.stats.inProgress}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm" />
                        <span className="text-sm text-gray-600 font-medium">{t("pages.teamMembers.completedTasks")}</span>
                      </div>
                      <span className="font-bold text-gray-900 text-lg">{member.stats.completed}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{t("dashboard.totalTasks")}</span>
                      <span className="text-xl font-bold text-blue-600">
                        {member.stats.pending + member.stats.inProgress + member.stats.completed}
                      </span>
                    </div>
                    <div className="mt-4 flex justify-between gap-2">
                      <button
                        disabled={actionLoadingId === member.id}
                        onClick={() => setDeleteConfirm({ show: true, member })}
                        className="px-4 py-2 rounded-lg transition-colors bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {t("common.delete")}
                      </button>
                      <button
                        disabled={actionLoadingId === member.id}
                        onClick={() => openRoleChangeModal(member)}
                        className="px-4 py-2 rounded-lg transition-colors bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {actionLoadingId === member.id ? t("common.loading") : t("pages.teamMembers.manageRole")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}</div>

              {teamStats.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">{t("pages.teamMembers.noMembers")}</h3>
                  <p className="mt-1 text-sm text-gray-500">{t("pages.teamMembers.totalMembers")}</p>
                </div>
              )}
            </>
          )}

          {/* Evaluated Trainees Tab */}
          {activeTab === "trainees" && (
            <>
              {traineesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : evaluatedTrainees.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">{t('pages.teamMembers.memberName')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">{t('pages.teamMembers.memberEmail')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">{t('pages.teamMembers.position')}</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">{t('pages.teamMembers.score')}</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">{t('pages.teamMembers.completion')}</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">{t('pages.teamMembers.action')}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                        {evaluatedTrainees.map((trainee) => (
                          <tr key={trainee._id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-sm font-bold">
                                  {trainee.fullName?.charAt(0).toUpperCase() || "T"}
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{trainee.fullName}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{trainee.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{trainee.position || "N/A"}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${trainee.hrFinalScore >= 95 ? "bg-green-100 text-green-800" :
                                trainee.hrFinalScore >= 80 ? "bg-blue-100 text-blue-800" :
                                  trainee.hrFinalScore >= 70 ? "bg-yellow-100 text-yellow-800" :
                                    "bg-red-100 text-red-800"
                                }`}>
                                {trainee.hrFinalScore?.toFixed(1) || "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                                {trainee.completionRate?.toFixed(0) || 0}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => setPromoteModal({ show: true, trainee, employmentType: "full_time" })}
                                disabled={actionLoadingId === trainee.traineeId}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {actionLoadingId === trainee.traineeId ? t('pages.teamMembers.promoting') : t('pages.teamMembers.promote')}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-slate-100">No Evaluated Trainees</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Trainees will appear here after HR evaluation</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-lg w-full mx-4 animate-slideUp max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">{t('pages.teamMembers.addNewUser')}</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={addUserForm.fullName}
                  onChange={(e) => setAddUserForm({ ...addUserForm, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Email *</label>
                <input
                  type="email"
                  value={addUserForm.email}
                  onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  placeholder="Enter email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Password (optional - random if empty)</label>
                <input
                  type="password"
                  value={addUserForm.password}
                  onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  placeholder="Leave empty for random password"
                  minLength={6}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Role</label>
                  <select
                    value={addUserForm.role}
                    onChange={(e) => setAddUserForm({ ...addUserForm, role: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  >
                    <option value="user">User</option>
                    <option value="hr">HR</option>
                    <option value="trainee">Trainee</option>
                    <option value="part_time">Part-Time</option>
                    <option value="full_time">Full-Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Status</label>
                  <select
                    value={addUserForm.isActive ? "active" : "inactive"}
                    onChange={(e) => setAddUserForm({ ...addUserForm, isActive: e.target.value === "active" })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Phone (optional)</label>
                <input
                  type="tel"
                  value={addUserForm.phone}
                  onChange={(e) => setAddUserForm({ ...addUserForm, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  placeholder="Enter phone number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Department (optional)</label>
                  <input
                    type="text"
                    value={addUserForm.department}
                    onChange={(e) => setAddUserForm({ ...addUserForm, department: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                    placeholder="Enter department"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Position (optional)</label>
                  <input
                    type="text"
                    value={addUserForm.position}
                    onChange={(e) => setAddUserForm({ ...addUserForm, position: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                    placeholder="Enter position"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">CV (optional) - PDF only</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleCVFileChange}
                    disabled={addingUser}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-500 file:text-white file:cursor-pointer hover:file:bg-indigo-600"
                  />
                </div>
                {cvFile && (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <span className="font-semibold">✓ File selected:</span> {cvFile.name}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      ({(cvFile.size / 1024).toFixed(1)} KB)
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCvFile(null);
                        setCvError("");
                      }}
                      className="mt-2 text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 underline"
                    >
                      Remove file
                    </button>
                  </div>
                )}
                {cvError && (
                  <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">{cvError}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUser(false);
                    setCvFile(null);
                    setCvError("");
                    setAddUserForm({
                      fullName: "",
                      email: "",
                      password: "",
                      role: "user",
                      isActive: true,
                      phone: "",
                      department: "",
                      position: "",
                    });
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingUser}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {addingUser ? cvFile ? "Creating & Uploading CV..." : "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && deleteConfirm.member && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4 animate-slideUp">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">{t('pages.teamMembers.deleteUser')}</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
              {t('pages.teamMembers.deleteUserConfirm', { name: deleteConfirm.member.fullName })}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, member: null })}
                className="px-4 py-2 text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={actionLoadingId === deleteConfirm.member.id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {actionLoadingId === deleteConfirm.member.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {roleChangeModal.show && roleChangeModal.member && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4 animate-slideUp">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">Change User Role</h3>

            {/* Warning Box */}
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Important</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Changing roles affects system access and responsibilities. HR roles are not tied to programming skills. Please ensure this is intentional.
                  </p>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-slate-300"><span className="font-semibold">User:</span> {roleChangeModal.member.fullName}</p>
              <p className="text-sm text-gray-600 dark:text-slate-300"><span className="font-semibold">Email:</span> {roleChangeModal.member.email}</p>
              <p className="text-sm text-gray-600 dark:text-slate-300 mt-2"><span className="font-semibold">Current Role:</span> <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">{roleChangeModal.member.role.toUpperCase()}</span></p>
            </div>

            {/* Role Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Select New Role</label>
              <select
                value={roleChangeModal.selectedRole}
                onChange={(e) => setRoleChangeModal({ ...roleChangeModal, selectedRole: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              >
                <option value="user">User (Standard team member)</option>
                <option value="trainee">Trainee (New to organization)</option>
                <option value="hr">HR (Human Resources)</option>
                <option value="part_time">Part-Time (Flexible hours)</option>
                <option value="full_time">Full-Time (Standard full-time)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                {roleChangeModal.selectedRole === "user" && "Standard team member with task assignment and personal dashboard access."}
                {roleChangeModal.selectedRole === "trainee" && "Trainee role for onboarding and training program participation."}
                {roleChangeModal.selectedRole === "hr" && "HR role for applicant management and training administration (requires explicit admin approval)."}
                {roleChangeModal.selectedRole === "part_time" && "Part-time employee with flexible working hours and limited responsibilities."}
                {roleChangeModal.selectedRole === "full_time" && "Full-time employee with standard working hours and full responsibilities."}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setRoleChangeModal({ show: false, member: null, selectedRole: null })}
                className="px-4 py-2 text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeRole}
                disabled={actionLoadingId === roleChangeModal.member.id || roleChangeModal.selectedRole === roleChangeModal.member.role}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {actionLoadingId === roleChangeModal.member.id ? t("buttons.updating") : t("buttons.confirmRoleChange")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promote Trainee Modal */}
      {promoteModal.show && promoteModal.trainee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4 animate-slideUp">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">Promote Trainee</h3>

            {/* Trainee Info */}
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-700 text-white flex items-center justify-center text-lg font-bold">
                  {promoteModal.trainee.fullName?.charAt(0).toUpperCase() || "T"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{promoteModal.trainee.fullName}</p>
                  <p className="text-xs text-gray-600 dark:text-slate-400">{promoteModal.trainee.email}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs text-gray-600 dark:text-slate-400">
                      Score: <span className="font-semibold text-green-700 dark:text-green-400">{promoteModal.trainee.hrFinalScore?.toFixed(1)}</span>
                    </span>
                    <span className="text-xs text-gray-600 dark:text-slate-400">
                      Completion: <span className="font-semibold text-green-700 dark:text-green-400">{promoteModal.trainee.completionRate?.toFixed(0)}%</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">Select Employment Type</label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-slate-700"
                  style={{ borderColor: promoteModal.employmentType === "full_time" ? "#4F46E5" : "#D1D5DB" }}>
                  <input
                    type="radio"
                    name="employmentType"
                    value="full_time"
                    checked={promoteModal.employmentType === "full_time"}
                    onChange={(e) => setPromoteModal({ ...promoteModal, employmentType: e.target.value })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">Full-Time Employee</p>
                    <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                      Standard full-time position with complete access to all employee features and benefits
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-slate-700"
                  style={{ borderColor: promoteModal.employmentType === "part_time" ? "#4F46E5" : "#D1D5DB" }}>
                  <input
                    type="radio"
                    name="employmentType"
                    value="part_time"
                    checked={promoteModal.employmentType === "part_time"}
                    onChange={(e) => setPromoteModal({ ...promoteModal, employmentType: e.target.value })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">Part-Time Employee</p>
                    <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                      Flexible part-time position with limited hours and responsibilities
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setPromoteModal({ show: false, trainee: null, employmentType: "full_time" })}
                className="px-4 py-2 text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePromoteTrainee}
                disabled={actionLoadingId === promoteModal.trainee.traineeId}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {actionLoadingId === promoteModal.trainee.traineeId ? "Promoting..." : "Confirm Promotion"}
              </button>
            </div>
          </div>
        </div>
      )}

      {user && <ChatButton currentUser={user} />}
    </div>
  );
};

export default ManageUsers;
