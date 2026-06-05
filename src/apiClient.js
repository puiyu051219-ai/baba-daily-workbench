const sessionKey = 'yhd:session'
const localeKey = 'yhd:locale'
const localUsersKey = 'yhd:local-users'
const localGamesKey = 'yhd:local-games'
const localWorkspacesKey = 'yhd:local-workspaces'
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

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent('yhd-local-sync'))
}

function localRegister({ username, password, displayName }) {
  const users = readJson(localUsersKey, {})
  const normalized = normalizeUsername(username)
  if (!normalized || !password) throw new Error('账号和密码都要填')
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
  const workspace = normalizeWorkspace(workspaces[user.id] || createDefaultWorkspace())
  workspaces[user.id] = workspace
  writeJson(localWorkspacesKey, workspaces)
  return { workspace }
}

function localSaveWorkspace(workspace) {
  const user = getLocalUser()
  const workspaces = readJson(localWorkspacesKey, {})
  workspaces[user.id] = normalizeWorkspace(workspace)
  writeJson(localWorkspacesKey, workspaces)
  return { workspace: workspaces[user.id] }
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

export function createDefaultWorkspace() {
  return {
    tasks: [
      {
        id: createId(),
        title: '整理今天要做的三件事',
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
    ],
    studyItems: [
      {
        id: createId(),
        course: '课程',
        title: '写一张复习卡',
        note: '用自己的话解释一个概念。',
        done: false,
        minutes: 25,
        createdAt: new Date().toISOString(),
      },
    ],
    dates: [
      {
        id: createId(),
        title: '下次见面',
        date: todayString(7),
        type: 'countdown',
        note: '',
        createdAt: new Date().toISOString(),
      },
    ],
    links: [],
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
  return {
    tasks: Array.isArray(workspace?.tasks) ? workspace.tasks : fallback.tasks,
    studyItems: Array.isArray(workspace?.studyItems) ? workspace.studyItems : fallback.studyItems,
    dates: Array.isArray(workspace?.dates) ? workspace.dates : fallback.dates,
    links: Array.isArray(workspace?.links) ? workspace.links : [],
    timer: {
      focusMinutes: Number(workspace?.timer?.focusMinutes || fallback.timer.focusMinutes),
      breakMinutes: Number(workspace?.timer?.breakMinutes || fallback.timer.breakMinutes),
      sessions: Number(workspace?.timer?.sessions || 0),
    },
    settings: {
      locale: workspace?.settings?.locale || getSafeLocale(),
    },
    updatedAt: workspace?.updatedAt || new Date().toISOString(),
  }
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
