import { X } from "lucide-react";

export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-semibold">{title}</h4>
          <button type="button" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
