import { HolidayUtil, Solar } from 'lunar-javascript'

const sessionKey = 'yhd:session'
const localeKey = 'yhd:locale'
const localUsersKey = 'yhd:local-users'
const localGamesKey = 'yhd:local-games'
const localWorkspacesKey = 'yhd:local-workspaces'
const localChatKey = 'yhd:local-chat'
const localBackend = { known: false, online: false }

const colors = [
  { id: 'red', name: '赤霄', emoji: '火', start: 0 },
  { id: 'blue', name: '玄水', emoji: '水', start: 14 },
  { id: 'green', name: '青木', emoji: '木', start: 28 },
  { id: 'gold', name: '金阙', emoji: '金', start: 42 },
]

const trackLength = 56
const homeLength = 6

export function getSavedSession() {
  try {
    return JSON.parse(localStorage.getItem(sessionKey) || 'null')
  } catch {
    return null
  }
}

export function saveSession(session) {
  if (!session?.token) return
  localStorage.setItem(sessionKey, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(sessionKey)
}

export function getSavedLocale() {
  return localStorage.getItem(localeKey) || 'zh-Hans'
}

export function saveLocale(locale) {
  localStorage.setItem(localeKey, locale)
}

export async function getBackendMode() {
  if (localBackend.known) return localBackend.online ? 'cloud' : 'local'
  try {
    const response = await fetch('/api/health', { cache: 'no-store' })
    const data = await response.json()
    localBackend.online = response.ok && data?.service === 'yuhuang-hub'
  } catch {
    localBackend.online = false
  }
  localBackend.known = true
  return localBackend.online ? 'cloud' : 'local'
}

async function request(path, options = {}) {
  const mode = await getBackendMode()
  if (mode === 'local') throw new Error('local-backend')
  const session = getSavedSession()
  const headers = {
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...(options.headers || {}),
  }
  const response = await fetch(path, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await response.json().catch(() => {
    throw new Error('cloud-backend-unavailable')
  })
  if (!response.ok) throw new Error(data.error || '请求失败')
  return data
}

export async function registerAccount(payload) {
  try {
    const data = await request('/api/register', { method: 'POST', body: payload })
    saveSession(data.session)
    return { ...data, mode: 'cloud' }
  } catch (error) {
    if (error.message !== 'local-backend') throw error
    const data = localRegister(payload)
    saveSession(data.session)
    return { ...data, mode: 'local' }
  }
}

export async function loginAccount(payload) {
  try {
    const data = await request('/api/login', { method: 'POST', body: payload })
    saveSession(data.session)
    return { ...data, mode: 'cloud' }
  } catch (error) {
    if (error.message !== 'local-backend') throw error
    const data = localLogin(payload)
    saveSession(data.session)
    return { ...data, mode: 'local' }
  }
}

export async function getWorkspace() {
  try {
    return await request('/api/workspace')
  } catch (error) {
    if (error.message !== 'local-backend') throw error
    return localGetWorkspace()
  }
}

export async function saveWorkspace(workspace) {
  try {
    return await request('/api/workspace', { method: 'PUT', body: { workspace } })
  } catch (error) {
    if (error.message !== 'local-backend') throw error
    return localSaveWorkspace(workspace)
  }
}

export async function previewLink(url) {
  try {
    return await request('/api/links/preview', { method: 'POST', body: { url } })
  } catch (error) {
    if (error.message !== 'local-backend') throw error
    return { card: localPreviewLink(url) }
  }
}

export async function summarizeLink(card) {
  try {
    return await request('/api/links/summarize', { method: 'POST', body: { card } })
  } catch (error) {
    if (error.message !== 'local-backend') throw error
    return { summary: localSummarizeLink(card) }
  }
}

export async function createGame() {
  try {
    return await request('/api/games', { method: 'POST' })
  } catch (error) {
    if (error.message !== 'local-backend') throw error
    return localCreateGame()
  }
}

export async function joinGame(code) {
  try {
    return await request(`/api/games/join`, { method: 'POST', body: { code } })
  } catch (error) {
    if (error.message !== 'local-backend') throw error
    return localJoinGame(code)
  }
}

export async function getGame(gameId) {
  try {
    return await request(`/api/games/${gameId}`)
  } catch (error) {
    if (error.message !== 'local-backend') throw error
    return localGetGame(gameId)
  }
}

export async function rollDice(gameId) {
  try {
    return await request(`/api/games/${gameId}/roll`, { method: 'POST' })
  } catch (error) {
    if (error.message !== 'local-backend') throw error
    return localMutateGame(gameId, rollGame)
  }
}

export async function movePiece(gameId, pieceId) {
  try {
    return await request(`/api/games/${gameId}/move`, { method: 'POST', body: { pieceId } })
  } catch (error) {
    if (error.message !== 'local-backend') throw error
    return localMutateGame(gameId, (game, user) => moveGame(game, user, pieceId))
  }
}

export async function restartGame(gameId) {
  try {
    return await request(`/api/games/${gameId}/restart`, { method: 'POST' })
  } catch (error) {
    if (error.message !== 'local-backend') throw error
    return localMutateGame(gameId, restartGameState)
  }
}

export async function getChat() {
  try {
    return await request('/api/chat')
  } catch (error) {
    if (error.message !== 'local-backend') throw error
    return localGetChat()
  }
}

export async function sendChatMessage(payload) {
  try {
    return await request('/api/chat/messages', { method: 'POST', body: payload })
  } catch (error) {
    if (error.message !== 'local-backend') throw error
    return localSendChatMessage(payload)
  }
}

export async function reactToMessage(messageId, emoji) {
  try {
    return await request(`/api/chat/messages/${messageId}/react`, { method: 'POST', body: { emoji } })
  } catch (error) {
    if (error.message !== 'local-backend') throw error
    return localReactToMessage(messageId, emoji)
  }
}

export async function checkInChat() {
  try {
    return await request('/api/chat/checkin', { method: 'POST' })
  } catch (error) {
    if (error.message !== 'local-backend') throw error
    return localCheckInChat()
  }
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

function writeJson(key, value, options = {}) {
  localStorage.setItem(key, JSON.stringify(value))
  if (!options.silent) window.dispatchEvent(new CustomEvent('yhd-local-sync'))
}

function localRegister({ username, password, displayName, inviteCode }) {
  const users = readJson(localUsersKey, {})
  const normalized = normalizeUsername(username)
  if (!normalized || !password) throw new Error('账号和密码都要填')
  if (!isValidInviteCode(inviteCode)) throw new Error('邀请码不对')
  if (users[normalized]) throw new Error('这个账号已经注册过')
  const user = {
    id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    username: normalized,
    displayName: displayName?.trim() || normalized,
    password,
  }
  users[normalized] = user
  writeJson(localUsersKey, users)
  return makeSession(user)
}

function localLogin({ username, password }) {
  const users = readJson(localUsersKey, {})
  const user = users[normalizeUsername(username)]
  if (!user || user.password !== password) throw new Error('账号或密码不对')
  return makeSession(user)
}

function makeSession(user) {
  return {
    session: {
      token: `local_${user.id}`,
      user: { id: user.id, username: user.username, displayName: user.displayName },
    },
  }
}

function getLocalUser() {
  const session = getSavedSession()
  if (!session?.token?.startsWith('local_')) throw new Error('请先登录')
  return session.user
}

function localGetWorkspace() {
  const user = getLocalUser()
  const workspaces = readJson(localWorkspacesKey, {})
  const workspace = normalizeWorkspace(workspaces.shared || workspaces[user.id] || createDefaultWorkspace())
  workspaces.shared = workspace
  writeJson(localWorkspacesKey, workspaces, { silent: true })
  return { workspace }
}

function localSaveWorkspace(workspace) {
  const workspaces = readJson(localWorkspacesKey, {})
  workspaces.shared = normalizeWorkspace(workspace)
  writeJson(localWorkspacesKey, workspaces)
  return { workspace: workspaces.shared }
}

function localPreviewLink(url) {
  return {
    url,
    title: detectPlatform(url),
    platform: detectPlatform(url),
    description: '链接已保存。线上版本会尝试抓取标题、封面和描述。',
    image: '',
  }
}

function localSummarizeLink(card) {
  const platform = card.platform || detectPlatform(card.url)
  const title = card.title || platform
  const note = card.note ? `备注：${card.note}` : ''
  return `${platform} 链接：${title}。${note}`.trim()
}

function localCreateGame() {
  const user = getLocalUser()
  const games = readJson(localGamesKey, {})
  const game = createInitialGame(user)
  games[game.id] = game
  writeJson(localGamesKey, games)
  return { game }
}

function localJoinGame(code) {
  const user = getLocalUser()
  const games = readJson(localGamesKey, {})
  const game = Object.values(games).find((item) => item.code === String(code).trim().toUpperCase())
  if (!game) throw new Error('没有找到这个房间')
  joinGameState(game, user)
  games[game.id] = game
  writeJson(localGamesKey, games)
  return { game }
}

function localGetGame(gameId) {
  const games = readJson(localGamesKey, {})
  const game = games[gameId]
  if (!game) throw new Error('没有找到这个游戏')
  return { game }
}

function localMutateGame(gameId, mutator) {
  const user = getLocalUser()
  const games = readJson(localGamesKey, {})
  const game = games[gameId]
  if (!game) throw new Error('没有找到这个游戏')
  mutator(game, user)
  games[game.id] = game
  writeJson(localGamesKey, games)
  return { game }
}

function localGetChat() {
  return { chat: normalizeChat(readJson(localChatKey, null)) }
}

function localSendChatMessage({ text }) {
  const user = getLocalUser()
  const chat = normalizeChat(readJson(localChatKey, null))
  const messageText = String(text || '').trim()
  if (!messageText) throw new Error('先写点东西')
  const url = extractUrl(messageText)
  chat.messages.push({
    id: createId(),
    userId: user.id,
    displayName: user.displayName,
    text: messageText,
    card: url ? localPreviewLink(url) : null,
    reactions: {},
    createdAt: new Date().toISOString(),
  })
  chat.updatedAt = new Date().toISOString()
  writeJson(localChatKey, chat)
  return { chat }
}

function localReactToMessage(messageId, emoji) {
  const user = getLocalUser()
  const chat = normalizeChat(readJson(localChatKey, null))
  const message = chat.messages.find((item) => item.id === messageId)
  if (!message) throw new Error('这条消息找不到了')
  toggleReaction(message, emoji, user.id)
  chat.updatedAt = new Date().toISOString()
  writeJson(localChatKey, chat)
  return { chat }
}

function localCheckInChat() {
  const user = getLocalUser()
  const chat = applyCheckIn(normalizeChat(readJson(localChatKey, null)), user)
  writeJson(localChatKey, chat)
  return { chat }
}

export function createDefaultWorkspace() {
  return {
    tasks: [
      {
        id: createId(),
        title: '规划今天的三件事',
        list: 'today',
        dueDate: todayString(),
        done: false,
        important: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: createId(),
        title: '把下一个 deadline 放进来',
        list: 'deadline',
        dueDate: '',
        done: false,
        important: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: createId(),
        title: '晚上一起同步一下安排',
        list: 'today',
        dueDate: todayString(),
        done: false,
        important: false,
        createdAt: new Date().toISOString(),
      },
    ],
    studyItems: [
      {
        id: createId(),
        course: '课程',
        title: '整理一张复习卡',
        note: '用自己的话解释一个概念',
        done: false,
        minutes: 25,
        createdAt: new Date().toISOString(),
      },
      {
        id: createId(),
        course: '课程',
        title: '把今天不会的点记下来',
        note: '晚点再一起看',
        done: false,
        minutes: 25,
        createdAt: new Date().toISOString(),
      },
    ],
    dates: [
      {
        id: createId(),
        title: '下下次见面',
        date: '2026-07-03',
        type: 'countdown',
        startTime: '18:00',
        endTime: '22:00',
        remindMinutes: 60,
        note: '7月3号',
        createdAt: new Date().toISOString(),
      },
      {
        id: createId(),
        title: '我们的纪念日',
        date: '2024-08-07',
        type: 'anniversary',
        startTime: '',
        endTime: '',
        remindMinutes: 1440,
        note: '',
        createdAt: new Date().toISOString(),
      },
      {
        id: createId(),
        title: '她的生日',
        date: '2005-12-19',
        type: 'birthday',
        startTime: '',
        endTime: '',
        remindMinutes: 1440,
        note: '',
        createdAt: new Date().toISOString(),
      },
      {
        id: createId(),
        title: '我的生日',
        date: '2005-06-12',
        type: 'birthday',
        startTime: '',
        endTime: '',
        remindMinutes: 1440,
        note: '',
        createdAt: new Date().toISOString(),
      },
      {
        id: createId(),
        title: '2026 端午节',
        date: '2026-06-19',
        type: 'holiday',
        startTime: '',
        endTime: '',
        remindMinutes: 1440,
        note: '',
        createdAt: new Date().toISOString(),
      },
      {
        id: createId(),
        title: '2027 春节',
        date: '2027-02-06',
        type: 'holiday',
        startTime: '',
        endTime: '',
        remindMinutes: 1440,
        note: '',
        createdAt: new Date().toISOString(),
      },
    ],
    links: [],
    photos: [],
    fortune: { notes: [] },
    quickTasks: ['规划一天', '复习 25 分钟', '整理 deadline', '喝水休息', '晚上同步安排'],
    miniGames: createDefaultMiniGames(),
    timer: {
      focusMinutes: 25,
      breakMinutes: 5,
      sessions: 0,
    },
    settings: {
      locale: getSafeLocale(),
    },
    updatedAt: new Date().toISOString(),
  }
}

export function normalizeWorkspace(workspace) {
  const fallback = createDefaultWorkspace()
  const rawDates = Array.isArray(workspace?.dates) ? workspace.dates : []
  const cleanedDates = rawDates.filter((item) => !(item?.title === '下次见面' && item?.type === 'countdown'))
  return {
    tasks: Array.isArray(workspace?.tasks) ? workspace.tasks : fallback.tasks,
    studyItems: Array.isArray(workspace?.studyItems) ? workspace.studyItems : fallback.studyItems,
    dates: mergeDefaultDates(cleanedDates, fallback.dates),
    links: Array.isArray(workspace?.links) ? workspace.links : [],
    photos: Array.isArray(workspace?.photos) ? workspace.photos : [],
    fortune: {
      notes: Array.isArray(workspace?.fortune?.notes) ? workspace.fortune.notes : [],
    },
    quickTasks: Array.isArray(workspace?.quickTasks) ? workspace.quickTasks : fallback.quickTasks,
    miniGames: normalizeMiniGames(workspace?.miniGames, fallback.miniGames),
    timer: {
      focusMinutes: validNumber(workspace?.timer?.focusMinutes, fallback.timer.focusMinutes),
      breakMinutes: validNumber(workspace?.timer?.breakMinutes, fallback.timer.breakMinutes),
      sessions: validNumber(workspace?.timer?.sessions, 0),
    },
    settings: {
      locale: workspace?.settings?.locale || getSafeLocale(),
    },
    updatedAt: workspace?.updatedAt || new Date().toISOString(),
  }
}

function mergeDefaultDates(currentDates, defaultDates) {
  const current = currentDates.map(normalizeDateItem)
  const exists = new Set(current.map((item) => `${item.title}|${item.date}`))
  const missing = defaultDates.filter((item) => !exists.has(`${item.title}|${item.date}`)).map(normalizeDateItem)
  return [...missing, ...current]
}

function normalizeDateItem(item) {
  return {
    id: item?.id || createId(),
    title: item?.title || '倒数日',
    date: item?.date || todayString(),
    type: item?.type || 'countdown',
    startTime: item?.startTime || '',
    endTime: item?.endTime || '',
    remindMinutes: validNumber(item?.remindMinutes, 60),
    note: item?.note || '',
    createdAt: item?.createdAt || new Date().toISOString(),
  }
}

function createDefaultMiniGames() {
  return {
    kitchen: {
      score: 0,
      orders: [],
      menu: [
        { id: 'toast', name: '芝士吐司', seconds: 18, points: 2 },
        { id: 'noodle', name: '番茄意面', seconds: 28, points: 4 },
        { id: 'tea', name: '柠檬茶', seconds: 12, points: 1 },
      ],
    },
    drawGuess: {
      prompt: '猫咪开飞机',
      drawer: '',
      guesses: [],
    },
    wordChain: {
      current: '开开心心',
      history: ['开开心心'],
    },
    riddle: {
      question: '什么东西越洗越脏？',
      answer: '水',
      revealed: false,
      guesses: [],
    },
  }
}

function normalizeMiniGames(games, fallback) {
  const base = fallback || createDefaultMiniGames()
  return {
    kitchen: {
      ...base.kitchen,
      ...(games?.kitchen || {}),
      orders: Array.isArray(games?.kitchen?.orders) ? games.kitchen.orders : [],
      menu: Array.isArray(games?.kitchen?.menu) ? games.kitchen.menu : base.kitchen.menu,
      score: validNumber(games?.kitchen?.score, base.kitchen.score),
    },
    drawGuess: {
      ...base.drawGuess,
      ...(games?.drawGuess || {}),
      guesses: Array.isArray(games?.drawGuess?.guesses) ? games.drawGuess.guesses : [],
    },
    wordChain: {
      ...base.wordChain,
      ...(games?.wordChain || {}),
      history: Array.isArray(games?.wordChain?.history) ? games.wordChain.history : base.wordChain.history,
    },
    riddle: {
      ...base.riddle,
      ...(games?.riddle || {}),
      guesses: Array.isArray(games?.riddle?.guesses) ? games.riddle.guesses : [],
      revealed: Boolean(games?.riddle?.revealed),
    },
  }
}

function validNumber(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function getDateMeta(dateString) {
  if (!dateString) return { lunar: '', festivals: [], terms: [], holiday: '' }
  const [year, month, day] = dateString.split('-').map(Number)
  if (!year || !month || !day) return { lunar: '', festivals: [], terms: [], holiday: '' }
  const solar = Solar.fromYmd(year, month, day)
  const lunar = solar.getLunar()
  const holiday = HolidayUtil.getHoliday(year, month, day)
  const festivals = [...lunar.getFestivals(), ...solar.getFestivals()].filter(Boolean)
  const terms = [lunar.getJieQi()].filter(Boolean)
  return {
    lunar: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    festivals,
    terms,
    holiday: holiday?.getName?.() || '',
  }
}

export function createGoogleCalendarUrl(event) {
  const title = encodeURIComponent(event.title || '日程')
  const details = encodeURIComponent([event.note, event.remindMinutes ? `提前 ${event.remindMinutes} 分钟提醒` : ''].filter(Boolean).join('\n'))
  const start = calendarStamp(event.date, event.startTime || '09:00')
  const end = calendarStamp(event.date, event.endTime || event.startTime || '10:00', event.startTime ? 0 : 60)
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`
}

function calendarStamp(dateString, timeString, offsetMinutes = 0) {
  const [year, month, day] = dateString.split('-').map(Number)
  const [hour, minute] = String(timeString || '09:00').split(':').map(Number)
  const date = new Date(year, month - 1, day, hour || 0, minute || 0)
  if (offsetMinutes) date.setMinutes(date.getMinutes() + offsetMinutes)
  return date.toISOString().replace(/[-:]|\.\d{3}/g, '')
}

export function normalizeChat(chat) {
  return {
    messages: Array.isArray(chat?.messages) ? chat.messages : [],
    streak: validNumber(chat?.streak, 0),
    lastCheckInDate: chat?.lastCheckInDate || '',
    updatedAt: chat?.updatedAt || new Date().toISOString(),
  }
}

export function applyCheckIn(chat, user) {
  const today = todayString()
  if (chat.lastCheckInDate !== today) {
    const yesterday = todayString(-1)
    chat.streak = chat.lastCheckInDate === yesterday ? chat.streak + 1 : 1
    chat.lastCheckInDate = today
  }
  chat.messages.push({
    id: createId(),
    userId: user.id,
    displayName: user.displayName,
    text: '今日打卡',
    card: null,
    reactions: { '🔥': [user.id] },
    system: 'checkin',
    createdAt: new Date().toISOString(),
  })
  chat.updatedAt = new Date().toISOString()
  return chat
}

function extractUrl(text) {
  return String(text || '').match(/https?:\/\/\S+/i)?.[0] || ''
}

function toggleReaction(message, emoji, userId) {
  const key = String(emoji || '').trim()
  if (!key) return
  message.reactions = message.reactions || {}
  const list = new Set(message.reactions[key] || [])
  if (list.has(userId)) list.delete(userId)
  else list.add(userId)
  message.reactions[key] = [...list]
}

function getSafeLocale() {
  try {
    return getSavedLocale()
  } catch {
    return 'zh-Hans'
  }
}

export function createInitialGame(user) {
  const game = {
    id: createId(),
    code: createCode(),
    title: '谕皇飞行棋',
    status: 'waiting',
    turnIndex: 0,
    dice: null,
    winnerId: null,
    players: [],
    pieces: {},
    log: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  joinGameState(game, user)
  game.log.unshift('房间已开，等下一位加入。')
  return game
}

export function joinGameState(game, user) {
  if (game.players.some((player) => player.id === user.id)) return game
  if (game.players.length >= 4) throw new Error('这个房间已经满了')
  const color = colors[game.players.length]
  game.players.push({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    color: color.id,
    colorName: color.name,
    emoji: color.emoji,
  })
  game.pieces[user.id] = [0, 1, 2, 3].map((index) => ({
    id: `${user.id}-p${index}`,
    index,
    position: -1,
  }))
  if (game.players.length >= 2 && game.status === 'waiting') {
    game.status = 'playing'
    game.log.unshift('开局了。掷到 6 才能起飞。')
  }
  game.updatedAt = new Date().toISOString()
  return game
}

function rollGame(game, user) {
  assertTurn(game, user)
  if (game.dice) throw new Error('已经掷过了，先选一架飞机')
  const dice = Math.floor(Math.random() * 6) + 1
  game.dice = dice
  const legalPieces = getLegalPieces(game, user.id, dice)
  const player = game.players.find((item) => item.id === user.id)
  if (!legalPieces.length) {
    game.log.unshift(`${player.displayName} 掷出 ${dice}，走不了，换下一位。`)
    game.dice = null
    advanceTurn(game)
  } else {
    game.log.unshift(`${player.displayName} 掷出 ${dice}，选一架飞机。`)
  }
  game.updatedAt = new Date().toISOString()
  return game
}

function moveGame(game, user, pieceId) {
  assertTurn(game, user)
  if (!game.dice) throw new Error('先掷骰子')
  const playerPieces = game.pieces[user.id] || []
  const piece = playerPieces.find((item) => item.id === pieceId)
  if (!piece) throw new Error('没有找到这架飞机')
  if (!getLegalPieces(game, user.id, game.dice).some((item) => item.id === pieceId)) {
    throw new Error('这架飞机现在不能走')
  }

  const player = game.players.find((item) => item.id === user.id)
  piece.position = piece.position === -1 ? 0 : piece.position + game.dice
  let captured = []
  if (piece.position < trackLength) {
    captured = capturePieces(game, user.id, piece.position)
  }
  if (piece.position >= trackLength + homeLength) piece.position = trackLength + homeLength

  const landed = piece.position >= trackLength + homeLength ? '到终点' : `到第 ${piece.position + 1} 格`
  const captureText = captured.length ? `，打回 ${captured.join('、')}` : ''
  game.log.unshift(`${player.displayName} 的 ${player.emoji}${piece.index + 1} ${landed}${captureText}。`)

  if (playerPieces.every((item) => item.position >= trackLength + homeLength)) {
    game.status = 'finished'
    game.winnerId = user.id
    game.log.unshift(`${player.displayName} 赢了这局。`)
  } else if (game.dice !== 6) {
    advanceTurn(game)
  } else {
    game.log.unshift(`${player.displayName} 掷到 6，再来一回合。`)
  }
  game.dice = null
  game.updatedAt = new Date().toISOString()
  return game
}

function restartGameState(game) {
  game.status = game.players.length >= 2 ? 'playing' : 'waiting'
  game.turnIndex = 0
  game.dice = null
  game.winnerId = null
  game.pieces = Object.fromEntries(
    game.players.map((player) => [
      player.id,
      [0, 1, 2, 3].map((index) => ({ id: `${player.id}-p${index}`, index, position: -1 })),
    ]),
  )
  game.log = ['重开。掷到 6 起飞。']
  game.updatedAt = new Date().toISOString()
  return game
}

function assertTurn(game, user) {
  if (game.status !== 'playing') throw new Error('棋局还没开始')
  const currentPlayer = game.players[game.turnIndex]
  if (!currentPlayer || currentPlayer.id !== user.id) throw new Error('还没轮到你')
}

export function getLegalPieces(game, userId, dice = game.dice) {
  if (!dice) return []
  return (game.pieces[userId] || []).filter((piece) => {
    if (piece.position >= trackLength + homeLength) return false
    if (piece.position === -1) return dice === 6
    return piece.position + dice <= trackLength + homeLength
  })
}

function capturePieces(game, userId, relativePosition) {
  const player = game.players.find((item) => item.id === userId)
  const global = toGlobalPosition(player.color, relativePosition)
  const captured = []
  game.players
    .filter((item) => item.id !== userId)
    .forEach((opponent) => {
      ;(game.pieces[opponent.id] || []).forEach((piece) => {
        if (piece.position >= 0 && piece.position < trackLength) {
          const opponentGlobal = toGlobalPosition(opponent.color, piece.position)
          if (opponentGlobal === global) {
            piece.position = -1
            captured.push(`${opponent.displayName} ${piece.index + 1}`)
          }
        }
      })
    })
  return captured
}

function advanceTurn(game) {
  if (!game.players.length) return
  game.turnIndex = (game.turnIndex + 1) % game.players.length
}

export function toGlobalPosition(colorId, relativePosition) {
  const color = colors.find((item) => item.id === colorId) || colors[0]
  return (color.start + relativePosition) % trackLength
}

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase()
}

function isValidInviteCode(inviteCode) {
  return String(inviteCode || '').trim() === 'BABA-ONLY'
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)
}

function createCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'YHD'
  for (let index = 0; index < 3; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

function todayString(offsetDays = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
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

export { colors, homeLength, trackLength }
