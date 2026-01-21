import Sidebar from "../../components/Sidebar";
import ChatPage from "../Chat/ChatPage";

const adminLinks = [
  {
    path: "/admin/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    path: "/admin/tasks",
    label: "Manage Tasks",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
];

const AdminChat = () => {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      <Sidebar links={adminLinks} />
      <main className="lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64 min-h-screen w-full flex flex-col overflow-x-auto animate-fadeIn">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <ChatPage />
        </div>
      </main>
    </div>
  );
};

export default AdminChat;
