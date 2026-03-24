import { useState, useEffect } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut, setPersistence, browserLocalPersistence, } from "firebase/auth";
import { auth, provider } from "../lib/firebase";

export type AuthState = "loading" | "signed-out" | "signed-in";

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthState>("loading");

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

  const signIn = async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      return await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err?.code === "auth/user-cancelled") return null;
      if (err?.code === "auth/popup-closed-by-user") return null;
      throw err;
    }
  };

  const logOut = () => signOut(auth);

  return { user, status, signIn, logOut };
}
