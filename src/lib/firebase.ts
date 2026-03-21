/**
 * Firebase configuration
 *
 * 1. Go to https://console.firebase.google.com
 * 2. Create a project (or open an existing one)
 * 3. Add a Web app  →  copy the firebaseConfig object below
 * 4. In Authentication → Sign-in method → enable Google
 * 5. In Authentication → Settings → Authorized domains → add your domain
 */

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCR9XWxapuScSkBjWyr6DCPKirK4TPfL3Q",
  authDomain: "character-loom.firebaseapp.com",
  projectId: "character-loom",
  storageBucket: "character-loom.firebasestorage.app",
  messagingSenderId: "522383619354",
  appId: "1:522383619354:web:4f67dfb6757b6f889aa8a3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
