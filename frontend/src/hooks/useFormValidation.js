import { useEffect, useRef, useState } from "react";
import { API_URL } from "../config";

const getError = (rule, value, values) => {
  const result = rule(value, values);
  return result?.valid ? "" : result?.message || "Invalid value.";
};

export const useFormValidation = (values, rules) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [fieldMessages, setFieldMessages] = useState({});
  const previousEmailValues = useRef({});
  const requestIds = useRef({});

  useEffect(() => {
    const changedEmailFields = Object.keys(rules).filter((field) => {
      if (!field.toLowerCase().includes("email")) return false;
      const changed = previousEmailValues.current[field] !== values[field];
      previousEmailValues.current[field] = values[field];
      return changed;
    });

    if (changedEmailFields.length > 0) {
      setFieldMessages((current) => {
        const next = { ...current };
        changedEmailFields.forEach((field) => { delete next[field]; });
        return next;
      });
    }
  }, [rules, values]);

  const checkEmailDomain = async (field, value, error) => {
    if (error || !field.toLowerCase().includes("email")) return;

    const domain = String(value).trim().toLowerCase().split("@")[1];
    if (!domain) return;

    const requestId = (requestIds.current[field] || 0) + 1;
    requestIds.current[field] = requestId;
    setFieldMessages((current) => ({ ...current, [field]: "Checking email..." }));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    try {
      const response = await fetch(`${API_URL}/utils/check-email-domain?domain=${encodeURIComponent(domain)}`, {
        signal: controller.signal,
      });
      if (!response.ok) return;
      const result = await response.json();
      if (requestIds.current[field] !== requestId) return;

      setFieldMessages((current) => ({
        ...current,
        [field]: result.reason === "no_mx_records"
          ? "This email domain doesn't appear to accept mail - please check for typos."
          : "",
      }));
    } catch {
      // DNS checks are advisory; network and timeout failures are ignored.
    } finally {
      clearTimeout(timeout);
      if (requestIds.current[field] === requestId) {
        setFieldMessages((current) => {
          if (current[field] === "Checking email...") {
            const next = { ...current };
            delete next[field];
            return next;
          }
          return current;
        });
      }
    }
  };

  useEffect(() => {
    setErrors((current) => {
      const next = { ...current };
      let changed = false;
      Object.entries(rules).forEach(([field, rule]) => {
        if (!touched[field]) return;
        const error = getError(rule, values[field], values);
        if (next[field] !== error) {
          next[field] = error;
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [rules, touched, values]);

  const validateField = (field) => {
    const rule = rules[field];
    const error = rule ? getError(rule, values[field], values) : "";
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors((current) => ({ ...current, [field]: error }));
    void checkEmailDomain(field, values[field], error);
    return !error;
  };

  const validateAll = () => {
    const nextErrors = {};
    Object.entries(rules).forEach(([field, rule]) => {
      nextErrors[field] = getError(rule, values[field], values);
    });
    setTouched(Object.keys(rules).reduce((all, field) => ({ ...all, [field]: true }), {}));
    setErrors(nextErrors);
    return Object.values(nextErrors).every((error) => !error);
  };

  const isValid = Object.entries(rules).every(
    ([field, rule]) => !getError(rule, values[field], values)
  );

  return {
    errors,
    touched,
    isValid,
    validateField,
    validateAll,
    handleBlur: validateField,
    fieldMessages,
  };
};

export default useFormValidation;
