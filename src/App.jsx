import {
  AlarmClock,
  BookOpen,
  Brain,
  Camera,
  CalendarPlus,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Crown,
  Dice5,
  ExternalLink,
  Gamepad2,
  Globe2,
  KeyRound,
  Link as LinkIcon,
  ListChecks,
  LogOut,
  MessageCircle,
  Pause,
  PencilLine,
  Plane,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  TimerReset,
  Trophy,
  Upload,
  Utensils,
  UserPlus,
  Users,
  Wand2,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  clearSession,
  checkInChat,
  colors,
  createGoogleCalendarUrl,
  createGame,
  getChat,
  getDateMeta,
  getBackendMode,
  getGame,
  getLegalPieces,
  getSavedLocale,
  getSavedSession,
  getWorkspace,
  homeLength,
  joinGame,
  loginAccount,
  movePiece,
  previewLink,
  registerAccount,
  reactToMessage,
  restartGame,
  rollDice,
  saveLocale,
  saveSession,
  saveWorkspace,
  sendChatMessage,
  summarizeLink,
  toGlobalPosition,
  trackLength,
} from './apiClient.js'

const boardSize = 15
const trackCoords = buildTrackCoords()
const taskLists = ['today', 'important', 'deadline', 'all']
const locales = [
  { id: 'zh-Hans', label: '简体中文' },
  { id: 'zh-Hant-HK', label: '香港繁中' },
  { id: 'en', label: 'English' },
]

const copy = {
  'zh-Hans': {
    appName: '八八婆和八八公的日常工作台',
    appSub: '两个人用',
    authTitle: '把今天、学习、私聊和小游戏放在一起。',
    authText: '注册账号后就能保存任务、倒数日、外链卡片，也能开一局飞行棋。',
    register: '注册',
    login: '登录',
    displayName: '昵称',
    account: '账号',
    password: '密码',
    inviteCode: '邀请码',
    enter: '进入',
    cloud: '云端同步',
    local: '本地演示',
    checking: '检查中',
    logout: '退出',
    plan: '计划',
    study: '学习',
    focus: '番茄钟',
    dates: '倒数日',
    links: '私聊',
    photos: '照片墙',
    fortune: '小命理',
    play: '一起玩',
    today: '今天',
    important: '重要',
    deadline: 'Deadline',
    all: '全部',
    add: '添加',
    taskPlaceholder: '新任务',
    dueDate: '日期',
    course: '课程',
    studyTitle: '学习任务',
    note: '备注',
    start: '开始',
    pause: '暂停',
    reset: '重置',
    focusDone: '完成一轮',
    dateTitle: '事件',
    linkTitle: '标题',
    linkUrl: '链接',
    chatPlaceholder: '发消息或贴链接',
    checkIn: '打卡',
    streak: '火花',
    photoTitle: '照片标题',
    photoUrl: '照片链接或上传',
    photoNote: '照片备注',
    startTime: '开始',
    endTime: '结束',
    reminder: '提醒',
    addToGoogle: '加到 Google Calendar',
    lunar: '农历',
    quickPick: '常用',
    kitchen: '小厨房',
    drawGuess: '你画我猜',
    wordChain: '成语接龙',
    riddle: '脑筋急转弯',
    serve: '上菜',
    cooking: '制作中',
    ready: '可以上菜',
    guess: '猜一下',
    reveal: '揭晓',
    nextQuestion: '换题',
    summarize: 'AI 总结',
    preview: '抓取信息',
    open: '打开',
    saving: '保存中',
    updated: '已更新',
    done: '已完成',
    markDone: '标记完成',
    focusLabel: '专注',
    breakLabel: '休息',
    sessions: '轮数',
    countdown: '倒数',
    anniversary: '纪念日',
    turn: '回合',
    players: '玩家',
    log: '战况',
    won: '赢了',
    yourTurn: '轮到你',
    waitOther: '等对方',
    createGame: '开飞行棋',
    joinGame: '加入房间',
    roomCode: '房间码',
    invite: '邀请',
    lobby: '返回',
    roll: '掷骰子',
    restart: '重开',
    waiting: '等人加入',
    playing: '对局中',
    finished: '已结束',
  },
  'zh-Hant-HK': {
    appName: '八八婆同八八公嘅日常工作台',
    appSub: '兩個人用',
    authTitle: '今日、學習、私訊同小遊戲，放埋一齊。',
    authText: '註冊之後可以存任務、倒數日、外鏈卡片，亦可以開局飛行棋。',
    register: '註冊',
    login: '登入',
    displayName: '暱稱',
    account: '帳號',
    password: '密碼',
    inviteCode: '邀請碼',
    enter: '入去',
    cloud: '雲端同步',
    local: '本機示範',
    checking: '檢查中',
    logout: '登出',
    plan: '計劃',
    study: '學習',
    focus: '番茄鐘',
    dates: '倒數日',
    links: '私訊',
    photos: '相片牆',
    fortune: '小命理',
    play: '一齊玩',
    today: '今日',
    important: '重要',
    deadline: 'Deadline',
    all: '全部',
    add: '新增',
    taskPlaceholder: '新任務',
    dueDate: '日期',
    course: '課程',
    studyTitle: '學習任務',
    note: '備註',
    start: '開始',
    pause: '暫停',
    reset: '重設',
    focusDone: '完成一輪',
    dateTitle: '事件',
    linkTitle: '標題',
    linkUrl: '連結',
    chatPlaceholder: '發訊息或者貼連結',
    checkIn: '打卡',
    streak: '火花',
    photoTitle: '相片標題',
    photoUrl: '相片連結或上載',
    photoNote: '相片備註',
    startTime: '開始',
    endTime: '結束',
    reminder: '提醒',
    addToGoogle: '加到 Google Calendar',
    lunar: '農曆',
    quickPick: '常用',
    kitchen: '小廚房',
    drawGuess: '你畫我估',
    wordChain: '成語接龍',
    riddle: '腦筋急轉彎',
    serve: '上菜',
    cooking: '整緊',
    ready: '可以上菜',
    guess: '估吓',
    reveal: '開估',
    nextQuestion: '換題',
    summarize: 'AI 摘要',
    preview: '抓資料',
    open: '打開',
    saving: '儲存緊',
    updated: '已更新',
    done: '完成咗',
    markDone: '標記完成',
    focusLabel: '專注',
    breakLabel: '休息',
    sessions: '輪數',
    countdown: '倒數',
    anniversary: '紀念日',
    turn: '回合',
    players: '玩家',
    log: '戰況',
    won: '贏咗',
    yourTurn: '到你',
    waitOther: '等對方',
    createGame: '開飛行棋',
    joinGame: '加入房間',
    roomCode: '房間碼',
    invite: '邀請',
    lobby: '返回',
    roll: '掟骰',
    restart: '重開',
    waiting: '等人加入',
    playing: '玩緊',
    finished: '完咗',
  },
  en: {
    appName: 'Baba Po and Baba Gong',
    appSub: 'Daily dashboard',
    authTitle: 'Plans, study, links, dates, and games in one place.',
    authText: 'Create an account to save tasks, countdowns, link cards, and play flying chess together.',
    register: 'Register',
    login: 'Login',
    displayName: 'Name',
    account: 'Username',
    password: 'Password',
    inviteCode: 'Invite code',
    enter: 'Enter',
    cloud: 'Cloud sync',
    local: 'Local demo',
    checking: 'Checking',
    logout: 'Logout',
    plan: 'Plan',
    study: 'Study',
    focus: 'Timer',
    dates: 'Dates',
    links: 'Chat',
    photos: 'Photos',
    fortune: 'Fortune',
    play: 'Play',
    today: 'Today',
    important: 'Important',
    deadline: 'Deadline',
    all: 'All',
    add: 'Add',
    taskPlaceholder: 'New task',
    dueDate: 'Date',
    course: 'Course',
    studyTitle: 'Study item',
    note: 'Note',
    start: 'Start',
    pause: 'Pause',
    reset: 'Reset',
    focusDone: 'Complete',
    dateTitle: 'Event',
    linkTitle: 'Title',
    linkUrl: 'Link',
    chatPlaceholder: 'Message or paste a link',
    checkIn: 'Check in',
    streak: 'Streak',
    photoTitle: 'Photo title',
    photoUrl: 'Photo link or upload',
    photoNote: 'Photo note',
    startTime: 'Start',
    endTime: 'End',
    reminder: 'Reminder',
    addToGoogle: 'Add to Google Calendar',
    lunar: 'Lunar',
    quickPick: 'Quick',
    kitchen: 'Kitchen',
    drawGuess: 'Draw Guess',
    wordChain: 'Idiom Chain',
    riddle: 'Riddle',
    serve: 'Serve',
    cooking: 'Cooking',
    ready: 'Ready',
    guess: 'Guess',
    reveal: 'Reveal',
    nextQuestion: 'Next',
    summarize: 'AI summary',
    preview: 'Fetch',
    open: 'Open',
    saving: 'Saving',
    updated: 'Updated',
    done: 'Done',
    markDone: 'Mark done',
    focusLabel: 'Focus',
    breakLabel: 'Break',
    sessions: 'Sessions',
    countdown: 'Countdown',
    anniversary: 'Anniversary',
    turn: 'Turn',
    players: 'Players',
    log: 'Log',
    won: 'won',
    yourTurn: 'Your turn',
    waitOther: 'Waiting',
    createGame: 'New game',
    joinGame: 'Join',
    roomCode: 'Code',
    invite: 'Invite',
    lobby: 'Back',
    roll: 'Roll',
    restart: 'Restart',
    waiting: 'Waiting',
    playing: 'Playing',
    finished: 'Finished',
  },
}

const navItems = [
  { id: 'plan', icon: ListChecks },
  { id: 'study', icon: BookOpen },
  { id: 'focus', icon: AlarmClock },
  { id: 'dates', icon: CalendarDays },
  { id: 'links', icon: LinkIcon },
  { id: 'photos', icon: Camera },
  { id: 'fortune', icon: Wand2 },
  { id: 'play', icon: Gamepad2 },
]

const baseCoords = {
  red: [
    [1, 1],
    [1, 3],
    [3, 1],
    [3, 3],
  ],
  blue: [
    [1, 11],
    [1, 13],
    [3, 11],
    [3, 13],
  ],
  green: [
    [11, 13],
    [13, 13],
    [11, 11],
    [13, 11],
  ],
  gold: [
    [11, 1],
    [13, 1],
    [11, 3],
    [13, 3],
  ],
}

const homeCoords = {
  red: [
    [1, 7],
    [2, 7],
    [3, 7],
    [4, 7],
    [5, 7],
    [6, 7],
  ],
  blue: [
    [7, 13],
    [7, 12],
    [7, 11],
    [7, 10],
    [7, 9],
    [7, 8],
  ],
  green: [
    [13, 7],
    [12, 7],
    [11, 7],
    [10, 7],
    [9, 7],
    [8, 7],
  ],
  gold: [
    [7, 1],
    [7, 2],
    [7, 3],
    [7, 4],
    [7, 5],
    [7, 6],
  ],
}

function App() {
  const [session, setSession] = useState(getSavedSession)
  const [mode, setMode] = useState('checking')
  const [route, setRoute] = useState(readRoute)
  const [locale, setLocale] = useState(getSavedLocale)
  const t = copy[locale] || copy['zh-Hans']

  useEffect(() => {
    getBackendMode().then(setMode)
  }, [])

  useEffect(() => {
    document.title = t.appName
    document.documentElement.lang = locale
    saveLocale(locale)
  }, [locale, t.appName])

  useEffect(() => {
    const onPop = () => setRoute(readRoute())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const onAuth = (nextSession) => {
    saveSession(nextSession)
    setSession(nextSession)
  }

  const logout = () => {
    clearSession()
    setSession(null)
    window.history.pushState({}, '', '/')
    setRoute(readRoute())
  }

  if (!session) {
    return <AuthScreen locale={locale} setLocale={setLocale} mode={mode} onAuth={onAuth} t={t} />
  }

  return (
    <main className="app-shell">
      <Header session={session} mode={mode} logout={logout} locale={locale} setLocale={setLocale} t={t} />
      {route.gameId ? (
        <GameRoom gameId={route.gameId} session={session} setRoute={setRoute} t={t} />
      ) : (
        <Dashboard session={session} setRoute={setRoute} locale={locale} t={t} />
      )}
    </main>
  )
}

function AuthScreen({ locale, setLocale, mode, onAuth, t }) {
  const [authMode, setAuthMode] = useState('register')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const payload = { username, password, displayName, inviteCode }
      const data = authMode === 'register' ? await registerAccount(payload) : await loginAccount(payload)
      onAuth(data.session)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-hero">
        <BrandBlock t={t} large />
        <div className="hero-copy">
          <h2>{t.authTitle}</h2>
          <p>{t.authText}</p>
        </div>
      </section>

      <section className="auth-card" aria-label="账号">
        <LanguageSelect locale={locale} setLocale={setLocale} />
        <div className="auth-tabs">
          <button className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>
            <UserPlus size={18} />
            {t.register}
          </button>
          <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>
            <KeyRound size={18} />
            {t.login}
          </button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {authMode === 'register' ? (
            <label>
              {t.displayName}
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Aaron" />
            </label>
          ) : null}
          {authMode === 'register' ? (
            <label>
              {t.inviteCode}
              <input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="Only us" autoCapitalize="characters" />
            </label>
          ) : null}
          <label>
            {t.account}
            <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="aaron" autoCapitalize="none" />
          </label>
          <label>
            {t.password}
            <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" type="password" />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" disabled={busy} type="submit">
            <ChevronRight size={18} />
            {authMode === 'register' ? t.register : t.login}
          </button>
        </form>
        <SyncPill mode={mode} t={t} />
      </section>
    </main>
  )
}

function Header({ session, mode, logout, locale, setLocale, t }) {
  return (
    <header className="top-bar">
      <BrandBlock t={t} />
      <div className="top-actions">
        <LanguageSelect locale={locale} setLocale={setLocale} compact />
        <SyncPill mode={mode} t={t} compact />
        <span className="user-pill">{session.user.displayName}</span>
        <button onClick={logout}>
          <LogOut size={17} />
          {t.logout}
        </button>
      </div>
    </header>
  )
}

function BrandBlock({ t, large = false }) {
  return (
    <div className={`brand-row ${large ? 'large' : ''}`}>
      <span className="brand-mark">
        <Crown size={large ? 34 : 25} />
      </span>
      <div>
        <p>{t.appSub}</p>
        <h1>{t.appName}</h1>
      </div>
    </div>
  )
}

function LanguageSelect({ locale, setLocale, compact = false }) {
  return (
    <label className={`language-select ${compact ? 'compact' : ''}`}>
      <Globe2 size={16} />
      <select value={locale} onChange={(event) => setLocale(event.target.value)}>
        {locales.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function SyncPill({ mode, t, compact = false }) {
  return (
    <span className={`mode-pill ${mode === 'cloud' ? 'cloud' : ''} ${compact ? 'compact' : ''}`}>
      <ShieldCheck size={16} />
      {mode === 'cloud' ? t.cloud : mode === 'local' ? t.local : t.checking}
    </span>
  )
}

function Dashboard({ session, setRoute, locale, t }) {
  const [active, setActive] = useState('plan')
  const [workspace, setWorkspace] = useState(null)
  const workspaceRef = useRef(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const data = await getWorkspace()
      workspaceRef.current = data.workspace
      setWorkspace(data.workspace)
      setError('')
    } catch (refreshError) {
      setError(refreshError.message)
    }
  }, [])

  useEffect(() => {
    refresh()
    const timer = window.setInterval(refresh, 1600)
    const localSync = () => refresh()
    window.addEventListener('yhd-local-sync', localSync)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('yhd-local-sync', localSync)
    }
  }, [refresh])

  const commit = async (updater) => {
    const current = workspaceRef.current || workspace
    if (!current) return null
    const next = typeof updater === 'function' ? updater(structuredClone(current)) : updater
    next.settings = { ...(next.settings || {}), locale }
    next.updatedAt = new Date().toISOString()
    workspaceRef.current = next
    setWorkspace(next)
    setSaving(true)
    try {
      const data = await saveWorkspace(next)
      workspaceRef.current = data.workspace
      setWorkspace(data.workspace)
      setError('')
      return data.workspace
    } catch (saveError) {
      setError(saveError.message)
      throw saveError
    } finally {
      setSaving(false)
    }
  }

  if (!workspace) {
    return (
      <section className="loading-panel">
        <RefreshCw className="spin" size={26} />
        <p>{t.checking}</p>
      </section>
    )
  }

  const panelProps = { workspace, commit, session, setRoute, t }
  const ActiveIcon = navItems.find((item) => item.id === active)?.icon || ListChecks

  return (
    <section className="dashboard-layout">
      <aside className="side-nav">
        {navItems.map(({ id, icon: Icon }) => (
          <button key={id} className={active === id ? 'active' : ''} onClick={() => setActive(id)}>
            <Icon size={19} />
            {t[id]}
          </button>
        ))}
      </aside>

      <section className="dashboard-main">
        <div className="section-title">
          <span className="eyebrow">
            <ActiveIcon size={18} />
            {t[active]}
          </span>
          <StatusLine workspace={workspace} saving={saving} error={error} t={t} />
        </div>
        {active === 'plan' ? <PlanPanel {...panelProps} /> : null}
        {active === 'study' ? <StudyPanel {...panelProps} /> : null}
        {active === 'focus' ? <FocusPanel {...panelProps} /> : null}
        {active === 'dates' ? <DatesPanel {...panelProps} /> : null}
        {active === 'links' ? <LinksPanel {...panelProps} /> : null}
        {active === 'photos' ? <PhotosPanel {...panelProps} /> : null}
        {active === 'fortune' ? <FortunePanel {...panelProps} /> : null}
        {active === 'play' ? <PlayPanel {...panelProps} /> : null}
      </section>
    </section>
  )
}

function StatusLine({ workspace, saving, error, t }) {
  if (error) return <p className="status-line error">{error}</p>
  return <p className="status-line">{saving ? t.saving : `${t.updated} ${formatShortTime(workspace.updatedAt)}`}</p>
}

function PlanPanel({ workspace, commit, t }) {
  const [list, setList] = useState('today')
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState(todayString())

  const filtered = workspace.tasks.filter((task) => {
    if (list === 'all') return true
    if (list === 'important') return task.important
    return task.list === list
  })

  const addTask = async (event) => {
    event.preventDefault()
    if (!title.trim()) return
    await commit((draft) => {
      const targetList = list === 'all' ? 'today' : list
      draft.tasks.unshift({
        id: createClientId(),
        title: title.trim(),
        list: targetList,
        dueDate,
        done: false,
        important: targetList === 'important',
        createdAt: new Date().toISOString(),
      })
      return draft
    })
    setTitle('')
  }

  const addQuickTask = async (label) => {
    await commit((draft) => {
      draft.tasks.unshift({
        id: createClientId(),
        title: label,
        list: list === 'all' || list === 'important' ? 'today' : list,
        dueDate: todayString(),
        done: false,
        important: list === 'important',
        createdAt: new Date().toISOString(),
      })
      return draft
    })
  }

  return (
    <div className="tool-grid plan-grid">
      <div className="list-tabs">
        {taskLists.map((id) => (
          <button className={list === id ? 'active' : ''} key={id} onClick={() => setList(id)}>
            {t[id]}
            <span>{countForList(workspace.tasks, id)}</span>
          </button>
        ))}
      </div>
      <div className="tool-panel">
        <form className="inline-form" onSubmit={addTask}>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.taskPlaceholder} />
          <input value={dueDate} onChange={(event) => setDueDate(event.target.value)} type="date" />
          <button type="submit">
            <Plus size={18} />
            {t.add}
          </button>
        </form>
        <div className="quick-row">
          <span>{t.quickPick}</span>
          {(workspace.quickTasks || []).map((item) => (
            <button key={item} onClick={() => addQuickTask(item)}>
              {item}
            </button>
          ))}
        </div>
        <div className="task-list">
          {filtered.map((task) => (
            <TaskRow key={task.id} task={task} commit={commit} t={t} />
          ))}
        </div>
      </div>
    </div>
  )
}

function TaskRow({ task, commit, t }) {
  const due = dateDistance(task.dueDate)
  return (
    <article className={`task-row ${task.done ? 'done' : ''}`}>
      <button
        className="check-button"
        onClick={() =>
          commit((draft) => {
            const item = draft.tasks.find((candidate) => candidate.id === task.id)
            if (item) item.done = !item.done
            return draft
          })
        }
      >
        {task.done ? <Check size={17} /> : null}
      </button>
      <div>
        <strong>{task.title}</strong>
        <p>
          {task.dueDate || t.dueDate}
          {due ? ` · ${due}` : ''}
        </p>
      </div>
      <button
        className={`icon-button ${task.important ? 'active' : ''}`}
        onClick={() =>
          commit((draft) => {
            const item = draft.tasks.find((candidate) => candidate.id === task.id)
            if (item) item.important = !item.important
            return draft
          })
        }
      >
        <Star size={17} />
      </button>
    </article>
  )
}

function StudyPanel({ workspace, commit, t }) {
  const [course, setCourse] = useState('')
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')

  const addStudy = async (event) => {
    event.preventDefault()
    if (!title.trim()) return
    await commit((draft) => {
      draft.studyItems.unshift({
        id: createClientId(),
        course: course.trim() || t.course,
        title: title.trim(),
        note: note.trim(),
        done: false,
        minutes: 25,
        createdAt: new Date().toISOString(),
      })
      return draft
    })
    setTitle('')
    setNote('')
  }

  const quickStudies = [
    { course: t.course, title: '整理一张复习卡', note: '写成自己看得懂的话' },
    { course: t.course, title: '让难点变简单', note: '把不会的点拆开' },
    { course: t.course, title: '做一组错题复盘', note: '错因比答案重要' },
  ]

  const addQuickStudy = async (item) => {
    await commit((draft) => {
      draft.studyItems.unshift({
        id: createClientId(),
        course: item.course,
        title: item.title,
        note: item.note,
        done: false,
        minutes: 25,
        createdAt: new Date().toISOString(),
      })
      return draft
    })
  }

  return (
    <div className="tool-panel">
      <form className="stack-form" onSubmit={addStudy}>
        <div className="two-fields">
          <input value={course} onChange={(event) => setCourse(event.target.value)} placeholder={t.course} />
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.studyTitle} />
        </div>
        <input value={note} onChange={(event) => setNote(event.target.value)} placeholder={t.note} />
        <button type="submit">
          <Plus size={18} />
          {t.add}
        </button>
      </form>
      <div className="quick-row">
        <span>{t.quickPick}</span>
        {quickStudies.map((item) => (
          <button key={item.title} onClick={() => addQuickStudy(item)}>
            {item.title}
          </button>
        ))}
      </div>
      <div className="card-grid">
        {workspace.studyItems.map((item) => (
          <article className={`study-card ${item.done ? 'done' : ''}`} key={item.id}>
            <span>{item.course}</span>
            <h3>{item.title}</h3>
            <p>{item.note || ' '}</p>
            <button
              onClick={() =>
                commit((draft) => {
                  const target = draft.studyItems.find((candidate) => candidate.id === item.id)
                  if (target) target.done = !target.done
                  return draft
                })
              }
            >
              <Check size={17} />
              {item.done ? t.done : t.markDone}
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}

function FocusPanel({ workspace, commit, t }) {
  const [secondsLeft, setSecondsLeft] = useState(workspace.timer.focusMinutes * 60)
  const [running, setRunning] = useState(false)
  const [focusInput, setFocusInput] = useState(String(workspace.timer.focusMinutes))
  const [breakInput, setBreakInput] = useState(String(workspace.timer.breakMinutes))
  const [sessionsInput, setSessionsInput] = useState(String(workspace.timer.sessions))

  useEffect(() => {
    setFocusInput(String(workspace.timer.focusMinutes))
    setBreakInput(String(workspace.timer.breakMinutes))
    setSessionsInput(String(workspace.timer.sessions))
  }, [workspace.timer.focusMinutes, workspace.timer.breakMinutes, workspace.timer.sessions])

  useEffect(() => {
    if (!running) return undefined
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          window.clearInterval(timer)
          setRunning(false)
          commit((draft) => {
            draft.timer.sessions += 1
            return draft
          })
          return workspace.timer.focusMinutes * 60
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [commit, running, workspace.timer.focusMinutes])

  const commitTimerNumber = async (field, value, options = {}) => {
    if (value === '') return
    const number = Number(value)
    if (!Number.isFinite(number)) return
    const nextValue = Math.max(options.min ?? 0, Math.min(options.max ?? 999, number))
    await commit((draft) => {
      draft.timer[field] = nextValue
      return draft
    })
    if (field === 'focusMinutes') setSecondsLeft(nextValue * 60)
  }

  return (
    <div className="timer-layout">
      <section className="timer-card">
        <Clock3 size={34} />
        <strong>{formatTimer(secondsLeft)}</strong>
        <div className="timer-actions">
          <button className="primary-button" onClick={() => setRunning((value) => !value)}>
            {running ? <Pause size={18} /> : <Play size={18} />}
            {running ? t.pause : t.start}
          </button>
          <button
            onClick={() => {
              setRunning(false)
              setSecondsLeft(workspace.timer.focusMinutes * 60)
            }}
          >
            <TimerReset size={18} />
            {t.reset}
          </button>
        </div>
      </section>
      <section className="tool-panel compact-panel">
        <label>
          {t.focusLabel}
          <input
            value={focusInput}
            min="1"
            max="180"
            onBlur={(event) => commitTimerNumber('focusMinutes', event.target.value, { min: 1, max: 180 })}
            onChange={(event) => {
              setFocusInput(event.target.value)
              commitTimerNumber('focusMinutes', event.target.value, { min: 1, max: 180 })
            }}
            type="number"
          />
        </label>
        <label>
          {t.breakLabel}
          <input
            value={breakInput}
            min="1"
            max="90"
            onBlur={(event) => commitTimerNumber('breakMinutes', event.target.value, { min: 1, max: 90 })}
            onChange={(event) => {
              setBreakInput(event.target.value)
              commitTimerNumber('breakMinutes', event.target.value, { min: 1, max: 90 })
            }}
            type="number"
          />
        </label>
        <label>
          {t.sessions}
          <input
            value={sessionsInput}
            min="0"
            max="999"
            onBlur={(event) => commitTimerNumber('sessions', event.target.value, { min: 0, max: 999 })}
            onChange={(event) => {
              setSessionsInput(event.target.value)
              commitTimerNumber('sessions', event.target.value, { min: 0, max: 999 })
            }}
            type="number"
          />
        </label>
      </section>
    </div>
  )
}

function DatesPanel({ workspace, commit, t }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('2026-07-03')
  const [type, setType] = useState('countdown')
  const [startTime, setStartTime] = useState('18:00')
  const [endTime, setEndTime] = useState('22:00')
  const [remindMinutes, setRemindMinutes] = useState('60')

  const addDate = async (event) => {
    event.preventDefault()
    if (!title.trim()) return
    await commit((draft) => {
      draft.dates.unshift({
        id: createClientId(),
        title: title.trim(),
        date,
        type,
        startTime,
        endTime,
        remindMinutes: Number(remindMinutes || 0),
        note: '',
        createdAt: new Date().toISOString(),
      })
      return draft
    })
    setTitle('')
  }

  return (
    <div className="tool-panel">
      <form className="calendar-form" onSubmit={addDate}>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.dateTitle} />
        <input value={date} onChange={(event) => setDate(event.target.value)} type="date" />
        <input aria-label={t.startTime} value={startTime} onChange={(event) => setStartTime(event.target.value)} type="time" />
        <input aria-label={t.endTime} value={endTime} onChange={(event) => setEndTime(event.target.value)} type="time" />
        <input aria-label={t.reminder} value={remindMinutes} onChange={(event) => setRemindMinutes(event.target.value)} min="0" type="number" />
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="countdown">{t.countdown}</option>
          <option value="anniversary">{t.anniversary}</option>
          <option value="birthday">Birthday</option>
          <option value="holiday">Holiday</option>
          <option value="deadline">Deadline</option>
        </select>
        <button type="submit">
          <Plus size={18} />
          {t.add}
        </button>
      </form>
      <div className="date-grid">
        {workspace.dates.map((item) => (
          <DateCard item={item} key={item.id} t={t} />
        ))}
      </div>
    </div>
  )
}

function DateCard({ item, t }) {
  const meta = getDateMeta(item.date)
  const tags = [...new Set([meta.holiday, ...meta.festivals, ...meta.terms].filter(Boolean))]
  return (
    <article className="date-card">
      <span>{item.type}</span>
      <h3>{item.title}</h3>
      <strong>{eventDistance(item) || item.date}</strong>
      <p>
        {item.date}
        {item.startTime ? ` · ${item.startTime}${item.endTime ? `-${item.endTime}` : ''}` : ''}
      </p>
      <p>
        {t.lunar} {meta.lunar}
        {tags.length ? ` · ${tags.join(' · ')}` : ''}
      </p>
      <p>{t.reminder}: {formatReminder(item.remindMinutes)}</p>
      <a className="calendar-link" href={createGoogleCalendarUrl(item)} rel="noreferrer" target="_blank">
        <CalendarPlus size={15} />
        {t.addToGoogle}
      </a>
    </article>
  )
}

function LinksPanel({ session, t }) {
  const [chat, setChat] = useState(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refreshChat = useCallback(async () => {
    try {
      const data = await getChat()
      setChat(data.chat)
      setError('')
    } catch (chatError) {
      setError(chatError.message)
    }
  }, [])

  useEffect(() => {
    refreshChat()
    const timer = window.setInterval(refreshChat, 1500)
    const localSync = () => refreshChat()
    window.addEventListener('yhd-local-sync', localSync)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('yhd-local-sync', localSync)
    }
  }, [refreshChat])

  const submit = async (event) => {
    event.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    try {
      const data = await sendChatMessage({ text })
      setChat(data.chat)
      setText('')
      setError('')
    } catch (sendError) {
      setError(sendError.message)
    } finally {
      setBusy(false)
    }
  }

  const react = async (messageId, emoji) => {
    const data = await reactToMessage(messageId, emoji)
    setChat(data.chat)
  }

  const checkIn = async () => {
    const data = await checkInChat()
    setChat(data.chat)
  }

  return (
    <div className="chat-shell">
      <div className="chat-header">
        <div>
          <span className="eyebrow">
            <MessageCircle size={18} />
            {t.links}
          </span>
          <h2>{t.streak} {chat?.streak || 0}</h2>
        </div>
        <button className="streak-button" onClick={checkIn}>
          <Sparkles size={17} />
          {t.checkIn}
        </button>
      </div>
      <div className="message-list">
        {(chat?.messages || []).map((message) => (
          <MessageBubble key={message.id} message={message} mine={message.userId === session.user.id} onReact={react} t={t} />
        ))}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <form className="chat-composer" onSubmit={submit}>
        <input value={text} onChange={(event) => setText(event.target.value)} placeholder={t.chatPlaceholder} />
        <button className="primary-button" disabled={busy} type="submit">
          <Send size={17} />
        </button>
      </form>
    </div>
  )
}

function MessageBubble({ message, mine, onReact, t }) {
  const reactions = Object.entries(message.reactions || {}).filter(([, users]) => users.length)
  return (
    <article className={`message-bubble ${mine ? 'mine' : ''}`}>
      <div className="message-meta">
        <span>{message.displayName}</span>
        <time>{formatShortTime(message.createdAt)}</time>
      </div>
      <p>{message.text}</p>
      {message.card ? <MessageLinkCard card={message.card} t={t} /> : null}
      <div className="reaction-row">
        {['😂', '❤️', '👍', '🥹', '🔥'].map((emoji) => (
          <button key={emoji} onClick={() => onReact(message.id, emoji)} title={emoji}>
            {emoji}
          </button>
        ))}
        {reactions.map(([emoji, users]) => (
          <span key={emoji}>{emoji} {users.length}</span>
        ))}
      </div>
    </article>
  )
}

function MessageLinkCard({ card, t }) {
  return (
    <a className="message-link-card" href={card.url} rel="noreferrer" target="_blank">
      <div>{card.image ? <img alt="" src={card.image} /> : <ExternalLink size={20} />}</div>
      <section>
        <span>{card.platform || detectPlatform(card.url)}</span>
        <strong>{card.title || card.url}</strong>
        <p>{card.description || t.open}</p>
      </section>
    </a>
  )
}

function PhotosPanel({ workspace, commit, t }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')

  const addPhoto = async (event) => {
    event.preventDefault()
    if (!url.trim()) return
    await commit((draft) => {
      draft.photos = [
        {
          id: createClientId(),
          title: title.trim() || '照片',
          url: url.trim(),
          note: note.trim(),
          createdAt: new Date().toISOString(),
        },
        ...(draft.photos || []),
      ]
      return draft
    })
    setTitle('')
    setUrl('')
    setNote('')
  }

  const uploadFile = async (file) => {
    if (!file) return
    const dataUrl = await readFileAsDataUrl(file)
    setUrl(dataUrl)
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''))
  }

  return (
    <div className="tool-panel">
      <form className="stack-form" onSubmit={addPhoto}>
        <div className="two-fields">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.photoTitle} />
          <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder={t.photoUrl} />
        </div>
        <div className="two-fields">
          <input value={note} onChange={(event) => setNote(event.target.value)} placeholder={t.photoNote} />
          <label className="file-pick">
            <Upload size={16} />
            {t.photoUrl}
            <input accept="image/*" onChange={(event) => uploadFile(event.target.files?.[0])} type="file" />
          </label>
        </div>
        <button type="submit">
          <Plus size={18} />
          {t.add}
        </button>
      </form>
      <div className="photo-grid">
        {(workspace.photos || []).map((photo) => (
          <article className="photo-card" key={photo.id}>
            <img alt="" src={photo.url} />
            <div>
              <strong>{photo.title}</strong>
              <p>{photo.note || ' '}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function FortunePanel({ workspace, commit, t }) {
  const [question, setQuestion] = useState('')
  const meta = getDateMeta(todayString())
  const fortune = workspace.fortune || { notes: [] }

  const addNote = async (event) => {
    event.preventDefault()
    if (!question.trim()) return
    await commit((draft) => {
      draft.fortune = draft.fortune || { notes: [] }
      draft.fortune.notes.unshift({
        id: createClientId(),
        question: question.trim(),
        answer: makeFortuneAnswer(question, meta),
        createdAt: new Date().toISOString(),
      })
      return draft
    })
    setQuestion('')
  }

  return (
    <div className="fortune-layout">
      <section className="tool-panel">
        <span className="eyebrow">
          <Wand2 size={18} />
          {t.fortune}
        </span>
        <h2>{t.lunar} {meta.lunar}</h2>
        <p>{[meta.holiday, ...meta.festivals, ...meta.terms].filter(Boolean).join(' · ') || '今天宜轻松安排'}</p>
        <form className="inline-form" onSubmit={addNote}>
          <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="今天适合做什么？" />
          <button type="submit">
            <Sparkles size={18} />
            {t.add}
          </button>
        </form>
      </section>
      <div className="card-grid">
        {(fortune.notes || []).map((item) => (
          <article className="study-card" key={item.id}>
            <span>{formatShortTime(item.createdAt)}</span>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

function PlayPanel({ workspace, commit, session, setRoute, t }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const miniProps = { workspace, commit, session, t }

  const openGame = (game) => {
    window.history.pushState({}, '', `/game/${game.id}`)
    setRoute(readRoute())
  }

  const create = async () => {
    setBusy(true)
    setError('')
    try {
      const data = await createGame()
      openGame(data.game)
    } catch (createError) {
      setError(createError.message)
    } finally {
      setBusy(false)
    }
  }

  const join = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const data = await joinGame(code)
      openGame(data.game)
    } catch (joinError) {
      setError(joinError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="play-hub">
      <div className="play-panel">
        <section className="play-hero">
          <Plane size={42} />
          <h2>谕皇大帝</h2>
          <p>一起玩的板块。飞行棋是正式对局，小厨房和猜题是随手玩两分钟的。</p>
          <button className="primary-button" onClick={create} disabled={busy}>
            <Plus size={18} />
            {t.createGame}
          </button>
        </section>
        <section className="tool-panel compact-panel">
          <form className="stack-form" onSubmit={join}>
            <input value={code} onChange={(event) => setCode(event.target.value)} placeholder={t.roomCode} autoCapitalize="characters" />
            <button type="submit" disabled={busy}>
              <Users size={18} />
              {t.joinGame}
            </button>
          </form>
          {error ? <p className="form-error">{error}</p> : null}
        </section>
      </div>
      <div className="mini-game-grid">
        <KitchenGame {...miniProps} />
        <DrawGuessGame {...miniProps} />
        <WordChainGame {...miniProps} />
        <RiddleGame {...miniProps} />
      </div>
    </div>
  )
}

function KitchenGame({ workspace, commit, session, t }) {
  const [, setTick] = useState(Date.now())
  const kitchen = workspace.miniGames?.kitchen || { menu: [], orders: [], score: 0 }

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const startDish = async (dish) => {
    await commit((draft) => {
      draft.miniGames.kitchen.orders.unshift({
        id: createClientId(),
        name: dish.name,
        points: dish.points,
        by: session.user.displayName,
        readyAt: new Date(Date.now() + dish.seconds * 1000).toISOString(),
        served: false,
      })
      return draft
    })
  }

  const serveDish = async (orderId) => {
    await commit((draft) => {
      const order = draft.miniGames.kitchen.orders.find((item) => item.id === orderId)
      if (order && !order.served) {
        order.served = true
        draft.miniGames.kitchen.score += order.points || 1
      }
      return draft
    })
  }

  return (
    <section className="mini-game-card kitchen-card">
      <span className="eyebrow">
        <Utensils size={17} />
        {t.kitchen}
      </span>
      <h3>{kitchen.score} 分</h3>
      <div className="menu-row">
        {kitchen.menu.map((dish) => (
          <button key={dish.id} onClick={() => startDish(dish)}>
            {dish.name}
            <small>{dish.seconds}s</small>
          </button>
        ))}
      </div>
      <div className="order-list">
        {kitchen.orders.slice(0, 5).map((order) => {
          const left = Math.max(0, Math.ceil((new Date(order.readyAt) - Date.now()) / 1000))
          const ready = left === 0
          return (
            <article className={order.served ? 'served' : ready ? 'ready' : ''} key={order.id}>
              <strong>{order.name}</strong>
              <span>{order.served ? t.done : ready ? t.ready : `${t.cooking} ${left}s`}</span>
              {!order.served && ready ? (
                <button onClick={() => serveDish(order.id)}>
                  <Check size={15} />
                  {t.serve}
                </button>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function DrawGuessGame({ workspace, commit, session, t }) {
  const [guess, setGuess] = useState('')
  const game = workspace.miniGames?.drawGuess || { prompt: '', guesses: [] }
  const prompts = ['猫咪开飞机', '会跳舞的奶茶', '下雨天的火锅', '生气的闹钟', '戴墨镜的月亮']

  const nextPrompt = async () => {
    await commit((draft) => {
      const current = draft.miniGames.drawGuess.prompt
      const next = prompts[(prompts.indexOf(current) + 1 + prompts.length) % prompts.length]
      draft.miniGames.drawGuess.prompt = next
      draft.miniGames.drawGuess.drawer = session.user.displayName
      draft.miniGames.drawGuess.guesses = []
      return draft
    })
  }

  const submitGuess = async (event) => {
    event.preventDefault()
    if (!guess.trim()) return
    await commit((draft) => {
      draft.miniGames.drawGuess.guesses.unshift({
        id: createClientId(),
        by: session.user.displayName,
        text: guess.trim(),
        createdAt: new Date().toISOString(),
      })
      return draft
    })
    setGuess('')
  }

  return (
    <section className="mini-game-card">
      <span className="eyebrow">
        <PencilLine size={17} />
        {t.drawGuess}
      </span>
      <h3>{game.prompt}</h3>
      <div className="doodle-box">
        <PencilLine size={34} />
        <span>画在纸上，答案在这里同步</span>
      </div>
      <form className="mini-form" onSubmit={submitGuess}>
        <input value={guess} onChange={(event) => setGuess(event.target.value)} placeholder={t.guess} />
        <button type="submit">
          <Send size={15} />
        </button>
      </form>
      <button onClick={nextPrompt}>{t.nextQuestion}</button>
      <div className="mini-log">
        {game.guesses.slice(0, 3).map((item) => (
          <p key={item.id}>{item.by}: {item.text}</p>
        ))}
      </div>
    </section>
  )
}

function WordChainGame({ workspace, commit, session, t }) {
  const [word, setWord] = useState('')
  const game = workspace.miniGames?.wordChain || { current: '', history: [] }

  const submitWord = async (event) => {
    event.preventDefault()
    if (!word.trim()) return
    await commit((draft) => {
      draft.miniGames.wordChain.current = word.trim()
      draft.miniGames.wordChain.history.unshift(`${session.user.displayName}: ${word.trim()}`)
      return draft
    })
    setWord('')
  }

  return (
    <section className="mini-game-card">
      <span className="eyebrow">
        <Brain size={17} />
        {t.wordChain}
      </span>
      <h3>{game.current}</h3>
      <form className="mini-form" onSubmit={submitWord}>
        <input value={word} onChange={(event) => setWord(event.target.value)} placeholder={t.guess} />
        <button type="submit">
          <Send size={15} />
        </button>
      </form>
      <div className="mini-log">
        {game.history.slice(0, 5).map((item, index) => (
          <p key={`${item}-${index}`}>{item}</p>
        ))}
      </div>
    </section>
  )
}

function RiddleGame({ workspace, commit, session, t }) {
  const [guess, setGuess] = useState('')
  const game = workspace.miniGames?.riddle || { question: '', answer: '', revealed: false, guesses: [] }
  const riddles = [
    { question: '什么东西越洗越脏？', answer: '水' },
    { question: '什么门永远关不上？', answer: '球门' },
    { question: '什么东西越生气越大？', answer: '脾气' },
    { question: '什么东西明明是你的，别人用得最多？', answer: '名字' },
  ]

  const submitGuess = async (event) => {
    event.preventDefault()
    if (!guess.trim()) return
    await commit((draft) => {
      draft.miniGames.riddle.guesses.unshift(`${session.user.displayName}: ${guess.trim()}`)
      return draft
    })
    setGuess('')
  }

  const next = async () => {
    await commit((draft) => {
      const index = riddles.findIndex((item) => item.question === draft.miniGames.riddle.question)
      const nextItem = riddles[(index + 1 + riddles.length) % riddles.length]
      draft.miniGames.riddle = { ...nextItem, revealed: false, guesses: [] }
      return draft
    })
  }

  return (
    <section className="mini-game-card">
      <span className="eyebrow">
        <Smile size={17} />
        {t.riddle}
      </span>
      <h3>{game.question}</h3>
      <p className="answer-line">{game.revealed ? game.answer : '•••'}</p>
      <form className="mini-form" onSubmit={submitGuess}>
        <input value={guess} onChange={(event) => setGuess(event.target.value)} placeholder={t.guess} />
        <button type="submit">
          <Send size={15} />
        </button>
      </form>
      <div className="mini-actions">
        <button onClick={() => commit((draft) => {
          draft.miniGames.riddle.revealed = !draft.miniGames.riddle.revealed
          return draft
        })}>{t.reveal}</button>
        <button onClick={next}>{t.nextQuestion}</button>
      </div>
      <div className="mini-log">
        {game.guesses.slice(0, 3).map((item, index) => (
          <p key={`${item}-${index}`}>{item}</p>
        ))}
      </div>
    </section>
  )
}

function GameRoom({ gameId, session, setRoute, t }) {
  const [game, setGame] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const data = await getGame(gameId)
      setGame(data.game)
      setError('')
    } catch (refreshError) {
      setError(refreshError.message)
    }
  }, [gameId])

  useEffect(() => {
    refresh()
    const timer = window.setInterval(refresh, 900)
    const localSync = () => refresh()
    window.addEventListener('yhd-local-sync', localSync)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('yhd-local-sync', localSync)
    }
  }, [refresh])

  const act = async (runner) => {
    setBusy(true)
    setError('')
    try {
      const data = await runner()
      setGame(data.game)
    } catch (actionError) {
      setError(actionError.message)
    } finally {
      setBusy(false)
    }
  }

  const copyInvite = async () => {
    const link = `${window.location.origin}/game/${game.id}`
    await navigator.clipboard.writeText(`${t.appName}\n${t.roomCode}: ${game.code}\n${link}`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  const back = () => {
    window.history.pushState({}, '', '/')
    setRoute(readRoute())
  }

  const currentPlayer = game?.players[game.turnIndex]
  const myPlayer = game?.players.find((player) => player.id === session.user.id)
  const legalPieces = game && myPlayer ? getLegalPieces(game, session.user.id) : []
  const isMyTurn = currentPlayer?.id === session.user.id

  if (!game) {
    return (
      <section className="loading-panel">
        <RefreshCw className="spin" size={26} />
        <p>{t.checking}</p>
      </section>
    )
  }

  return (
    <section className="game-layout">
      <div className="game-main">
        <div className="game-title-row">
          <div>
            <span className="eyebrow">
              <Gamepad2 size={18} />
              {game.status === 'waiting' ? t.waiting : game.status === 'finished' ? t.finished : t.playing}
            </span>
            <h2>{game.title}</h2>
            <p>
              {t.roomCode} {game.code} · {game.players.length}/4
            </p>
          </div>
          <div className="room-tools">
            <button onClick={copyInvite}>
              {copied ? <Sparkles size={17} /> : <Share2 size={17} />}
              {copied ? 'OK' : t.invite}
            </button>
            <button onClick={back}>{t.lobby}</button>
          </div>
        </div>
        <FlightBoard game={game} activeUserId={session.user.id} legalPieces={legalPieces} onMove={(pieceId) => act(() => movePiece(game.id, pieceId))} />
      </div>

      <aside className="control-panel">
        <section className="turn-card">
          <span className="eyebrow">
            <Crown size={17} />
            {t.turn}
          </span>
          <h3>{currentPlayer ? `${currentPlayer.emoji} ${currentPlayer.displayName}` : t.waiting}</h3>
          <p>
            {game.status === 'waiting'
              ? t.waiting
              : game.status === 'finished'
                ? `${winnerName(game)} ${t.won}`
                : isMyTurn
                  ? t.yourTurn
                  : t.waitOther}
          </p>
          <div className="dice-box">
            <Dice5 size={28} />
            <strong>{game.dice || '-'}</strong>
          </div>
          <button
            className="primary-button wide"
            disabled={!isMyTurn || Boolean(game.dice) || game.status !== 'playing' || busy}
            onClick={() => act(() => rollDice(game.id))}
          >
            <Dice5 size={18} />
            {t.roll}
          </button>
          <button className="ghost-button wide" disabled={busy} onClick={() => act(() => restartGame(game.id))}>
            <RotateCcw size={18} />
            {t.restart}
          </button>
          {error ? <p className="form-error">{error}</p> : null}
        </section>

        <section className="players-card">
          <span className="eyebrow">
            <Users size={17} />
            {t.players}
          </span>
          <div className="player-list">
            {game.players.map((player, index) => (
              <div className={`player-row ${currentPlayer?.id === player.id ? 'active' : ''}`} key={player.id}>
                <span className={`color-token ${player.color}`}>{player.emoji}</span>
                <div>
                  <strong>{player.displayName}</strong>
                  <p>{index === game.turnIndex ? t.turn : `${finishedCount(game, player.id)}/4`}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="log-card">
          <span className="eyebrow">
            <Trophy size={17} />
            {t.log}
          </span>
          <div className="log-list">
            {game.log.slice(0, 8).map((entry, index) => (
              <p key={`${entry}-${index}`}>{entry}</p>
            ))}
          </div>
        </section>
      </aside>
    </section>
  )
}

function FlightBoard({ game, activeUserId, legalPieces, onMove }) {
  const cellMap = useMemo(() => buildBoardCellMap(game), [game])
  const legalIds = new Set(legalPieces.map((piece) => piece.id))

  return (
    <div className="board-wrap">
      <div className="flight-board" aria-label="飞行棋棋盘">
        {Array.from({ length: boardSize * boardSize }).map((_, flatIndex) => {
          const row = Math.floor(flatIndex / boardSize)
          const col = flatIndex % boardSize
          const key = `${row},${col}`
          const cell = cellMap.get(key)
          const isCenter = row >= 6 && row <= 8 && col >= 6 && col <= 8
          return (
            <div className={`board-cell ${cell?.type || ''} ${cell?.color || ''} ${isCenter ? 'center' : ''}`} key={key}>
              {isCenter && row === 7 && col === 7 ? <Crown size={26} /> : null}
              {cell?.pieces?.map(({ piece, player }) => {
                const canMove = player.id === activeUserId && legalIds.has(piece.id)
                return (
                  <button
                    aria-label={`${player.displayName} ${piece.index + 1}`}
                    className={`plane-piece ${player.color} ${canMove ? 'movable' : ''}`}
                    disabled={!canMove}
                    key={piece.id}
                    onClick={() => onMove(piece.id)}
                  >
                    {player.emoji}
                    <small>{piece.index + 1}</small>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
      <div className="board-caption">
        <span>
          <Plane size={16} />
          6 起飞
        </span>
        <span>
          <Trophy size={16} />
          4 架到终点
        </span>
      </div>
    </div>
  )
}

function buildBoardCellMap(game) {
  const map = new Map()
  trackCoords.forEach(([row, col], index) => {
    map.set(`${row},${col}`, { type: 'track', index, pieces: [] })
  })
  Object.entries(homeCoords).forEach(([color, coords]) => {
    coords.forEach(([row, col]) => {
      map.set(`${row},${col}`, { type: 'home', color, pieces: [] })
    })
  })
  Object.entries(baseCoords).forEach(([color, coords]) => {
    coords.forEach(([row, col]) => {
      map.set(`${row},${col}`, { type: 'base', color, pieces: [] })
    })
  })

  game.players.forEach((player) => {
    ;(game.pieces[player.id] || []).forEach((piece) => {
      let coords
      if (piece.position === -1) coords = baseCoords[player.color][piece.index]
      else if (piece.position < trackLength) coords = trackCoords[toGlobalPosition(player.color, piece.position)]
      else if (piece.position < trackLength + homeLength) coords = homeCoords[player.color][piece.position - trackLength]
      else coords = [7, 7]
      const key = `${coords[0]},${coords[1]}`
      if (!map.has(key)) map.set(key, { type: 'center', pieces: [] })
      map.get(key).pieces.push({ piece, player })
    })
  })
  return map
}

function buildTrackCoords() {
  const coords = []
  for (let col = 0; col < boardSize; col += 1) coords.push([0, col])
  for (let row = 1; row < boardSize; row += 1) coords.push([row, boardSize - 1])
  for (let col = boardSize - 2; col >= 0; col -= 1) coords.push([boardSize - 1, col])
  for (let row = boardSize - 2; row > 0; row -= 1) coords.push([row, 0])
  return coords
}

function readRoute() {
  const parts = window.location.pathname.split('/').filter(Boolean)
  return { gameId: parts[0] === 'game' ? parts[1] : null }
}

function winnerName(game) {
  return game.players.find((player) => player.id === game.winnerId)?.displayName || 'Winner'
}

function finishedCount(game, playerId) {
  return (game.pieces[playerId] || []).filter((piece) => piece.position >= trackLength + homeLength).length
}

function countForList(tasks, list) {
  if (list === 'all') return tasks.length
  if (list === 'important') return tasks.filter((task) => task.important).length
  return tasks.filter((task) => task.list === list).length
}

function todayString(offsetDays = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

function dateDistance(dateString) {
  if (!dateString) return ''
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(`${dateString}T00:00:00`)
  const diff = Math.round((date - today) / 86400000)
  if (diff === 0) return 'today'
  if (diff > 0) return `${diff}d left`
  return `${Math.abs(diff)}d ago`
}

function eventDistance(event) {
  if (!event?.date) return ''
  if (event.type !== 'anniversary' && event.type !== 'birthday') return dateDistance(event.date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const source = new Date(`${event.date}T00:00:00`)
  const next = new Date(today.getFullYear(), source.getMonth(), source.getDate())
  if (next < today) next.setFullYear(next.getFullYear() + 1)
  const diff = Math.round((next - today) / 86400000)
  if (diff === 0) return 'today'
  return `${diff}d left`
}

function formatReminder(value) {
  const minutes = Number(value || 0)
  if (!minutes) return '不提醒'
  if (minutes >= 1440) return `${Math.round(minutes / 1440)}天前`
  if (minutes >= 60) return `${Math.round(minutes / 60)}小时前`
  return `${minutes}分钟前`
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function makeFortuneAnswer(question, meta) {
  const tags = [meta.holiday, ...meta.festivals, ...meta.terms].filter(Boolean)
  const dayText = tags.length ? tags.join('、') : `农历${meta.lunar}`
  if (question.includes('约会') || question.includes('见面')) return `${dayText}，适合把安排做轻一点，留点余地给聊天和吃饭。`
  if (question.includes('学习') || question.includes('deadline')) return `${dayText}，适合先定一段 25 分钟，把最卡的点写出来。`
  return `${dayText}，今天宜少一点解释，多一点同步。这个只是趣味提示，不做严肃判断。`
}

function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

function formatShortTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function detectPlatform(url) {
  const host = safeHost(url)
  if (host.includes('instagram')) return 'Instagram'
  if (host.includes('douyin')) return 'Douyin'
  if (host.includes('xiaohongshu') || host.includes('xhslink')) return 'Xiaohongshu'
  if (host.includes('tiktok')) return 'TikTok'
  if (host.includes('youtube') || host.includes('youtu.be')) return 'YouTube'
  return host || 'Link'
}

function safeHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function createClientId() {
  return crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)
}

export default App
