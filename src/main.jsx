import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Clock3,
  Command,
  Database,
  Download,
  ExternalLink,
  FileText,
  FolderKanban,
  Home,
  Inbox,
  Link2,
  ListChecks,
  Mic,
  MoreVertical,
  Moon,
  Newspaper,
  Plus,
  Power,
  RotateCcw,
  Search,
  Send,
  Settings,
  ShieldAlert,
  Sparkles,
  Square,
  Star,
  Thermometer,
  Trash2,
  Wand2,
  Wifi,
  WifiOff,
  Zap
} from 'lucide-react';
import './styles.css';

const todayLabel = new Intl.DateTimeFormat('zh-TW', {
  month: 'long',
  day: 'numeric',
  weekday: 'long'
}).format(new Date());

const storageKeys = {
  tasks: 'vic-workbench:v6:tasks',
  notes: 'vic-workbench:v6:notes',
  projects: 'vic-workbench:v6:projects',
  captureType: 'vic-workbench:v6:capture-type',
  activeView: 'vic-workbench:v6:active-view',
  notionConfig: 'vic-workbench:v6:notion-config',
  appearance: 'vic-workbench:v6:appearance'
};

const navItems = [
  { id: 'today', label: '總覽', icon: Home },
  { id: 'inbox', label: '快速紀錄', icon: Inbox },
  { id: 'projects', label: '專案', icon: FolderKanban },
  { id: 'knowledge', label: '資料來源', icon: BookOpen },
  { id: 'calendar', label: '行事曆', icon: CalendarDays },
  { id: 'news', label: '新聞', icon: Newspaper },
  { id: 'links', label: '連結', icon: Link2 },
  { id: 'automation', label: '設置', icon: Zap }
];

const captureTypes = [
  { id: 'task', label: '任務', icon: CheckSquare },
  { id: 'note', label: '筆記', icon: FileText },
  { id: 'idea', label: '靈感', icon: Sparkles },
  { id: 'link', label: '連結', icon: Link2 },
  { id: 'meeting', label: '會議', icon: Mic },
  { id: 'voice', label: '語音紀錄', icon: Mic }
];

const stageLabels = {
  today: '今天',
  next: '下一步',
  waiting: '等待中'
};

const stageOrder = ['today', 'next', 'waiting'];

const NOTION_AUTO_REFRESH_MS = 5 * 60 * 1000;

const typeLabels = {
  task: '任務',
  note: '筆記',
  idea: '靈感',
  link: '連結',
  meeting: '會議',
  voice: '語音紀錄'
};

const initialTasks = [];

const initialNotes = [];

const initialProjects = [];

const defaultAppearance = {
  fontFamily: 'tech',
  textScale: 'large',
  layoutDensity: 'balanced',
  panelStyle: 'glass'
};

const appearanceOptions = {
  fontFamily: [
    { id: 'tech', label: '科技感', description: '俐落、乾淨，適合儀表板長時間閱讀。' },
    { id: 'human', label: '柔和現代', description: '中文較圓潤，筆記和摘要閱讀感更舒服。' },
    { id: 'serif', label: '報告感', description: '適合市場情報、週報、長摘要。' },
    { id: 'mono', label: '工程感', description: '數字和狀態辨識清楚，偏控制台風格。' }
  ],
  textScale: [
    { id: 'compact', label: '精簡', description: '同畫面容納更多資料。' },
    { id: 'standard', label: '標準', description: '目前建議值，資訊密度和可讀性平衡。' },
    { id: 'large', label: '舒適', description: '手機和長時間閱讀更輕鬆。' }
  ],
  layoutDensity: [
    { id: 'compact', label: '高密度', description: '適合桌機快速掃描大量來源。' },
    { id: 'balanced', label: '平衡', description: '首頁、資料來源、設定都維持清楚層級。' },
    { id: 'spacious', label: '寬鬆', description: '間距更大，視覺更沉穩。' }
  ],
  panelStyle: [
    { id: 'glass', label: '科技玻璃', description: '目前主風格，深色透明面板。' },
    { id: 'solid', label: '穩重實色', description: '降低透明感，文字更穩。' },
    { id: 'neon', label: '未來霓虹', description: '強化藍綠邊線與光暈。' }
  ]
};

const deploymentLinks = [
  {
    id: 'lematec-erp',
    group: '正式服務',
    label: 'LEMATEC ERP',
    url: 'https://lematec-erp.pages.dev/',
    tag: 'Cloudflare Pages',
    description: 'LEMATEC ERP 系統，未來會把看板統計同步到 Vic Workbench。',
    primary: true
  },
  {
    id: 'step-web-viewer',
    group: '工具',
    label: 'STP Studio',
    url: 'https://step-web-viewer.pages.dev/',
    tag: '3D Viewer',
    description: 'STP / STEP 3D 檔案查看工具。',
    primary: true
  },
  {
    id: 'conversation-logger',
    group: '紀錄',
    label: 'Conversation Logger',
    url: 'https://conversation-logger.pages.dev/',
    tag: 'Logger',
    description: '對話、WhatsApp 或 Email 紀錄整理工具。',
    primary: true
  },
  {
    id: 'aiseo-geo-auditor',
    group: 'SEO / GEO',
    label: 'AISEO GEO Auditor',
    url: 'https://aiseo-geo-auditor.pages.dev/',
    tag: 'AISEO',
    description: 'AISEO / GEO 內容與搜尋可見度檢測工具。',
    primary: true
  },
  {
    id: 'lematec-product-radar',
    group: '情報',
    label: 'LEMATEC 產品情報雷達',
    url: 'https://lematec-health-check-webhook.vic-e93.workers.dev/',
    tag: 'Product Radar',
    description: 'LEMATEC 產品健康檢查、情報雷達與提醒入口。',
    primary: true
  }
];

const deploymentLinkGroups = ['全部', ...Array.from(new Set(deploymentLinks.map((item) => item.group)))];

const notionDatabases = [
  { id: 'tasks', label: '任務資料庫', icon: CheckSquare, count: 0, status: '尚未連接', purpose: '任務同步、待辦與工作狀態' },
  { id: 'knowledge', label: '知識庫', icon: BookOpen, count: 0, status: '尚未連接', purpose: '知識庫、SOP、技術筆記與決策紀錄' },
  { id: 'meetings', label: '會議筆記', icon: Mic, count: 0, status: '尚未連接', purpose: '會議逐字稿、重點摘要與決議' }
];

const notionHighlights = [
];

const notionDatabaseDetails = {
  tasks: {
    headline: '連接 Notion 任務資料庫後，這裡會顯示待辦、狀態與摘要。',
    pending: 0,
    updatedAt: '尚未連接',
    items: []
  },
  knowledge: {
    headline: '連接知識庫資料庫後，這裡會顯示 SOP、技術筆記與決策紀錄摘要。',
    pending: 0,
    updatedAt: '尚未連接',
    items: []
  },
  clients: {
    headline: '連接客戶與專案資料庫後，這裡會顯示合作狀態、下一步與重要往來。',
    pending: 0,
    updatedAt: '尚未連接',
    items: []
  },
  meetings: {
    headline: '連接會議筆記資料庫後，語音逐字稿、重點摘要與決議會顯示在這裡。',
    pending: 0,
    updatedAt: '尚未連接',
    items: []
  }
};

const workbenchNotionDefaults = {
  hubUrl: 'https://app.notion.com/p/Vic-Workbench-Data-Center-387ff6f424bb81a890eddcee1a6abd2e',
  databasePageUrl: 'https://app.notion.com/p/387ff6f424bb81cd9f98f805ba27462e',
  captureId: '388ff6f424bb81b9abd0e9e3558f3f68',
  captureUrl: 'https://app.notion.com/p/388ff6f424bb81b9abd0e9e3558f3f68',
  meetingId: '388ff6f424bb810ca867ed2fbb4a8cda',
  meetingUrl: 'https://app.notion.com/p/388ff6f424bb810ca867ed2fbb4a8cda'
};

const defaultNotionDatabaseConfig = {
  tasks: { id: 'tasks', label: '快速紀錄', sourceType: 'database', databaseId: workbenchNotionDefaults.captureUrl, pageUrl: '', purpose: '任務、筆記、靈感、連結與語音筆記統一收件匣', sortMode: 'updated', analysisLimit: 3, locked: true },
  knowledge: { id: 'knowledge', label: '客戶分析知識庫', sourceType: 'folder', databaseId: '', pageUrl: 'https://app.notion.com/p/356ff6f424bb81d4a9a8c4a997fcffc6', purpose: '客戶分析週報、每日數據與詢盤攻堅紀錄', sortMode: 'title-date-desc', analysisLimit: 3, locked: true },
  meetings: { id: 'meetings', label: '會議筆記', sourceType: 'database', databaseId: workbenchNotionDefaults.meetingUrl, pageUrl: '', purpose: '會議逐字稿、重點摘要與決議', sortMode: 'updated', analysisLimit: 3, locked: true }
};

const notionSortOptions = [
  { value: 'updated', label: '最近更新優先' },
  { value: 'title-date-desc', label: '標題日期新到舊' },
  { value: 'manual', label: '照頁面順序' }
];

function normalizeNotionDatabaseConfigs(notionConfig) {
  const storedConfigs = notionConfig?.databases || {};
  const mergedKeys = Array.from(new Set([
    ...Object.keys(defaultNotionDatabaseConfig),
    ...Object.keys(storedConfigs)
  ])).filter((key) => key && key !== 'undefined' && key !== 'null');

  return mergedKeys.reduce((configs, key) => {
    const defaults = defaultNotionDatabaseConfig[key] || {};
    const stored = storedConfigs[key] || {};
    const id = stored.id || defaults.id || key;
    const preset = notionDatabases.find((item) => item.id === id);
    const storedHasSource = Boolean(stored.databaseId || stored.pageUrl);
    const storedLabel = /[?]{2,}/.test(stored.label || '') ? '' : stored.label;
    const storedPurpose = /[?]{2,}/.test(stored.purpose || '') ? '' : stored.purpose;

    configs[id] = {
      id,
      label: storedHasSource ? (storedLabel || defaults.label || preset?.label || '自訂資料庫') : (defaults.label || storedLabel || preset?.label || '自訂資料庫'),
      sourceType: storedHasSource ? (stored.sourceType || defaults.sourceType || 'database') : (defaults.sourceType || stored.sourceType || 'database'),
      databaseId: stored.databaseId || defaults.databaseId || '',
      pageUrl: stored.pageUrl || defaults.pageUrl || '',
      purpose: storedHasSource ? (storedPurpose || defaults.purpose || preset?.purpose || '自訂 Notion 資料庫') : (defaults.purpose || storedPurpose || preset?.purpose || '自訂 Notion 資料庫'),
      sortMode: stored.sortMode || defaults.sortMode || 'updated',
      analysisLimit: Math.min(3, Math.max(1, Number(stored.analysisLimit || defaults.analysisLimit || 3))),
      locked: Boolean(defaults.locked || stored.locked)
    };

    return configs;
  }, {});
}

const newsBriefs = [
  { topic: '尚未載入', title: '新聞 RSS 等待連線', summary: '部署到 Cloudflare 後會由 /api/news/brief 抓取中文新聞與金融資訊。' }
];

const newsRefreshIntervalMs = 30 * 60 * 1000;
const newsKeywords = ['AI', '匯率', '關稅', '供應鏈', 'Fed', '美元', '利率', '通膨', '半導體', '原油'];

function useNewsBriefs() {
  const [newsState, setNewsState] = useState({
    status: 'loading',
    briefs: newsBriefs,
    items: [],
    sources: [],
    fetchedAt: null,
    error: '',
    keywordHits: []
  });

  const refresh = useCallback(async ({ silent = false } = {}) => {
    setNewsState((current) => ({ ...current, status: silent && current.items.length ? 'refreshing' : 'loading', error: '' }));

    try {
      const response = await fetch(`/api/news/brief?limit=18&t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const items = data.items || [];
      const keywordHits = newsKeywords
        .map((keyword) => ({
          keyword,
          count: items.filter((item) => `${item.title} ${item.summary}`.includes(keyword)).length
        }))
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count);

      setNewsState({
        status: 'ready',
        briefs: data.briefs?.length ? data.briefs : newsBriefs,
        items,
        sources: data.sources || [],
        fetchedAt: data.fetchedAt || new Date().toISOString(),
        error: '',
        keywordHits
      });
    } catch (error) {
      setNewsState((current) => ({
        ...current,
        status: current.items.length ? 'stale' : 'fallback',
        error: error.message || '新聞讀取失敗。'
      }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    function refreshWhenVisible() {
      if (document.visibilityState !== 'visible') return;
      const lastFetched = newsState.fetchedAt ? new Date(newsState.fetchedAt).getTime() : 0;
      if (!lastFetched || Date.now() - lastFetched >= newsRefreshIntervalMs) {
        refresh({ silent: true });
      }
    }

    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshWhenVisible);
    return () => {
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('focus', refreshWhenVisible);
    };
  }, [newsState.fetchedAt, refresh]);

  return {
    ...newsState,
    isRefreshing: newsState.status === 'loading' || newsState.status === 'refreshing',
    isStale: Boolean(newsState.fetchedAt && Date.now() - new Date(newsState.fetchedAt).getTime() >= newsRefreshIntervalMs),
    refresh
  };
}

function usePwaInstall() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(standalone);

    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setInstallPrompt(event);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    });

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  async function installApp() {
    if (!installPrompt) return false;
    installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstallPrompt(null);
    return choice.outcome === 'accepted';
  }

  return {
    canInstall: Boolean(installPrompt),
    isStandalone,
    installApp
  };
}

function usePersistentState(key, fallbackValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallbackValue;
    } catch {
      return fallbackValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage may be unavailable in restricted browser modes.
    }
  }, [key, value]);

  return [value, setValue];
}

const retiredWorkbenchNotionIds = new Set([
  '6ba5f30036de43d7b64b4b1d2d91c0b5',
  'e19ee4a9a1fb40d5aadef487a3d07356',
  '387ff6f424bb8196a0d7db4b72427a0b',
  '387ff6f424bb8192ac4ef6b7e8791a1a'
]);

function extractCompactNotionId(value = '') {
  const compact = String(value).replace(/-/g, '');
  return compact.match(/([a-f0-9]{32})(?:[?#/]|$)/i)?.[1] || compact;
}

function isRetiredWorkbenchNotionValue(value = '') {
  return retiredWorkbenchNotionIds.has(extractCompactNotionId(value));
}

function migrateWorkbenchNotionConfig(config = {}) {
  const captureId = isRetiredWorkbenchNotionValue(config.captureDatabaseId) ? '' : config.captureDatabaseId;
  const meetingId = isRetiredWorkbenchNotionValue(config.meetingDatabaseId) ? '' : config.meetingDatabaseId;
  const captureUrl = isRetiredWorkbenchNotionValue(config.captureDatabaseUrl) ? '' : config.captureDatabaseUrl;
  const meetingUrl = isRetiredWorkbenchNotionValue(config.meetingDatabaseUrl) ? '' : config.meetingDatabaseUrl;
  const databases = { ...(config.databases || {}) };

  ['tasks', 'meetings'].forEach((id) => {
    if (isRetiredWorkbenchNotionValue(databases[id]?.databaseId || databases[id]?.pageUrl || '')) {
      databases[id] = defaultNotionDatabaseConfig[id];
    }
  });

  return { ...config, captureDatabaseId: captureId, captureDatabaseUrl: captureUrl, meetingDatabaseId: meetingId, meetingDatabaseUrl: meetingUrl, databases };
}

function sanitizeSyncedNotionConfig(config = {}) {
  const migratedConfig = migrateWorkbenchNotionConfig(config);
  return {
    workspaceUrl: migratedConfig.workspaceUrl || '',
    token: '',
    defaultDatabase: migratedConfig.defaultDatabase || '',
    aiSummaryPageUrl: migratedConfig.aiSummaryPageUrl || '',
    workbenchHubPageUrl: migratedConfig.workbenchHubPageUrl || workbenchNotionDefaults.hubUrl,
    workbenchDatabasePageUrl: migratedConfig.workbenchDatabasePageUrl || workbenchNotionDefaults.databasePageUrl,
    captureDatabaseId: migratedConfig.captureDatabaseId || workbenchNotionDefaults.captureId,
    captureDatabaseUrl: migratedConfig.captureDatabaseUrl || workbenchNotionDefaults.captureUrl,
    meetingDatabaseId: migratedConfig.meetingDatabaseId || workbenchNotionDefaults.meetingId,
    meetingDatabaseUrl: migratedConfig.meetingDatabaseUrl || workbenchNotionDefaults.meetingUrl,
    sourceSeenAt: migratedConfig.sourceSeenAt || {},
    databases: migratedConfig.databases || defaultNotionDatabaseConfig,
    newsKeywords: migratedConfig.newsKeywords || '國際, 金融, 匯率, 供應鏈'
  };
}

function hasConfiguredNotionSource(config = {}) {
  return Boolean(config.aiSummaryPageUrl) || Object.values(config.databases || {}).some((source) => source.databaseId || source.pageUrl);
}

function mergeSyncedNotionConfig(remoteConfig = {}, localConfig = {}) {
  const remote = sanitizeSyncedNotionConfig(remoteConfig);
  const local = sanitizeSyncedNotionConfig(localConfig);
  const databases = { ...(remote.databases || {}) };

  Object.entries(local.databases || {}).forEach(([id, source]) => {
    if (id === 'tasks' || id === 'meetings') return;
    if (source.databaseId || source.pageUrl) {
      databases[id] = {
        ...(databases[id] || {}),
        ...source
      };
    }
  });

  return {
    ...remote,
    workspaceUrl: local.workspaceUrl || remote.workspaceUrl,
    defaultDatabase: local.defaultDatabase || remote.defaultDatabase,
    aiSummaryPageUrl: local.aiSummaryPageUrl || remote.aiSummaryPageUrl,
    workbenchHubPageUrl: local.workbenchHubPageUrl || remote.workbenchHubPageUrl,
    workbenchDatabasePageUrl: local.workbenchDatabasePageUrl || remote.workbenchDatabasePageUrl,
    captureDatabaseId: local.captureDatabaseId || remote.captureDatabaseId,
    captureDatabaseUrl: local.captureDatabaseUrl || remote.captureDatabaseUrl,
    meetingDatabaseId: local.meetingDatabaseId || remote.meetingDatabaseId,
    meetingDatabaseUrl: local.meetingDatabaseUrl || remote.meetingDatabaseUrl,
    sourceSeenAt: { ...(remote.sourceSeenAt || {}), ...(local.sourceSeenAt || {}) },
    databases,
    newsKeywords: local.newsKeywords || remote.newsKeywords,
    token: ''
  };
}

function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function extractKeyPoints(text) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  const sentences = cleaned
    .split(/[。！？!?；;，,\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 6);

  const priorityWords = ['重點', '需要', '要', '記得', '確認', '處理', '完成', '聯絡', '報價', '客戶', '明天', '下週'];
  const sorted = [...sentences].sort((a, b) => {
    const score = (sentence) => priorityWords.reduce((total, word) => total + (sentence.includes(word) ? 1 : 0), 0);
    return score(b) - score(a);
  });

  return Array.from(new Set(sorted)).slice(0, 5);
}

function getConfiguredNotionDatabases(notionConfig) {
  const configs = normalizeNotionDatabaseConfigs(notionConfig);

  return Object.values(configs).map((config) => {
    const preset = notionDatabases.find((item) => item.id === config.id);
    return {
      id: config.id,
      label: config.label || preset?.label || '自訂資料庫',
      icon: preset?.icon || BriefcaseBusiness,
      count: 0,
      status: (config.sourceType || 'database') === 'folder'
        ? (config.pageUrl ? '已設定父頁' : '尚未連接')
        : (config.databaseId ? '已設定資料庫' : '尚未連接'),
      purpose: config.purpose || preset?.purpose || '自訂 Notion 資料庫',
      sourceType: config.sourceType || 'database',
      databaseId: config.databaseId || '',
      pageUrl: config.pageUrl || '',
      sortMode: config.sortMode || 'updated',
      analysisLimit: Math.min(3, Math.max(1, Number(config.analysisLimit || 3))),
      locked: Boolean(config.locked)
    };
  });
}

function App() {
  const [activeView, setActiveView] = usePersistentState(storageKeys.activeView, 'today');
  const [captureType, setCaptureType] = usePersistentState(storageKeys.captureType, 'task');
  const [tasks, setTasks] = usePersistentState(storageKeys.tasks, initialTasks);
  const [notes, setNotes] = usePersistentState(storageKeys.notes, initialNotes);
  const [projects, setProjects] = usePersistentState(storageKeys.projects, initialProjects);
  const [appearance, setAppearance] = usePersistentState(storageKeys.appearance, defaultAppearance);
  const [notionConfig, setNotionConfig] = usePersistentState(storageKeys.notionConfig, {
    workspaceUrl: '',
    token: '',
    defaultDatabase: '',
    aiSummaryPageUrl: '',
    workbenchHubPageUrl: workbenchNotionDefaults.hubUrl,
    workbenchDatabasePageUrl: workbenchNotionDefaults.databasePageUrl,
    captureDatabaseId: workbenchNotionDefaults.captureId,
    captureDatabaseUrl: workbenchNotionDefaults.captureUrl,
    meetingDatabaseId: workbenchNotionDefaults.meetingId,
    meetingDatabaseUrl: workbenchNotionDefaults.meetingUrl,
    sourceSeenAt: {},
    databases: defaultNotionDatabaseConfig,
    newsKeywords: '國際, 金融, 匯率, 供應鏈'
  });
  const settingsSyncReadyRef = useRef(false);
  const lastSyncedNotionConfigRef = useRef('');
  const [draft, setDraft] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastAction, setLastAction] = useState('準備開始');
  const [captureSync, setCaptureSync] = useState({ status: 'idle', message: '' });
  const newsState = useNewsBriefs();
  const notionData = useNotionSources(notionConfig, setNotionConfig);
  const erpBoard = useErpBoardSummary();
  const calendarData = useCalendarData();

  async function refreshCaptureInbox({ silent = false } = {}) {
    if (!silent) setCaptureSync({ status: 'loading', message: '正在同步 Notion 收件匣...' });
    try {
      const params = new URLSearchParams();
      const isLocalPreview = ['localhost', '127.0.0.1'].includes(window.location.hostname);
      if (notionConfig.captureDatabaseId) params.set('databaseId', notionConfig.captureDatabaseId);
      if (notionConfig.token && isLocalPreview) params.set('token', notionConfig.token);
      const response = await fetch(`/api/notion/capture?${params.toString()}`);
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || '讀取 Notion 收件匣失敗。');
      setNotes(data.notes || []);
      setCaptureSync({ status: 'ready', message: `已同步 ${data.count || 0} 筆 Notion 收件匣資料。` });
    } catch (error) {
      setCaptureSync({ status: 'error', message: error.message || 'Notion 收件匣同步失敗。' });
    }
  }

  async function createCaptureInNotion(payload) {
    const response = await fetch('/api/notion/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        token: notionConfig.token,
        databaseId: notionConfig.captureDatabaseId
      })
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.message || '寫入 Notion 收件匣失敗。');
    return data.note;
  }

  useEffect(() => {
    refreshCaptureInbox({ silent: true });
    const interval = window.setInterval(() => refreshCaptureInbox({ silent: true }), 60000);
    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') refreshCaptureInbox({ silent: true });
    };
    document.addEventListener('visibilitychange', refreshOnFocus);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, [notionConfig.captureDatabaseId]);

  useEffect(() => {
    let isMounted = true;

    async function loadSyncedNotionConfig() {
      try {
        const response = await fetch('/api/settings/notion');
        const data = await response.json();
        if (!isMounted) return;

        if (response.ok && data.ok && data.config) {
          const remoteConfig = sanitizeSyncedNotionConfig(data.config);
          const syncedConfig = mergeSyncedNotionConfig(data.config, notionConfig);
          lastSyncedNotionConfigRef.current = JSON.stringify(remoteConfig);
          setNotionConfig((current) => ({
            ...syncedConfig,
            token: current.token || ''
          }));
        } else if (hasConfiguredNotionSource(notionConfig)) {
          const localConfig = sanitizeSyncedNotionConfig(notionConfig);
          lastSyncedNotionConfigRef.current = JSON.stringify(localConfig);
          fetch('/api/settings/notion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: localConfig })
          }).catch(() => {});
        }
      } catch {
        // Keep local settings when cloud sync is unavailable.
      } finally {
        if (isMounted) settingsSyncReadyRef.current = true;
      }
    }

    loadSyncedNotionConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!settingsSyncReadyRef.current) return;

    const syncedConfig = sanitizeSyncedNotionConfig(notionConfig);
    const payload = JSON.stringify(syncedConfig);
    if (payload === lastSyncedNotionConfigRef.current) return;

    const timer = window.setTimeout(() => {
      lastSyncedNotionConfigRef.current = payload;
      fetch('/api/settings/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: syncedConfig })
      }).catch(() => {
        lastSyncedNotionConfigRef.current = '';
      });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [notionConfig]);

  useEffect(() => {
    const requestedView = new URLSearchParams(window.location.search).get('view');
    if (requestedView && navItems.some((item) => item.id === requestedView)) {
      setActiveView(requestedView);
    }
  }, [setActiveView]);

  const visibleTasks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return tasks;
    return tasks.filter((task) =>
      `${task.title} ${task.area} ${stageLabels[task.stage]}`.toLowerCase().includes(term)
    );
  }, [searchTerm, tasks]);

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.done).length;
    const open = tasks.length - completed;
    const syncQueue = notes.filter((note) => !note.synced).length + open;
    const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    return { completed, open, syncQueue, progress };
  }, [notes, tasks]);

  async function handleCapture(textOverride) {
    const title = (typeof textOverride === 'string' ? textOverride : draft).trim();
    if (!title) return;

    setLastAction('正在寫入 Notion 收件匣...');
    setCaptureSync({ status: 'loading', message: '正在寫入 Notion 收件匣...' });

    if (captureType === 'task') {
      setTasks((current) => [
        { id: Date.now(), title, area: '快速紀錄', stage: 'today', estimate: '15 分', done: false, important: false },
        ...current
      ]);
    }

    try {
      const note = await createCaptureInNotion({
        title,
        type: captureType,
        content: title,
        source: window.matchMedia('(display-mode: standalone)').matches ? '手機 App' : '桌面網頁'
      });
      setNotes((current) => [note, ...current.filter((item) => item.id !== note.id)]);
      setDraft('');
      setLastAction(captureType === 'task' ? '已新增任務並寫入 Notion' : '已寫入 Notion 收件匣');
      setCaptureSync({ status: 'ready', message: '已寫入 Notion 收件匣。' });
    } catch (error) {
      const fallbackNote = { id: Date.now(), title, type: captureType, time: '本機暫存', synced: false };
      setNotes((current) => [fallbackNote, ...current]);
      setDraft('');
      setLastAction('Notion 寫入失敗，已先保留本機暫存');
      setCaptureSync({ status: 'error', message: error.message || 'Notion 寫入失敗，已先保留本機暫存。' });
    }
  }

  function toggleTask(id) {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  }

  function moveTask(id, stage) {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, stage } : task)));
    setLastAction(`已移到「${stageLabels[stage]}」`);
  }

  function deleteTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id));
    setLastAction('已刪除任務');
  }

  function syncNote(id) {
    setNotes((current) => current.map((note) => (note.id === id ? { ...note, synced: true } : note)));
    setLastAction('已標記為已同步');
  }

  async function updateNote(id, titleOrPatch) {
    const target = notes.find((note) => note.id === id);
    const patch = typeof titleOrPatch === 'string' ? { title: titleOrPatch } : (titleOrPatch || {});
    const nextTitle = (patch.title ?? target?.title ?? '').trim();
    if (!nextTitle) return;
    const nextPatch = { ...patch, title: nextTitle, synced: false, time: new Date().toISOString() };
    setNotes((current) => current.map((note) => (note.id === id ? { ...note, ...nextPatch } : note)));
    try {
      if (target?.notionPageId && (typeof titleOrPatch === 'string' || patch.content)) {
        const response = await fetch('/api/notion/capture', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: notionConfig.token, pageId: target.notionPageId, title: nextTitle, content: patch.content || nextTitle })
        });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.message || '更新 Notion 收件匣失敗。');
        setNotes((current) => current.map((note) => (note.id === id ? { ...note, ...data.note, ...nextPatch } : note)));
      }
      setLastAction('已更新知識收件匣');
    } catch (error) {
      setCaptureSync({ status: 'error', message: error.message || '更新 Notion 收件匣失敗。' });
      setLastAction('更新失敗，已先保留本機狀態');
    }
  }

  async function deleteNote(id) {
    const target = notes.find((note) => note.id === id);
    setNotes((current) => current.filter((note) => note.id !== id));
    try {
      if (target?.notionPageId) {
        const response = await fetch('/api/notion/capture', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: notionConfig.token, pageId: target.notionPageId })
        });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.message || '封存 Notion 收件匣項目失敗。');
      }
      setLastAction('已從 Workbench 移除並封存 Notion 項目');
    } catch (error) {
      setNotes((current) => target ? [target, ...current] : current);
      setCaptureSync({ status: 'error', message: error.message || '刪除 Notion 收件匣項目失敗。' });
      setLastAction('刪除失敗，已還原項目');
    }
  }

  function clearLocalData() {
    setTasks(initialTasks);
    setNotes(initialNotes);
    setProjects(initialProjects);
    setLastAction('已清空本機資料');
  }

  function exportData() {
    const payload = JSON.stringify({ tasks, notes, projects, notionConfig, appearance }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'vic-workbench-export.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setLastAction('已匯出 JSON');
  }

  const appearanceClass = [
    `font-${appearance.fontFamily || defaultAppearance.fontFamily}`,
    `text-${appearance.textScale || defaultAppearance.textScale}`,
    `density-${appearance.layoutDensity || defaultAppearance.layoutDensity}`,
    `panel-${appearance.panelStyle || defaultAppearance.panelStyle}`
  ].join(' ');

  return (
    <div className={`workspace ${appearanceClass}`}>
      <Sidebar activeView={activeView} setActiveView={setActiveView} notes={notes} tasks={tasks} />
      <main className="mainShell">
        <Topbar searchTerm={searchTerm} setSearchTerm={setSearchTerm} exportData={exportData} />
        <ActiveView
          activeView={activeView}
          setActiveView={setActiveView}
          stats={stats}
          notes={notes}
          tasks={visibleTasks}
          projects={projects}
          setProjects={setProjects}
          notionConfig={notionConfig}
          appearance={appearance}
          setAppearance={setAppearance}
          notionData={notionData}
          setNotionConfig={setNotionConfig}
          captureType={captureType}
          setCaptureType={setCaptureType}
          draft={draft}
          setDraft={setDraft}
          handleCapture={handleCapture}
          lastAction={lastAction}
          toggleTask={toggleTask}
          moveTask={moveTask}
          deleteTask={deleteTask}
          syncNote={syncNote}
          updateNote={updateNote}
          deleteNote={deleteNote}
          captureSync={captureSync}
          refreshCaptureInbox={refreshCaptureInbox}
          resetDemoData={clearLocalData}
          newsState={newsState}
          erpBoard={erpBoard}
          calendarData={calendarData}
        />
      </main>
    </div>
  );
}

function ActiveView(props) {
  const {
    activeView,
    setActiveView,
    stats,
    notes,
    tasks,
    projects,
    setProjects,
    notionConfig,
    appearance,
    setAppearance,
    notionData,
    setNotionConfig,
    captureType,
    setCaptureType,
    draft,
    setDraft,
    handleCapture,
    lastAction,
    toggleTask,
    moveTask,
    deleteTask,
    syncNote,
    updateNote,
    deleteNote,
    captureSync,
    refreshCaptureInbox,
    resetDemoData,
    newsState,
    erpBoard,
    calendarData
  } = props;

  if (activeView === 'knowledge') {
    return (
      <section className="contentGrid singlePage">
        <div className="primaryColumn">
          <PageHeader title="資料來源" subtitle="分層查看不同資料庫的摘要，需要細節時再點進 Notion 原頁。" />
          <NotionWorkspace notionConfig={notionConfig} notionData={notionData} />
        </div>
        <aside className="insightRail">
          <NotionPanel notes={notes} syncNote={syncNote} />
          <KnowledgePanel notes={notes} updateNote={updateNote} deleteNote={deleteNote} captureSync={captureSync} refreshCaptureInbox={refreshCaptureInbox} />
        </aside>
      </section>
    );
  }

  if (activeView === 'inbox') {
    return (
      <section className="contentGrid singlePage">
        <div className="primaryColumn">
          <PageHeader title="快速紀錄" subtitle="快速收集想法、語音逐字稿、待整理連結，之後再送到 Notion。" />
          <CapturePanel {...{ captureType, setCaptureType, draft, setDraft, handleCapture, lastAction, captureSync, refreshCaptureInbox }} />
          <KnowledgePanel notes={notes} expanded updateNote={updateNote} deleteNote={deleteNote} captureSync={captureSync} refreshCaptureInbox={refreshCaptureInbox} />
        </div>
        <aside className="insightRail">
          <NotionPanel notes={notes} syncNote={syncNote} />
          <FocusPanel stats={stats} />
        </aside>
      </section>
    );
  }

  if (activeView === 'projects') {
    return (
      <section className="contentGrid singlePage">
        <div className="primaryColumn">
          <PageHeader title="專案" subtitle="專案進度和任務看板集中在這裡，首頁只呈現重要提醒。" />
          <ProjectPanel projects={projects} setProjects={setProjects} />
          <TaskBoard tasks={tasks} toggleTask={toggleTask} moveTask={moveTask} deleteTask={deleteTask} />
        </div>
        <aside className="insightRail">
          <FocusPanel stats={stats} />
          <NotionPanel notes={notes} syncNote={syncNote} />
        </aside>
      </section>
    );
  }

  if (activeView === 'news') {
    return (
      <section className="contentGrid singlePage">
        <div className="primaryColumn">
          <PageHeader title="新聞" subtitle="整理最新國際、金融與供應鏈資訊；首頁只放最高優先摘要。" />
          <NewsWorkspace newsState={newsState} />
        </div>
        <aside className="insightRail">
          <FocusPanel stats={stats} />
          <AutomationPanel setActiveView={setActiveView} />
        </aside>
      </section>
    );
  }

  if (activeView === 'calendar') {
    return (
      <section className="contentGrid singlePage">
        <div className="primaryColumn">
          <PageHeader title="行事曆" subtitle="串接 Google Calendar，快速查看近期行程，也能直接新增提醒與會議。" />
          <CalendarWorkspaceV2 calendarData={calendarData} />
        </div>
        <aside className="insightRail">
          <FocusPanel stats={stats} />
          <AutomationPanel setActiveView={setActiveView} />
        </aside>
      </section>
    );
  }

  if (activeView === 'links') {
    return (
      <section className="contentGrid singlePage">
        <div className="primaryColumn">
          <PageHeader title="快速連結" subtitle="集中管理已部署到 Cloudflare、GitHub 與 Notion 的重要入口。" />
          <LinksWorkspace />
        </div>
        <aside className="insightRail">
          <AutomationPanel setActiveView={setActiveView} />
          <FocusPanel stats={stats} />
        </aside>
      </section>
    );
  }

  if (activeView === 'automation') {
    return (
      <section className="contentGrid singlePage commandPage">
        <div className="primaryColumn">
          <PageHeader title="系統設定" subtitle="資料來源、AI 彙整、遠端電腦、安全性與部署狀態分層管理。" />
          <SettingsWorkspace
            notionConfig={notionConfig}
            setNotionConfig={setNotionConfig}
            appearance={appearance}
            setAppearance={setAppearance}
            resetDemoData={resetDemoData}
          />
          <RemotePowerPanel />
        </div>
      </section>
    );
  }

  return (
    <section className="contentGrid dashboardPage commandPage">
      <div className="primaryColumn">
        <DashboardOverview
          stats={stats}
          tasks={tasks}
          notes={notes}
          projects={projects}
          setActiveView={setActiveView}
          notionData={notionData}
          newsState={newsState}
          erpBoard={erpBoard}
          calendarData={calendarData}
        />
      </div>
    </section>
  );
}

function Sidebar({ activeView, setActiveView, notes, tasks }) {
  const inboxCount = notes.filter((note) => !note.synced).length;
  const openTasks = tasks.filter((task) => !task.done).length;

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brandMark"><img src="/icons/vic-workbench.svg" alt="" /></div>
        <div>
          <strong>Vic Workbench</strong>
          <span>個人中控台</span>
        </div>
      </div>
      <nav className="navGroup" aria-label="主要導覽">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button className={`navItem ${activeView === id ? 'selected' : ''}`} key={id} onClick={() => setActiveView(id)}>
            <Icon size={19} />
            <span>{label}</span>
            {id === 'inbox' && inboxCount > 0 && <small>{inboxCount}</small>}
            {id === 'today' && openTasks > 0 && <small>{openTasks}</small>}
          </button>
        ))}
      </nav>
      <div className="sidebarPanel">
        <p>目前架構</p>
        <strong>首頁收斂，細節進分頁</strong>
        <span>Notion、新聞、連結、設定都已拆開，之後新增服務會更好管理。</span>
      </div>
      <div className="utilityGroup">
        <button className={`navItem utility ${activeView === 'automation' ? 'selected' : ''}`} onClick={() => setActiveView('automation')}>
          <Settings size={18} /><span>設定</span>
        </button>
        <button className="navItem utility"><Bell size={18} /><span>提醒</span></button>
      </div>
    </aside>
  );
}

function Topbar({ searchTerm, setSearchTerm, exportData }) {
  return (
    <header className="topbar">
      <div className="commandBox">
        <Search size={17} />
        <input aria-label="搜尋任務與資料" placeholder="搜尋任務、專案、知識..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        <kbd>Ctrl K</kbd>
      </div>
      <button className="secondaryAction" onClick={exportData}><Download size={17} /><span>匯出</span></button>
      <button className="iconButton" aria-label="命令選單"><Command size={18} /></button>
      <div className="avatar" aria-label="Vic">V<span /></div>
    </header>
  );
}

function PageHeader({ title, subtitle }) {
  return (
    <section className="pageHeader">
      <div>
        <p>{todayLabel}</p>
        <h1>{title}</h1>
        <span>{subtitle}</span>
      </div>
    </section>
  );
}

function DashboardOverview({ stats, tasks, notes, projects, setActiveView, notionData, newsState, erpBoard, calendarData }) {
  const [focusTab, setFocusTab] = useState('overview');
  const importantTasks = tasks.filter((task) => !task.done).slice(0, 3);
  const queueCount = notes.filter((note) => !note.synced).length;
  const newestSource = [...(notionData.sourceBriefs || [])].sort((a, b) => new Date(b.latest?.lastEditedTime || 0) - new Date(a.latest?.lastEditedTime || 0))[0];
  const topBullets = notionData.overviewBullets.slice(0, 8);
  const newestItem = notionData.newestItem;
  const aiSummaryItem = notionData.aiSummary?.item;
  const aiSummaryHighlights = aiSummaryItem?.highlights?.length ? aiSummaryItem.highlights : splitSummaryHighlights(aiSummaryItem?.summary || '');
  const liveSummaryHighlights = buildActionableSummary(notionData.allLiveItems, 5);
  const shouldUseLiveSummary = Boolean((notionData.aiSummaryIsStale || notionData.aiSummaryNeedsSource) && liveSummaryHighlights.length);
  const displayedSummaryTitle = shouldUseLiveSummary ? '即時重點整理' : (aiSummaryItem?.title || (notionData.aiSummary?.status === 'loading' ? '正在讀取摘要頁' : '摘要頁讀取異常'));
  const displayedSummaryHighlights = shouldUseLiveSummary ? liveSummaryHighlights : aiSummaryHighlights;
  const updateAlerts = notionData.updateAlerts || [];
  const [deviceStatus, setDeviceStatus] = useState({ status: 'loading', data: null });
  const deviceState = deviceStatus.data?.state;
  const temperature = deviceState?.telemetry?.temperature;
  const tempValue = temperature?.available ? `${temperature.celsius}°C` : '未回報';
  const tempLevel = temperature?.available && temperature.celsius >= 90 ? '危險' : temperature?.available && temperature.celsius >= 80 ? '偏高' : '正常';
  const erpData = erpBoard.data;
  const erpStatusLabel = erpBoard.status === 'loading' && !erpData ? '讀取中' : '重新整理';
  const erpMetrics = [
    ['總待處理', erpData?.totalPending ?? '--', '跨部門'],
    ['今日出貨', erpData?.todayShip ?? '--', '出貨'],
    ['待出貨', erpData?.waitingShip ?? '--', '出貨'],
    ['交期逾期', erpData?.overdue ?? '--', '提醒']
  ];
  const erpRows = [
    ['待領料', erpData?.waitingPick ?? '--', '訂單待轉領料'],
    ['生產中', erpData?.inProduction ?? '--', '現場製作中'],
    ['品管待檢', erpData?.qcPending ?? '--', '訂單與入料'],
    ['庫存警示', erpData?.stockWarning ?? '--', '低於安全庫存'],
    ['C端出貨中', erpData?.corderShipping ?? '--', 'C端尚未完成'],
    ['請假待審', erpData?.leavePending ?? '--', '人員審核']
  ];
  const newsHighlights = (newsState?.briefs?.length ? newsState.briefs : newsBriefs).slice(0, 4);
  const newsItems = (newsState?.items || []).slice(0, 6);
  const topNews = newsHighlights[0];
  const calendarEvents = [...(calendarData?.events || [])].sort((a, b) => new Date(a.start) - new Date(b.start));
  const todayCalendarEvents = calendarEvents.filter((event) => isSameLocalDay(new Date(event.start), new Date()));
  const nextCalendarEvent = calendarEvents.find((event) => new Date(event.end || event.start).getTime() >= Date.now());
  const newsUpdatedLabel = newsState?.fetchedAt ? formatKnowledgeTime(newsState.fetchedAt) : '尚未更新';
  const newsHitLabel = newsState?.keywordHits?.length ? `${newsState.keywordHits[0].keyword} ${newsState.keywordHits[0].count} 則` : '無關鍵字命中';
  const sourceDigestCards = notionData.sourceBriefs.map((source) => {
    const latest = source.latest;
    const highlights = latest?.highlights?.length ? latest.highlights : splitSummaryHighlights(latest?.summary || '');
    const recentItems = [...source.items]
      .sort((a, b) => new Date(b.lastEditedTime || 0) - new Date(a.lastEditedTime || 0))
      .slice(0, 3);
    return {
      id: source.id,
      label: source.label,
      count: source.items.length,
      latest,
      recentItems,
      href: latest?.url || source.pageUrl || source.databaseId || '',
      status: source.status,
      message: source.message,
      isError: source.status === 'error',
      hasUpdate: source.hasUpdate,
      highlights: highlights.slice(0, 3),
      displayMessage: source.status === 'error'
        ? '讀取失敗，已移到資料來源頁檢查。'
        : source.message
    };
  });
  const sourceCardsForView = sourceDigestCards;
  const attentionItems = [
    updateAlerts.length > 0
      ? { level: 'warning', label: '資料來源有更新', value: `${updateAlerts.length} 個來源`, detail: `${updateAlerts[0].label} · ${formatKnowledgeTime(updateAlerts[0].latest.lastEditedTime)}` }
      : null,
    erpData?.totalPending > 0
      ? { level: erpData.totalPending >= 80 ? 'danger' : 'warning', label: 'ERP 待處理', value: `${erpData.totalPending} 件`, detail: `逾期 ${erpData.overdue || 0}、庫存警示 ${erpData.stockWarning || 0}。` }
      : null,
    notionData.sourceBriefs.some((source) => source.status === 'error')
      ? { level: 'warning', label: 'Notion 來源異常', value: `${notionData.sourceBriefs.filter((source) => source.status === 'error').length} 個`, detail: '到知識庫分頁檢查來源連結或權限。' }
      : null
  ].filter(Boolean);
  const priorityMessage = attentionItems.length
    ? attentionItems.map((item) => `${item.label} ${item.value}`).join('、')
    : '目前狀態穩定';
  const readySources = notionData.sourceBriefs.filter((source) => source.status === 'ready' && source.latest);
  const sourceErrorCount = notionData.sourceBriefs.filter((source) => source.status === 'error').length;
  const executiveCards = [
    {
      tone: erpData?.totalPending >= 80 ? 'danger' : erpData?.totalPending > 0 ? 'warning' : 'ok',
      label: 'ERP',
      value: erpData ? `${erpData.totalPending} 待處理` : '讀取中',
      detail: erpData ? `逾期 ${erpData.overdue || 0} / 庫存警示 ${erpData.stockWarning || 0}` : '等待 ERP 看板資料',
      action: '查看 ERP',
      onClick: () => setFocusTab('erp')
    },
    {
      tone: sourceErrorCount ? 'warning' : readySources.length ? 'ok' : 'muted',
      label: '資料來源',
      value: updateAlerts.length ? `${updateAlerts.length} 個有更新` : readySources.length ? `${readySources.length} 個已同步` : '等待同步',
      detail: updateAlerts.length ? `${updateAlerts[0].label} 摘要可能需重整` : newestSource?.latest ? `${newestSource.label} · ${formatKnowledgeTime(newestSource.latest.lastEditedTime)}` : sourceErrorCount ? `${sourceErrorCount} 個來源需檢查` : '尚未取得最新來源',
      action: '查看來源',
      onClick: () => setFocusTab('notion')
    },
    {
      tone: newsState?.status === 'ready' ? 'ok' : 'muted',
      label: '新聞',
      value: topNews?.topic || '等待更新',
      detail: topNews?.title || '新聞來源整理中',
      action: '查看新聞',
      onClick: () => setFocusTab('news')
    },
    {
      tone: calendarData?.connected ? (todayCalendarEvents.length ? 'warning' : 'ok') : 'muted',
      label: '行事曆',
      value: calendarData?.connected ? `${todayCalendarEvents.length} 筆今日` : '尚未連接',
      detail: calendarData?.connected ? (nextCalendarEvent ? `${nextCalendarEvent.title} · ${formatCalendarRange(nextCalendarEvent.start, nextCalendarEvent.end)}` : '今天沒有緊急行程') : '連接 Google Calendar',
      action: '看行程',
      onClick: () => setActiveView('calendar')
    }
  ];
  const serviceHealthCards = deploymentLinks
    .filter((item) => item.primary)
    .slice(0, 5)
    .map((item) => ({
      ...item,
      status: '正常',
      detail: item.group
    }));
  const deviceOnline = Boolean(deviceStatus.data?.online);
  const serviceNormalCount = serviceHealthCards.length + (deviceOnline ? 1 : 0);
  const serviceTotalCount = serviceHealthCards.length + 1;
  const focusTabs = [
    { id: 'overview', label: '重點' },
    { id: 'erp', label: 'ERP' },
    { id: 'notion', label: 'Notion' },
    { id: 'news', label: '新聞' },
    { id: 'device', label: '裝置' }
  ];
  const showNotion = focusTab === 'overview' || focusTab === 'notion';
  const showNotionDetail = focusTab === 'notion';
  const showNews = focusTab === 'news';
  const showDevice = focusTab === 'device';
  const showErp = focusTab === 'overview' || focusTab === 'erp';
  const briefHighlights = displayedSummaryHighlights.slice(0, 3);
  const nextStepItems = [
    erpData?.overdue > 0 ? `ERP 有 ${erpData.overdue} 件交期逾期，先確認可出貨與需改期項目。` : null,
    erpData?.stockWarning > 0 ? `庫存警示 ${erpData.stockWarning} 件，建議先看低庫存品項。` : null,
    updateAlerts.length ? `${updateAlerts[0].label} 有新資料，摘要可能需要更新。` : null,
    nextCalendarEvent ? `下一個行程：${nextCalendarEvent.title}，${formatCalendarRange(nextCalendarEvent.start, nextCalendarEvent.end)}。` : null
  ].filter(Boolean).slice(0, 4);

  const inboxDigest = buildInboxDigest(notes);
  const actionTasks = [...tasks]
    .filter((task) => !task.done)
    .sort((a, b) => Number(Boolean(b.important)) - Number(Boolean(a.important)))
    .slice(0, 5);
  const inferredTaskNotes = inboxDigest.taskReady.slice(0, 3);
  const taskActionCount = actionTasks.length + inferredTaskNotes.length;
  const weeklyTrackingItems = [
    { label: 'CRM follow-up', count: inboxDigest.weeklyReady.filter((note) => /crm|客戶|追蹤|follow/i.test(note.title || '')).length, detail: inboxDigest.weeklyReady.find((note) => /crm|客戶|追蹤|follow/i.test(note.title || ''))?.title || '沒有新的 CRM 追蹤' },
    { label: '內容待發', count: inboxDigest.weeklyReady.filter((note) => /內容|貼文|seo|文章|社媒/i.test(note.title || '')).length, detail: inboxDigest.weeklyReady.find((note) => /內容|貼文|seo|文章|社媒/i.test(note.title || ''))?.title || '沒有新的內容提醒' },
    { label: '專案待處理', count: projects.filter((project) => project.status !== '完成').length, detail: projects.find((project) => project.status !== '完成')?.name || '沒有卡住的專案' },
    { label: '週報待跟進', count: inboxDigest.weeklyReady.length, detail: inboxDigest.weeklyReady[0]?.title || newestSource?.latest?.title || '等待週報來源更新' }
  ];
  const shortTermReminders = [
    nextCalendarEvent ? { label: '下一筆行程', detail: `${nextCalendarEvent.title} · ${formatCalendarRange(nextCalendarEvent.start, nextCalendarEvent.end)}` } : null,
    erpData?.overdue > 0 ? { label: 'ERP 交期', detail: `逾期 ${erpData.overdue} 筆需要確認` } : null,
    inboxDigest.taskReady.length ? { label: '可轉任務', detail: `${inboxDigest.taskReady.length} 筆收件匣資料可轉成任務` } : null
  ].filter(Boolean).slice(0, 3);

  useEffect(() => {
    let isMounted = true;
    async function refreshDevice() {
      try {
        const response = await fetch('/api/device/status?deviceId=vic-windows-pc');
        const data = await response.json();
        if (!isMounted) return;
        setDeviceStatus({ status: 'ready', data });
      } catch {
        if (!isMounted) return;
        setDeviceStatus({ status: 'error', data: null });
      }
    }
    refreshDevice();
    const timer = window.setInterval(refreshDevice, 15000);
    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <section className="commandDashboard">
      <div className="actionConsoleHero">
        <div>
          <span>今日行動中控台</span>
          <h2>先處理會推動結果的事</h2>
          <p>任務、本週追蹤與知識分流排在最前面；連結、歷史與完整清單移到後段參考區。</p>
        </div>
        <button type="button" onClick={() => setActiveView('inbox')}><Inbox size={16} />整理收件匣</button>
      </div>

      <section className="actionDashboardGrid">
        <article className="todayActionPanel">
          <div className="actionPanelHeader">
            <div>
              <span>第一優先</span>
              <h2>今日任務</h2>
            </div>
            <strong>{taskActionCount}</strong>
          </div>
          <div className="todayTaskList">
            {actionTasks.map((task) => (
              <div className="todayTaskRow" key={task.id}>
                <button type="button" aria-label="切換任務狀態" onClick={() => setActiveView('projects')}><CheckCircle2 size={16} /></button>
                <div>
                  <strong>{task.title}</strong>
                  <span>{stageLabels[task.stage] || '待處理'} · 下一步：{task.important ? '先處理這件' : '排入今日工作流'}</span>
                </div>
                <button type="button" onClick={() => setActiveView('projects')}>開啟</button>
              </div>
            ))}
            {inferredTaskNotes.map((note) => (
              <div className="todayTaskRow inboxDerived" key={note.id}>
                <button type="button" aria-label="收件匣任務"><Inbox size={16} /></button>
                <div>
                  <strong>{note.title}</strong>
                  <span>{getInboxTopic(note)} · 下一步：{getInboxNextStep(note)}</span>
                </div>
                <button type="button" onClick={() => setActiveView('inbox')}>分流</button>
              </div>
            ))}
            {taskActionCount === 0 && <div className="actionEmpty">今天沒有明確任務。可以先整理收件匣，找出下一步。</div>}
          </div>
        </article>

        <article className="weeklyTrackPanel">
          <div className="actionPanelHeader compact">
            <div>
              <span>這週要盯</span>
              <h2>本週追蹤</h2>
            </div>
          </div>
          <div className="weeklyTrackList">
            {weeklyTrackingItems.map((item) => (
              <button type="button" key={item.label} onClick={() => setActiveView(item.label.includes('CRM') || item.label.includes('週報') ? 'knowledge' : 'projects')}>
                <span>{item.label}</span>
                <strong>{item.count}</strong>
                <small>{item.detail}</small>
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="dailyCommandBrief">
        <div className="briefHero">
          <span>今日中控</span>
          <strong>{attentionItems.length ? '有訊號需要先看' : '目前沒有明顯警訊'}</strong>
          <p>{briefHighlights[0] || newestItem?.summary || 'Notion、ERP、新聞與行事曆會在這裡整理成可快速判斷的重點。'}</p>
        </div>
        <div className="briefActionList">
          <span>下一步</span>
          {nextStepItems.length ? nextStepItems.map((item) => <p key={item}>{item}</p>) : <p>先從「即時重點整理」掃過，再進資料來源看細節。</p>}
        </div>
      </section>

      <section className="priorityBoard">
        <div className="priorityBoardTitle">
          <span>今日優先</span>
          <strong>{priorityMessage}</strong>
        </div>
        <div className="priorityCards">
          {executiveCards.map((item) => (
            <button className={`priorityCard ${item.tone}`} key={item.label} onClick={item.onClick}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.detail}</small>
              <em>{item.action}</em>
            </button>
          ))}
        </div>
      </section>

      <section className="knowledgeRoutingStrip">
        <button type="button" onClick={() => setActiveView('inbox')}><span>待整理</span><strong>{inboxDigest.counts.triage}</strong></button>
        <button type="button" onClick={() => setActiveView('inbox')}><span>可轉任務</span><strong>{inboxDigest.counts.task}</strong></button>
        <button type="button" onClick={() => setActiveView('inbox')}><span>週報可讀</span><strong>{inboxDigest.counts.weekly}</strong></button>
        <button type="button" onClick={() => setActiveView('inbox')}><span>可沉澱知識</span><strong>{inboxDigest.counts.knowledge}</strong></button>
      </section>

      <section className="inboxActionPreview">
        <div className="actionPanelHeader compact">
          <div>
            <span>快速判斷資料要去哪裡</span>
            <h2>知識收件匣摘要</h2>
          </div>
          <button type="button" onClick={() => setActiveView('inbox')}>看全部 <ChevronRight size={15} /></button>
        </div>
        <div className="inboxPreviewRows">
          {inboxDigest.recent.slice(0, 5).map((note) => (
            <article key={note.id}>
              <div>
                <strong>{note.title}</strong>
                <span>{getInboxTopic(note)} · {getInboxFramework(note)}</span>
                <small>下一步：{getInboxNextStep(note)}</small>
              </div>
              <em>{formatKnowledgeTime(getNoteTimeValue(note))}</em>
            </article>
          ))}
          {inboxDigest.recent.length === 0 && <div className="actionEmpty">目前沒有待分流資料。</div>}
        </div>
      </section>

      {shortTermReminders.length > 0 && (
        <section className="shortTermReminderPanel">
          <div className="actionPanelHeader compact"><div><span>近期管理</span><h2>接下來要留意</h2></div></div>
          <div>
            {shortTermReminders.map((item) => <p key={item.label}><strong>{item.label}</strong>{item.detail}</p>)}
          </div>
        </section>
      )}

      <div className="referenceDivider"><span>參考資訊與完整清單</span></div>
      <div className="statusStrip">
        <div><Clock3 size={18} /><span>今天</span><strong>{todayLabel}</strong></div>
        <div><BookOpen size={18} /><span>Notion</span><strong>{notionData.allLiveItems.length ? '已同步' : '讀取中'}</strong><small>{newestSource?.latest ? formatKnowledgeTime(newestSource.latest.lastEditedTime) : '等待資料'}</small></div>
        <div><BarChart3 size={18} /><span>ERP</span><strong>{erpData ? `${erpData.totalPending} 待處理` : '讀取中'}</strong><small>{erpData ? `逾期 ${erpData.overdue || 0} / 庫存 ${erpData.stockWarning || 0}` : '等待資料'}</small></div>
        <div><CalendarDays size={18} /><span>行事曆</span><strong>{calendarData?.connected ? `${todayCalendarEvents.length} 筆今日` : '待連接'}</strong><small>{nextCalendarEvent ? formatCalendarRange(nextCalendarEvent.start, nextCalendarEvent.end) : '沒有近期提醒'}</small></div>
        <div><Sparkles size={18} /><span>最新來源</span><strong>{newestSource?.label || '等待資料'}</strong><small>{newestSource?.latest ? formatKnowledgeTime(newestSource.latest.lastEditedTime) : '尚未同步'}</small></div>
        <div><Wifi size={18} /><span>服務狀態</span><strong>{serviceNormalCount}/{serviceTotalCount} 正常</strong><small>{deviceOnline ? '本機代理在線' : '本機代理待回報'}</small></div>
      </div>

      <div className="dashboardFocusTabs" role="tablist" aria-label="總攬焦點">
        {focusTabs.map((tab) => (
          <button type="button" className={focusTab === tab.id ? 'activeFocusTab' : ''} key={tab.id} onClick={() => setFocusTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className={`dashboardLayout focus-${focusTab}`}>
        {showNotion && <section className="dashboardMainPanel">
          <div className="dashboardPanelHeader">
            <div><h2>即時重點整理</h2><span>首頁先看整理後的重點；資料來源明細放在下方</span></div>
            <button onClick={() => notionData.refreshAll()}><RotateCcw size={15} />重新抓取來源</button>
          </div>
          {updateAlerts.length > 0 && (
            <div className="sourceUpdateNotice">
              <div>
                <Bell size={17} />
                <span>來源抓到新資料，AI 摘要可能需要更新</span>
              </div>
              <ul>
                {updateAlerts.slice(0, 3).map((source) => (
                  <li key={source.id}>
                    <strong>{source.label}</strong>
                    <small>{source.latest.title} · {formatKnowledgeTime(source.latest.lastEditedTime)}</small>
                  </li>
                ))}
              </ul>
              <div className="sourceUpdateActions">
                <button type="button" onClick={() => setActiveView('knowledge')}>看資料來源</button>
                <button type="button" onClick={() => notionData.markAllSourcesSeen()}>標為已看</button>
              </div>
            </div>
          )}
          {(aiSummaryItem || liveSummaryHighlights.length > 0 || notionData.aiSummary?.status === 'loading' || notionData.aiSummary?.status === 'error') && (
            <div
              className={`aiSummaryCard ${notionData.aiSummary?.status || ''}`}
            >
              <div className="aiSummaryHead">
                <span><Sparkles size={16} /> 即時重點整理</span>
                <small>
                  {shouldUseLiveSummary
                    ? `已套用最新來源 · ${newestItem?.lastEditedTime ? formatKnowledgeTime(newestItem.lastEditedTime) : '剛剛'}`
                    : aiSummaryItem?.lastEditedTime
                      ? `更新 ${formatKnowledgeTime(aiSummaryItem.lastEditedTime)}`
                      : notionData.aiSummary?.message}
                </small>
              </div>
              <strong>{displayedSummaryTitle}</strong>
              {(notionData.aiSummaryIsStale || notionData.aiSummaryNeedsSource) && (
                <div className="aiSummaryNotice">
                  <Bell size={15} />
                  <span>{shouldUseLiveSummary ? '已先用最新來源資料更新畫面；Notion AI 摘要頁仍可之後再整理。' : '來源已更新，請重新整理來源資料。'}</span>
                </div>
              )}
              {displayedSummaryHighlights.length > 0 ? (
                <ul>{displayedSummaryHighlights.slice(0, 5).map((text) => <li key={text}>{text}</li>)}</ul>
              ) : (
                <p>{notionData.aiSummary?.message || '請在 Notion AI 摘要頁放入今日重點、風險與下一步。'}</p>
              )}
              <div className="aiSummaryActions">
                <button type="button" onClick={() => notionData.refreshAll()}><RotateCcw size={15} />重新抓取來源</button>
                {aiSummaryItem?.url && <a href={aiSummaryItem.url} target="_blank" rel="noreferrer"><ExternalLink size={15} />開啟 Notion 摘要頁</a>}
              </div>
            </div>
          )}
          <div className="sourceSectionHeader">
            <div>
              <h3>{showNotionDetail ? '各來源狀態' : '各來源最新'}</h3>
              <span>{showNotionDetail ? '完整顯示每個來源的讀取狀態與最新頁面' : '每個來源都保留一格；需要處理的來源會用較低干擾方式顯示'}</span>
            </div>
            <button type="button" onClick={() => setActiveView('knowledge')}>管理資料來源 <ChevronRight size={15} /></button>
          </div>
          <div className="sourceOverviewGrid">
            {sourceCardsForView.length > 0 ? sourceCardsForView.map((source) => (
              <a className={`sourceOverviewCard ${source.isError ? 'sourceErrorCard' : ''}`} href={source.href || undefined} target={source.href ? '_blank' : undefined} rel={source.href ? 'noreferrer' : undefined} key={source.id} onClick={(event) => {
                if (!source.href) {
                  event.preventDefault();
                  setActiveView('knowledge');
                }
              }}>
                <div className="sourceOverviewTop">
                  <span>{source.hasUpdate ? '有新資料' : `${source.count} 頁`}</span>
                  <strong>{source.label}</strong>
                  <small>{source.latest ? `${source.latest.title} · ${formatKnowledgeTime(source.latest.lastEditedTime)}` : source.displayMessage}</small>
                </div>
                {source.isError ? (
                  <p>{source.displayMessage}</p>
                ) : source.highlights.length > 0 ? (
                  <ul>{source.highlights.map((text) => <li key={text}>{text}</li>)}</ul>
                ) : (
                  <p>{source.status === 'loading' ? '正在讀取最新資料...' : '尚未產生重點摘要。'}</p>
                )}
                {source.recentItems.length > 1 && (
                  <div className="sourceRecentLine">
                    {source.recentItems.slice(1).map((item) => (
                      <span key={item.id} onClick={(event) => {
                        if (!item.url) return;
                        event.preventDefault();
                        event.stopPropagation();
                        window.open(item.url, '_blank', 'noopener,noreferrer');
                      }}>{item.title}</span>
                    ))}
                  </div>
                )}
              </a>
            )) : (
              <div className="dashboardEmpty"><BookOpen size={18} />正在讀取 Notion；若一直沒有資料，請確認來源頁面已分享給 integration。</div>
            )}
          </div>
        </section>}

        {focusTab === 'overview' && <aside className="dashboardSidePanel dashboardStackPanel">
          <CalendarMiniAgenda calendarData={calendarData} setActiveView={setActiveView} />
          <div className="serviceHealthPanel">
          <div className="dashboardPanelHeader compact">
            <div><h2>服務狀態</h2><span>常用系統入口與連線概況</span></div>
            <button type="button" onClick={() => setActiveView('links')}>全部連結 <ChevronRight size={15} /></button>
          </div>
          <div className="serviceHealthList">
            {serviceHealthCards.map((service) => (
              <a href={service.url} target="_blank" rel="noreferrer" key={service.id}>
                <span className="serviceDot online" />
                <div>
                  <strong>{service.label}</strong>
                  <small>{service.detail}</small>
                </div>
                <em>{service.status}</em>
              </a>
            ))}
            <button type="button" onClick={() => setFocusTab('device')} className="serviceDeviceRow">
              <span className={`serviceDot ${deviceOnline ? 'online' : 'muted'}`} />
              <div>
                <strong>本機代理程式</strong>
                <small>{deviceOnline ? '可接收遠端指令' : '等待狀態回報'}</small>
              </div>
              <em>{deviceOnline ? '正常' : '待確認'}</em>
            </button>
          </div>
          </div>
        </aside>}

        {showDevice && <aside className="dashboardSidePanel">
          <div className="dashboardPanelHeader compact">
            <div><h2>系統狀態</h2><span>{deviceStatus.data?.online ? '代理在線' : '等待代理回報'}</span></div>
          </div>
          <div className="systemRows">
            <div><span>主機</span><strong>{deviceState?.hostname || 'VICXD-Z13'}</strong></div>
            <div><span>CPU 溫度</span><strong className={tempLevel === '危險' ? 'dangerText' : tempLevel === '偏高' ? 'warningText' : ''}>{tempValue}</strong><small>{tempLevel}</small></div>
            <div><span>模式</span><strong>{deviceState?.dryRun ? '測試模式' : '正式執行'}</strong></div>
            <div><span>最後回報</span><strong>{deviceState?.lastSeen ? formatRelativeTime(new Date(deviceState.lastSeen)) : '尚未回報'}</strong></div>
          </div>
          <div className="quickPowerGrid">
            <button onClick={() => setActiveView('automation')}><Moon size={17} /><span>睡眠</span></button>
            <button onClick={() => setActiveView('automation')}><Power size={17} /><span>關機</span></button>
            <button onClick={() => setActiveView('automation')}><RotateCcw size={17} /><span>重開機</span></button>
          </div>
        </aside>}

        {showNews && <section className="dashboardSubPanel newsPreview">
          <div className="dashboardPanelHeader">
            <div><h2>新聞重點</h2><span>{newsState?.status === 'ready' ? `更新 ${newsUpdatedLabel} · ${newsHitLabel}` : '等待新聞來源更新'}</span></div>
            <button onClick={() => newsState.refresh({ silent: true })} disabled={newsState.isRefreshing}><RotateCcw size={15} />{newsState.isRefreshing ? '更新中' : '重新整理'}</button>
          </div>
          <div className="newsDigestGrid">
            {newsHighlights.map((item) => (
              <article className="newsDigestCard" key={`${item.topic}-${item.title}`}>
                <span>{item.topic}</span>
                <strong>{item.title}</strong>
                <p>{item.summary}</p>
              </article>
            ))}
          </div>
          {newsItems.length > 0 && (
            <div className="newsTickerList">
              {newsItems.map((item) => (
                <a href={item.url || undefined} target={item.url ? '_blank' : undefined} rel={item.url ? 'noreferrer' : undefined} key={item.id || item.url || item.title}>
                  <span>{item.source} · {item.topic}</span>
                  <strong>{item.title}</strong>
                </a>
              ))}
            </div>
          )}
        </section>}

        {showNotionDetail && <section className="dashboardSubPanel">
          <div className="dashboardPanelHeader">
            <div><h2>Notion 最新明細</h2><span>跨來源依更新時間排序，適合追細節</span></div>
            <button onClick={() => setActiveView('knowledge')}>管理來源 <ChevronRight size={15} /></button>
          </div>
          <div className="updateTable">
            <div className="updateTableHead"><span>來源</span><span>標題</span><span>更新</span><span>重點摘要</span></div>
            {topBullets.length > 0 ? topBullets.map((item) => (
              <a className="updateRow" href={item.url} target="_blank" rel="noreferrer" key={item.id}>
                <span className="sourceTag">{item.sourceLabel}</span>
                <strong>{item.title}</strong>
                <time>{formatKnowledgeTime(item.time)}</time>
                <p>{item.text}</p>
              </a>
            )) : <div className="dashboardEmpty">尚未設定 Notion 資料來源。</div>}
          </div>
        </section>}

        {showErp && <section className="dashboardSubPanel erpPreview">
          <div className="dashboardPanelHeader">
            <div><h2>LEMATEC ERP 看板</h2><span>{erpData?.updatedAt ? `最後更新：${formatKnowledgeTime(erpData.updatedAt)}` : erpBoard.error || '等待 ERP JSON API'}</span></div>
            <button onClick={() => erpBoard.refresh()}><RotateCcw size={15} />{erpStatusLabel}</button>
          </div>
          <div className="erpMetricGrid">
            {erpMetrics.map(([label, value, area]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{area}</small></div>)}
          </div>
          <div className="erpRows">
            {erpRows.map(([label, value, area]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{area}</small></div>)}
          </div>
        </section>}
      </div>
    </section>
  );
}

function CapturePanel({ captureType, setCaptureType, draft, setDraft, handleCapture, lastAction, captureSync, refreshCaptureInbox }) {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('可手動輸入、貼上文字，或使用語音轉文字。');
  const isVoiceSupported = typeof window !== 'undefined' && Boolean(getSpeechRecognition());
  const composedDraft = `${draft}${interimText ? `${draft ? ' ' : ''}${interimText}` : ''}`;

  function startListening() {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setVoiceStatus('這個瀏覽器不支援語音轉文字，建議使用 Chrome。');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-TW';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceStatus('正在聆聽，停止後文字會保留在輸入框。');
    };
    recognition.onresult = (event) => {
      let finalText = '';
      let interim = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalText += text;
        else interim += text;
      }
      if (finalText) {
        setDraft((current) => `${current}${current ? ' ' : ''}${finalText.trim()}`);
      }
      setInterimText(interim.trim());
    };
    recognition.onerror = (event) => {
      setVoiceStatus(`語音辨識中斷：${event.error}`);
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
      setVoiceStatus('已停止，可繼續編輯或直接新增。');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
  }

  return (
    <section className="capturePanel">
      <div className="captureModeHeader">
        <div>
          <span>快速輸入</span>
          <strong>文字、連結、語音與會議都先收進同一個 Notion 收件匣</strong>
        </div>
        <small>{captureTypes.find((type) => type.id === captureType)?.label || '筆記'}</small>
      </div>
      <textarea
        value={composedDraft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') handleCapture(composedDraft);
        }}
        placeholder="輸入、貼上文字，或按下語音轉文字後再整理。"
      />
      <div className="captureToolbar">
        <div className="segmented">
          {captureTypes.map(({ id, label, icon: Icon }) => (
            <button className={captureType === id ? 'activeCapture' : ''} key={id} onClick={() => setCaptureType(id)}>
              <Icon size={16} />{label}
            </button>
          ))}
        </div>
        <span className="statusHint">{lastAction}</span>
        <button className={`voiceInlineButton ${isListening ? 'recording' : ''}`} type="button" onClick={isListening ? stopListening : startListening}>
          {isListening ? <Square size={16} /> : <Mic size={16} />}{isListening ? '停止' : '語音'}
        </button>
        <button className="primaryAction" onClick={() => handleCapture(composedDraft)}><Plus size={17} />新增</button>
      </div>
      <div className="captureVoiceHint"><span className={isListening ? 'pulseDot' : ''} />{isVoiceSupported ? voiceStatus : '此瀏覽器不支援語音轉文字，可直接貼上文字。'} 目前語音辨識不會自動分辨多人聲音。</div>
      <div className={`captureSyncState ${captureSync?.status || 'idle'}`}>
        <div>
          <strong>Notion 收件匣</strong>
          <span>{captureSync?.message || '快速紀錄會統一寫入 Notion，兩邊開啟時自動同步。'}</span>
        </div>
        <button type="button" onClick={() => refreshCaptureInbox?.()}><RotateCcw size={15} />重新同步</button>
      </div>
    </section>
  );
}

function formatKnowledgeTime(value) {
  if (!value) return '尚未讀取';
  try {
    return new Intl.DateTimeFormat('zh-TW', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  } catch {
    return '時間未知';
  }
}

function parseNoteTime(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameLocalDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isSameLocalMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function formatDateTimeInput(date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function formatCalendarRange(start, end) {
  if (!start) return '未設定時間';
  const formatter = new Intl.DateTimeFormat('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const startText = formatter.format(new Date(start));
  if (!end) return startText;
  const endText = new Intl.DateTimeFormat('zh-TW', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(end));
  return `${startText} - ${endText}`;
}

function buildCalendarMonth(monthDate) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());
  const today = new Date();
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      key: date.toISOString().slice(0, 10),
      date,
      outside: date.getMonth() !== monthDate.getMonth(),
      today: isSameLocalDay(date, today)
    };
  });
}

const inboxTimeFilters = [
  { id: 'today', label: '今日' },
  { id: '7d', label: '7 天內' },
  { id: 'month', label: '本月' },
  { id: 'custom', label: '自訂' },
  { id: 'all', label: '全部' }
];

const inboxLimitOptions = [6, 12, 24, 50];

const inboxRoutingFilters = [
  { id: 'all', label: '全部' },
  { id: 'triage', label: '待整理' },
  { id: 'task', label: '可轉任務' },
  { id: 'knowledge', label: '可沉澱知識' },
  { id: 'weekly', label: '週報可讀' },
  { id: 'archived', label: '已封存' }
];

const inboxActionMap = {
  task: { status: 'ready', routingType: 'task', label: '轉任務' },
  knowledge: { status: 'ready', routingType: 'knowledge', label: '轉知識' },
  weekly: { status: 'ready', routingType: 'weekly', label: '週報參考' },
  archived: { status: 'archived', routingType: 'archived', label: '封存' }
};

function getNoteTimeValue(note) {
  return note?.lastEditedTime || note?.updatedAt || note?.createdAt || note?.time;
}

function getNoteStatus(note = {}) {
  if (note.status) return note.status;
  if (note.archived || note.routingType === 'archived') return 'archived';
  if (note.routingType && note.routingType !== 'triage') return 'ready';
  return 'triage';
}

function inferInboxRoute(note = {}) {
  if (note.routingType) return note.routingType;
  const haystack = `${note.title || ''} ${note.content || ''} ${note.summary || ''}`.toLowerCase();
  if (note.type === 'task' || /待辦|任務|todo|follow|追蹤|確認|聯絡|報價/.test(haystack)) return 'task';
  if (/週報|weekly|crm|seo|市場|匯報|報告/.test(haystack)) return 'weekly';
  if (note.type === 'link' || note.type === 'note' || /sop|知識|流程|方法|框架|教學|整理/.test(haystack)) return 'knowledge';
  return 'triage';
}

function getInboxTopic(note = {}) {
  if (note.topic) return note.topic;
  if (note.type === 'meeting') return '會議';
  if (note.type === 'voice') return '語音';
  if (note.type === 'link') return '連結';
  const route = inferInboxRoute(note);
  if (route === 'task') return '待辦';
  if (route === 'weekly') return '週報';
  if (route === 'knowledge') return '知識';
  return '未分類';
}

function getInboxFramework(note = {}) {
  if (note.framework) return note.framework;
  const route = inferInboxRoute(note);
  if (route === 'task') return '任務 / 下一步';
  if (route === 'weekly') return '週報參考';
  if (route === 'knowledge') return '知識沉澱';
  if (note.type === 'meeting') return '會議紀錄';
  return '收件匣分流';
}

function getInboxNextStep(note = {}) {
  if (note.nextStep) return note.nextStep;
  const route = inferInboxRoute(note);
  if (getNoteStatus(note) === 'archived') return '已封存，首頁不再優先顯示';
  if (route === 'task') return '確認負責人與完成時間';
  if (route === 'weekly') return '納入本週週報判讀';
  if (route === 'knowledge') return '整理成正式知識頁';
  return '判斷要轉任務、知識、週報或封存';
}

function buildInboxDigest(notes = []) {
  const active = notes.filter((note) => getNoteStatus(note) !== 'archived');
  const taskReady = active.filter((note) => inferInboxRoute(note) === 'task');
  const weeklyReady = active.filter((note) => inferInboxRoute(note) === 'weekly');
  const knowledgeReady = active.filter((note) => inferInboxRoute(note) === 'knowledge');
  const triage = active.filter((note) => getNoteStatus(note) === 'triage' || inferInboxRoute(note) === 'triage');
  const archived = notes.filter((note) => getNoteStatus(note) === 'archived');
  const recent = [...active]
    .sort((a, b) => new Date(getNoteTimeValue(b) || 0) - new Date(getNoteTimeValue(a) || 0))
    .slice(0, 5);
  return {
    active,
    triage,
    taskReady,
    weeklyReady,
    knowledgeReady,
    archived,
    recent,
    counts: {
      triage: triage.length,
      task: taskReady.length,
      weekly: weeklyReady.length,
      knowledge: knowledgeReady.length,
      archived: archived.length
    }
  };
}

function filterInboxNotes(notes = [], filter = 'all') {
  if (filter === 'all') return notes.filter((note) => getNoteStatus(note) !== 'archived');
  if (filter === 'archived') return notes.filter((note) => getNoteStatus(note) === 'archived');
  if (filter === 'triage') return notes.filter((note) => getNoteStatus(note) !== 'archived' && (getNoteStatus(note) === 'triage' || inferInboxRoute(note) === 'triage'));
  return notes.filter((note) => getNoteStatus(note) !== 'archived' && inferInboxRoute(note) === filter);
}

function splitSummaryHighlights(text = '') {
  return text
    .replace(/[#*_`]/g, ' ')
    .replace(/\s+/g, ' ')
    .split(/(?:\s-\s|[。.!?？；;]\s*|\n+)/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 10)
    .slice(0, 3);
}

function isLowValueSummaryLine(text = '') {
  const normalized = text.trim();
  if (!normalized) return true;
  if (/^(SEO監控周報|客戶週報|CRM追蹤匯報|社媒貼文|市場情報庫|本週批次|完整讀取筆數|UTM URL|來源)[:：]/i.test(normalized)) return true;
  if (/^https?:\/\//i.test(normalized)) return true;
  if (normalized.length < 12) return true;
  return false;
}

function scoreSummaryLine(text = '') {
  const keywords = [
    '未到帳', '逾期', '風險', '異常', '卡住', '延遲', '下降', '下滑', '不足', '缺料',
    '待處理', '待審', '待檢', '待出貨', '待領料', '生產中', '交期', '庫存警示',
    '需提供', '需要', '建議', '下一步', '優先', '影響', '客戶', '詢盤', 'SEO', '流量',
    '排名', '轉換', '點擊', '曝光', '週報', '市場', '趨勢'
  ];
  return keywords.reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0);
}

function buildActionableSummary(items = [], limit = 5) {
  const candidates = items.flatMap((item) => {
    const lines = [
      ...(item.highlights || []),
      ...splitSummaryHighlights(item.summary || ''),
      item.summary || ''
    ];

    return lines
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter((line) => !isLowValueSummaryLine(line))
      .map((line) => ({
        id: `${item.id || item.title}-${line}`,
        sourceLabel: item.sourceLabel,
        text: line.length > 96 ? `${line.slice(0, 94)}...` : line,
        time: item.lastEditedTime,
        score: scoreSummaryLine(line)
      }));
  });

  const seen = new Set();
  return candidates
    .filter((item) => {
      const key = `${item.sourceLabel}-${item.text}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (b.score - a.score) || (new Date(b.time || 0) - new Date(a.time || 0)))
    .slice(0, limit)
    .map((item) => `${item.sourceLabel}：${item.text}`);
}

function buildKnowledgeBullets(items = [], limit = 8) {
  const bulletItems = items.map((item) => {
    const highlights = item.highlights?.length ? item.highlights : splitSummaryHighlights(item.summary);
    const text = highlights[0] || item.summary || item.title;
    return {
      id: `${item.id || item.title}-${text}`,
      title: item.title,
      sourceLabel: item.sourceLabel,
      sourceId: item.sourceId || item.sourceLabel || 'unknown',
      url: item.url,
      time: item.lastEditedTime,
      text
    };
  });

  const groups = new Map();
  bulletItems.forEach((item) => {
    if (!groups.has(item.sourceId)) groups.set(item.sourceId, []);
    groups.get(item.sourceId).push(item);
  });

  const sortedGroups = [...groups.values()]
    .map((group) => group.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0)))
    .sort((a, b) => new Date(b[0]?.time || 0) - new Date(a[0]?.time || 0));

  const balanced = [];
  let round = 0;
  while (balanced.length < limit) {
    let added = false;
    sortedGroups.forEach((group) => {
      if (balanced.length >= limit) return;
      if (group[round]) {
        balanced.push(group[round]);
        added = true;
      }
    });
    if (!added) break;
    round += 1;
  }

  return balanced;
}

function useErpBoardSummary() {
  const [state, setState] = useState({ status: 'loading', data: null, error: '' });

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: '' }));
    try {
      const response = await fetch('https://green-wave-c22f.vic-e93.workers.dev/api/board.json');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'ERP 看板 API 讀取失敗。');
      setState({ status: 'ready', data, error: '' });
    } catch (error) {
      setState({ status: 'error', data: null, error: error.message || 'ERP 看板 API 讀取失敗。' });
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 60000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return { ...state, refresh };
}

function useCalendarData() {
  const [state, setState] = useState({
    status: 'checking',
    connected: false,
    configured: false,
    message: '正在檢查 Google Calendar 連線',
    events: [],
    isLoading: false
  });
  const [notificationPermission, setNotificationPermission] = useState(() => (
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  ));
  const notifiedRef = useRef(new Set());

  const loadEvents = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setState((current) => ({ ...current, isLoading: true }));
    try {
      const response = await fetch('/api/calendar/events?days=90');
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || '讀取 Google Calendar 失敗');
      setState((current) => ({
        ...current,
        status: 'ready',
        connected: true,
        configured: true,
        message: 'Google Calendar 已同步',
        events: data.events || [],
        isLoading: false
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        status: 'error',
        message: error.message || '讀取 Google Calendar 失敗',
        isLoading: false
      }));
    }
  }, []);

  const loadStatus = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true }));
    try {
      const response = await fetch('/api/calendar/status');
      const data = await response.json();
      const connected = Boolean(data.connected);
      setState((current) => ({
        ...current,
        status: response.ok && data.ok ? 'ready' : 'error',
        connected,
        configured: Boolean(data.configured),
        message: data.message || (connected ? 'Google Calendar 已連線' : '尚未連接 Google Calendar'),
        isLoading: false
      }));
      if (connected) loadEvents({ silent: true });
    } catch (error) {
      setState((current) => ({
        ...current,
        status: 'error',
        connected: false,
        message: error.message || '無法檢查 Google Calendar 連線',
        isLoading: false
      }));
    }
  }, [loadEvents]);

  const createEvent = useCallback(async (payload) => {
    setState((current) => ({ ...current, isLoading: true }));
    const response = await fetch('/api/calendar/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setState((current) => ({ ...current, isLoading: false, status: 'error', message: data.message || '新增 Google Calendar 行程失敗' }));
      throw new Error(data.message || '新增 Google Calendar 行程失敗');
    }
    setState((current) => ({ ...current, message: '已新增到 Google Calendar' }));
    await loadEvents({ silent: true });
    return data.event;
  }, [loadEvents]);

  const updateEvent = useCallback(async (payload) => {
    setState((current) => ({ ...current, isLoading: true }));
    const response = await fetch('/api/calendar/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setState((current) => ({ ...current, isLoading: false, status: 'error', message: data.message || '更新 Google Calendar 行程失敗' }));
      throw new Error(data.message || '更新 Google Calendar 行程失敗');
    }
    setState((current) => ({ ...current, message: '已更新 Google Calendar 行程' }));
    await loadEvents({ silent: true });
    return data.event;
  }, [loadEvents]);

  const deleteEvent = useCallback(async (eventId) => {
    if (!eventId) return;
    setState((current) => ({ ...current, isLoading: true }));
    const response = await fetch(`/api/calendar/events?id=${encodeURIComponent(eventId)}`, { method: 'DELETE' });
    const data = await response.json().catch(() => ({ ok: response.ok }));
    if (!response.ok || !data.ok) {
      setState((current) => ({ ...current, isLoading: false, status: 'error', message: data.message || '刪除 Google Calendar 行程失敗' }));
      throw new Error(data.message || '刪除 Google Calendar 行程失敗');
    }
    setState((current) => ({
      ...current,
      status: 'ready',
      message: '已刪除行程',
      isLoading: false,
      events: current.events.filter((event) => event.id !== eventId)
    }));
  }, []);

  const requestNotifications = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      setNotificationPermission('unsupported');
      return 'unsupported';
    }
    const result = await Notification.requestPermission();
    setNotificationPermission(result);
    return result;
  }, []);

  useEffect(() => {
    loadStatus();
    const timer = window.setInterval(() => loadEvents({ silent: true }), 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [loadEvents, loadStatus]);

  useEffect(() => {
    if (notificationPermission !== 'granted') return;
    const now = Date.now();
    state.events.forEach((event) => {
      const startTime = new Date(event.start).getTime();
      const minutesUntil = Math.round((startTime - now) / 60000);
      if (minutesUntil < 0 || minutesUntil > 30 || notifiedRef.current.has(event.id)) return;
      notifiedRef.current.add(event.id);
      new Notification('Vic Workbench 行程提醒', {
        body: `${event.title} · ${formatCalendarRange(event.start, event.end)}`,
        tag: `calendar-${event.id}`,
        icon: '/icons/icon-192.png'
      });
    });
  }, [notificationPermission, state.events]);

  return {
    ...state,
    loadStatus,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    notificationPermission,
    requestNotifications
  };
}

function useNotionSources(notionConfig, setNotionConfig) {
  const configuredDatabases = getConfiguredNotionDatabases(notionConfig);
  const [liveSummaries, setLiveSummaries] = useState({});
  const [liveStatus, setLiveStatus] = useState({});
  const [aiSummary, setAiSummary] = useState({ status: 'idle', item: null, message: '尚未設定 AI 摘要頁。' });
  const connectedSources = useMemo(
    () => configuredDatabases.filter((item) => item.databaseId || item.pageUrl),
    [configuredDatabases.map((source) => `${source.id}:${source.databaseId || source.pageUrl}:${source.analysisLimit}:${source.sortMode}`).join('|')]
  );

  async function readNotionSource(source) {
    if (!source) return;
    const hasSource = source.sourceType === 'folder' ? Boolean(source.pageUrl) : Boolean(source.databaseId || source.pageUrl);
    if (!hasSource) {
      setLiveStatus((current) => ({ ...current, [source.id]: { status: 'error', message: '請先設定 Notion 來源連結。' } }));
      return;
    }

    setLiveStatus((current) => ({ ...current, [source.id]: { status: 'loading', message: '正在讀取 Notion...' } }));

    try {
      const response = await fetch('/api/notion/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'Notion 讀取失敗。');

      setLiveSummaries((current) => ({ ...current, [source.id]: data.summaries || [] }));
      setLiveStatus((current) => ({
        ...current,
        [source.id]: {
          status: 'ready',
          message: `已讀取 ${data.count} 個頁面。`,
          updatedAt: new Date().toISOString()
        }
      }));
    } catch (error) {
      setLiveStatus((current) => ({ ...current, [source.id]: { status: 'error', message: error.message || 'Notion 讀取失敗。' } }));
    }
  }

  async function readAiSummaryPage() {
    const pageUrl = notionConfig.aiSummaryPageUrl?.trim();
    if (!pageUrl) {
      setAiSummary({ status: 'idle', item: null, message: '尚未設定 AI 摘要頁。' });
      return;
    }

    setAiSummary((current) => ({ ...current, status: 'loading', message: '正在讀取 Notion AI 摘要頁...' }));

    try {
      const response = await fetch('/api/notion/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: {
            id: 'ai-summary',
            label: 'AI 總覽摘要',
            sourceType: 'page',
            pageUrl,
            analysisLimit: 1
          }
        })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'Notion AI 摘要頁讀取失敗。');

      setAiSummary({
        status: 'ready',
        item: data.summaries?.[0] || null,
        message: data.summaries?.[0] ? '已讀取 AI 摘要頁。' : '摘要頁目前沒有可顯示內容。'
      });
    } catch (error) {
      setAiSummary({ status: 'error', item: null, message: error.message || 'Notion AI 摘要頁讀取失敗。' });
    }
  }

  useEffect(() => {
    connectedSources.forEach((source) => {
      if (liveSummaries[source.id] || liveStatus[source.id]?.status === 'loading') return;
      readNotionSource(source);
    });
  }, [connectedSources.map((source) => `${source.id}:${source.databaseId || source.pageUrl}`).join('|')]);

  useEffect(() => {
    readAiSummaryPage();
  }, [notionConfig.aiSummaryPageUrl]);

  useEffect(() => {
    if (!connectedSources.length && !notionConfig.aiSummaryPageUrl) return undefined;

    const timer = window.setInterval(() => {
      connectedSources.forEach((source) => readNotionSource(source));
      readAiSummaryPage();
    }, NOTION_AUTO_REFRESH_MS);

    return () => window.clearInterval(timer);
  }, [
    notionConfig.aiSummaryPageUrl,
    connectedSources.map((source) => `${source.id}:${source.databaseId || source.pageUrl}:${source.analysisLimit}:${source.sortMode}`).join('|')
  ]);

  const allLiveItems = connectedSources.flatMap((source) => (liveSummaries[source.id] || []).map((item) => ({ ...item, sourceLabel: source.label, sourceId: source.id })));
  const newestItem = [...allLiveItems].sort((a, b) => new Date(b.lastEditedTime || 0) - new Date(a.lastEditedTime || 0))[0];
  const overviewBullets = buildKnowledgeBullets(allLiveItems, 8);
  const sourceBriefs = connectedSources.map((source) => {
    const items = liveSummaries[source.id] || [];
    const latest = [...items].sort((a, b) => new Date(b.lastEditedTime || 0) - new Date(a.lastEditedTime || 0))[0];
    const seenAt = notionConfig.sourceSeenAt?.[source.id] || '';
    const hasUpdate = Boolean(latest?.lastEditedTime && (!seenAt || new Date(latest.lastEditedTime) > new Date(seenAt)));
    return {
      ...source,
      items,
      latest,
      seenAt,
      hasUpdate,
      status: liveStatus[source.id]?.status || (items.length ? 'ready' : 'idle'),
      message: liveStatus[source.id]?.message || (items.length ? `已讀取 ${items.length} 個頁面。` : '等待讀取')
    };
  });
  const updateAlerts = sourceBriefs
    .filter((source) => source.status === 'ready' && source.latest && source.hasUpdate)
    .sort((a, b) => new Date(b.latest.lastEditedTime || 0) - new Date(a.latest.lastEditedTime || 0));
  const aiSummaryUpdatedAt = aiSummary.item?.lastEditedTime || '';
  const aiSummaryIsStale = Boolean(
    newestItem?.lastEditedTime &&
    aiSummaryUpdatedAt &&
    new Date(newestItem.lastEditedTime) > new Date(aiSummaryUpdatedAt)
  );
  const aiSummaryNeedsSource = Boolean(newestItem?.lastEditedTime && !aiSummaryUpdatedAt && notionConfig.aiSummaryPageUrl);

  function markSourceSeen(sourceId) {
    const source = sourceBriefs.find((item) => item.id === sourceId);
    if (!source?.latest?.lastEditedTime || !setNotionConfig) return;

    setNotionConfig((current) => ({
      ...current,
      sourceSeenAt: {
        ...(current.sourceSeenAt || {}),
        [sourceId]: source.latest.lastEditedTime
      }
    }));
  }

  function markAllSourcesSeen() {
    if (!setNotionConfig) return;
    const seenMap = sourceBriefs.reduce((next, source) => {
      if (source.latest?.lastEditedTime) next[source.id] = source.latest.lastEditedTime;
      return next;
    }, {});

    setNotionConfig((current) => ({
      ...current,
      sourceSeenAt: {
        ...(current.sourceSeenAt || {}),
        ...seenMap
      }
    }));
  }

  return {
    configuredDatabases,
    connectedSources,
    liveSummaries,
    liveStatus,
    allLiveItems,
    newestItem,
    overviewBullets,
    sourceBriefs,
    updateAlerts,
    aiSummary,
    aiSummaryIsStale,
    aiSummaryNeedsSource,
    readNotionSource,
    markSourceSeen,
    markAllSourcesSeen,
    refreshAll: () => {
      connectedSources.forEach((source) => readNotionSource(source));
      readAiSummaryPage();
    }
  };
}

function NotionWorkspace({ notionConfig, notionData }) {
  const configuredDatabases = notionData.configuredDatabases;
  const defaultActive = configuredDatabases.some((item) => item.id === 'knowledge') ? 'knowledge' : configuredDatabases[0]?.id;
  const [activeDatabase, setActiveDatabase] = useState(defaultActive);
  const activeInfo = configuredDatabases.find((item) => item.id === activeDatabase) || configuredDatabases[0];
  const activeIsFolder = activeInfo?.sourceType === 'folder';
  const activeLink = activeInfo?.pageUrl || (activeInfo?.databaseId?.startsWith('http') ? activeInfo.databaseId : '');
  const activeSortLabel = notionSortOptions.find((item) => item.value === activeInfo?.sortMode)?.label || '最近更新優先';
  const activeDetail = notionDatabaseDetails[activeDatabase] || {
    headline: activeIsFolder
      ? '這個父頁已設定，接上 Notion API 後會讀取子頁、排序，並摘要最新報告。'
      : activeInfo?.databaseId
        ? '這個自訂資料庫已設定，接上 Notion API 後會顯示摘要。'
        : '尚未設定這個資料庫的 Notion 連結。',
    pending: 0,
    updatedAt: activeInfo?.databaseId || activeInfo?.pageUrl ? '已設定' : '尚未連接',
    items: []
  };
  const totalItems = configuredDatabases.reduce((total, item) => total + item.count, 0);
  const totalPending = Object.values(notionDatabaseDetails).reduce((total, item) => total + item.pending, 0);
  const connectedCount = configuredDatabases.filter((item) => item.databaseId || item.pageUrl).length;
  const activeSummaries = notionData.liveSummaries[activeInfo?.id] || activeDetail.items || [];
  const activeLiveState = notionData.liveStatus[activeInfo?.id];
  const activeHasSource = activeInfo?.sourceType === 'folder' ? Boolean(activeInfo?.pageUrl) : Boolean(activeInfo?.databaseId || activeInfo?.pageUrl);
  const connectedSources = notionData.connectedSources;
  const allLiveItems = notionData.allLiveItems;
  const newestItem = notionData.newestItem;
  const overviewBullets = notionData.overviewBullets.slice(0, 6);
  const sourceBriefs = notionData.sourceBriefs;
  const readActiveNotionSource = (source = activeInfo) => notionData.readNotionSource(source);

  useEffect(() => {
    if (!activeInfo || !activeHasSource || notionData.liveSummaries[activeInfo.id] || notionData.liveStatus[activeInfo.id]?.status === 'loading') return;
    readActiveNotionSource(activeInfo);
  }, [activeDatabase, activeHasSource]);

  return (
    <section className="panel notionWorkspace">
      <div className="panelTitle"><h2>資料來源總覽 <small>{configuredDatabases.length}</small></h2><span>自訂資料庫摘要</span></div>
      <div className="notionDashboardGrid">
        <article>
          <span>資料庫</span>
          <strong>{configuredDatabases.length}</strong>
          <p>{connectedCount} 個已設定來源</p>
        </article>
        <article>
          <span>總項目</span>
          <strong>{allLiveItems.length}</strong>
          <p>{allLiveItems.length > 0 ? '由 Notion API 即時更新' : '尚未連接 Notion'}</p>
        </article>
        <article>
          <span>待整理</span>
          <strong>{totalPending}</strong>
          <p>需要摘要或歸檔</p>
        </article>
      </div>
      <div className="knowledgeOverview">
        <section className="knowledgeBrief">
          <div className="knowledgeSectionTitle">
            <div>
              <strong>快速總覽</strong>
              <span>{newestItem ? `最近更新 ${formatKnowledgeTime(newestItem.lastEditedTime)}` : '讀取後會整理跨資料庫重點'}</span>
            </div>
            <button onClick={() => connectedSources.forEach((source) => readActiveNotionSource(source))}>
              <RotateCcw size={15} />重新整理
            </button>
          </div>
          <div className="knowledgeBulletList">
            {overviewBullets.length > 0 ? (
              overviewBullets.map((item) => (
                <a href={item.url} target="_blank" rel="noreferrer" key={item.id}>
                  <span>{item.sourceLabel}</span>
                  <strong>{item.text}</strong>
                  <small>{item.title}</small>
                </a>
              ))
            ) : (
              <div className="emptyState">尚未整理出重點，請先讀取 Notion 來源。</div>
            )}
          </div>
        </section>
        <section className="sourceOverview">
          <div className="knowledgeSectionTitle">
            <div>
              <strong>資料庫狀態</strong>
              <span>按來源看更新時間與讀取狀態</span>
            </div>
          </div>
          <div className="sourceOverviewList">
            {sourceBriefs.map((source) => (
              <button
                className={activeDatabase === source.id ? 'activeSourceOverview' : ''}
                key={source.id}
                onClick={() => setActiveDatabase(source.id)}
              >
                <strong>{source.label}</strong>
                <span>{source.items.length} 頁 · {source.status === 'loading' ? '讀取中' : source.status === 'ready' ? '已更新' : '待讀取'}</span>
                <small>{source.latest ? formatKnowledgeTime(source.latest.lastEditedTime) : source.message}</small>
              </button>
            ))}
          </div>
        </section>
      </div>
      <div className="databaseCards">
        {configuredDatabases.map(({ id, label, icon: Icon, count, status, purpose, databaseId, pageUrl, sourceType, analysisLimit }) => {
          const detail = notionDatabaseDetails[id];
          const isConnected = Boolean(databaseId || pageUrl);
          return (
            <button className={activeDatabase === id ? 'activeDatabaseCard' : ''} key={id} onClick={() => setActiveDatabase(id)}>
              <Icon size={18} />
              <strong>{label}</strong>
              <span>{isConnected ? `${sourceType === 'folder' ? '父頁' : '資料庫'} · 分析 ${analysisLimit} 頁` : `${count} 筆 · ${status}`}</span>
              <p>{detail?.headline || purpose}</p>
            </button>
          );
        })}
      </div>
      <div className="databaseTabs">
        {configuredDatabases.map(({ id, label, icon: Icon, count, databaseId, pageUrl }) => (
          <button className={activeDatabase === id ? 'activeDatabase' : ''} key={id} onClick={() => setActiveDatabase(id)}>
            <Icon size={16} /><span>{label}</span><small>{databaseId || pageUrl ? '已設' : count}</small>
          </button>
        ))}
      </div>
      <div className="databaseSummary">
        <div><strong>{activeInfo.label}</strong><span>{activeInfo.status} · {activeSortLabel} · 最多分析 {activeInfo.analysisLimit} 個子頁</span></div>
        <button onClick={() => readActiveNotionSource(activeInfo)} disabled={!activeHasSource || activeLiveState?.status === 'loading'}>
          <Wand2 size={16} />{activeLiveState?.status === 'loading' ? '讀取中' : '讀取摘要'}
        </button>
      </div>
      {activeLiveState?.message && (
        <div className={`sourceRunState ${activeLiveState.status || ''}`}>
          <div><span>{activeLiveState.status === 'ready' ? '知識庫已更新' : activeLiveState.status === 'error' ? '讀取失敗' : '讀取中'}</span><p>{activeLiveState.message}</p></div>
        </div>
      )}
      <div className="databaseInsight">
        <BookOpen size={18} />
        <p>{activeDetail.headline}</p>
      </div>
      <div className="summaryRows">
        {activeSummaries.length > 0 ? (
          activeSummaries.map((item) => (
            <article className="summaryRow" key={item.title}>
              <div><span>{activeInfo.label}</span><strong>{item.title}</strong><p>{item.summary}</p></div>
              <a href={item.url} target="_blank" rel="noreferrer" aria-label={`開啟 ${item.title}`}><ExternalLink size={16} /></a>
            </article>
          ))
        ) : (
          <div className="emptyState">
            尚未載入 {activeInfo.label} 資料。到設定頁貼上{activeIsFolder ? '父頁連結' : '資料庫連結'}，接上 Notion API 後會顯示真摘要與原頁連結。
          </div>
        )}
      </div>
      {activeLink ? (
        <a className="wideButton" href={activeLink} target="_blank" rel="noreferrer"><ExternalLink size={16} />開啟 {activeInfo.label} 看更多</a>
      ) : (
        <button className="wideButton"><ExternalLink size={16} />尚未設定 {activeInfo.label} 連結</button>
      )}
    </section>
  );
}

function NewsWorkspace({ newsState }) {
  const statusLabel = newsState.status === 'ready'
    ? `RSS 已更新 · ${newsState.fetchedAt ? formatKnowledgeTime(newsState.fetchedAt) : '剛剛'}`
    : newsState.status === 'refreshing'
      ? '正在重新整理'
      : newsState.status === 'stale'
        ? '保留上一輪資料'
        : '等待線上連線';

  return (
    <section className="panel notionWorkspace">
      <div className="panelTitle">
        <h2>新聞專區 <small>{newsState.briefs.length}</small></h2>
        <span>{statusLabel}</span>
        <button className="plainIcon" onClick={() => newsState.refresh({ silent: true })} disabled={newsState.isRefreshing} aria-label="重新整理新聞"><RotateCcw size={17} /></button>
      </div>
      <div className="newsRefreshBar">
        <div>
          <strong>{newsState.isStale ? '新聞可能需要更新' : '更新頻率正常'}</strong>
          <span>開啟 App 會抓一次；回到前景超過 30 分鐘會自動刷新，也可手動更新。</span>
        </div>
        {newsState.keywordHits?.length > 0 && (
          <div className="keywordHits">
            {newsState.keywordHits.slice(0, 5).map((item) => <span key={item.keyword}>{item.keyword} {item.count}</span>)}
          </div>
        )}
      </div>
      <div className="newsGrid">
        {newsState.briefs.map((item) => (
          <article key={item.topic}><Newspaper size={17} /><span>{item.topic}</span><strong>{item.title}</strong><p>{item.summary}</p></article>
        ))}
      </div>
      {newsState.items.length > 0 && (
        <div className="summaryRows">
          {newsState.items.slice(0, 10).map((item) => (
            <article className="summaryRow" key={item.id || item.url || item.title}>
              <div>
                <span>{item.source} · {item.topic}</span>
                <strong>{item.title}</strong>
                <p>{item.summary}</p>
              </div>
              {item.url && <a href={item.url} target="_blank" rel="noreferrer" aria-label={`開啟 ${item.title}`}><ExternalLink size={16} /></a>}
            </article>
          ))}
        </div>
      )}
      {newsState.sources.length > 0 && (
        <div className="sourceLine">
          來源：{newsState.sources.map((source) => `${source.source}${source.ok ? '' : '失敗'}`).join('、')}
        </div>
      )}
      {newsState.error && <div className="sourceLine">狀態：{newsState.error}</div>}
    </section>
  );
}

function SettingsWorkspace({ notionConfig, setNotionConfig, appearance, setAppearance, resetDemoData }) {
  const pwaInstall = usePwaInstall();
  const databaseConfig = normalizeNotionDatabaseConfigs(notionConfig);
  const configuredDatabases = Object.values(databaseConfig);
  const [sourceRuns, setSourceRuns] = useState({});
  const [notionConnection, setNotionConnection] = useState({ status: 'checking', connected: false });
  const [activeSettingsTab, setActiveSettingsTab] = useState('sources');
  const [activeSourceId, setActiveSourceId] = useState(configuredDatabases[0]?.id || '');
  const hasLocalToken = Boolean(notionConfig.token?.trim());
  const hasToken = hasLocalToken || notionConnection.connected;
  const activeSource = configuredDatabases.find((item) => item.id === activeSourceId) || configuredDatabases[0];
  const connectedSources = configuredDatabases.filter((item) => item.databaseId || item.pageUrl).length;
  const successfulRuns = Object.values(sourceRuns).filter((item) => item.status === 'ready').length;
  const configuredAiSources = configuredDatabases.filter((item) => item.databaseId || item.pageUrl);
  const aiReadySources = configuredAiSources.filter((item) => sourceRuns[item.id]?.status === 'ready');
  const aiErrorSources = configuredAiSources.filter((item) => sourceRuns[item.id]?.status === 'error');
  const activeRun = activeSource ? sourceRuns[activeSource.id] : null;
  const activeHasSource = activeSource
    ? activeSource.sourceType === 'folder'
      ? Boolean(activeSource.pageUrl)
      : Boolean(activeSource.databaseId || activeSource.pageUrl)
    : false;
  const tokenStatusLabel = notionConnection.connected
    ? 'Cloudflare Token 已設定'
    : hasLocalToken
      ? '本機 Token 已填'
      : notionConnection.status === 'checking'
        ? '檢查連線中'
        : '尚未設定 Token';

  useEffect(() => {
    if (!configuredDatabases.length) return;
    if (!configuredDatabases.some((item) => item.id === activeSourceId)) {
      setActiveSourceId(configuredDatabases[0].id);
    }
  }, [activeSourceId, configuredDatabases]);

  useEffect(() => {
    let isMounted = true;

    async function checkNotionConnection() {
      try {
        const response = await fetch('/api/notion/summary');
        const data = await response.json();
        if (!isMounted) return;
        setNotionConnection({
          status: 'ready',
          connected: Boolean(data.connected)
        });
      } catch {
        if (!isMounted) return;
        setNotionConnection({ status: 'error', connected: false });
      }
    }

    checkNotionConnection();
    return () => {
      isMounted = false;
    };
  }, []);

  function updateConfig(field, value) {
    setNotionConfig((current) => ({ ...current, [field]: value }));
  }

  function updateAppearance(field, value) {
    setAppearance((current) => ({ ...defaultAppearance, ...current, [field]: value }));
  }

  function updateDatabaseConfig(databaseId, field, value) {
    setNotionConfig((current) => ({
      ...current,
      databases: {
        ...defaultNotionDatabaseConfig,
        ...normalizeNotionDatabaseConfigs(current),
        [databaseId]: {
          ...defaultNotionDatabaseConfig[databaseId],
          ...(normalizeNotionDatabaseConfigs(current)[databaseId] || {}),
          [field]: value
        }
      }
    }));
  }

  function addCustomDatabase(sourceType = 'database') {
    const id = `custom-${Date.now()}`;
    const customCount = configuredDatabases.filter((item) => !item.locked).length + 1;
    const label = sourceType === 'folder' ? `父頁資料夾 ${customCount}` : `Notion Database ${customCount}`;

    setNotionConfig((current) => ({
      ...current,
      databases: {
        ...defaultNotionDatabaseConfig,
        ...normalizeNotionDatabaseConfigs(current),
        [id]: {
          id,
          label,
          sourceType,
          databaseId: '',
          pageUrl: '',
          purpose: sourceType === 'folder' ? '讀取父頁底下的子頁，例如客戶分析週報。' : '讀取 Notion database 裡的頁面。',
          sortMode: sourceType === 'folder' ? 'title-date-desc' : 'updated',
          analysisLimit: 3,
          locked: false
        }
      }
    }));
    setActiveSettingsTab('sources');
    setActiveSourceId(id);
  }

  function deleteCustomDatabase(databaseId) {
    const target = databaseConfig[databaseId];
    if (!target || target.locked) return;

    setNotionConfig((current) => {
      const nextDatabases = {
        ...defaultNotionDatabaseConfig,
        ...normalizeNotionDatabaseConfigs(current)
      };
      delete nextDatabases[databaseId];
      return { ...current, databases: nextDatabases };
    });
  }

  async function readNotionSource(config) {
    const hasSource = config.sourceType === 'folder' ? Boolean(config.pageUrl) : Boolean(config.databaseId || config.pageUrl);
    if (!hasToken || !hasSource) {
      setSourceRuns((current) => ({
        ...current,
        [config.id]: {
          status: 'error',
          message: !hasToken ? '請先填 Notion API Token。' : '請先貼上 Notion 來源連結。'
        }
      }));
      return;
    }

    setSourceRuns((current) => ({
      ...current,
      [config.id]: { status: 'loading', message: '正在讀取 Notion...' }
    }));

    try {
      const response = await fetch('/api/notion/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: notionConfig.token, source: config })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'Notion 讀取失敗。');

      setSourceRuns((current) => ({
        ...current,
        [config.id]: {
          status: 'ready',
          message: `已讀取 ${data.count} 個頁面。`,
          summaries: data.summaries || []
        }
      }));
      setActiveSettingsTab('results');
    } catch (error) {
      setSourceRuns((current) => ({
        ...current,
        [config.id]: {
          status: 'error',
          message: error.message || 'Notion 讀取失敗。'
        }
      }));
    }
  }

  if (!activeSource) return null;

  return (
    <section className="panel notionWorkspace settingsHub">
      <div className="settingsHero">
        <div>
          <h2>系統設定</h2>
          <p>把來源、AI、遠端電腦、密鑰與部署分開管理。日常只看狀態，需要調整時再進入對應層級。</p>
        </div>
        <div className="settingsHeroStats">
          <span>{tokenStatusLabel}</span>
          <strong>{connectedSources}/{configuredDatabases.length}</strong>
          <small>已設定來源</small>
        </div>
      </div>

      <div className="settingsTabs settingsTabsWide" role="tablist" aria-label="系統設定">
        {[
          ['sources', '資料來源', `${connectedSources}/${configuredDatabases.length} 已設定`],
          ['appearance', '外觀', appearanceOptions.textScale.find((item) => item.id === (appearance.textScale || defaultAppearance.textScale))?.label || '舒適'],
          ['ai', 'AI 彙整', notionConfig.aiSummaryPageUrl ? '已設定摘要頁' : '設定摘要頁'],
          ['device', '遠端電腦', '狀態與電源'],
          ['security', '安全性', tokenStatusLabel],
          ['deploy', '部署', 'GitHub / Cloudflare']
        ].map(([id, label, meta]) => (
          <button type="button" className={activeSettingsTab === id ? 'activeSettingsTab' : ''} key={id} onClick={() => setActiveSettingsTab(id)}>
            <strong>{label}</strong>
            <span>{meta}</span>
          </button>
        ))}
      </div>

      {activeSettingsTab === 'sources' && (
        <div className="settingsLayerGrid">
          <aside className="settingsLayerAside">
            <strong>來源總表</strong>
            <span>Notion 來源是知識摘要的輸入；ERP 看板由 Worker JSON API 讀取。</span>
            <div className="layerMetric"><b>{connectedSources}</b><small>已設定 Notion 來源</small></div>
            <div className="layerMetric"><b>1</b><small>ERP JSON endpoint</small></div>
          </aside>
          <div className="sourceManager">
            <aside className="sourceList">
              <div className="databaseHeaderActions">
                <button className="secondaryAction" onClick={() => addCustomDatabase('database')}><Plus size={17} /><span>新增 Database</span></button>
                <button className="secondaryAction" onClick={() => addCustomDatabase('folder')}><Plus size={17} /><span>新增父頁</span></button>
              </div>
              <button type="button" className="sourceListItem erpSourceItem">
                <BarChart3 size={17} />
                <span><strong>LEMATEC ERP 看板</strong><small>Worker JSON · 已連接</small></span>
              </button>
              {configuredDatabases.map((config) => {
                const preset = notionDatabases.find((item) => item.id === config.id);
                const Icon = preset?.icon || BriefcaseBusiness;
                const isConnected = Boolean(config.databaseId || config.pageUrl);
                return (
                  <button type="button" className={`sourceListItem ${activeSource.id === config.id ? 'activeSource' : ''}`} key={config.id} onClick={() => setActiveSourceId(config.id)}>
                    <Icon size={17} />
                    <span><strong>{config.label}</strong><small>{config.sourceType === 'folder' ? '父頁資料夾' : 'Database'} · {isConnected ? '已貼連結' : '待設定'}</small></span>
                  </button>
                );
              })}
            </aside>

            <article className="sourceEditor">
              <div className="sourceEditorHeader">
                <div><strong>{activeSource.label}</strong><span>{activeSource.sourceType === 'folder' ? '讀取父頁底下的子頁' : '讀取 Notion database 裡的頁面'}</span></div>
                <button className="primaryAction" onClick={() => readNotionSource(activeSource)} disabled={!hasToken || !activeHasSource || activeRun?.status === 'loading'}>
                  <RotateCcw size={16} />{activeRun?.status === 'loading' ? '讀取中' : '讀取資料'}
                </button>
              </div>
              <div className="databaseSettings singleSource">
                <label><span>來源名稱</span><input value={activeSource.label} onChange={(event) => updateDatabaseConfig(activeSource.id, 'label', event.target.value)} placeholder="例如：客戶分析週報" /></label>
                <label><span>用途備註</span><input value={activeSource.purpose} onChange={(event) => updateDatabaseConfig(activeSource.id, 'purpose', event.target.value)} placeholder="例如：分析每週客戶互動與下一步" /></label>
                <label><span>來源類型</span><select value={activeSource.sourceType || 'database'} onChange={(event) => updateDatabaseConfig(activeSource.id, 'sourceType', event.target.value)}><option value="database">Notion Database</option><option value="folder">父頁資料夾</option></select></label>
                {(activeSource.sourceType || 'database') === 'database' ? (
                  <label><span>Database 連結</span><input value={activeSource.databaseId} onChange={(event) => updateDatabaseConfig(activeSource.id, 'databaseId', event.target.value)} placeholder="貼上 Notion database 連結" /></label>
                ) : (
                  <label><span>父頁連結</span><input value={activeSource.pageUrl} onChange={(event) => updateDatabaseConfig(activeSource.id, 'pageUrl', event.target.value)} placeholder="https://app.notion.com/p/356ff6f424bb81d4a9a8c4a997fcffc6" /></label>
                )}
                <div className="settingPair">
                  <label><span>排序方式</span><select value={activeSource.sortMode || 'updated'} onChange={(event) => updateDatabaseConfig(activeSource.id, 'sortMode', event.target.value)}>{notionSortOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
                  <label><span>分析上限</span><select value={String(activeSource.analysisLimit || 3)} onChange={(event) => updateDatabaseConfig(activeSource.id, 'analysisLimit', Number(event.target.value))}><option value="1">1 個頁面</option><option value="2">2 個頁面</option><option value="3">3 個頁面</option></select></label>
                </div>
              </div>
              <div className={`sourceRunState ${activeRun?.status || ''}`}>
                <div><span>{activeRun?.status === 'ready' ? '讀取成功' : activeRun?.status === 'error' ? '讀取失敗' : '尚未讀取'}</span><p>{activeRun?.message || (activeHasSource ? '設定完成後按「讀取資料」確認 Notion 內容。' : '請先貼上 Notion 來源連結。')}</p></div>
              </div>
              {!activeSource.locked && <button className="dangerButton" onClick={() => deleteCustomDatabase(activeSource.id)}><Trash2 size={15} />刪除這個來源</button>}
            </article>
          </div>
        </div>
      )}

      {activeSettingsTab === 'appearance' && (
        <div className="settingsPanel">
          <div className="appearancePreview">
            <div>
              <span>即時預覽</span>
              <strong>今天先看重點，細節再進分頁</strong>
              <p>這裡會跟著字體、字級、版面密度和面板質感一起變化。預設已調大，手機類 App 會更好讀。</p>
            </div>
            <div className="appearancePreviewCard">
              <small>Notion</small>
              <b>即時重點整理</b>
              <em>來源更新後自動提醒</em>
            </div>
          </div>
          <AppearanceOptionGroup title="字體風格" field="fontFamily" value={appearance.fontFamily || defaultAppearance.fontFamily} options={appearanceOptions.fontFamily} onChange={updateAppearance} />
          <AppearanceOptionGroup title="字級大小" field="textScale" value={appearance.textScale || defaultAppearance.textScale} options={appearanceOptions.textScale} onChange={updateAppearance} />
          <AppearanceOptionGroup title="版面密度" field="layoutDensity" value={appearance.layoutDensity || defaultAppearance.layoutDensity} options={appearanceOptions.layoutDensity} onChange={updateAppearance} />
          <AppearanceOptionGroup title="面板質感" field="panelStyle" value={appearance.panelStyle || defaultAppearance.panelStyle} options={appearanceOptions.panelStyle} onChange={updateAppearance} />
          <div className="settingsActions">
            <button className="secondaryAction" type="button" onClick={() => setAppearance(defaultAppearance)}><RotateCcw size={17} /><span>恢復預設外觀</span></button>
          </div>
        </div>
      )}

      {activeSettingsTab === 'ai' && (
        <div className="settingsPanel">
          <div className="aiSettingsHero">
            <div>
              <span>摘要設定</span>
              <strong>首頁讀這一頁當總覽摘要</strong>
              <p>資料來源負責讀原始 Notion；摘要頁負責放整理後的重點。首頁會優先顯示摘要頁，來源有新資料時再提醒你更新摘要。</p>
            </div>
            <a href={notionConfig.aiSummaryPageUrl || undefined} target="_blank" rel="noreferrer" className={!notionConfig.aiSummaryPageUrl ? 'disabledLink' : ''}>
              <ExternalLink size={16} />
              開啟摘要頁
            </a>
          </div>

          <div className="aiSummaryControl">
            <label>
              <span>摘要頁連結</span>
              <input
                value={notionConfig.aiSummaryPageUrl || ''}
                onChange={(event) => updateConfig('aiSummaryPageUrl', event.target.value)}
                placeholder="貼上 Vic Workbench AI 摘要頁連結"
              />
            </label>
            <div className="aiSummaryStats">
              <div><strong>{configuredAiSources.length}</strong><span>已設定來源</span></div>
              <div><strong>{aiReadySources.length}</strong><span>已讀取成功</span></div>
              <div><strong>{aiErrorSources.length}</strong><span>需要檢查</span></div>
            </div>
          </div>

          <div className="summaryFlow">
            <article><span>1</span><strong>資料來源</strong><p>在「資料來源」貼 Notion database 或父頁連結，確認可讀取。</p></article>
            <article><span>2</span><strong>摘要頁</strong><p>在 Notion 用 AI 或手動把重點整理到 Vic Workbench AI 摘要頁。</p></article>
            <article><span>3</span><strong>首頁總覽</strong><p>首頁讀摘要頁；若來源更新比摘要頁新，就提醒你摘要可能需要重整。</p></article>
          </div>

          <div className="sourceInclusionPanel">
            <div className="settingsSectionHeader">
              <div>
                <strong>納入摘要的來源</strong>
                <small>這裡只顯示狀態；要修改連結請回「資料來源」。</small>
              </div>
              <button className="secondaryAction" type="button" onClick={() => setActiveSettingsTab('sources')}><Database size={16} /><span>管理來源</span></button>
            </div>
            <div className="summarySourceList">
              {configuredAiSources.map((config) => {
              const runState = sourceRuns[config.id];
                const stateLabel = runState?.status === 'ready' ? '已讀取' : runState?.status === 'error' ? '需檢查' : '待讀取';
              return (
                  <article className={`summarySourceItem ${runState?.status || 'idle'}`} key={config.id}>
                    <div>
                      <strong>{config.label}</strong>
                      <span>{config.sourceType === 'folder' ? '父頁資料夾' : 'Database'} · {config.analysisLimit || 1} 頁</span>
                    </div>
                    <em>{stateLabel}</em>
                    <p>{runState?.message || '來源已設定，等待讀取確認。'}</p>
                </article>
              );
            })}
              {!configuredAiSources.length && <div className="emptyState">尚未設定資料來源。</div>}
            </div>
          </div>
        </div>
      )}

      {activeSettingsTab === 'device' && (
        <div className="settingsPanel">
          <div className="settingsInfoGrid">
            <article><Wifi size={18} /><strong>代理程式</strong><p>本機 `remote-shutdown-agent.js` 會每 10 秒回報電腦狀態，並接收記憶體清理、睡眠、關機、重開機指令。</p></article>
            <article><Thermometer size={18} /><strong>溫度提醒</strong><p>80°C 以上顯示偏高，90°C 以上會進入「需要先看」警示。</p></article>
            <article><Moon size={18} /><strong>睡眠喚醒</strong><p>睡眠可設定定時喚醒；關機後無法由同一台電腦自我喚醒。</p></article>
          </div>
          <div className="securityNote">目前已建立登入自動啟動腳本，讓代理程式在 Windows 登入後自動啟動。</div>
        </div>
      )}

      {activeSettingsTab === 'security' && (
        <div className="settingsPanel">
          <div className="notionSetup focused">
            <label><span>Notion 工作區連結</span><input value={notionConfig.workspaceUrl} onChange={(event) => updateConfig('workspaceUrl', event.target.value)} placeholder="https://www.notion.so/..." /></label>
            <label><span>Notion API Token</span><input value={notionConfig.token} onChange={(event) => updateConfig('token', event.target.value)} placeholder="只供本機測試，正式用 Cloudflare Secret" type="password" /></label>
            <label><span>新聞關鍵字</span><input value={notionConfig.newsKeywords} onChange={(event) => updateConfig('newsKeywords', event.target.value)} placeholder="AI, 工具, 市場趨勢" /></label>
          </div>
          <div className="notionSetup focused">
            <label><span>Workbench 資料中心</span><input value={notionConfig.workbenchHubPageUrl || ''} onChange={(event) => updateConfig('workbenchHubPageUrl', event.target.value)} placeholder="Notion 資料中心連結" /></label>
            <label><span>資料庫管理頁</span><input value={notionConfig.workbenchDatabasePageUrl || ''} onChange={(event) => updateConfig('workbenchDatabasePageUrl', event.target.value)} placeholder="Workbench 底下的資料庫管理頁" /></label>
            <label><span>快速紀錄資料庫</span><input value={notionConfig.captureDatabaseUrl || ''} onChange={(event) => updateConfig('captureDatabaseUrl', event.target.value)} placeholder="快速紀錄 / 知識收件匣連結" /></label>
            <label><span>會議筆記資料庫</span><input value={notionConfig.meetingDatabaseUrl || ''} onChange={(event) => updateConfig('meetingDatabaseUrl', event.target.value)} placeholder="會議筆記資料庫連結" /></label>
            <label><span>快速紀錄 Database ID</span><input value={notionConfig.captureDatabaseId || ''} onChange={(event) => updateConfig('captureDatabaseId', event.target.value)} placeholder="Notion database id" /></label>
            <label><span>會議筆記 Database ID</span><input value={notionConfig.meetingDatabaseId || ''} onChange={(event) => updateConfig('meetingDatabaseId', event.target.value)} placeholder="Notion database id" /></label>
            <div className="notionLinkActions">
              {notionConfig.workbenchHubPageUrl && <a href={notionConfig.workbenchHubPageUrl} target="_blank" rel="noreferrer">開啟資料中心</a>}
              {notionConfig.workbenchDatabasePageUrl && <a href={notionConfig.workbenchDatabasePageUrl} target="_blank" rel="noreferrer">開啟資料庫管理</a>}
              {notionConfig.captureDatabaseUrl && <a href={notionConfig.captureDatabaseUrl} target="_blank" rel="noreferrer">開啟收件匣</a>}
              {notionConfig.meetingDatabaseUrl && <a href={notionConfig.meetingDatabaseUrl} target="_blank" rel="noreferrer">開啟會議筆記</a>}
            </div>
          </div>
          <div className="settingsInfoGrid">
            <article><ShieldAlert size={18} /><strong>正式密鑰</strong><p>Notion、遠端控制與代理 token 都應放在 Cloudflare Secrets 或本機 `.env`，不放到 GitHub。</p></article>
            <article><Command size={18} /><strong>遠端控制確認</strong><p>關機、重開機、睡眠都需要控制密鑰與繁中確認字，避免誤觸。</p></article>
            <article><CheckCircle2 size={18} /><strong>目前狀態</strong><p>{tokenStatusLabel}。ERP Worker 已使用 Worker Secret 讀取 Notion。</p></article>
          </div>
        </div>
      )}

      {activeSettingsTab === 'deploy' && (
        <div className="settingsPanel">
          <PwaInstallCard pwaInstall={pwaInstall} />
          <div className="connectionGuide compact">
            <div><span>1</span><strong>GitHub</strong><p>介面修改推到 `vic-workbench` main 後，自動觸發 Cloudflare Pages。</p></div>
            <div><span>2</span><strong>Cloudflare Pages</strong><p>正式站使用 `vic-workbench.pages.dev`，Pages Functions 處理 Notion 與遠端電腦 API。</p></div>
            <div><span>3</span><strong>Worker</strong><p>ERP 看板 JSON 由 `green-wave-c22f` Worker 提供，供個人看板讀取。</p></div>
          </div>
          <div className="settingsActions"><button className="secondaryAction" onClick={resetDemoData}><RotateCcw size={17} /><span>重置本機資料</span></button></div>
        </div>
      )}
    </section>
  );
}

function AppearanceOptionGroup({ title, field, value, options, onChange }) {
  return (
    <section className="appearanceOptionGroup">
      <div className="settingsSectionHeader">
        <div>
          <strong>{title}</strong>
          <small>點選後立即套用</small>
        </div>
      </div>
      <div className="appearanceChoiceGrid">
        {options.map((option) => (
          <button
            type="button"
            className={value === option.id ? 'activeAppearanceChoice' : ''}
            key={option.id}
            onClick={() => onChange(field, option.id)}
          >
            <strong>{option.label}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function RemotePowerPanel() {
  const deviceId = 'vic-windows-pc';
  const [status, setStatus] = useState({ status: 'loading', data: null, message: '' });
  const [secret, setSecret] = useState(() => localStorage.getItem('vic-workbench:remote-secret') || '');
  const [confirmText, setConfirmText] = useState('');
  const [graceSeconds, setGraceSeconds] = useState(30);
  const [wakeAfterMinutes, setWakeAfterMinutes] = useState(30);
  const [commandState, setCommandState] = useState({ status: 'idle', message: '' });

  const state = status.data?.state;
  const telemetry = state?.telemetry || {};
  const temperature = telemetry.temperature || {};
  const lastSeen = state?.lastSeen ? new Date(state.lastSeen) : null;
  const isOnline = Boolean(status.data?.online);
  const memoryPercent = telemetry.totalMemoryBytes
    ? Math.round(((telemetry.totalMemoryBytes - telemetry.freeMemoryBytes) / telemetry.totalMemoryBytes) * 100)
    : null;
  const freeMemoryText = telemetry.freeMemoryBytes ? formatBytes(telemetry.freeMemoryBytes) : '';
  const totalMemoryText = telemetry.totalMemoryBytes ? formatBytes(telemetry.totalMemoryBytes) : '';
  const temperatureLevel = temperature.available && temperature.celsius >= 90
    ? 'critical'
    : temperature.available && temperature.celsius >= 80
      ? 'warning'
      : 'normal';
  const temperatureText = temperature.available
    ? `${temperature.celsius}°C`
    : temperature.message || '尚未取得溫度';

  useEffect(() => {
    refreshStatus();
    const timer = window.setInterval(refreshStatus, 10000);
    return () => window.clearInterval(timer);
  }, []);

  function updateSecret(value) {
    setSecret(value);
    localStorage.setItem('vic-workbench:remote-secret', value);
  }

  async function refreshStatus() {
    try {
      const response = await fetch(`/api/device/status?deviceId=${deviceId}`);
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || '讀取電腦狀態失敗。');
      setStatus({ status: 'ready', data, message: '' });
    } catch (error) {
      const message = error.message?.includes('Unexpected token')
        ? '遠端電腦 API 尚未連線或代理程式未回報，請確認本機代理程式正在執行。'
        : error.message || '讀取電腦狀態失敗。';
      setStatus({ status: 'error', data: null, message });
    }
  }

  async function sendCommand(action, confirm) {
    setCommandState({ status: 'loading', message: '正在送出指令...' });
    try {
      const response = await fetch('/api/device/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret,
          deviceId,
          action,
          confirm,
          graceSeconds,
          wakeAfterMinutes: action === 'sleep' ? wakeAfterMinutes : 0
        })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || '指令送出失敗。');
      setCommandState({ status: 'ready', message: action === 'cancel' ? '已送出取消關機。' : '已送出指令，等待本機代理程式執行。' });
      setConfirmText('');
      refreshStatus();
    } catch (error) {
      setCommandState({ status: 'error', message: error.message || '指令送出失敗。' });
    }
  }

  async function cleanMemoryNow() {
    await sendCommand('memory-clean', '清理');
  }

  const commandButtons = [
    { action: 'sleep', confirm: '睡眠', label: '睡眠', icon: Moon },
    { action: 'shutdown', confirm: '關機', label: '關機', icon: Power },
    { action: 'restart', confirm: '重開機', label: '重開機', icon: RotateCcw }
  ];

  return (
    <section className="panel remotePowerPanel">
      <div className="remotePowerHeader">
        <div>
          <span className={`deviceBadge ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? <Wifi size={15} /> : <WifiOff size={15} />}
            {isOnline ? '電腦在線' : '代理未連線'}
          </span>
          <h2>電腦電源與溫度</h2>
          <p>透過本機代理程式回報狀態，溫度過高時可以先睡眠或關機。</p>
        </div>
        <button className="secondaryAction" type="button" onClick={refreshStatus}>
          <RotateCcw size={17} /><span>重新整理</span>
        </button>
      </div>

      <div className="deviceStatusGrid">
        <article className={`deviceMetric temperature ${temperatureLevel}`}>
          <Thermometer size={20} />
          <span>溫度</span>
          <strong>{temperatureText}</strong>
          <small>{temperature.available ? (temperatureLevel === 'critical' ? '危險，建議立即處理' : temperatureLevel === 'warning' ? '偏高，建議觀察或睡眠' : '正常') : '部分電腦不提供 ACPI 溫度'}</small>
        </article>
        <article className="deviceMetric">
          <Clock3 size={20} />
          <span>最後回報</span>
          <strong>{lastSeen ? formatRelativeTime(lastSeen) : '尚未回報'}</strong>
          <small>{state?.hostname || deviceId}</small>
        </article>
        <article className="deviceMetric">
          <ShieldAlert size={20} />
          <span>記憶體</span>
          <strong>{memoryPercent !== null ? `${memoryPercent}%` : '等待中'}</strong>
          <small>{memoryPercent !== null ? `可用 ${freeMemoryText} / 總計 ${totalMemoryText}` : '等待代理程式回報'}</small>
        </article>
      </div>

      <div className="remoteNotice">
        目前模式：{state?.dryRun ? '測試模式，指令只會回報不會執行。' : '正式執行。'} 記憶體清理只清暫存與觸發系統整理，不會關閉程式。
      </div>

      <button
        type="button"
        className="memoryCleanButton"
        onClick={cleanMemoryNow}
        disabled={!secret || commandState.status === 'loading'}
      >
        <Trash2 size={18} />
        <span>立即清理記憶體</span>
        <small>{memoryPercent !== null ? `目前使用 ${memoryPercent}%` : '等待狀態回報'}</small>
      </button>

      {status.status === 'error' && <div className="remoteNotice error">{status.message}</div>}
      {temperatureLevel !== 'normal' && temperature.available && (
        <div className={`remoteNotice ${temperatureLevel}`}>
          {temperatureLevel === 'critical' ? '溫度已超過 90°C，建議立刻睡眠或關機。' : '溫度已超過 80°C，建議先保存工作並觀察。'}
        </div>
      )}
      {status.data?.pendingCommand && (
        <div className="remoteNotice warning">目前有待執行指令：{status.data.pendingCommand.action}</div>
      )}

      <div className="remoteCommandBox">
        <label><span>控制密鑰</span><input type="password" value={secret} onChange={(event) => updateSecret(event.target.value)} placeholder="貼上 .remote-control.env 裡的密鑰" /></label>
        <label><span>倒數秒數</span><input type="number" min="10" max="300" value={graceSeconds} onChange={(event) => setGraceSeconds(event.target.value)} /></label>
        <label><span>睡眠後喚醒</span><select value={String(wakeAfterMinutes)} onChange={(event) => setWakeAfterMinutes(Number(event.target.value))}><option value="0">不自動喚醒</option><option value="15">15 分鐘</option><option value="30">30 分鐘</option><option value="60">60 分鐘</option><option value="120">2 小時</option></select></label>
        <label><span>確認字</span><input value={confirmText} onChange={(event) => setConfirmText(event.target.value.trim())} placeholder="睡眠 / 關機 / 重開機 / 取消" /></label>
      </div>

      <div className="remoteActions">
        {commandButtons.map(({ action, confirm, label, icon: Icon }) => (
          <button
            type="button"
            className="remoteActionButton"
            key={action}
            onClick={() => sendCommand(action, confirm)}
            disabled={!secret || confirmText !== confirm || commandState.status === 'loading'}
          >
            <Icon size={18} /><span>{label}</span><small>{confirm}</small>
          </button>
        ))}
        <button
          type="button"
          className="remoteActionButton cancel"
          onClick={() => sendCommand('cancel', '取消')}
          disabled={!secret || confirmText !== '取消' || commandState.status === 'loading'}
        >
          <RotateCcw size={18} /><span>取消關機</span><small>取消</small>
        </button>
      </div>

      {commandState.message && <div className={`remoteCommandState ${commandState.status}`}>{commandState.message}</div>}
    </section>
  );
}

function formatRelativeTime(date) {
  const diffSeconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 5) return '剛剛';
  if (diffSeconds < 60) return `${diffSeconds} 秒前`;
  if (diffSeconds < 3600) return `${Math.round(diffSeconds / 60)} 分鐘前`;
  return new Intl.DateTimeFormat('zh-TW', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '--';
  const gb = bytes / 1024 / 1024 / 1024;
  if (gb >= 1) return `${Math.round(gb * 10) / 10} GB`;
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

function PwaInstallCard({ pwaInstall }) {
  const status = pwaInstall.isStandalone ? '已用 App 模式開啟' : '可加入主畫面';

  return (
    <div className="pwaInstallCard">
      <div>
        <span>{status}</span>
        <strong>Vic Workbench App</strong>
        <p>安裝後會像 App 一樣從主畫面開啟，支援離線開啟基本介面，新聞與 Notion 同步仍需要網路。</p>
      </div>
      <button className="primaryAction" onClick={pwaInstall.installApp} disabled={!pwaInstall.canInstall || pwaInstall.isStandalone}>
        <Download size={17} />
        {pwaInstall.isStandalone ? '已安裝' : pwaInstall.canInstall ? '安裝 App' : '用瀏覽器加入主畫面'}
      </button>
      <div className="pwaHint">
        iPhone：Safari 開啟網站 → 分享 → 加入主畫面。Android/Chrome：可使用網址列或本按鈕安裝。
      </div>
    </div>
  );
}

function TaskBoard({ tasks, toggleTask, moveTask, deleteTask }) {
  return (
    <section className="panel">
      <PanelTitle title="任務看板" count={tasks.length} action="本機保存" />
      <div className="kanban">
        {stageOrder.map((stage) => {
          const items = tasks.filter((task) => task.stage === stage);
          return (
            <div className="taskColumn" key={stage}>
              <h3><span className={`dot ${stage}`} />{stageLabels[stage]}<small>{items.length}</small></h3>
              <div className="taskList">
                {items.map((task) => (
                  <article className={`taskCard ${task.done ? 'done' : ''}`} key={task.id}>
                    <label><input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} /><span>{task.title}</span></label>
                    <div className="taskMeta"><em>{task.area}</em><small><Clock3 size={13} />{task.estimate}</small>{task.important && <small className="important"><Star size={13} />重要</small>}</div>
                    <div className="taskActions">
                      {stageOrder.filter((target) => target !== stage).map((target) => <button key={target} onClick={() => moveTask(task.id, target)}>{stageLabels[target]}</button>)}
                      <button aria-label="刪除任務" onClick={() => deleteTask(task.id)}><Trash2 size={14} /></button>
                    </div>
                  </article>
                ))}
                {items.length === 0 && <div className="emptyState">暫時沒有項目</div>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ProjectPanel({ projects, setProjects }) {
  function addProject() {
    const name = window.prompt('輸入專案名稱');
    if (!name?.trim()) return;

    setProjects((current) => [
      {
        id: Date.now(),
        name: name.trim(),
        status: '新建立',
        progress: 0,
        due: '未設定',
        color: 'blue'
      },
      ...current
    ]);
  }

  function bumpProgress(id) {
    setProjects((current) => current.map((project) => (project.id === id ? { ...project, progress: Math.min(100, project.progress + 8) } : project)));
  }

  return (
    <section className="panel projectsPanel">
      <div className="panelTitle">
        <h2>專案進度 <small>{projects.length}</small></h2>
        <button onClick={addProject}><Plus size={15} />新增專案</button>
        <button className="plainIcon" aria-label="專案進度 選單"><MoreVertical size={17} /></button>
      </div>
      <div className="projectRows">
        {projects.length > 0 ? (
          projects.map((project) => (
            <article className="projectRow" key={project.id}>
              <span className={`projectDot ${project.color}`} /><strong>{project.name}</strong><em>{project.status}</em>
              <div className="progress"><b style={{ width: `${project.progress}%` }} /></div>
              <span>{project.progress}%</span><small>{project.due}</small>
              <button className="plainIcon" aria-label="增加進度" onClick={() => bumpProgress(project.id)}><ChevronRight size={17} /></button>
            </article>
          ))
        ) : (
          <div className="emptyState">目前沒有專案。按「新增專案」建立第一筆。</div>
        )}
      </div>
    </section>
  );
}

function FocusPanel({ stats }) {
  return (
    <section className="panel focusPanel">
      <div className="railTitle"><h2>今日狀態</h2><span>Live</span></div>
      <div className="metricGrid">
        <Metric label="未完成" value={stats.open} />
        <Metric label="已完成" value={stats.completed} />
        <Metric label="待同步" value={stats.syncQueue} />
      </div>
      <div className="focusCallout"><CheckCircle2 size={22} /><p><strong>建議先做</strong>首頁只看摘要，細節進資料來源分頁。</p></div>
    </section>
  );
}

function NotionPanel({ notes, syncNote }) {
  const queue = notes.filter((note) => !note.synced).slice(0, 4);
  return (
    <section className="panel notionPanel">
      <div className="railTitle"><h2>Notion 同步佇列</h2><span>{queue.length} 筆</span></div>
      <div className="syncRows">
        {queue.map((note) => (
          <article className="syncRow" key={note.id}>
            <div><strong>{note.title}</strong><small>{typeLabels[note.type]} · 尚未同步</small></div>
            <button aria-label="標記同步" onClick={() => syncNote(note.id)}><Send size={15} /></button>
          </article>
        ))}
        {queue.length === 0 && <div className="emptyState">目前沒有待同步資料</div>}
      </div>
      <button className="wideButton"><ExternalLink size={16} />之後接 Notion API</button>
    </section>
  );
}

function KnowledgePanel({ notes, expanded = false, updateNote, deleteNote, captureSync, refreshCaptureInbox }) {
  const [timeFilter, setTimeFilter] = useState(expanded ? '7d' : 'all');
  const [routeFilter, setRouteFilter] = useState('all');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });
  const [displayLimit, setDisplayLimit] = useState(expanded ? 24 : 5);
  const digest = useMemo(() => buildInboxDigest(notes), [notes]);
  const filteredNotes = useMemo(() => {
    const now = new Date();
    return filterInboxNotes(notes, routeFilter).filter((note) => {
      const noteTime = parseNoteTime(getNoteTimeValue(note));
      if (timeFilter === 'all') return true;
      if (!noteTime) return false;
      if (timeFilter === 'today') return isSameLocalDay(noteTime, now);
      if (timeFilter === '7d') return noteTime >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (timeFilter === 'month') return isSameLocalMonth(noteTime, now);
      if (timeFilter === 'custom') {
        const from = customRange.from ? new Date(`${customRange.from}T00:00:00`) : null;
        const to = customRange.to ? new Date(`${customRange.to}T23:59:59`) : null;
        return (!from || noteTime >= from) && (!to || noteTime <= to);
      }
      return true;
    });
  }, [customRange.from, customRange.to, notes, routeFilter, timeFilter]);
  const visibleNotes = filteredNotes.slice(0, expanded ? displayLimit : Math.min(displayLimit, 5));

  function editNote(note) {
    const nextTitle = window.prompt('編輯知識收件匣內容', note.title);
    if (nextTitle === null) return;
    updateNote?.(note.id, nextTitle);
  }

  function routeNote(note, actionId) {
    const action = inboxActionMap[actionId];
    if (!action) return;
    updateNote?.(note.id, {
      routingType: action.routingType,
      status: action.status,
      topic: note.topic || getInboxTopic(note),
      framework: note.framework || getInboxFramework({ ...note, routingType: action.routingType }),
      nextStep: actionId === 'archived' ? '已封存，首頁不再優先顯示' : getInboxNextStep({ ...note, routingType: action.routingType }),
      routedAt: new Date().toISOString()
    });
  }

  return (
    <section className="panel inboxPanel actionInboxPanel">
      <div className="inboxSyncHeader">
        <div>
          <PanelTitle title="知識收件匣" count={filteredNotes.length} />
          <p className="inboxIntent">不是存很多東西，而是快速判斷每筆資料要轉任務、沉澱知識、放進週報或封存。</p>
        </div>
        <button type="button" onClick={() => refreshCaptureInbox?.()}><RotateCcw size={14} />同步</button>
      </div>
      {captureSync?.message && <div className={`inboxSyncBanner ${captureSync.status}`}>{captureSync.message}</div>}

      <div className="inboxRoutingSummary">
        <button type="button" onClick={() => setRouteFilter('triage')}><span>待整理</span><strong>{digest.counts.triage}</strong></button>
        <button type="button" onClick={() => setRouteFilter('task')}><span>可轉任務</span><strong>{digest.counts.task}</strong></button>
        <button type="button" onClick={() => setRouteFilter('weekly')}><span>週報可讀</span><strong>{digest.counts.weekly}</strong></button>
        <button type="button" onClick={() => setRouteFilter('knowledge')}><span>可沉澱知識</span><strong>{digest.counts.knowledge}</strong></button>
      </div>

      <div className="inboxFilters routeFilters">
        <div className="inboxFilterTabs" role="tablist" aria-label="知識收件匣分流篩選">
          {inboxRoutingFilters.map((item) => (
            <button type="button" className={routeFilter === item.id ? 'activeInboxFilter' : ''} key={item.id} onClick={() => setRouteFilter(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <label>
          <span>顯示</span>
          <select value={displayLimit} onChange={(event) => setDisplayLimit(Number(event.target.value))}>
            {inboxLimitOptions.map((limit) => <option value={limit} key={limit}>{limit} 筆</option>)}
          </select>
        </label>
      </div>
      <div className="inboxFilters timeFilters">
        <div className="inboxFilterTabs" role="tablist" aria-label="知識收件匣時間篩選">
          {inboxTimeFilters.map((item) => (
            <button type="button" className={timeFilter === item.id ? 'activeInboxFilter' : ''} key={item.id} onClick={() => setTimeFilter(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {timeFilter === 'custom' && (
        <div className="inboxCustomRange">
          <label><span>從</span><input type="date" value={customRange.from} onChange={(event) => setCustomRange((current) => ({ ...current, from: event.target.value }))} /></label>
          <label><span>到</span><input type="date" value={customRange.to} onChange={(event) => setCustomRange((current) => ({ ...current, to: event.target.value }))} /></label>
        </div>
      )}
      <div className="inboxResultMeta">顯示 {visibleNotes.length} 筆，符合條件 {filteredNotes.length} 筆，總資料 {notes.length} 筆。</div>
      <div className="inboxCards">
        {visibleNotes.map((note) => {
          const Icon = note.type === 'voice' ? Mic : captureTypes.find((type) => type.id === note.type)?.icon || FileText;
          const route = inferInboxRoute(note);
          return (
            <article className={`inboxDecisionCard route-${route}`} key={note.id}>
              <div className="inboxCardMain">
                <Icon size={17} />
                <div>
                  <strong>{note.title}</strong>
                  <span>主題：{getInboxTopic(note)}</span>
                  <span>關聯框架：{getInboxFramework(note)}</span>
                  <p>下一步：{getInboxNextStep(note)}</p>
                </div>
                <time>{formatKnowledgeTime(getNoteTimeValue(note))}</time>
              </div>
              <div className="inboxDecisionActions">
                <button type="button" onClick={() => routeNote(note, 'task')}>轉任務</button>
                <button type="button" onClick={() => routeNote(note, 'knowledge')}>轉知識</button>
                <button type="button" onClick={() => routeNote(note, 'weekly')}>週報參考</button>
                <button type="button" onClick={() => routeNote(note, 'archived')}>封存</button>
                <button type="button" aria-label="編輯" onClick={() => editNote(note)}><FileText size={14} /></button>
                <button type="button" aria-label="刪除" onClick={() => deleteNote?.(note.id)}><Trash2 size={14} /></button>
              </div>
            </article>
          );
        })}
        {notes.length === 0 && <div className="emptyState">目前沒有快速紀錄。</div>}
        {notes.length > 0 && filteredNotes.length === 0 && <div className="emptyState">這個篩選沒有資料。</div>}
      </div>
    </section>
  );
}

function CalendarWorkspace({ calendarData }) {
  const [status, setStatus] = useState({ status: 'checking', connected: false, message: '正在檢查 Google Calendar 連線' });
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    start: formatDateTimeInput(new Date(Date.now() + 60 * 60 * 1000)),
    end: formatDateTimeInput(new Date(Date.now() + 2 * 60 * 60 * 1000)),
    description: ''
  });

  const todayEvents = events.filter((event) => isSameLocalDay(new Date(event.start), new Date()));
  const upcomingEvents = events.filter((event) => !isSameLocalDay(new Date(event.start), new Date())).slice(0, 8);

  async function loadStatus() {
    try {
      const response = await fetch('/api/calendar/status');
      const data = await response.json();
      setStatus({
        status: response.ok && data.ok ? 'ready' : 'error',
        connected: Boolean(data.connected),
        configured: Boolean(data.configured),
        message: data.message || (data.connected ? 'Google Calendar 已連線' : '尚未連接 Google Calendar')
      });
      if (data.connected) loadEvents();
    } catch (error) {
      setStatus({ status: 'error', connected: false, message: error.message || '無法檢查 Google Calendar 連線' });
    }
  }

  async function loadEvents() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/calendar/events?days=14');
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || '讀取 Google Calendar 失敗');
      setEvents(data.events || []);
    } catch (error) {
      setStatus((current) => ({ ...current, status: 'error', message: error.message || '讀取 Google Calendar 失敗' }));
    } finally {
      setIsLoading(false);
    }
  }

  async function createEvent(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.start || !form.end) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          start: new Date(form.start).toISOString(),
          end: new Date(form.end).toISOString()
        })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || '新增 Google Calendar 行程失敗');
      setForm((current) => ({ ...current, title: '', description: '' }));
      setStatus((current) => ({ ...current, status: 'ready', message: '已新增到 Google Calendar' }));
      await loadEvents();
    } catch (error) {
      setStatus((current) => ({ ...current, status: 'error', message: error.message || '新增 Google Calendar 行程失敗' }));
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteEvent(eventId) {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/calendar/events?id=${encodeURIComponent(eventId)}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({ ok: response.ok }));
      if (!response.ok || !data.ok) throw new Error(data.message || '刪除 Google Calendar 行程失敗');
      setEvents((current) => current.filter((event) => event.id !== eventId));
      setStatus((current) => ({ ...current, status: 'ready', message: '已刪除行程' }));
    } catch (error) {
      setStatus((current) => ({ ...current, status: 'error', message: error.message || '刪除 Google Calendar 行程失敗' }));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <section className="panel calendarWorkspace">
      <div className="calendarHero">
        <div>
          <span>Google Calendar</span>
          <h2>{status.connected ? '已連接行事曆' : '連接你的 Google 行事曆'}</h2>
          <p>{status.message}</p>
        </div>
        <div className="calendarActions">
          <button className="secondaryAction" type="button" onClick={loadEvents} disabled={!status.connected || isLoading}><RotateCcw size={16} /><span>重新整理</span></button>
          <button className="secondaryAction" type="button" onClick={() => calendarData?.requestNotifications?.()} disabled={calendarData?.notificationPermission === 'granted' || calendarData?.notificationPermission === 'unsupported'}><Bell size={16} /><span>{calendarData?.notificationPermission === 'granted' ? '通知已開' : '開啟通知'}</span></button>
          {!status.connected && <a className="primaryAction" href="/api/calendar/auth"><CalendarDays size={17} />連接 Google</a>}
        </div>
      </div>

      {status.connected ? (
        <>
          <div className="calendarOverview">
            <article><span>今日行程</span><strong>{todayEvents.length}</strong><small>今天需要留意</small></article>
            <article><span>14 天內</span><strong>{events.length}</strong><small>已同步行程</small></article>
            <article><span>狀態</span><strong>{isLoading ? '同步中' : '正常'}</strong><small>Google API</small></article>
          </div>

          <form className="calendarCreateForm" onSubmit={createEvent}>
            <label><span>行程名稱</span><input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="例如：客戶週報會議" /></label>
            <label><span>開始時間</span><input type="datetime-local" value={form.start} onChange={(event) => setForm((current) => ({ ...current, start: event.target.value }))} /></label>
            <label><span>結束時間</span><input type="datetime-local" value={form.end} onChange={(event) => setForm((current) => ({ ...current, end: event.target.value }))} /></label>
            <label className="wideField"><span>備註</span><input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="可放 Notion 會議筆記連結或提醒內容" /></label>
            <button className="primaryAction" type="submit" disabled={isLoading}><Plus size={17} />新增行程</button>
          </form>

          <div className="calendarEventList">
            <div className="settingsSectionHeader">
              <div><strong>近期行程</strong><small>依 Google Calendar 時間排序</small></div>
            </div>
            {[...todayEvents, ...upcomingEvents].map((event) => (
              <article className="calendarEventRow" key={event.id}>
                <time>{formatCalendarRange(event.start, event.end)}</time>
                <div><strong>{event.title}</strong><span>{event.description || event.location || '無備註'}</span></div>
                {event.htmlLink && <a href={event.htmlLink} target="_blank" rel="noreferrer"><ExternalLink size={15} /></a>}
                <button type="button" aria-label="刪除行程" onClick={() => deleteEvent(event.id)}><Trash2 size={14} /></button>
              </article>
            ))}
            {!events.length && <div className="emptyState">目前 14 天內沒有讀到行程。</div>}
          </div>
        </>
      ) : (
        <div className="calendarSetupGuide">
          <article><strong>1. 建立 Google OAuth 憑證</strong><p>Google Cloud Console 建立 Web application OAuth Client。</p></article>
          <article><strong>2. 設定 Cloudflare Secrets</strong><p>需要 `GOOGLE_CLIENT_ID` 與 `GOOGLE_CLIENT_SECRET`。</p></article>
          <article><strong>3. 回到這裡授權</strong><p>按「連接 Google」後，Workbench 才能讀寫你的行事曆。</p></article>
        </div>
      )}
    </section>
  );
}

function CalendarMiniAgenda({ calendarData, setActiveView }) {
  const events = [...(calendarData?.events || [])].sort((a, b) => new Date(a.start) - new Date(b.start));
  const todayEvents = events.filter((event) => isSameLocalDay(new Date(event.start), new Date()));
  const nextEvent = events.find((event) => new Date(event.end || event.start).getTime() >= Date.now());
  const connected = Boolean(calendarData?.connected);

  return (
    <section className="calendarMiniPanel">
      <div className="dashboardPanelHeader compact">
        <div><h2>今日行程</h2><span>{connected ? `${todayEvents.length} 筆今天 · ${events.length} 筆近期` : '尚未連接 Google Calendar'}</span></div>
        <button type="button" onClick={() => setActiveView('calendar')}>行事曆 <ChevronRight size={15} /></button>
      </div>
      {connected ? (
        <>
          <div className="nextEventCard">
            <span>下一筆</span>
            <strong>{nextEvent?.title || '沒有待提醒行程'}</strong>
            <small>{nextEvent ? formatCalendarRange(nextEvent.start, nextEvent.end) : '今天可以安排重點工作。'}</small>
          </div>
          <div className="miniAgendaRows">
            {(todayEvents.length ? todayEvents : events.slice(0, 3)).slice(0, 4).map((event) => (
              <a href={event.htmlLink || undefined} target={event.htmlLink ? '_blank' : undefined} rel={event.htmlLink ? 'noreferrer' : undefined} key={event.id}>
                <time>{formatCalendarRange(event.start, event.end)}</time>
                <strong>{event.title}</strong>
              </a>
            ))}
          </div>
        </>
      ) : (
        <div className="calendarConnectPrompt">
          <CalendarDays size={19} />
          <p>連接後，總攬會直接顯示今日行程與下一筆提醒。</p>
          <a href="/api/calendar/auth">連接 Google</a>
        </div>
      )}
    </section>
  );
}


function CalendarWorkspaceV2({ calendarData }) {
  const fallbackCalendar = useCalendarData();
  const calendar = calendarData || fallbackCalendar;
  const [monthCursor, setMonthCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState('month');
  const [formOpen, setFormOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [form, setForm] = useState(() => buildCalendarForm(new Date()));
  const [message, setMessage] = useState('');
  const events = useMemo(() => [...(calendar.events || [])].sort((a, b) => new Date(a.start) - new Date(b.start)), [calendar.events]);
  const monthDays = useMemo(() => buildCalendarMonth(monthCursor), [monthCursor]);
  const selectedEvents = events.filter((event) => isSameLocalDay(new Date(event.start), selectedDate));
  const selectedEvent = events.find((event) => event.id === selectedEventId) || selectedEvents[0] || null;
  const monthEvents = events.filter((event) => {
    const time = new Date(event.start);
    return time.getFullYear() === monthCursor.getFullYear() && time.getMonth() === monthCursor.getMonth();
  });
  const upcomingEvents = events.filter((event) => new Date(event.end || event.start).getTime() >= Date.now()).slice(0, 12);
  const nextEvent = upcomingEvents[0];
  const monthLabel = new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: 'long' }).format(monthCursor);
  const notificationLabel = calendar.notificationPermission === 'granted' ? '通知已開啟' : '開啟通知';

  function buildCalendarForm(date, sourceEvent = null) {
    if (sourceEvent) {
      return {
        title: sourceEvent.title || '',
        start: formatDateTimeInput(new Date(sourceEvent.start)),
        end: formatDateTimeInput(new Date(sourceEvent.end || sourceEvent.start)),
        description: sourceEvent.description || sourceEvent.location || ''
      };
    }
    const start = new Date(date || new Date());
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);
    return { title: '', start: formatDateTimeInput(start), end: formatDateTimeInput(end), description: '' };
  }

  function moveMonth(delta) {
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function goToday() {
    const now = new Date();
    setMonthCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
    setSelectedEventId('');
  }

  function selectDay(day) {
    setSelectedDate(day.date);
    setSelectedEventId('');
    if (day.outside) setMonthCursor(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
  }

  function openCreateForm(date = selectedDate) {
    setEditingEventId('');
    setForm(buildCalendarForm(date));
    setFormOpen(true);
  }

  function openEditForm(event) {
    if (!event) return;
    setSelectedEventId(event.id);
    setEditingEventId(event.id);
    setForm(buildCalendarForm(selectedDate, event));
    setFormOpen(true);
  }

  async function saveEvent(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.start || !form.end) return;
    const payload = {
      ...form,
      start: new Date(form.start).toISOString(),
      end: new Date(form.end).toISOString()
    };
    try {
      if (editingEventId) {
        await calendar.updateEvent({ ...payload, id: editingEventId });
        setMessage('已更新 Google Calendar 行程');
      } else {
        const created = await calendar.createEvent(payload);
        setSelectedEventId(created?.id || '');
        setMessage('已新增 Google Calendar 行程');
      }
      setFormOpen(false);
      setEditingEventId('');
    } catch (error) {
      setMessage(error.message || 'Google Calendar 操作失敗');
    }
  }

  async function removeEvent(eventId) {
    if (!eventId) return;
    const confirmed = window.confirm('確定要刪除這個行程嗎？');
    if (!confirmed) return;
    try {
      await calendar.deleteEvent(eventId);
      if (selectedEventId === eventId) setSelectedEventId('');
      if (editingEventId === eventId) {
        setEditingEventId('');
        setFormOpen(false);
      }
      setMessage('已刪除 Google Calendar 行程');
    } catch (error) {
      setMessage(error.message || '刪除 Google Calendar 行程失敗');
    }
  }

  return (
    <section className="calendarAppShell">
      <header className="calendarTopbar">
        <div className="calendarNavCluster">
          <button type="button" onClick={goToday}>今天</button>
          <button type="button" aria-label="上一個月" onClick={() => moveMonth(-1)}><ChevronRight className="flipIcon" size={17} /></button>
          <button type="button" aria-label="下一個月" onClick={() => moveMonth(1)}><ChevronRight size={17} /></button>
          <h2>{monthLabel}</h2>
        </div>
        <div className="calendarToolbarRight">
          <span className={'calendarConn ' + (calendar.connected ? 'ok' : 'warn')}>{calendar.connected ? 'Google 已連線' : '尚未連線'}</span>
          <div className="calendarViewSwitch">
            <button type="button" className={viewMode === 'month' ? 'active' : ''} onClick={() => setViewMode('month')}>月曆</button>
            <button type="button" className={viewMode === 'agenda' ? 'active' : ''} onClick={() => setViewMode('agenda')}>清單</button>
          </div>
          <button type="button" onClick={() => calendar.loadEvents()} disabled={!calendar.connected || calendar.isLoading}><RotateCcw size={16} />同步</button>
          <button type="button" onClick={calendar.requestNotifications} disabled={calendar.notificationPermission === 'granted' || calendar.notificationPermission === 'unsupported'}><Bell size={16} />{notificationLabel}</button>
          <button type="button" className="calendarAddButton" onClick={() => openCreateForm()} disabled={!calendar.connected}><Plus size={16} />新增</button>
        </div>
      </header>

      {!calendar.connected && (
        <div className="calendarConnectStrip">
          <CalendarDays size={18} />
          <span>連上 Google Calendar 後，可在 Workbench 直接新增、修改、刪除與查看行程。</span>
          <a href="/api/calendar/auth">連接 Google</a>
        </div>
      )}

      <div className="calendarMainGrid">
        <main className="calendarBoardPanel">
          <div className="calendarStatsLine">
            <span>本月 {monthEvents.length} 筆</span>
            <span>已同步 {events.length} 筆</span>
            <span>{nextEvent ? '下一個：' + formatCalendarRange(nextEvent.start, nextEvent.end) : '近期沒有行程'}</span>
          </div>
          {viewMode === 'month' ? (
            <div className="calendarMonthGrid">
              {['日', '一', '二', '三', '四', '五', '六'].map((label) => <div className="calendarWeekday" key={label}>{label}</div>)}
              {monthDays.map((day) => {
                const dayEvents = events.filter((event) => isSameLocalDay(new Date(event.start), day.date));
                const selected = isSameLocalDay(day.date, selectedDate);
                return (
                  <button type="button" className={'calendarDayCell ' + (day.outside ? 'outside ' : '') + (day.today ? 'today ' : '') + (selected ? 'selected' : '')} key={day.key} onClick={() => selectDay(day)}>
                    <span>{day.date.getDate()}</span>
                    <div>
                      {dayEvents.slice(0, 3).map((event) => (
                        <span
                          className="calendarDayEvent"
                          key={event.id}
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            setSelectedDate(day.date);
                            setSelectedEventId(event.id);
                          }}
                        >
                          {event.title}
                        </span>
                      ))}
                      {dayEvents.length > 3 && <small>+{dayEvents.length - 3}</small>}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="calendarAgendaList">
              {upcomingEvents.map((event) => (
                <CalendarAgendaRow event={event} key={event.id} onSelect={() => setSelectedEventId(event.id)} onEdit={() => openEditForm(event)} onDelete={removeEvent} />
              ))}
              {!upcomingEvents.length && <div className="emptyState">近期沒有已同步行程。</div>}
            </div>
          )}
        </main>

        <aside className="calendarInspector">
          <section className="nextEventPanel">
            <span>下一個行程</span>
            <strong>{nextEvent?.title || '近期沒有排程'}</strong>
            <small>{nextEvent ? formatCalendarRange(nextEvent.start, nextEvent.end) : '新增行程後會同步到 Google Calendar。'}</small>
          </section>

          <section className="selectedDayPanel">
            <div className="calendarInspectorHeader">
              <div>
                <strong>{new Intl.DateTimeFormat('zh-TW', { month: 'numeric', day: 'numeric', weekday: 'short' }).format(selectedDate)}</strong>
                <span>{selectedEvents.length} 筆行程</span>
              </div>
              <button type="button" aria-label="新增這天的行程" onClick={() => openCreateForm(selectedDate)}><Plus size={15} /></button>
            </div>
            <div className="selectedEventList">
              {selectedEvents.map((event) => (
                <CalendarAgendaRow event={event} key={event.id} onSelect={() => setSelectedEventId(event.id)} onEdit={() => openEditForm(event)} onDelete={removeEvent} compact />
              ))}
              {!selectedEvents.length && <p>這天沒有行程。</p>}
            </div>
          </section>

          {selectedEvent && (
            <section className="calendarEventDetail">
              <span>行程內容</span>
              <strong>{selectedEvent.title}</strong>
              <time>{formatCalendarRange(selectedEvent.start, selectedEvent.end)}</time>
              <p>{selectedEvent.description || selectedEvent.location || '沒有備註'}</p>
              <div className="calendarDetailActions">
                {selectedEvent.htmlLink && <a href={selectedEvent.htmlLink} target="_blank" rel="noreferrer"><ExternalLink size={14} />Google</a>}
                <button type="button" onClick={() => openEditForm(selectedEvent)}><FileText size={14} />編輯</button>
                <button type="button" className="danger" onClick={() => removeEvent(selectedEvent.id)}><Trash2 size={14} />刪除</button>
              </div>
            </section>
          )}

          {formOpen && (
            <form className="calendarQuickForm calendarEditorSheet" onSubmit={saveEvent}>
              <div className="calendarEditorHeader">
                <strong>{editingEventId ? '編輯行程' : '新增行程'}</strong>
                <button type="button" onClick={() => { setFormOpen(false); setEditingEventId(''); }}>取消</button>
              </div>
              <label><span>行程名稱</span><input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="例如：客戶週報會議" /></label>
              <label><span>開始時間</span><input type="datetime-local" value={form.start} onChange={(event) => setForm((current) => ({ ...current, start: event.target.value }))} /></label>
              <label><span>結束時間</span><input type="datetime-local" value={form.end} onChange={(event) => setForm((current) => ({ ...current, end: event.target.value }))} /></label>
              <label><span>備註</span><input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="可放 Notion 會議連結或提醒內容" /></label>
              <button className="primaryAction" type="submit" disabled={calendar.isLoading}><Plus size={16} />{editingEventId ? '儲存修改' : '新增行程'}</button>
            </form>
          )}

          {(message || calendar.message) && <div className={'calendarNotice ' + calendar.status}>{message || calendar.message}</div>}
        </aside>
      </div>

      {calendar.connected && <button type="button" className="calendarFab" onClick={() => openCreateForm(selectedDate)}><Plus size={20} /><span>新增</span></button>}
    </section>
  );
}

function CalendarAgendaRow({ event, onDelete, onEdit, onSelect, compact = false }) {
  return (
    <article className={'calendarAgendaRow ' + (compact ? 'compact' : '')} onClick={onSelect}>
      <time>{formatCalendarRange(event.start, event.end)}</time>
      <div>
        <strong>{event.title}</strong>
        <span>{event.description || event.location || '無備註'}</span>
      </div>
      {event.htmlLink && <a href={event.htmlLink} target="_blank" rel="noreferrer" aria-label="開啟 Google Calendar" onClick={(clickEvent) => clickEvent.stopPropagation()}><ExternalLink size={14} /></a>}
      <button type="button" aria-label="編輯行程" onClick={(clickEvent) => { clickEvent.stopPropagation(); onEdit?.(event); }}><FileText size={14} /></button>
      <button type="button" aria-label="刪除行程" onClick={(clickEvent) => { clickEvent.stopPropagation(); onDelete?.(event.id); }}><Trash2 size={14} /></button>
    </article>
  );
}

function LinksWorkspace() {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('全部');
  const normalizedQuery = query.trim().toLowerCase();
  const visibleLinks = deploymentLinks.filter((item) => {
    const matchesGroup = group === '全部' || item.group === group;
    const haystack = `${item.label} ${item.group} ${item.tag} ${item.description} ${item.url}`.toLowerCase();
    return matchesGroup && (!normalizedQuery || haystack.includes(normalizedQuery));
  });
  const primaryLinks = deploymentLinks.filter((item) => item.primary);

  return (
    <section className="panel linkHubPanel">
      <div className="linkHubHero">
        <div>
          <span>Cloudflare Pages / Workers</span>
          <h2>已部署入口總覽</h2>
          <p>之後我幫你架的新頁面、Worker、API 或管理入口，都可以集中放在這裡，不用再翻聊天紀錄找網址。</p>
        </div>
        <div className="linkHubStats">
          <strong>{deploymentLinks.length}</strong>
          <span>個入口</span>
        </div>
      </div>

      <div className="linkHubToolbar">
        <div className="linkSearchBox">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋 Cloudflare、ERP、Notion..." />
        </div>
        <div className="linkGroupTabs" role="tablist" aria-label="連結分類">
          {deploymentLinkGroups.map((item) => (
            <button type="button" className={group === item ? 'activeLinkGroup' : ''} key={item} onClick={() => setGroup(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="featuredLinkGrid">
        {primaryLinks.map((item) => (
          <a className="featuredLinkCard" href={item.url} target="_blank" rel="noreferrer" key={item.id}>
            <span>{item.tag}</span>
            <strong>{item.label}</strong>
            <p>{item.description}</p>
            <em>開啟 <ExternalLink size={14} /></em>
          </a>
        ))}
      </div>

      <div className="linkList">
        {visibleLinks.map((item) => (
          <a className="linkListRow" href={item.url} target="_blank" rel="noreferrer" key={item.id}>
            <span>{item.group}</span>
            <div>
              <strong>{item.label}</strong>
              <p>{item.description}</p>
              <small>{item.url}</small>
            </div>
            <em>{item.tag}</em>
            <ExternalLink size={16} />
          </a>
        ))}
        {visibleLinks.length === 0 && <div className="emptyState">找不到符合條件的連結。</div>}
      </div>
    </section>
  );
}

function AutomationPanel({ setActiveView }) {
  const links = deploymentLinks.filter((item) => item.primary).slice(0, 6);
  return (
    <section className="panel resourcesPanel">
      <div className="railTitle"><h2>快速連結</h2><button onClick={() => setActiveView?.('links')}>管理 <ChevronRight size={15} /></button></div>
      <div className="resourceGrid">
        {links.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={item.id}><span>{item.label.slice(0, 1)}</span><strong>{item.label}</strong><small>{item.tag}</small></a>)}
      </div>
    </section>
  );
}

function MiniSummary({ title, action, onClick, items, sourceBriefs = [] }) {
  return (
    <section className="panel">
      <div className="railTitle"><h2>{title}</h2><button onClick={onClick}>{action}</button></div>
      <div className="miniList">
        {items.length > 0 ? (
          items.map((item) => <article key={item.id || item.title}><strong>{item.sourceLabel || item.title}</strong><p>{item.text || item.summary}</p></article>)
        ) : (
          <article><strong>{sourceBriefs.length ? '正在整理 Notion' : '尚未連接 Notion'}</strong><p>{sourceBriefs.length ? '來源已設定，讀取完成後這裡會顯示重點。' : '到設定頁貼上 Notion 資料來源連結後，這裡會顯示真正摘要。'}</p></article>
        )}
      </div>
    </section>
  );
}

function MiniNews({ onClick, newsState }) {
  const briefs = newsState?.briefs?.length ? newsState.briefs : newsBriefs;
  const updatedLabel = newsState?.fetchedAt ? formatKnowledgeTime(newsState.fetchedAt) : '尚未更新';

  return (
    <section className="panel">
      <div className="railTitle"><h2>新聞快訊</h2><button onClick={onClick}>看更多</button></div>
      <div className="miniMeta">更新 {updatedLabel}</div>
      <div className="miniList">
        {briefs.slice(0, 2).map((item) => <article key={item.topic}><strong>{item.topic}</strong><p>{item.summary}</p></article>)}
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return <div className="metricCard"><strong>{value}</strong><span>{label}</span></div>;
}

function PanelTitle({ title, count, action }) {
  return (
    <div className="panelTitle">
      <h2>{title} {count !== undefined && <small>{count}</small>}</h2>
      {action && <span>{action}</span>}
      <button className="plainIcon" aria-label={`${title} 選單`}><MoreVertical size={17} /></button>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
