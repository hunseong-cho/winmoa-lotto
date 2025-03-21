// /firebase/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyABPR87Z0qLS8KnC3pUhvh5fw9a6C4VLWbk",
  authDomain: "winmoa-lotto.firebaseapp.com",
  projectId: "winmoa-lotto",
  storageBucket: "winmoa-lotto.appspot.com",
  messagingSenderId: "779937041550",
  appId: "1:779937041550:web:8fbafec1d4ee3f87fadf",
  measurementId: "G-NSWGKHB6VC"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
