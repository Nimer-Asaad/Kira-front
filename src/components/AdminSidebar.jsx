import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // عدّل المسار إذا لازم

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const name = user?.fullName || user?.name || "Admin";
  const email = user?.email || "";

  const links = [
    { label: "Dashboard", path: "/admin/dashboard", icon: "🏠" },
    { label: "Manage Tasks", path: "/admin/tasks", icon: "✅" },
    { label: "Create Task", path: "/admin/create-task", icon: "➕" },
    { label: "Team Members", path: "/admin/users", icon: "👥" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-[280px] min-h-screen flex flex-col bg-gradient-to-b from-[#1f2a37] via-[#16202c] to-[#0f172a] text-white">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="text-3xl font-extrabold text-[#4f8cff]">Kira</div>
        <div className="text-sm text-white/60 mt-1">Task Manager</div>
      </div>

      {/* Profile */}
      <div className="px-6 py-5 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors rounded-lg mx-3 my-2 bg-blue-500/10" onClick={() => navigate("/profile")} title="View profile">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#2d7dff] flex items-center justify-center font-bold">
            {(name?.[0] || "A").toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-semibold truncate">{name}</div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-200 border border-blue-400/20">
                Admin
              </span>
            </div>
            <div className="text-sm text-white/60 truncate">{email}</div>
          </div>
        </div>
      </div>

      {/* Links */}
      <nav className="flex-1 px-6 py-6 space-y-5">
        {links.map((l) => {
          const active = location.pathname === l.path;
          return (
            <Link
              key={l.path}
              to={l.path}
              className={[
                "flex items-center gap-4 text-base font-semibold transition-all",
                active
                  ? "bg-[#2d7dff] px-5 py-3 rounded-xl shadow-[0_0_30px_rgba(45,125,255,0.6)]"
                  : "text-white/80 hover:text-white",
              ].join(" ")}
            >
              <span className="w-6 flex justify-center">{l.icon}</span>
              <span>{l.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-6 py-6 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="
            flex items-center gap-4
            text-base font-semibold
            text-white/80
            hover:text-white
            transition-all
      "
        >
          <span className="w-6 flex justify-center">⎋</span>
          <span className="text-base font-semibold">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
