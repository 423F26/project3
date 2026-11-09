// Home page: shows each level as completed, unlocked, or locked, and the
// grid of characters the player can equip, based on their saved progress.

import { watchProgress, isUnlocked, nextLevel, equipCharacter } from "./progress.js";
import { CHARACTERS, characterById, isCharacterUnlocked } from "./characters.js";

const markers = document.querySelectorAll(".level-marker");

function levelOf(marker) {
  return Number(marker.querySelector(".level-number").textContent.trim());
}

function render(completed) {
  const next = nextLevel(completed);

  markers.forEach(marker => {
    const level = levelOf(marker);
    const done = completed.includes(level);
    const unlocked = isUnlocked(level, completed);

    marker.classList.toggle("completed", done);
    marker.classList.toggle("locked", !unlocked);
    marker.classList.toggle("current", level === next && !done);

    if (unlocked) {
      marker.removeAttribute("aria-disabled");
      marker.removeAttribute("tabindex");
    } else {
      marker.setAttribute("aria-disabled", "true");
      marker.setAttribute("tabindex", "-1");
    }
  });
}

// Block clicks on locked levels.
markers.forEach(marker => {
  marker.addEventListener("click", event => {
    if (marker.classList.contains("locked")) {
      event.preventDefault();
      const level = levelOf(marker);
      alert(`Level ${level} is locked! Finish level ${level - 1} to unlock it.`);
    }
  });
});

// ---- Character grid ----

const grid = document.getElementById("character-grid");
const equippedMessage = document.getElementById("equipped-message");

function renderCharacters(completed, equippedId) {
  grid.replaceChildren();

  CHARACTERS.forEach(character => {
    const unlocked = isCharacterUnlocked(character, completed);
    const equipped = character.id === equippedId;

    const card = document.createElement("button");
    card.type = "button";
    card.className = "character-card";
    card.classList.toggle("locked", !unlocked);
    card.classList.toggle("equipped", equipped);
    card.setAttribute("role", "radio");
    card.setAttribute("aria-checked", String(equipped));

    const emoji = document.createElement("span");
    emoji.className = "card-emoji";
    emoji.textContent = unlocked ? character.emoji : "🔒";

    const label = document.createElement("span");
    label.className = "card-label";
    label.textContent = unlocked
      ? (equipped ? "Equipped" : character.name)
      : (character.level === 0 ? "" : `Level ${character.level}`);

    card.append(emoji, label);

    if (unlocked) {
      card.setAttribute("aria-label", `${character.name}${equipped ? " (equipped)" : ""}`);
      card.addEventListener("click", () => {
        if (equipped) return;
        renderCharacters(completed, character.id);
        equippedMessage.textContent = `${character.emoji} ${character.name} is ready to play!`;
        equipCharacter(character.id);
      });
    } else {
      card.disabled = true;
      card.setAttribute("aria-label", `Locked. Finish level ${character.level} to unlock.`);
      card.title = `Finish level ${character.level} to unlock`;
    }

    grid.appendChild(card);
  });

  const current = characterById(equippedId);
  if (!equippedMessage.textContent) {
    equippedMessage.textContent = `Playing as: ${current.emoji} ${current.name}`;
  }
}

// Start with only level 1 and the starter open until the saved progress loads.
render([]);
renderCharacters([], null);
equippedMessage.textContent = "";

watchProgress(({ completedLevels, equipped }) => {
  render(completedLevels);
  equippedMessage.textContent = "";
  renderCharacters(completedLevels, equipped);
});
