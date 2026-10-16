const HEROES = [
  {
    id: "hank",
    name: "Hank",
    cls: "Ranger",
    skill: "eye",
    color: "#3b6ea8",
    blurb: "Calm bowman. He reads a trail the woods try to hide.",
    line: "Stay together. I’ll keep the trail.",
  },
  {
    id: "eric",
    name: "Eric",
    cls: "Cavalier",
    skill: "shield",
    color: "#c46ab0",
    blurb: "Proud, loud, and surprisingly hard to knock down.",
    line: "If anyone is getting home in one piece, it’s me. Possibly all of you too.",
  },
  {
    id: "diana",
    name: "Diana",
    cls: "Acrobat",
    skill: "grace",
    color: "#d4653a",
    blurb: "A staff, a leap, and courage that treats cliffs like stairs.",
    line: "If it can be climbed, crossed, or outrun — I’ll go first.",
  },
  {
    id: "presto",
    name: "Presto",
    cls: "Magician",
    skill: "spark",
    color: "#6b4adf",
    blurb: "His hat is braver than his nerves. The Realm likes that.",
    line: "I-I have a spell for this. Probably. Don’t blink.",
  },
  {
    id: "sheila",
    name: "Sheila",
    cls: "Thief",
    skill: "step",
    color: "#7a3a88",
    blurb: "Soft boots, a sharp mind, a cloak that drinks the dark.",
    line: "I’ll find the lock. You keep Venger’s eyes off me.",
  },
  {
    id: "bobby",
    name: "Bobby",
    cls: "Barbarian",
    skill: "stone",
    color: "#3e7a52",
    blurb: "Smallest of the six, with Uni and a club that believes in him.",
    line: "We can take him! Uni thinks so too.",
  },
];

const SKILL_LABEL = {
  eye: "Hunter’s Eye",
  shield: "Shield Wall",
  grace: "Acrobat’s Path",
  spark: "Hat-Magic",
  step: "Silent Step",
  stone: "Heart of Stone",
};

const SKILL_HELP = {
  eye: "Read the next stone in the woods’ song.",
  shield: "The next mistake will not cut the party.",
  grace: "Set the highest ring true.",
  spark: "Nudge one cavern ring toward the constellation.",
  step: "Hear the cavern’s next crystal note.",
  stone: "Uni points her horn at the first true stone.",
};

function portraitSvg(hero, size = 120) {
  const palettes = {
    hank: { cloak: "#2b5d9a", hair: "#c48a4a", skin: "#e8c8a0" },
    eric: { cloak: "#b64a98", hair: "#f0d48a", skin: "#f5d0b8" },
    diana: { cloak: "#c44a28", hair: "#2a1c14", skin: "#e8b090" },
    presto: { cloak: "#3a2a88", hair: "#6a3a20", skin: "#e0c0a0" },
    sheila: { cloak: "#5a2a68", hair: "#1a1018", skin: "#d4a090" },
    bobby: { cloak: "#2f6b3c", hair: "#6a3a18", skin: "#f0c8a0" },
  };
  const p = palettes[hero.id];
  const uid = `${hero.id}-${size}`;
  return `
    <svg viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true">
      <defs>
        <linearGradient id="g-${uid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.cloak}"/>
          <stop offset="1" stop-color="#12080c"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#g-${uid})"/>
      <circle cx="60" cy="92" r="40" fill="${p.cloak}"/>
      <ellipse cx="60" cy="50" rx="22" ry="26" fill="${p.skin}"/>
      <path d="M38 46 Q60 14 82 46" fill="${p.hair}"/>
      <circle cx="52" cy="52" r="3" fill="#22140c"/>
      <circle cx="68" cy="52" r="3" fill="#22140c"/>
      <path d="M52 64 Q60 70 68 64" fill="none" stroke="#7a4030" stroke-width="2"/>
      ${hero.id === "presto" ? `<path d="M28 42 L60 2 L92 42 Z" fill="#24145a"/><ellipse cx="60" cy="42" rx="36" ry="8" fill="#5a38a0"/><path d="M88 18 l8 -10 2 10" fill="#f0d45a"/>` : ""}
      ${hero.id === "hank" ? `<path d="M14 74 Q58 42 16 22" fill="none" stroke="#c9a45a" stroke-width="4"/><path d="M16 22 l10 6" stroke="#e8d8a8" stroke-width="2"/>` : ""}
      ${hero.id === "eric" ? `<path d="M78 80 h28 v24 h-28 z" fill="#d8c070"/><circle cx="92" cy="92" r="8" fill="#6a3a88"/>` : ""}
      ${hero.id === "sheila" ? `<path d="M40 70 Q60 110 80 70" fill="#3a1848" opacity=".55"/>` : ""}
      ${hero.id === "bobby" ? `<circle cx="94" cy="94" r="13" fill="#f4eef8"/><circle cx="90" cy="92" r="2"/><circle cx="98" cy="92" r="2"/><path d="M90 98 q4 3 8 0" stroke="#c48aa0" fill="none"/>` : ""}
      ${hero.id === "diana" ? `<rect x="16" y="70" width="6" height="36" rx="2" fill="#e8d8a8"/>` : ""}
    </svg>
  `;
}

function dmPortrait() {
  return `
    <svg viewBox="0 0 120 120" width="180" height="180" aria-hidden="true">
      <rect width="120" height="120" fill="#14281c"/>
      <path d="M18 112 L60 6 L102 112 Z" fill="#1f3d2c"/>
      <ellipse cx="60" cy="58" rx="16" ry="18" fill="#e6c8a0"/>
      <path d="M34 70 Q60 38 86 70 L86 112 L34 112 Z" fill="#243f30"/>
      <circle cx="54" cy="58" r="2" fill="#221"/><circle cx="66" cy="58" r="2" fill="#221"/>
    </svg>`;
}

function vengerPortrait() {
  return `
    <svg viewBox="0 0 120 120" width="180" height="180" aria-hidden="true">
      <rect width="120" height="120" fill="#1a0618"/>
      <path d="M20 112 L60 10 L100 112 Z" fill="#3a1038"/>
      <ellipse cx="60" cy="54" rx="18" ry="20" fill="#c9a090"/>
      <path d="M42 40 L60 8 L78 40" fill="#120816"/>
      <circle cx="52" cy="54" r="3" fill="#e25b5b"/>
      <circle cx="68" cy="54" r="3" fill="#e25b5b"/>
      <path d="M48 72 Q60 66 72 72" stroke="#6a2030" fill="none"/>
    </svg>`;
}

function leaderBonusLine(leader) {
  return {
    hank: "Hank’s arrows find truth in fog.",
    eric: "Eric’s shield drinks a blow meant for everyone.",
    diana: "Diana finds footholds on air itself.",
    presto: "Presto’s mistakes sometimes become miracles.",
    sheila: "Sheila walks through locked stories.",
    bobby: "Bobby’s courage is a door the dark cannot close.",
  }[leader.id];
}
