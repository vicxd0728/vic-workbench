import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Clock3,
  Command,
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
  { id: 'news', label: '新聞', icon: Newspaper },
  { id: 'links', label: '連結', icon: Link2 },
  { id: 'automation', label: '設置', icon: Zap }
];

const captureTypes = [
  { id: 'task', label: '任務', icon: CheckSquare },
  { id: 'note', label: '筆記', icon: FileText },
  { id: 'idea', label: '靈感', icon: Sparkles },
  { id: 'link', label: '連結', icon: Link2 }
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
  voice: '語音筆記'
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
  hubUrl: 'https://app.notion.com/p/Workbench-387ff6f424bb8159962be9c34c2ad6ca',
  databasePageUrl: 'https://app.notion.com/p/387ff6f424bb81cd9f98f805ba27462e',
  captureId: '387ff6f424bb8196a0d7db4b72427a0b',
  captureUrl: 'https://app.notion.com/p/387ff6f424bb8196a0d7db4b72427a0b',
  meetingId: '387ff6f424bb8192ac4ef6b7e8791a1a',
  meetingUrl: 'https://app.notion.com/p/387ff6f424bb8192ac4ef6b7e8791a1a?v=387ff6f424bb810ba54c000c1d602d55'
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
  'e19ee4a9a1fb40d5aadef487a3d07356'
]);

function migrateWorkbenchNotionConfig(config = {}) {
  const captureId = retiredWorkbenchNotionIds.has(config.captureDatabaseId) ? '' : config.captureDatabaseId;
  const meetingId = retiredWorkbenchNotionIds.has(config.meetingDatabaseId) ? '' : config.meetingDatabaseId;
  return { ...config, captureDatabaseId: captureId, meetingDatabaseId: meetingId };
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

  async function handleCapture() {
    const title = draft.trim();
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

  async function addVoiceNote(note) {
    setLastAction('正在寫入語音筆記...');
    setCaptureSync({ status: 'loading', message: '正在寫入語音筆記到 Notion...' });
    try {
      const content = [
        note.transcript,
        note.highlights?.length ? `\n\n重點：\n${note.highlights.map((item) => `- ${item}`).join('\n')}` : ''
      ].join('').trim();
      const savedNote = await createCaptureInNotion({
        title: note.title,
        type: 'voice',
        content,
        source: window.matchMedia('(display-mode: standalone)').matches ? '手機 App' : '桌面網頁'
      });
      setNotes((current) => [savedNote, ...current.filter((item) => item.id !== savedNote.id)]);
      setLastAction('語音筆記已寫入 Notion');
      setCaptureSync({ status: 'ready', message: '語音筆記已寫入 Notion 收件匣。' });
      return true;
    } catch (error) {
      setNotes((current) => [note, ...current]);
      setLastAction('語音筆記寫入失敗，已先保留本機暫存');
      setCaptureSync({ status: 'error', message: error.message || '語音筆記寫入 Notion 失敗。' });
      return false;
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

  async function updateNote(id, title) {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    const target = notes.find((note) => note.id === id);
    setNotes((current) => current.map((note) => (note.id === id ? { ...note, title: nextTitle, synced: false, time: '同步中' } : note)));
    try {
      if (target?.notionPageId) {
        const response = await fetch('/api/notion/capture', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: notionConfig.token, pageId: target.notionPageId, title: nextTitle, content: nextTitle })
        });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.message || '更新 Notion 收件匣失敗。');
        setNotes((current) => current.map((note) => (note.id === id ? data.note : note)));
      }
      setLastAction('已更新 Notion 收件匣');
    } catch (error) {
      setCaptureSync({ status: 'error', message: error.message || '更新 Notion 收件匣失敗。' });
      setLastAction('更新失敗，請稍後重試');
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
          addVoiceNote={addVoiceNote}
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
    addVoiceNote,
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
    erpBoard
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
          <VoiceNotePanel addVoiceNote={addVoiceNote} />
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

function DashboardOverview({ stats, tasks, notes, projects, setActiveView, notionData, newsState, erpBoard }) {
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
      hasUpdate: source.hasUpdate,
      highlights: highlights.slice(0, 3),
      displayMessage: source.status === 'error'
        ? '來源讀取失敗，請到資料來源檢查連結、權限或 Token。'
        : source.message
    };
  });
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
      <div className="statusStrip">
        <div><Clock3 size={18} /><span>今天</span><strong>{todayLabel}</strong></div>
        <div><BookOpen size={18} /><span>Notion</span><strong>{notionData.allLiveItems.length ? '已同步' : '讀取中'}</strong><small>{newestSource?.latest ? formatKnowledgeTime(newestSource.latest.lastEditedTime) : '等待資料'}</small></div>
        <div><BarChart3 size={18} /><span>ERP</span><strong>{erpData ? `${erpData.totalPending} 待處理` : '讀取中'}</strong><small>{erpData ? `逾期 ${erpData.overdue || 0} / 庫存 ${erpData.stockWarning || 0}` : '等待資料'}</small></div>
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
              <h3>各來源最新</h3>
              <span>每個資料庫或父頁只佔一格，避免單一來源洗版</span>
            </div>
            <button type="button" onClick={() => setActiveView('knowledge')}>管理資料來源 <ChevronRight size={15} /></button>
          </div>
          <div className="sourceOverviewGrid">
            {sourceDigestCards.length > 0 ? sourceDigestCards.map((source) => (
              <a className="sourceOverviewCard" href={source.href || undefined} target={source.href ? '_blank' : undefined} rel={source.href ? 'noreferrer' : undefined} key={source.id} onClick={(event) => {
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
                {source.highlights.length > 0 ? (
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

        {focusTab === 'overview' && <aside className="dashboardSidePanel serviceHealthPanel">
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
  return (
    <section className="capturePanel">
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') handleCapture();
        }}
        placeholder="快速輸入任務、筆記、連結或靈感。"
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
        <button className="primaryAction" onClick={handleCapture}><Plus size={17} />新增</button>
      </div>
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

function VoiceNotePanel({ addVoiceNote }) {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('按下開始後，瀏覽器會詢問麥克風權限');
  const keyPoints = useMemo(() => extractKeyPoints(transcript), [transcript]);
  const isSupported = typeof window !== 'undefined' && Boolean(getSpeechRecognition());

  function startListening() {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setVoiceStatus('這個瀏覽器不支援語音轉文字，建議使用 Chrome');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-TW';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceStatus('正在聆聽，講完後可按停止');
    };
    recognition.onresult = (event) => {
      let finalText = '';
      let interim = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalText += text;
        else interim += text;
      }
      if (finalText) setTranscript((current) => `${current}${current ? ' ' : ''}${finalText.trim()}`);
      setInterimText(interim.trim());
    };
    recognition.onerror = (event) => {
      setVoiceStatus(`語音辨識中斷：${event.error}`);
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
      setVoiceStatus('已停止，可整理重點或存成筆記');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  async function saveVoiceNote() {
    const content = transcript.trim();
    if (!content) {
      setVoiceStatus('目前沒有可儲存的轉文字內容');
      return;
    }
    setVoiceStatus('正在寫入 Notion 收件匣...');
    const ok = await addVoiceNote({
      id: Date.now(),
      title: keyPoints[0] || content.slice(0, 36),
      type: 'voice',
      time: '剛剛',
      synced: false,
      transcript: content,
      highlights: keyPoints
    });
    setTranscript('');
    setInterimText('');
    setVoiceStatus(ok ? '已存成 Notion 語音重點筆記' : 'Notion 寫入失敗，已先保留本機暫存');
  }

  return (
    <section className="panel voicePanel">
      <div className="panelTitle"><h2>語音重點筆記 <small>{keyPoints.length}</small></h2><span>{isSupported ? 'Chrome 可用' : '需支援語音辨識'}</span></div>
      <div className="voiceControls">
        <button className={`recordButton ${isListening ? 'recording' : ''}`} onClick={isListening ? () => recognitionRef.current?.stop() : startListening}>
          {isListening ? <Square size={18} /> : <Mic size={18} />}{isListening ? '停止錄音' : '開始錄音轉文字'}
        </button>
        <button className="secondaryAction" onClick={saveVoiceNote}><Wand2 size={17} />存成重點筆記</button>
      </div>
      <div className="voiceStatus"><span className={isListening ? 'pulseDot' : ''} />{voiceStatus}</div>
      <div className="transcriptBox">
        <strong>逐字稿</strong>
        <textarea value={`${transcript}${interimText ? `${transcript ? ' ' : ''}${interimText}` : ''}`} onChange={(event) => setTranscript(event.target.value)} placeholder="錄音後會在這裡顯示文字，也可以手動貼上會議內容再萃取重點。" />
      </div>
      <div className="keyPointBox">
        <div><ListChecks size={17} /><strong>自動重點</strong></div>
        {keyPoints.length > 0 ? <ul>{keyPoints.map((point) => <li key={point}>{point}</li>)}</ul> : <p>有逐字稿後，這裡會自動抓出 3 到 5 個重點。</p>}
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
          <div className="notionSetup focused aiSummarySetup">
            <label>
              <span>Notion AI 摘要頁連結</span>
              <input
                value={notionConfig.aiSummaryPageUrl || ''}
                onChange={(event) => updateConfig('aiSummaryPageUrl', event.target.value)}
                placeholder="貼上 Notion AI 整理後的摘要頁連結"
              />
            </label>
            <p>做法：在 Notion 用 AI 或代理程式整理多個來源，寫入這個專用頁。首頁會優先讀這頁；原始資料仍放在「資料來源」分頁。</p>
          </div>
          <div className="settingsInfoGrid">
            <article><Wand2 size={18} /><strong>目前模式</strong><p>首頁先顯示 Notion AI 摘要頁，讓總覽更像決策看板，而不是原始資料清單。</p></article>
            <article><Sparkles size={18} /><strong>Notion AI</strong><p>Notion AI 目前由 Notion 內部操作與寫入摘要頁；Vic Workbench 負責讀取結果。</p></article>
            <article><ShieldAlert size={18} /><strong>成本控制</strong><p>不使用 OpenAI API 也不把模型金鑰放前端；成本由你的 Notion AI 方案承擔。</p></article>
          </div>
          <div className="resultGrid">
            {configuredDatabases.map((config) => {
              const runState = sourceRuns[config.id];
              return (
                <article className={`resultCard ${runState?.status || ''}`} key={config.id}>
                  <div className="resultCardTitle"><strong>{config.label}</strong><span>{runState?.status === 'ready' ? '可彙整' : runState?.status === 'error' ? '需修正' : '未測試'}</span></div>
                  <p>{runState?.message || '先在資料來源讀取成功後，AI 彙整會使用這個來源。'}</p>
                  {runState?.summaries?.length > 0 && (
                    <div className="sourcePreviewList">
                      {runState.summaries.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={item.id || item.title}><strong>{item.title}</strong><span>{item.summary}</span></a>)}
                    </div>
                  )}
                </article>
              );
            })}
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
  function editNote(note) {
    const nextTitle = window.prompt('編輯知識收件匣內容', note.title);
    if (nextTitle === null) return;
    updateNote?.(note.id, nextTitle);
  }

  return (
    <section className="panel inboxPanel">
      <div className="inboxSyncHeader">
        <PanelTitle title="知識收件匣" count={notes.length} />
        <button type="button" onClick={() => refreshCaptureInbox?.()}><RotateCcw size={14} />同步</button>
      </div>
      {captureSync?.message && <div className={`inboxSyncBanner ${captureSync.status}`}>{captureSync.message}</div>}
      <div className="inboxRows">
        {notes.slice(0, expanded ? 12 : 6).map((note) => {
          const Icon = note.type === 'voice' ? Mic : captureTypes.find((type) => type.id === note.type)?.icon || FileText;
          return (
            <article className="inboxRow" key={note.id}>
              <Icon size={16} /><strong>{note.title}</strong><em>{typeLabels[note.type]}</em><span>{note.synced ? '已同步' : note.time}</span>
              <div className="inboxRowActions">
                <button type="button" aria-label="編輯" onClick={() => editNote(note)}><FileText size={14} /></button>
                <button type="button" aria-label="刪除" onClick={() => deleteNote?.(note.id)}><Trash2 size={14} /></button>
              </div>
            </article>
          );
        })}
        {notes.length === 0 && <div className="emptyState">目前沒有快速紀錄。</div>}
      </div>
    </section>
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
