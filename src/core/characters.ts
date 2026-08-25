export type CharacterId = "bird" | "neko" | "doge" | "hamster" | "dragon";
export type SoundType = "cat" | "dog" | "dragon" | "hamster" | "bird";

export interface CharacterDef {
  id: CharacterId;
  name: string;
  emoji: string;
  species: string;
  tagline: string;
  unlockType: "free" | "score" | "feathers" | "streak" | "playtime";
  unlockValue: number;
  primaryColor: number;
  bellyColor: number;
  accentColor: number;
  soundType: SoundType;
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  bird: {
    id: "bird",
    name: "Classic Peep",
    emoji: "🐥",
    species: "Retro Bird",
    tagline: "The OG arcade flyer",
    unlockType: "free",
    unlockValue: 0,
    primaryColor: 0xffd000, // Golden yellow
    bellyColor: 0xfff3b0,
    accentColor: 0xf77f00, // Orange beak
    soundType: "bird",
  },
  neko: {
    id: "neko",
    name: "Flappy Neko",
    emoji: "🐱",
    species: "Lucky Cat",
    tagline: "Pointy ears & fluffy meows",
    unlockType: "score",
    unlockValue: 40, // Tier 1 (Hero)
    primaryColor: 0xff9f1c, // Orange Tabby
    bellyColor: 0xfff8f0,
    accentColor: 0xff6b8b,
    soundType: "cat",
  },
  doge: {
    id: "doge",
    name: "Shiba Doge",
    emoji: "🐶",
    species: "Shiba Inu",
    tagline: "Much flap, very fly, wow!",
    unlockType: "score",
    unlockValue: 210, // Tier 4 (Hero)
    primaryColor: 0xe09f3e, // Golden Shiba
    bellyColor: 0xfffae0,
    accentColor: 0xd90429, // Red hero cape/collar
    soundType: "dog",
  },
  hamster: {
    id: "hamster",
    name: "Astro Hammy",
    emoji: "🐹",
    species: "Space Hamster",
    tagline: "Bubble saucer & jet thrusters",
    unlockType: "score",
    unlockValue: 560, // Tier 7 (Hero)
    primaryColor: 0xffb703, // Golden hamster
    bellyColor: 0xffeedb,
    accentColor: 0x00f5d4, // Cyan saucer
    soundType: "hamster",
  },
  dragon: {
    id: "dragon",
    name: "Chibi Dragon",
    emoji: "🐲",
    species: "Flame Drake",
    tagline: "Tiny wings, fiery spirit",
    unlockType: "score",
    unlockValue: 1250, // Tier 10 (Hero)
    primaryColor: 0x2ec4b6, // Jade / Teal dragon
    bellyColor: 0xcbf3f0,
    accentColor: 0xff9f1c, // Orange horns/spikes
    soundType: "dragon",
  },
};

export function isCharacterUnlocked(
  charId: CharacterId,
  unlockedList: string[] = ["bird"],
): boolean {
  if (charId === "bird" || unlockedList.includes(charId)) return true;
  return false;
}

export function isCharacterClaimable(
  charId: CharacterId,
  tokens: number,
  unlockedList: string[] = ["bird"],
): boolean {
  if (charId === "bird" || unlockedList.includes(charId)) return false;
  const def = CHARACTERS[charId];
  if (!def || def.unlockType === "free") return false;
  return tokens >= def.unlockValue;
}
