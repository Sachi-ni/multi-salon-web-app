import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import ErrorModal from "../components/common/ErrorModal";

const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: "Notice",
    message: "",
    type: "warning",
    confirmText: "OK",
  });

  const resolverRef = useRef(null);

  const hideAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current();
      resolverRef.current = null;
    }
  }, []);

  const showAlert = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;

      const text = typeof message === "string" ? message : String(message || "");
      const isSuccess = options.type === "success" || /success|confirmed|saved|updated/i.test(text);
      const isError = options.type === "error" || /fail|error|invalid|denied|blocked/i.test(text);

      const resolvedType = options.type || (isSuccess ? "success" : isError ? "error" : "warning");
      const defaultTitle = isSuccess ? "Success" : isError ? "Alert" : "Notice";

      setAlertState({
        isOpen: true,
        title: options.title || defaultTitle,
        message: text,
        type: resolvedType,
        confirmText: options.confirmText || "OK",
        onConfirm: () => {
          if (options.onConfirm) options.onConfirm();
          hideAlert();
        },
      });
    });
  }, [hideAlert]);

  // Intercept window.alert so all browser alerts throughout the application use the custom ErrorModal
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg) => {
      showAlert(msg);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [showAlert]);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <ErrorModal
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
        onConfirm={alertState.onConfirm || hideAlert}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    return {
      showAlert: (msg) => console.warn("AlertProvider missing:", msg),
      hideAlert: () => {},
    };
  }
  return context;
};

export default AlertContext;
