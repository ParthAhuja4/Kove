import { createContext } from "react";
import type { User } from "../types/index";
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
}
export const AuthContext = createContext<AuthContextType | null>(null);
