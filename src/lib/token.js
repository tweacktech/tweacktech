/** Shared token access so every consumer honours "Remember me" correctly. */
export const TOKEN_KEY = 'tweacktech-token';
export const REFRESH_KEY = 'tweacktech-refresh-token';
export const PROFILE_KEY = 'tweacktech-profile';

export const getTokenStore = () => {
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(TOKEN_KEY)) {
    return sessionStorage;
  }
  return typeof localStorage !== 'undefined' ? localStorage : null;
};

export const readToken = () => getTokenStore()?.getItem(TOKEN_KEY) || null;
