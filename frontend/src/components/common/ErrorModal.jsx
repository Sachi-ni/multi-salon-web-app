import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

const ErrorModal = ({
  isOpen,
  onClose,
  title = "Notice",
  message = "",
  type = "warning", // 'warning' | 'error' | 'success' | 'info'
  confirmText = "OK",
  onConfirm,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" || e.key === "Enter") {
        if (onConfirm) onConfirm();
        else onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, onConfirm]);

  const handleAction = () => {
    if (onConfirm) onConfirm();
    else onClose();
  };

  const isSuccess = type === "success";
  const isError = type === "error";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
          {/* Dark Blurred Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleAction}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative z-10 w-full max-w-[420px] bg-surface border border-border rounded-2xl p-6 sm:p-7 shadow-modal overflow-hidden text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent Gradient Bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-[3px] ${
                isSuccess
                  ? "bg-gradient-to-r from-success to-emerald-400"
                  : isError
                  ? "bg-gradient-to-r from-danger to-rose-400"
                  : "bg-gradient-to-r from-accent to-accent-hover"
              }`}
            />

            {/* Close (X) button */}
            <button
              type="button"
              onClick={handleAction}
              className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-muted-2 hover:text-white hover:border-border-hover transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Icon badge */}
            <div className="flex justify-center mb-4 pt-1">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${
                  isSuccess
                    ? "bg-success-dim border-success-border text-success shadow-success/10"
                    : isError
                    ? "bg-danger-dim border-danger-border text-danger shadow-danger/10"
                    : "bg-accent-dim border-accent/30 text-accent shadow-accent/15"
                }`}
              >
                {isSuccess ? (
                  <CheckCircle2 className="w-7 h-7" />
                ) : isError ? (
                  <AlertTriangle className="w-7 h-7" />
                ) : (
                  <AlertTriangle className="w-7 h-7" />
                )}
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-black text-white tracking-tight mb-2">
              {title}
            </h3>

            {/* Message Body */}
            <div className="text-muted-2 text-sm leading-relaxed mb-6 font-medium break-words px-2 max-h-[40vh] overflow-y-auto">
              {message}
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={handleAction}
              className="w-full bg-accent text-primary font-black py-3 px-6 rounded-xl text-xs tracking-wider uppercase transition-all duration-200 hover:bg-accent-hover hover:shadow-glow hover:-translate-y-px active:translate-y-0 cursor-pointer"
            >
              {confirmText}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ErrorModal;
