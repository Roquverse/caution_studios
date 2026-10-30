const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser
  ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  : process.env.NODE_ENV === 'development';

export const AUTH_URL =
  process.env.NEXT_PUBLIC_AUTH_URL ||
  (isLocalhost ? 'http://localhost:3001' : 'https://auth.cautionstudioz.com');

export const APP_URL =
  process.env.NEXT_PUBLIC_USER_URL ||
  (isLocalhost ? 'http://localhost:3002' : 'https://app.cautionstudioz.com');

export const ADMIN_URL =
  process.env.NEXT_PUBLIC_ADMIN_URL ||
  (isLocalhost ? 'http://localhost:3003' : 'https://admin.cautionstudioz.com');

export const CREATOR_URL =
  process.env.NEXT_PUBLIC_CREATOR_URL ||
  (isLocalhost ? 'http://localhost:3004' : 'https://creator.cautionstudioz.com');

export const WEB_URL =
  process.env.NEXT_PUBLIC_WEB_URL ||
  (isLocalhost ? 'http://localhost:3000' : 'https://cautionstudioz.com');

export const AUTH_LOGIN_URL = `${AUTH_URL}/login`;
export const AUTH_SIGNUP_URL = `${AUTH_URL}/register`;
export const CREATOR_LOGIN_URL = `${CREATOR_URL}/login`;


