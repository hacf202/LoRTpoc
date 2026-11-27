import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import DropDragSidePanel from '../components/admin/DropDragSidePanel';
import RichMarkupTextarea from '../components/admin/RichMarkupTextarea';
import ConstellationEditor from '../components/admin/ConstellationEditor';
import { rankSearchResults } from '../utils/searchUtils';
import { VALID_ADMIN_MODULES, ADMIN_ROUTE_PREFIX } from '../hooks/useUrlFilters';
import { handleImageError } from '../utils/imageFallback';
import { toChampionSlug } from '../utils/slug';

const DEFAULT_CHAMPION_TEMPLATE = {
  championID: '',
  name: 'Tướng Mới',
  cardCode: '',
  regions: ['Runeterra'],
  cost: 1,
  tier: 'A',
  maxStar: 6,
  optimalStars: '3 Sao',
  playStyle: 'Combo',
  tags: [],
  description: '',
  descriptionRaw: '',
  assets: [{ avatar: '', fullAbsolutePath: '', gameAbsolutePath: '' }],
  coreRelics: {
    mandatory: [],
    options: [],
    description: ''
  },
  otherRelicOptions: [],
  relicSets: [
    {
      recommendedStars: 3,
      items: ['', '', ''],
      description: '',
      videoLink: ''
    }
  ],
  ratings: { damage: 7, defense: 7, synergy: 7, difficulty: 5 },
  powerStarIds: ['', '', '', '', '', ''],
  adventurePowerIds: [],
  itemIds: [],
  constellation: {
    constellationID: '',
    championName: '',
    backgroundImage: '',
    nodes: []
  },
  translations: { en: { name: '', description: '', tier: '' } }
};

// Clean 16px SVG Icons for Unslop Dashboard (Zero emoji, quiet chrome)
const AdminIcons = {
  Overview: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  Champions: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M12 2l7 3v6c0 5.25-3.5 10-7 11-3.5-1-7-5.75-7-11V5l7-3z" />
    </svg>
  ),
  Relics: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M6 3h12l4 7-10 11L2 10l4-7z" />
      <path d="M2 10h20M7 3l5 18 5-18" />
    </svg>
  ),
  Powers: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Items: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  Cards: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="5" width="14" height="16" rx="2" />
      <path d="M7 2h12a2 2 0 0 1 2 2v13" />
    </svg>
  ),
  Maps: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
  Logs: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  ),
  Home: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Logout: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  ChevronLeft: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Magnet: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 7V4h4v3a4 4 0 0 0 8 0V4h4v3a8 8 0 0 1-16 0z" />
    </svg>
  ),
  Search: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Eye: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  Plus: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Close: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
};

function cleanRelicCode(str) {
  if (!str) return '';
  if (typeof str !== 'string') {
    str = String(str);
  }
  const trimmed = str.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const c =
        parsed.code ||
        parsed.id ||
        parsed.relicCode ||
        parsed.powerCode ||
        parsed.itemCode ||
        parsed.cardCode ||
        parsed.bonusStarID;
      if (c && typeof c === 'string') return c.trim().toUpperCase();
    } catch (_) {
      const match = trimmed.match(/"code"\s*:\s*"([^"]+)"/i) || trimmed.match(/"id"\s*:\s*"([^"]+)"/i);
      if (match) return match[1].trim().toUpperCase();
    }
  }
  return trimmed.toUpperCase();
}

function normalizeAdminCoreRelics(raw) {
  if (!raw) return { mandatory: [], options: [], description: '' };
  if (Array.isArray(raw)) {
    return {
      mandatory: raw.map(cleanRelicCode).filter(Boolean),
      options: [],
      description: ''
    };
  }
  if (typeof raw === 'object') {
    const rawMandatory = Array.isArray(raw.mandatory) ? raw.mandatory : (Array.isArray(raw.items) ? raw.items : []);
    const mandatory = rawMandatory.map(cleanRelicCode).filter(Boolean);
    const options = Array.isArray(raw.options)
      ? raw.options.map((opt) => (Array.isArray(opt) ? opt : (opt?.items || [opt])).map(cleanRelicCode).filter(Boolean))
      : [];
    const description = typeof raw.description === 'string' ? raw.description : '';
    const translations = raw.translations || {};
    return { mandatory, options, description, translations };
  }
  return { mandatory: [], options: [], description: '', translations: {} };
}

function normalizeAdminRelicSets(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => {
    if (!s) {
      return {
        recommendedStars: 3,
        items: ['', '', ''],
        description: '',
        videoLink: '',
        translations: { en: { description: '' } }
      };
    }
    // Trường hợp 1: Mảng string thuần (legacy format: ['R0134', 'R0116', 'R0115'])
    if (Array.isArray(s)) {
      return {
        recommendedStars: 3,
        items: s.map(cleanRelicCode).filter(Boolean).slice(0, 3),
        description: '',
        videoLink: '',
        translations: { en: { description: '' } }
      };
    }
    // Trường hợp 2: Dạng Object
    if (typeof s === 'object') {
      let items = [];
      if (Array.isArray(s.items)) {
        items = s.items.map(cleanRelicCode).filter(Boolean).slice(0, 3);
      } else if (typeof s.items === 'string') {
        items = s.items.split(',').map(cleanRelicCode).filter(Boolean).slice(0, 3);
      } else if (s['0'] || s['1'] || s['2']) {
        // Fallback khôi phục nếu dữ liệu bị spread object từ array { '0': 'R0134', ... }
        items = [s['0'], s['1'], s['2']].map(cleanRelicCode).filter(Boolean).slice(0, 3);
      }

      const tr = s.translations || {};
      const enTr = tr.en || {};

      return {
        recommendedStars: Number(s.recommendedStars) || 3,
        items,
        description: typeof s.description === 'string' ? s.description.replace(/\\n/g, '\n') : '',
        videoLink: typeof s.videoLink === 'string' ? s.videoLink : '',
        translations: {
          ...tr,
          en: {
            ...enTr,
            description: typeof enTr.description === 'string' ? enTr.description.replace(/\\n/g, '\n') : ''
          }
        }
      };
    }
    return {
      recommendedStars: 3,
      items: [],
      description: '',
      videoLink: '',
      translations: { en: { description: '' } }
    };
  });
}

export default function AdminView({ onNavigate, filters = {}, updateFilters }) {
  const { isAdmin, loading: authLoading, login, logout, token } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';

  // Navigation module state (đồng bộ với hierarchical route /admin/:module)
  const initialModule =
    filters?.adminModule && VALID_ADMIN_MODULES.includes(filters.adminModule)
      ? filters.adminModule
      : 'overview';
  const [activeModule, setActiveModule] = useState(initialModule);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Login form state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Datasets states
  const [champions, setChampions] = useState([]);
  const [loadingChampions, setLoadingChampions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');

  const [relics, setRelics] = useState([]);
  const [loadingRelics, setLoadingRelics] = useState(false);
  const [relicSearch, setRelicSearch] = useState('');

  const [powers, setPowers] = useState([]);
  const [loadingPowers, setLoadingPowers] = useState(false);
  const [powerSearch, setPowerSearch] = useState('');

  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemSearch, setItemSearch] = useState('');

  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [cardSearch, setCardSearch] = useState('');

  const [maps, setMaps] = useState([]);
  const [loadingMaps, setLoadingMaps] = useState(false);

  const [bonusStars, setBonusStars] = useState([]);
  const [loadingBonusStars, setLoadingBonusStars] = useState(false);

  // Server Logs state (Key-Value system_logs)
  const [serverLogs, setServerLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logLevelFilter, setLogLevelFilter] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState(null);

  // Live Concurrent Users state
  const [activeUsersStats, setActiveUsersStats] = useState({
    total: 0,
    byPage: {},
    byLang: {},
    source: 'memory',
    timestamp: null
  });
  const [loadingActiveUsers, setLoadingActiveUsers] = useState(false);

  // Full-Page Champion Editor state (NO MODAL)
  const [editingChampion, setEditingChampion] = useState(null);
  const [isNewChampion, setIsNewChampion] = useState(false);
  const [editorTab, setEditorTab] = useState('basic'); // 'basic' | 'core' | 'builds' | 'ratings' | 'assets' | 'constellation'
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Drop & Drag Side Panel state
  const [isDropPanelOpen, setIsDropPanelOpen] = useState(false);

  // Raw inputs state: Sửa triệt để lỗi không nhập được dấu cách " " và dấu phẩy ","
  const [rawInputs, setRawInputs] = useState({
    regions: '',
    tags: '',
    tagsEn: '',
    coreMandatory: '',
    coreDescription: '',
    otherRelicOptions: '',
    setItems: {},
    adventurePowerIds: '',
    itemIds: ''
  });

  // Đồng bộ rawInputs từ champion object
  const syncRawInputsFromChampion = useCallback((champ) => {
    if (!champ) return;
    const parsedCore = normalizeAdminCoreRelics(champ.coreRelics);
    const parsedSets = normalizeAdminRelicSets(champ.relicSets);
    setRawInputs({
      regions: Array.isArray(champ.regions) ? champ.regions.join(', ') : (champ.region || ''),
      tags: Array.isArray(champ.tags) ? champ.tags.join(', ') : '',
      tagsEn: Array.isArray(champ.translations?.en?.tags) ? champ.translations.en.tags.join(', ') : '',
      coreMandatory: (parsedCore.mandatory || []).join(', '),
      coreDescription: parsedCore.description || '',
      otherRelicOptions: Array.isArray(champ.otherRelicOptions) ? champ.otherRelicOptions.join(', ') : '',
      setItems: parsedSets.reduce((acc, set, idx) => {
        acc[idx] = Array.isArray(set.items) ? set.items.filter(Boolean).join(', ') : '';
        return acc;
      }, {}),
      adventurePowerIds: Array.isArray(champ.adventurePowerIds) ? champ.adventurePowerIds.join(', ') : '',
      itemIds: Array.isArray(champ.itemIds) ? champ.itemIds.join(', ') : ''
    });
  }, []);

  // Centralized Authenticated No-Cache Fetch Helper (Ngăn chặn triệt để load dữ liệu cũ do Browser HTTP Cache)
  const adminFetch = useCallback(async (endpoint, options = {}) => {
    const separator = endpoint.includes('?') ? '&' : '?';
    const noCacheUrl = `${endpoint}${separator}_t=${Date.now()}`;
    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };
    return fetch(noCacheUrl, {
      ...options,
      cache: 'no-store',
      headers
    });
  }, [token]);

  // Fetch all champions
  const fetchChampions = useCallback(async () => {
    try {
      setLoadingChampions(true);
      const res = await adminFetch('/api/v1/champions?limit=all');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setChampions(data.data);
      }
    } catch (err) {
      console.error('Failed to load champions:', err);
    } finally {
      setLoadingChampions(false);
    }
  }, [adminFetch]);

  // Fetch Relics
  const fetchRelics = useCallback(async () => {
    try {
      setLoadingRelics(true);
      const res = await adminFetch('/api/v1/relics?limit=all');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) setRelics(data.data);
    } catch (err) {
      console.error('Failed to load relics:', err);
    } finally {
      setLoadingRelics(false);
    }
  }, [adminFetch]);

  // Fetch Powers
  const fetchPowers = useCallback(async () => {
    try {
      setLoadingPowers(true);
      const res = await adminFetch('/api/v1/powers?limit=all');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) setPowers(data.data);
    } catch (err) {
      console.error('Failed to load powers:', err);
    } finally {
      setLoadingPowers(false);
    }
  }, [adminFetch]);

  // Fetch Items
  const fetchItems = useCallback(async () => {
    try {
      setLoadingItems(true);
      const res = await adminFetch('/api/v1/items?limit=all');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) setItems(data.data);
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoadingItems(false);
    }
  }, [adminFetch]);

  // Fetch Cards
  const fetchCards = useCallback(async () => {
    try {
      setLoadingCards(true);
      const res = await adminFetch('/api/v1/cards?limit=all&includeVariants=true');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) setCards(data.data);
    } catch (err) {
      console.error('Failed to load cards:', err);
    } finally {
      setLoadingCards(false);
    }
  }, [adminFetch]);

  // Fetch Maps
  const fetchMaps = useCallback(async () => {
    try {
      setLoadingMaps(true);
      const res = await adminFetch('/api/v1/maps?limit=all');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) setMaps(data.data);
    } catch (err) {
      console.error('Failed to load maps:', err);
    } finally {
      setLoadingMaps(false);
    }
  }, [adminFetch]);

  // Fetch BonusStars (Chòm Sao)
  const fetchBonusStars = useCallback(async () => {
    try {
      setLoadingBonusStars(true);
      const res = await adminFetch('/api/v1/bonus-stars?limit=all');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) setBonusStars(data.data);
    } catch (err) {
      console.error('Failed to load bonus stars:', err);
    } finally {
      setLoadingBonusStars(false);
    }
  }, [adminFetch]);

  // Fetch Server Logs
  const fetchServerLogs = useCallback(async () => {
    if (!token) return;
    try {
      setLogsLoading(true);
      const res = await adminFetch('/api/v1/auth/logs?limit=100');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) setServerLogs(data.data);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLogsLoading(false);
    }
  }, [token, adminFetch]);

  // Fetch Live Concurrent Active Users
  const fetchActiveUsers = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingActiveUsers(true);
      const res = await adminFetch('/api/v1/presence/stats');
      const data = await res.json();
      if (data.success && data.data) {
        setActiveUsersStats(data.data);
      }
    } catch (err) {
      console.error('Failed to load active users:', err);
    } finally {
      setLoadingActiveUsers(false);
    }
  }, [token, adminFetch]);

  // Clear Server Logs
  const handleClearLogs = async () => {
    if (!token) return;
    if (!window.confirm('Bạn có chắc muốn xóa lịch sử nhật ký máy chủ gần đây?')) return;
    try {
      await fetch('/api/v1/auth/logs', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setServerLogs([]);
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  // Lazy load datasets based on active module
  useEffect(() => {
    if (!isAdmin) return;
    if (activeModule === 'overview') {
      fetchActiveUsers();
      const interval = setInterval(fetchActiveUsers, 15000);
      return () => clearInterval(interval);
    }
    if (activeModule === 'champions') {
      fetchChampions();
      fetchBonusStars();
    }
    if (activeModule === 'relics') fetchRelics();
    if (activeModule === 'powers') fetchPowers();
    if (activeModule === 'items') fetchItems();
    if (activeModule === 'cards') fetchCards();
    if (activeModule === 'maps') fetchMaps();
    if (activeModule === 'logs') {
      fetchServerLogs();
      // Auto-poll logs every 20s (instead of 4s) and ONLY when browser tab is actively visible
      const interval = setInterval(() => {
        if (!document.hidden) {
          fetchServerLogs();
        }
      }, 20000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, activeModule, fetchActiveUsers, fetchChampions, fetchBonusStars, fetchRelics, fetchPowers, fetchItems, fetchCards, fetchMaps, fetchServerLogs]);

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmittingLogin(true);
    const result = await login(password);
    setIsSubmittingLogin(false);
    if (!result.success) {
      setLoginError(result.message || 'Mật khẩu quản trị viên không chính xác.');
    }
  };

  // Open Full-Page Edit Form
  const handleOpenEdit = useCallback((champ) => {
    setIsNewChampion(false);
    setSaveSuccessMsg('');
    const cloned = JSON.parse(JSON.stringify(champ));

    // Chuẩn hóa \n cho các trường văn bản mô tả
    if (typeof cloned.description === 'string') {
      cloned.description = cloned.description.replace(/\\n/g, '\n');
    }
    if (typeof cloned.descriptionRaw === 'string') {
      cloned.descriptionRaw = cloned.descriptionRaw.replace(/\\n/g, '\n');
    }
    if (cloned.translations?.en?.description) {
      cloned.translations.en.description = cloned.translations.en.description.replace(/\\n/g, '\n');
    }
    cloned.relicSets = normalizeAdminRelicSets(cloned.relicSets);

    // Chuẩn hóa cấu trúc coreRelics linh hoạt
    cloned.coreRelics = normalizeAdminCoreRelics(cloned.coreRelics);
    if (cloned.coreRelics?.translations?.en?.description) {
      cloned.coreRelics.translations.en.description = cloned.coreRelics.translations.en.description.replace(/\\n/g, '\n');
    }

    cloned.powerStarIds = Array.isArray(cloned.powerStarIds) ? [...cloned.powerStarIds] : [];
    while (cloned.powerStarIds.length < 6) cloned.powerStarIds.push('');
    cloned.adventurePowerIds = Array.isArray(cloned.adventurePowerIds) ? [...cloned.adventurePowerIds] : [];
    cloned.itemIds = Array.isArray(cloned.itemIds) ? [...cloned.itemIds] : [];

    setEditingChampion(cloned);
    setEditorTab('basic');
    syncRawInputsFromChampion(cloned);
    if (relics.length === 0) fetchRelics();
    if (powers.length === 0) fetchPowers();
    if (bonusStars.length === 0) fetchBonusStars();
    if (cards.length === 0) fetchCards();
    if (items.length === 0) fetchItems();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [relics.length, powers.length, bonusStars.length, cards.length, items.length, fetchRelics, fetchPowers, fetchBonusStars, fetchCards, fetchItems, syncRawInputsFromChampion]);

  // Open Full-Page Create Form
  const handleOpenCreate = useCallback(() => {
    setIsNewChampion(true);
    setSaveSuccessMsg('');
    const newId = `C${String(champions.length + 1).padStart(3, '0')}`;
    const newChamp = {
      ...DEFAULT_CHAMPION_TEMPLATE,
      championID: newId
    };
    setEditingChampion(newChamp);
    setEditorTab('basic');
    syncRawInputsFromChampion(newChamp);
    if (relics.length === 0) fetchRelics();
    if (powers.length === 0) fetchPowers();
    if (bonusStars.length === 0) fetchBonusStars();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [champions.length, relics.length, powers.length, bonusStars.length, fetchRelics, fetchPowers, fetchBonusStars, syncRawInputsFromChampion]);

  // Điều hướng chuyển đổi module trong Admin (/admin/:module)
  const goToModule = useCallback((mod) => {
    setEditingChampion(null);
    setIsNewChampion(false);
    setSaveSuccessMsg('');
    setIsDropPanelOpen(false);
    setActiveModule(mod);
    updateFilters?.({
      tab: 'admin',
      adminModule: mod,
      adminChampion: ''
    });
  }, [updateFilters]);

  // Điều hướng mở form chỉnh sửa tướng (/admin/champion/:slug)
  const goToChampionEdit = useCallback((champ) => {
    handleOpenEdit(champ);
    const champTarget = toChampionSlug(champ);
    updateFilters?.({
      tab: 'admin',
      adminModule: 'champions',
      adminChampion: champTarget
    });
  }, [handleOpenEdit, updateFilters]);

  // Điều hướng mở form thêm tướng mới (/admin/champion/new)
  const goToChampionCreate = useCallback(() => {
    handleOpenCreate();
    updateFilters?.({
      tab: 'admin',
      adminModule: 'champions',
      adminChampion: 'new'
    });
  }, [handleOpenCreate, updateFilters]);

  // Hủy chỉnh sửa / Đóng form quay về danh sách tướng (/admin/champions)
  const handleCancelEdit = useCallback(() => {
    if (editingChampion) {
      if (!window.confirm(isEn ? 'Discard unsaved changes?' : 'Bạn có chắc muốn hủy các thay đổi chưa lưu?')) {
        return;
      }
    }
    setEditingChampion(null);
    setIsNewChampion(false);
    setSaveSuccessMsg('');
    setIsDropPanelOpen(false);
    updateFilters?.({
      tab: 'admin',
      adminModule: 'champions',
      adminChampion: ''
    });
  }, [editingChampion, isEn, updateFilters]);

  // Đồng bộ hai chiều giữa URL (History API) và State Admin (Back/Forward, Direct Link)
  useEffect(() => {
    if (!isAdmin) return;

    // 1. Đồng bộ module active từ URL
    if (filters?.adminModule && VALID_ADMIN_MODULES.includes(filters.adminModule)) {
      if (filters.adminModule !== activeModule) {
        setActiveModule(filters.adminModule);
      }
    }

    // 2. Đồng bộ chỉnh sửa tướng từ route /admin/champion/:name
    const targetParam = filters?.adminChampion ? filters.adminChampion.trim() : '';
    if (!targetParam) {
      if (editingChampion) {
        setEditingChampion(null);
        setIsNewChampion(false);
      }
      return;
    }

    if (targetParam === 'new') {
      if (!editingChampion || !isNewChampion) {
        handleOpenCreate();
      }
      return;
    }

    const targetSlug = toChampionSlug(targetParam);
    const targetNorm = targetSlug.replace(/-/g, '');
    const targetLower = targetParam.toLowerCase();

    // Nếu đã và đang mở đúng tướng này thì giữ nguyên state form (tránh mất dữ liệu đang gõ)
    if (
      editingChampion &&
      !isNewChampion &&
      (
        (editingChampion.championID && editingChampion.championID.toLowerCase() === targetLower) ||
        (editingChampion.name && editingChampion.name.toLowerCase() === targetLower) ||
        (editingChampion.translations?.en?.name && editingChampion.translations.en.name.toLowerCase() === targetLower) ||
        toChampionSlug(editingChampion.name) === targetSlug ||
        toChampionSlug(editingChampion.translations?.en?.name) === targetSlug ||
        (targetNorm && (
          toChampionSlug(editingChampion.name).replace(/-/g, '') === targetNorm ||
          toChampionSlug(editingChampion.translations?.en?.name).replace(/-/g, '') === targetNorm ||
          (editingChampion.championID && editingChampion.championID.toLowerCase() === targetNorm)
        ))
      )
    ) {
      return;
    }

    // Tìm kiếm trong danh sách tướng đã tải
    const found = champions.find(
      (c) =>
        (c.championID && c.championID.toLowerCase() === targetLower) ||
        (c.name && c.name.toLowerCase() === targetLower) ||
        (c.translations?.en?.name && c.translations.en.name.toLowerCase() === targetLower) ||
        toChampionSlug(c.name) === targetSlug ||
        toChampionSlug(c.translations?.en?.name) === targetSlug ||
        (targetNorm && (
          toChampionSlug(c.name).replace(/-/g, '') === targetNorm ||
          toChampionSlug(c.translations?.en?.name).replace(/-/g, '') === targetNorm ||
          (c.championID && c.championID.toLowerCase() === targetNorm)
        ))
    );

    if (found) {
      handleOpenEdit(found);
    }

    // Luôn luôn gọi adminFetch để lấy dữ liệu tươi mới nhất từ CSDL MongoDB (chống stale cache)
    adminFetch(`/api/v1/champions/${encodeURIComponent(targetParam)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.data) {
          handleOpenEdit(data.data);
        }
      })
      .catch((err) => console.error('Failed to load champion from URL:', err));
  }, [
    filters?.adminModule,
    filters?.adminChampion,
    champions,
    isAdmin,
    loadingChampions,
    activeModule,
    editingChampion,
    isNewChampion,
    handleOpenCreate,
    handleOpenEdit,
    adminFetch
  ]);

  // Trích xuất mã code sạch từ sự kiện kéo thả (hỗ trợ cả application/json lẫn text/plain và chống dính payload JSON thô)
  const extractDropCode = (e) => {
    if (!e || !e.dataTransfer) return '';
    try {
      const rawJson = e.dataTransfer.getData('application/json');
      if (rawJson) {
        const payload = JSON.parse(rawJson);
        const c =
          payload.code ||
          payload.id ||
          payload.relicCode ||
          payload.powerCode ||
          payload.itemCode ||
          payload.cardCode ||
          payload.bonusStarID;
        if (c) return cleanRelicCode(c);
      }
    } catch (_) {}

    try {
      const text = e.dataTransfer.getData('text/plain');
      if (text) {
        return cleanRelicCode(text);
      }
    } catch (_) {}

    return '';
  };

  // Kéo thả vào 1 ô Slot cụ thể của Bộ Cổ Vật
  const handleDropToSlot = (sIdx, slotIdx, e) => {
    e.preventDefault();
    const code = extractDropCode(e);
    if (!code) return;

    const copy = [...editingChampion.relicSets];
    const targetSet = copy[sIdx] || { items: [] };
    const rawItems = Array.isArray(targetSet) ? targetSet : (targetSet.items || []);
    const currentItems = [...rawItems].map(cleanRelicCode);
    while (currentItems.length < 3) currentItems.push('');
    currentItems[slotIdx] = code;
    copy[sIdx] = {
      ...(typeof targetSet === 'object' && !Array.isArray(targetSet) ? targetSet : {}),
      items: currentItems.slice(0, 3)
    };

    setEditingChampion({ ...editingChampion, relicSets: copy });
    setRawInputs((p) => ({
      ...p,
      setItems: { ...p.setItems, [sIdx]: currentItems.filter(Boolean).join(', ') }
    }));
  };

  // Gỡ bỏ cổ vật khỏi slot
  const handleRemoveSlotItem = (sIdx, slotIdx) => {
    const copy = [...editingChampion.relicSets];
    const targetSet = copy[sIdx] || { items: [] };
    const rawItems = Array.isArray(targetSet) ? targetSet : (targetSet.items || []);
    const currentItems = [...rawItems].map(cleanRelicCode);
    while (currentItems.length < 3) currentItems.push('');
    currentItems[slotIdx] = '';
    copy[sIdx] = {
      ...(typeof targetSet === 'object' && !Array.isArray(targetSet) ? targetSet : {}),
      items: currentItems.slice(0, 3)
    };

    setEditingChampion({ ...editingChampion, relicSets: copy });
    setRawInputs((p) => ({
      ...p,
      setItems: { ...p.setItems, [sIdx]: currentItems.filter(Boolean).join(', ') }
    }));
  };

  // Kéo thả vào Mandatory Core Relics Box
  const handleDropToCore = (e) => {
    e.preventDefault();
    const code = extractDropCode(e);
    if (!code) return;

    const curMandatory = [...(editingChampion.coreRelics?.mandatory || [])]
      .map(cleanRelicCode)
      .filter(Boolean);

    if (!curMandatory.includes(code)) {
      curMandatory.push(code);
      setEditingChampion({
        ...editingChampion,
        coreRelics: {
          ...(editingChampion.coreRelics || {}),
          mandatory: curMandatory
        }
      });
      setRawInputs((p) => ({ ...p, coreMandatory: curMandatory.join(', ') }));
    }
  };

  // Xóa 1 cổ vật khỏi Mandatory Core Relics
  const handleRemoveCoreRelic = (codeToRemove) => {
    const curMandatory = (editingChampion.coreRelics?.mandatory || [])
      .map(cleanRelicCode)
      .filter((c) => c !== codeToRemove);
    setEditingChampion({
      ...editingChampion,
      coreRelics: {
        ...(editingChampion.coreRelics || {}),
        mandatory: curMandatory
      }
    });
    setRawInputs((p) => ({ ...p, coreMandatory: curMandatory.join(', ') }));
  };

  // Thêm 1 phương án tùy chọn đi kèm (Option)
  const handleAddCoreOption = () => {
    const curOptions = [...(editingChampion.coreRelics?.options || [])];
    curOptions.push([]);
    setEditingChampion({
      ...editingChampion,
      coreRelics: {
        ...(editingChampion.coreRelics || {}),
        options: curOptions
      }
    });
  };

  // Xóa 1 phương án tùy chọn
  const handleRemoveCoreOption = (optIdx) => {
    const curOptions = (editingChampion.coreRelics?.options || []).filter((_, idx) => idx !== optIdx);
    setEditingChampion({
      ...editingChampion,
      coreRelics: {
        ...(editingChampion.coreRelics || {}),
        options: curOptions
      }
    });
  };

  // Kéo thả cổ vật vào 1 Option cụ thể
  const handleDropToOption = (optIdx, e) => {
    e.preventDefault();
    const code = extractDropCode(e);
    if (!code) return;

    const curOptions = [...(editingChampion.coreRelics?.options || [])];
    const targetOpt = [...(curOptions[optIdx] || [])].map(cleanRelicCode).filter(Boolean);
    if (!targetOpt.includes(code)) {
      targetOpt.push(code);
      curOptions[optIdx] = targetOpt;
      setEditingChampion({
        ...editingChampion,
        coreRelics: {
          ...(editingChampion.coreRelics || {}),
          options: curOptions
        }
      });
    }
  };

  // Xóa 1 cổ vật khỏi Option
  const handleRemoveOptionRelic = (optIdx, codeToRemove) => {
    const curOptions = [...(editingChampion.coreRelics?.options || [])];
    const targetOpt = (curOptions[optIdx] || []).map(cleanRelicCode).filter((c) => c !== codeToRemove);
    curOptions[optIdx] = targetOpt;
    setEditingChampion({
      ...editingChampion,
      coreRelics: {
        ...(editingChampion.coreRelics || {}),
        options: curOptions
      }
    });
  };

  // Nhập text cho Option
  const handleOptionTextInputChange = (optIdx, val) => {
    const list = val.split(',').map(cleanRelicCode).filter(Boolean);
    const curOptions = [...(editingChampion.coreRelics?.options || [])];
    curOptions[optIdx] = list;
    setEditingChampion({
      ...editingChampion,
      coreRelics: {
        ...(editingChampion.coreRelics || {}),
        options: curOptions
      }
    });
  };

  // Thay đổi mô tả phân tích
  const handleCoreDescriptionChange = (val) => {
    setEditingChampion({
      ...editingChampion,
      coreRelics: {
        ...(editingChampion.coreRelics || {}),
        description: val
      }
    });
    setRawInputs((p) => ({ ...p, coreDescription: val }));
  };

  // Kéo thả vào Other Relic Options Box
  const handleDropToOther = (e) => {
    e.preventDefault();
    const code = extractDropCode(e);
    if (!code) return;

    const current = (Array.isArray(editingChampion.otherRelicOptions) ? [...editingChampion.otherRelicOptions] : [])
      .map(cleanRelicCode)
      .filter(Boolean);
    if (!current.includes(code)) {
      current.push(code);
      setEditingChampion({ ...editingChampion, otherRelicOptions: current });
      setRawInputs((p) => ({ ...p, otherRelicOptions: current.join(', ') }));
    }
  };

  // Xóa 1 cổ vật khỏi Other Relic Options
  const handleRemoveOtherRelic = (codeToRemove) => {
    const current = (editingChampion.otherRelicOptions || []).map(cleanRelicCode).filter((c) => c !== codeToRemove);
    setEditingChampion({ ...editingChampion, otherRelicOptions: current });
    setRawInputs((p) => ({ ...p, otherRelicOptions: current.join(', ') }));
  };

  // Nút (+) gán nhanh từ Menu Kéo Thả vào slot trống đầu tiên
  const handleQuickAssignRelic = (rawCode) => {
    const code = cleanRelicCode(rawCode);
    if (!code) return;
    if (!editingChampion || !Array.isArray(editingChampion.relicSets) || editingChampion.relicSets.length === 0) return;
    const copy = [...editingChampion.relicSets];
    let assigned = false;
    for (let sIdx = 0; sIdx < copy.length; sIdx++) {
      const rawItems = Array.isArray(copy[sIdx]) ? copy[sIdx] : (copy[sIdx]?.items || []);
      const items = [...rawItems].map(cleanRelicCode);
      while (items.length < 3) items.push('');
      const emptySlotIdx = items.findIndex((it) => !it);
      if (emptySlotIdx !== -1) {
        items[emptySlotIdx] = code;
        copy[sIdx] = {
          ...(typeof copy[sIdx] === 'object' && !Array.isArray(copy[sIdx]) ? copy[sIdx] : {}),
          items: items.slice(0, 3)
        };
        assigned = true;
        setEditingChampion({ ...editingChampion, relicSets: copy });
        setRawInputs((p) => ({
          ...p,
          setItems: { ...p.setItems, [sIdx]: items.filter(Boolean).join(', ') }
        }));
        break;
      }
    }
    if (!assigned) {
      alert('Các bộ hiện tại đã đầy 3 slot! Bạn có thể kéo thả đè lên slot muốn thay thế hoặc bấm "+ Thêm Bộ Cổ Vật Mới".');
    }
  };

  // --- HANDLERS CHO VẬT PHẨM & SỨC MẠNH (SYNERGIES) ---

  // Kéo thả vào ô Sức Mạnh Ngôi Sao (1★ - 6★)
  const handleDropToStarPower = (starIdx, e) => {
    e.preventDefault();
    const code = extractDropCode(e);
    if (!code) return;
    const stars = Array.isArray(editingChampion.powerStarIds) ? [...editingChampion.powerStarIds] : [];
    while (stars.length < 6) stars.push('');
    stars[starIdx] = code;
    setEditingChampion({ ...editingChampion, powerStarIds: stars });
  };

  // Gỡ bỏ sức mạnh khỏi ô sao
  const handleRemoveStarPower = (starIdx) => {
    const stars = Array.isArray(editingChampion.powerStarIds) ? [...editingChampion.powerStarIds] : [];
    while (stars.length < 6) stars.push('');
    stars[starIdx] = '';
    setEditingChampion({ ...editingChampion, powerStarIds: stars });
  };

  // Nhập mã sao trực tiếp
  const handleStarPowerCodeChange = (starIdx, val) => {
    const code = cleanRelicCode(val);
    const stars = Array.isArray(editingChampion.powerStarIds) ? [...editingChampion.powerStarIds] : [];
    while (stars.length < 6) stars.push('');
    stars[starIdx] = code;
    setEditingChampion({ ...editingChampion, powerStarIds: stars });
  };

  // Kéo thả vào Sức Mạnh Phiêu Lưu (Adventure Powers)
  const handleDropToAdventurePower = (e) => {
    e.preventDefault();
    const code = extractDropCode(e);
    if (!code) return;
    const cur = (Array.isArray(editingChampion.adventurePowerIds) ? [...editingChampion.adventurePowerIds] : [])
      .map(cleanRelicCode)
      .filter(Boolean);
    if (!cur.includes(code)) {
      cur.push(code);
      setEditingChampion({ ...editingChampion, adventurePowerIds: cur });
      setRawInputs((p) => ({ ...p, adventurePowerIds: cur.join(', ') }));
    }
  };

  // Xóa 1 sức mạnh phiêu lưu
  const handleRemoveAdventurePower = (codeToRemove) => {
    const cur = (editingChampion.adventurePowerIds || []).map(cleanRelicCode).filter((c) => c !== codeToRemove);
    setEditingChampion({ ...editingChampion, adventurePowerIds: cur });
    setRawInputs((p) => ({ ...p, adventurePowerIds: cur.join(', ') }));
  };

  // Kéo thả vào Vật Phẩm Khuyên Dùng (Recommended Items)
  const handleDropToItem = (e) => {
    e.preventDefault();
    const code = extractDropCode(e);
    if (!code) return;
    const cur = (Array.isArray(editingChampion.itemIds) ? [...editingChampion.itemIds] : [])
      .map(cleanRelicCode)
      .filter(Boolean);
    if (!cur.includes(code)) {
      cur.push(code);
      setEditingChampion({ ...editingChampion, itemIds: cur });
      setRawInputs((p) => ({ ...p, itemIds: cur.join(', ') }));
    }
  };

  // Xóa 1 vật phẩm khuyên dùng
  const handleRemoveItem = (codeToRemove) => {
    const cur = (editingChampion.itemIds || []).map(cleanRelicCode).filter((c) => c !== codeToRemove);
    setEditingChampion({ ...editingChampion, itemIds: cur });
    setRawInputs((p) => ({ ...p, itemIds: cur.join(', ') }));
  };

  // Nút (+) gán nhanh Sức Mạnh từ Menu Kéo Thả
  const handleQuickAssignPower = (rawCode) => {
    const code = cleanRelicCode(rawCode);
    if (!code || !editingChampion) return;
    const stars = Array.isArray(editingChampion.powerStarIds) ? [...editingChampion.powerStarIds] : [];
    while (stars.length < 6) stars.push('');
    const emptyStarIdx = stars.findIndex((p) => !p);
    if (editorTab === 'synergies' && emptyStarIdx !== -1) {
      stars[emptyStarIdx] = code;
      setEditingChampion({ ...editingChampion, powerStarIds: stars });
      return;
    }
    const curAdv = (Array.isArray(editingChampion.adventurePowerIds) ? [...editingChampion.adventurePowerIds] : []).map(cleanRelicCode).filter(Boolean);
    if (!curAdv.includes(code)) {
      curAdv.push(code);
      setEditingChampion({ ...editingChampion, adventurePowerIds: curAdv });
      setRawInputs((p) => ({ ...p, adventurePowerIds: curAdv.join(', ') }));
    }
  };

  // Nút (+) gán nhanh Vật Phẩm từ Menu Kéo Thả
  const handleQuickAssignItem = (rawCode) => {
    const code = cleanRelicCode(rawCode);
    if (!code || !editingChampion) return;
    const curItems = (Array.isArray(editingChampion.itemIds) ? [...editingChampion.itemIds] : []).map(cleanRelicCode).filter(Boolean);
    if (!curItems.includes(code)) {
      curItems.push(code);
      setEditingChampion({ ...editingChampion, itemIds: curItems });
      setRawInputs((p) => ({ ...p, itemIds: curItems.join(', ') }));
    }
  };

  // Save Champion Full-Page
  const handleSaveChampion = async () => {
    if (!editingChampion || !editingChampion.name?.trim()) {
      alert('Vui lòng nhập tên tướng!');
      return;
    }

    try {
      setSaveLoading(true);
      setSaveSuccessMsg('');

      // Parse chính xác từ rawInputs đảm bảo không sót dữ liệu khi lưu
      const regions = (rawInputs.regions || '').split(',').map((s) => s.trim()).filter(Boolean);
      const tags = (rawInputs.tags || '').split(',').map((s) => s.trim()).filter(Boolean);
      const tagsEn = (rawInputs.tagsEn || '').split(',').map((s) => s.trim()).filter(Boolean);
      const otherRelicOptions = (rawInputs.otherRelicOptions || '').split(',').map(cleanRelicCode).filter(Boolean);

      // Chuẩn hóa cấu trúc coreRelics linh hoạt
      const coreMandatory = (rawInputs.coreMandatory !== undefined ? rawInputs.coreMandatory : (editingChampion.coreRelics?.mandatory || []).join(', '))
        .split(',')
        .map(cleanRelicCode)
        .filter(Boolean);

      const rawOptions = editingChampion.coreRelics?.options || [];
      const coreOptions = rawOptions
        .map((opt) => (Array.isArray(opt) ? opt : [opt]).map(cleanRelicCode).filter(Boolean))
        .filter((opt) => opt.length > 0);

      const coreDescription = (rawInputs.coreDescription !== undefined ? rawInputs.coreDescription : (editingChampion.coreRelics?.description || '')).trim();

      const finalCoreRelics = {
        mandatory: coreMandatory,
        options: coreOptions,
        description: coreDescription
      };
      if (editingChampion.coreRelics?.translations?.en?.description) {
        finalCoreRelics.translations = {
          en: {
            description: editingChampion.coreRelics.translations.en.description.trim()
          }
        };
      }

      // Chuẩn hóa relicSets (không lưu title, hệ thống tự hiển thị Bộ #1, Bộ #2...)
      const cleanRelicSets = normalizeAdminRelicSets(editingChampion.relicSets).map((set, idx) => {
        const rawItemsStr = rawInputs.setItems?.[idx] !== undefined ? rawInputs.setItems[idx] : (Array.isArray(set.items) ? set.items.join(', ') : '');
        const items = rawItemsStr.split(',').map(cleanRelicCode).filter(Boolean).slice(0, 3);
        const cleanSet = {
          recommendedStars: Number(set.recommendedStars) || 1,
          items,
          description: set.description || '',
          videoLink: set.videoLink || ''
        };
        const enDesc = set.translations?.en?.description?.trim();
        if (enDesc) {
          cleanSet.translations = {
            en: {
              ...(set.translations?.en || {}),
              description: enDesc
            }
          };
        }
        return cleanSet;
      });

      // Chuẩn hóa powerStarIds (6 ngôi sao)
      const rawPowerStars = Array.isArray(editingChampion.powerStarIds) ? [...editingChampion.powerStarIds] : [];
      while (rawPowerStars.length < 6) rawPowerStars.push('');
      const cleanPowerStarIds = rawPowerStars.slice(0, 6).map(cleanRelicCode);

      // Chuẩn hóa adventurePowerIds
      const adventurePowerIds = (rawInputs.adventurePowerIds !== undefined ? rawInputs.adventurePowerIds : (editingChampion.adventurePowerIds || []).join(', '))
        .split(',')
        .map(cleanRelicCode)
        .filter(Boolean);

      // Chuẩn hóa itemIds
      const itemIds = (rawInputs.itemIds !== undefined ? rawInputs.itemIds : (editingChampion.itemIds || []).join(', '))
        .split(',')
        .map(cleanRelicCode)
        .filter(Boolean);

      // Chuẩn hóa ratings (hỗ trợ bước nhảy 0.5)
      const rawRatings = editingChampion.ratings || {};
      const cleanRatings = {
        damage: rawRatings.damage !== '' && rawRatings.damage !== undefined ? Math.round(Number(rawRatings.damage) * 10) / 10 : 7,
        defense: rawRatings.defense !== '' && rawRatings.defense !== undefined ? Math.round(Number(rawRatings.defense) * 10) / 10 : 7,
        synergy: rawRatings.synergy !== '' && rawRatings.synergy !== undefined ? Math.round(Number(rawRatings.synergy) * 10) / 10 : 7,
        difficulty: rawRatings.difficulty !== '' && rawRatings.difficulty !== undefined ? Math.round(Number(rawRatings.difficulty) * 10) / 10 : 5,
        ...(rawRatings.playstyleNote ? { playstyleNote: rawRatings.playstyleNote } : {})
      };

      // Chuẩn hóa assets
      const cleanAssets = Array.isArray(editingChampion.assets) && editingChampion.assets.length > 0
        ? [{
            avatar: (editingChampion.assets[0]?.avatar || '').trim(),
            fullAbsolutePath: (editingChampion.assets[0]?.fullAbsolutePath || '').trim(),
            gameAbsolutePath: (editingChampion.assets[0]?.gameAbsolutePath || '').trim()
          }]
        : [{ avatar: '', fullAbsolutePath: '', gameAbsolutePath: '' }];

      // Chuẩn hóa constellation
      const rawConst = editingChampion.constellation || {};
      const cleanConstellation = {
        constellationID: rawConst.constellationID || editingChampion.championID,
        championName: rawConst.championName || editingChampion.name,
        backgroundImage: (rawConst.backgroundImage || '').trim(),
        nodes: Array.isArray(rawConst.nodes) ? rawConst.nodes : []
      };

      const payload = {
        ...editingChampion,
        maxStar: Number(editingChampion.maxStar) || 3,
        regions: regions.length > 0 ? regions : editingChampion.regions || ['Runeterra'],
        tags,
        coreRelics: finalCoreRelics,
        otherRelicOptions,
        relicSets: cleanRelicSets,
        powerStarIds: cleanPowerStarIds,
        adventurePowerIds,
        itemIds,
        ratings: cleanRatings,
        assets: cleanAssets,
        constellation: cleanConstellation,
        translations: {
          ...(editingChampion.translations || {}),
          en: {
            ...((editingChampion.translations || {}).en || {}),
            tags: tagsEn
          }
        }
      };

      // Xóa triệt để comboSteps & proTips nếu có
      delete payload.comboSteps;
      delete payload.proTips;

      const targetId = payload.championID || payload.name;
      const url = isNewChampion ? '/api/v1/champions' : `/api/v1/champions/${encodeURIComponent(targetId)}`;
      const method = isNewChampion ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSaveSuccessMsg(isNewChampion ? 'Tạo mới tướng thành công!' : 'Cập nhật dữ liệu tướng thành công!');
        if (json.data) {
          setChampions((prev) => {
            const idx = prev.findIndex((c) => c.championID === json.data.championID);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = json.data;
              return next;
            }
            return [json.data, ...prev];
          });
          setEditingChampion(json.data);
        }
        await fetchChampions();
        window.dispatchEvent(new CustomEvent('poc-data-updated', { detail: { type: 'champions', data: json.data } }));
        setTimeout(() => {
          setEditingChampion(null);
          setSaveSuccessMsg('');
          setIsDropPanelOpen(false);
          updateFilters?.({
            tab: 'admin',
            adminModule: 'champions',
            adminChampion: ''
          });
        }, 1200);
      } else {
        alert(json.message || 'Lỗi khi lưu dữ liệu tướng');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ: ' + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete Champion
  const handleDeleteChampion = async (champ) => {
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa vị tướng "${champ.name}" (${champ.championID}) không?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/v1/champions/${encodeURIComponent(champ.championID)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Đã xóa tướng thành công!');
        await fetchChampions();
        window.dispatchEvent(new CustomEvent('poc-data-updated', { detail: { type: 'champions' } }));
        if (editingChampion && (editingChampion.championID === champ.championID || editingChampion.name === champ.name)) {
          setEditingChampion(null);
          setIsDropPanelOpen(false);
          updateFilters?.({
            tab: 'admin',
            adminModule: 'champions',
            adminChampion: ''
          });
        }
      } else {
        const json = await res.json();
        alert(json.message || 'Không thể xóa tướng');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  // Filtered champions (Tìm kiếm không dấu, đa ngữ Việt - Anh, ưu tiên ngắn nhất & tương thích cao)
  const filteredChampions = useMemo(() => {
    let list = champions;
    if (regionFilter !== 'all') {
      list = list.filter(
        (c) => Array.isArray(c.regions) && c.regions.some((r) => r.toLowerCase() === regionFilter.toLowerCase())
      );
    }
    const q = searchQuery.trim();
    if (!q) return list;

    return rankSearchResults(list, q, (c) => ({
      nameVi: c.name || '',
      nameEn: c.translations?.en?.name || '',
      code: `${c.championID || ''} ${c.cardCode || ''}`,
      desc: c.descriptionRaw || c.description || ''
    }));
  }, [champions, searchQuery, regionFilter]);

  // Filtered relics (Tìm kiếm không dấu, đa ngữ Việt - Anh, ưu tiên ngắn nhất)
  const filteredRelics = useMemo(() => {
    const q = relicSearch.trim();
    if (!q) return relics;
    return rankSearchResults(relics, q, (r) => ({
      nameVi: r.name || '',
      nameEn: r.translations?.en?.name || '',
      code: r.relicCode || '',
      desc: r.descriptionRaw || r.description || ''
    }));
  }, [relics, relicSearch]);

  // Filtered powers (Tìm kiếm không dấu, đa ngữ Việt - Anh, ưu tiên ngắn nhất)
  const filteredPowers = useMemo(() => {
    const q = powerSearch.trim();
    if (!q) return powers;
    return rankSearchResults(powers, q, (p) => ({
      nameVi: p.name || '',
      nameEn: p.translations?.en?.name || '',
      code: p.powerCode || '',
      desc: p.descriptionRaw || p.description || ''
    }));
  }, [powers, powerSearch]);

  // Lookup Maps tra cứu O(1) hiển thị thông tin Cổ Vật, Sức Mạnh & Vật Phẩm
  const relicMap = useMemo(() => {
    const map = new Map();
    relics.forEach((r) => {
      if (r.relicCode) map.set(r.relicCode, r);
    });
    return map;
  }, [relics]);

  const powerMap = useMemo(() => {
    const map = new Map();
    powers.forEach((p) => {
      if (p.powerCode) map.set(p.powerCode, p);
    });
    return map;
  }, [powers]);

  const itemMap = useMemo(() => {
    const map = new Map();
    items.forEach((it) => {
      if (it.itemCode) map.set(it.itemCode, it);
    });
    return map;
  }, [items]);

  // Loading auth spinner
  if (authLoading) {
    return (
      <div className="relative z-10 w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-10 h-10 border-3 border-[#8CC0EB] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Đang xác thực quyền quản trị...</span>
      </div>
    );
  }

  // 1. LOGIN SCREEN IF NOT AUTHENTICATED
  if (!isAdmin) {
    return (
      <div className="relative z-10 w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4 bg-[#101216]">
        <div className="w-full max-w-sm p-6 sm:p-8 rounded-2xl bg-[#161920] border border-white/10 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-xl bg-[#1f232e] border border-white/10 flex items-center justify-center text-slate-300">
              <AdminIcons.Champions className="w-6 h-6 text-sky-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-100">
              {isEn ? 'Admin Portal' : 'Cổng quản trị'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              {isEn
                ? 'Enter password to access database management and system controls.'
                : 'Nhập mật khẩu quản trị để mở bảng điều khiển dữ liệu và hệ thống.'}
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  {isEn ? 'Password' : 'Mật khẩu'}
                </label>
                <button
                  type="button"
                  onClick={() => setPassword('admin123')}
                  className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer font-mono"
                  title="Điền nhanh mật khẩu mặc định"
                >
                  (Mặc định: admin123)
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-[#1f232e] border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/20 transition-colors placeholder:text-slate-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer p-0.5"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <AdminIcons.EyeOff className="w-4 h-4" /> : <AdminIcons.Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-center gap-2">
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmittingLogin}
              className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmittingLogin ? 'Đang xác thực...' : (isEn ? 'Log in' : 'Đăng nhập')}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => onNavigate?.('home')}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <AdminIcons.ChevronLeft className="w-3.5 h-3.5" />
              <span>{isEn ? 'Return to Home Page' : 'Quay lại trang chủ'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. FULL-PAGE ADMIN PORTAL (SIDEBAR + MAIN CONTENT)
  const navModules = [
    { id: 'overview', icon: <AdminIcons.Overview />, label: isEn ? 'Overview' : 'Tổng quan', liveCount: activeUsersStats.total },
    { id: 'champions', icon: <AdminIcons.Champions />, label: isEn ? 'Champions' : 'Quản lý tướng', count: champions.length },
    { id: 'relics', icon: <AdminIcons.Relics />, label: isEn ? 'Relics' : 'Quản lý cổ vật', count: relics.length || 155 },
    { id: 'powers', icon: <AdminIcons.Powers />, label: isEn ? 'Powers' : 'Quản lý sức mạnh', count: powers.length || 380 },
    { id: 'items', icon: <AdminIcons.Items />, label: isEn ? 'Items' : 'Quản lý vật phẩm' },
    { id: 'cards', icon: <AdminIcons.Cards />, label: isEn ? 'Cards' : 'Quản lý thẻ bài' },
    { id: 'maps', icon: <AdminIcons.Maps />, label: isEn ? 'Maps' : 'Bản đồ phiêu lưu' },
    { id: 'logs', icon: <AdminIcons.Logs />, label: isEn ? 'Server Logs' : 'Nhật ký máy chủ' }
  ];

  return (
    <div className="relative z-10 w-full h-[calc(100vh-72px)] sm:h-[calc(100vh-76px)] flex flex-col md:flex-row font-sans text-slate-100 select-text overflow-hidden bg-[#101216]">
      {/* 2.1 Fixed/Collapsible Sidebar Navigation */}
      <aside
        className={`bg-[#0d0f14] border-r border-white/[0.08] flex flex-col shrink-0 h-full transition-all duration-200 overflow-hidden ${
          isSidebarCollapsed ? 'w-16' : 'w-60 xl:w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-md bg-[#1f232e] border border-white/10 text-sky-400 font-semibold flex items-center justify-center text-xs">
                P
              </span>
              <div>
                <span className="font-semibold text-xs text-slate-100 block">
                  PoC Manager
                </span>
                <span className="text-[10px] text-emerald-400/90 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Live Sync
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-md hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer mx-auto"
            title="Thu gọn / Mở rộng"
          >
            {isSidebarCollapsed ? <AdminIcons.ChevronRight className="w-4 h-4" /> : <AdminIcons.ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Sidebar Menu Modules */}
        <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
          {navModules.map((mod) => {
            const isActive = activeModule === mod.id && !editingChampion;
            const targetHref = mod.id === 'overview' ? ADMIN_ROUTE_PREFIX : `${ADMIN_ROUTE_PREFIX}/${mod.id}`;
            return (
              <a
                key={mod.id}
                href={targetHref}
                onClick={(e) => {
                  e.preventDefault();
                  goToModule(mod.id);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#1f232e] text-slate-100 border border-white/10 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <span className={`shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`}>{mod.icon}</span>
                {!isSidebarCollapsed && (
                  <span className="flex-1 truncate">{mod.label}</span>
                )}
                {!isSidebarCollapsed && mod.liveCount !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium ${
                      isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    {mod.liveCount}
                  </span>
                )}
                {!isSidebarCollapsed && mod.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isActive ? 'bg-black/20 text-slate-300' : 'bg-white/[0.04] text-slate-400'
                    }`}
                  >
                    {mod.count}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Sidebar Footer Account & Actions */}
        <div className="p-3 border-t border-white/[0.08] space-y-2 bg-[#0a0c10]">
          {!isSidebarCollapsed && (
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-medium text-slate-200">Quản trị viên</span>
              <span className="font-mono text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded text-slate-300">
                Admin
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onNavigate?.('home')}
              className="flex-1 py-1.5 px-2 rounded-md hover:bg-white/5 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors text-center cursor-pointer truncate flex items-center justify-center gap-1.5"
              title="Xem trang web"
            >
              <AdminIcons.Home className="w-3.5 h-3.5" />
              {!isSidebarCollapsed && <span>Trang chủ</span>}
            </button>
            <button
              type="button"
              onClick={logout}
              className="py-1.5 px-2 rounded-md hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 text-xs font-medium transition-colors cursor-pointer truncate flex items-center justify-center gap-1.5"
              title="Đăng xuất"
            >
              <AdminIcons.Logout className="w-3.5 h-3.5" />
              {!isSidebarCollapsed && <span>Đăng xuất</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* 2.2 Main Dynamic Content Area */}
      <main className="flex-1 min-w-0 h-full flex flex-col overflow-hidden bg-[#101216]">
        {/* ============================================================ */}
        {/* MODULE 1: FULL-PAGE CHAMPION EDITOR VIEW (REPLACING MODAL)   */}
        {/* ============================================================ */}
        {editingChampion ? (
          <div className="flex-1 min-h-0 flex flex-col w-full overflow-hidden">
            {/* Header Toolbar cố định phía trên: Breadcrumbs, Title, Buttons, Tabs */}
            <div className="shrink-0 p-3 sm:p-4 bg-[#14161d] border-b border-white/[0.08] space-y-3 z-10">
              {/* 1. Breadcrumb Phân Cấp Cho Editor */}
              <nav aria-label="Admin Editor Breadcrumb" className="w-full flex items-center gap-2 text-xs font-medium text-slate-400 pb-2 border-b border-white/[0.06] flex-wrap">
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate?.('home');
                  }}
                  className="hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                  title="Về Trang Chủ"
                >
                  <AdminIcons.Home className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Home' : 'Trang chủ'}</span>
                </a>
                <span className="text-slate-600">/</span>
                <a
                  href={ADMIN_ROUTE_PREFIX}
                  onClick={(e) => {
                    e.preventDefault();
                    goToModule('overview');
                  }}
                  className="hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                  title="Về Tổng Quan Quản Trị"
                >
                  <AdminIcons.Overview className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Admin' : 'Quản trị'}</span>
                </a>
                <span className="text-slate-600">/</span>
                <a
                  href={`${ADMIN_ROUTE_PREFIX}/champions`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleCancelEdit();
                  }}
                  className="hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                  title="Về Danh Sách Tướng"
                >
                  <AdminIcons.Champions className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Champions' : 'Quản lý tướng'}</span>
                </a>
                <span className="text-slate-600">/</span>
                <span className="text-slate-200 font-medium truncate max-w-[280px]">
                  {isNewChampion ? (isEn ? 'Create New' : 'Thêm tướng mới') : `${editingChampion.name} (${editingChampion.championID})`}
                </span>
              </nav>

              {/* 2. Tiêu Đề & Các Nút Hành Động */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1d26] hover:bg-[#222634] text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer border border-white/10"
                  >
                    <AdminIcons.ChevronLeft className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Back' : 'Quay lại'}</span>
                  </button>
                  <div className="h-4 w-px bg-white/10 hidden sm:block" />
                  <h2 className="text-base sm:text-lg font-semibold text-slate-100">
                    {isNewChampion ? 'Thêm vị tướng mới' : `Chỉnh sửa tướng: ${editingChampion.name}`}
                  </h2>
                  <span className="px-2 py-0.5 rounded font-mono text-xs text-sky-300 bg-sky-500/10 border border-sky-500/20">
                    {editingChampion.championID}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsDropPanelOpen(!isDropPanelOpen)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      isDropPanelOpen
                        ? 'bg-sky-500 text-slate-950 border-sky-400 font-semibold'
                        : 'bg-[#1a1d26] hover:bg-[#222634] text-slate-300 border-white/10 hover:text-white'
                    }`}
                    title="Bật/Tắt Menu kéo thả Cổ vật và Sức mạnh"
                  >
                    <AdminIcons.Magnet className="w-3.5 h-3.5" />
                    <span>{isDropPanelOpen ? 'Đóng menu kéo thả' : 'Mở menu kéo thả'}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/25 font-mono">
                      {relics.length || 155}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3.5 py-1.5 rounded-lg bg-[#1a1d26] hover:bg-[#222634] text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors cursor-pointer border border-white/10"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="button"
                    disabled={saveLoading}
                    onClick={handleSaveChampion}
                    className="px-5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {saveLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>

              {/* 3. Navigation Tabs Bar */}
              <div className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-white/[0.06]">
                {[
                  { id: 'basic', label: isEn ? 'Basic Info' : 'Định danh & Thuộc tính' },
                  {
                    id: 'core',
                    label: isEn ? 'Core Relics' : 'Cổ vật cốt lõi',
                    badge: (editingChampion.coreRelics?.mandatory || []).length + (editingChampion.coreRelics?.options || []).length
                  },
                  {
                    id: 'builds',
                    label: isEn ? 'Relic Builds' : 'Các bộ cổ vật',
                    badge: (editingChampion.relicSets || []).length
                  },
                  {
                    id: 'synergies',
                    label: isEn ? 'Items & Powers' : 'Vật phẩm & Sức mạnh',
                    badge:
                      (editingChampion.powerStarIds || []).filter(Boolean).length +
                      (editingChampion.adventurePowerIds || []).length +
                      (editingChampion.itemIds || []).length
                  },
                  { id: 'ratings', label: isEn ? 'Ratings & Overview' : 'Đánh giá & Vận hành' },
                  { id: 'assets', label: isEn ? 'Assets & Art' : 'Hình ảnh & Asset' },
                  {
                    id: 'constellation',
                    label: isEn ? 'Constellation' : 'Chòm sao',
                    badge: (editingChampion.constellation?.nodes || []).length
                  }
                ].map((tab) => {
                  const isActive = editorTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setEditorTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                        isActive
                          ? 'bg-[#222634] text-slate-100 border border-white/15'
                          : 'bg-[#14161d] text-slate-400 hover:text-slate-200 border border-transparent hover:border-white/[0.08]'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            isActive
                              ? 'bg-sky-500/20 text-sky-300'
                              : 'bg-white/[0.06] text-slate-400'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="mx-4 sm:mx-6 mt-2 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-200 text-xs font-bold text-center shadow-lg shrink-0">
                ✓ {saveSuccessMsg}
              </div>
            )}

            {/* BỐ CỤC KHUNG LÀM VIỆC: CỘT TRÁI (FORM SOẠN THẢO) & CỘT PHẢI (MENU KÉO THẢ) */}
            <div className="flex-1 min-h-0 flex flex-col xl:flex-row items-stretch gap-6 p-4 sm:p-6 overflow-hidden">
              {/* CỘT TRÁI: FORM CHÍNH DẠNG TAB (KHUNG CUỘN CHÍNH) */}
              <div className="flex-1 min-w-0 h-full overflow-y-auto space-y-6 pr-2 sm:pr-4">

            {/* TAB 1: THÔNG TIN CƠ BẢN */}
            {editorTab === 'basic' && (
            <div id="admin-sec-basic" className="p-4 sm:p-5 rounded-xl bg-[#161920] border border-white/[0.08] space-y-5">
              <h3 className="text-sm font-semibold text-slate-200 border-b border-white/[0.08] pb-3 flex items-center gap-2">
                <span className="text-sky-400 font-mono">01.</span> Thông Tin Định Danh & Thuộc Tính Cơ Bản
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Tên Tướng (VI)</label>
                  <input
                    type="text"
                    value={editingChampion.name || ''}
                    onChange={(e) => setEditingChampion({ ...editingChampion, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-slate-100 text-xs focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Tên Tiếng Anh (EN)</label>
                  <input
                    type="text"
                    value={editingChampion.translations?.en?.name || ''}
                    onChange={(e) => {
                      const tr = editingChampion.translations || {};
                      setEditingChampion({
                        ...editingChampion,
                        translations: { ...tr, en: { ...(tr.en || {}), name: e.target.value } }
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-slate-100 text-xs focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Mã Tướng (championID)</label>
                  <input
                    type="text"
                    disabled={!isNewChampion}
                    value={editingChampion.championID || ''}
                    onChange={(e) => setEditingChampion({ ...editingChampion, championID: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#14161d] border border-white/[0.06] text-slate-400 font-mono text-xs focus:border-sky-500/60 focus:outline-none disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Mã Thẻ (cardCode)</label>
                  <input
                    type="text"
                    value={editingChampion.cardCode || ''}
                    onChange={(e) => setEditingChampion({ ...editingChampion, cardCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-slate-100 font-mono text-xs focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Giá Mana (Cost)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={editingChampion.cost ?? 1}
                    onChange={(e) => setEditingChampion({ ...editingChampion, cost: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-sky-400 font-semibold font-mono text-xs focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Sao Tối Đa (Max Stars)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editingChampion.maxStar ?? 6}
                    onChange={(e) => setEditingChampion({ ...editingChampion, maxStar: Number(e.target.value) || 3 })}
                    className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-amber-400 font-semibold font-mono text-xs focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Bậc Sức Mạnh VI (Tier VI)</label>
                  <input
                    type="text"
                    value={editingChampion.tier || ''}
                    onChange={(e) => setEditingChampion({ ...editingChampion, tier: e.target.value })}
                    placeholder="VD: B Tier // Tạm được"
                    className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-amber-300 font-medium text-xs focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Bậc Sức Mạnh EN (Tier EN)</label>
                  <input
                    type="text"
                    value={editingChampion.translations?.en?.tier || ''}
                    onChange={(e) => {
                      const tr = editingChampion.translations || {};
                      setEditingChampion({
                        ...editingChampion,
                        translations: { ...tr, en: { ...(tr.en || {}), tier: e.target.value } }
                      });
                    }}
                    placeholder="VD: B Tier // Average"
                    className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-amber-300 font-medium text-xs focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Mốc Sao Chuẩn (VI)</label>
                  <input
                    type="text"
                    value={editingChampion.optimalStars || ''}
                    onChange={(e) => setEditingChampion({ ...editingChampion, optimalStars: e.target.value })}
                    placeholder="VD: 4 - 5 Sao"
                    className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-slate-100 text-xs focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Mốc Sao Chuẩn (EN)</label>
                  <input
                    type="text"
                    value={editingChampion.translations?.en?.optimalStars || ''}
                    onChange={(e) => {
                      const tr = editingChampion.translations || {};
                      setEditingChampion({
                        ...editingChampion,
                        translations: { ...tr, en: { ...(tr.en || {}), optimalStars: e.target.value } }
                      });
                    }}
                    placeholder="VD: 4 - 5 Stars"
                    className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-slate-100 text-xs focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Lối Chơi VI (PlayStyle VI)</label>
                  <input
                    type="text"
                    value={editingChampion.playStyle || ''}
                    onChange={(e) => setEditingChampion({ ...editingChampion, playStyle: e.target.value })}
                    placeholder="VD: Cân Bằng / Chỉ Số"
                    className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-slate-100 text-xs focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Lối Chơi EN (PlayStyle EN)</label>
                  <input
                    type="text"
                    value={editingChampion.translations?.en?.playStyle || ''}
                    onChange={(e) => {
                      const tr = editingChampion.translations || {};
                      setEditingChampion({
                        ...editingChampion,
                        translations: { ...tr, en: { ...(tr.en || {}), playStyle: e.target.value } }
                      });
                    }}
                    placeholder="VD: Midrange / Body Builder"
                    className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-slate-100 text-xs focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Khu Vực (cách nhau dấu phẩy)</label>
                  <input
                    type="text"
                    value={rawInputs.regions}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRawInputs((p) => ({ ...p, regions: val }));
                      const list = val.split(',').map((s) => s.trim()).filter(Boolean);
                      setEditingChampion({ ...editingChampion, regions: list });
                    }}
                    placeholder="VD: Runeterra, Ionia"
                    className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-slate-100 text-xs focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Tags VI (cách nhau dấu phẩy)</label>
                  <input
                    type="text"
                    value={rawInputs.tags}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRawInputs((p) => ({ ...p, tags: val }));
                      const list = val.split(',').map((s) => s.trim()).filter(Boolean);
                      setEditingChampion({ ...editingChampion, tags: list });
                    }}
                    placeholder="VD: Setup, High Stat, Midrange, Solo Carry"
                    className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-slate-100 text-xs focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Tags EN (cách nhau dấu phẩy)</label>
                  <input
                    type="text"
                    value={rawInputs.tagsEn}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRawInputs((p) => ({ ...p, tagsEn: val }));
                      const list = val.split(',').map((s) => s.trim()).filter(Boolean);
                      const tr = editingChampion.translations || {};
                      setEditingChampion({
                        ...editingChampion,
                        translations: { ...tr, en: { ...(tr.en || {}), tags: list } }
                      });
                    }}
                    placeholder="VD: Setup, High Stat, Midrange, Solo Carry"
                    className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-slate-100 text-xs focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                  />
                </div>
              </div>
            </div>
            )}

            {/* TAB 2: CÁC CỔ VẬT PHÙ HỢP (SUITABLE RELICS - CẤU TRÚC LINH HOẠT) & TÙY CHỌN KHÁC */}
            {editorTab === 'core' && (
            <div id="admin-sec-core" className="p-4 sm:p-5 rounded-xl bg-[#161920] border border-white/[0.08] space-y-6">
              <h3 className="text-sm font-semibold text-slate-200 border-b border-white/[0.08] pb-3 flex items-center justify-between flex-wrap gap-2">
                <span className="flex items-center gap-2">
                  <span className="text-sky-400 font-mono">02.</span> Các Cổ Vật Phù Hợp & Tùy Chọn Khác
                </span>
                <span className="text-xs text-slate-400 font-normal">
                  Kéo cổ vật từ Menu bên phải vào các khung bên dưới
                </span>
              </h3>

              {/* 2.1 CỔ VẬT BẮT BUỘC (MANDATORY CORE) */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                }}
                onDrop={handleDropToCore}
                className="p-4 rounded-xl bg-[#12141a] border border-dashed border-white/20 hover:border-sky-500/50 hover:bg-sky-500/[0.02] transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Cổ Vật Bắt Buộc / Cốt Lõi (Mandatory Relics)
                  </h4>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {(editingChampion.coreRelics?.mandatory || []).length} Món
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Kéo thả cổ vật vào đây hoặc nhập mã phân cách bằng dấu phẩy (VD: R0080, R0040 hoặc chỉ R0031).
                </p>
                <input
                  type="text"
                  value={rawInputs.coreMandatory !== undefined ? rawInputs.coreMandatory : (editingChampion.coreRelics?.mandatory || []).join(', ')}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDropToCore(e);
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRawInputs((p) => ({ ...p, coreMandatory: val }));
                    const list = val.split(',').map(cleanRelicCode).filter(Boolean);
                    setEditingChampion({
                      ...editingChampion,
                      coreRelics: {
                        ...(editingChampion.coreRelics || {}),
                        mandatory: list
                      }
                    });
                  }}
                  placeholder="VD: R0080, R0040"
                  className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-slate-100 font-mono text-xs focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                />

                {/* Visual preview with delete button */}
                <div className="flex items-center gap-2 pt-1 flex-wrap min-h-[38px]">
                  {(editingChampion.coreRelics?.mandatory || []).length === 0 ? (
                    <span className="text-xs text-slate-500 italic">Chưa có cổ vật bắt buộc (Kéo thả cổ vật vào đây)</span>
                  ) : (
                    (editingChampion.coreRelics?.mandatory || []).map((rawCode) => {
                      const code = cleanRelicCode(rawCode);
                      if (!code) return null;
                      return (
                        <div key={code} className="group/item flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1d212b] border border-white/10 shadow-sm">
                          <img
                            src={`https://images.lortpoc.com/relics/${code}.webp`}
                            alt={code}
                            className="w-6 h-6 object-contain"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <span className="text-xs font-mono font-medium text-amber-300">{code}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCoreRelic(code)}
                            className="text-slate-400 hover:text-rose-400 font-bold ml-1 text-xs cursor-pointer transition-colors"
                            title="Xóa món này"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 2.2 CÁC PHƯƠNG ÁN TÙY CHỌN ĐI KÈM (FLEXIBLE OPTIONS) */}
              <div className="p-4 rounded-xl bg-[#12141a] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                      Các Phương Án Tùy Chọn Đi Kèm (Flexible Options)
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Nếu bắt buộc có 2 món → mỗi phương án là 1 món (+C hoặc +D). Nếu bắt buộc có 1 món → mỗi phương án là 2 món (+B +C hoặc +E +F).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCoreOption}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1d212b] hover:bg-[#252a37] text-slate-200 border border-white/10 cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <span>+</span> Thêm Phương Án
                  </button>
                </div>

                {(editingChampion.coreRelics?.options || []).length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 italic bg-[#14161d] rounded-lg border border-white/[0.04]">
                    Chưa có phương án tùy chọn nào. Nhấn "+ Thêm Phương Án" để tạo lựa chọn thay thế (ví dụ: +C hoặc +D).
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(editingChampion.coreRelics?.options || []).map((optArr, optIdx) => (
                      <div
                        key={optIdx}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'copy';
                        }}
                        onDrop={(e) => handleDropToOption(optIdx, e)}
                        className="p-3.5 rounded-xl bg-[#161920] border border-white/[0.08] hover:border-white/15 transition-colors space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-200 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                            Phương Án {optIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCoreOption(optIdx)}
                            className="text-xs text-slate-400 hover:text-rose-400 font-medium cursor-pointer transition-colors"
                          >
                            ✕ Xóa
                          </button>
                        </div>

                        <input
                          type="text"
                          value={Array.isArray(optArr) ? optArr.join(', ') : optArr}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDropToOption(optIdx, e);
                          }}
                          onChange={(e) => handleOptionTextInputChange(optIdx, e.target.value)}
                          placeholder="VD: R0025 hoặc R0040, R0025 (kéo thả hoặc nhập mã)"
                          className="w-full px-3 py-2 rounded-lg bg-[#12141a] border border-white/10 text-slate-100 font-mono text-xs focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                        />

                        {/* Visual preview of relics inside this option */}
                        <div className="flex items-center gap-2 flex-wrap min-h-[32px]">
                          {(Array.isArray(optArr) ? optArr : []).length === 0 ? (
                            <span className="text-xs text-slate-500 italic">Kéo thả cổ vật vào đây hoặc nhập mã</span>
                          ) : (
                            (Array.isArray(optArr) ? optArr : []).map((rawCode) => {
                              const code = cleanRelicCode(rawCode);
                              if (!code) return null;
                              return (
                                <div key={code} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#12141a] border border-white/10">
                                  <img
                                    src={`https://images.lortpoc.com/relics/${code}.webp`}
                                    alt={code}
                                    className="w-5 h-5 object-contain"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                  <span className="text-[11px] font-mono font-medium text-slate-200">{code}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOptionRelic(optIdx, code)}
                                    className="text-slate-400 hover:text-rose-400 text-xs ml-0.5 cursor-pointer font-bold transition-colors"
                                    title="Xóa món"
                                  >
                                    ✕
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2.3 MÔ TẢ PHÂN TÍCH (DESCRIPTION) */}
              <div className="p-4 rounded-xl bg-[#12141a] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Mô Tả Phân Tích & Hướng Dẫn Chọn Cổ Vật (Description)
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Hỗ trợ LorMarkup & Gợi ý (@)
                  </span>
                </div>
                <RichMarkupTextarea
                  label="Mô Tả Phân Tích Cổ Vật Cốt Lõi (VI)"
                  rows={4}
                  value={rawInputs.coreDescription !== undefined ? rawInputs.coreDescription : (editingChampion.coreRelics?.description || '')}
                  onChange={handleCoreDescriptionChange}
                  placeholder="Nhập mô tả giải thích tại sao chọn các món bắt buộc và khi nào nên chọn phương án thay thế... (Gõ @ để chèn Cổ vật, Sức mạnh, Tướng)"
                  relics={relics}
                  powers={powers}
                  champions={champions}
                  items={items}
                  cards={cards}
                />
                <RichMarkupTextarea
                  label="Core Relics Analysis & Strategy (EN)"
                  rows={4}
                  value={editingChampion.coreRelics?.translations?.en?.description || ''}
                  onChange={(val) => {
                    const curCore = editingChampion.coreRelics || {};
                    const curTr = curCore.translations || {};
                    setEditingChampion({
                      ...editingChampion,
                      coreRelics: {
                        ...curCore,
                        translations: {
                          ...curTr,
                          en: { ...(curTr.en || {}), description: val }
                        }
                      }
                    });
                  }}
                  placeholder="Explain why core relics are mandatory and alternative choices in English... (Type @ to mention)"
                  relics={relics}
                  powers={powers}
                  champions={champions}
                  items={items}
                  cards={cards}
                />
              </div>

              {/* 2.4 TÙY CHỌN CỔ VẬT KHÁC (OTHER RELIC OPTIONS) */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                }}
                onDrop={handleDropToOther}
                className="p-4 rounded-xl bg-[#12141a] border border-dashed border-white/20 hover:border-sky-500/50 hover:bg-sky-500/[0.02] transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Tùy Chọn Cổ Vật Khác (Other Relic Options)
                  </h4>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-white/[0.06] text-slate-300 border border-white/10">
                    {(editingChampion.otherRelicOptions || []).length} Tùy chọn
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Kéo thả cổ vật vào đây hoặc nhập mã (phân cách bằng dấu phẩy).
                </p>
                <input
                  type="text"
                  value={rawInputs.otherRelicOptions}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDropToOther(e);
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRawInputs((p) => ({ ...p, otherRelicOptions: val }));
                    const list = val.split(',').map(cleanRelicCode).filter(Boolean);
                    setEditingChampion({ ...editingChampion, otherRelicOptions: list });
                  }}
                  placeholder="VD: R0060, R0020, R0114"
                  className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-slate-100 font-mono text-xs focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                />

                {/* Visual preview with delete button */}
                <div className="flex items-center gap-2 pt-1 flex-wrap min-h-[38px]">
                  {(editingChampion.otherRelicOptions || []).length === 0 ? (
                    <span className="text-xs text-slate-500 italic">Chưa có cổ vật tùy chọn (Thả cổ vật vào đây)</span>
                  ) : (
                    (editingChampion.otherRelicOptions || []).map((rawCode) => {
                      const code = cleanRelicCode(rawCode);
                      if (!code) return null;
                      return (
                        <div key={code} className="group/item flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1d212b] border border-white/10 shadow-sm">
                          <img
                            src={`https://images.lortpoc.com/relics/${code}.webp`}
                            alt={code}
                            className="w-6 h-6 object-contain"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <span className="text-xs font-mono text-slate-300">{code}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveOtherRelic(code)}
                            className="text-slate-400 hover:text-rose-400 font-bold ml-1 text-xs cursor-pointer transition-colors"
                            title="Xóa món này"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            )}

            {/* TAB 3: BỘ CỔ VẬT ĐỀ XUẤT (RELIC SETS) */}
            {editorTab === 'builds' && (
            <div id="admin-sec-builds" className="p-4 sm:p-5 rounded-xl bg-[#161920] border border-white/[0.08] space-y-6">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <span className="text-sky-400 font-mono">03.</span> Các Bộ Cổ Vật Đề Xuất ({ (editingChampion.relicSets || []).length } Bộ)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Mỗi bộ trang bị gồm tiêu đề, 3 ô cổ vật, sao khuyên dùng và phân tích chiến thuật chi tiết.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const cur = editingChampion.relicSets || [];
                    const newSet = {
                      recommendedStars: 3,
                      items: ['', '', ''],
                      description: '',
                      videoLink: ''
                    };
                    setEditingChampion({ ...editingChampion, relicSets: [...cur, newSet] });
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                >
                  + Thêm Bộ Cổ Vật Mới
                </button>
              </div>

              <div className="space-y-4">
                {(editingChampion.relicSets || []).map((set, sIdx) => {
                  const isArr = Array.isArray(set);
                  const setObj = isArr ? { items: set } : set;

                  return (
                    <div
                      key={sIdx}
                      className="p-4 sm:p-5 rounded-xl bg-[#12141a] border border-white/[0.08] hover:border-white/15 transition-colors space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 flex-wrap gap-2">
                        <span className="font-semibold text-sm text-slate-200">
                          Bộ #{sIdx + 1}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Bạn có chắc muốn xóa Bộ #${sIdx + 1}?`)) {
                              const updated = editingChampion.relicSets.filter((_, i) => i !== sIdx);
                              setEditingChampion({ ...editingChampion, relicSets: updated });
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-medium transition-colors cursor-pointer"
                        >
                          Xóa bộ này
                        </button>
                      </div>

                      <div className="max-w-xs">
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Mốc Sao Khuyên Dùng (1 - 6)</label>
                        <input
                          type="number"
                          min="1"
                          max="6"
                          value={setObj.recommendedStars ?? 3}
                          onChange={(e) => {
                            const copy = [...editingChampion.relicSets];
                            copy[sIdx] = { ...setObj, recommendedStars: Number(e.target.value) || 1 };
                            setEditingChampion({ ...editingChampion, relicSets: copy });
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-amber-300 font-medium font-mono text-xs focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                        />
                      </div>

                      {/* 3 Relic Slots Inputs with DROP ZONE */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                          <label className="block text-xs font-medium text-slate-300">
                            3 Ô Cổ Vật (Kéo thả từ Menu bên phải hoặc nhập mã)
                          </label>
                          <span className="text-[11px] text-slate-400">
                            Tối đa 3 món (Hỗ trợ kéo thả)
                          </span>
                        </div>
                        <input
                          type="text"
                          value={rawInputs.setItems?.[sIdx] !== undefined ? rawInputs.setItems[sIdx] : (Array.isArray(setObj.items) ? setObj.items.join(', ') : '')}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const code = extractDropCode(e);
                            if (!code) return;
                            const items = [...(setObj.items || [])].map(cleanRelicCode).filter(Boolean);
                            if (items.length < 3 && !items.includes(code)) {
                              items.push(code);
                              const copy = [...editingChampion.relicSets];
                              copy[sIdx] = { ...setObj, items };
                              setEditingChampion({ ...editingChampion, relicSets: copy });
                              setRawInputs((p) => ({
                                ...p,
                                setItems: { ...p.setItems, [sIdx]: items.join(', ') }
                              }));
                            }
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRawInputs((p) => ({
                              ...p,
                              setItems: { ...p.setItems, [sIdx]: val }
                            }));
                            const items = val
                              .split(',')
                              .map(cleanRelicCode)
                              .filter(Boolean)
                              .slice(0, 3);
                            const copy = [...editingChampion.relicSets];
                            copy[sIdx] = { ...setObj, items };
                            setEditingChampion({ ...editingChampion, relicSets: copy });
                          }}
                          placeholder="VD: R0080, R0040, R0118"
                          className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-slate-100 font-mono text-xs focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                        />

                        {/* Visual 3 slots preview with DROP ZONE */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                          {[0, 1, 2].map((slotIdx) => {
                            const setRelics = Array.isArray(setObj.items) ? setObj.items : (Array.isArray(set) ? set : []);
                            const code = cleanRelicCode(setRelics[slotIdx]);
                            const relicInfo = code ? relicMap.get(code) : null;
                            const relicName = relicInfo?.name || '';
                            return (
                              <div
                                key={slotIdx}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = 'copy';
                                }}
                                onDrop={(e) => handleDropToSlot(sIdx, slotIdx, e)}
                                className={`group/slot relative flex items-center justify-between gap-3 p-2.5 rounded-lg border transition-colors ${
                                  code
                                    ? 'bg-[#1d212b] border-white/10 hover:border-sky-500/40'
                                    : 'bg-[#14161d] border-dashed border-white/15 hover:border-sky-500/40'
                                }`}
                                title={code ? `${code}${relicName ? ` - ${relicName}` : ''}` : 'Kéo thả cổ vật vào đây để trang bị'}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-9 h-9 rounded-md bg-[#12141a] border border-white/10 p-0.5 flex items-center justify-center shrink-0">
                                    {code ? (
                                      <img
                                        src={`https://images.lortpoc.com/relics/${code}.webp`}
                                        alt={code}
                                        className="w-full h-full object-contain"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                      />
                                    ) : (
                                      <span className="text-[10px] text-slate-500 font-mono">Ô {slotIdx + 1}</span>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-mono text-slate-400 block">Slot {slotIdx + 1}</span>
                                    <div className="flex items-baseline gap-1.5 min-w-0">
                                      <span className={`text-xs font-mono font-medium truncate block ${code ? 'text-sky-300' : 'text-slate-400'}`}>
                                        {code || 'Thả cổ vật vào đây'}
                                      </span>
                                      {relicName && (
                                        <span className="text-[11px] text-slate-300 truncate font-sans hidden sm:inline" title={relicName}>
                                          ({relicName})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {code && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSlotItem(sIdx, slotIdx)}
                                    className="p-1 rounded-md bg-rose-500/10 text-rose-300 hover:text-white hover:bg-rose-500/30 border border-rose-500/20 text-xs transition-colors cursor-pointer shrink-0"
                                    title="Gỡ cổ vật này"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Strategy Description (VI) with Rich Markup & @ */}
                      <RichMarkupTextarea
                        label="Phân Tích Chiến Thuật & Tương Tác (VI)"
                        rows={4}
                        value={setObj.description || ''}
                        onChange={(val) => {
                          const copy = [...editingChampion.relicSets];
                          copy[sIdx] = { ...setObj, description: val };
                          setEditingChampion({ ...editingChampion, relicSets: copy });
                        }}
                        placeholder="Chi tiết cách bộ trang bị này vận hành... (Gõ @ để chèn Cổ vật, Sức mạnh, Tướng)"
                        relics={relics}
                        powers={powers}
                        champions={champions}
                        items={items}
                        cards={cards}
                      />

                      {/* Strategy Description (EN) with Rich Markup & @ */}
                      <RichMarkupTextarea
                        label="Strategy & Synergies Description (EN)"
                        rows={4}
                        value={setObj.translations?.en?.description || ''}
                        onChange={(val) => {
                          const copy = [...editingChampion.relicSets];
                          const curTr = setObj.translations || {};
                          copy[sIdx] = {
                            ...setObj,
                            translations: {
                              ...curTr,
                              en: { ...(curTr.en || {}), description: val }
                            }
                          };
                          setEditingChampion({ ...editingChampion, relicSets: copy });
                        }}
                        placeholder="Strategy and gameplay synergies in English... (Type @ to mention)"
                        relics={relics}
                        powers={powers}
                        champions={champions}
                        items={items}
                        cards={cards}
                      />

                      {/* Video Link */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Link Video Hướng Dẫn (Tùy chọn)
                        </label>
                        <input
                          type="text"
                          value={setObj.videoLink || ''}
                          onChange={(e) => {
                            const copy = [...editingChampion.relicSets];
                            copy[sIdx] = { ...setObj, videoLink: e.target.value };
                            setEditingChampion({ ...editingChampion, relicSets: copy });
                          }}
                          placeholder="https://www.youtube.com/embed/..."
                          className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-slate-200 text-xs font-mono focus:border-sky-500/60 focus:outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            )}

            {/* TAB 4: VẬT PHẨM & SỨC MẠNH (SYNERGIES) */}
            {editorTab === 'synergies' && (
            <div id="admin-sec-synergies" className="p-4 sm:p-5 rounded-xl bg-[#161920] border border-white/[0.08] space-y-6">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 flex-wrap gap-2">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <span className="text-sky-400 font-mono">04.</span> Sức Mạnh Ngôi Sao & Vật Phẩm Khuyên Dùng
                </h3>
                <span className="text-xs text-slate-400">
                  Kéo thả từ Menu bên phải hoặc nhập mã code
                </span>
              </div>

              {/* 4.1 SỨC MẠNH NGÔI SAO (STAR POWERS: 1★ - 6★) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Sức Mạnh Ngôi Sao (Star Powers: 1★ - 6★)
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sức mạnh nội tại kích hoạt tương ứng từ mốc 1 Sao đến 6 Sao của tướng. Kéo thả sức mạnh vào từng ô sao.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {(editingChampion.powerStarIds || []).filter(Boolean).length}/6 Sao
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {[0, 1, 2, 3, 4, 5].map((starIdx) => {
                    const starNum = starIdx + 1;
                    const code = cleanRelicCode((editingChampion.powerStarIds || [])[starIdx]);
                    const powerInfo = powerMap.get(code);
                    const pName = powerInfo?.name || code;
                    const pDesc = powerInfo?.descriptionRaw || powerInfo?.description || '';
                    const pRarity = powerInfo?.rarity || '';
                    const pImage = powerInfo?.assetAbsolutePath || (code ? `https://dd.b.pvp.net/6_9_0/adventure/vi_vn/img/powers/${code}.png` : null);

                    return (
                      <div
                        key={starIdx}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'copy';
                        }}
                        onDrop={(e) => handleDropToStarPower(starIdx, e)}
                        className={`p-3 rounded-lg border transition-colors space-y-2.5 ${
                          code
                            ? 'bg-[#14161d] border-amber-500/30 hover:border-amber-500/50'
                            : 'bg-[#12141a] border-dashed border-white/15 hover:border-amber-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold font-mono bg-amber-500/15 text-amber-300 border border-amber-500/25">
                            {starNum}★
                          </span>
                          {code && (
                            <button
                              type="button"
                              onClick={() => handleRemoveStarPower(starIdx)}
                              className="text-xs text-slate-400 hover:text-rose-400 font-medium cursor-pointer transition-colors"
                              title="Gỡ sức mạnh này"
                            >
                              ✕ Gỡ
                            </button>
                          )}
                        </div>

                        {code ? (
                          <div className="flex items-start gap-2.5 min-h-[48px]">
                            <div className="w-10 h-10 rounded-md bg-[#12141a] border border-white/10 p-0.5 flex items-center justify-center shrink-0">
                              <img
                                src={pImage}
                                alt={pName}
                                className="w-full h-full object-contain"
                                onError={(e) => handleImageError(e, 'power')}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-semibold text-xs text-slate-100 truncate block" title={pName}>
                                  {pName}
                                </span>
                                {pRarity && (
                                  <span className="text-[9px] px-1 py-0.2 rounded font-medium uppercase bg-white/[0.06] text-slate-300 shrink-0">
                                    {pRarity}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-amber-300/80 block mt-0.5">{code}</span>
                              {pDesc && (
                                <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                                  {pDesc}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="py-2.5 text-center text-xs text-slate-500 italic">
                            Kéo thả sức mạnh vào đây
                          </div>
                        )}

                        <input
                          type="text"
                          value={code}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDropToStarPower(starIdx, e);
                          }}
                          onChange={(e) => handleStarPowerCodeChange(starIdx, e.target.value)}
                          placeholder={`Mã sao ${starNum}★ (VD: P0156)`}
                          className="w-full px-2.5 py-1.5 rounded-md bg-[#12141a] border border-white/10 text-slate-100 font-mono text-xs focus:border-amber-500/60 focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4.2 SỨC MẠNH PHIÊU LƯU KHUYÊN DÙNG (ADVENTURE POWERS) */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                }}
                onDrop={handleDropToAdventurePower}
                className="p-4 rounded-xl bg-[#12141a] border border-dashed border-white/20 hover:border-sky-500/50 hover:bg-sky-500/[0.02] transition-colors space-y-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                      Sức Mạnh Phiêu Lưu Khuyên Dùng (Adventure Powers)
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Các sức mạnh nhặt trong cuộc phiêu lưu phù hợp nhất với lối chơi của tướng.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                    {(editingChampion.adventurePowerIds || []).length} Sức mạnh
                  </span>
                </div>

                <input
                  type="text"
                  value={rawInputs.adventurePowerIds !== undefined ? rawInputs.adventurePowerIds : (editingChampion.adventurePowerIds || []).join(', ')}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDropToAdventurePower(e);
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRawInputs((p) => ({ ...p, adventurePowerIds: val }));
                    const list = val.split(',').map(cleanRelicCode).filter(Boolean);
                    setEditingChampion({ ...editingChampion, adventurePowerIds: list });
                  }}
                  placeholder="VD: P0067, P0680, P0222 (Kéo thả hoặc nhập mã phân cách bằng dấu phẩy)"
                  className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-slate-100 font-mono text-xs focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                />

                {/* Visual Preview */}
                <div className="flex items-center gap-2 pt-1 flex-wrap min-h-[38px]">
                  {(editingChampion.adventurePowerIds || []).length === 0 ? (
                    <span className="text-xs text-slate-500 italic">
                      Chưa có sức mạnh phiêu lưu nào (Kéo thả từ tab Sức Mạnh ở Menu bên phải vào đây)
                    </span>
                  ) : (
                    (editingChampion.adventurePowerIds || []).map((rawCode) => {
                      const code = cleanRelicCode(rawCode);
                      if (!code) return null;
                      const pInfo = powerMap.get(code);
                      const pName = pInfo?.name || code;
                      const pImage = pInfo?.assetAbsolutePath || `https://dd.b.pvp.net/6_9_0/adventure/vi_vn/img/powers/${code}.png`;

                      return (
                        <div
                          key={code}
                          className="group/item flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1d212b] border border-white/10 shadow-sm"
                        >
                          <img
                            src={pImage}
                            alt={pName}
                            className="w-6 h-6 object-contain"
                            onError={(e) => handleImageError(e, 'power')}
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-200 max-w-[140px] truncate" title={pName}>
                              {pName}
                            </span>
                            <span className="text-[10px] font-mono text-sky-400 font-medium">{code}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAdventurePower(code)}
                            className="text-slate-400 hover:text-rose-400 font-bold ml-1 text-xs cursor-pointer transition-colors"
                            title="Xóa sức mạnh này"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 4.3 VẬT PHẨM KHUYÊN DÙNG (RECOMMENDED ITEMS) */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                }}
                onDrop={handleDropToItem}
                className="p-4 rounded-xl bg-[#12141a] border border-dashed border-white/20 hover:border-emerald-500/50 hover:bg-emerald-500/[0.02] transition-colors space-y-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Vật Phẩm Khuyên Dùng (Recommended Items)
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Các vật phẩm trang bị tối ưu nhất để nâng cấp bài trong hành trình phiêu lưu.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {(editingChampion.itemIds || []).length} Vật phẩm
                  </span>
                </div>

                <input
                  type="text"
                  value={rawInputs.itemIds !== undefined ? rawInputs.itemIds : (editingChampion.itemIds || []).join(', ')}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDropToItem(e);
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRawInputs((p) => ({ ...p, itemIds: val }));
                    const list = val.split(',').map(cleanRelicCode).filter(Boolean);
                    setEditingChampion({ ...editingChampion, itemIds: list });
                  }}
                  placeholder="VD: I0118, I0077, I0014 (Kéo thả hoặc nhập mã phân cách bằng dấu phẩy)"
                  className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-slate-100 font-mono text-xs focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                />

                {/* Visual Preview */}
                <div className="flex items-center gap-2 pt-1 flex-wrap min-h-[38px]">
                  {(editingChampion.itemIds || []).length === 0 ? (
                    <span className="text-xs text-slate-500 italic">
                      Chưa có vật phẩm nào (Kéo thả từ tab Vật Phẩm ở Menu bên phải vào đây)
                    </span>
                  ) : (
                    (editingChampion.itemIds || []).map((rawCode) => {
                      const code = cleanRelicCode(rawCode);
                      if (!code) return null;
                      const itInfo = itemMap.get(code);
                      const itName = itInfo?.name || code;
                      const itImage = itInfo?.assetAbsolutePath || 'https://images.lortpoc.com/icon/itemIcon.webp';

                      return (
                        <div
                          key={code}
                          className="group/item flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1d212b] border border-white/10 shadow-sm"
                        >
                          <img
                            src={itImage}
                            alt={itName}
                            className="w-6 h-6 object-contain"
                            onError={(e) => handleImageError(e, 'item')}
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-200 max-w-[140px] truncate" title={itName}>
                              {itName}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400 font-medium">{code}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(code)}
                            className="text-slate-400 hover:text-rose-400 font-bold ml-1 text-xs cursor-pointer transition-colors"
                            title="Xóa vật phẩm này"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            )}

            {/* TAB 5: CHỈ SỐ ĐÁNH GIÁ (RATINGS) & MÔ TẢ TỔNG QUAN */}
            {editorTab === 'ratings' && (
            <div id="admin-sec-ratings" className="p-4 sm:p-5 rounded-xl bg-[#161920] border border-white/[0.08] space-y-6">
              <h3 className="text-sm font-semibold text-slate-200 border-b border-white/[0.08] pb-3 flex items-center gap-2">
                <span className="text-sky-400 font-mono">05.</span> Thang Điểm Năng Lực & Mô Tả Chi Tiết
              </h3>

              {/* Ratings Grid */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2.5">
                  Thang Điểm Năng Lực (1 - 10)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { key: 'damage', label: 'Sát Thương (Damage)', color: 'text-rose-400', barColor: 'bg-rose-500' },
                    { key: 'defense', label: 'Phòng Thủ (Defense)', color: 'text-sky-400', barColor: 'bg-sky-500' },
                    { key: 'synergy', label: 'Tương Tác (Synergy)', color: 'text-purple-400', barColor: 'bg-purple-500' },
                    { key: 'difficulty', label: 'Độ Khó (Difficulty)', color: 'text-amber-400', barColor: 'bg-amber-500' }
                  ].map((rate) => {
                    const currentVal = editingChampion.ratings?.[rate.key] !== undefined && editingChampion.ratings?.[rate.key] !== ''
                      ? editingChampion.ratings[rate.key]
                      : 7;
                    const numVal = Number(currentVal) || 0;

                    return (
                      <div key={rate.key} className="p-3.5 rounded-lg bg-[#12141a] border border-white/[0.08] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-medium block ${rate.color}`}>{rate.label}</span>
                          <span className="text-xs font-mono font-medium text-slate-200">{numVal}/10</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const cur = Number(editingChampion.ratings?.[rate.key] ?? 7);
                              const next = Math.max(0, Math.round((cur - 0.5) * 10) / 10);
                              setEditingChampion({
                                ...editingChampion,
                                ratings: { ...(editingChampion.ratings || {}), [rate.key]: next }
                              });
                            }}
                            className="px-2 py-1 rounded bg-[#1d212b] hover:bg-[#252a37] text-slate-300 hover:text-white font-mono text-xs cursor-pointer border border-white/10 transition-colors"
                            title="Giảm 0.5"
                          >
                            -0.5
                          </button>

                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={editingChampion.ratings?.[rate.key] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const curRatings = editingChampion.ratings || {};
                              setEditingChampion({
                                ...editingChampion,
                                ratings: { ...curRatings, [rate.key]: val === '' ? '' : parseFloat(val) }
                              });
                            }}
                            className="w-full px-2 py-1 rounded-lg bg-[#12141a] border border-white/10 text-slate-100 font-mono text-xs text-center focus:border-sky-500/60 focus:outline-none"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              const cur = Number(editingChampion.ratings?.[rate.key] ?? 7);
                              const next = Math.min(10, Math.round((cur + 0.5) * 10) / 10);
                              setEditingChampion({
                                ...editingChampion,
                                ratings: { ...(editingChampion.ratings || {}), [rate.key]: next }
                              });
                            }}
                            className="px-2 py-1 rounded bg-[#1d212b] hover:bg-[#252a37] text-slate-300 hover:text-white font-mono text-xs cursor-pointer border border-white/10 transition-colors"
                            title="Tăng 0.5"
                          >
                            +0.5
                          </button>
                        </div>

                        {/* Mini bar preview */}
                        <div className="w-full h-1.5 rounded-full bg-[#1d212b] border border-white/[0.06] overflow-hidden">
                          <div
                            className={`h-full ${rate.barColor} rounded-full transition-all`}
                            style={{ width: `${Math.min(100, Math.max(0, (numVal / 10) * 100))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Descriptions VI & EN with Rich Markup & @ */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <RichMarkupTextarea
                    label="Mô Tả Tổng Quan Về Tướng (VI)"
                    rows={6}
                    value={editingChampion.description || ''}
                    onChange={(val) => setEditingChampion({ ...editingChampion, description: val })}
                    placeholder="Mô tả chi tiết phong cách, điểm mạnh và cách vận hành... (Gõ @ để gắn thẻ)"
                    relics={relics}
                    powers={powers}
                    champions={champions}
                    items={items}
                    cards={cards}
                  />
                </div>

                <div>
                  <RichMarkupTextarea
                    label="Overview Description (EN)"
                    rows={6}
                    value={editingChampion.translations?.en?.description || ''}
                    onChange={(val) => {
                      const tr = editingChampion.translations || {};
                      setEditingChampion({
                        ...editingChampion,
                        translations: { ...tr, en: { ...(tr.en || {}), description: val } }
                      });
                    }}
                    placeholder="Champion overview guide in English... (Type @ to mention)"
                    relics={relics}
                    powers={powers}
                    champions={champions}
                    items={items}
                    cards={cards}
                  />
                </div>
              </div>
            </div>
            )}

            {/* TAB 6: ARTWORK ASSETS */}
            {editorTab === 'assets' && (
            <div id="admin-sec-assets" className="p-4 sm:p-5 rounded-xl bg-[#161920] border border-white/[0.08] space-y-6">
              <h3 className="text-sm font-semibold text-slate-200 border-b border-white/[0.08] pb-3 flex items-center gap-2">
                <span className="text-sky-400 font-mono">06.</span> Hình Ảnh & Splash Art (Assets)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {/* 1. URL Avatar Artwork */}
                <div className="p-4 rounded-xl bg-[#12141a] border border-white/[0.08] space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-300">URL Avatar Artwork (avatar)</label>
                    <input
                      type="text"
                      value={editingChampion.assets?.[0]?.avatar || ''}
                      onChange={(e) => {
                        const curAssets = Array.isArray(editingChampion.assets) && editingChampion.assets.length > 0
                          ? [...editingChampion.assets]
                          : [{}];
                        curAssets[0] = { ...curAssets[0], avatar: e.target.value };
                        setEditingChampion({ ...editingChampion, assets: curAssets });
                      }}
                      placeholder="https://images.lortpoc.com/avatarChampions/..."
                      className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-slate-100 text-xs font-mono focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                    />
                    <p className="text-[11px] text-slate-400">Ảnh đại diện hiển thị trong danh sách và thẻ tướng</p>
                  </div>
                  {/* Live Avatar Preview */}
                  <div className="pt-2 border-t border-white/[0.08] flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg bg-[#161920] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                      {editingChampion.assets?.[0]?.avatar ? (
                        <img
                          src={editingChampion.assets[0].avatar}
                          alt="Avatar Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <span className="text-xs text-slate-500 font-mono">No Art</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">Xem trước Avatar (1:1)</span>
                  </div>
                </div>

                {/* 2. URL Full Splash Art */}
                <div className="p-4 rounded-xl bg-[#12141a] border border-white/[0.08] space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-300">URL Full Splash Art (fullAbsolutePath)</label>
                    <input
                      type="text"
                      value={editingChampion.assets?.[0]?.fullAbsolutePath || ''}
                      onChange={(e) => {
                        const curAssets = Array.isArray(editingChampion.assets) && editingChampion.assets.length > 0
                          ? [...editingChampion.assets]
                          : [{}];
                        curAssets[0] = { ...curAssets[0], fullAbsolutePath: e.target.value };
                        setEditingChampion({ ...editingChampion, assets: curAssets });
                      }}
                      placeholder="https://dd.b.pvp.net/...-full.png"
                      className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-slate-100 text-xs font-mono focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                    />
                    <p className="text-[11px] text-slate-400">Ảnh nền toàn cảnh khổ ngang hiển thị ở đầu trang chi tiết</p>
                  </div>
                  {/* Live Splash Preview */}
                  <div className="pt-2 border-t border-white/[0.08] flex items-center gap-3">
                    <div className="w-20 h-14 rounded-lg bg-[#161920] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                      {editingChampion.assets?.[0]?.fullAbsolutePath ? (
                        <img
                          src={editingChampion.assets[0].fullAbsolutePath}
                          alt="Splash Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <span className="text-xs text-slate-500 font-mono">No Art</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">Xem trước Splash Art</span>
                  </div>
                </div>

                {/* 3. URL Card In-Game Art (gameAbsolutePath) */}
                <div className="p-4 rounded-xl bg-[#12141a] border border-white/[0.08] space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-300">URL Ảnh Thẻ Bài In-Game (gameAbsolutePath)</label>
                    <input
                      type="text"
                      value={editingChampion.assets?.[0]?.gameAbsolutePath || ''}
                      onChange={(e) => {
                        const curAssets = Array.isArray(editingChampion.assets) && editingChampion.assets.length > 0
                          ? [...editingChampion.assets]
                          : [{}];
                        curAssets[0] = { ...curAssets[0], gameAbsolutePath: e.target.value };
                        setEditingChampion({ ...editingChampion, assets: curAssets });
                      }}
                      placeholder="https://dd.b.pvp.net/.../cards/06RU026.png"
                      className="w-full px-3 py-2 rounded-lg bg-[#1d212b] border border-white/10 text-slate-100 text-xs font-mono focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
                    />
                    <p className="text-[11px] text-slate-400">Ảnh thẻ bài dọc in-game làm hình minh họa và fallback</p>
                  </div>
                  {/* Live Card Preview */}
                  <div className="pt-2 border-t border-white/[0.08] flex items-center gap-3">
                    <div className="w-10 h-14 rounded-lg bg-[#161920] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                      {editingChampion.assets?.[0]?.gameAbsolutePath ? (
                        <img
                          src={editingChampion.assets[0].gameAbsolutePath}
                          alt="Card Preview"
                          className="w-full h-full object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">No Art</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">Xem trước Thẻ bài</span>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* TAB 7: CHÒM SAO (CONSTELLATION) */}
            {editorTab === 'constellation' && (
              <div id="admin-sec-constellation" className="p-4 sm:p-5 rounded-xl bg-[#161920] border border-white/[0.08] space-y-4">
                <ConstellationEditor
                  constellation={
                    editingChampion.constellation || {
                      constellationID: editingChampion.championID,
                      championName: editingChampion.name,
                      backgroundImage: '',
                      nodes: []
                    }
                  }
                  onChange={(updatedConstellation) => {
                    setEditingChampion({
                      ...editingChampion,
                      constellation: updatedConstellation
                    });
                  }}
                  powers={powers}
                  bonusStars={bonusStars}
                  championName={editingChampion.name}
                  championID={editingChampion.championID}
                />
              </div>
            )}

            {/* Bottom Floating Actions with Tab Switching Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {editorTab !== 'basic' && (
                  <button
                    type="button"
                    onClick={() => {
                      const tabs = ['basic', 'core', 'builds', 'synergies', 'ratings', 'assets', 'constellation'];
                      const idx = tabs.indexOf(editorTab);
                      if (idx > 0) setEditorTab(tabs[idx - 1]);
                    }}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg bg-[#161920] hover:bg-[#1d212b] text-slate-300 hover:text-slate-100 text-xs font-medium transition-colors cursor-pointer border border-white/10"
                  >
                    ← {isEn ? 'Previous Tab' : 'Tab Trước'}
                  </button>
                )}
                {editorTab !== 'constellation' && (
                  <button
                    type="button"
                    onClick={() => {
                      const tabs = ['basic', 'core', 'builds', 'synergies', 'ratings', 'assets', 'constellation'];
                      const idx = tabs.indexOf(editorTab);
                      if (idx < tabs.length - 1) setEditorTab(tabs[idx + 1]);
                    }}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg bg-[#1f232e] hover:bg-[#252a37] border border-white/10 text-sky-400 hover:text-sky-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {isEn ? 'Next Tab' : 'Tab Kế Tiếp'} →
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-lg bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'Hủy Bỏ'}
                </button>

                <button
                  type="button"
                  disabled={saveLoading}
                  onClick={handleSaveChampion}
                  className="px-6 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saveLoading ? (isEn ? 'Saving...' : 'Đang Lưu...') : (isEn ? 'Save Changes' : 'Lưu Thay Đổi')}
                </button>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: MENU KÉO THẢ TÀI NGUYÊN (CỐ ĐỊNH TRONG KHUNG LÀM VIỆC) */}
          {isDropPanelOpen && (
            <aside className="fixed bottom-4 right-4 z-40 w-[calc(100vw-32px)] sm:w-96 h-[calc(100vh-140px)] max-h-[640px] xl:static xl:w-88 2xl:w-96 xl:h-full shrink-0 rounded-xl bg-[#101216] border border-white/[0.08] shadow-2xl flex flex-col overflow-hidden">
              <DropDragSidePanel
                isOpen={true}
                onClose={() => setIsDropPanelOpen(false)}
                relics={relics}
                powers={powers}
                bonusStars={bonusStars}
                items={items}
                cards={cards}
                onQuickAssignRelic={handleQuickAssignRelic}
                onQuickAssignPower={handleQuickAssignPower}
                onQuickAssignItem={handleQuickAssignItem}
              />
            </aside>
          )}
        </div>
      </div>
    ) : (
          /* ============================================================ */
          /* MODULE 2: LIST VIEW FOR CHAMPIONS & OTHER MODULES            */
          /* ============================================================ */
          <div className="flex-1 h-full min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="space-y-6 max-w-7xl mx-auto">
            {/* Top Bar with Section Info & Primary Action */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-[#161920] border border-white/[0.08]">
              <div>
                {/* Link Phân Cấp (Breadcrumb) Cho Danh Sách Module Quản Trị */}
                <nav aria-label="Admin Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 flex-wrap">
                  <a
                    href="/"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate?.('home');
                    }}
                    className="hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Về Trang Chủ"
                  >
                    <AdminIcons.Home className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isEn ? 'Home' : 'Trang Chủ'}</span>
                  </a>
                  <span className="text-slate-600">/</span>
                  <a
                    href={ADMIN_ROUTE_PREFIX}
                    onClick={(e) => {
                      e.preventDefault();
                      goToModule('overview');
                    }}
                    className={`hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeModule === 'overview' ? 'text-sky-400 font-medium' : ''
                    }`}
                    title="Tổng Quan Quản Trị"
                  >
                    <AdminIcons.Overview className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isEn ? 'Admin Portal' : 'Quản Trị Hệ Thống'}</span>
                  </a>
                  {activeModule !== 'overview' && (
                    <>
                      <span className="text-slate-600">/</span>
                      <span className="text-sky-400 font-medium flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5">{navModules.find((m) => m.id === activeModule)?.icon}</span>
                        <span>{navModules.find((m) => m.id === activeModule)?.label}</span>
                      </span>
                    </>
                  )}
                </nav>

                <h1 className="text-lg sm:text-xl font-semibold text-slate-100 flex items-center gap-2">
                  <span className="text-sky-400">{navModules.find((m) => m.id === activeModule)?.icon}</span>
                  <span>{navModules.find((m) => m.id === activeModule)?.label}</span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quản lý và cập nhật toàn bộ cơ sở dữ liệu thời gian thực.
                </p>
              </div>

              {activeModule === 'champions' && (
                <a
                  href={`${ADMIN_ROUTE_PREFIX}/champion/new`}
                  onClick={(e) => {
                    e.preventDefault();
                    goToChampionCreate();
                  }}
                  className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <AdminIcons.Plus className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Add Champion' : 'Thêm Tướng Mới'}</span>
                </a>
              )}
            </div>

            {/* TAB: OVERVIEW */}
            {activeModule === 'overview' && (
              <div className="space-y-5">
                {/* 1. Real-time Concurrent Users / Live Activity Monitor */}
                <div className="p-4 sm:p-5 rounded-xl bg-[#161920] border border-white/[0.08]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 pb-3 sm:pb-4 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold text-slate-100">
                          {isEn ? 'Live Concurrent Users' : 'Người Dùng Trực Tuyến Đồng Thời'}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                          {isEn
                            ? 'Tracking active visitor heartbeats within the last 60 seconds'
                            : 'Đo lường các phiên truy cập có tín hiệu hoạt động trong 60 giây qua'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {isEn ? 'Auto-refresh: 15s' : 'Tự động làm mới: 15s'}
                      </span>
                      <button
                        type="button"
                        onClick={fetchActiveUsers}
                        disabled={loadingActiveUsers}
                        className="px-3 py-1.5 rounded-lg bg-[#1d212b] hover:bg-[#252a37] border border-white/10 text-xs text-slate-200 font-medium transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        title="Làm mới số liệu"
                      >
                        <svg
                          className={`w-3.5 h-3.5 ${loadingActiveUsers ? 'animate-spin' : ''}`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                        </svg>
                        <span>{loadingActiveUsers ? (isEn ? 'Updating...' : 'Đang tải...') : (isEn ? 'Refresh' : 'Làm mới')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Metrics Body */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-4">
                    {/* Active Visitors Counter */}
                    <div className="p-3.5 sm:p-4 rounded-lg bg-[#12141a] border border-white/[0.08] flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-medium text-slate-400 block">
                          {isEn ? 'Total Online Users' : 'Tổng Đang Trực Tuyến'}
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl sm:text-3xl font-semibold font-mono text-emerald-400">
                            {activeUsersStats.total || 0}
                          </span>
                          <span className="text-xs text-slate-400">
                            {isEn ? 'active sessions' : 'phiên hoạt động'}
                          </span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </div>
                    </div>

                    {/* Breakdown by Pages */}
                    <div className="p-3.5 sm:p-4 rounded-lg bg-[#12141a] border border-white/[0.08] md:col-span-2 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-medium text-slate-400 block mb-2">
                          {isEn ? 'Active by Page / Section' : 'Phân Bổ Theo Khu Vực Trang'}
                        </span>
                        {Object.keys(activeUsersStats.byPage || {}).length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(activeUsersStats.byPage).map(([page, count]) => (
                              <span
                                key={page}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1d212b] border border-white/10 text-xs text-slate-200"
                              >
                                <span className="text-slate-400 capitalize">{page}:</span>
                                <span className="font-mono font-semibold text-slate-100">{count}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">
                            {isEn ? 'No external traffic recorded yet' : 'Chưa có lưu lượng truy cập ghi nhận'}
                          </p>
                        )}
                      </div>

                      {/* Language split */}
                      {Object.keys(activeUsersStats.byLang || {}).length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                          <span className="text-[10px] uppercase font-medium text-slate-500">Ngôn ngữ:</span>
                          {Object.entries(activeUsersStats.byLang).map(([l, count]) => (
                            <span key={l} className="inline-flex items-center gap-1 font-mono text-[11px]">
                              <span className="uppercase text-slate-300">{l}:</span>
                              <span className="text-emerald-400 font-semibold">{count}</span>
                            </span>
                          ))}
                          <span className="ml-auto text-[10px] text-slate-500 font-mono">
                            Động cơ: {activeUsersStats.source === 'redis' ? 'Redis L2' : 'In-Memory L1'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Dataset Quick Modules Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {navModules.filter((m) => m.count !== undefined).map((m) => (
                    <div
                      key={m.id}
                      onClick={() => goToModule(m.id)}
                      className="p-4 rounded-xl bg-[#161920] border border-white/[0.08] hover:border-white/15 hover:bg-[#1a1d26] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 group-hover:text-sky-400 transition-colors">{m.icon}</span>
                        <span className="text-xl font-semibold font-mono text-slate-100 group-hover:text-sky-400 transition-colors">
                          {m.count}
                        </span>
                      </div>
                      <span className="font-medium text-xs text-slate-200 block">
                        {m.label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block mt-1">Truy cập module →</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: CHAMPIONS LIST */}
            {activeModule === 'champions' && (
              <div className="p-4 sm:p-5 rounded-xl bg-[#161920] border border-white/[0.08] space-y-4">
                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div className="relative w-full sm:w-80">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm theo tên hoặc mã tướng..."
                      className="w-full px-3 py-2 pl-9 rounded-lg bg-[#12141a] border border-white/10 text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/20 transition-colors"
                    />
                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select
                      value={regionFilter}
                      onChange={(e) => setRegionFilter(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-[#12141a] border border-white/10 text-slate-300 text-xs focus:outline-none focus:border-sky-500/60"
                    >
                      <option value="all">Tất cả khu vực</option>
                      <option value="runeterra">Runeterra</option>
                      <option value="demacia">Demacia</option>
                      <option value="ionia">Ionia</option>
                      <option value="noxus">Noxus</option>
                      <option value="freljord">Freljord</option>
                      <option value="shurima">Shurima</option>
                      <option value="bilgewater">Bilgewater</option>
                      <option value="shadowisles">Quần Đảo Bóng Đêm</option>
                      <option value="bandlecity">Bandle City</option>
                      <option value="targon">Targon</option>
                      <option value="piltoverzaun">Piltover & Zaun</option>
                      <option value="spiritblossom">Hoa Linh Lục Địa</option>
                    </select>

                    <span className="text-xs text-slate-400 whitespace-nowrap font-mono">
                      {filteredChampions.length} / {champions.length} Tướng
                    </span>
                  </div>
                </div>

                {/* Champions Table */}
                <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#12141a] font-mono text-[11px] text-slate-400 border-b border-white/[0.08]">
                      <tr>
                        <th className="py-2.5 px-3.5 font-medium">Tướng</th>
                        <th className="py-2.5 px-3 font-medium">Mã ID</th>
                        <th className="py-2.5 px-3 font-medium">Khu Vực</th>
                        <th className="py-2.5 px-3 font-medium">Cost</th>
                        <th className="py-2.5 px-3 font-medium">Tier</th>
                        <th className="py-2.5 px-3 font-medium">Core Relics</th>
                        <th className="py-2.5 px-3 font-medium">Số Bộ Build</th>
                        <th className="py-2.5 px-3.5 text-right font-medium">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] font-sans">
                      {filteredChampions.map((c) => {
                        const avatar =
                          c.assets?.[0]?.avatar ||
                          c.assets?.[0]?.gameAbsolutePath ||
                          `https://images.lortpoc.com/avatarChampions/${c.championID}.webp`;
                        const tierShort = c.tier ? c.tier.split('//')[0].trim() : 'A';
                        const coreCount = Array.isArray(c.coreRelics)
                          ? c.coreRelics.length
                          : (c.coreRelics?.mandatory || []).length;
                        const optionsCount = Array.isArray(c.coreRelics?.options) ? c.coreRelics.options.length : 0;
                        const buildsCount = (c.relicSets || []).length;

                        return (
                          <tr key={c.championID} className="hover:bg-[#1d212b]/50 transition-colors">
                            <td className="py-2.5 px-3.5">
                              <a
                                href={`${ADMIN_ROUTE_PREFIX}/champion/${toChampionSlug(c)}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  goToChampionEdit(c);
                                }}
                                className="flex items-center gap-2.5 group cursor-pointer"
                                title={`Chỉnh sửa ${c.name}`}
                              >
                                <img
                                  src={avatar}
                                  alt={c.name}
                                  className="w-8 h-8 rounded-md object-cover bg-black border border-white/10 flex-shrink-0 group-hover:border-sky-500/50 transition-colors"
                                  onError={(e) => handleImageError(e, 'champion')}
                                />
                                <div>
                                  <span className="font-medium text-slate-100 block text-xs group-hover:text-sky-400 transition-colors">{c.name}</span>
                                  {c.translations?.en?.name && (
                                    <span className="text-[10px] text-slate-400 block">{c.translations.en.name}</span>
                                  )}
                                </div>
                              </a>
                            </td>

                            <td className="py-2.5 px-3 font-mono text-slate-400 text-xs">
                              {c.championID}
                              {c.cardCode && <span className="text-[10px] text-slate-500 block">{c.cardCode}</span>}
                            </td>

                            <td className="py-2.5 px-3 text-slate-300 capitalize text-xs">
                              {Array.isArray(c.regions) ? c.regions.join(', ') : c.region || 'Runeterra'}
                            </td>

                            <td className="py-2.5 px-3 font-mono text-xs">
                              <span className="text-sky-400 font-medium block">{c.cost ?? 0} Mana</span>
                              <span className="text-amber-400/90 text-[10px] block font-mono">{c.maxStar || 3}★ tối đa</span>
                            </td>

                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-sky-500/10 text-sky-300 border border-sky-500/20">
                                {tierShort}
                              </span>
                            </td>

                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 whitespace-nowrap">
                                {coreCount} Cốt lõi{optionsCount > 0 ? ` + ${optionsCount} Tùy chọn` : ''}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-slate-300 text-xs font-mono">{buildsCount} Bộ</td>

                            <td className="py-2.5 px-3.5 text-right space-x-1.5 whitespace-nowrap">
                              <a
                                href={`${ADMIN_ROUTE_PREFIX}/champion/${toChampionSlug(c)}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  goToChampionEdit(c);
                                }}
                                className="inline-block px-2.5 py-1 rounded-md bg-[#1f232e] hover:bg-[#282d3b] border border-white/10 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                              >
                                Chỉnh Sửa
                              </a>

                              <button
                                type="button"
                                onClick={() => handleDeleteChampion(c)}
                                className="px-2 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-medium transition-colors cursor-pointer"
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: RELICS CATALOG */}
            {activeModule === 'relics' && (
              <div className="p-4 sm:p-5 rounded-xl bg-[#161920] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.08] flex-wrap">
                  <input
                    type="text"
                    value={relicSearch}
                    onChange={(e) => setRelicSearch(e.target.value)}
                    placeholder="Tìm cổ vật theo tên hoặc mã..."
                    className="w-full sm:w-80 px-3 py-2 rounded-lg bg-[#12141a] border border-white/10 text-slate-100 placeholder:text-slate-500 text-xs focus:border-sky-500/60 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 font-mono">
                    {filteredRelics.length} Cổ Vật
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredRelics.map((r) => (
                    <div key={r.relicCode} className="p-3 rounded-lg bg-[#12141a] border border-white/[0.08] hover:border-white/15 transition-colors flex items-start gap-3">
                      <img
                        src={`https://images.lortpoc.com/relics/${r.relicCode}.webp`}
                        alt={r.name}
                        className="w-10 h-10 object-contain bg-black/40 rounded-md p-0.5 border border-white/10 shrink-0"
                        onError={(e) => handleImageError(e, 'relic')}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-mono text-[10px] text-slate-400">{r.relicCode}</span>
                          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-300">
                            {r.rarity || 'Common'}
                          </span>
                        </div>
                        <h4 className="text-xs font-medium text-slate-100 truncate">{r.name}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                          {r.descriptionRaw || r.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: POWERS CATALOG */}
            {activeModule === 'powers' && (
              <div className="p-4 sm:p-5 rounded-xl bg-[#161920] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.08] flex-wrap">
                  <input
                    type="text"
                    value={powerSearch}
                    onChange={(e) => setPowerSearch(e.target.value)}
                    placeholder="Tìm sức mạnh theo tên hoặc mã..."
                    className="w-full sm:w-80 px-3 py-2 rounded-lg bg-[#12141a] border border-white/10 text-slate-100 placeholder:text-slate-500 text-xs focus:border-sky-500/60 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 font-mono">
                    {filteredPowers.length} Sức Mạnh
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredPowers.slice(0, 90).map((p) => (
                    <div key={p.powerCode || p.name} className="p-3 rounded-lg bg-[#12141a] border border-white/[0.08] hover:border-white/15 transition-colors flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-mono text-[10px] text-slate-400">{p.powerCode}</span>
                          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-300">
                            {p.rarity || 'Common'}
                          </span>
                        </div>
                        <h4 className="text-xs font-medium text-slate-100 truncate">{p.name}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                          {p.descriptionRaw || p.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: SERVER LOGS (Key-Value System Logs) */}
            {activeModule === 'logs' && (() => {
              const filteredLogs = serverLogs.filter((log) => {
                if (logLevelFilter !== 'all' && log.level !== logLevelFilter) return false;
                if (!logSearchQuery.trim()) return true;
                const q = logSearchQuery.toLowerCase();
                const inKey = log.key ? log.key.toLowerCase().includes(q) : false;
                const inMsg = log.message ? log.message.toLowerCase().includes(q) : false;
                const inVal = log.value ? JSON.stringify(log.value).toLowerCase().includes(q) : false;
                return inKey || inMsg || inVal;
              });

              return (
                <div className="rounded-xl bg-[#0d0f14] border border-white/[0.08] overflow-hidden font-mono text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 bg-[#12141a] border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                      <span className="text-xs font-medium text-slate-300 ml-2">
                        System Logs • Key-Value Store ({filteredLogs.length}/{serverLogs.length})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-sans">
                      <button
                        type="button"
                        onClick={fetchServerLogs}
                        disabled={logsLoading}
                        className="px-3 py-1.5 rounded-lg bg-[#1d212b] hover:bg-[#252a37] text-slate-300 text-xs font-medium transition-colors cursor-pointer border border-white/10"
                      >
                        {logsLoading ? 'Đang tải...' : 'Làm Mới'}
                      </button>
                      <button
                        type="button"
                        onClick={handleClearLogs}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-medium transition-colors cursor-pointer"
                      >
                        Xóa Log
                      </button>
                    </div>
                  </div>

                  {/* Filter and Search Bar for Logs */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 bg-[#0e1017] border-b border-white/[0.06] font-sans">
                    <input
                      type="text"
                      value={logSearchQuery}
                      onChange={(e) => setLogSearchQuery(e.target.value)}
                      placeholder="Lọc theo Key (vd: error:500, auth, waf) hoặc nội dung..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#14161f] border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
                    />
                    <select
                      value={logLevelFilter}
                      onChange={(e) => setLogLevelFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-[#14161f] border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-sky-500/50 cursor-pointer"
                    >
                      <option value="all">Tất cả Level</option>
                      <option value="error">Error</option>
                      <option value="warn">Warn</option>
                      <option value="info">Info</option>
                      <option value="http">HTTP</option>
                    </select>
                  </div>

                  <div className="p-3 max-h-[600px] overflow-y-auto space-y-1.5 bg-[#090b0e] select-text">
                    {filteredLogs.length === 0 ? (
                      <div className="py-16 text-center text-slate-500 text-xs">
                        {serverLogs.length === 0
                          ? 'Chưa có nhật ký máy chủ gần đây.'
                          : 'Không tìm thấy nhật ký khớp với bộ lọc.'}
                      </div>
                    ) : (
                      filteredLogs.map((log) => {
                        const isError = log.level === 'error';
                        const isWarn = log.level === 'warn';
                        const isHttp = log.level === 'http';
                        const levelBadgeClass = isError
                          ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                          : isWarn
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          : isHttp
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : 'text-sky-300 bg-sky-500/10 border-sky-500/20';

                        const hasValue = log.value && typeof log.value === 'object' && Object.keys(log.value).length > 0;
                        const isExpanded = expandedLogId === log.id;

                        return (
                          <div
                            key={log.id}
                            className="flex flex-col gap-1 hover:bg-white/[0.03] px-2 py-1.5 rounded transition-colors border border-transparent hover:border-white/[0.05]"
                          >
                            <div className="flex flex-wrap items-center gap-2 leading-relaxed">
                              <span className="text-slate-500 shrink-0 text-[11px] font-mono">{log.timestamp}</span>
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium uppercase shrink-0 border ${levelBadgeClass}`}>
                                {log.level}
                              </span>
                              {log.key && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-sky-500/10 text-sky-300 border border-sky-500/20 shrink-0">
                                  {log.key}
                                </span>
                              )}
                              <span className={`break-all ${isError ? 'text-rose-300 font-medium' : 'text-slate-300'}`}>
                                {log.message}
                              </span>
                              {hasValue && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                  className="ml-auto text-[10px] text-sky-400 hover:text-sky-300 hover:underline shrink-0 font-sans cursor-pointer"
                                >
                                  {isExpanded ? 'Ẩn Value' : 'Xem Value JSON'}
                                </button>
                              )}
                            </div>

                            {/* Expandable Key-Value JSON View */}
                            {hasValue && isExpanded && (
                              <pre className="mt-1 p-2.5 rounded-lg bg-black/60 border border-white/10 text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
                                {JSON.stringify(log.value, null, 2)}
                              </pre>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </main>
  </div>
);
}
