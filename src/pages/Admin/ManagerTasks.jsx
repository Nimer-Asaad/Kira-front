import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "../../components/Sidebar";
import ChatButton from "../../components/ChatButton";
import TaskCard from "../../components/TaskCard";
import PdfImportModal from "../../components/PdfImportModal";
import AutoDistributeModal from "../../components/AutoDistributeModal";
import TraineeProgressTable from "../../components/HR/TraineeProgressTable";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { formatDate, getPriorityColor, getStatusColor, downloadCSV, calculateProgress } from "../../utils/helper";
import { useAuth } from "../../context/AuthContext";

const ManagerTasks = () => {
	const { t } = useTranslation();
	const { user } = useAuth();

	const adminLinks = [
		{
			path: "/admin/dashboard",
			label: t("nav.dashboard"),
			icon: (
				<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
				</svg>
			),
		},
		{
			path: "/admin/tasks",
			label: t("nav.manageTasks"),
			icon: (
				<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
				</svg>
			),
		},
		{
			path: "/admin/create-task",
			label: t("nav.createTask"),
			icon: (
				<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
				</svg>
			),
		},
		{
			path: "/admin/users",
			label: t("nav.teamMembers"),
			icon: (
				<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
				</svg>
			),
		},
	];

	const [tasks, setTasks] = useState([]);
	const [filtered, setFiltered] = useState([]);
	const [active, setActive] = useState("all");
	const [audience, setAudience] = useState("employee"); // employee | trainee
	const [loading, setLoading] = useState(true);
	const [loadingDetails, setLoadingDetails] = useState(false);
	const [selectedTask, setSelectedTask] = useState(null);
	const [showModal, setShowModal] = useState(false);
	const [updatingTask, setUpdatingTask] = useState(false);
	const [showPdfImportModal, setShowPdfImportModal] = useState(false);
	const [showAutoDistributeModal, setShowAutoDistributeModal] = useState(false);
	const [toast, setToast] = useState(null);

	const normalizeTask = (task = {}) => ({
		...task,
		checklist: Array.isArray(task.checklist)
			? task.checklist.map((i) => ({ text: i.text || i.title || "", done: !!i.done }))
			: [],
	});

	const showToast = (message, type = "success") => {
		setToast({ message, type });
	};

	useEffect(() => {
		if (!toast) return;
		const timer = setTimeout(() => setToast(null), 4000);
		return () => clearTimeout(timer);
	}, [toast]);

	useEffect(() => {
		loadTasks();
	}, []);

	useEffect(() => {
		if (active === "all") setFiltered(tasks);
		else setFiltered(tasks.filter((t) => t.status === active));
	}, [active, tasks]);

	// Reload when audience changes
	useEffect(() => {
		loadTasks();
	}, [audience]);

	const loadTasks = async () => {
		try {
			setLoading(true);
			const qs = new URLSearchParams();
			if (active !== "all") qs.set("status", active);
			if (audience) qs.set("ownerType", audience);
			const url = `${API_PATHS.ADMIN_TASKS}?${qs.toString()}`;
			const res = await axiosInstance.get(url);
			const normalizedTasks = Array.isArray(res.data) ? res.data.map(normalizeTask) : [];
			setTasks(normalizedTasks);
		} catch (error) {
			console.error("Failed to load tasks", error);
		} finally {
			setLoading(false);
		}
	};

	const handleDownload = async () => {
		try {
			const res = await axiosInstance.get(API_PATHS.TASK_REPORT);
			downloadCSV(res.data, "task-report");
		} catch (error) {
			console.error("Failed to download report", error);
		}
	};

	const handleViewTask = async (task) => {
		const normalized = normalizeTask(task);
		setSelectedTask(normalized);
		setShowModal(true);
		setLoadingDetails(true);

		try {
			const res = await axiosInstance.get(API_PATHS.TASK_BY_ID(task._id));
			const fresh = normalizeTask(res.data);
			setSelectedTask(fresh);
			setTasks((prev) => prev.map((t) => (t._id === fresh._id ? fresh : t)));
		} catch (error) {
			console.error("Failed to refresh task details", error);
			showToast("Failed to refresh task details", "error");
		} finally {
			setLoadingDetails(false);
		}
	};

	const handleCloseModal = () => {
		setShowModal(false);
		setSelectedTask(null);
	};

	const handleStatusChange = (e) => {
		setSelectedTask({ ...selectedTask, status: e.target.value });
	};

	const handleChecklistToggle = async (index) => {
		if (!selectedTask?.checklist) return;
		const previous = selectedTask.checklist;
		const updatedChecklist = previous.map((item, i) =>
			i === index ? { ...item, done: !item.done } : item
		);

		setSelectedTask({ ...selectedTask, checklist: updatedChecklist });

		try {
			const res = await axiosInstance.patch(API_PATHS.TASK_CHECKLIST(selectedTask._id), {
				checklist: updatedChecklist,
			});
			const fresh = normalizeTask(res.data);
			setSelectedTask(fresh);
			setTasks((prev) => prev.map((t) => (t._id === fresh._id ? fresh : t)));
		} catch (error) {
			console.error("Error updating checklist item:", error);
			setSelectedTask({ ...selectedTask, checklist: previous });
			showToast("Failed to update checklist item", "error");
		}
	};

	const handleUpdateTask = async () => {
		try {
			setUpdatingTask(true);
			await Promise.all([
				axiosInstance.patch(API_PATHS.TASK_STATUS(selectedTask._id), {
					status: selectedTask.status,
				}),
				axiosInstance.patch(API_PATHS.TASK_CHECKLIST(selectedTask._id), {
					checklist: selectedTask.checklist,
				}),
			]);

			setTasks(tasks.map((task) =>
				task._id === selectedTask._id
					? { ...task, status: selectedTask.status, checklist: selectedTask.checklist }
					: task
			));

			alert("✅ Task updated successfully!");
			handleCloseModal();
		} catch (error) {
			console.error("Error updating task:", error);
			alert("❌ Failed to update task.");
		} finally {
			setUpdatingTask(false);
		}
	};

	const handleMarkCompleted = async () => {
		try {
			setUpdatingTask(true);
			await axiosInstance.patch(API_PATHS.TASK_STATUS(selectedTask._id), {
				status: "completed",
			});

			setTasks(tasks.map((task) =>
				task._id === selectedTask._id ? { ...task, status: "completed" } : task
			));

			alert("✅ Task marked as completed!");
			handleCloseModal();
		} catch (error) {
			console.error("Error marking task as completed:", error);
			alert("❌ Failed to mark task as completed.");
		} finally {
			setUpdatingTask(false);
		}
	};

	const handleDeleteTask = async () => {
		if (!confirm("Are you sure you want to delete this task?")) return;

		try {
			setUpdatingTask(true);
			await axiosInstance.delete(API_PATHS.DELETE_TASK(selectedTask._id));

			setTasks(tasks.filter((task) => task._id !== selectedTask._id));

			alert("✅ Task deleted successfully!");
			handleCloseModal();
		} catch (error) {
			console.error("Error deleting task:", error);
			alert("❌ Failed to delete task.");
		} finally {
			setUpdatingTask(false);
		}
	};

	const handleImportSuccess = (summary = {}) => {
		const created = summary.createdCount || 0;
		const skipped = summary.skippedCount || 0;
		const fixed = summary.fixedCount || 0;
		loadTasks();
		setShowPdfImportModal(false);
		const hasIssues = summary.errors && summary.errors.length;
		const message = hasIssues
			? `Import complete — Created ${created}, Skipped ${skipped}, Fixed ${fixed} (with ${summary.errors.length} issues)`
			: `Import complete — Created ${created}, Skipped ${skipped}, Fixed ${fixed}`;
		showToast(message, hasIssues ? "warning" : "success");
	};

	const formatStatus = (status) => {
		const map = {
			pending: t("manageTasks.pending"),
			"in-progress": t("manageTasks.inProgress"),
			completed: t("manageTasks.completed"),
		};
		return map[(status || "").toLowerCase()] || status || "Unknown";
	};

	const totalChecklist = selectedTask?.checklist?.length || 0;
	const completedChecklist = selectedTask?.checklist?.filter((i) => i.done).length || 0;
	const checklistProgress = totalChecklist ? Math.round(calculateProgress(selectedTask.checklist)) : 0;

	const tabs = [
		{ id: "all", label: t("manageTasks.all") },
		{ id: "pending", label: t("manageTasks.pending") },
		{ id: "in-progress", label: t("manageTasks.inProgress") },
		{ id: "completed", label: t("manageTasks.completed") },
	];

	if (loading) {
		return (
			<div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
				<Sidebar links={adminLinks} />
				<main className="lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64 min-h-screen w-full overflow-x-auto">
					<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-screen">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 border-t-transparent"></div>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
			{toast && (
				<div
					className={`fixed top-4 right-4 z-[1100] max-w-sm w-full border-l-4 shadow-xl rounded-xl px-4 py-3 text-sm transition-all duration-300 animate-slideUp ${toast.type === "error"
						? "bg-gradient-to-r from-rose-50 to-red-50 border-rose-500 text-rose-800"
						: toast.type === "warning"
							? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-500 text-amber-800"
							: "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-500 text-emerald-800"
						}`}
				>
					<p className="font-bold leading-5">{toast.message}</p>
				</div>
			)}
			<Sidebar links={adminLinks} />
			<main className="lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64 min-h-screen w-full overflow-x-auto animate-fadeIn">
				<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8">
					{/* Header */}
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slideUp">
						<div>
							<h1 className="text-3xl sm:text-4xl font-bold text-indigo-600 mb-2">
								{t("manageTasks.title")}
							</h1>
							<p className="text-sm text-slate-600 font-medium">{t("manageTasks.description")}</p>
						</div>
						<div className="flex flex-wrap items-center gap-2 sm:gap-3">
							<button
								onClick={() => setShowPdfImportModal(true)}
								className="flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-sm sm:text-base whitespace-nowrap"
							>
								<svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
								</svg>
								<span className="truncate">{t("manageTasks.importFromPDF")}</span>
							</button>
							<button
								onClick={() => setShowAutoDistributeModal(true)}
								className="flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-sm sm:text-base whitespace-nowrap"
							>
								<svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
								</svg>
								<span className="truncate">{t("manageTasks.autoDistribute")}</span>
							</button>
							<button
								onClick={handleDownload}
								className="flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-sm sm:text-base whitespace-nowrap"
							>
								<svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
								</svg>
								<span className="truncate">{t("manageTasks.downloadReport")}</span>
							</button>
						</div>
					</div>

					<div className="bg-slate-100 p-1 rounded-xl animate-fadeIn overflow-x-auto" style={{ animationDelay: '100ms' }}>
						<div className="flex space-x-1 w-fit min-w-full sm:min-w-0">
							{tabs.map((tab) => (
								<button
									key={tab.id}
									onClick={() => setActive(tab.id)}
									className={`px-4 sm:px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 whitespace-nowrap flex-shrink-0 ${active === tab.id
										? "bg-indigo-600 text-white shadow-lg scale-105"
										: "text-slate-600 hover:text-slate-900 hover:bg-white"
										}`}
								>
									{tab.label}
								</button>
							))}
						</div>
					</div>

					{/* Audience toggle */}
					<div className="flex items-center gap-3 animate-fadeIn" style={{ animationDelay: '150ms' }}>
						<span className="text-sm font-semibold text-slate-700">Audience:</span>
						<div className="inline-flex rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-50 shadow-sm">
							<button
								onClick={() => setAudience("employee")}
								className={`px-4 py-2 text-sm font-semibold transition-all duration-300 ${audience === "employee"
									? "bg-indigo-600 text-white shadow-md"
									: "bg-transparent text-slate-600 hover:text-slate-900"
									}`}
							>
								Members
							</button>
							<button
								onClick={() => setAudience("trainee")}
								className={`px-4 py-2 text-sm font-semibold transition-all duration-300 ${audience === "trainee"
									? "bg-indigo-600 text-white shadow-md"
									: "bg-transparent text-slate-600 hover:text-slate-900"
									}`}
							>
								Trainees
							</button>
						</div>
					</div>

					{/* Trainees Progress Table - shown only when audience is trainee */}
					{audience === "trainee" && (
						<div className="mb-10 animate-slideUp">
							<TraineeProgressTable />
						</div>
					)}

					{/* Tasks Grid */}
					<div className="space-y-4">
						{audience === "trainee" && (
							<div>
								<h3 className="text-xl font-bold text-slate-800">Training Tasks</h3>
								<p className="text-sm text-slate-500 mt-1">Create or manage tasks for trainees</p>
							</div>
						)}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{filtered.map((task, index) => (
								<div key={task._id} className="animate-fadeIn" style={{ animationDelay: `${200 + index * 50}ms` }}>
									<TaskCard task={task} onClick={() => handleViewTask(task)} />
								</div>
							))}
						</div>

						{!filtered.length && (
							<div className="flex flex-col items-center justify-center py-20 px-4 card-premium animate-fadeIn">
								<div className="bg-indigo-100 p-8 rounded-2xl mb-6 shadow-lg">
									<svg className="w-16 h-16 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
									</svg>
								</div>
								<p className="text-slate-700 font-bold text-lg mb-2">No tasks found</p>
								<p className="text-slate-500 text-sm font-medium">Tasks for this filter will appear here</p>
							</div>
						)}
					</div>
				</div>
			</main>

			{user && <ChatButton currentUser={user} />}

			{/* Task Details Modal */}
			{showModal && selectedTask && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
					<div className="card-premium max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-enter">
						<div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white rounded-t-xl bg-gradient-to-r from-slate-50 to-indigo-50/30">
							<h2 className="text-2xl font-bold text-indigo-600">Task Details</h2>
							<button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-all duration-200 p-2 hover:bg-slate-100 rounded-full hover:scale-110">
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>

						<div className="p-6 space-y-6">
							<div>
								<div className="flex items-center justify-between mb-2">
									<h3 className="text-xl font-semibold text-gray-800">{selectedTask.title}</h3>
									{loadingDetails && <span className="text-xs text-gray-500">Refreshing...</span>}
								</div>
								<div className="flex items-center gap-3 flex-wrap">
									<span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getPriorityColor((selectedTask.priority || "").toLowerCase())}`}>
										{(selectedTask.priority || "").toUpperCase()} PRIORITY
									</span>
									<div className="flex items-center text-sm text-gray-600">
										<svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
										</svg>
										Due: {formatDate(selectedTask.dueDate)}
									</div>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
								<p className="text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">{selectedTask.description}</p>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">TODO Checklist</label>
								{selectedTask.checklist && selectedTask.checklist.length > 0 ? (
									<div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
										<div className="flex items-center justify-between text-sm text-gray-600">
											<span>
												{completedChecklist}/{totalChecklist} completed
											</span>
											<span>{checklistProgress}%</span>
										</div>
										<div className="w-full bg-gray-200 rounded-full h-2.5">
											<div
												className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
												style={{ width: `${checklistProgress}%` }}
											></div>
										</div>
										<div className="space-y-2">
											{selectedTask.checklist.map((item, index) => (
												<label
													key={index}
													className="flex items-center space-x-3 cursor-pointer hover:bg-white p-3 rounded-lg transition-all duration-150 group"
												>
													<input
														type="checkbox"
														checked={item.done}
														onChange={() => handleChecklistToggle(index)}
														className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
													/>
													<span className={`flex-1 transition-all duration-150 ${item.done ? "line-through text-gray-400" : "text-gray-700 group-hover:text-gray-900"}`}>
														{item.text}
													</span>
												</label>
											))}
										</div>
									</div>
								) : (
									<div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-500">No checklist items.</div>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
								<select value={selectedTask.status} onChange={handleStatusChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent">
									<option value="pending">Pending</option>
									<option value="in-progress">In Progress</option>
									<option value="completed">Completed</option>
								</select>
							</div>

							{selectedTask.assignedTo && (
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
									<div className="flex items-center gap-2">
										<div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
											<div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
												{(selectedTask.assignedTo.fullName || selectedTask.assignedTo.name || "U").charAt(0).toUpperCase()}
											</div>
											<span className="text-sm text-gray-700">{selectedTask.assignedTo.fullName || selectedTask.assignedTo.name}</span>
										</div>
									</div>
								</div>
							)}

							{/* Attachments Section */}
							{selectedTask.attachments && selectedTask.attachments.length > 0 && (
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
									<div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
										{selectedTask.attachments.map((attachment, index) => (
											<div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow duration-150">
												<div className="flex items-center gap-3 flex-1 min-w-0">
													<svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
													</svg>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-medium text-gray-900 truncate">{attachment.name || "Attachment"}</p>
														<p className="text-xs text-gray-500 truncate">{attachment.url}</p>
													</div>
												</div>
												<a
													href={attachment.url}
													target="_blank"
													rel="noopener noreferrer"
													className="ml-3 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-150 flex-shrink-0"
												>
													Open
												</a>
											</div>
										))}
									</div>
								</div>
							)}

							<div className="flex gap-3 pt-4 border-t border-gray-200">
								<button onClick={handleUpdateTask} disabled={updatingTask} className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-all duration-150 font-medium disabled:bg-blue-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md">
									{updatingTask ? t("buttons.updating") : t("buttons.updateTask")}
								</button>
								<button onClick={handleMarkCompleted} disabled={updatingTask || selectedTask.status === "completed"} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-150 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed">
									{t("buttons.markComplete")}
								</button>
								<button onClick={handleDeleteTask} disabled={updatingTask} className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-150 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed">
									{t("common.delete")}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* PDF Import Modal */}
			<PdfImportModal
				isOpen={showPdfImportModal}
				onClose={() => setShowPdfImportModal(false)}
				onImportSuccess={handleImportSuccess}
			/>

			{/* Auto Distribute Modal */}
			<AutoDistributeModal
				isOpen={showAutoDistributeModal}
				onClose={() => setShowAutoDistributeModal(false)}
				onDistributeSuccess={loadTasks}
			/>
		</div>
	);
};

export default ManagerTasks;
