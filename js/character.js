// Puts the player's equipped character into any level.
//
// In a level's HTML:
//   <div id="actor" data-character="60"></div>   -> the equipped character, 60px tall
//   <div data-reward-for="7"></div>              -> the character level 7 unlocks
//
// Elements created later by a level's own script work too, as long as they
// have the data-character attribute (see level 4's maze).

import { watchProgress } from "./progress.js";
import { characterById, characterForLevel } from "./characters.js";

function drawCharacter(character) {
  document.querySelectorAll("[data-character]").forEach(el => {
    const size = Number(el.dataset.character) || 60;

    let emoji = el.querySelector(".character-emoji");
    if (!emoji) {
      emoji = document.createElement("span");
      emoji.className = "character-emoji";
      el.replaceChildren(emoji);
    }

    emoji.textContent = character.emoji;
    emoji.style.fontSize = `${Math.round(size * 0.85)}px`;
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", character.name);
  });
}

function drawRewards() {
  document.querySelectorAll("[data-reward-for]").forEach(el => {
    const character = characterForLevel(Number(el.dataset.rewardFor));
    if (!character) return;

    el.innerHTML = "";
    const emoji = document.createElement("span");
    emoji.textContent = character.emoji;
    const name = document.createElement("p");
    name.className = "reward-name";
    name.textContent = `${character.name} unlocked! Equip it on the home page.`;
    el.append(emoji, name);
  });
}

// Draw right away with the last character we know about, then correct it
// once the saved progress has loaded.
let last = null;
try { last = localStorage.getItem("lastEquipped"); } catch {}
drawCharacter(characterById(last));
drawRewards();

watchProgress(({ equipped }) => drawCharacter(characterById(equipped)));
