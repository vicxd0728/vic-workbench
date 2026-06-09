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
  notionConfig: 'vic-workbench:v6:notion-config'
};

const navItems = [
  { id: 'today', label: '總覽', icon: Home },
  { id: 'inbox', label: '快速紀錄', icon: Inbox },
  { id: 'projects', label: '專案', icon: FolderKanban },
  { id: 'knowledge', label: 'Notion / 知識庫', icon: BookOpen },
  { id: 'news', label: '新聞情報', icon: Newspaper },
  { id: 'automation', label: '自動化', icon: Zap }
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

const defaultNotionDatabaseConfig = {
  tasks: { id: 'tasks', label: '任務資料庫', sourceType: 'database', databaseId: '', pageUrl: '', purpose: '任務同步、待辦與工作狀態', sortMode: 'updated', analysisLimit: 3, locked: true },
  knowledge: { id: 'knowledge', label: '客戶分析知識庫', sourceType: 'folder', databaseId: '', pageUrl: 'https://app.notion.com/p/356ff6f424bb81d4a9a8c4a997fcffc6', purpose: '客戶分析週報、每日數據與詢盤攻堅紀錄', sortMode: 'title-date-desc', analysisLimit: 3, locked: true },
  meetings: { id: 'meetings', label: '會議筆記', sourceType: 'folder', databaseId: '', pageUrl: '', purpose: '會議逐字稿、重點摘要與決議', sortMode: 'updated', analysisLimit: 3, locked: true }
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

    configs[id] = {
      id,
      label: stored.label || defaults.label || preset?.label || '自訂資料庫',
      sourceType: storedHasSource ? (stored.sourceType || defaults.sourceType || 'database') : (defaults.sourceType || stored.sourceType || 'database'),
      databaseId: stored.databaseId || defaults.databaseId || '',
      pageUrl: stored.pageUrl || defaults.pageUrl || '',
      purpose: stored.purpose || defaults.purpose || preset?.purpose || '自訂 Notion 資料庫',
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

function useNewsBriefs() {
  const [newsState, setNewsState] = useState({
    status: 'loading',
    briefs: newsBriefs,
    items: [],
    sources: [],
    fetchedAt: null
  });

  useEffect(() => {
    let isMounted = true;

    async function loadNews() {
      try {
        const response = await fetch('/api/news/brief?limit=18');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!isMounted) return;

        setNewsState({
          status: 'ready',
          briefs: data.briefs?.length ? data.briefs : newsBriefs,
          items: data.items || [],
          sources: data.sources || [],
          fetchedAt: data.fetchedAt || null
        });
      } catch {
        if (!isMounted) return;
        setNewsState((current) => ({ ...current, status: 'fallback' }));
      }
    }

    loadNews();
    return () => {
      isMounted = false;
    };
  }, []);

  return newsState;
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
  const [notionConfig, setNotionConfig] = usePersistentState(storageKeys.notionConfig, {
    workspaceUrl: '',
    token: '',
    defaultDatabase: '',
    databases: defaultNotionDatabaseConfig,
    newsKeywords: '國際, 金融, 匯率, 供應鏈'
  });
  const [draft, setDraft] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastAction, setLastAction] = useState('準備開始');
  const newsState = useNewsBriefs();
  const notionData = useNotionSources(notionConfig);
  const erpBoard = useErpBoardSummary();

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

  function handleCapture() {
    const title = draft.trim();
    if (!title) return;

    if (captureType === 'task') {
      setTasks((current) => [
        { id: Date.now(), title, area: '快速紀錄', stage: 'today', estimate: '15 分', done: false, important: false },
        ...current
      ]);
      setLastAction('已新增到今日任務');
    } else {
      setNotes((current) => [{ id: Date.now(), title, type: captureType, time: '剛剛', synced: false }, ...current]);
      setLastAction('已加入知識暫存');
    }
    setDraft('');
  }

  function addVoiceNote(note) {
    setNotes((current) => [note, ...current]);
    setLastAction('語音筆記已加入快速紀錄');
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

  function clearLocalData() {
    setTasks(initialTasks);
    setNotes(initialNotes);
    setProjects(initialProjects);
    setLastAction('已清空本機資料');
  }

  function exportData() {
    const payload = JSON.stringify({ tasks, notes, projects, notionConfig }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'vic-workbench-export.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setLastAction('已匯出 JSON');
  }

  return (
    <div className="workspace">
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
    resetDemoData,
    newsState,
    erpBoard
  } = props;

  if (activeView === 'knowledge') {
    return (
      <section className="contentGrid singlePage">
        <div className="primaryColumn">
          <PageHeader title="Notion / 知識庫" subtitle="分層查看不同資料庫的摘要，需要細節時再點進 Notion 原頁。" />
          <NotionWorkspace notionConfig={notionConfig} notionData={notionData} />
        </div>
        <aside className="insightRail">
          <NotionPanel notes={notes} syncNote={syncNote} />
          <KnowledgePanel notes={notes} />
        </aside>
      </section>
    );
  }

  if (activeView === 'inbox') {
    return (
      <section className="contentGrid singlePage">
        <div className="primaryColumn">
          <PageHeader title="快速紀錄" subtitle="快速收集想法、語音逐字稿、待整理連結，之後再送到 Notion。" />
          <CapturePanel {...{ captureType, setCaptureType, draft, setDraft, handleCapture, lastAction }} />
          <VoiceNotePanel addVoiceNote={addVoiceNote} />
          <KnowledgePanel notes={notes} expanded />
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
          <PageHeader title="新聞情報" subtitle="未來串接最新國際、金融與供應鏈資訊；首頁只放最高優先摘要。" />
          <NewsWorkspace newsState={newsState} />
        </div>
        <aside className="insightRail">
          <FocusPanel stats={stats} />
          <AutomationPanel resetDemoData={resetDemoData} />
        </aside>
      </section>
    );
  }

  if (activeView === 'automation') {
    return (
      <section className="contentGrid singlePage">
        <div className="primaryColumn">
          <PageHeader title="設定與自動化" subtitle="所有 Token、Notion、新聞來源與未來 API 設定集中在同一頁。" />
          <RemotePowerPanel />
          <SettingsWorkspace notionConfig={notionConfig} setNotionConfig={setNotionConfig} resetDemoData={resetDemoData} />
        </div>
        <aside className="insightRail">
          <AutomationPanel resetDemoData={resetDemoData} />
          <NotionPanel notes={notes} syncNote={syncNote} />
        </aside>
      </section>
    );
  }

  return (
    <section className="contentGrid dashboardPage commandPage">
      <div className="primaryColumn">
        <section className="welcomeBand compactWelcome">
          <div>
            <p>{todayLabel}</p>
            <h1>今天只看重點</h1>
            <span>首頁保留重要資訊、待辦、Notion 摘要與新聞快訊；需要細節再進分頁。</span>
          </div>
          <div className="dailyScore">
            <strong>{stats.progress}%</strong>
            <span>完成度</span>
          </div>
        </section>
        <DashboardOverview
          stats={stats}
          tasks={tasks}
          notes={notes}
          projects={projects}
          setActiveView={setActiveView}
          notionData={notionData}
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
        <span>Notion、新聞、設定都已拆開，之後接 API 會更清楚。</span>
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

function DashboardOverview({ stats, tasks, notes, projects, setActiveView, notionData, erpBoard }) {
  const [focusTab, setFocusTab] = useState('overview');
  const importantTasks = tasks.filter((task) => !task.done).slice(0, 3);
  const queueCount = notes.filter((note) => !note.synced).length;
  const newestSource = [...(notionData.sourceBriefs || [])].sort((a, b) => new Date(b.latest?.lastEditedTime || 0) - new Date(a.latest?.lastEditedTime || 0))[0];
  const topBullets = notionData.overviewBullets.slice(0, 6);
  const [deviceStatus, setDeviceStatus] = useState({ status: 'loading', data: null });
  const deviceState = deviceStatus.data?.state;
  const temperature = deviceState?.telemetry?.temperature;
  const tempValue = temperature?.available ? `${temperature.celsius}°C` : '未回報';
  const tempLevel = temperature?.available && temperature.celsius >= 90 ? '危險' : temperature?.available && temperature.celsius >= 80 ? '偏高' : '正常';
  const erpData = erpBoard.data;
  const erpStatusLabel = erpBoard.status === 'ready' ? '已同步' : erpBoard.status === 'loading' ? '讀取中' : '需設定';
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
  const attentionItems = [
    temperature?.available && temperature.celsius >= 90
      ? { level: 'danger', label: '電腦溫度過高', value: `${temperature.celsius}°C`, detail: '建議先保存工作並睡眠或關機散熱。' }
      : null,
    erpData?.totalPending > 0
      ? { level: erpData.totalPending >= 80 ? 'danger' : 'warning', label: 'ERP 待處理', value: `${erpData.totalPending} 件`, detail: `逾期 ${erpData.overdue || 0}、庫存警示 ${erpData.stockWarning || 0}。` }
      : null,
    notionData.sourceBriefs.some((source) => source.status === 'error')
      ? { level: 'warning', label: 'Notion 來源異常', value: `${notionData.sourceBriefs.filter((source) => source.status === 'error').length} 個`, detail: '到知識庫分頁檢查來源連結或權限。' }
      : null,
    !deviceStatus.data?.online
      ? { level: 'muted', label: '電腦代理離線', value: '未連線', detail: '遠端控制需本機代理程式持續執行。' }
      : null
  ].filter(Boolean);
  const focusTabs = [
    { id: 'overview', label: '重點' },
    { id: 'erp', label: 'ERP' },
    { id: 'notion', label: 'Notion' },
    { id: 'device', label: '裝置' }
  ];
  const showNotion = focusTab === 'overview' || focusTab === 'notion';
  const showDevice = focusTab === 'overview' || focusTab === 'device';
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
        <div><Wifi size={18} /><span>遠端電腦</span><strong>{deviceStatus.data?.online ? '在線' : '離線'}</strong><small>{deviceState?.hostname || 'vic-windows-pc'}</small></div>
        <div><Thermometer size={18} /><span>溫度</span><strong>{tempValue}</strong><small>{tempLevel}</small></div>
        <div><Inbox size={18} /><span>待整理</span><strong>{queueCount} 筆</strong></div>
      </div>

      <div className="dashboardFocusTabs" role="tablist" aria-label="總攬焦點">
        {focusTabs.map((tab) => (
          <button type="button" className={focusTab === tab.id ? 'activeFocusTab' : ''} key={tab.id} onClick={() => setFocusTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      <section className="attentionPanel">
        <div className="dashboardPanelHeader compact">
          <div><h2>需要先看的事</h2><span>{attentionItems.length ? '依風險與待處理量排序' : '目前沒有需要立即處理的警示'}</span></div>
        </div>
        <div className="attentionList">
          {attentionItems.length ? attentionItems.map((item) => (
            <div className={`attentionItem ${item.level}`} key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.detail}</small>
            </div>
          )) : (
            <div className="attentionItem ok"><span>狀態穩定</span><strong>OK</strong><small>ERP、Notion 與裝置沒有立即警示。</small></div>
          )}
        </div>
      </section>

      <div className={`dashboardLayout focus-${focusTab}`}>
        {showNotion && <section className="dashboardMainPanel">
          <div className="dashboardPanelHeader">
            <div><h2>今日總覽</h2><span>{newestSource?.latest ? `最新來源：${newestSource.label}` : '等待 Notion 更新'}</span></div>
            <button onClick={() => notionData.refreshAll()}><RotateCcw size={15} />重新整理</button>
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
            )) : (
              <div className="dashboardEmpty"><BookOpen size={18} />正在讀取 Notion；若一直沒有資料，請確認來源頁面已分享給 integration。</div>
            )}
          </div>
        </section>}

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

        {showNotion && <section className="dashboardSubPanel">
          <div className="dashboardPanelHeader">
            <div><h2>資料來源狀態</h2><span>Notion database / 父頁更新概況</span></div>
            <button onClick={() => setActiveView('knowledge')}>管理來源 <ChevronRight size={15} /></button>
          </div>
          <div className="sourceStatusTable">
            {notionData.sourceBriefs.length > 0 ? notionData.sourceBriefs.map((source) => (
              <button key={source.id} onClick={() => setActiveView('knowledge')}>
                <strong>{source.label}</strong>
                <span>{source.sourceType === 'folder' ? '父頁資料夾' : 'Database'}</span>
                <span>{source.items.length} 頁</span>
                <small>{source.latest ? formatKnowledgeTime(source.latest.lastEditedTime) : source.message}</small>
                <em>{source.status === 'ready' ? '正常' : source.status === 'loading' ? '讀取中' : '待讀取'}</em>
              </button>
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

function CapturePanel({ captureType, setCaptureType, draft, setDraft, handleCapture, lastAction }) {
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

  function saveVoiceNote() {
    const content = transcript.trim();
    if (!content) {
      setVoiceStatus('目前沒有可儲存的轉文字內容');
      return;
    }
    addVoiceNote({
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
    setVoiceStatus('已存成語音重點筆記');
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

function buildKnowledgeBullets(items = []) {
  return items.flatMap((item) => {
    const highlights = item.highlights?.length ? item.highlights : splitSummaryHighlights(item.summary);
    return (highlights.length ? highlights : [item.summary || item.title]).map((text) => ({
      id: `${item.id || item.title}-${text}`,
      title: item.title,
      sourceLabel: item.sourceLabel,
      url: item.url,
      time: item.lastEditedTime,
      text
    }));
  });
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

function useNotionSources(notionConfig) {
  const configuredDatabases = getConfiguredNotionDatabases(notionConfig);
  const [liveSummaries, setLiveSummaries] = useState({});
  const [liveStatus, setLiveStatus] = useState({});
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

  useEffect(() => {
    connectedSources.forEach((source) => {
      if (liveSummaries[source.id] || liveStatus[source.id]?.status === 'loading') return;
      readNotionSource(source);
    });
  }, [connectedSources.map((source) => `${source.id}:${source.databaseId || source.pageUrl}`).join('|')]);

  const allLiveItems = connectedSources.flatMap((source) => (liveSummaries[source.id] || []).map((item) => ({ ...item, sourceLabel: source.label, sourceId: source.id })));
  const newestItem = [...allLiveItems].sort((a, b) => new Date(b.lastEditedTime || 0) - new Date(a.lastEditedTime || 0))[0];
  const overviewBullets = buildKnowledgeBullets(allLiveItems).slice(0, 8);
  const sourceBriefs = connectedSources.map((source) => {
    const items = liveSummaries[source.id] || [];
    const latest = [...items].sort((a, b) => new Date(b.lastEditedTime || 0) - new Date(a.lastEditedTime || 0))[0];
    return {
      ...source,
      items,
      latest,
      status: liveStatus[source.id]?.status || (items.length ? 'ready' : 'idle'),
      message: liveStatus[source.id]?.message || (items.length ? `已讀取 ${items.length} 個頁面。` : '等待讀取')
    };
  });

  return {
    configuredDatabases,
    connectedSources,
    liveSummaries,
    liveStatus,
    allLiveItems,
    newestItem,
    overviewBullets,
    sourceBriefs,
    readNotionSource,
    refreshAll: () => connectedSources.forEach((source) => readNotionSource(source))
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
      <div className="panelTitle"><h2>Notion Dashboard <small>{configuredDatabases.length}</small></h2><span>自訂資料庫摘要</span></div>
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
  const statusLabel = newsState.status === 'ready' ? 'RSS 已更新' : '等待線上連線';

  return (
    <section className="panel notionWorkspace">
      <div className="panelTitle"><h2>新聞專區 <small>{newsState.briefs.length}</small></h2><span>{statusLabel}</span></div>
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
    </section>
  );
}

function SettingsWorkspace({ notionConfig, setNotionConfig, resetDemoData }) {
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
          <h2>Notion 設定</h2>
          <p>貼上 Database 或父頁連結就好，系統會自動解析 ID。新增來源、連線、讀取結果分開管理。</p>
        </div>
        <div className="settingsHeroStats">
          <span>{tokenStatusLabel}</span>
          <strong>{connectedSources}/{configuredDatabases.length}</strong>
          <small>已設定來源</small>
        </div>
      </div>

      <div className="settingsTabs" role="tablist" aria-label="Notion settings">
        {[
          ['sources', '資料來源', `${configuredDatabases.length} 個`],
          ['connection', '連線', tokenStatusLabel],
          ['results', '讀取結果', `${successfulRuns} 筆成功`]
        ].map(([id, label, meta]) => (
          <button type="button" className={activeSettingsTab === id ? 'activeSettingsTab' : ''} key={id} onClick={() => setActiveSettingsTab(id)}>
            <strong>{label}</strong>
            <span>{meta}</span>
          </button>
        ))}
      </div>

      {activeSettingsTab === 'connection' && (
        <div className="settingsPanel">
          <PwaInstallCard pwaInstall={pwaInstall} />
          <div className="connectionGuide compact">
            <div><span>1</span><strong>貼 Token</strong><p>本機測試可先填 Token；正式部署建議放到 Cloudflare 環境變數。</p></div>
            <div><span>2</span><strong>新增來源</strong><p>Database 貼 database 連結；父頁資料夾貼父頁連結。</p></div>
            <div><span>3</span><strong>讀取資料</strong><p>每個來源可獨立測試，確認能抓到最新子頁或資料庫頁面。</p></div>
          </div>
          <div className="notionSetup focused">
            <label><span>Notion 工作區連結</span><input value={notionConfig.workspaceUrl} onChange={(event) => updateConfig('workspaceUrl', event.target.value)} placeholder="https://www.notion.so/..." /></label>
            <label><span>Notion API Token</span><input value={notionConfig.token} onChange={(event) => updateConfig('token', event.target.value)} placeholder="secret_..." type="password" /></label>
            <label><span>新聞關鍵字</span><input value={notionConfig.newsKeywords} onChange={(event) => updateConfig('newsKeywords', event.target.value)} placeholder="AI, 工具, 市場趨勢" /></label>
          </div>
          <div className="securityNote">正式上線時，建議把 Token 設在 Cloudflare Pages 的 NOTION_TOKEN，前端只保留來源連結。</div>
        </div>
      )}

      {activeSettingsTab === 'sources' && (
        <div className="sourceManager">
          <aside className="sourceList">
            <div className="databaseHeaderActions">
              <button className="secondaryAction" onClick={() => addCustomDatabase('database')}><Plus size={17} /><span>新增 Database</span></button>
              <button className="secondaryAction" onClick={() => addCustomDatabase('folder')}><Plus size={17} /><span>新增父頁</span></button>
            </div>
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
      )}

      {activeSettingsTab === 'results' && (
        <div className="settingsPanel">
          <div className="resultGrid">
            {configuredDatabases.map((config) => {
              const runState = sourceRuns[config.id];
              return (
                <article className={`resultCard ${runState?.status || ''}`} key={config.id}>
                  <div className="resultCardTitle"><strong>{config.label}</strong><span>{runState?.status === 'ready' ? '成功' : runState?.status === 'error' ? '失敗' : '未測試'}</span></div>
                  <p>{runState?.message || '這個來源還沒有讀取紀錄。'}</p>
                  {runState?.summaries?.length > 0 && (
                    <div className="sourcePreviewList">
                      {runState.summaries.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={item.id || item.title}><strong>{item.title}</strong><span>{item.summary}</span></a>)}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          <div className="settingsActions"><button className="secondaryAction" onClick={resetDemoData}><RotateCcw size={17} /><span>重置本機資料</span></button></div>
        </div>
      )}
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
      setStatus({ status: 'error', data: null, message: error.message || '讀取電腦狀態失敗。' });
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
          <span>模式</span>
          <strong>{state?.dryRun ? '測試模式' : '正式執行'}</strong>
          <small>{memoryPercent !== null ? `記憶體使用約 ${memoryPercent}%` : '等待代理程式回報'}</small>
        </article>
      </div>

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
        <label><span>確認字</span><input value={confirmText} onChange={(event) => setConfirmText(event.target.value.trim())} placeholder="例如 關機" /></label>
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
      <div className="focusCallout"><CheckCircle2 size={22} /><p><strong>建議先做</strong>首頁只看摘要，細節進 Notion / 知識庫分頁。</p></div>
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

function KnowledgePanel({ notes, expanded = false }) {
  return (
    <section className="panel inboxPanel">
      <PanelTitle title="知識收件匣" count={notes.length} />
      <div className="inboxRows">
        {notes.slice(0, expanded ? 12 : 6).map((note) => {
          const Icon = note.type === 'voice' ? Mic : captureTypes.find((type) => type.id === note.type)?.icon || FileText;
          return (
            <article className="inboxRow" key={note.id}>
              <Icon size={16} /><strong>{note.title}</strong><em>{typeLabels[note.type]}</em><span>{note.synced ? '已同步' : note.time}</span>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AutomationPanel({ resetDemoData }) {
  const links = [
    ['Notion', 'https://www.notion.so'],
    ['Google Drive', 'https://drive.google.com'],
    ['Gmail', 'https://mail.google.com'],
    ['Calendar', 'https://calendar.google.com']
  ];
  return (
    <section className="panel resourcesPanel">
      <div className="railTitle"><h2>常用入口</h2><button onClick={resetDemoData}><RotateCcw size={15} />清空</button></div>
      <div className="resourceGrid">
        {links.map(([label, url]) => <a href={url} target="_blank" rel="noreferrer" key={label}><span>{label.slice(0, 1)}</span><strong>{label}</strong></a>)}
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

  return (
    <section className="panel">
      <div className="railTitle"><h2>新聞快訊</h2><button onClick={onClick}>看更多</button></div>
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
