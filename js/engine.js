const MAX_HP = 8;
const GIFT_ROUNDS = [
  { clue: "It drinks the dark so a sister may walk unseen.", answer: "cloak" },
  { clue: "It fires light, not arrows of wood.", answer: "bow" },
  { clue: "It is never what was asked — and sometimes better.", answer: "hat" },
];
const PATH_ORCS = new Set([4, 6, 11]);
const PATH_START = 9;
const PATH_UNI = 1;
const SIMON_SONG = [0, 2, 1, 3, 2];
const SIGIL_SONG = ["horn", "night", "compass"];

const state = {
  leaderId: null,
  hp: MAX_HP,
  skillUsed: false,
  shieldArmed: false,
  puzzle: null,
  giftRound: 0,
  pathCell: PATH_START,
  pathTrail: [PATH_START],
  simonHeard: [],
  simonLocked: true,
  sigils: [],
};

const $ = (id) => document.getElementById(id);

function leader() {
  return HEROES.find((h) => h.id === state.leaderId);
}

function flashFx(kind) {
  const layer = $("fx-layer");
  if (!layer) return;
  const burst = document.createElement("div");
  burst.className = `fx-burst fx-${kind}`;
  layer.appendChild(burst);
  setTimeout(() => burst.remove(), 900);
}

function setScene(name) {
  const el = $("scene");
  el.className = `scene scene-${name} scene-enter`;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.remove("scene-enter"));
  });
}

function setHp() {
  $("hp-fill").style.width = `${(state.hp / MAX_HP) * 100}%`;
}

function hurt(n = 1) {
  if (state.shieldArmed) {
    state.shieldArmed = false;
    flashFx("shield");
    return " Eric’s wall drinks the blow. The party does not stagger.";
  }
  state.hp = Math.max(0, state.hp - n);
  setHp();
  $("hp-fill").classList.add("hp-hurt");
  document.getElementById("app").classList.add("screen-shake");
  setTimeout(() => {
    $("hp-fill").classList.remove("hp-hurt");
    document.getElementById("app").classList.remove("screen-shake");
  }, 420);
  flashFx("hurt");
  return "";
}

function renderParty() {
  $("party-strip").innerHTML = HEROES.map((h) => {
    const cls = h.id === state.leaderId ? "mini-hero leader" : "mini-hero";
    return `<div class="${cls}" title="${h.name} the ${h.cls}">${portraitSvg(h)}</div>`;
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

  const art = $("speaker-art");
  const hero = HEROES.find((h) => h.name === speaker);
  if (hero) art.innerHTML = portraitSvg(hero);
  else if (speaker === "Venger") art.innerHTML = vengerPortrait();
  else if (speaker === "Uni") art.innerHTML = portraitSvg(HEROES.find((h) => h.id === "bobby"));
  else art.innerHTML = dmPortrait();
  art.classList.remove("portrait-pop");
  void art.offsetWidth;
  art.classList.add("portrait-pop");
  $("portrait-stage").classList.toggle("is-venger", speaker === "Venger");

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
  if (puzzle) {
    state.skillUsed = false;
    puzzle();
  }
  syncSkillChip();

  const panel = document.querySelector(".dialogue-inner");
  panel.classList.remove("panel-in");
  void panel.offsetWidth;
  panel.classList.add("panel-in");
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
  flashFx("magic");
  showDialogue({
    scene: "woods",
    phase: "I — The Calling",
    speaker: "Dungeon Master",
    role: "Guide of the Realm",
    text: `The carnival ride became a river of light. Six friends fell through a map, and the Realm caught you like a page catching ink.\n\n${L.name} the ${L.cls} stands at the front. ${leaderBonusLine(L)}\n\nA small man in red waits between the trees. Uni nuzzles Bobby’s sleeve. Venger’s citadel drinks the sunset, far and hungry.`,
    choices: [
      { label: "Ask the way home", onClick: woodsAsk },
      { label: "Look at the gifts you were given", onClick: woodsGifts },
    ],
  });
}

function woodsAsk() {
  showDialogue({
    speaker: "Dungeon Master",
    role: "Guide of the Realm",
    text: "Home is a door with many locks, young ones. First you must remember the gifts I placed in your hands — not as toys, as names you keep for one another.\n\nFail, and the woods will sip your courage. Succeed, and the trees will open a path Uni already knows.",
    choices: [{ label: "We remember", onClick: giftPuzzle }],
  });
}

function woodsGifts() {
  const L = leader();
  showDialogue({
    speaker: L.name,
    role: `${L.cls} · Leader`,
    text: `${L.line}\n\nHank’s bow hums gold. Eric’s shield sulks and shines. Diana’s staff lengthens when she isn’t looking. Presto’s hat fidgets. Sheila’s cloak drinks a patch of dusk. Bobby’s club is already too big for his hands — Uni approves.`,
    choices: [{ label: "The Dungeon Master tests us", onClick: giftPuzzle }],
  });
}

function giftPuzzle() {
  state.giftRound = 0;
  showDialogue({
    scene: "woods",
    speaker: "Dungeon Master",
    role: "A riddle in gifts",
    text: "Three truths. Touch the gift that answers each. The Circle of Six is not six strangers — it is six promises.",
    puzzle: renderGifts,
  });
}

function renderGifts() {
  const round = GIFT_ROUNDS[state.giftRound];
  const gifts = [
    { id: "bow", label: "Energy Bow", who: "Hank" },
    { id: "shield", label: "Magic Shield", who: "Eric" },
    { id: "staff", label: "Javelin Staff", who: "Diana" },
    { id: "hat", label: "The Hat", who: "Presto" },
    { id: "cloak", label: "Cloak of Night", who: "Sheila" },
    { id: "club", label: "Thunder Club", who: "Bobby" },
  ];
  const mount = $("puzzle-mount");
  mount.innerHTML = `<p class="status" id="puzzle-status">Riddle ${state.giftRound + 1} of 3 — ${round.clue}</p>
    <div class="gift-row">
      ${gifts
        .map(
          (g) =>
            `<button type="button" class="gift-card" data-id="${g.id}"><span class="gift-who">${g.who}</span>${g.label}</button>`
        )
        .join("")}
    </div>`;
  mount.querySelectorAll(".gift-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.id === round.answer) {
        btn.classList.add("correct");
        flashFx("magic");
        state.giftRound += 1;
        if (state.giftRound >= GIFT_ROUNDS.length) woodsClear();
        else {
          state.skillUsed = false;
          syncSkillChip();
          renderGifts();
        }
      } else {
        btn.classList.add("wrong");
        const extra = hurt(1);
        showDialogue({
          speaker: "Dungeon Master",
          role: "Gently correcting",
          text: `Not that promise.${extra} Listen again: the gift belongs to the heart, not the loudest hand.`,
          choices: [
            {
              label: "Try this riddle again",
              onClick: () =>
                showDialogue({
                  scene: "woods",
                  speaker: "Dungeon Master",
                  role: "A riddle in gifts",
                  text: GIFT_ROUNDS[state.giftRound].clue,
                  puzzle: renderGifts,
                }),
            },
          ],
        });
      }
    });
  });
}

function woodsClear() {
  state.puzzle = null;
  syncSkillChip();
  showDialogue({
    scene: "woods",
    phase: "II — Whispering Woods",
    speaker: "Bobby",
    role: "Barbarian",
    text: "Uni’s gone! She bolted between the oaks — I hear orcs. I hear her too. We have to follow her tracks and not theirs.",
    choices: [{ label: "Follow Uni", onClick: uniPuzzle }],
  });
}

function uniPuzzle() {
  state.pathCell = PATH_START;
  state.pathTrail = [PATH_START];
  showDialogue({
    scene: "woods",
    speaker: "Uni",
    role: "Baby unicorn",
    text: "Uni “meeps” from the far glade. Step to a neighboring patch — no diagonals, no orcs — until you reach her.",
    puzzle: renderPath,
  });
}

function neighbors(i) {
  const c = i % 3;
  const r = Math.floor(i / 3);
  const out = [];
  if (c > 0) out.push(i - 1);
  if (c < 2) out.push(i + 1);
  if (r > 0) out.push(i - 3);
  if (r < 3) out.push(i + 3);
  return out;
}

function renderPath() {
  const labels = Array(12).fill("");
  labels[PATH_START] = "You";
  labels[PATH_UNI] = "Uni";
  PATH_ORCS.forEach((i) => {
    labels[i] = "Orc";
  });
  const mount = $("puzzle-mount");
  mount.innerHTML = `<p class="status" id="puzzle-status">Cross the moss. Uni waits at the far glade.</p>
    <div class="path-grid" id="path-grid">
      ${labels
        .map((lab, i) => {
          const cls = [
            "path-cell",
            PATH_ORCS.has(i) ? "orc" : "",
            i === PATH_UNI ? "uni" : "",
            i === state.pathCell ? "here" : "",
            state.pathTrail.includes(i) ? "trail" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return `<button type="button" class="${cls}" data-i="${i}">${lab || "·"}</button>`;
        })
        .join("")}
    </div>`;
  mount.querySelectorAll(".path-cell").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.i);
      if (!neighbors(state.pathCell).includes(i)) {
        $("puzzle-status").textContent = "Too far — step to a neighbor.";
        return;
      }
      if (PATH_ORCS.has(i)) {
        const extra = hurt(1);
        showDialogue({
          speaker: "Eric",
          role: "Cavalier",
          text: `Orcs. Of course there are orcs.${extra} Uni stamps, unimpressed. Back to the last safe moss.`,
          choices: [{ label: "Reset the trail", onClick: uniPuzzle }],
        });
        return;
      }
      state.pathCell = i;
      state.pathTrail.push(i);
      flashFx(i === PATH_UNI ? "magic" : "step");
      if (i === PATH_UNI) cavernOpen();
      else renderPath();
    });
  });
}

function cavernOpen() {
  state.puzzle = null;
  syncSkillChip();
  showDialogue({
    scene: "cavern",
    phase: "III — The Singing Cavern",
    speaker: "Dungeon Master",
    role: "Guide of the Realm",
    text: "Uni leads you to a mouth of crystal. The cavern remembers every song it has ever been sung. Answer it in kind — first listen, then play — or the floor will become a throat.",
    choices: [{ label: "Listen to the cavern", onClick: simonPuzzle }],
  });
}

function simonPuzzle() {
  state.simonHeard = [];
  state.simonLocked = true;
  showDialogue({
    scene: "cavern",
    speaker: "Presto",
    role: "Magician",
    text: "Okay, okay — four colors, then a fifth. I can do sequences. I juggle. Sort of. Don’t start until it finishes humming!",
    puzzle: renderSimon,
  });
}

function renderSimon() {
  const names = ["Ruby", "Gold", "Jade", "Sky"];
  const mount = $("puzzle-mount");
  mount.innerHTML = `<p class="status" id="puzzle-status">Watch the cavern sing…</p>
    <div class="crystal-row" id="simon-row">
      ${names
        .map(
          (n, i) =>
            `<button type="button" class="crystal c${i}" data-i="${i}" disabled>${n}</button>`
        )
        .join("")}
    </div>`;
  playSimon();
}

function playSimon() {
  const row = $("simon-row");
  if (!row) return;
  const buttons = [...row.querySelectorAll(".crystal")];
  state.simonLocked = true;
  buttons.forEach((b) => {
    b.disabled = true;
  });
  SIMON_SONG.forEach((idx, step) => {
    setTimeout(() => {
      if (!$("simon-row")) return;
      buttons[idx].classList.add("on", "sing");
      flashFx("crystal");
      setTimeout(() => buttons[idx].classList.remove("on", "sing"), 380);
      if (step === SIMON_SONG.length - 1) {
        setTimeout(() => {
          state.simonLocked = false;
          buttons.forEach((b) => {
            b.disabled = false;
            b.onclick = () => tapSimon(Number(b.dataset.i));
          });
          const st = $("puzzle-status");
          if (st) st.textContent = "Now answer — same five notes.";
        }, 500);
      }
    }, 520 * step);
  });
}

function tapSimon(i) {
  if (state.simonLocked) return;
  const btn = document.querySelector(`.crystal.c${i}`);
  if (btn) {
    btn.classList.add("on");
    setTimeout(() => btn.classList.remove("on"), 260);
  }
  state.simonHeard.push(i);
  const n = state.simonHeard.length;
  if (state.simonHeard[n - 1] !== SIMON_SONG[n - 1]) {
    const extra = hurt(1);
    showDialogue({
      speaker: "Eric",
      role: "Cavalier",
      text: `Wrong chord. The cave spat frost.${extra} Again — and nobody “improvise,” Presto.`,
      choices: [{ label: "Hear it once more", onClick: simonPuzzle }],
    });
    return;
  }
  if (n === SIMON_SONG.length) {
    flashFx("magic");
    hatDoor();
  }
}

function hatDoor() {
  state.puzzle = null;
  syncSkillChip();
  showDialogue({
    scene: "cavern",
    speaker: "Sheila",
    role: "Thief",
    text: "The ice-glass sighs — then sticks. Presto asked the hat for a key. The hat, being the hat, produced four objects and a look of injured pride.",
    choices: [{ label: "See what the hat coughed up", onClick: hatPuzzle }],
  });
}

function hatPuzzle() {
  showDialogue({
    scene: "cavern",
    speaker: "Presto",
    role: "Magician",
    text: "I asked for a way through the ice-door. Pick what the hat meant — not what I wanted.",
    puzzle: renderHat,
  });
}

function renderHat() {
  const items = [
    { id: "chicken", label: "Rubber chicken" },
    { id: "key", label: "A tiny iron key" },
    { id: "butterfly", label: "A daylight butterfly" },
    { id: "map", label: "A map of Cleveland" },
  ];
  const mount = $("puzzle-mount");
  mount.innerHTML = `<p class="status" id="puzzle-status">The ice wants warmth and wonder — not a locksmith.</p>
    <div class="hat-row">
      ${items
        .map(
          (it) =>
            `<button type="button" class="hat-item" data-id="${it.id}">${it.label}</button>`
        )
        .join("")}
    </div>`;
  mount.querySelectorAll(".hat-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.id === "butterfly") {
        btn.classList.add("correct");
        flashFx("magic");
        citadelRoad();
      } else {
        btn.classList.add("wrong");
        const extra = hurt(1);
        const jokes = {
          chicken: "The chicken squeaks. The ice is unmoved, and slightly offended.",
          key: "The key is for a diary. Presto turns crimson.",
          map: "Cleveland is not a door. Eric says he could have told you that.",
        };
        showDialogue({
          speaker: "Presto",
          role: "Magician",
          text: `${jokes[btn.dataset.id]}${extra}`,
          choices: [{ label: "Ask the hat again", onClick: hatPuzzle }],
        });
      }
    });
  });
}

function citadelRoad() {
  state.puzzle = null;
  syncSkillChip();
  showDialogue({
    scene: "citadel",
    phase: "IV — Shadow of Venger",
    speaker: "Hank",
    role: "Ranger",
    text: "The butterfly becomes a blade of noon and the ice forgets it was a door. Night with a tower in it. Tiamat’s five-colored shadow slides across the clouds — too far to fight, close enough to promise.",
    choices: [{ label: "Step into the citadel", onClick: vengerMeet }],
  });
}

function vengerMeet() {
  flashFx("venger");
  showDialogue({
    scene: "citadel",
    speaker: "Venger",
    role: "Force of Evil",
    text: "Children. Still playing at heroes. I am Venger. Your Compass of Seeking sits in my sigils now. Repeat my night-script — or wander until Tiamat hungers.",
    choices: [{ label: "Watch the sigils", onClick: sigilPuzzle }],
  });
}

function sigilPuzzle() {
  state.sigils = [];
  state.simonLocked = true;
  showDialogue({
    scene: "citadel",
    speaker: "Venger",
    role: "A riddle in night",
    text: "Three marks. Horn of the nightmare. Night that obeys me. Compass you will never keep. Watch — then write them back.",
    puzzle: renderSigils,
  });
}

function renderSigils() {
  const marks = [
    { id: "night", label: "Night" },
    { id: "flame", label: "Flame" },
    { id: "horn", label: "Horn" },
    { id: "cloak", label: "Cloak" },
    { id: "compass", label: "Compass" },
  ];
  const mount = $("puzzle-mount");
  mount.innerHTML = `<p class="status" id="puzzle-status">Venger’s hand writes in the air…</p>
    <div class="sigil-row" id="sigil-row">
      ${marks
        .map(
          (m) =>
            `<button type="button" class="sigil" data-id="${m.id}" disabled>${m.label}</button>`
        )
        .join("")}
    </div>`;
  const buttons = [...mount.querySelectorAll(".sigil")];
  SIGIL_SONG.forEach((id, step) => {
    setTimeout(() => {
      if (!$("sigil-row")) return;
      const b = buttons.find((el) => el.dataset.id === id);
      if (b) {
        b.classList.add("on");
        flashFx("venger");
        setTimeout(() => b.classList.remove("on"), 420);
      }
      if (step === SIGIL_SONG.length - 1) {
        setTimeout(() => {
          state.simonLocked = false;
          buttons.forEach((el) => {
            el.disabled = false;
            el.addEventListener("click", () => tapSigil(el.dataset.id));
          });
          const st = $("puzzle-status");
          if (st) st.textContent = "Write the three marks back.";
        }, 480);
      }
    }, 700 * step);
  });
}

function tapSigil(id) {
  if (state.simonLocked) return;
  const btn = document.querySelector(`.sigil[data-id="${id}"]`);
  if (btn) {
    btn.classList.add("on");
    setTimeout(() => btn.classList.remove("on"), 280);
  }
  state.sigils.push(id);
  const n = state.sigils.length;
  if (state.sigils[n - 1] !== SIGIL_SONG[n - 1]) {
    const extra = hurt(1);
    showDialogue({
      speaker: "Venger",
      role: "Force of Evil",
      text: `Wrong scripture.${extra} The dark is a patient teacher.`,
      choices: [{ label: "Watch again", onClick: sigilPuzzle }],
    });
    return;
  }
  if (n === SIGIL_SONG.length) {
    flashFx("arrow");
    vengerFight();
  }
}

function vengerFight() {
  const L = leader();
  showDialogue({
    scene: "citadel",
    speaker: L.name,
    role: "Leader",
    text: "The sigils break. Storm-light paints the citadel. Choose who answers Venger — the leader’s strike will bite deepest.",
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
  if (h.id === "hank") flashFx("arrow");
  else if (h.id === "eric") flashFx("shield");
  else flashFx("magic");
  const texts = {
    hank: success
      ? "The energy arrow nails Venger’s cloak to a spire. He laughs, but he cannot turn as fast."
      : "The shot skims purple fire and dies.",
    eric: "The shield holds. The party does not scatter. Venger hates that more than pain.",
    diana: success
      ? "Diana walks a thread of lightning and cracks her staff across a horned helm."
      : "The leap is perfect; the landing meets a whip of night.",
    presto: success
      ? "The hat coughs out butterflies that become blades of daylight. Venger recoils, offended."
      : "The hat produces a second rubber chicken. Venger is briefly confused. Then cruel.",
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
  flashFx("magic");
  showDialogue({
    scene: "ending",
    phase: "V — To be continued",
    speaker: "Dungeon Master",
    role: "Guide of the Realm",
    text: `Venger is gone on a road of cracks in the sky. Tiamat’s silhouette fades like a bruise. ${L.name}, a sliver of the Compass still knows you — light hiding in a ${L.cls.toLowerCase()} heart.\n\nThe woods remembered you. The cavern sang with you. The citadel did not keep you. The way home is earned, never given — and the Circle of Six still walks as one.`,
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

  if (state.puzzle === renderGifts) {
    if (L.skill === "eye" || L.skill === "step") {
      const names = { cloak: "Sheila’s cloak", bow: "Hank’s bow", hat: "Presto’s hat" };
      note(`The true gift is ${names[GIFT_ROUNDS[state.giftRound].answer]}.`);
      state.skillUsed = true;
    } else if (L.skill === "shield") {
      state.shieldArmed = true;
      state.skillUsed = true;
      note("Eric plants the shield. A wrong gift will not cut you this time.");
    } else {
      note(`${L.name}’s gift cannot read this riddle. Save it.`);
      return;
    }
  } else if (state.puzzle === renderPath) {
    if (L.skill === "eye" || L.skill === "grace") {
      const nxt = neighbors(state.pathCell).find((n) => !PATH_ORCS.has(n) && n !== state.pathTrail[state.pathTrail.length - 2]);
      note(L.skill === "grace" ? `Diana spots a clean leap toward patch ${nxt}.` : `Hank reads the moss: the safe neighbor is clear of orcs.`);
      document.querySelectorAll(".path-cell").forEach((el) => {
        const i = Number(el.dataset.i);
        if (neighbors(state.pathCell).includes(i) && !PATH_ORCS.has(i)) el.classList.add("hint");
      });
      state.skillUsed = true;
    } else if (L.skill === "stone") {
      document.querySelector(".path-cell.uni")?.classList.add("hint");
      note("Uni’s horn flashes from the glade. That way.");
      state.skillUsed = true;
    } else if (L.skill === "shield") {
      state.shieldArmed = true;
      state.skillUsed = true;
      note("Eric plants the shield. The next orc will not cut you.");
    } else {
      note(`${L.name} cannot pick Uni’s trail from here.`);
      return;
    }
  } else if (state.puzzle === renderSimon) {
    if (L.skill === "step" || L.skill === "eye" || L.skill === "spark") {
      const next = SIMON_SONG[state.simonHeard.length];
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
  } else if (state.puzzle === renderHat) {
    if (L.skill === "spark" || L.skill === "eye") {
      note("Not the key. The hat heard ‘through’ and thought of wings of noon.");
      document.querySelector('.hat-item[data-id="butterfly"]')?.classList.add("hint");
      state.skillUsed = true;
    } else if (L.skill === "shield") {
      state.shieldArmed = true;
      state.skillUsed = true;
      note("Eric plants the shield. A wrong pull will not cut you.");
    } else {
      note(`${L.name} cannot argue with the hat.`);
      return;
    }
  } else if (state.puzzle === renderSigils) {
    if (L.skill === "eye" || L.skill === "step") {
      const next = SIGIL_SONG[state.sigils.length];
      note(`The next mark is ${next}.`);
      state.skillUsed = true;
    } else if (L.skill === "shield") {
      state.shieldArmed = true;
      state.skillUsed = true;
      note("Eric plants the shield. A wrong scripture will not cut you.");
    } else {
      note(`${L.name} cannot read Venger’s hand.`);
      return;
    }
  } else {
    return;
  }
  syncSkillChip();
}

const bgm = $("bgm");
bgm.volume = 0.38;
let musicWanted = false;

function syncMusicButton() {
  const on = musicWanted && !bgm.paused && !bgm.muted;
  const btn = $("btn-music");
  btn.textContent = on ? "Music on" : "Music off";
  btn.setAttribute("aria-pressed", on ? "true" : "false");
  btn.setAttribute("aria-label", on ? "Mute music" : "Play music");
}

function startBgm() {
  if (!musicWanted || document.hidden) return;
  const play = bgm.play();
  if (play && play.catch) play.catch(() => {});
  syncMusicButton();
}

function stopBgm() {
  bgm.pause();
  syncMusicButton();
}

$("btn-music").addEventListener("click", () => {
  if (musicWanted) {
    musicWanted = false;
    stopBgm();
  } else {
    musicWanted = true;
    bgm.muted = false;
    startBgm();
  }
});

$("btn-begin").addEventListener("click", () => {
  musicWanted = true;
  startBgm();
  startSelect();
});
$("skill-chip").addEventListener("click", useLeaderSkill);
setScene("title");
syncMusicButton();

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopBgm();
  else if (musicWanted) startBgm();
});
window.addEventListener("pagehide", stopBgm);

const boot = new URLSearchParams(location.search);
if (boot.get("screen") === "select") {
  startSelect();
} else if (boot.get("screen") === "play") {
  state.leaderId = boot.get("leader") || "hank";
  renderParty();
  setHp();
  intro();
}
