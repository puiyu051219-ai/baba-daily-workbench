import {
  ArrowLeftRight,
  BookOpen,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  Circle,
  CircleDot,
  ClipboardList,
  Clock,
  Coffee,
  Copy,
  Gamepad2,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Hotel,
  Link as LinkIcon,
  Lock,
  Map,
  MessageCircle,
  Plane,
  Plus,
  RefreshCw,
  Share2,
  Sparkles,
  Star,
  Timer,
  Users,
  Vote,
  WalletCards,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  cloneState,
  createRoomSnapshot,
  isSupabaseConfigured,
  joinRoomByInvite,
  loadRoomSnapshot,
  profileIds,
  saveRoomSnapshot,
  subscribeToRoom,
} from './roomStore.js'

const viewConfig = [
  { id: 'today', label: '今天', icon: Home, path: '' },
  { id: 'study', label: '学习', icon: BookOpen, path: '' },
  { id: 'trip', label: '旅行', icon: Map, path: 'trip' },
  { id: 'play', label: '一起玩', icon: Gamepad2, path: 'play' },
]

const voteLabels = {
  must: '必去',
  maybe: '可去',
  skip: '不去',
}

const statusLabels = {
  open: '待确认',
  done: '完成',
  next: '下一步',
}

function getRoute() {
  const segments = window.location.pathname.split('/').filter(Boolean)
  if (segments[0] !== 'room') return { mode: 'home', roomId: null, view: 'today' }
  const view = segments[2] === 'trip' ? 'trip' : segments[2] === 'play' ? 'play' : 'today'
  return { mode: 'room', roomId: segments[1], view }
}

function getSavedProfileId() {
  return localStorage.getItem('lumiday:active-profile') || profileIds.primary
}

function useRoom(roomId) {
  const [state, setState] = useState(null)
  const [status, setStatus] = useState({ phase: 'loading', message: '正在打开房间' })

  useEffect(() => {
    let alive = true
    setStatus({ phase: 'loading', message: '正在打开房间' })
    loadRoomSnapshot(roomId)
      .then((snapshot) => {
        if (!alive) return
        setState(snapshot)
        setStatus({
          phase: 'ready',
          message: isSupabaseConfigured ? '实时同步已连接' : '本地演示同步',
        })
      })
      .catch((error) => {
        if (!alive) return
        setStatus({ phase: 'error', message: error.message })
      })

    return () => {
      alive = false
    }
  }, [roomId])

  useEffect(() => {
    if (!roomId) return undefined
    return subscribeToRoom(roomId, (nextState) => {
      setState(nextState)
      setStatus({
        phase: 'ready',
        message: isSupabaseConfigured ? '刚刚同步更新' : '本地演示同步',
      })
    })
  }, [roomId])

  const commit = useCallback((producer) => {
    setState((current) => {
      if (!current) return current
      const draft = cloneState(current)
      const next = producer(draft) || draft
      saveRoomSnapshot(next).catch((error) => {
        setStatus({ phase: 'error', message: error.message })
      })
      return next
    })
  }, [])

  return { state, status, commit }
}

function HomeScreen() {
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const createRoom = async () => {
    setBusy(true)
    setError('')
    try {
      const snapshot = await createRoomSnapshot()
      window.location.href = `/room/${snapshot.room.id}`
    } catch (createError) {
      setError(createError.message)
    } finally {
      setBusy(false)
    }
  }

  const joinRoom = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const snapshot = await joinRoomByInvite(inviteCode)
      if (!snapshot) {
        setError('没有找到这个邀请码')
        return
      }
      window.location.href = `/room/${snapshot.room.id}`
    } catch (joinError) {
      setError(joinError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="home-screen">
      <section className="home-hero">
        <div className="brand-lockup">
          <span className="brand-icon">
            <Heart size={26} />
          </span>
          <div>
            <p>LumiDay</p>
            <h1>今天有你</h1>
          </div>
        </div>
        <div className="home-copy">
          <h2>一个给她先用的实时生活副驾</h2>
          <p>今天怎么安排、学什么、去哪玩、要不要来个小默契测试，都放在一个轻轻的房间里。</p>
        </div>
      </section>

      <section className="home-panel" aria-label="创建或加入房间">
        <div className="panel-heading">
          <Sparkles size={20} />
          <div>
            <h2>开始一个房间</h2>
            <p>{isSupabaseConfigured ? 'Supabase 实时同步已启用' : '当前是本地演示模式'}</p>
          </div>
        </div>
        <button className="primary-button wide" onClick={createRoom} disabled={busy}>
          <Plus size={18} />
          创建情侣房间
        </button>
        <form className="join-form" onSubmit={joinRoom}>
          <input
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
            placeholder="输入邀请码，例如 LUMI52"
            aria-label="邀请码"
          />
          <button type="submit" disabled={busy}>
            加入
          </button>
        </form>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="home-proof">
          <span>
            <Wifi size={16} />
            实时房间
          </span>
          <span>
            <Lock size={16} />
            轻私人
          </span>
          <span>
            <Gamepad2 size={16} />
            可互动
          </span>
        </div>
      </section>
    </main>
  )
}

function App() {
  const [route, setRoute] = useState(getRoute)

  useEffect(() => {
    const handlePop = () => setRoute(getRoute())
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  if (route.mode === 'home') return <HomeScreen />

  return <RoomScreen roomId={route.roomId} initialView={route.view} onRouteChange={setRoute} />
}

function RoomScreen({ roomId, initialView, onRouteChange }) {
  const { state, status, commit } = useRoom(roomId)
  const [activeView, setActiveView] = useState(initialView)
  const [activeProfileId, setActiveProfileId] = useState(getSavedProfileId)
  const [newCard, setNewCard] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setActiveView(initialView)
  }, [initialView])

  useEffect(() => {
    localStorage.setItem('lumiday:active-profile', activeProfileId)
  }, [activeProfileId])

  const profiles = state?.profiles ?? []
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0]
  const partnerProfile =
    profiles.find((profile) => profile.id !== activeProfile?.id) ?? profiles[1] ?? profiles[0]

  const roomLink = state ? `${window.location.origin}/room/${state.room.id}` : ''

  const navigate = (viewId) => {
    if (!state) return
    const config = viewConfig.find((item) => item.id === viewId)
    const path = config?.path ? `/room/${state.room.id}/${config.path}` : `/room/${state.room.id}`
    window.history.pushState({}, '', path)
    setActiveView(viewId)
    onRouteChange(getRoute())
  }

  const copyRoom = async () => {
    if (!state) return
    const text = `LumiDay 今天有你\n链接：${roomLink}\n邀请码：${state.room.inviteCode}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const addTodayCard = (event) => {
    event.preventDefault()
    const value = newCard.trim()
    if (!value) return
    commit((draft) => {
      draft.todayCards.unshift({
        id: `today-${Date.now()}`,
        kind: 'todo',
        title: value,
        body: '刚刚加进来的共同小任务。',
        timeLabel: '今天',
        ownerId: activeProfileId,
        status: 'open',
        votes: { [activeProfileId]: true },
      })
    })
    setNewCard('')
  }

  if (status.phase === 'loading' || !state) {
    return (
      <main className="loading-screen">
        <RefreshCw className="spin" size={28} />
        <p>{status.message}</p>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <section className="hero-band">
        <div className="hero-overlay">
          <div className="hero-top">
            <div className="brand-lockup compact">
              <span className="brand-icon">
                <Heart size={23} />
              </span>
              <div>
                <p>LumiDay</p>
                <h1>今天有你</h1>
              </div>
            </div>
            <div className={`sync-pill ${isSupabaseConfigured ? 'online' : 'local'}`}>
              {isSupabaseConfigured ? <Wifi size={16} /> : <WifiOff size={16} />}
              {status.message}
            </div>
          </div>
          <div className="hero-main">
            <div>
              <span className="date-pill">
                <CalendarDays size={16} />
                {state.room.dateLabel}
              </span>
              <h2>{state.room.subtitle}</h2>
              <p>把今天、学习、旅行和小游戏放进同一个房间。不是管理她，是让她被认真照顾到。</p>
            </div>
            <div className="room-actions" aria-label="房间操作">
              <button onClick={copyRoom}>
                {copied ? <Check size={17} /> : <Share2 size={17} />}
                {copied ? '已复制' : '发给她'}
              </button>
              <span>
                <LinkIcon size={15} />
                {state.room.inviteCode}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="workspace-grid">
        <aside className="side-rail">
          <section className="rail-section">
            <div className="section-kicker">
              <Users size={17} />
              当前身份
            </div>
            <div className="profile-switcher">
              {profiles.map((profile) => (
                <button
                  className={profile.id === activeProfileId ? 'profile-button active' : 'profile-button'}
                  key={profile.id}
                  onClick={() => setActiveProfileId(profile.id)}
                >
                  <span style={{ background: profile.color }}>{profile.avatar}</span>
                  <strong>{profile.name}</strong>
                </button>
              ))}
            </div>
          </section>

          <section className="rail-section">
            <div className="profile-card">
              <span className="avatar-large" style={{ background: activeProfile?.color }}>
                {activeProfile?.avatar}
              </span>
              <div>
                <p>{activeProfile?.name}</p>
                <h3>{activeProfile?.mood}</h3>
                <span>{activeProfile?.note}</span>
              </div>
            </div>
          </section>

          <section className="rail-section">
            <div className="section-kicker">
              <Heart size={17} />
              轻私人边界
            </div>
            <p className="rail-note">
              只记录安排、偏好和轻互动，不做深度关系分析，也不需要手机号登录。
            </p>
          </section>
        </aside>

        <section className="main-workspace">
          <nav className="module-tabs" aria-label="模块导航">
            {viewConfig.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  className={activeView === item.id ? 'active' : ''}
                  onClick={() => navigate(item.id)}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              )
            })}
          </nav>

          {activeView === 'today' || activeView === 'study' ? (
            <TodayView
              state={state}
              activeProfileId={activeProfileId}
              partnerProfile={partnerProfile}
              newCard={newCard}
              setNewCard={setNewCard}
              addTodayCard={addTodayCard}
              commit={commit}
              showStudy={activeView === 'study'}
            />
          ) : null}

          {activeView === 'trip' ? (
            <TripView state={state} activeProfileId={activeProfileId} commit={commit} />
          ) : null}

          {activeView === 'play' ? (
            <PlayView state={state} activeProfileId={activeProfileId} commit={commit} />
          ) : null}
        </section>
      </section>
    </main>
  )
}

function TodayView({
  state,
  activeProfileId,
  partnerProfile,
  newCard,
  setNewCard,
  addTodayCard,
  commit,
  showStudy,
}) {
  const openCards = state.todayCards.filter((card) => card.status !== 'done').length
  const mutualVotes = state.todayCards.filter(
    (card) => card.votes?.[profileIds.primary] && card.votes?.[profileIds.partner],
  ).length

  const toggleVote = (cardId) => {
    commit((draft) => {
      const card = draft.todayCards.find((item) => item.id === cardId)
      if (!card) return
      card.votes = { ...card.votes, [activeProfileId]: !card.votes?.[activeProfileId] }
    })
  }

  const toggleStatus = (cardId) => {
    commit((draft) => {
      const card = draft.todayCards.find((item) => item.id === cardId)
      if (!card) return
      card.status = card.status === 'done' ? 'open' : 'done'
    })
  }

  const updateStudy = (itemId, delta) => {
    commit((draft) => {
      const item = draft.studyItems.find((study) => study.id === itemId)
      if (!item) return
      item.progress = Math.max(0, Math.min(100, item.progress + delta))
      item.status = item.progress >= 100 ? 'done' : item.progress >= 60 ? 'next' : 'open'
    })
  }

  const setFocus = (minutes) => {
    commit((draft) => {
      draft.focusMinutes = minutes
    })
  }

  return (
    <>
      <section className="summary-strip" aria-label="今日摘要">
        <MetricCard icon={ClipboardList} label="今日卡片" value={`${openCards} 个待确认`} />
        <MetricCard icon={Heart} label="共同同意" value={`${mutualVotes} 个安排`} />
        <MetricCard icon={Timer} label="学习计时" value={`${state.focusMinutes} 分钟`} />
        <MetricCard icon={MessageCircle} label="低压力沟通" value="先选再聊" />
      </section>

      {!showStudy ? (
        <section className="content-section">
          <div className="section-title">
            <div>
              <CalendarDays size={20} />
              <h2>今天怎么安排</h2>
            </div>
            <p>所有安排先变成卡片，两个人用轻投票确认，不靠猜。</p>
          </div>

          <form className="quick-add" onSubmit={addTodayCard}>
            <input
              value={newCard}
              onChange={(event) => setNewCard(event.target.value)}
              placeholder="加一个今天的小安排"
            />
            <button type="submit">
              <Plus size={17} />
              添加
            </button>
          </form>

          <div className="today-grid">
            {state.todayCards.map((card) => (
              <article className={`today-card ${card.status === 'done' ? 'done' : ''}`} key={card.id}>
                <div className="card-topline">
                  <span>{card.timeLabel}</span>
                  <button onClick={() => toggleStatus(card.id)}>
                    {card.status === 'done' ? <Check size={16} /> : <Circle size={16} />}
                    {statusLabels[card.status] ?? '待确认'}
                  </button>
                </div>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
                <div className="vote-stack">
                  {state.profiles.map((profile) => (
                    <button
                      className={card.votes?.[profile.id] ? 'voted' : ''}
                      disabled={profile.id !== activeProfileId}
                      key={profile.id}
                      onClick={() => toggleVote(card.id)}
                    >
                      <span style={{ background: profile.color }}>{profile.avatar}</span>
                      {card.votes?.[profile.id] ? '想要' : '待选'}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="content-section">
          <div className="section-title">
            <div>
              <GraduationCap size={20} />
              <h2>学习陪跑</h2>
            </div>
            <p>学习不是堆资料，是把任务变成今天真的会发生的一小段。</p>
          </div>

          <div className="focus-band">
            <div>
              <span>
                <Timer size={16} />
                专注时间
              </span>
              <h3>{state.focusMinutes} 分钟</h3>
              <p>适合一起坐下来，各自做一件能完成的小任务。</p>
            </div>
            <div className="segmented-control">
              {[15, 25, 45].map((minutes) => (
                <button
                  className={state.focusMinutes === minutes ? 'active' : ''}
                  key={minutes}
                  onClick={() => setFocus(minutes)}
                >
                  {minutes}
                </button>
              ))}
            </div>
          </div>

          <div className="study-list">
            {state.studyItems.map((item) => (
              <article className="study-card" key={item.id}>
                <div className="card-topline">
                  <span>{item.course}</span>
                  <button onClick={() => updateStudy(item.id, 20)}>
                    <Check size={16} />
                    推进
                  </button>
                </div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <div className="progress-track" aria-label={`${item.title} 进度`}>
                  <i style={{ width: `${item.progress}%` }} />
                </div>
                <div className="ai-hint">
                  <Sparkles size={16} />
                  {item.aiHint}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {!showStudy ? (
        <section className="content-section split-section">
          <div className="soft-note">
            <Coffee size={22} />
            <h3>今晚建议</h3>
            <p>
              如果 {partnerProfile?.name} 今天累，就不要再塞第三个安排。选一个舒服的地方，把计划变成被照顾到的感觉。
            </p>
          </div>
          <div className="soft-note accent">
            <Camera size={22} />
            <h3>可拍视频角度</h3>
            <p>情侣旅行吵架，本质不是谁矫情，是需求没有被共同建模。</p>
          </div>
        </section>
      ) : null}
    </>
  )
}

function TripView({ state, activeProfileId, commit }) {
  const updateTripVote = (itemId, vote) => {
    commit((draft) => {
      const item = draft.tripItems.find((tripItem) => tripItem.id === itemId)
      if (!item) return
      item.voteBy = { ...item.voteBy, [activeProfileId]: vote }
      item.score = Object.values(item.voteBy).reduce(
        (score, value) => score + (value === 'must' ? 12 : value === 'maybe' ? 6 : 0),
        0,
      )
    })
  }

  const selectPlan = (planId) => {
    commit((draft) => {
      draft.tripPlans = draft.tripPlans.map((plan) => ({ ...plan, selected: plan.id === planId }))
    })
  }

  return (
    <>
      <section className="content-section">
        <div className="section-title">
          <div>
            <Plane size={20} />
            <h2>旅行共创</h2>
          </div>
          <p>路线、预算、酒店、拍照点先共同选择，减少到目的地才开始吵的概率。</p>
        </div>

        <div className="trip-layout">
          {state.tripItems.map((item) => (
            <article className="trip-card" key={item.id}>
              <img alt={item.name} src={item.image} />
              <div className="trip-card-body">
                <div className="card-topline">
                  <span>{item.city}</span>
                  <strong>{item.score} 分</strong>
                </div>
                <h3>{item.name}</h3>
                <p>{item.reason}</p>
                <div className="tag-row">
                  {item.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="vote-row" aria-label={`${item.name} 投票`}>
                  {Object.entries(voteLabels).map(([value, label]) => (
                    <button
                      className={item.voteBy?.[activeProfileId] === value ? 'active' : ''}
                      key={value}
                      onClick={() => updateTripVote(item.id, value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="section-title">
          <div>
            <Hotel size={20} />
            <h2>三套方案</h2>
          </div>
          <p>不是把景点堆满，而是把舒服、预算、照片和安全放进同一个选择里。</p>
        </div>

        <div className="plan-grid">
          {state.tripPlans.map((plan) => (
            <article className={`plan-card ${plan.selected ? 'selected' : ''}`} key={plan.id}>
              <div className="card-topline">
                <span>{plan.tagline}</span>
                <button onClick={() => selectPlan(plan.id)}>
                  {plan.selected ? <Check size={16} /> : <CircleDot size={16} />}
                  {plan.selected ? '已锁定' : '选择'}
                </button>
              </div>
              <h3>{plan.name}</h3>
              <div className="budget-line">
                <WalletCards size={18} />
                AUD {plan.budget}
              </div>
              <div className="day-chips">
                {plan.days.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

function PlayView({ state, activeProfileId, commit }) {
  const answerGame = (sessionId, answer) => {
    commit((draft) => {
      const session = draft.gameSessions.find((game) => game.id === sessionId)
      if (!session) return
      session.answers = { ...session.answers, [activeProfileId]: answer }
      const answeredCount = Object.keys(session.answers).length
      session.revealed = answeredCount >= draft.profiles.length
    })
  }

  const resetGame = (sessionId) => {
    commit((draft) => {
      const session = draft.gameSessions.find((game) => game.id === sessionId)
      if (!session) return
      session.answers = {}
      session.revealed = false
    })
  }

  return (
    <section className="content-section">
      <div className="section-title">
        <div>
          <Gamepad2 size={20} />
          <h2>一起玩</h2>
        </div>
        <p>小游戏不是幼稚，是把“你到底想什么”换成低压力选择题。</p>
      </div>

      <div className="game-grid">
        {state.gameSessions.map((session) => (
          <article className="game-card" key={session.id}>
            <div className="card-topline">
              <span>{session.title}</span>
              <button onClick={() => resetGame(session.id)}>
                <RefreshCw size={16} />
                重来
              </button>
            </div>
            <h3>{session.prompt}</h3>
            <div className="option-grid">
              {session.options.map((option) => (
                <button
                  className={session.answers?.[activeProfileId] === option ? 'selected' : ''}
                  key={option}
                  onClick={() => answerGame(session.id, option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="answer-board">
              {state.profiles.map((profile) => (
                <div key={profile.id}>
                  <span style={{ background: profile.color }}>{profile.avatar}</span>
                  <strong>{profile.name}</strong>
                  <p>{session.revealed ? session.answers?.[profile.id] || '还没答' : '已加密'}</p>
                </div>
              ))}
            </div>
            <div className="reward-line">
              <Gift size={16} />
              {session.revealed ? getGameResultText(session, state.profiles) : '双方都答完才揭晓'}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function getGameResultText(session, profiles) {
  const answers = profiles.map((profile) => session.answers?.[profile.id]).filter(Boolean)
  if (answers.length < profiles.length) return '还有人没答完'
  const sameAnswer = answers.every((answer) => answer === answers[0])
  return sameAnswer ? session.reward : '答案不同也很好，说明可以低压力聊一下差异。'
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <article className="metric-card">
      <Icon size={19} />
      <span>{label}</span>
      <strong>{value}</strong>
      <ChevronRight size={16} />
    </article>
  )
}

export default App
