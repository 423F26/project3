// Every character in the game. The starter (level 0) is unlocked from the
// start; each other one unlocks when the player finishes that level.
// To swap an emoji for a picture later, this is the one place to change.

export const CHARACTERS = [
  { id: "chick", emoji: "🐥", name: "Chick", level: 0 },
  { id: "monkey", emoji: "🐒", name: "Monkey", level: 1 },
  { id: "penguin", emoji: "🐧", name: "Penguin", level: 2 },
  { id: "koala", emoji: "🐨", name: "Koala", level: 3 },
  { id: "panda", emoji: "🐼", name: "Panda", level: 4 },
  { id: "lion", emoji: "🦁", name: "Lion", level: 5 },
  { id: "tiger", emoji: "🐯", name: "Tiger", level: 6 },
  { id: "giraffe", emoji: "🦒", name: "Giraffe", level: 7 },
  { id: "kangaroo", emoji: "🦘", name: "Kangaroo", level: 8 },
  { id: "elephant", emoji: "🐘", name: "Elephant", level: 9 },
  { id: "hippo", emoji: "🦛", name: "Hippo", level: 10 },
  { id: "zebra", emoji: "🦓", name: "Zebra", level: 11 },
  { id: "owl", emoji: "🦉", name: "Owl", level: 12 },
  { id: "crocodile", emoji: "🐊", name: "Crocodile", level: 13 },
  { id: "parrot", emoji: "🦜", name: "Parrot", level: 14 },
  { id: "dolphin", emoji: "🐬", name: "Dolphin", level: 15 },
];

export const STARTER = CHARACTERS[0];

export function characterById(id) {
  return CHARACTERS.find(c => c.id === id) || STARTER;
}

export function characterForLevel(level) {
  return CHARACTERS.find(c => c.level === level);
}

export function isCharacterUnlocked(character, completedLevels) {
  return character.level === 0 || completedLevels.includes(character.level);
}
