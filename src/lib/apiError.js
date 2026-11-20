/** Human-friendly API error helpers shared by pages. */

export const isDatabaseOffline = (error) =>
  error?.response?.status === 503 ||
  error?.response?.data?.code === 'DATABASE_OFFLINE' ||
  error?.response?.data?.service === 'database' ||
  error?.code === 'ERR_NETWORK' ||
  error?.message === 'Network Error';

export const isNetworkError = (error) =>
  error?.code === 'ERR_NETWORK' || error?.message === 'Network Error';

export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (isDatabaseOffline(error)) {
    return 'TweackTech is having network trouble right now. Your data is safe — please try again in a moment.';
  }
  if (isNetworkError(error)) {
    return 'You appear to be offline. Check your internet connection and try again.';
  }
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string' && message.trim()) return message;
  return fallback;
};

export const getErrorCode = (error) => error?.response?.data?.code || null;

export const notifyOffline = (error) => {
  if (!isDatabaseOffline(error)) return;
  window.dispatchEvent(
    new CustomEvent('tweack:offline', {
      detail: {
        code: error?.response?.data?.code || (isNetworkError(error) ? 'NETWORK' : 'SERVICE'),
        message: error?.response?.data?.message,
      },
    }),
  );
};
