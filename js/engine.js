const SAVE_KEY = "dq80s-save-v2";

const state = {
  beat: "title",
  chapter: "i",
  route: null,
  fork3: null,
  fork5: null,
  fork7: null,
  leaderId: null,
  hp: MAX_HP,
  skillUsed: false,
  shieldArmed: false,
  puzzle: null,
  puzzleSpec: null,
  puzzleKind: null,
  giftRound: 0,
  pathCell: 0,
  pathTrail: [],
  simonHeard: [],
  simonLocked: true,
  sigils: [],
  lockHeard: [],
  shardHeard: [],
  waveHeard: [],
  illusionPicked: [],
  needleHeard: [],
  dualPhase: "A",
  dualHeard: [],
  gauntletPhase: 0,
  formationAssign: {},
  activePost: null,
};

const $ = (id) => document.getElementById(id);

function persist() {
  if (state.beat === "title") {
    clearSave();
    return;
  }
  const data = {
    beat: state.beat,
    chapter: state.chapter,
    route: state.route,
    fork3: state.fork3,
    fork5: state.fork5,
    fork7: state.fork7,
    leaderId: state.leaderId,
    hp: state.hp,
    skillUsed: state.skillUsed,
    shieldArmed: state.shieldArmed,
    giftRound: state.giftRound,
    pathCell: state.pathCell,
    pathTrail: state.pathTrail,
    gauntletPhase: state.gauntletPhase,
  };
  try {
    sessionStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (_) {
    /* ignore */
  }
}

function clearSave() {
  try {
    sessionStorage.removeItem(SAVE_KEY);
    sessionStorage.removeItem("dq80s-save-v1");
  } catch (_) {
    /* ignore */
  }
}

function readSave() {
  try {
    const raw = sessionStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data.beat !== "string") return null;
    return data;
  } catch (_) {
    return null;
  }
}

function setBeat(beat) {
  state.beat = beat;
  persist();
}

function leader() {
  return HEROES.find((h) => h.id === state.leaderId);
}

function phaseLabel(ch) {
  return (CHAPTER_META[ch] || CHAPTER_META.i).phase;
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
  const routeCls = state.route ? ` route-${state.route}` : "";
  el.className = `scene scene-${name}${routeCls} scene-enter`;
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
    persist();
    flashFx("shield");
    return " Eric’s wall drinks the blow. The party does not stagger.";
  }
  state.hp = Math.max(0, state.hp - n);
  setHp();
  persist();
  $("hp-fill").classList.add("hp-hurt");
  document.getElementById("app").classList.add("screen-shake");
  setTimeout(() => {
    $("hp-fill").classList.remove("hp-hurt");
    document.getElementById("app").classList.remove("screen-shake");
  }, 420);
  flashFx("hurt");
  if (state.hp <= 0) {
    setTimeout(showGameOver, 450);
    return null;
  }
  return "";
}

function showGameOver() {
  state.beat = "gameover";
  state.puzzle = null;
  state.hp = 0;
  persist();
  setScene("citadel");
  const app = document.getElementById("app");
  app.classList.add("game-over-active");
  app.classList.remove("screen-shake");
  $("title-screen").hidden = true;
  $("select-screen").hidden = true;
  $("dialogue").hidden = true;
  $("hud").hidden = true;
  $("portrait-stage").hidden = true;
  $("game-over-screen").hidden = false;
  $("go-hp-fill").style.width = "0%";
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
  if (!L || !state.puzzle) {
    chip.hidden = true;
    return;
  }
  chip.hidden = false;
  chip.disabled = state.skillUsed;
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
    if (!state.puzzleSpec || !state.puzzleSpec.noSkillRefresh) {
      state.skillUsed = false;
    }
    puzzle();
  }
  syncSkillChip();

  const panel = document.querySelector(".dialogue-inner");
  panel.classList.remove("panel-in");
  void panel.offsetWidth;
  panel.classList.add("panel-in");
}

function resetRunFlags() {
  state.route = null;
  state.fork3 = null;
  state.fork5 = null;
  state.fork7 = null;
  state.chapter = "i";
  state.giftRound = 0;
  state.gauntletPhase = 0;
  state.skillUsed = false;
  state.shieldArmed = false;
  state.puzzleSpec = null;
  state.puzzleKind = null;
}

function startSelect() {
  setBeat("select");
  document.getElementById("app").classList.remove("game-over-active");
  $("game-over-screen").hidden = true;
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
      resetRunFlags();
      renderParty();
      setHp();
      intro();
    });
  });
}

function intro() {
  setBeat("intro");
  state.chapter = "i";
  const L = leader();
  flashFx("magic");
  showDialogue({
    scene: "woods",
    phase: phaseLabel("i"),
    speaker: "Dungeon Master",
    role: "Guide of the Realm",
    text: `The carnival ride became a river of light. Six friends fell through a map, and the Realm caught you like a page catching ink.\n\n${L.name} the ${L.cls} stands at the front. ${leaderBonusLine(L)}\n\nRemember the gifts — then three roads home will open. Choose poorly later, and the woods will sip your courage.`,
    choices: [
      { label: "Ask the way home", onClick: callingAsk },
      { label: "Look at the gifts", onClick: callingGifts },
    ],
  });
}

function callingAsk() {
  setBeat("callingAsk");
  showDialogue({
    speaker: "Dungeon Master",
    role: "Guide of the Realm",
    text: "Home is a door with many locks. First remember the gifts I placed in your hands — not as toys, as names you keep for one another.\n\nSucceed, and three roads will ask which courage you carry.",
    choices: [{ label: "We remember", onClick: () => giftPuzzle() }],
  });
}

function callingGifts() {
  setBeat("callingGifts");
  const L = leader();
  showDialogue({
    speaker: L.name,
    role: `${L.cls} · Leader`,
    text: `${L.line}\n\nHank’s bow hums gold. Eric’s shield sulks and shines. Diana’s staff lengthens when she isn’t looking. Presto’s hat fidgets. Sheila’s cloak drinks a patch of dusk. Bobby’s club is already too big — Uni approves.`,
    choices: [{ label: "The Dungeon Master tests us", onClick: () => giftPuzzle() }],
  });
}

function giftPuzzle({ resume = false } = {}) {
  if (!resume) state.giftRound = 0;
  state.chapter = "i";
  setBeat("giftPuzzle");
  showDialogue({
    scene: "woods",
    phase: phaseLabel("i"),
    speaker: "Dungeon Master",
    role: "A riddle in gifts",
    text: resume
      ? GIFT_ROUNDS[state.giftRound].clue
      : "Three truths. Touch the gift that answers each. Then the Realm will show three roads home.",
    puzzle: renderGifts,
  });
}

function renderGifts() {
  state.puzzleKind = "gifts";
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
        persist();
        if (state.giftRound >= GIFT_ROUNDS.length) routeFork();
        else {
          state.skillUsed = false;
          syncSkillChip();
          renderGifts();
        }
      } else {
        btn.classList.add("wrong");
        const extra = hurt(1);
        if (extra === null) return;
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
                  phase: phaseLabel("i"),
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

function routeFork() {
  state.puzzle = null;
  setBeat("routeFork");
  const L = leader();
  const choices = Object.values(ROUTES).map((r) => {
    const nudged = r.nudge.includes(L.id);
    return {
      label: nudged ? `${r.name} ★` : r.name,
      onClick: () => chooseRoute(r.id),
    };
  });
  showDialogue({
    scene: "meadow",
    phase: phaseLabel("i"),
    speaker: "Dungeon Master",
    role: "Three roads home",
    text: `The gifts remember you. Now the Realm opens three roads.\n\n${ROUTES.seeking.blurb}\n${ROUTES.wonder.blurb}\n${ROUTES.stand.blurb}\n\n${routeEndorse("seeking", L.id)}\nA star marks the road that already knows ${L.name}.`,
    choices,
  });
}

function chooseRoute(routeId) {
  state.route = routeId;
  persist();
  flashFx("magic");
  const r = ROUTES[routeId];
  showDialogue({
    scene: "woods",
    phase: phaseLabel("ii"),
    speaker: "Dungeon Master",
    role: r.name,
    text: `${routeEndorse(routeId, state.leaderId)}\n\nYou take ${r.name}. Ten chapters of the Realm will test the Circle — and only the Way Home returns the carnival’s light.`,
    choices: [{ label: "Step onto the road", onClick: () => beginChapter("ii") }],
  });
}

function forkKey(ch) {
  if (ch === "iii") return "fork3";
  if (ch === "v") return "fork5";
  if (ch === "vii") return "fork7";
  return null;
}

function variantFor(ch) {
  const key = forkKey(ch);
  return key ? state[key] : null;
}

function beginChapter(ch) {
  state.chapter = ch;
  setBeat(`ch-${ch}`);
  if (ch === "x") {
    homeEpilogue();
    return;
  }
  if (["iii", "v", "vii"].includes(ch) && !variantFor(ch)) {
    showFork(ch);
    return;
  }
  runChapterPuzzle(ch);
}

function showFork(ch) {
  setBeat(`fork-${ch}`);
  const opts = FORK_CHOICES[state.route][ch];
  showDialogue({
    scene: ch === "vii" ? "citadel" : "woods",
    phase: phaseLabel(ch),
    speaker: "Dungeon Master",
    role: "A crossroads",
    text: "Two trials. One road. The Realm will not offer both.",
    choices: opts.map((o) => ({
      label: o.label,
      onClick: () => {
        state[forkKey(ch)] = o.id;
        persist();
        runChapterPuzzle(ch);
      },
    })),
  });
}

function nextChapter(ch) {
  const order = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
  const i = order.indexOf(ch);
  return order[i + 1] || "x";
}

function onPuzzleWin() {
  flashFx("magic");
  const nxt = nextChapter(state.chapter);
  const lines = {
    ii: "The road opens deeper.",
    iii: "The crossroads behind you still hum.",
    iv: "Deeper still — and darker.",
    v: "Another fork survived.",
    vi: "Venger’s shadow thins, for now.",
    vii: "Night’s crossroads yield.",
    viii: "The Door of Home is near.",
    ix: "The Way Home answers.",
  };
  showDialogue({
    scene: state.puzzleSpec?.scene || "woods",
    phase: phaseLabel(state.chapter),
    speaker: "Dungeon Master",
    role: "Guide of the Realm",
    text: lines[state.chapter] || "Forward.",
    choices: [
      {
        label: nxt === "x" ? "Step through" : "Continue",
        onClick: () => beginChapter(nxt),
      },
    ],
  });
}

function onPuzzleFail(extra, retryFn) {
  if (extra === null) return;
  showDialogue({
    scene: state.puzzleSpec?.scene || "woods",
    phase: phaseLabel(state.chapter),
    speaker: leader().name,
    role: "Leader",
    text: `The trial bites.${extra} Again — together.`,
    choices: [{ label: "Try again", onClick: retryFn }],
  });
}

function runChapterPuzzle(ch) {
  const variant = variantFor(ch);
  const spec = getPuzzleSpec(state.route, ch, variant);
  if (!spec) {
    beginChapter(nextChapter(ch));
    return;
  }
  state.puzzleSpec = spec;
  state.puzzleKind = spec.kind;
  state.gauntletPhase = 0;
  setBeat(`puzzle-${ch}`);
  const introText = {
    ii: "Your first trial on this road.",
    iii: "A crossroads trial.",
    iv: "Deeper still.",
    v: "Another crossroads.",
    vi: "Shadow rises — Venger’s hand is in this.",
    vii: "Night’s crossroads.",
    viii: "The Door approaches.",
    ix: "The Way Home. Fail, and the Realm keeps you.",
  };
  showDialogue({
    scene: spec.scene || "woods",
    phase: phaseLabel(ch),
    speaker: ch === "vi" || ch === "ix" ? "Venger" : "Dungeon Master",
    role: ch === "vi" || ch === "ix" ? "Force of Evil" : "A trial",
    text:
      ch === "vi"
        ? `Children on ${ROUTES[state.route].name}. I am Venger. Pass my mark — or wander.`
        : ch === "ix"
          ? "Keep your scratches. The Way Home is not a gift. Solve — or stay."
          : introText[ch] || "Begin.",
    puzzle: () => playPuzzle(spec),
  });
}

function playPuzzle(spec) {
  state.puzzleSpec = spec;
  state.puzzleKind = spec.kind;
  const map = {
    gifts: renderGifts,
    path: () => {
      state.pathCell = spec.start;
      state.pathTrail = [spec.start];
      renderPath(spec);
    },
    simon: () => renderSimon(spec),
    hat: () => renderHat(spec),
    sigils: () => renderSigils(spec),
    locks: () => renderLocks(spec),
    shards: () => renderShards(spec),
    waves: () => renderWaves(spec),
    formation: () => renderFormation(spec),
    dualSimon: () => renderDualSimon(spec),
    needle: () => renderNeedle(spec),
    illusion: () => renderIllusion(spec),
    choice: () => renderChoice(spec),
    echoTrail: () => renderEchoTrail(spec),
    shardStep: () => renderShardStep(spec),
    gauntlet: () => renderGauntlet(spec),
  };
  const fn = map[spec.kind];
  if (fn) fn();
}

function puzzleWin() {
  if (state._inGauntlet && state._gauntletSpec) {
    advanceGauntlet();
    return;
  }
  onPuzzleWin();
}

function puzzleFail(msg) {
  const extra = hurt(1);
  if (extra === null) return;
  const suffix = extra + (msg ? ` ${msg}` : "");
  const gSpec = state._inGauntlet ? state._gauntletSpec : null;
  if (gSpec?.resetBothOnFail) {
    state.gauntletPhase = 0;
    onPuzzleFail(suffix, () => {
      state.gauntletPhase = 0;
      runChapterPuzzle(state.chapter);
    });
    return;
  }
  if (gSpec) {
    const phase = gSpec.phases[state.gauntletPhase];
    onPuzzleFail(suffix, () => {
      showDialogue({
        scene: gSpec.scene,
        phase: phaseLabel(state.chapter),
        speaker: "Dungeon Master",
        role: "Again",
        text: phase.status || "Again.",
        puzzle: () => {
          state._inGauntlet = true;
          playPuzzle({ ...phase, scene: gSpec.scene });
          state._inGauntlet = true;
          state.puzzleSpec = gSpec;
        },
      });
    });
    return;
  }
  const spec = state.puzzleSpec;
  onPuzzleFail(suffix, () => {
    showDialogue({
      scene: spec.scene,
      phase: phaseLabel(state.chapter),
      speaker: "Dungeon Master",
      role: "Again",
      text: spec.status || "Again.",
      puzzle: () => playPuzzle(spec),
    });
  });
}

/* ---------- puzzle renderers ---------- */

function neighborsOf(i, cols, rows) {
  const c = i % cols;
  const r = Math.floor(i / cols);
  const out = [];
  if (c > 0) out.push(i - 1);
  if (c < cols - 1) out.push(i + 1);
  if (r > 0) out.push(i - cols);
  if (r < rows - 1) out.push(i + cols);
  return out;
}

function renderPath(spec) {
  state.puzzleKind = "path";
  const cols = spec.cols || 3;
  const rows = spec.rows || 4;
  const total = cols * rows;
  const orcs = new Set(spec.orcs || []);
  if (!state.pathTrail.length || state.pathCell === undefined) {
    state.pathCell = spec.start;
    state.pathTrail = [spec.start];
  }
  const labels = Array(total).fill("");
  labels[spec.start] = "You";
  labels[spec.goal] = "Goal";
  orcs.forEach((i) => {
    labels[i] = "Orc";
  });
  const mount = $("puzzle-mount");
  mount.innerHTML = `<p class="status" id="puzzle-status">${spec.status}</p>
    <div class="path-grid" style="grid-template-columns:repeat(${cols},1fr);max-width:${cols * 90}px" id="path-grid">
      ${labels
        .map((lab, i) => {
          const cls = [
            "path-cell",
            orcs.has(i) ? "orc" : "",
            i === spec.goal ? "uni" : "",
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
      if (!neighborsOf(state.pathCell, cols, rows).includes(i)) {
        $("puzzle-status").textContent = "Too far — step to a neighbor.";
        return;
      }
      if (orcs.has(i)) {
        state.pathCell = spec.start;
        state.pathTrail = [spec.start];
        puzzleFail("Orcs.");
        return;
      }
      state.pathCell = i;
      state.pathTrail.push(i);
      persist();
      flashFx(i === spec.goal ? "magic" : "step");
      if (i === spec.goal) {
        state.pathTrail = [];
        puzzleWin();
      } else renderPath(spec);
    });
  });
}

function renderSimon(spec) {
  state.puzzleKind = "simon";
  state.simonHeard = [];
  state.simonLocked = true;
  const song = spec.reverse ? [...spec.song].reverse() : spec.song;
  state._simonTarget = song;
  const mount = $("puzzle-mount");
  mount.innerHTML = `<p class="status" id="puzzle-status">${spec.status || "Watch…"}</p>
    <div class="crystal-row" id="simon-row">
      ${CRYSTAL_NAMES.map((n, i) => `<button type="button" class="crystal c${i}" data-i="${i}" disabled>${n}</button>`).join("")}
    </div>`;
  playSimonSong(song);
}

function playSimonSong(song) {
  const row = $("simon-row");
  if (!row) return;
  const buttons = [...row.querySelectorAll(".crystal")];
  state.simonLocked = true;
  buttons.forEach((b) => {
    b.disabled = true;
  });
  song.forEach((idx, step) => {
    setTimeout(() => {
      if (!$("simon-row")) return;
      buttons[idx].classList.add("on", "sing");
      flashFx("crystal");
      setTimeout(() => buttons[idx].classList.remove("on", "sing"), 380);
      if (step === song.length - 1) {
        setTimeout(() => {
          state.simonLocked = false;
          buttons.forEach((b) => {
            b.disabled = false;
            b.onclick = () => tapSimon(Number(b.dataset.i));
          });
          const st = $("puzzle-status");
          if (st) st.textContent = "Now answer — same order.";
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
  const target = state._simonTarget || [];
  const n = state.simonHeard.length;
  if (state.simonHeard[n - 1] !== target[n - 1]) {
    puzzleFail("Wrong note.");
    return;
  }
  if (n === target.length) puzzleWin();
}

function renderDualSimon(spec) {
  state.puzzleKind = "dualSimon";
  state.dualPhase = "A";
  state.dualHeard = [];
  state.simonLocked = true;
  state._dualSpec = spec;
  const mount = $("puzzle-mount");
  mount.innerHTML = `<p class="status" id="puzzle-status">${spec.status || "Layer A…"}</p>
    <div class="crystal-row" id="simon-row">
      ${CRYSTAL_NAMES.map((n, i) => `<button type="button" class="crystal c${i}" data-i="${i}" disabled>${n}</button>`).join("")}
    </div>`;
  playDualDemo();
}

function playDualDemo() {
  const spec = state._dualSpec;
  const full = [...spec.songA, ...spec.songB];
  const row = $("simon-row");
  if (!row) return;
  const buttons = [...row.querySelectorAll(".crystal")];
  buttons.forEach((b) => {
    b.disabled = true;
  });
  full.forEach((idx, step) => {
    setTimeout(() => {
      if (!$("simon-row")) return;
      buttons[idx].classList.add("on", "sing");
      flashFx("crystal");
      setTimeout(() => buttons[idx].classList.remove("on", "sing"), 380);
      if (step === full.length - 1) {
        setTimeout(() => {
          state.simonLocked = false;
          state.dualPhase = "A";
          state.dualHeard = [];
          buttons.forEach((b) => {
            b.disabled = false;
            b.onclick = () => tapDual(Number(b.dataset.i));
          });
          const st = $("puzzle-status");
          if (st) st.textContent = "Play layer A, then layer B.";
        }, 500);
      }
    }, 480 * step);
  });
}

function tapDual(i) {
  if (state.simonLocked) return;
  const spec = state._dualSpec;
  const target = state.dualPhase === "A" ? spec.songA : spec.songB;
  state.dualHeard.push(i);
  const n = state.dualHeard.length;
  if (state.dualHeard[n - 1] !== target[n - 1]) {
    puzzleFail("Wrong layer note.");
    return;
  }
  if (n === target.length) {
    if (state.dualPhase === "A") {
      state.dualPhase = "B";
      state.dualHeard = [];
      const st = $("puzzle-status");
      if (st) st.textContent = "Now layer B.";
    } else puzzleWin();
  }
}

function renderHat(spec) {
  state.puzzleKind = "hat";
  const mount = $("puzzle-mount");
  mount.innerHTML = `<p class="status" id="puzzle-status">${spec.status}</p>
    <div class="hat-row">
      ${spec.items.map((it) => `<button type="button" class="hat-item" data-id="${it.id}">${it.label}</button>`).join("")}
    </div>`;
  mount.querySelectorAll(".hat-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.id === spec.answer) {
        btn.classList.add("correct");
        puzzleWin();
      } else {
        btn.classList.add("wrong");
        puzzleFail();
      }
    });
  });
}

function renderSigils(spec) {
  state.puzzleKind = "sigils";
  state.sigils = [];
  state.simonLocked = true;
  const mount = $("puzzle-mount");
  mount.innerHTML = `<p class="status" id="puzzle-status">${spec.status}</p>
    <div class="sigil-row" id="sigil-row">
      ${spec.marks.map((m) => `<button type="button" class="sigil" data-id="${m.id}" disabled>${m.label}</button>`).join("")}
    </div>`;
  const buttons = [...mount.querySelectorAll(".sigil")];
  spec.song.forEach((id, step) => {
    setTimeout(() => {
      if (!$("sigil-row")) return;
      const b = buttons.find((el) => el.dataset.id === id);
      if (b) {
        b.classList.add("on");
        flashFx("venger");
        setTimeout(() => b.classList.remove("on"), 420);
      }
      if (step === spec.song.length - 1) {
        setTimeout(() => {
          state.simonLocked = false;
          buttons.forEach((el) => {
            el.disabled = false;
            el.addEventListener("click", () => tapSigil(el.dataset.id, spec));
          });
          const st = $("puzzle-status");
          if (st) st.textContent = "Write the marks back.";
        }, 480);
      }
    }, 700 * step);
  });
}

function tapSigil(id, spec) {
  if (state.simonLocked) return;
  const btn = document.querySelector(`.sigil[data-id="${id}"]`);
  if (btn) {
    btn.classList.add("on");
    setTimeout(() => btn.classList.remove("on"), 280);
  }
  state.sigils.push(id);
  const n = state.sigils.length;
  if (state.sigils[n - 1] !== spec.song[n - 1]) {
    puzzleFail("Wrong scripture.");
    return;
  }
  if (n === spec.song.length) puzzleWin();
}

function renderLocks(spec) {
  state.puzzleKind = "locks";
  state.lockHeard = [];
  const mount = $("puzzle-mount");
  mount.innerHTML = `<p class="status" id="puzzle-status">${spec.status}</p>
    <div class="gift-row">
      ${spec.locks.map((l) => `<button type="button" class="gift-card" data-id="${l.id}">${l.label}</button>`).join("")}
    </div>`;
  mount.querySelectorAll(".gift-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.lockHeard.push(btn.dataset.id);
      const n = state.lockHeard.length;
      if (state.lockHeard[n - 1] !== spec.answer[n - 1]) {
        btn.classList.add("wrong");
        puzzleFail("Wrong lock order.");
        return;
      }
      btn.classList.add("correct");
      if (n === spec.answer.length) puzzleWin();
      else {
        const st = $("puzzle-status");
        if (st) st.textContent = `Lock ${n + 1} of ${spec.answer.length}…`;
      }
    });
  });
}

function renderShards(spec) {
  state.puzzleKind = "shards";
  state.shardHeard = [];
  const mount = $("puzzle-mount");
  mount.innerHTML = `<p class="status" id="puzzle-status">${spec.status}</p>
    <div class="hat-row">
      ${spec.items.map((it) => `<button type="button" class="hat-item" data-id="${it.id}">${it.label}</button>`).join("")}
    </div>`;
  mount.querySelectorAll(".hat-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (spec.mode === "pick") {
        if (btn.dataset.id === spec.answer) {
          btn.classList.add("correct");
          puzzleWin();
        } else {
          btn.classList.add("wrong");
          puzzleFail("False shard.");
        }
        return;
      }
      state.shardHeard.push(btn.dataset.id);
      const n = state.shardHeard.length;
      if (state.shardHeard[n - 1] !== spec.answer[n - 1]) {
        btn.classList.add("wrong");
        puzzleFail("Wrong order.");
        return;
      }
      btn.classList.add("correct");
      btn.disabled = true;
      if (n === spec.answer.length) puzzleWin();
    });
  });
}

function renderWaves(spec) {
  state.puzzleKind = "waves";
  state.waveHeard = [];
  const mount = $("puzzle-mount");
  mount.innerHTML = `<p class="status" id="puzzle-status">${spec.status}</p>
    <p class="status" id="wave-progress">Command 1 of ${spec.pattern.length}</p>
    <div class="gift-row">
      ${spec.moves.map((m) => `<button type="button" class="gift-card" data-id="${m.id}">${m.label}</button>`).join("")}
    </div>`;
  mount.querySelectorAll(".gift-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.waveHeard.push(btn.dataset.id);
      const n = state.waveHeard.length;
      if (state.waveHeard[n - 1] !== spec.pattern[n - 1]) {
        btn.classList.add("wrong");
        puzzleFail("Broken line.");
        return;
      }
      flashFx("shield");
      if (n === spec.pattern.length) puzzleWin();
      else {
        const p = $("wave-progress");
        if (p) p.textContent = `Command ${n + 1} of ${spec.pattern.length}`;
      }
    });
  });
}

function renderIllusion(spec) {
  state.puzzleKind = "illusion";
  state.illusionPicked = [];
  const mount = $("puzzle-mount");
  mount.innerHTML = `<p class="status" id="puzzle-status">${spec.status}</p>
    <div class="hat-row">
      ${spec.tiles
        .map(
          (t) =>
            `<button type="button" class="hat-item ${t.real ? "is-real" : "is-fake"}" data-id="${t.id}" data-real="${t.real}">${t.label}</button>`
        )
        .join("")}
    </div>`;
  mount.querySelectorAll(".hat-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const real = btn.dataset.real === "true";
      if (!real) {
        btn.classList.add("wrong");
        puzzleFail("Illusion.");
        return;
      }
      btn.classList.add("correct");
      btn.disabled = true;
      state.illusionPicked.push(btn.dataset.id);
      if (state.illusionPicked.length >= spec.need) puzzleWin();
    });
  });
}

function renderNeedle(spec) {
  state.puzzleKind = "needle";
  state.needleHeard = [];
  const mount = $("puzzle-mount");
  mount.innerHTML = `<p class="status" id="puzzle-status">${spec.status}</p>
    <div class="gift-row">
      ${spec.faces.map((f) => `<button type="button" class="gift-card" data-id="${f}">Face ${f}</button>`).join("")}
    </div>`;
  mount.querySelectorAll(".gift-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.needleHeard.push(btn.dataset.id);
      const n = state.needleHeard.length;
      if (state.needleHeard[n - 1] !== spec.steps[n - 1]) {
        btn.classList.add("wrong");
        puzzleFail("Needle spins wild.");
        return;
      }
      btn.classList.add("correct");
      if (n === spec.steps.length) puzzleWin();
    });
  });
}

function renderEchoTrail(spec) {
  state.puzzleKind = "echoTrail";
  state.echoHeard = [];
  state.simonLocked = true;
  state._echoSeq = spec.sequence || [];
  const pads = spec.pads || 4;
  const labels = spec.labels || Array.from({ length: pads }, (_, i) => `Step ${i + 1}`);
  const mount = $("puzzle-mount");
  mount.innerHTML = `<p class="status" id="puzzle-status">${spec.status || "Watch the lit trail…"}</p>
    <div class="crystal-row" id="echo-row">
      ${labels
        .map(
          (lab, i) =>
            `<button type="button" class="crystal c${i % 4} echo-pad" data-i="${i}" disabled>${lab}</button>`
        )
        .join("")}
    </div>`;
  const buttons = [...mount.querySelectorAll(".echo-pad")];
  const seq = state._echoSeq;
  seq.forEach((idx, step) => {
    setTimeout(() => {
      if (!$("echo-row")) return;
      buttons[idx]?.classList.add("on", "sing");
      flashFx("step");
      setTimeout(() => buttons[idx]?.classList.remove("on", "sing"), 400);
      if (step === seq.length - 1) {
        setTimeout(() => {
          state.simonLocked = false;
          buttons.forEach((b) => {
            b.disabled = false;
            b.onclick = () => tapEcho(Number(b.dataset.i));
          });
          const st = $("puzzle-status");
          if (st) st.textContent = "Walk the echo — same order.";
        }, 480);
      }
    }, 560 * step);
  });
}

function tapEcho(i) {
  if (state.simonLocked) return;
  const btn = document.querySelector(`.echo-pad[data-i="${i}"]`);
  if (btn) {
    btn.classList.add("on");
    setTimeout(() => btn.classList.remove("on"), 260);
  }
  state.echoHeard.push(i);
  const seq = state._echoSeq || [];
  const n = state.echoHeard.length;
  if (state.echoHeard[n - 1] !== seq[n - 1]) {
    puzzleFail("The trail forgets you.");
    return;
  }
  if (n === seq.length) puzzleWin();
}

function renderShardStep(spec) {
  state.puzzleKind = "shardStep";
  state._shardStepSpec = spec;
  state._shardStepPhase = "pick";
  state.needleHeard = [];
  drawShardStepPick(spec);
}

function drawShardStepPick(spec) {
  const mount = $("puzzle-mount");
  mount.innerHTML = `<p class="status" id="puzzle-status">${spec.status || "First — the true shard."}</p>
    <div class="hat-row">
      ${spec.items.map((it) => `<button type="button" class="hat-item" data-id="${it.id}">${it.label}</button>`).join("")}
    </div>`;
  mount.querySelectorAll(".hat-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.id === spec.answer) {
        btn.classList.add("correct");
        flashFx("magic");
        state._shardStepPhase = "needle";
        drawShardStepNeedle(spec);
      } else {
        btn.classList.add("wrong");
        puzzleFail("False shard.");
      }
    });
  });
}

function drawShardStepNeedle(spec) {
  state.needleHeard = [];
  const mount = $("puzzle-mount");
  const faces = spec.faces || ["N", "E", "S", "W"];
  mount.innerHTML = `<p class="status" id="puzzle-status">${spec.needleStatus || "Now face the needle’s order."}</p>
    <div class="gift-row">
      ${faces.map((f) => `<button type="button" class="gift-card" data-id="${f}">Face ${f}</button>`).join("")}
    </div>`;
  mount.querySelectorAll(".gift-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.needleHeard.push(btn.dataset.id);
      const n = state.needleHeard.length;
      if (state.needleHeard[n - 1] !== spec.steps[n - 1]) {
        btn.classList.add("wrong");
        puzzleFail("Needle spins wild.");
        return;
      }
      btn.classList.add("correct");
      if (n === spec.steps.length) puzzleWin();
    });
  });
}

function renderChoice(spec) {
  state.puzzleKind = "choice";
  const answer = spec.answerFromLeader ? state.leaderId : spec.answer;
  const mount = $("puzzle-mount");
  mount.innerHTML = `<p class="status" id="puzzle-status">${spec.status}</p>
    <div class="hat-row">
      ${spec.options.map((o) => `<button type="button" class="hat-item" data-id="${o.id}">${o.label}</button>`).join("")}
    </div>`;
  mount.querySelectorAll(".hat-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.id === answer) {
        btn.classList.add("correct");
        puzzleWin();
      } else {
        btn.classList.add("wrong");
        puzzleFail();
      }
    });
  });
}

function renderFormation(spec) {
  state.puzzleKind = "formation";
  state.formationAssign = {};
  state.activePost = spec.posts[0].id;
  const mount = $("puzzle-mount");
  const draw = () => {
    mount.innerHTML = `<p class="status" id="puzzle-status">${spec.status}</p>
      <p class="status">Assign: <strong>${spec.posts.find((p) => p.id === state.activePost)?.label}</strong></p>
      <div class="gift-row" id="post-row">
        ${spec.posts
          .map((p) => {
            const who = state.formationAssign[p.id];
            const name = who ? HEROES.find((h) => h.id === who)?.name : "—";
            return `<button type="button" class="gift-card ${p.id === state.activePost ? "correct" : ""}" data-post="${p.id}">${p.label}: ${name}</button>`;
          })
          .join("")}
      </div>
      <div class="hat-row" id="hero-row">
        ${spec.heroes
          .map((id) => {
            const h = HEROES.find((x) => x.id === id);
            const used = Object.values(state.formationAssign).includes(id);
            return `<button type="button" class="hat-item" data-id="${id}" ${used ? "disabled" : ""}>${h.name}</button>`;
          })
          .join("")}
      </div>`;
    mount.querySelectorAll("[data-post]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.activePost = btn.dataset.post;
        draw();
      });
    });
    mount.querySelectorAll("#hero-row .hat-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        state.formationAssign[state.activePost] = btn.dataset.id;
        const next = spec.posts.find((p) => !state.formationAssign[p.id]);
        if (next) state.activePost = next.id;
        const done = spec.posts.every((p) => state.formationAssign[p.id]);
        if (done) {
          const ok = spec.posts.every((p) => state.formationAssign[p.id] === p.need);
          if (ok) puzzleWin();
          else {
            puzzleFail("Wrong posts.");
          }
        } else draw();
      });
    });
  };
  draw();
}

function renderGauntlet(spec) {
  state.puzzleKind = "gauntlet";
  state._inGauntlet = true;
  state._gauntletSpec = spec;
  if (spec.noSkillRefresh) state.skillUsed = true;
  const phase = spec.phases[state.gauntletPhase];
  const merged = { ...phase, scene: spec.scene || phase.scene };
  state.puzzleSpec = { ...spec, ...merged, kind: phase.kind };
  playPuzzle(merged);
  state._inGauntlet = true;
  state.puzzleSpec = spec;
}

function advanceGauntlet() {
  const spec = state._gauntletSpec;
  state.gauntletPhase += 1;
  if (state.gauntletPhase >= spec.phases.length) {
    state._inGauntlet = false;
    state.puzzleSpec = spec;
    onPuzzleWin();
    return;
  }
  flashFx("magic");
  const phase = spec.phases[state.gauntletPhase];
  showDialogue({
    scene: spec.scene,
    phase: phaseLabel(state.chapter),
    speaker: "Dungeon Master",
    role: "Next trial",
    text: phase.status || "Continue the gauntlet.",
    puzzle: () => {
      state._inGauntlet = true;
      const merged = { ...phase, scene: spec.scene };
      playPuzzle(merged);
      state._inGauntlet = true;
      state.puzzleSpec = spec;
    },
  });
}

function homeEpilogue() {
  state.chapter = "x";
  state.puzzle = null;
  setBeat("homeEpilogue");
  const L = leader();
  const line = homeClosingLine(state.route, L.name);
  flashFx("magic");
  showDialogue({
    scene: "ending",
    phase: phaseLabel("x"),
    speaker: "Dungeon Master",
    role: "Guide of the Realm",
    text: `The Door of Home opens like a page remembering its carnival.\n\n${line}\n\nTiamat’s silhouette fades. Venger is a bruise on a far cloud. The Circle of Six still walks as one — and the ride that was a river of light becomes a ride again.`,
    choices: [{ label: "Play again with another leader", onClick: resetToTitle }],
  });
}

function resetToTitle() {
  clearSave();
  state.beat = "title";
  state.leaderId = null;
  state.hp = MAX_HP;
  resetRunFlags();
  document.getElementById("app").classList.remove("game-over-active");
  setScene("title");
  $("dialogue").hidden = true;
  $("hud").hidden = true;
  $("portrait-stage").hidden = true;
  $("game-over-screen").hidden = true;
  $("select-screen").hidden = true;
  $("title-screen").hidden = false;
}

function useLeaderSkill() {
  if (state.skillUsed || !leader() || !state.puzzle) return;
  if (state.puzzleSpec?.noSkillRefresh && state.skillUsed) return;
  const L = leader();
  const status = $("puzzle-status");
  const note = (msg) => {
    if (status) status.textContent = msg;
  };
  const kind = state.puzzleKind;
  const spec = state.puzzleSpec;

  if (L.skill === "shield") {
    state.shieldArmed = true;
    state.skillUsed = true;
    note("Eric plants the shield. The next mistake will not cut you.");
    syncSkillChip();
    persist();
    return;
  }

  if (kind === "gifts" && (L.skill === "eye" || L.skill === "step")) {
    const names = { cloak: "Sheila’s cloak", bow: "Hank’s bow", hat: "Presto’s hat" };
    note(`The true gift is ${names[GIFT_ROUNDS[state.giftRound].answer]}.`);
    state.skillUsed = true;
  } else if (kind === "path" && (L.skill === "eye" || L.skill === "grace" || L.skill === "stone")) {
    if (L.skill === "stone") {
      document.querySelector(".path-cell.uni")?.classList.add("hint");
      note("Uni’s horn flashes from the goal.");
    } else {
      document.querySelectorAll(".path-cell").forEach((el) => {
        const i = Number(el.dataset.i);
        const cols = spec.cols || 3;
        const rows = spec.rows || 4;
        const orcs = new Set(spec.orcs || []);
        if (neighborsOf(state.pathCell, cols, rows).includes(i) && !orcs.has(i)) el.classList.add("hint");
      });
      note("Safe neighbors glimmer.");
    }
    state.skillUsed = true;
  } else if ((kind === "simon" || kind === "dualSimon") && (L.skill === "step" || L.skill === "eye" || L.skill === "spark")) {
    if (kind === "simon") {
      const t = state._simonTarget || [];
      const next = t[state.simonHeard.length];
      note(`Next note: ${CRYSTAL_NAMES[next]}.`);
    } else {
      const sp = state._dualSpec;
      const t = state.dualPhase === "A" ? sp.songA : sp.songB;
      const next = t[state.dualHeard.length];
      note(`Next (${state.dualPhase}): ${CRYSTAL_NAMES[next]}.`);
    }
    state.skillUsed = true;
  } else if (kind === "hat" && (L.skill === "spark" || L.skill === "eye")) {
    note("Not the obvious key — warmth and wonder.");
    document.querySelector(`.hat-item[data-id="${spec.answer}"]`)?.classList.add("hint");
    state.skillUsed = true;
  } else if (kind === "sigils" && (L.skill === "eye" || L.skill === "step")) {
    const next = spec.song[state.sigils.length];
    note(`Next mark: ${next}.`);
    state.skillUsed = true;
  } else if (kind === "locks" && (L.skill === "step" || L.skill === "eye")) {
    note(`Next lock: ${spec.answer[state.lockHeard.length]}.`);
    state.skillUsed = true;
  } else if (kind === "shards" && (L.skill === "eye" || L.skill === "step")) {
    if (spec.mode === "pick") note("The warm true shard.");
    else note(`Next: ${spec.answer[state.shardHeard.length]}.`);
    state.skillUsed = true;
  } else if (kind === "waves" && (L.skill === "eye" || L.skill === "stone")) {
    note(`Next command: ${spec.pattern[state.waveHeard.length]}.`);
    state.skillUsed = true;
  } else if (kind === "needle" && (L.skill === "eye" || L.skill === "grace")) {
    note(`Face ${spec.steps[state.needleHeard.length]} next.`);
    state.skillUsed = true;
  } else if (kind === "echoTrail" && (L.skill === "eye" || L.skill === "step" || L.skill === "grace")) {
    const seq = state._echoSeq || [];
    const next = seq[state.echoHeard.length];
    note(typeof next === "number" ? `Next echo pad: ${next + 1}.` : "Watch again when you can.");
    state.skillUsed = true;
  } else if (kind === "shardStep" && (L.skill === "eye" || L.skill === "step")) {
    const ss = state._shardStepSpec || spec;
    if (state._shardStepPhase === "pick") {
      note("The warm true shard.");
      document.querySelector(`.hat-item[data-id="${ss.answer}"]`)?.classList.add("hint");
    } else {
      note(`Face ${ss.steps[state.needleHeard.length]} next.`);
    }
    state.skillUsed = true;
  } else if (kind === "illusion" && (L.skill === "step" || L.skill === "eye")) {
    document.querySelectorAll('.hat-item[data-real="true"]').forEach((el) => el.classList.add("hint"));
    note("True tiles shimmer.");
    state.skillUsed = true;
  } else if (kind === "choice" && (L.skill === "eye" || L.skill === "spark")) {
    const ans = spec.answerFromLeader ? state.leaderId : spec.answer;
    note(`The truth is marked in your heart: ${ans}.`);
    state.skillUsed = true;
  } else if (kind === "formation" && (L.skill === "eye" || L.skill === "grace")) {
    const post = spec.posts.find((p) => p.id === state.activePost);
    if (post) note(`This post wants ${HEROES.find((h) => h.id === post.need)?.name}.`);
    state.skillUsed = true;
  } else {
    note(`${L.name}’s gift cannot read this trial. Save it.`);
    return;
  }
  syncSkillChip();
  persist();
}

function applySave(data) {
  state.beat = data.beat;
  state.chapter = data.chapter || "i";
  state.route = data.route || null;
  state.fork3 = data.fork3 || null;
  state.fork5 = data.fork5 || null;
  state.fork7 = data.fork7 || null;
  state.leaderId = data.leaderId ?? null;
  state.hp = typeof data.hp === "number" ? data.hp : MAX_HP;
  state.skillUsed = !!data.skillUsed;
  state.shieldArmed = !!data.shieldArmed;
  state.giftRound = typeof data.giftRound === "number" ? data.giftRound : 0;
  state.gauntletPhase = typeof data.gauntletPhase === "number" ? data.gauntletPhase : 0;
  state.pathCell = typeof data.pathCell === "number" ? data.pathCell : 0;
  state.pathTrail = Array.isArray(data.pathTrail) ? data.pathTrail : [];
}

function resumeFromSave(data) {
  applySave(data);
  if (data.beat === "gameover") {
    showGameOver();
    return;
  }
  if (data.beat === "select") {
    startSelect();
    return;
  }
  if (!state.leaderId || !HEROES.some((h) => h.id === state.leaderId)) {
    clearSave();
    return;
  }
  renderParty();
  setHp();

  if (data.beat === "intro" || data.beat === "callingAsk" || data.beat === "callingGifts") {
    intro();
    return;
  }
  if (data.beat === "giftPuzzle") {
    giftPuzzle({ resume: true });
    return;
  }
  if (data.beat === "routeFork") {
    routeFork();
    return;
  }
  if (data.beat?.startsWith("fork-")) {
    const ch = data.beat.replace("fork-", "");
    showFork(ch);
    return;
  }
  if (data.beat?.startsWith("ch-") || data.beat?.startsWith("puzzle-")) {
    const ch = data.chapter || data.beat.replace(/^(ch|puzzle)-/, "");
    if (ch === "x") homeEpilogue();
    else beginChapter(ch);
    return;
  }
  if (data.beat === "homeEpilogue") {
    homeEpilogue();
    return;
  }
  if (state.route && state.chapter) {
    beginChapter(state.chapter);
    return;
  }
  intro();
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
$("btn-rise").addEventListener("click", resetToTitle);
$("skill-chip").addEventListener("click", useLeaderSkill);
setScene("title");
syncMusicButton();

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopBgm();
  else if (musicWanted) startBgm();
});
window.addEventListener("pagehide", stopBgm);

const boot = new URLSearchParams(location.search);
const saved = readSave();
if (boot.get("screen") === "select") {
  startSelect();
} else if (boot.get("screen") === "play") {
  state.leaderId = boot.get("leader") || "hank";
  state.hp = MAX_HP;
  resetRunFlags();
  renderParty();
  setHp();
  intro();
} else if (saved && saved.beat && saved.beat !== "title") {
  resumeFromSave(saved);
}
