export interface SemanticHintConcept {
  word: string;
  hints: [string, string, string];
}

export const CURATED_CONCEPTS: SemanticHintConcept[] = [
  {
    word: 'guitar',
    hints: [
      'An acoustic or electric instrument designed with resonant strings.',
      'Played with fingers or a plectrum across a fretted wooden neck.',
      'Commonly provides rhythm and solos in rock, jazz, and flamenco melodies.',
    ],
  },
  {
    word: 'coffee',
    hints: [
      'A warm, dark roasted aromatic beverage cherished globally.',
      'Brewed from ground beans rich in stimulating natural caffeine.',
      'Commonly served as espresso, cappuccino, or cold brew.',
    ],
  },
  {
    word: 'diamond',
    hints: [
      'A mineral formed of pure crystallized carbon forged under deep geological pressure.',
      'The hardest known natural substance on the Mohs scale.',
      'Cut and polished with facets to refract brilliant sparkling light in jewelry.',
    ],
  },
  {
    word: 'mountain',
    hints: [
      'A massive elevated geological landform towering high above surrounding terrain.',
      'Characterized by steep rocky ridges, precipitous cliffs, and snow-dusted summits.',
      'Ascended by mountaineers pushing limits to reach panoramic peaks.',
    ],
  },
  {
    word: 'whisper',
    hints: [
      'A hushed, breathy mode of human vocal communication.',
      'Produced without vocal cord vibration to prevent being overheard.',
      'Shared softly and secretly directly into another listener’s ear.',
    ],
  },
  {
    word: 'camera',
    hints: [
      'An optical instrument engineered to capture and preserve moments in time.',
      'Utilizes precision lenses, variable apertures, and digital sensors to focus light.',
      'Used by visual storytellers to record photographs and motion cinematography.',
    ],
  },
  {
    word: 'castle',
    hints: [
      'A heavily fortified medieval architectural bastion of stone.',
      'Defended by deep moats, battlements, drawbridges, and watchtower turrets.',
      'Historic seat of medieval rulers, monarchs, and armored garrisons.',
    ],
  },
  {
    word: 'ocean',
    hints: [
      'A vast, interconnected planetary body of saline water enveloping the globe.',
      'Powers planetary thermal currents, weather systems, and oceanic ecosystems.',
      'Plunges to abyssal depths like the Mariana Trench and shelters coral reefs.',
    ],
  },
  {
    word: 'flame',
    hints: [
      'The visible, incandescent gaseous zone of thermal combustion.',
      'Emits radiant heat and light through rapid chemical exothermic oxidation.',
      'Ignited by sparks, matches, or lanterns to conquer cold and darkness.',
    ],
  },
  {
    word: 'compass',
    hints: [
      'A navigational instrument guiding travelers across uncharted territory.',
      'Houses a freely pivoting magnetized needle reacting to Earth’s magnetic field.',
      'Points reliably toward magnetic north across seas and wild frontiers.',
    ],
  },
  {
    word: 'labyrinth',
    hints: [
      'An intricate, convoluted maze of winding passages and dead-ends.',
      'Designed purposefully to bewilder, entrap, or test those seeking the center.',
      'Legendary in ancient Greek mythology for concealing the monstrous Minotaur.',
    ],
  },
  {
    word: 'galaxy',
    hints: [
      'A gigantic gravitationally bound cosmic system of stellar systems and nebulae.',
      'Composed of hundreds of billions of suns, orbital planets, and interstellar matter.',
      'Our own home spiral is designated the Milky Way.',
    ],
  },
  {
    word: 'pyramid',
    hints: [
      'A monumental ancient architectural wonder with sloped triangular stone faces.',
      'Erected in Giza and Mesoamerica as royal mortuary monuments and sacred temples.',
      'Tapers symmetrically from a square base to a single towering apex.',
    ],
  },
  {
    word: 'symphony',
    hints: [
      'An expansive, multi-movement orchestral masterpiece of harmonic design.',
      'Composed for a full ensemble of strings, brass, woodwinds, and percussion.',
      'Iconic historic examples were conducted by Beethoven, Mozart, and Mahler.',
    ],
  },
];

/**
 * Resolves the target word for a given date (defaulting to today UTC).
 */
export function getDailyTargetWord(dateStr?: string | null): string {
  const date = dateStr ? dateStr.split('T')[0] : new Date().toISOString().split('T')[0];
  const dateNum = date.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);
  const selected = CURATED_CONCEPTS[dateNum % CURATED_CONCEPTS.length];
  return selected.word.toUpperCase();
}

/**
 * Gets the semantic hints for a given date or known word.
 */
export function getSemanticHintsForTarget(dateStr?: string | null, knownWord?: string | null): [string, string, string] {
  if (knownWord) {
    const match = CURATED_CONCEPTS.find((c) => c.word.toLowerCase() === knownWord.toLowerCase());
    if (match) return match.hints;
  }
  const date = dateStr ? dateStr.split('T')[0] : new Date().toISOString().split('T')[0];
  const dateNum = date.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);
  const selected = CURATED_CONCEPTS[dateNum % CURATED_CONCEPTS.length];
  return selected.hints;
}

/**
 * Checks whether a given hint string is a generic placeholder.
 */
export function isGenericPlaceholderHint(hint: string): boolean {
  if (!hint || hint.trim().length === 0) return true;
  const genericPatterns = [
    /strongly associated with its primary category/i,
    /often encountered in practical or common/i,
    /specifically describes this unique target/i,
    /primary category classification/i,
    /semantic vector points within/i,
    /gravitationally bounded within/i,
    /orbit vector proximity/i,
  ];
  return genericPatterns.some((pattern) => pattern.test(hint));
}

/**
 * Takes an array of hints and upgrades any generic placeholders with rich semantic clues for the target.
 */
export function upgradeGenericHints(
  hints: string[],
  dateStr?: string | null,
  knownWord?: string | null
): string[] {
  const dynamicHints = getSemanticHintsForTarget(dateStr, knownWord);
  return hints.map((hint, idx) => {
    if (isGenericPlaceholderHint(hint)) {
      return dynamicHints[idx] || dynamicHints[dynamicHints.length - 1];
    }
    return hint;
  });
}
