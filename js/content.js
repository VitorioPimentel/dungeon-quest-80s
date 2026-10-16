const HEROES = [
  {
    id: "hank",
    name: "Hank",
    cls: "Ranger",
    skill: "eye",
    color: "#2d6b3c",
    blurb: "Energy bow, green ranger kit, the one who keeps the party on the trail.",
    line: "Stay together. I’ll keep the trail.",
  },
  {
    id: "eric",
    name: "Eric",
    cls: "Cavalier",
    skill: "shield",
    color: "#e05aa0",
    blurb: "Shield up, cape flying — he’ll complain, then he’ll hold the line.",
    line: "If anyone is getting home in one piece, it’s me. Possibly all of you too.",
  },
  {
    id: "diana",
    name: "Diana",
    cls: "Acrobat",
    skill: "grace",
    color: "#e85a28",
    blurb: "Staff, gold circlet, and a leap that treats cliffs like stairs.",
    line: "If it can be climbed, crossed, or outrun — I’ll go first.",
  },
  {
    id: "presto",
    name: "Presto",
    cls: "Magician",
    skill: "spark",
    color: "#3d4db8",
    blurb: "The hat is bigger than his nerves. Spells… sometimes.",
    line: "I-I have a spell for this. Probably. Don’t blink.",
  },
  {
    id: "sheila",
    name: "Sheila",
    cls: "Thief",
    skill: "step",
    color: "#6b2d8a",
    blurb: "Purple cloak of invisibility, Bobby’s sister, the quiet lockpick of the six.",
    line: "I’ll find the lock. You keep Venger’s eyes off me.",
  },
  {
    id: "bobby",
    name: "Bobby",
    cls: "Barbarian",
    skill: "stone",
    color: "#3d8a4a",
    blurb: "Horned helm, club, and Uni at his heel. Smallest — not the least stubborn.",
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

const PORTRAIT = {
  hank: "assets/characters/hank.jpg",
  eric: "assets/characters/eric.jpg",
  diana: "assets/characters/diana.jpg",
  presto: "assets/characters/presto.jpg",
  sheila: "assets/characters/sheila.jpg",
  bobby: "assets/characters/bobby.jpg",
  venger: "assets/characters/venger.jpg",
  dm: "assets/characters/dm.jpg",
};

function portraitImg(src, alt) {
  return `<img src="${src}" alt="${alt}" draggable="false">`;
}

function portraitSvg(hero) {
  return portraitImg(PORTRAIT[hero.id], `${hero.name} the ${hero.cls}`);
}

function dmPortrait() {
  return portraitImg(PORTRAIT.dm, "Dungeon Master");
}

function vengerPortrait() {
  return portraitImg(PORTRAIT.venger, "Venger");
}

function leaderBonusLine(leader) {
  return {
    hank: "Hank’s energy bow finds truth in fog.",
    eric: "Eric’s shield drinks a blow meant for everyone.",
    diana: "Diana finds footholds on air itself.",
    presto: "Presto’s hat is wiser than his nerves.",
    sheila: "Sheila’s cloak drinks the dark, then walks through locked stories.",
    bobby: "Bobby’s club, and Uni’s horn, are a door the dark cannot close.",
  }[leader.id];
}
