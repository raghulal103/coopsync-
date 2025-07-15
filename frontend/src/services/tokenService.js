import jwtDecode from 'jwt-decode';

const TOKEN_KEY = 'cooperative_erp_token';
const REFRESH_TOKEN_KEY = 'cooperative_erp_refresh_token';

export const tokenService = {
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  getRefreshToken: () => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken: (refreshToken) => {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  isTokenExpired: (token) => {
    if (!token) return true;
    
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  },

  getTokenData: (token) => {
    if (!token) return null;
    
    try {
      return jwtDecode(token);
    } catch (error) {
      return null;
    }
  },

  getUserFromToken: (token) => {
    const tokenData = tokenService.getTokenData(token);
    if (!tokenData) return null;
    
    return {
      id: tokenData.id,
      email: tokenData.email,
      role: tokenData.role,
      tenantId: tokenData.tenantId,
      permissions: tokenData.permissions || []
    };
  },

  isValidToken: (token) => {
    return token && !tokenService.isTokenExpired(token);
  }
};