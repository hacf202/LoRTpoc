export function removeVietnameseTones(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

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
