import { createContext } from 'react';
export const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {}
});

const login = (userData) => {
  setUser(userData);
  if (userData.token) {
    localStorage.setItem('authToken', userData.token);
  }
  setIsAuthenticated(true);
};