// Saves and loads each user's progress.
//
// Stored in Firestore at users/{uid} as:
//   { completedLevels: [1, 2, ...], equipped: "penguin" }
// so it follows the user to any device they log in from. A copy is also kept
// in localStorage so pages load instantly, and so a save is never lost if the
// page navigates away before the Firestore write finishes.
//
// Levels unlock linearly: level 1 is always open, and level N opens once
// level N - 1 has been completed.

import { auth, db } from "./firebase.js";
import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { doc, getDoc, setDoc, arrayUnion, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
import { STARTER, characterById, isCharacterUnlocked } from "./characters.js";

export const TOTAL_LEVELS = 15;

// Resolves with the signed-in user (or null) once Firebase has restored the session.
function getCurrentUser() {
  return new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      unsubscribe();
      resolve(user);
    });
  });
}

// ---- Local copy ----

function readCache(uid) {
  try {
    const data = JSON.parse(localStorage.getItem(`progress:${uid}`));
    return {
      completedLevels: Array.isArray(data?.completedLevels) ? data.completedLevels : [],
      equipped: typeof data?.equipped === "string" ? data.equipped : null,
    };
  } catch {
    return { completedLevels: [], equipped: null };
  }
}

function writeCache(uid, data) {
  try {
    localStorage.setItem(`progress:${uid}`, JSON.stringify(data));
    // Remembered without the uid so a level can draw the character instantly,
    // before Firebase has finished checking who is logged in.
    if (data.equipped) localStorage.setItem("lastEquipped", data.equipped);
  } catch {
    // Storage blocked (e.g. private mode). Firestore still has the data.
  }
}

function merge(a, b) {
  return [...new Set([...a, ...b])].sort((x, y) => x - y);
}

// ---- Reading ----

// If Firestore is slow or unreachable, stop waiting after this long and use
// the local copy. Without this, the Firebase library keeps retrying for ~30s.
const FIRESTORE_TIMEOUT_MS = 4000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Firestore didn't answer within ${ms / 1000}s`)), ms)),
  ]);
}

// Never use a character the player hasn't unlocked.
function cleanUp({ completedLevels, equipped }) {
  if (!isCharacterUnlocked(characterById(equipped), completedLevels)) {
    equipped = STARTER.id;
  }
  return { completedLevels, equipped: characterById(equipped).id };
}

const SIGNED_OUT = { completedLevels: [], equipped: STARTER.id };

// Returns { completedLevels: number[], equipped: characterId } for the current
// user, checking Firestore first.
export async function getProgress() {
  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  return loadFromFirestore(user, readCache(user.uid));
}

// Calls `callback` right away with the local copy, then again with the
// Firestore copy if it turns out to be different. Use this for anything the
// player sees, so the page never sits waiting on the network.
export async function watchProgress(callback) {
  const user = await getCurrentUser();
  if (!user) {
    callback(SIGNED_OUT);
    return;
  }

  const cached = readCache(user.uid);
  const local = cleanUp(cached);
  callback(local);

  const fresh = await loadFromFirestore(user, cached);
  if (JSON.stringify(fresh) !== JSON.stringify(local)) callback(fresh);
}

async function loadFromFirestore(user, cached) {
  let completedLevels = cached.completedLevels;
  let equipped = cached.equipped;

  try {
    const snap = await withTimeout(getDoc(doc(db, "users", user.uid)), FIRESTORE_TIMEOUT_MS);
    const remote = snap.exists() ? snap.data() : {};
    const remoteLevels = remote.completedLevels || [];

    completedLevels = merge(cached.completedLevels, remoteLevels);
    equipped = remote.equipped || cached.equipped;

    // If the local copy had something Firestore didn't (e.g. a write was cut off), sync it up.
    const needsSync =
      completedLevels.length > remoteLevels.length ||
      (equipped && equipped !== remote.equipped);
    if (needsSync) {
      setDoc(doc(db, "users", user.uid),
        { completedLevels: arrayUnion(...completedLevels), equipped, updatedAt: serverTimestamp() },
        { merge: true }).catch(err => console.error("Progress sync failed:", err));
    }
  } catch (err) {
    console.error("Could not load progress from Firestore, using local copy:", err);
  }

  const result = cleanUp({ completedLevels, equipped });
  writeCache(user.uid, result);
  return result;
}

export async function getCompletedLevels() {
  return (await getProgress()).completedLevels;
}

// ---- Saving ----

async function save(changes, firestoreChanges) {
  const user = await getCurrentUser();
  if (!user) return;

  writeCache(user.uid, { ...readCache(user.uid), ...changes(readCache(user.uid)) });
  try {
    await setDoc(doc(db, "users", user.uid),
      { ...firestoreChanges, updatedAt: serverTimestamp() },
      { merge: true });
  } catch (err) {
    console.error("Could not save progress to Firestore:", err);
  }
}

// Marks a level as completed for the current user.
export function completeLevel(level) {
  return save(
    cache => ({ completedLevels: merge(cache.completedLevels, [level]) }),
    { completedLevels: arrayUnion(level) },
  );
}

// Changes which character the player uses in the levels.
export function equipCharacter(characterId) {
  return save(() => ({ equipped: characterId }), { equipped: characterId });
}

// ---- Level rules ----

export function isUnlocked(level, completedLevels) {
  return level === 1 || completedLevels.includes(level - 1);
}

// The level the user should play next: the first level they haven't finished.
export function nextLevel(completedLevels) {
  for (let level = 1; level <= TOTAL_LEVELS; level++) {
    if (!completedLevels.includes(level)) return level;
  }
  return TOTAL_LEVELS;
}
