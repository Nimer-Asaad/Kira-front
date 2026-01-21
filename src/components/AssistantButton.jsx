import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AssistantModal from "./AssistantModal";

const AssistantButton = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <>
      <button
        className="fixed z-50 bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center focus:outline-none"
        title="Kira Assistant"
        onClick={() => setOpen(true)}
        style={{ boxShadow: "0 4px 24px 0 rgba(79,140,255,0.15)" }}
      >
        <span className="text-2xl">🤖</span>
      </button>
      {open && <AssistantModal open={open} onClose={() => setOpen(false)} />}
    </>
  );
};

export default AssistantButton;
