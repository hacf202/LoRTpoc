import { removeVietnameseTones } from './navShortcuts';

/**
 * Generates a clean, URL-safe ASCII slug for a champion
 * Converts Vietnamese diacritics, spaces, and punctuation into lowercase hyphenated slugs:
 * e.g. "Ahri Chiêu Hồn Thiên Hồ" -> "ahri-chieu-hon-thien-ho"
 * e.g. "Lux: rạng ngời" -> "lux-rang-ngoi"
 * e.g. "Rồng Ngàn Tuổi" -> "rong-ngan-tuoi"
 * e.g. "Aurelion Sol" -> "aurelion-sol"
 */
export function toChampionSlug(champOrName) {
  if (!champOrName) return '';
  const name = typeof champOrName === 'string'
    ? champOrName
    : (champOrName.name || champOrName.championID || champOrName.cardCode || '');

  return removeVietnameseTones(name)
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
