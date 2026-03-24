import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCR9XWxapuScSkBjWyr6DCPKirK4TPfL3Q",
  authDomain: "character-loom.com",
  projectId: "character-loom",
  storageBucket: "character-loom.firebasestorage.app",
  messagingSenderId: "522383619354",
  appId: "1:522383619354:web:4f67dfb6757b6f889aa8a3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
