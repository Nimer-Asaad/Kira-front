import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import TraineeDetailsModal from "./TraineeDetailsModal";

export default function TraineeProgressTable() {
	const [trainees, setTrainees] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedTrainee, setSelectedTrainee] = useState(null);
	const [showDetailsModal, setShowDetailsModal] = useState(false);

	const itemsPerPage = 10;

	useEffect(() => {
		fetchTraineeProgress();
	}, []);

	const fetchTraineeProgress = async () => {
		try {
			setLoading(true);
			setError("");
			// Use the HR trainees endpoint which returns progress data
			const res = await axiosInstance.get(API_PATHS.HR_TRAINEES_PROGRESS);
			const data = Array.isArray(res.data) ? res.data : [];
			setTrainees(data);
		} catch (err) {
			console.error("fetchTraineeProgress error", err);
			const errorMsg = err?.response?.data?.message || err?.message || "Failed to load trainee progress";
			setError(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	const filtered = trainees.filter((t) => {
		const search = searchTerm.toLowerCase();
		const fullName = (t.applicantId?.fullName || "").toLowerCase();
		const email = (t.applicantId?.email || "").toLowerCase();
		return fullName.includes(search) || email.includes(search);
	});

	const totalPages = Math.ceil(filtered.length / itemsPerPage);
	const paginatedTrainees = filtered.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	const getProgressColor = (percent) => {
		if (percent >= 80) return "bg-emerald-500";
		if (percent >= 60) return "bg-blue-500";
		if (percent >= 40) return "bg-yellow-500";
		return "bg-rose-500";
	};

	const getProgressBgColor = (percent) => {
		if (percent >= 80) return "bg-emerald-100";
		if (percent >= 60) return "bg-blue-100";
		if (percent >= 40) return "bg-yellow-100";
		return "bg-rose-100";
	};

	const getScoreColor = (score) => {
		if (score >= 90) return "text-emerald-700";
		if (score >= 70) return "text-blue-700";
		if (score >= 50) return "text-yellow-700";
		return "text-rose-700";
	};

	const handleViewDetails = (trainee) => {
		setSelectedTrainee(trainee);
		setShowDetailsModal(true);
	};

	const formatLastActivity = (date) => {
		if (!date) return "Never";
		const d = new Date(date);
		const now = new Date();
		const diffMs = now - d;
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMins / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 30) return `${diffDays}d ago`;
		return d.toLocaleDateString();
	};

	if (loading) {
		return (
			<div className="animate-fadeIn">
				<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
					<div className="flex items-center justify-center gap-2">
						<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
						<span className="text-slate-600">Loading trainee progress...</span>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="animate-fadeIn">
				<div className="bg-rose-50 rounded-xl border border-rose-200 p-4">
					<p className="text-rose-700 font-medium">Error: {error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="animate-fadeIn space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between gap-4">
				<div>
					<h3 className="text-xl font-bold text-slate-800">Trainees Progress</h3>
					<p className="text-sm text-slate-500 mt-1">Track trainee performance and completion rates</p>
				</div>
				<button
					onClick={fetchTraineeProgress}
					className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all duration-200 font-medium text-sm"
				>
					Refresh
				</button>
			</div>

			{/* Search */}
			<div className="relative">
				<svg className="absolute left-3 top-3 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<input
					type="text"
					placeholder="Search by name or email..."
					value={searchTerm}
					onChange={(e) => {
						setSearchTerm(e.target.value);
						setCurrentPage(1);
					}}
					className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
				/>
			</div>

			{/* Table */}
			<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
				{paginatedTrainees.length > 0 ? (
					<>
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-slate-50 border-b border-slate-200">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
											Trainee
										</th>
										<th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
											Email
										</th>
										<th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
											Avg Score
										</th>
										<th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
											Tasks Completed
										</th>
										<th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
											Progress
										</th>
										<th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
											Last Activity
										</th>
										<th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-200">
									{paginatedTrainees.map((trainee) => {
										const totalTasks = trainee.requiredTasksCount || 0;
										const completedTasks = trainee.completedTasksCount || 0;
										const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
										const avgScore = trainee.score || trainee.hrFinalScore || 0;

										return (
											<tr key={trainee._id} className="hover:bg-slate-50 transition-colors duration-150">
												<td className="px-6 py-4">
													<div className="flex items-center gap-3">
														<div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
															{(trainee.applicantId?.fullName || "T").charAt(0).toUpperCase()}
														</div>
														<div className="min-w-0">
															<p className="font-medium text-slate-900 truncate">
																{trainee.applicantId?.fullName || "Unknown"}
															</p>
															<p className="text-xs text-slate-500">
																{trainee.position || "Training"}
															</p>
														</div>
													</div>
												</td>
												<td className="px-6 py-4">
													<p className="text-sm text-slate-600 truncate">
														{trainee.applicantId?.email || "—"}
													</p>
												</td>
												<td className="px-6 py-4">
													<span className={`font-semibold text-sm ${getScoreColor(avgScore)}`}>
														{avgScore}%
													</span>
												</td>
												<td className="px-6 py-4">
													<span className="text-sm text-slate-700 font-medium">
														{completedTasks}/{totalTasks}
													</span>
												</td>
												<td className="px-6 py-4">
													<div className="flex items-center gap-2">
														<div className="flex-1">
															<div className={`h-2 rounded-full ${getProgressBgColor(progressPercent)} overflow-hidden`}>
																<div
																	className={`h-full ${getProgressColor(progressPercent)} transition-all duration-300`}
																	style={{ width: `${progressPercent}%` }}
																/>
															</div>
														</div>
														<span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
															{progressPercent}%
														</span>
													</div>
												</td>
												<td className="px-6 py-4">
													<span className="text-sm text-slate-600">
														{formatLastActivity(trainee.updatedAt || trainee.startedAt)}
													</span>
												</td>
												<td className="px-6 py-4 text-center">
													<button
														onClick={() => handleViewDetails(trainee)}
														className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all duration-200 font-medium text-sm hover:scale-105 active:scale-95"
													>
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
														</svg>
														View
													</button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
								<button
									onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
									disabled={currentPage === 1}
									className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-200"
								>
									Previous
								</button>
								<span className="text-sm text-slate-600">
									Page {currentPage} of {totalPages}
								</span>
								<button
									onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
									disabled={currentPage === totalPages}
									className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-200"
								>
									Next
								</button>
							</div>
						)}
					</>
				) : (
					<div className="flex flex-col items-center justify-center py-12 px-4">
						<div className="bg-slate-100 p-6 rounded-full mb-4">
							<svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
							</svg>
						</div>
						<p className="text-slate-700 font-medium">No trainees found</p>
						<p className="text-slate-500 text-sm">
							{searchTerm
								? "Try adjusting your search criteria"
								: "Create or assign trainees to get started"}
						</p>
					</div>
				)}
			</div>

			{/* Details Modal */}
			{showDetailsModal && selectedTrainee && (
				<TraineeDetailsModal
					trainee={selectedTrainee}
					isOpen={showDetailsModal}
					onClose={() => {
						setShowDetailsModal(false);
						setSelectedTrainee(null);
					}}
					onTraineeUpdated={(updated) => {
						setTrainees((prev) =>
							prev.map((t) => (t._id === updated._id ? updated : t))
						);
					}}
				/>
			)}
		</div>
	);
}
