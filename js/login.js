import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

let isSignUp = false;

const form = document.getElementById("auth-form");
const errorEl = document.getElementById("error");
const submitBtn = document.getElementById("submit-btn");
const toggleLink = document.getElementById("toggle-link");
const toggleText = document.getElementById("toggle-text");

// If already logged in, skip the login page
onAuthStateChanged(auth, user => {
  if (user) window.location.href = "index.html";
});

toggleLink.addEventListener("click", e => {
  e.preventDefault();
  isSignUp = !isSignUp;
  submitBtn.textContent = isSignUp ? "Sign Up" : "Log In";
  toggleText.textContent = isSignUp ? "Already have an account?" : "Don't have an account?";
  toggleLink.textContent = isSignUp ? "Log in" : "Sign up";
  errorEl.textContent = "";
});

form.addEventListener("submit", async e => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  errorEl.textContent = "";

  try {
    if (isSignUp) {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    // onAuthStateChanged above handles the redirect
  } catch (err) {
    errorEl.textContent = friendlyError(err.code);
  }
});

function friendlyError(code) {
  switch (code) {
    case "auth/invalid-email": return "That email doesn't look right.";
    case "auth/email-already-in-use": return "An account with that email already exists.";
    case "auth/weak-password": return "Password must be at least 6 characters.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found": return "Incorrect email or password.";
    case "auth/too-many-requests": return "Too many attempts. Try again later.";
    default: return "Something went wrong. Please try again.";
  }
}