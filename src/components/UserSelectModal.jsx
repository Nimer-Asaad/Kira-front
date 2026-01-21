const UserSelectModal = ({ isOpen, users = [], selectedIds = [], onToggle, onClose, onConfirm, title = "Select Users" }) => {
  if (!isOpen) return null;

  const handleToggle = (id) => {
    if (onToggle) onToggle(id);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>

        <div className="overflow-y-auto max-h-[55vh] divide-y divide-gray-100">
          {users.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">No users available</div>
          ) : (
            users.map((user) => {
              const checked = selectedIds.includes(user._id);
              return (
                <label
                  key={user._id}
                  className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleToggle(user._id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                      {(user.fullName || user.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.fullName || user.name}</p>
                      <p className="text-xs text-gray-500">{user.email || user.username}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggle(user._id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSelectModal;
