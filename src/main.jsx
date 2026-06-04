import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Newspaper,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings,
  Sparkles,
  Square,
  Star,
  Trash2,
  Wand2,
  Zap
} from 'lucide-react';
import './styles.css';

const todayLabel = new Intl.DateTimeFormat('zh-TW', {
  month: 'long',
  day: 'numeric',
  weekday: 'long'
}).format(new Date());

const storageKeys = {
  tasks: 'vic-workbench:v5:tasks',
  notes: 'vic-workbench:v5:notes',
  projects: 'vic-workbench:v5:projects',
  captureType: 'vic-workbench:v5:capture-type',
  activeView: 'vic-workbench:v5:active-view',
  notionConfig: 'vic-workbench:v5:notion-config'
};

const navItems = [
  { id: 'today', label: '總覽', icon: Home },
  { id: 'inbox', label: '收件匣', icon: Inbox },
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

const initialTasks = [
  { id: 1, title: '整理本週要推進的三件事', area: '工作', stage: 'today', estimate: '30 分', done: false, important: true },
  { id: 2, title: '確認 ERP 手機版加入主畫面流程', area: 'LEMATEC', stage: 'today', estimate: '20 分', done: false, important: false },
  { id: 3, title: '把 Dashboard 下一步功能寫成 Notion 規格', area: '自動化', stage: 'next', estimate: '45 分', done: false, important: true },
  { id: 4, title: '等待 Notion 資料庫欄位確認', area: '串接', stage: 'waiting', estimate: '待回覆', done: false, important: false }
];

const initialNotes = [
  { id: 11, title: 'Dashboard 要像每天打開的控制台，不是展示頁', type: 'note', time: '今天', synced: false },
  { id: 12, title: 'Notion 先做任務、筆記、連結三種資料庫', type: 'idea', time: '昨天', synced: false },
  { id: 13, title: 'Cloudflare Pages 可當作工作台部署位置', type: 'link', time: '5/25', synced: true }
];

const initialProjects = [
  { id: 21, name: '個人工作台', status: '重新整理', progress: 68, due: '6/10', color: 'blue' },
  { id: 22, name: 'LEMATEC ERP PWA', status: '已上線', progress: 92, due: '完成', color: 'green' },
  { id: 23, name: 'Notion 知識庫', status: '待串接', progress: 32, due: '6/15', color: 'amber' }
];

const notionDatabases = [
  { id: 'tasks', label: '任務資料庫', icon: CheckSquare, count: 18, status: '待同步' },
  { id: 'knowledge', label: '知識庫', icon: BookOpen, count: 42, status: '整理中' },
  { id: 'clients', label: '客戶與專案', icon: BriefcaseBusiness, count: 9, status: '本週更新' },
  { id: 'meetings', label: '會議筆記', icon: Mic, count: 7, status: '可摘要' }
];

const notionHighlights = [
  {
    title: 'ERP PWA 部署與手機加入主畫面流程',
    database: '知識庫',
    summary: 'Cloudflare Pages 作為正式入口，iPhone 需重新加入主畫面才會更新圖示與啟動畫面。',
    url: 'https://lematec-erp.pages.dev/'
  },
  {
    title: '個人工作台下一階段',
    database: '任務資料庫',
    summary: '先完成 Notion 設定、資料庫摘要、語音筆記同步，再處理新聞與金融資訊來源。',
    url: 'https://www.notion.so/'
  },
  {
    title: '語音重點筆記規格',
    database: '會議筆記',
    summary: '錄音轉文字後自動萃取重點，保留逐字稿、摘要與待辦，之後寫入 Notion。',
    url: 'https://www.notion.so/'
  }
];

const notionDatabaseDetails = {
  tasks: {
    headline: '任務資料庫目前以同步佇列和待辦狀態為主，適合每天早上快速掃描。',
    pending: 6,
    updatedAt: '今天',
    items: [
      { title: '把 Dashboard 下一步功能完成 Notion 規格', summary: '定義資料庫欄位、同步格式、摘要顯示方式。', url: 'https://www.notion.so/' },
      { title: '確認 Cloudflare Pages 部署流程', summary: '前端用 Pages，私密 token 用 Functions 或 Worker。', url: 'https://developers.cloudflare.com/pages/' },
      { title: '整理語音筆記轉任務規則', summary: '從逐字稿抽出待辦、期限、負責人與原始摘要。', url: 'https://www.notion.so/' }
    ]
  },
  knowledge: {
    headline: '知識庫用來放已整理過的流程、技術筆記、決策紀錄與可重複使用的 SOP。',
    pending: 12,
    updatedAt: '昨天',
    items: [
      { title: 'ERP PWA 部署與手機加入主畫面流程', summary: 'Cloudflare Pages 作為正式入口，重新加入主畫面才會更新圖示。', url: 'https://lematec-erp.pages.dev/' },
      { title: '個人工作台資訊架構', summary: '首頁收斂成 Dashboard，細節分到 Notion、新聞、專案、設定頁。', url: 'https://www.notion.so/' },
      { title: 'Cloudflare Pages + Functions 架構', summary: '靜態前端與私密 API 分離，避免 token 暴露。', url: 'https://developers.cloudflare.com/pages/functions/' }
    ]
  },
  clients: {
    headline: '客戶與專案資料庫用來追蹤合作狀態、下一步、報價、交付與往來重點。',
    pending: 4,
    updatedAt: '本週',
    items: [
      { title: 'LEMATEC ERP 行動入口', summary: '已切換到 Cloudflare Pages，後續可補 PWA 與登入入口說明。', url: 'https://lematec-erp.pages.dev/' },
      { title: '專案狀態總覽', summary: '把正在進行、等待回覆、已完成的專案集中呈現。', url: 'https://www.notion.so/' },
      { title: '客戶會議待整理', summary: '語音筆記可先收進會議資料庫，再整理成任務與結論。', url: 'https://www.notion.so/' }
    ]
  },
  meetings: {
    headline: '會議筆記資料庫會收語音轉文字、重點摘要、決議與待辦，方便回頭查。',
    pending: 7,
    updatedAt: '今天',
    items: [
      { title: '語音重點筆記規格', summary: '錄音轉文字後自動萃取重點，保留逐字稿與摘要。', url: 'https://www.notion.so/' },
      { title: 'Notion API 串接討論', summary: '一組 token 共用多資料庫，後端統一處理查詢與摘要。', url: 'https://www.notion.so/' },
      { title: '新聞情報來源討論', summary: '先用中文 RSS 聚合，不需要付費新聞 API。', url: 'https://www.notion.so/' }
    ]
  }
};

const newsBriefs = [
  { topic: '國際', title: '國際新聞摘要', summary: '未來串接新聞 API 或 RSS 後，首頁只顯示最重要的三點。' },
  { topic: '金融', title: '金融市場快訊', summary: '追蹤美股、匯率、利率、原物料與加密貨幣，整理成每日風險提醒。' },
  { topic: '供應鏈', title: '產業與供應鏈', summary: '針對電子、製造、材料與客戶產業建立關鍵字監控。' }
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
    newsKeywords: '國際, 金融, 匯率, 供應鏈'
  });
  const [draft, setDraft] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastAction, setLastAction] = useState('準備開始');
  const newsState = useNewsBriefs();

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
        { id: Date.now(), title, area: '收件匣', stage: 'today', estimate: '15 分', done: false, important: false },
        ...current
      ]);
      setLastAction('已新增到今日任務');
    } else {
      setNotes((current) => [{ id: Date.now(), title, type: captureType, time: '剛剛', synced: false }, ...current]);
      setLastAction('已加入知識收件匣');
    }
    setDraft('');
  }

  function addVoiceNote(note) {
    setNotes((current) => [note, ...current]);
    setLastAction('語音筆記已加入收件匣');
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

  function resetDemoData() {
    setTasks(initialTasks);
    setNotes(initialNotes);
    setProjects(initialProjects);
    setLastAction('已重置示範資料');
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
          resetDemoData={resetDemoData}
          newsState={newsState}
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
    newsState
  } = props;

  if (activeView === 'knowledge') {
    return (
      <section className="contentGrid singlePage">
        <div className="primaryColumn">
          <PageHeader title="Notion / 知識庫" subtitle="分層查看不同資料庫的摘要，需要細節時再點進 Notion 原頁。" />
          <NotionWorkspace />
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
          <PageHeader title="收件匣" subtitle="快速收集想法、語音逐字稿、待整理連結，之後再送到 Notion。" />
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
    <section className="contentGrid dashboardPage">
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
        />
      </div>
      <aside className="insightRail">
        <FocusPanel stats={stats} />
        <MiniSummary title="Notion 重點" action="看更多" onClick={() => setActiveView('knowledge')} items={notionHighlights.slice(0, 2)} />
        <MiniNews onClick={() => setActiveView('news')} newsState={newsState} />
      </aside>
    </section>
  );
}

function Sidebar({ activeView, setActiveView, notes, tasks }) {
  const inboxCount = notes.filter((note) => !note.synced).length;
  const openTasks = tasks.filter((task) => !task.done).length;

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brandMark">V</div>
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

function DashboardOverview({ stats, tasks, notes, projects, setActiveView }) {
  const importantTasks = tasks.filter((task) => !task.done).slice(0, 3);
  const queueCount = notes.filter((note) => !note.synced).length;
  const topProject = projects[0];

  return (
    <section className="overviewGrid">
      <article className="overviewCard wide">
        <div className="cardTitle">
          <h2>需要注意</h2>
          <button onClick={() => setActiveView('projects')}>看任務 <ChevronRight size={15} /></button>
        </div>
        <div className="priorityList">
          {importantTasks.map((task) => (
            <div key={task.id}>
              <CheckSquare size={16} />
              <strong>{task.title}</strong>
              <span>{task.area} · {stageLabels[task.stage]}</span>
            </div>
          ))}
        </div>
      </article>
      <article className="overviewCard">
        <h2>Notion 佇列</h2>
        <strong className="bigNumber">{queueCount}</strong>
        <p>待同步或待整理資料</p>
        <button onClick={() => setActiveView('knowledge')}>看摘要</button>
      </article>
      <article className="overviewCard">
        <h2>主要專案</h2>
        <strong>{topProject.name}</strong>
        <div className="progress"><b style={{ width: `${topProject.progress}%` }} /></div>
        <p>{topProject.progress}% · {topProject.status}</p>
      </article>
      <article className="overviewCard wide">
        <div className="cardTitle">
          <h2>新聞快訊</h2>
          <button onClick={() => setActiveView('news')}>看更多 <ChevronRight size={15} /></button>
        </div>
        <div className="briefLine">
          <Newspaper size={18} />
          <span>國際、金融、供應鏈未來會由 API 自動更新，首頁只保留最高優先摘要。</span>
        </div>
      </article>
      <article className="overviewCard">
        <h2>完成度</h2>
        <strong className="bigNumber">{stats.progress}%</strong>
        <p>{stats.completed} 已完成 / {stats.open} 未完成</p>
      </article>
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

function NotionWorkspace() {
  const [activeDatabase, setActiveDatabase] = useState('knowledge');
  const activeInfo = notionDatabases.find((item) => item.id === activeDatabase) || notionDatabases[0];
  const activeDetail = notionDatabaseDetails[activeDatabase] || notionDatabaseDetails.knowledge;
  const totalItems = notionDatabases.reduce((total, item) => total + item.count, 0);
  const totalPending = Object.values(notionDatabaseDetails).reduce((total, item) => total + item.pending, 0);

  return (
    <section className="panel notionWorkspace">
      <div className="panelTitle"><h2>Notion Dashboard <small>{notionDatabases.length}</small></h2><span>多資料庫摘要</span></div>
      <div className="notionDashboardGrid">
        <article>
          <span>資料庫</span>
          <strong>{notionDatabases.length}</strong>
          <p>任務、知識、客戶、會議</p>
        </article>
        <article>
          <span>總項目</span>
          <strong>{totalItems}</strong>
          <p>未來由 Notion API 即時更新</p>
        </article>
        <article>
          <span>待整理</span>
          <strong>{totalPending}</strong>
          <p>需要摘要或歸檔</p>
        </article>
      </div>
      <div className="databaseCards">
        {notionDatabases.map(({ id, label, icon: Icon, count, status }) => {
          const detail = notionDatabaseDetails[id];
          return (
            <button className={activeDatabase === id ? 'activeDatabaseCard' : ''} key={id} onClick={() => setActiveDatabase(id)}>
              <Icon size={18} />
              <strong>{label}</strong>
              <span>{count} 筆 · {status}</span>
              <p>{detail.headline}</p>
            </button>
          );
        })}
      </div>
      <div className="databaseTabs">
        {notionDatabases.map(({ id, label, icon: Icon, count }) => (
          <button className={activeDatabase === id ? 'activeDatabase' : ''} key={id} onClick={() => setActiveDatabase(id)}>
            <Icon size={16} /><span>{label}</span><small>{count}</small>
          </button>
        ))}
      </div>
      <div className="databaseSummary">
        <div><strong>{activeInfo.label}</strong><span>{activeInfo.status} · {activeDetail.updatedAt}更新 · {activeDetail.pending} 筆待整理</span></div>
        <button><Wand2 size={16} />重新整理摘要</button>
      </div>
      <div className="databaseInsight">
        <BookOpen size={18} />
        <p>{activeDetail.headline}</p>
      </div>
      <div className="summaryRows">
        {activeDetail.items.map((item) => (
          <article className="summaryRow" key={item.title}>
            <div><span>{activeInfo.label}</span><strong>{item.title}</strong><p>{item.summary}</p></div>
            <a href={item.url} target="_blank" rel="noreferrer" aria-label={`開啟 ${item.title}`}><ExternalLink size={16} /></a>
          </article>
        ))}
      </div>
      <button className="wideButton"><ExternalLink size={16} />開啟 {activeInfo.label} 看更多</button>
    </section>
  );
}

function NewsWorkspace({ newsState }) {
  const statusLabel = newsState.status === 'ready' ? 'RSS 已更新' : '本機示範';

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

  function updateConfig(field, value) {
    setNotionConfig((current) => ({ ...current, [field]: value }));
  }

  return (
    <section className="panel notionWorkspace">
      <div className="panelTitle"><h2>連線設定</h2><span>本機保存</span></div>
      <PwaInstallCard pwaInstall={pwaInstall} />
      <div className="notionSetup">
        <label><span>Notion 網頁</span><input value={notionConfig.workspaceUrl} onChange={(event) => updateConfig('workspaceUrl', event.target.value)} placeholder="https://www.notion.so/..." /></label>
        <label><span>API Token Key</span><input value={notionConfig.token} onChange={(event) => updateConfig('token', event.target.value)} placeholder="secret_..." type="password" /></label>
        <label><span>預設資料庫 ID</span><input value={notionConfig.defaultDatabase} onChange={(event) => updateConfig('defaultDatabase', event.target.value)} placeholder="Database ID" /></label>
        <label><span>新聞關鍵字</span><input value={notionConfig.newsKeywords} onChange={(event) => updateConfig('newsKeywords', event.target.value)} placeholder="國際, 金融, 供應鏈" /></label>
      </div>
      <div className="securityNote">正式上線時，Token 建議放在 Cloudflare Worker 或後端環境變數，不直接暴露在前端。</div>
      <div className="settingsActions">
        <button className="secondaryAction" onClick={resetDemoData}><RotateCcw size={17} />重置示範資料</button>
      </div>
    </section>
  );
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
  function bumpProgress(id) {
    setProjects((current) => current.map((project) => (project.id === id ? { ...project, progress: Math.min(100, project.progress + 8) } : project)));
  }

  return (
    <section className="panel projectsPanel">
      <PanelTitle title="專案進度" count={projects.length} action="可手動更新" />
      <div className="projectRows">
        {projects.map((project) => (
          <article className="projectRow" key={project.id}>
            <span className={`projectDot ${project.color}`} /><strong>{project.name}</strong><em>{project.status}</em>
            <div className="progress"><b style={{ width: `${project.progress}%` }} /></div>
            <span>{project.progress}%</span><small>{project.due}</small>
            <button className="plainIcon" aria-label="增加進度" onClick={() => bumpProgress(project.id)}><ChevronRight size={17} /></button>
          </article>
        ))}
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
      <div className="railTitle"><h2>常用入口</h2><button onClick={resetDemoData}><RotateCcw size={15} />重置</button></div>
      <div className="resourceGrid">
        {links.map(([label, url]) => <a href={url} target="_blank" rel="noreferrer" key={label}><span>{label.slice(0, 1)}</span><strong>{label}</strong></a>)}
      </div>
    </section>
  );
}

function MiniSummary({ title, action, onClick, items }) {
  return (
    <section className="panel">
      <div className="railTitle"><h2>{title}</h2><button onClick={onClick}>{action}</button></div>
      <div className="miniList">
        {items.map((item) => <article key={item.title}><strong>{item.title}</strong><p>{item.summary}</p></article>)}
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
