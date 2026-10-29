import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCH_u77jbkJvwU30SrdslXNu63BB0bhbnU",
  authDomain: "elementary-coding-game.firebaseapp.com",
  projectId: "elementary-coding-game",
  storageBucket: "elementary-coding-game.firebasestorage.app",
  messagingSenderId: "960539312778",
  appId: "1:960539312778:web:d880ad0c94f881cff5e373",
  measurementId: "G-QP6LB9L0G6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);