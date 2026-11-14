/**
 * Utility to parse and format Legends of Runeterra rich markup text.
 * Handles tags:
 * - [k:KeywordId|Label]: Keywords / Rules / Triggers
 * - [cd:CardCode|Name|options]: Cards
 * - [c:ChampionId|Name]: Champions / Constellations
 * - [r:RelicCode|Name]: Relics
 * - [p:PowerCode|Name]: Powers
 * - [i:ItemCode|Name]: Items
 * - Stats like +X|+Y or X|Y
 * - Markdown bold (**text**)
 */

const TAG_REGEX = /\[([a-zA-Z0-9_-]+):([^\|\]]+)(?:\|([^\]]*))?\]/g;
const STAT_REGEX = /(?:^|\s)(\+?\d+\|\+?\d+)(?:\s|[.,:;!]|$)/g;

const KEYWORD_EN_MAP = {
  AutoEquip: 'Auto-Equip',
  QuickAttack: 'Quick Attack',
  DoubleAttack: 'Double Attack',
  RoundStart: 'Round Start',
  RoundEnd: 'Round End',
  SpellShield: 'SpellShield',
  PlayOrRoundStart: 'Play / Round Start',
  AttackCommit: 'Attack',
  SpellRefill: 'Spell Mana Refill'
};

/**
 * Formats a LoR keyword ID into standard English display text
 */
export function formatKeywordEn(id) {
  if (!id) return '';
  if (KEYWORD_EN_MAP[id]) return KEYWORD_EN_MAP[id];
  return id.replace(/([a-z])([A-Z])/g, '$1 $2');
}

/**
 * Strips all LoR markup tags and returns plain readable text
 */
export function stripLorMarkup(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  return rawText
    .replace(/\\n/g, '\n')
    .replace(TAG_REGEX, (match, prefix, id, extra) => {
      if (!extra) return id;
      const label = extra.split('|')[0];
      return label || id;
    })
    .replace(/<[^>]+>/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .trim();
}

/**
 * Parses raw text into an array of structured tokens for React rendering
 */
export function tokenizeLorText(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];

  // Normalize line breaks: Nhận diện cả ký tự xuống dòng thực tế, chuỗi escape \n và thẻ <br>
  const normalized = rawText
    .replace(/\\n/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?nobr>/gi, '');

  const tokens = [];
  let lastIndex = 0;

  // Find all [type:id|label] tags
  const regex = new RegExp(TAG_REGEX);
  let match;

  while ((match = regex.exec(normalized)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      const textChunk = normalized.substring(lastIndex, match.index);
      tokens.push(...tokenizeTextChunk(textChunk));
    }

    const prefix = match[1].toLowerCase();
    const id = match[2];
    const extraParts = (match[3] || '').split('|');
    const label = extraParts[0] || id;

    tokens.push({
      type: 'tag',
      tagType: prefix, // 'k', 'cd', 'c', 'r', 'p', 'i'
      id,
      label,
      extra: extraParts.slice(1)
    });

    lastIndex = regex.lastIndex;
  }

  // Trailing text
  if (lastIndex < normalized.length) {
    const trailingChunk = normalized.substring(lastIndex);
    tokens.push(...tokenizeTextChunk(trailingChunk));
  }

  return tokens;
}

/**
 * Sub-tokenizer for text chunks (handles stat numbers and bold)
 */
function tokenizeTextChunk(chunk) {
  if (!chunk) return [];
  const parts = [];

  // Split lines if any
  const lines = chunk.split('\n');
  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) {
      parts.push({ type: 'newline' });
    }

    if (!line) return;

    // Check for bullet list format: "- Text" or "* Text"
    let currentLine = line;
    const bulletMatch = currentLine.match(/^(\s*[-*]\s+)/);
    if (bulletMatch) {
      parts.push({ type: 'bullet' });
      currentLine = currentLine.substring(bulletMatch[0].length);
    }

    // Tokenize stats like +1|+1 or 4|3 within the line
    let charIdx = 0;
    const statRegex = /\b(\+?\d+\|\+?\d+)\b/g;
    let sMatch;

    while ((sMatch = statRegex.exec(currentLine)) !== null) {
      if (sMatch.index > charIdx) {
        parts.push({
          type: 'text',
          value: currentLine.substring(charIdx, sMatch.index)
        });
      }

      parts.push({
        type: 'stat',
        value: sMatch[1]
      });

      charIdx = statRegex.lastIndex;
    }

    if (charIdx < currentLine.length) {
      parts.push({
        type: 'text',
        value: currentLine.substring(charIdx)
      });
    }
  });

  return parts;
}
