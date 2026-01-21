import Sidebar from "../../components/Sidebar";
import ChatPage from "../Chat/ChatPage";
import { Home, CheckSquare } from "lucide-react";

const traineeLinks = [
  {
    path: "/trainee/dashboard",
    label: "Dashboard",
    labelKey: "common.dashboard",
    icon: <Home className="w-5 h-5" />,
  },
  {
    path: "/trainee/tasks",
    label: "Training Tasks",
    labelKey: "hr.traineeTasks.title",
    icon: <CheckSquare className="w-5 h-5" />,
  },
];

const TraineeChat = () => {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      <Sidebar links={traineeLinks} />
      <main className="lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64 min-h-screen w-full flex flex-col overflow-x-auto animate-fadeIn">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <ChatPage />
        </div>
      </main>
    </div>
  );
};

export default TraineeChat;
