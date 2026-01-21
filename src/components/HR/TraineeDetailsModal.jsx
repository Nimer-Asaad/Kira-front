import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { formatDate } from "../../utils/helper";

export default function TraineeDetailsModal({ trainee, isOpen, onClose, onTraineeUpdated }) {
	const [tasks, setTasks] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [filterStatus, setFilterStatus] = useState("all"); // all, pending, in-progress, completed

	useEffect(() => {
		if (!isOpen || !trainee?._id) return;
		fetchTraineeTasks();
	}, [isOpen, trainee?._id]);

	const fetchTraineeTasks = async () => {
		try {
			setLoading(true);
			setError("");
			// Use the HR trainees tasks endpoint
			const res = await axiosInstance.get(API_PATHS.HR_TRAINEE_TASKS(trainee._id));
			setTasks(Array.isArray(res.data) ? res.data : []);
		} catch (err) {
			console.error("fetchTraineeTasks error", err);
			const errorMsg = err?.response?.data?.message || err?.message || "Failed to load tasks";
			setError(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	const filtered = tasks.filter((t) => {
		if (filterStatus === "all") return true;
		if (filterStatus === "completed") {
			// Include both 'completed' and 'reviewed' tasks in Completed filter
			return t.status === "completed" || t.status === "reviewed";
		}
		return t.status === filterStatus;
	});

	const totalTasks = tasks.length;
	const completedTasks = tasks.filter((t) => t.status === "completed" || t.status === "reviewed").length;
	const pendingTasks = tasks.filter((t) => t.status === "pending").length;
	const inProgressTasks = tasks.filter((t) => t.status === "in-progress").length;
	const avgScore = totalTasks > 0 
		? Math.round(tasks.reduce((sum, t) => sum + ((t.earnedPoints || 0) / (t.maxPoints || 1)) * 100, 0) / totalTasks)
		: 0;

	const getStatusColor = (status) => {
		switch (status) {
			case "completed":
			case "reviewed":
				return "bg-emerald-100 text-emerald-700 border-emerald-200";
			case "in-progress":
				return "bg-blue-100 text-blue-700 border-blue-200";
			case "pending":
				return "bg-yellow-100 text-yellow-700 border-yellow-200";
			default:
				return "bg-slate-100 text-slate-700 border-slate-200";
		}
	};

	const formatStatus = (status) => {
		const map = {
			pending: "Pending",
			"in-progress": "In Progress",
			completed: "Completed",
			reviewed: "Reviewed",
		};
		return map[status] || status;
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
			<div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col modal-enter">
				{/* Header */}
				<div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/30 flex items-center justify-between sticky top-0">
					<div>
						<h2 className="text-2xl font-bold text-indigo-600">
							{trainee.applicantId?.fullName || "Trainee"}
						</h2>
						<p className="text-sm text-slate-500 mt-1">
							{trainee.applicantId?.email}
						</p>
					</div>
					<button
						onClick={onClose}
						className="text-slate-400 hover:text-slate-600 transition-all duration-200 p-2 hover:bg-slate-100 rounded-full hover:scale-110"
					>
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto">
					<div className="p-6 space-y-6">
						{/* Summary Stats */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-lg p-4 border border-indigo-200">
								<p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">
									Avg Score
								</p>
								<p className="text-3xl font-bold text-indigo-600">{avgScore}%</p>
							</div>
							<div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg p-4 border border-emerald-200">
								<p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
									Completed
								</p>
								<p className="text-3xl font-bold text-emerald-600">
									{completedTasks}/{totalTasks}
								</p>
							</div>
							<div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-4 border border-blue-200">
								<p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
									In Progress
								</p>
								<p className="text-3xl font-bold text-blue-600">{inProgressTasks}</p>
							</div>
							<div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-lg p-4 border border-yellow-200">
								<p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-1">
									Pending
								</p>
								<p className="text-3xl font-bold text-yellow-600">{pendingTasks}</p>
							</div>
						</div>

						{/* Additional Info */}
						<div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200">
							<div>
								<p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
									Status
								</p>
								<p className="text-sm font-medium text-slate-900">
									{trainee.status || "Active"}
								</p>
							</div>
							<div>
								<p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
									Started
								</p>
								<p className="text-sm font-medium text-slate-900">
									{formatDate(trainee.startedAt)}
								</p>
							</div>
							{trainee.hrFinalScore !== null && (
								<div>
									<p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
										HR Score
									</p>
									<p className="text-sm font-medium text-slate-900">
										{trainee.hrFinalScore}%
									</p>
								</div>
							)}
							{trainee.evaluatedAt && (
								<div>
									<p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
										Evaluated
									</p>
									<p className="text-sm font-medium text-slate-900">
										{formatDate(trainee.evaluatedAt)}
									</p>
								</div>
							)}
						</div>

						{/* Filter Tabs */}
						<div className="flex items-center gap-2 overflow-x-auto pb-2">
						{["all", "pending", "in-progress", "completed"].map((status) => {
							// Count for badge - include reviewed tasks in completed count
							let count;
							if (status === "completed") {
								count = tasks.filter((t) => t.status === "completed" || t.status === "reviewed").length;
							} else {
								count = tasks.filter((t) => t.status === status).length;
							}
							
							return (
								<button
									key={status}
									onClick={() => setFilterStatus(status)}
									className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium text-sm transition-all duration-200 flex-shrink-0 ${
										filterStatus === status
											? "bg-indigo-600 text-white shadow-md"
											: "bg-slate-100 text-slate-700 hover:bg-slate-200"
									}`}
								>
									{status === "all"
										? "All Tasks"
										: status === "in-progress"
										? "In Progress"
										: status.charAt(0).toUpperCase() + status.slice(1)}
									{status !== "all" && ` (${count})`}
								</button>
							);
						})}
			</div>

			{/* Tasks List */}
						{loading ? (
							<div className="py-12 text-center">
								<div className="flex items-center justify-center gap-2 mb-4">
									<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
									<span className="text-slate-600">Loading tasks...</span>
								</div>
							</div>
						) : error ? (
							<div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
								<p className="text-rose-700 font-medium">Error: {error}</p>
							</div>
						) : filtered.length > 0 ? (
							<div className="space-y-3">
								{filtered.map((task) => {
									const earnedPoints = task.earnedPoints || 0;
									const maxPoints = task.maxPoints || 0;
									const percentage = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;

									return (
										<div
											key={task._id}
											className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
										>
											<div className="flex items-start justify-between gap-4 mb-3">
												<div className="flex-1 min-w-0">
													<h4 className="font-semibold text-slate-900 truncate">
														{task.title}
													</h4>
													<p className="text-xs text-slate-500 mt-1 line-clamp-2">
														{task.description}
													</p>
												</div>
												<span className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap flex-shrink-0 ${getStatusColor(task.status)}`}>
													{formatStatus(task.status)}
												</span>
											</div>

											<div className="flex items-center gap-4 text-sm">
												<div className="flex items-center gap-2">
													<svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
													</svg>
													<span className="text-slate-600">
														{formatDate(task.dueDate)}
													</span>
												</div>

												{task.status === "completed" && (
													<div className="flex items-center gap-2">
														<div className="flex items-center gap-1">
															<span className="text-slate-700 font-medium">
																{earnedPoints}/{maxPoints}
															</span>
															<span className="text-slate-500">pts</span>
														</div>
														<div className="text-right">
															<span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-semibold text-xs">
																{percentage}%
															</span>
														</div>
													</div>
												)}

												{task.priority && (
													<div className="flex items-center gap-2">
														<span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
															task.priority === "high" ? "bg-rose-500" :
															task.priority === "medium" ? "bg-yellow-500" :
															"bg-blue-500"
														}`}></span>
														<span className="text-slate-600 capitalize text-xs">
															{task.priority}
														</span>
													</div>
												)}
											</div>

											{task.checklist && task.checklist.length > 0 && (
												<div className="mt-3 pt-3 border-t border-slate-100">
													<p className="text-xs text-slate-600 mb-2">
														Checklist: {task.checklist.filter((c) => c.done).length}/{task.checklist.length}
													</p>
													<div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
														<div
															className="h-full bg-indigo-500 transition-all duration-300"
															style={{
																width: `${
																	task.checklist.length > 0
																		? Math.round(
																				(task.checklist.filter((c) => c.done).length /
																					task.checklist.length) *
																					100
																		)
																		: 0
																}%`,
															}}
														/>
													</div>
												</div>
											)}
										</div>
									);
								})}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center py-12 px-4">
								<svg className="w-12 h-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
								</svg>
								<p className="text-slate-700 font-medium">No tasks found</p>
								<p className="text-slate-500 text-sm">
									{filterStatus === "all"
										? "This trainee has no tasks yet"
										: `No ${filterStatus.replace("-", " ")} tasks`}
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
					<button
						onClick={onClose}
						className="px-6 py-2.5 rounded-lg font-semibold text-sm text-slate-700 bg-slate-200 hover:bg-slate-300 transition-all duration-200 active:scale-95"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}

