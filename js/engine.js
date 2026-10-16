const MAX_HP = 6;
const RUNE_SOLUTION = ["hank", "sheila", "presto", "bobby"];
const CRYSTAL_SONG = [0, 2, 1, 3];

const state = {
  leaderId: null,
  hp: MAX_HP,
  skillUsed: false,
  shieldArmed: false,
  runeOrder: [],
  rings: [0, 0, 0],
  crystalHeard: [],
  puzzle: null,
};

const $ = (id) => document.getElementById(id);

function leader() {
  return HEROES.find((h) => h.id === state.leaderId);
}

function setScene(name) {
  $("scene").className = `scene scene-${name}`;
}

function setHp() {
  $("hp-fill").style.width = `${(state.hp / MAX_HP) * 100}%`;
}

function hurt(n = 1) {
  if (state.shieldArmed) {
    state.shieldArmed = false;
    return " Eric’s wall drinks the blow. The party does not stagger.";
  }
  state.hp = Math.max(0, state.hp - n);
  setHp();
  return "";
}

function renderParty() {
  $("party-strip").innerHTML = HEROES.map((h) => {
    const cls = h.id === state.leaderId ? "mini-hero leader" : "mini-hero";
    return `<div class="${cls}" title="${h.name} the ${h.cls}">${portraitSvg(h, 46)}</div>`;
  }).join("");
}

function syncSkillChip() {
  const chip = $("skill-chip");
  const L = leader();
  if (!L) {
    chip.hidden = true;
    return;
  }
  chip.hidden = !state.puzzle;
  chip.disabled = state.skillUsed || !state.puzzle;
  chip.textContent = state.skillUsed
    ? `${SKILL_LABEL[L.skill]} spent`
    : `Use ${SKILL_LABEL[L.skill]}`;
}

function showDialogue({ speaker, role, text, choices = [], puzzle = null, scene, phase }) {
  $("title-screen").hidden = true;
  $("select-screen").hidden = true;
  $("dialogue").hidden = false;
  $("hud").hidden = false;
  $("portrait-stage").hidden = false;
  if (scene) setScene(scene);
  if (phase) $("phase-label").textContent = phase;
  $("speaker-name").textContent = speaker || "";
  $("speaker-role").textContent = role || "";
  $("dialogue-text").textContent = text;

  const hero = HEROES.find((h) => h.name === speaker);
  if (hero) $("speaker-art").innerHTML = portraitSvg(hero, 180);
  else if (speaker === "Venger") $("speaker-art").innerHTML = vengerPortrait();
  else $("speaker-art").innerHTML = dmPortrait();

  const box = $("choices");
  box.innerHTML = "";
  choices.forEach((c) => {
    const b = document.createElement("button");
    b.className = "choice";
    b.textContent = c.label;
    b.addEventListener("click", c.onClick);
    box.appendChild(b);
  });

  $("puzzle-mount").innerHTML = "";
  state.puzzle = puzzle;
  if (puzzle) puzzle();
  syncSkillChip();
}

function startSelect() {
  setScene("meadow");
  $("title-screen").hidden = true;
  $("select-screen").hidden = false;
  $("dialogue").hidden = true;
  $("hud").hidden = true;
  $("portrait-stage").hidden = true;
  $("character-grid").innerHTML = HEROES.map(
    (h) => `
      <button type="button" class="hero-card" data-id="${h.id}">
        <div class="art-frame">${portraitSvg(h)}</div>
        <div>
          <div class="class-name">${h.cls} · ${SKILL_LABEL[h.skill]}</div>
          <h3>${h.name}</h3>
          <p>${h.blurb}</p>
        </div>
      </button>`
  ).join("");
  $("character-grid").querySelectorAll(".hero-card").forEach((card) => {
    card.addEventListener("click", () => {
      state.leaderId = card.dataset.id;
      state.hp = MAX_HP;
      state.skillUsed = false;
      state.shieldArmed = false;
      renderParty();
      setHp();
      intro();
    });
  });
}

function intro() {
  const L = leader();
  showDialogue({
    scene: "woods",
    phase: "I — The Calling",
    speaker: "Dungeon Master",
    role: "Guide of the Realm",
    text: `The roller coaster became a river of light, and the Realm caught you like a page catching ink. ${L.name} the ${L.cls} stands at the front. ${leaderBonusLine(L)}\n\nUni nuzzles Bobby’s sleeve. Somewhere beyond the Whispering Woods, a citadel drinks the sunset.`,
    choices: [
      { label: "Ask the way home", onClick: woodsAsk },
      { label: "Scout the tree-line", onClick: woodsScout },
    ],
  });
}

function woodsAsk() {
  showDialogue({
    speaker: "Dungeon Master",
    role: "Guide of the Realm",
    text: "Home is a door with three locks, young ones. First: remember who you are, together. The standing stones still sing the Circle of Six. Fail the song, and the woods will take a sip of your courage.",
    choices: [{ label: "Hear the song", onClick: stones }],
  });
}

function woodsScout() {
  const L = leader();
  showDialogue({
    speaker: L.name,
    role: `${L.cls} · Leader`,
    text: `${L.line}\n\nBetween the oaks: four moss-grown menhirs, each carved with a different vow. Uni stamps, impatient. A purple wind — not weather — combs the leaves from the far ridge.`,
    choices: [{ label: "Approach the stones", onClick: stones }],
  });
}

function stones() {
  state.runeOrder = [];
  showDialogue({
    scene: "woods",
    speaker: "Dungeon Master",
    role: "A riddle in moss",
    text: "Touch them in the song of the woods:\nFirst the eye that never sleeps. Then the step that makes no sound. Then the spark that will not keep. Then the strength that holds the ground.",
    puzzle: renderRunes,
  });
}

function renderRunes() {
  const mount = $("puzzle-mount");
  const runes = [
    { id: "hank", label: "The Eye" },
    { id: "sheila", label: "The Step" },
    { id: "bobby", label: "The Stone" },
    { id: "presto", label: "The Spark" },
  ];
  mount.innerHTML = `<p class="status" id="puzzle-status">Touch the stones. A wrong song stings.</p>
    <div class="rune-row">
      ${runes.map((r) => `<button type="button" class="rune" data-id="${r.id}">${r.label}</button>`).join("")}
    </div>`;
  mount.querySelectorAll(".rune").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.runeOrder.push(btn.dataset.id);
      btn.classList.add("lit");
      btn.disabled = true;
      if (state.runeOrder.length === 4) {
        const ok = state.runeOrder.join() === RUNE_SOLUTION.join();
        if (ok) {
          const bonus = ["hank", "sheila", "presto", "bobby"].includes(state.leaderId)
            ? " Your leader’s gift made the last stone bloom gold."
            : "";
          cavernOpen(bonus);
        } else {
          const extra = hurt(1);
          showDialogue({
            speaker: "Dungeon Master",
            role: "Gently correcting",
            text: `The woods remember a different order.${extra} Shadows nipped the party. Try the song again.`,
            choices: [{ label: "Reset the stones", onClick: stones }],
          });
        }
      }
    });
  });
}

function cavernOpen(bonus) {
  state.puzzle = null;
  syncSkillChip();
  showDialogue({
    scene: "cavern",
    phase: "II — The Singing Cavern",
    speaker: "Dungeon Master",
    role: "Guide of the Realm",
    text: `The stones part like teeth, and crystal light pours up from the world’s bones.${bonus}\n\nBelow waits a door of ice-glass. Three rings must remember one constellation: bow, hat, and unicorn — seeking, wonder, and heart.`,
    choices: [{ label: "Descend", onClick: ringsPuzzle }],
  });
}

function ringsPuzzle() {
  state.rings = [0, 0, 0];
  showDialogue({
    scene: "cavern",
    speaker: "Presto",
    role: "Magician",
    text: "Okay, okay — if I rotate them until the pictures kiss… please work, hat.",
    puzzle: renderRings,
  });
}

function ringsAligned() {
  return state.rings[0] === 1 && state.rings[1] === 1 && state.rings[2] === 2;
}

function renderRings() {
  const labels = [
    ["Crown", "Bow", "Flame"],
    ["Shield", "Hat", "Key"],
    ["Dragon", "Tower", "Unicorn"],
  ];
  const mount = $("puzzle-mount");
  mount.innerHTML = `
    <p class="status" id="puzzle-status">Click a ring to turn it. Line up Bow · Hat · Unicorn.</p>
    <div class="rings">
      ${state.rings
        .map(
          (pos, i) =>
            `<button type="button" class="choice ring-btn" data-i="${i}">Ring ${i + 1}: ${labels[i][pos]}</button>`
        )
        .join("")}
    </div>`;
  mount.querySelectorAll(".ring-btn").forEach((b) => {
    b.addEventListener("click", () => {
      const i = Number(b.dataset.i);
      state.rings[i] = (state.rings[i] + 1) % 3;
      if (ringsAligned()) afterRings();
      else renderRings();
    });
  });
}

function afterRings() {
  showDialogue({
    scene: "cavern",
    speaker: "Sheila",
    role: "Thief",
    text: "The ice-glass sighs open — then another lock breathes. Four singing crystals. They already hummed a phrase. We have to answer it, or the floor becomes a mouth.",
    choices: [{ label: "Listen, then answer", onClick: crystalPuzzle }],
  });
}

function crystalPuzzle() {
  state.crystalHeard = [];
  showDialogue({
    scene: "cavern",
    speaker: "Dungeon Master",
    role: "A riddle in crystal",
    text: "Answer in four lights, as the cavern first sang:\nThe wound of the earth. The living leaf. The sun trapped in stone. The winter sky.",
    puzzle: renderCrystals,
  });
}

function renderCrystals() {
  const names = ["Ruby", "Gold", "Jade", "Sky"];
  const mount = $("puzzle-mount");
  mount.innerHTML = `<p class="status" id="puzzle-status">Replay the cavern’s phrase. Four notes.</p>
    <div class="crystal-row">
      ${names
        .map(
          (n, i) =>
            `<button type="button" class="crystal c${i}" data-i="${i}">${n}</button>`
        )
        .join("")}
    </div>`;
  mount.querySelectorAll(".crystal").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.i);
      state.crystalHeard.push(i);
      btn.classList.add("on");
      setTimeout(() => btn.classList.remove("on"), 280);
      if (state.crystalHeard.length === CRYSTAL_SONG.length) {
        const ok = state.crystalHeard.every((n, idx) => n === CRYSTAL_SONG[idx]);
        if (ok) citadelGate();
        else {
          const extra = hurt(1);
          showDialogue({
            speaker: "Eric",
            role: "Cavalier",
            text: `Wrong chord. The cave spat frost.${extra} Again — and nobody “improvise,” Presto.`,
            choices: [{ label: "Hear it once more", onClick: crystalPuzzle }],
          });
        }
      }
    });
  });
}

function citadelGate() {
  showDialogue({
    scene: "citadel",
    phase: "III — Shadow of Venger",
    speaker: "Hank",
    role: "Ranger",
    text: "Night with a tower in it. Tiamat’s five-colored shadow slides across the clouds — too far to fight, close enough to promise. Something with horns is already smiling.",
    choices: [
      { label: "Hank: nock an arrow and step through", onClick: () => vengerApproach("arrow") },
      { label: "Eric: shields up, then through", onClick: () => vengerApproach("shield") },
      { label: "Bobby: Uni, we go together!", onClick: () => vengerApproach("charge") },
    ],
  });
}

function vengerApproach(style) {
  let extra = "";
  if (style === "charge") {
    extra = hurt(1) + " Bobby’s rush is brave and a little early. The dark bites back.";
  } else if (style === "shield" && state.leaderId === "eric") {
    extra = " Eric’s raised shield turns a lash of violet into sparks.";
  } else if (style === "arrow" && state.leaderId === "hank") {
    extra = " Hank’s first shot splits a shadow-wraith before it can scream.";
  }
  showDialogue({
    scene: "citadel",
    speaker: "Venger",
    role: "Force of Evil",
    text: `Children. Still playing at heroes.${extra}\n\nI am Venger. Your Compass of Seeking — the trinket the old man hid in the cavern — is mine. Without it, the way home is a story you tell yourselves.`,
    choices: [{ label: "Stand your ground", onClick: vengerFight }],
  });
}

function vengerFight() {
  const L = leader();
  showDialogue({
    scene: "citadel",
    speaker: L.name,
    role: "Leader",
    text: "Storm-light paints the citadel. Choose who answers Venger — the leader’s strike will bite deepest.",
    choices: HEROES.map((h) => ({
      label: `${h.name}: ${skillMove(h)}`,
      onClick: () => resolveMove(h),
    })),
  });
}

function skillMove(h) {
  return {
    hank: "Pin the cloak to the stone",
    eric: "Brace the party behind the shield",
    diana: "Vault the lightning and strike",
    presto: "Fling whatever the hat offers",
    sheila: "Cut the Compass from his belt",
    bobby: "Club the shadows, Uni gore the dark",
  }[h.id];
}

function resolveMove(h) {
  const lead = h.id === state.leaderId;
  let success = lead || ["sheila", "hank", "diana"].includes(h.id);
  if (h.id === "presto") success = Math.random() > 0.3 || lead;
  if (h.id === "eric") success = true;
  if (h.id === "bobby") success = lead || Math.random() > 0.4;
  let extra = "";
  if (!success) extra = hurt(1);
  const texts = {
    hank: success
      ? "The arrow nails Venger’s cloak to a spire. He laughs, but he cannot turn as fast."
      : "The shot skims purple fire and dies.",
    eric: "The shield holds. The party does not scatter. Venger hates that more than pain.",
    diana: success
      ? "Diana walks a thread of lightning and cracks her staff across a horned helm."
      : "The leap is perfect; the landing meets a whip of night.",
    presto: success
      ? "The hat coughs out butterflies that become blades of daylight. Venger recoils, offended."
      : "The hat produces a rubber chicken. Venger is briefly confused. Then cruel.",
    sheila: success
      ? "Sheila’s fingers graze the Compass — she cannot keep it, but she turns its needle toward home for a heartbeat."
      : "The cloak is a mouth. Sheila twists free with a burn across her palm.",
    bobby: success
      ? "Bobby and Uni hit like a small avalanche. Venger actually steps back."
      : "Uni squeals. Bobby is thrown, stubbornly un-quit.",
  };
  showDialogue({
    speaker: h.name,
    role: h.cls,
    text: `${texts[h.id]}${extra}`,
    choices: [{ label: "Face him", onClick: finale }],
  });
}

function finale() {
  const alive = state.hp > 0;
  showDialogue({
    scene: "citadel",
    speaker: "Venger",
    role: "Force of Evil",
    text: alive
      ? "Enough. Keep your scratches and your friendship. I take the Compass. When Tiamat hungers, I will not need children to amuse me."
      : "You fall. The Realm, sentimental beast, will not let you end. Wake. Hurt. Continue.",
    choices: [{ label: "The Dungeon Master speaks", onClick: epilogue }],
  });
}

function epilogue() {
  if (state.hp <= 0) state.hp = 1;
  setHp();
  const L = leader();
  showDialogue({
    scene: "ending",
    phase: "To be continued",
    speaker: "Dungeon Master",
    role: "Guide of the Realm",
    text: `Venger is gone on a road of cracks in the sky. Tiamat’s silhouette fades like a bruise. ${L.name}, a sliver of the Compass still knows you — light hiding in a ${L.cls.toLowerCase()} heart.\n\nThree trials are done. Many wait. The way home is earned, never given.`,
    choices: [
      {
        label: "Play again with another leader",
        onClick: resetToTitle,
      },
    ],
  });
}

function resetToTitle() {
  state.hp = MAX_HP;
  state.leaderId = null;
  state.skillUsed = false;
  state.shieldArmed = false;
  state.puzzle = null;
  setScene("title");
  $("dialogue").hidden = true;
  $("hud").hidden = true;
  $("portrait-stage").hidden = true;
  $("title-screen").hidden = false;
}

function useLeaderSkill() {
  if (state.skillUsed || !leader() || !state.puzzle) return;
  const L = leader();
  const status = $("puzzle-status");
  const note = (msg) => {
    if (status) status.textContent = msg;
  };

  if (state.puzzle === renderRunes) {
    if (L.skill === "eye" || L.skill === "stone") {
      const next = RUNE_SOLUTION[state.runeOrder.length];
      const names = { hank: "Eye", sheila: "Step", presto: "Spark", bobby: "Stone" };
      note(
        L.skill === "stone"
          ? `Uni’s horn dips toward ${names[next]}.`
          : `Hank reads the moss: next is ${names[next]}.`
      );
      state.skillUsed = true;
    } else if (L.skill === "shield") {
      state.shieldArmed = true;
      state.skillUsed = true;
      note("Eric plants the shield. A wrong song will not cut you this time.");
    } else {
      note(`${L.name}’s gift cannot read these stones. Save it for later locks.`);
      return;
    }
  } else if (state.puzzle === renderRings) {
    if (L.skill === "spark") {
      const need = [1, 1, 2];
      const idx = state.rings.findIndex((v, i) => v !== need[i]);
      if (idx >= 0) state.rings[idx] = need[idx];
      state.skillUsed = true;
      syncSkillChip();
      if (ringsAligned()) afterRings();
      else renderRings();
      return;
    }
    if (L.skill === "grace") {
      state.rings[2] = 2;
      state.skillUsed = true;
      syncSkillChip();
      if (ringsAligned()) afterRings();
      else renderRings();
      return;
    }
    note(`${L.name} cannot turn these rings from here.`);
    return;
  } else if (state.puzzle === renderCrystals) {
    if (L.skill === "step" || L.skill === "eye") {
      const next = CRYSTAL_SONG[state.crystalHeard.length];
      const names = ["Ruby", "Gold", "Jade", "Sky"];
      note(`The next true note is ${names[next]}.`);
      state.skillUsed = true;
    } else if (L.skill === "shield") {
      state.shieldArmed = true;
      state.skillUsed = true;
      note("Eric plants the shield. A wrong note will not cut you this time.");
    } else {
      note(`${L.name}’s gift is not a tuning fork.`);
      return;
    }
  } else {
    return;
  }
  syncSkillChip();
}

$("btn-begin").addEventListener("click", startSelect);
$("skill-chip").addEventListener("click", useLeaderSkill);
setScene("title");
