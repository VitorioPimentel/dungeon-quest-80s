/** Quest registry: routes, chapters, and puzzle specs for the 10-chapter rebuild. */

const MAX_HP = 14;

const CHAPTER_META = {
  i: { roman: "I", title: "The Calling", phase: "I — The Calling" },
  ii: { roman: "II", title: "Into the Realm", phase: "II — Into the Realm" },
  iii: { roman: "III", title: "Crossroads", phase: "III — Crossroads" },
  iv: { roman: "IV", title: "Deeper Still", phase: "IV — Deeper Still" },
  v: { roman: "V", title: "Crossroads Again", phase: "V — Crossroads Again" },
  vi: { roman: "VI", title: "Shadow Rising", phase: "VI — Shadow Rising" },
  vii: { roman: "VII", title: "Crossroads of Night", phase: "VII — Crossroads of Night" },
  viii: { roman: "VIII", title: "The Door Approaches", phase: "VIII — The Door Approaches" },
  ix: { roman: "IX", title: "The Way Home", phase: "IX — The Way Home" },
  x: { roman: "X", title: "Home Again", phase: "X — Home Again" },
};

const ROUTES = {
  seeking: {
    id: "seeking",
    name: "The Road of Seeking",
    blurb: "Trail, locks, and Compass shards — the quiet path through the dark.",
    nudge: ["hank", "sheila"],
    endorse: {
      hank: "Hank’s bow already points toward tracks only a ranger would trust.",
      sheila: "Sheila’s cloak drinks a mile of dusk — locks prefer her fingers.",
      default: "The trail will answer whoever listens.",
    },
  },
  wonder: {
    id: "wonder",
    name: "The Road of Wonder",
    blurb: "Song, hat-logic, and illusions — home remembered as a spell.",
    nudge: ["presto", "diana"],
    endorse: {
      presto: "Presto’s hat fidgets toward music only magicians mishear correctly.",
      diana: "Diana already hears the beat in the air — leaps count as answers.",
      default: "Wonder opens for the brave and the curious alike.",
    },
  },
  stand: {
    id: "stand",
    name: "The Road of Standing",
    blurb: "Shield wall, orcs, and stubborn courage — home earned by not breaking.",
    nudge: ["eric", "bobby"],
    endorse: {
      eric: "Eric plants his boots. The Realm notices a wall where none stood.",
      bobby: "Bobby and Uni grin the same grin — doors fear small avalanches.",
      default: "Courage is a door the dark cannot latch.",
    },
  },
};

const GIFT_ROUNDS = [
  { clue: "It drinks the dark so a sister may walk unseen.", answer: "cloak" },
  { clue: "It fires light, not arrows of wood.", answer: "bow" },
  { clue: "It is never what was asked — and sometimes better.", answer: "hat" },
];

const CRYSTAL_NAMES = ["Ruby", "Gold", "Jade", "Sky"];

/** Fork choice labels shown before chapters iii, v, vii. */
const FORK_CHOICES = {
  seeking: {
    iii: [
      { id: "a", label: "Pick the locks the trees forgot" },
      { id: "b", label: "Walk the cloak’s shadow-steps" },
    ],
    v: [
      { id: "a", label: "Hunt the true Compass shard" },
      { id: "b", label: "Follow the Realm’s echo trail" },
    ],
    vii: [
      { id: "a", label: "Assemble the three shards" },
      { id: "b", label: "Lock and trail, woven as one" },
    ],
  },
  wonder: {
    iii: [
      { id: "a", label: "Ask the hat what it meant" },
      { id: "b", label: "Strike only what is real" },
    ],
    v: [
      { id: "a", label: "Leap Diana’s staff-grid" },
      { id: "b", label: "Hear the longer crystal braid" },
    ],
    vii: [
      { id: "a", label: "Braid two songs into one" },
      { id: "b", label: "Hat and song, answered together" },
    ],
  },
  stand: {
    iii: [
      { id: "a", label: "Circle the orc ring" },
      { id: "b", label: "Clear Uni’s charge lane" },
    ],
    v: [
      { id: "a", label: "Keep Bobby’s club-rhythm" },
      { id: "b", label: "Hold a harsher wave" },
    ],
    vii: [
      { id: "a", label: "Post the Circle at three doors" },
      { id: "b", label: "Endure a paired trial" },
    ],
  },
};

/**
 * Resolve puzzle spec for a route chapter.
 * @param {string} route
 * @param {string} chapter ii|iii|iv|v|vi|vii|viii|ix
 * @param {"a"|"b"|null} variant
 */
function getPuzzleSpec(route, chapter, variant) {
  const table = PUZZLE_TABLE[route];
  if (!table) return null;
  const entry = table[chapter];
  if (!entry) return null;
  if (typeof entry === "function") return entry(variant);
  if (entry.a || entry.b) return entry[variant || "a"];
  return entry;
}

const PUZZLE_TABLE = {
  seeking: {
    ii: {
      kind: "path",
      scene: "woods",
      status: "Cross the deep moss. Uni waits farther — more orcs guard the glade.",
      cols: 4,
      rows: 4,
      start: 12,
      goal: 2,
      orcs: [5, 6, 9, 11, 14],
      skill: "path",
    },
    iii: {
      a: {
        kind: "locks",
        scene: "woods",
        status: "Three locks. Touch them in the order the bark whispers.",
        locks: [
          { id: "root", label: "Root lock" },
          { id: "moon", label: "Moon lock" },
          { id: "thorn", label: "Thorn lock" },
        ],
        answer: ["moon", "root", "thorn"],
        skill: "locks",
      },
      b: {
        kind: "illusion",
        scene: "woods",
        status: "Shadow-steps: tap only the cloaked (true) tiles — skip the bright lies.",
        tiles: [
          { id: "1", label: "Bright leaf", real: false },
          { id: "2", label: "Cloaked root", real: true },
          { id: "3", label: "False gold", real: false },
          { id: "4", label: "Cloaked dew", real: true },
          { id: "5", label: "Cloaked path", real: true },
          { id: "6", label: "Sun trick", real: false },
        ],
        need: 3,
        skill: "illusion",
      },
    },
    iv: {
      kind: "needle",
      scene: "woods",
      status: "The Compass needle turns. Face N, E, S, W in the true order.",
      steps: ["N", "E", "S", "W"],
      faces: ["N", "E", "S", "W"],
      skill: "needle",
    },
    v: {
      a: {
        kind: "shards",
        scene: "cavern",
        status: "One shard still knows home. The others lie.",
        mode: "pick",
        items: [
          { id: "glass", label: "Glass glitter" },
          { id: "true", label: "Warm true shard" },
          { id: "ice", label: "Ice chip" },
          { id: "bone", label: "Bone splinter" },
        ],
        answer: "true",
        skill: "shards",
      },
      b: {
        kind: "echoTrail",
        scene: "woods",
        status: "The Realm lights a trail. Watch — then walk the echo.",
        pads: 4,
        labels: ["Oak", "Stone", "Dew", "Thorn"],
        sequence: [0, 2, 1, 3, 0],
        skill: "echoTrail",
      },
    },
    vi: {
      kind: "sigils",
      scene: "citadel",
      status: "Venger’s seeking-script. Watch — then write it back.",
      song: ["horn", "compass", "night", "horn"],
      marks: [
        { id: "night", label: "Night" },
        { id: "flame", label: "Flame" },
        { id: "horn", label: "Horn" },
        { id: "cloak", label: "Cloak" },
        { id: "compass", label: "Compass" },
      ],
      skill: "sigils",
    },
    vii: {
      a: {
        kind: "shards",
        scene: "citadel",
        status: "Assemble dawn → noon → dusk shards.",
        mode: "order",
        items: [
          { id: "dusk", label: "Dusk shard" },
          { id: "dawn", label: "Dawn shard" },
          { id: "noon", label: "Noon shard" },
        ],
        answer: ["dawn", "noon", "dusk"],
        skill: "shards",
      },
      b: {
        kind: "locks",
        scene: "citadel",
        status: "Trail-lock hybrid: thorn, then moon, then root.",
        locks: [
          { id: "root", label: "Root" },
          { id: "moon", label: "Moon" },
          { id: "thorn", label: "Thorn" },
        ],
        answer: ["thorn", "moon", "root"],
        skill: "locks",
      },
    },
    viii: {
      kind: "shards",
      scene: "citadel",
      status: "Set the three Compass fragments into the Door of Home.",
      mode: "order",
      items: [
        { id: "seek", label: "Seeking tip" },
        { id: "true", label: "True north" },
        { id: "home", label: "Homeward heel" },
      ],
      answer: ["seek", "true", "home"],
      skill: "shards",
    },
    ix: {
      kind: "gauntlet",
      scene: "citadel",
      status: "The Way Home — two phases, no mercy between them.",
      noSkillRefresh: true,
      phases: [
        {
          kind: "sigils",
          status: "Phase 1 — six night marks. Remember.",
          song: ["horn", "night", "compass", "horn", "night", "cloak"],
          marks: [
            { id: "night", label: "Night" },
            { id: "flame", label: "Flame" },
            { id: "horn", label: "Horn" },
            { id: "cloak", label: "Cloak" },
            { id: "compass", label: "Compass" },
          ],
        },
        {
          kind: "shardStep",
          status: "Phase 2 — claim the true shard, then face the needle.",
          needleStatus: "Shard claimed. Face N → W → E.",
          items: [
            { id: "glass", label: "Glass glitter" },
            { id: "true", label: "Warm true shard" },
            { id: "ice", label: "Ice chip" },
            { id: "bone", label: "Bone splinter" },
          ],
          answer: "true",
          faces: ["N", "E", "S", "W"],
          steps: ["N", "W", "E"],
        },
      ],
      resetBothOnFail: true,
      skill: "gauntlet",
    },
  },

  wonder: {
    ii: {
      kind: "simon",
      scene: "cavern",
      status: "The cavern sings seven notes. Listen, then answer.",
      song: [0, 2, 1, 3, 2, 0, 1],
      skill: "simon",
    },
    iii: {
      a: {
        kind: "hat",
        scene: "cavern",
        status: "The ice wants warmth and wonder — not a locksmith.",
        items: [
          { id: "chicken", label: "Rubber chicken" },
          { id: "key", label: "A tiny iron key" },
          { id: "butterfly", label: "A daylight butterfly" },
          { id: "map", label: "A map of Cleveland" },
          { id: "candle", label: "A birthday candle" },
        ],
        answer: "butterfly",
        skill: "hat",
      },
      b: {
        kind: "illusion",
        scene: "cavern",
        status: "Strike only what is real. Illusions glitter too much.",
        tiles: [
          { id: "a", label: "Glitter fox", real: false },
          { id: "b", label: "True stone", real: true },
          { id: "c", label: "Echo twin", real: false },
          { id: "d", label: "True moth", real: true },
          { id: "e", label: "Painted door", real: false },
          { id: "f", label: "True pool", real: true },
        ],
        need: 3,
        skill: "illusion",
      },
    },
    iv: {
      kind: "simon",
      scene: "cavern",
      status: "Reverse the cavern’s five-note song.",
      song: [0, 2, 1, 3, 2],
      reverse: true,
      skill: "simon",
    },
    v: {
      a: {
        kind: "path",
        scene: "woods",
        status: "Staff-leap grid — neighbors only, avoid the false footholds.",
        cols: 3,
        rows: 4,
        start: 9,
        goal: 0,
        // 9→10→7→6→3→0
        orcs: [2, 4, 11],
        skill: "path",
      },
      b: {
        kind: "simon",
        scene: "cavern",
        status: "A longer crystal braid — eight notes.",
        song: [1, 0, 2, 3, 1, 2, 0, 3],
        skill: "simon",
      },
    },
    vi: {
      kind: "sigils",
      scene: "citadel",
      status: "Illusion-citadel script. Watch Venger’s false night.",
      song: ["night", "cloak", "flame", "night"],
      marks: [
        { id: "night", label: "Night" },
        { id: "flame", label: "Flame" },
        { id: "horn", label: "Horn" },
        { id: "cloak", label: "Cloak" },
        { id: "compass", label: "Compass" },
      ],
      skill: "sigils",
    },
    vii: {
      a: {
        kind: "dualSimon",
        scene: "cavern",
        status: "Braid two short songs: play A then B in order shown.",
        songA: [0, 2, 1],
        songB: [3, 1],
        skill: "simon",
      },
      b: {
        kind: "hat",
        scene: "cavern",
        status: "Hat and song: what opens ice that remembers noon?",
        items: [
          { id: "key", label: "Iron key" },
          { id: "butterfly", label: "Daylight butterfly" },
          { id: "bell", label: "Glass bell" },
          { id: "chicken", label: "Rubber chicken" },
        ],
        answer: "butterfly",
        skill: "hat",
      },
    },
    viii: {
      kind: "choice",
      scene: "citadel",
      status: "Name the Door’s midday true name.",
      options: [
        { id: "fear", label: "Fear of Tiamat" },
        { id: "home", label: "The carnival’s true noon" },
        { id: "venger", label: "Venger’s mercy" },
        { id: "map", label: "A map of Cleveland" },
      ],
      answer: "home",
      skill: "choice",
    },
    ix: {
      kind: "gauntlet",
      scene: "citadel",
      status: "Dual wonder — two layers, then the name of home.",
      noSkillRefresh: true,
      phases: [
        {
          kind: "dualSimon",
          status: "Phase 1 — interleaved layers. Replay A then B.",
          songA: [0, 3, 1, 2],
          songB: [2, 0, 1],
        },
        {
          kind: "choice",
          status: "Phase 2 — speak the true name of home.",
          options: [
            { id: "citadel", label: "Venger’s citadel" },
            { id: "home", label: "The ride that became a river of light" },
            { id: "uni", label: "Uni’s meadow alone" },
            { id: "hat", label: "Whatever the hat coughs next" },
          ],
          answer: "home",
        },
      ],
      resetBothOnFail: true,
      skill: "gauntlet",
    },
  },

  stand: {
    ii: {
      kind: "waves",
      scene: "woods",
      status: "Hold the line — brace, charge, or guard as the Realm demands.",
      pattern: ["brace", "guard", "charge", "brace"],
      moves: [
        { id: "brace", label: "Brace" },
        { id: "charge", label: "Charge" },
        { id: "guard", label: "Guard" },
      ],
      skill: "waves",
    },
    iii: {
      a: {
        kind: "path",
        scene: "woods",
        status: "Circle the orc ring — neighbors only.",
        cols: 3,
        rows: 4,
        start: 9,
        goal: 1,
        orcs: [4, 6, 11],
        skill: "path",
      },
      b: {
        kind: "path",
        scene: "woods",
        status: "Uni’s charge lane — clear the corridor to her horn.",
        cols: 3,
        rows: 4,
        start: 10,
        goal: 1,
        orcs: [3, 5, 6, 8],
        skill: "path",
      },
    },
    iv: {
      kind: "waves",
      scene: "citadel",
      status: "Shield angles — block four strikes in order.",
      pattern: ["guard", "brace", "guard", "charge"],
      moves: [
        { id: "brace", label: "High brace" },
        { id: "charge", label: "Step-charge" },
        { id: "guard", label: "Low guard" },
      ],
      skill: "waves",
    },
    v: {
      a: {
        kind: "waves",
        scene: "woods",
        status: "Bobby’s club-rhythm — feel the four beats.",
        pattern: ["charge", "charge", "brace", "guard"],
        moves: [
          { id: "brace", label: "Plant" },
          { id: "charge", label: "Swing" },
          { id: "guard", label: "Cover Uni" },
        ],
        skill: "waves",
      },
      b: {
        kind: "waves",
        scene: "woods",
        status: "Harsher wave — six commands.",
        pattern: ["brace", "guard", "charge", "guard", "brace", "charge"],
        moves: [
          { id: "brace", label: "Brace" },
          { id: "charge", label: "Charge" },
          { id: "guard", label: "Guard" },
        ],
        skill: "waves",
      },
    },
    vi: {
      kind: "formation",
      scene: "citadel",
      status: "Citadel stand-off — post three heroes under fire.",
      posts: [
        { id: "gate", label: "Gate", need: "eric" },
        { id: "flank", label: "Flank", need: "diana" },
        { id: "horn", label: "Horn line", need: "bobby" },
      ],
      heroes: ["hank", "eric", "diana", "presto", "sheila", "bobby"],
      skill: "formation",
    },
    vii: {
      a: {
        kind: "formation",
        scene: "citadel",
        status: "Three doors — post the right hearts.",
        posts: [
          { id: "left", label: "Left door", need: "sheila" },
          { id: "center", label: "Center", need: "hank" },
          { id: "right", label: "Right door", need: "eric" },
        ],
        heroes: ["hank", "eric", "diana", "presto", "sheila", "bobby"],
        skill: "formation",
      },
      b: {
        kind: "gauntlet",
        scene: "woods",
        status: "Paired endurance — wave then path.",
        phases: [
          {
            kind: "waves",
            status: "First — three commands.",
            pattern: ["brace", "charge", "guard"],
            moves: [
              { id: "brace", label: "Brace" },
              { id: "charge", label: "Charge" },
              { id: "guard", label: "Guard" },
            ],
          },
          {
            kind: "path",
            status: "Second — reach Uni.",
            cols: 3,
            rows: 3,
            start: 6,
            goal: 1,
            orcs: [3, 5],
          },
        ],
        resetBothOnFail: false,
        skill: "gauntlet",
      },
    },
    viii: {
      kind: "formation",
      scene: "citadel",
      status: "Who braces the Door of Home?",
      posts: [
        { id: "brace", label: "Brace post", need: "eric" },
        { id: "watch", label: "Watch post", need: "hank" },
        { id: "heart", label: "Heart post", need: "bobby" },
      ],
      heroes: ["hank", "eric", "diana", "presto", "sheila", "bobby"],
      skill: "formation",
    },
    ix: {
      kind: "gauntlet",
      scene: "citadel",
      status: "Endurance gauntlet — three trials, no skill refresh.",
      noSkillRefresh: true,
      phases: [
        {
          kind: "waves",
          status: "Trial 1 — hold.",
          pattern: ["brace", "guard", "charge", "brace"],
          moves: [
            { id: "brace", label: "Brace" },
            { id: "charge", label: "Charge" },
            { id: "guard", label: "Guard" },
          ],
        },
        {
          kind: "path",
          status: "Trial 2 — advance.",
          cols: 3,
          rows: 4,
          start: 9,
          goal: 1,
          // 9→10→7→8→5→2→1
          orcs: [0, 4, 6, 11],
        },
        {
          kind: "choice",
          status: "Trial 3 — who opens the door home? (Your leader.)",
          options: [
            { id: "hank", label: "Hank" },
            { id: "eric", label: "Eric" },
            { id: "diana", label: "Diana" },
            { id: "presto", label: "Presto" },
            { id: "sheila", label: "Sheila" },
            { id: "bobby", label: "Bobby" },
          ],
          answerFromLeader: true,
        },
      ],
      resetBothOnFail: true,
      skill: "gauntlet",
    },
  },
};

function routeEndorse(routeId, leaderId) {
  const r = ROUTES[routeId];
  if (!r) return "";
  return r.endorse[leaderId] || r.endorse.default;
}

function homeClosingLine(routeId, leaderName) {
  return {
    seeking: `${leaderName} kept the trail. The Compass shard warms once — then becomes a carnival ticket stub.`,
    wonder: `${leaderName} named noon correctly. The hat, for once, produces nothing but home.`,
    stand: `${leaderName} did not break. The Door of Home opens like a shield lowering at last.`,
  }[routeId];
}
