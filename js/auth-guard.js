import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getCompletedLevels, isUnlocked } from "./progress.js";

// If this page is a level (level7.html, /level7, ...), figure out which one.
const levelMatch = window.location.pathname.match(/level(\d+)(?:\.html)?$/);
const currentLevel = levelMatch ? Number(levelMatch[1]) : null;

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  const userEl = document.getElementById("user-email");
  if (userEl) userEl.textContent = user.email;

  // Keep players from skipping ahead by typing a level's URL directly.
  if (currentLevel !== null) {
    const completed = await getCompletedLevels();
    if (!isUnlocked(currentLevel, completed)) {
      alert(`Level ${currentLevel} is locked! Finish level ${currentLevel - 1} first.`);
      window.location.href = "index.html";
    }
  }
});

const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => signOut(auth));
}
