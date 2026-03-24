import { createContext, useContext } from "react";
import { AuthService } from "../lib/types";


export const AuthContext = createContext<AuthService | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}