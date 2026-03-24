import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithRedirect,
  signOut,
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
} from "firebase/auth";
import { auth, provider } from "../../lib/firebase";
import { AuthService } from "../../lib/types";
import { AuthContext } from "../../hooks/useAuth";
import { useOfficialSite } from "../../hooks/useOfficialSite";

export type AuthState = "loading" | "signed-out" | "signed-in";

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthState>("loading");
  const { isLocal } = useOfficialSite();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        });
        setStatus("signed-in");
      } else {
        setUser(null);
        setStatus("signed-out");
      }
    });

    return unsub;
  }, []);

  const signIn = useCallback(async () => {
    await setPersistence(auth, browserLocalPersistence);
    if (isLocal) {
      await signInWithPopup(auth, provider);
    }
    else {
      await signInWithRedirect(auth, provider);
    }
  }, [isLocal]);

  const logOut = async () => {
    await signOut(auth);
  };

  const value = useMemo<AuthService>(
    () => ({ user, status, signIn, logOut }),
    [user, status, signIn]
  );

  return <AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>;
}