import {
  AlarmClock,
  BookOpen,
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
  Pause,
  Plane,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  TimerReset,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  clearSession,
  colors,
  createGame,
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
  restartGame,
  rollDice,
  saveLocale,
  saveSession,
  saveWorkspace,
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
    authTitle: '把今天、学习、链接和小游戏放在一起。',
    authText: '注册账号后就能保存任务、倒数日、外链卡片，也能开一局飞行棋。',
    register: '注册',
    login: '登录',
    displayName: '昵称',
    account: '账号',
    password: '密码',
    enter: '进入',
    cloud: '云端同步',
    local: '本地演示',
    checking: '检查中',
    logout: '退出',
    plan: '计划',
    study: '学习',
    focus: '番茄钟',
    dates: '倒数日',
    links: '链接',
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
    authTitle: '今日、學習、連結同小遊戲，放埋一齊。',
    authText: '註冊之後可以存任務、倒數日、外鏈卡片，亦可以開局飛行棋。',
    register: '註冊',
    login: '登入',
    displayName: '暱稱',
    account: '帳號',
    password: '密碼',
    enter: '入去',
    cloud: '雲端同步',
    local: '本機示範',
    checking: '檢查中',
    logout: '登出',
    plan: '計劃',
    study: '學習',
    focus: '番茄鐘',
    dates: '倒數日',
    links: '連結',
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
    enter: 'Enter',
    cloud: 'Cloud sync',
    local: 'Local demo',
    checking: 'Checking',
    logout: 'Logout',
    plan: 'Plan',
    study: 'Study',
    focus: 'Timer',
    dates: 'Dates',
    links: 'Links',
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
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const payload = { username, password, displayName }
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
    const localSync = () => refresh()
    window.addEventListener('yhd-local-sync', localSync)
    return () => {
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

  const addTask = (event) => {
    event.preventDefault()
    if (!title.trim()) return
    commit((draft) => {
      draft.tasks.unshift({
        id: createClientId(),
        title: title.trim(),
        list,
        dueDate,
        done: false,
        important: list === 'important',
        createdAt: new Date().toISOString(),
      })
      return draft
    })
    setTitle('')
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

  const addStudy = (event) => {
    event.preventDefault()
    if (!title.trim()) return
    commit((draft) => {
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

  const setMinutes = (value) => {
    const minutes = Number(value)
    commit((draft) => {
      draft.timer.focusMinutes = minutes
      return draft
    })
    setSecondsLeft(minutes * 60)
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
          <input value={workspace.timer.focusMinutes} min="5" max="90" onChange={(event) => setMinutes(event.target.value)} type="number" />
        </label>
        <label>
          {t.breakLabel}
          <input
            value={workspace.timer.breakMinutes}
            min="3"
            max="30"
            onChange={(event) =>
              commit((draft) => {
                draft.timer.breakMinutes = Number(event.target.value)
                return draft
              })
            }
            type="number"
          />
        </label>
        <div className="stat-tile">
          <span>{t.sessions}</span>
          <strong>{workspace.timer.sessions}</strong>
        </div>
      </section>
    </div>
  )
}

function DatesPanel({ workspace, commit, t }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayString(7))
  const [type, setType] = useState('countdown')

  const addDate = (event) => {
    event.preventDefault()
    if (!title.trim()) return
    commit((draft) => {
      draft.dates.unshift({
        id: createClientId(),
        title: title.trim(),
        date,
        type,
        note: '',
        createdAt: new Date().toISOString(),
      })
      return draft
    })
    setTitle('')
  }

  return (
    <div className="tool-panel">
      <form className="inline-form" onSubmit={addDate}>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.dateTitle} />
        <input value={date} onChange={(event) => setDate(event.target.value)} type="date" />
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="countdown">{t.countdown}</option>
          <option value="anniversary">{t.anniversary}</option>
          <option value="deadline">Deadline</option>
        </select>
        <button type="submit">
          <Plus size={18} />
          {t.add}
        </button>
      </form>
      <div className="date-grid">
        {workspace.dates.map((item) => (
          <article className="date-card" key={item.id}>
            <span>{item.type}</span>
            <h3>{item.title}</h3>
            <strong>{dateDistance(item.date) || item.date}</strong>
            <p>{item.date}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

function LinksPanel({ workspace, commit, t }) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [busyId, setBusyId] = useState('')

  const addLink = async (event) => {
    event.preventDefault()
    if (!url.trim()) return
    const baseCard = {
      id: createClientId(),
      url: url.trim(),
      title: title.trim() || detectPlatform(url),
      note: note.trim(),
      platform: detectPlatform(url),
      summary: '',
      image: '',
      description: '',
      createdAt: new Date().toISOString(),
    }
    await commit((draft) => {
      draft.links = [baseCard, ...(draft.links || [])]
      return draft
    })
    setUrl('')
    setTitle('')
    setNote('')

    setBusyId(baseCard.id)
    try {
      const data = await previewLink(baseCard.url)
      await commit((draft) => {
        const item = draft.links?.find((candidate) => candidate.id === baseCard.id)
        if (item) Object.assign(item, data.card)
        return draft
      })
    } finally {
      setBusyId('')
    }
  }

  const runSummary = async (card) => {
    setBusyId(card.id)
    try {
      const data = await summarizeLink(card)
      await commit((draft) => {
        const item = draft.links?.find((candidate) => candidate.id === card.id)
        if (item) item.summary = data.summary
        return draft
      })
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="tool-panel">
      <form className="stack-form" onSubmit={addLink}>
        <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder={t.linkUrl} />
        <div className="two-fields">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.linkTitle} />
          <input value={note} onChange={(event) => setNote(event.target.value)} placeholder={t.note} />
        </div>
        <button type="submit">
          <Plus size={18} />
          {t.add}
        </button>
      </form>
      <div className="link-grid">
        {(workspace.links || []).map((card) => (
          <article className="link-card" key={card.id}>
            <div className="link-thumb">
              {card.image ? <img alt="" src={card.image} /> : <Search size={28} />}
            </div>
            <div className="link-body">
              <span>{card.platform || detectPlatform(card.url)}</span>
              <h3>{card.title || card.url}</h3>
              <p>{card.summary || card.description || card.note || ' '}</p>
              <div className="link-actions">
                <a href={card.url} rel="noreferrer" target="_blank">
                  <ExternalLink size={16} />
                  {t.open}
                </a>
                <button disabled={busyId === card.id} onClick={() => runSummary(card)}>
                  <Sparkles size={16} />
                  {busyId === card.id ? t.checking : t.summarize}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function PlayPanel({ setRoute, t }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

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
    <div className="play-panel">
      <section className="play-hero">
        <Plane size={42} />
        <h2>谕皇大帝</h2>
        <p>一起玩的板块。先放飞行棋，后面还能继续加别的小游戏。</p>
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
