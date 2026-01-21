import { Outlet } from "react-router-dom";
import PersonalSidebar from "./PersonalSidebar";

const PersonalLayout = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <PersonalSidebar />
      <main className="lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64 min-h-screen w-full overflow-x-auto animate-fadeIn">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default PersonalLayout;


