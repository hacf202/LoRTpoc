export function getRarityBadgeStyle(r) {
  const lower = (r || '').toLowerCase();
  if (lower.includes('sử thi') || lower.includes('epic')) {
    return 'bg-purple-900/60 text-purple-200 border-purple-500/40';
  }
  if (lower.includes('hiếm') || lower.includes('rare')) {
    return 'bg-sky-900/60 text-sky-200 border-sky-500/40';
  }
  if (lower.includes('thường') || lower.includes('common')) {
    return 'bg-emerald-900/60 text-emerald-200 border-emerald-500/40';
  }
  if (lower.includes('huyền thoại') || lower.includes('legendary')) {
    return 'bg-amber-900/60 text-amber-200 border-amber-500/40';
  }
  return 'bg-slate-800 text-slate-300 border-white/10';
}

export function getTierTheme(tierStr) {
  const raw = (tierStr || '').toUpperCase();
  if (raw.includes('OP') || raw.includes('S+')) {
    return {
      badge: 'bg-rose-900/80 text-rose-200 border-rose-500',
      text: 'text-rose-300'
    };
  }
  if (raw.startsWith('S')) {
    return {
      badge: 'bg-amber-900/80 text-amber-200 border-amber-500',
      text: 'text-amber-300'
    };
  }
  if (raw.startsWith('A')) {
    return {
      badge: 'bg-sky-900/80 text-sky-200 border-sky-500',
      text: 'text-sky-300'
    };
  }
  if (raw.startsWith('B')) {
    return {
      badge: 'bg-emerald-900/80 text-emerald-200 border-emerald-500',
      text: 'text-emerald-300'
    };
  }
  if (raw.startsWith('C')) {
    return {
      badge: 'bg-slate-800 text-slate-300 border-slate-600',
      text: 'text-slate-400'
    };
  }
  if (raw.startsWith('D')) {
    return {
      badge: 'bg-stone-900 text-stone-300 border-stone-700',
      text: 'text-stone-400'
    };
  }
  return {
    badge: 'bg-slate-800 text-slate-300 border-white/10',
    text: 'text-slate-300'
  };
}

export function parseSuitableRelics(raw, isEn, champTranslations) {
  if (!raw) return { mandatory: [], options: [], description: '' };

  // 1. Legacy array of string codes
  if (Array.isArray(raw)) {
    if (raw.length > 0 && typeof raw[0] === 'string') {
      return { mandatory: raw, options: [], description: '' };
    }
    if (raw.length > 0 && typeof raw[0] === 'object') {
      return parseSuitableRelics(raw[0], isEn, champTranslations);
    }
    return { mandatory: [], options: [], description: '' };
  }

  // 2. Structured object
  if (typeof raw === 'object') {
    const mandatory = Array.isArray(raw.mandatory)
      ? raw.mandatory
      : (Array.isArray(raw.items) ? raw.items : (Array.isArray(raw.core) ? raw.core : []));

    let options = [];
    if (Array.isArray(raw.options)) {
      options = raw.options.map((opt) => {
        if (Array.isArray(opt)) return opt.filter(Boolean);
        if (typeof opt === 'string') return [opt];
        if (opt && typeof opt === 'object' && Array.isArray(opt.items)) return opt.items.filter(Boolean);
        return [];
      }).filter((arr) => arr.length > 0);
    }

    const viDesc = raw.description || raw.descriptionRaw || champTranslations?.vi?.coreRelics?.description || champTranslations?.vi?.coreRelics?.descriptionRaw;
    const enDesc = raw.translations?.en?.description || raw.translations?.en?.descriptionRaw || champTranslations?.en?.coreRelics?.description || champTranslations?.en?.coreRelics?.descriptionRaw;
    const description = (isEn && enDesc ? enDesc : viDesc) || viDesc || enDesc || '';

    return { mandatory, options, description };
  }

  return { mandatory: [], options: [], description: '' };
}
