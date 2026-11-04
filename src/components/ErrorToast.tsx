import { useEffect } from "react";
import { CloseIcon } from "./Icons";

const AUTO_HIDE_MS = 5000;

export function ErrorToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div className="toast" role="alert">
      <span>{message}</span>
      <button type="button" className="icon-btn" aria-label="Dismiss" onClick={onClose}>
        <CloseIcon />
      </button>
    </div>
  );
}
