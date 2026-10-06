export const GENERIC_API_ERROR_MESSAGE = "Something went wrong. Please try again.";

// Fetch responses are not guaranteed to be JSON (proxies and misconfigured
// middleware may return HTML or plain text), so parsing must never throw into UI.
export const readJsonResponse = async (response) => {
  const body = await response.text();
  if (!body) return {};

  try {
    return JSON.parse(body);
  } catch {
    return { message: GENERIC_API_ERROR_MESSAGE };
  }
};
