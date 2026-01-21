import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import PlannerTimeline from "../../components/personal/planner/PlannerTimeline";
import PlannerSummary from "../../components/personal/planner/PlannerSummary";
import PlannerBlockModal from "../../components/personal/planner/PlannerBlockModal";
import toast from "react-hot-toast";

const PersonalPlanner = () => {
  const { t, i18n } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // YYYY-MM-DD
  });
  const [dayPlan, setDayPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(""); // "saved" | "saving" | ""
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [tasks, setTasks] = useState([]);

  // Debounce save function
  const debouncedSave = useCallback(
    (() => {
      let timeoutId;
      return (blocks) => {
        clearTimeout(timeoutId);
        setSaving(true);
        setSaveStatus("saving"); // Logic string, not displayed directly
        timeoutId = setTimeout(async () => {
          try {
            await axiosInstance.put(API_PATHS.PERSONAL_PLANNER(selectedDate), {
              blocks,
            });
            setSaveStatus(t('personal.planner.saved'));
            setTimeout(() => setSaveStatus(""), 2000);
          } catch (error) {
            console.error("Error saving day plan:", error);
            toast.error(error.response?.data?.message || t('personal.planner.failedSavePlan'));
            setSaveStatus("");
          } finally {
            setSaving(false);
          }
        }, 500);
      };
    })(),
    [selectedDate]
  );

  // Fetch day plan
  const fetchDayPlan = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.PERSONAL_PLANNER(selectedDate));
      setDayPlan(response.data);
    } catch (error) {
      console.error("Error fetching day plan:", error);
      toast.error(error.response?.data?.message || t('personal.planner.failedLoadPlan'));
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Fetch tasks for linking
  const fetchTasks = useCallback(async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.PERSONAL_TASKS);
      setTasks(response.data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, []);

  useEffect(() => {
    fetchDayPlan();
    fetchTasks();
  }, [fetchDayPlan, fetchTasks]);

  // Handle date change
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  // Navigate to previous/next day
  const navigateDate = (direction) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + direction);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  // Format date for display
  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Handle block operations
  const handleAddBlock = () => {
    setEditingBlock(null);
    setIsBlockModalOpen(true);
  };

  const handleEditBlock = (block) => {
    setEditingBlock(block);
    setIsBlockModalOpen(true);
  };

  const handleSaveBlock = async (blockData) => {
    const blocks = dayPlan?.blocks || [];
    let updatedBlocks;

    if (editingBlock) {
      // Update existing block
      updatedBlocks = blocks.map((b) => (b.id === editingBlock.id ? blockData : b));
    } else {
      // Add new block
      updatedBlocks = [...blocks, blockData];
    }

    // Sort by start time
    updatedBlocks.sort((a, b) => {
      const [aHour, aMin] = a.start.split(":").map(Number);
      const [bHour, bMin] = b.start.split(":").map(Number);
      return aHour * 60 + aMin - (bHour * 60 + bMin);
    });

    setDayPlan({ ...dayPlan, blocks: updatedBlocks });
    debouncedSave(updatedBlocks);
    setIsBlockModalOpen(false);
    setEditingBlock(null);
  };

  const handleDeleteBlock = async (blockId) => {
    if (!window.confirm(t('personal.planner.confirmDeleteBlock'))) {
      return;
    }

    const updatedBlocks = dayPlan.blocks.filter((b) => b.id !== blockId);
    setDayPlan({ ...dayPlan, blocks: updatedBlocks });

    try {
      await axiosInstance.put(API_PATHS.PERSONAL_PLANNER(selectedDate), {
        blocks: updatedBlocks,
      });
      toast.success(t('personal.planner.blockDeleted'));
    } catch (error) {
      console.error("Error deleting block:", error);
      toast.error(t('personal.planner.failedDeleteBlock'));
      // Revert on error
      setDayPlan({ ...dayPlan, blocks: dayPlan.blocks });
    }
  };

  const handleUpdateBlockStatus = async (blockId, status) => {
    const updatedBlocks = dayPlan.blocks.map((b) =>
      b.id === blockId ? { ...b, status } : b
    );
    setDayPlan({ ...dayPlan, blocks: updatedBlocks });
    debouncedSave(updatedBlocks);
  };

  const blocks = dayPlan?.blocks || [];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slideUp">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-indigo-600 mb-2">
            {t('personal.planner.title')}
          </h1>
          <p className="text-sm text-slate-600 font-medium">{t('personal.planner.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus && (
            <span className="text-sm text-slate-500">
              {saveStatus === "saving" ? t('personal.planner.saving') : t('personal.planner.saved') + " ✓"}
            </span>
          )}
          <button
            onClick={handleAddBlock}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:bg-indigo-700 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('personal.planner.addBlock')}
          </button>
        </div>
      </div>

      {/* Date Picker */}
      <div className="flex items-center gap-4 animate-fadeIn" style={{ animationDelay: "100ms" }}>
        <button
          onClick={() => navigateDate(-1)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-slate-900"
        />
        <button
          onClick={() => navigateDate(1)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <span className="text-lg font-medium text-slate-700">
          {formatDisplayDate(selectedDate)}
        </span>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" style={{ animationDelay: "200ms" }}>
          {/* Left Panel: Timeline */}
          <div className="lg:col-span-2">
            <PlannerTimeline
              blocks={blocks}
              onEdit={handleEditBlock}
              onDelete={handleDeleteBlock}
              onUpdateStatus={handleUpdateBlockStatus}
            />
          </div>

          {/* Right Panel: Summary */}
          <div className="lg:col-span-1">
            <PlannerSummary blocks={blocks} tasks={tasks} />
          </div>
        </div>
      )}

      {/* Block Modal */}
      {isBlockModalOpen && (
        <PlannerBlockModal
          isOpen={isBlockModalOpen}
          onClose={() => {
            setIsBlockModalOpen(false);
            setEditingBlock(null);
          }}
          onSave={handleSaveBlock}
          block={editingBlock}
          tasks={tasks}
          existingBlocks={blocks.filter((b) => !editingBlock || b.id !== editingBlock.id)}
        />
      )}
    </>
  );
};

export default PersonalPlanner;
