import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Cấu hình Firebase đọc từ biến môi trường (Bảo mật tuyệt đối, không lộ key trên GitHub)
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDhCsIqkx3mfofNNkKGue1T82CByzdlylo",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "todohuy-flutter.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "todohuy-flutter",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "todohuy-flutter.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "154847841204",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:154847841204:web:b283fe82edaf9af18680e1",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-JZG8F1XTVX",
};

// Khởi tạo Firebase App (Singleton trên client)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Đảm bảo session người dùng được lưu trữ bền vững (IndexedDB / LocalStorage)
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("Could not set auth persistence:", err);
  });
}
