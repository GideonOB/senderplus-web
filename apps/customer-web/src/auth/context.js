import { createContext } from "react";

export const AuthContext = createContext({
  token: null,
  profile: null,
  isAuthenticated: false,
  signup: async () => {},
  signin: async () => {},
  sendCode: async () => {},
  verifyCode: async () => {},
  changePassword: async () => {},
  logout: () => {},
  refreshProfile: async () => {},
});

