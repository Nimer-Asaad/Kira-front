import PlannerBlockCard from "./PlannerBlockCard";

const PlannerTimeline = ({ blocks, onEdit, onDelete, onUpdateStatus }) => {
  if (blocks.length === 0) {
    return (
      <div className="card-premium p-8 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No blocks yet</h3>
        <p className="mt-2 text-sm text-gray-500">Add your first time block to start planning your day</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <PlannerBlockCard
          key={block.id}
          block={block}
          onEdit={() => onEdit(block)}
          onDelete={() => onDelete(block.id)}
          onUpdateStatus={(status) => onUpdateStatus(block.id, status)}
        />
      ))}
    </div>
  );
};

export default PlannerTimeline;

