import {
  createInitialGame,
  createDefaultWorkspace,
  getLegalPieces,
  joinGameState,
  normalizeWorkspace,
  trackLength,
  toGlobalPosition,
} from '../src/apiClient.js'

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
}

export class YuhuangHub {
  constructor(state, env) {
    this.state = state
    this.env = env
  }

  async fetch(request) {
    const url = new URL(request.url)
    try {
      if (url.pathname === '/api/health') return json({ ok: true, service: 'yuhuang-hub' })
      if (request.method === 'POST' && url.pathname === '/api/register') {
        return json(await this.register(await request.json()))
      }
      if (request.method === 'POST' && url.pathname === '/api/login') {
        return json(await this.login(await request.json()))
      }

      const user = await this.requireUser(request)

      if (request.method === 'POST' && url.pathname === '/api/games') {
        return json(await this.createGame(user))
      }
      if (request.method === 'POST' && url.pathname === '/api/games/join') {
        const body = await request.json()
        return json(await this.joinGame(user, body.code))
      }
      if (request.method === 'GET' && url.pathname === '/api/workspace') {
        return json(await this.getWorkspace(user))
      }
      if (request.method === 'PUT' && url.pathname === '/api/workspace') {
        const body = await request.json()
        return json(await this.saveWorkspace(user, body.workspace))
      }
      if (request.method === 'POST' && url.pathname === '/api/links/preview') {
        const body = await request.json()
        return json(await previewExternalLink(body.url))
      }
      if (request.method === 'POST' && url.pathname === '/api/links/summarize') {
        const body = await request.json()
        return json(await summarizeExternalLink(body.card, this.env))
      }

      const match = url.pathname.match(/^\/api\/games\/([^/]+)(?:\/(roll|move|restart))?$/)
      if (match) {
        const [, gameId, action] = match
        if (request.method === 'GET' && !action) return json(await this.getGame(gameId))
        if (request.method === 'POST' && action === 'roll') return json(await this.roll(gameId, user))
        if (request.method === 'POST' && action === 'move') {
          const body = await request.json()
          return json(await this.move(gameId, user, body.pieceId))
        }
        if (request.method === 'POST' && action === 'restart') {
          return json(await this.restart(gameId, user))
        }
      }

      return json({ error: '没有这个接口' }, 404)
    } catch (error) {
      return json({ error: error.message || '请求失败' }, error.status || 400)
    }
  }

  async register({ username, password, displayName }) {
    const normalized = normalizeUsername(username)
    if (!normalized || !password) throw new ApiError('账号和密码都要填', 422)
    const users = (await this.state.storage.get('users')) || {}
    if (users[normalized]) throw new ApiError('这个账号已经注册过', 409)
    const user = {
      id: crypto.randomUUID(),
      username: normalized,
      displayName: String(displayName || normalized).trim().slice(0, 18),
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
    }
    users[normalized] = user
    await this.state.storage.put('users', users)
    return { session: await this.createSession(user) }
  }

  async getWorkspace(user) {
    const workspaces = (await this.state.storage.get('workspaces')) || {}
    const workspace = normalizeWorkspace(workspaces[user.id] || createDefaultWorkspace())
    workspaces[user.id] = workspace
    await this.state.storage.put('workspaces', workspaces)
    return { workspace }
  }

  async saveWorkspace(user, workspace) {
    const workspaces = (await this.state.storage.get('workspaces')) || {}
    workspaces[user.id] = normalizeWorkspace(workspace)
    workspaces[user.id].updatedAt = new Date().toISOString()
    await this.state.storage.put('workspaces', workspaces)
    return { workspace: workspaces[user.id] }
  }

  async login({ username, password }) {
    const users = (await this.state.storage.get('users')) || {}
    const user = users[normalizeUsername(username)]
    if (!user || user.passwordHash !== (await hashPassword(password))) {
      throw new ApiError('账号或密码不对', 401)
    }
    return { session: await this.createSession(user) }
  }

  async createSession(user) {
    const token = crypto.randomUUID()
    const sessions = (await this.state.storage.get('sessions')) || {}
    sessions[token] = { userId: user.id, username: user.username, createdAt: new Date().toISOString() }
    await this.state.storage.put('sessions', sessions)
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
    }
  }

  async requireUser(request) {
    const header = request.headers.get('Authorization') || ''
    const token = header.replace(/^Bearer\s+/i, '')
    if (!token) throw new ApiError('请先登录', 401)
    const sessions = (await this.state.storage.get('sessions')) || {}
    const session = sessions[token]
    if (!session) throw new ApiError('登录已失效，请重新登录', 401)
    const users = (await this.state.storage.get('users')) || {}
    const user = users[session.username]
    if (!user) throw new ApiError('账号不存在', 401)
    return { id: user.id, username: user.username, displayName: user.displayName }
  }

  async createGame(user) {
    const games = (await this.state.storage.get('games')) || {}
    const game = createInitialGame(user)
    games[game.id] = game
    await this.state.storage.put('games', games)
    return { game }
  }

  async joinGame(user, code) {
    const games = (await this.state.storage.get('games')) || {}
    const game = Object.values(games).find((item) => item.code === String(code || '').trim().toUpperCase())
    if (!game) throw new ApiError('没有找到这个房间', 404)
    joinGameState(game, user)
    games[game.id] = game
    await this.state.storage.put('games', games)
    return { game }
  }

  async getGame(gameId) {
    const games = (await this.state.storage.get('games')) || {}
    const game = games[gameId]
    if (!game) throw new ApiError('没有找到这个游戏', 404)
    return { game }
  }

  async roll(gameId, user) {
    return this.mutateGame(gameId, (game) => rollGame(game, user))
  }

  async move(gameId, user, pieceId) {
    return this.mutateGame(gameId, (game) => moveGame(game, user, pieceId))
  }

  async restart(gameId, user) {
    return this.mutateGame(gameId, (game) => restartGameState(game, user))
  }

  async mutateGame(gameId, mutator) {
    const games = (await this.state.storage.get('games')) || {}
    const game = games[gameId]
    if (!game) throw new ApiError('没有找到这个游戏', 404)
    mutator(game)
    games[game.id] = game
    await this.state.storage.put('games', games)
    return { game }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/')) {
      const id = env.HUB.idFromName('global')
      const stub = env.HUB.get(id)
      return stub.fetch(request)
    }

    const assetResponse = await env.ASSETS.fetch(request)
    if (assetResponse.status !== 404) return assetResponse
    return env.ASSETS.fetch(new Request(new URL('/index.html', url), request))
  },
}

function rollGame(game, user) {
  assertTurn(game, user)
  if (game.dice) throw new ApiError('已经掷过了，先选一架飞机', 409)
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
}

function moveGame(game, user, pieceId) {
  assertTurn(game, user)
  if (!game.dice) throw new ApiError('先掷骰子', 409)
  const playerPieces = game.pieces[user.id] || []
  const piece = playerPieces.find((item) => item.id === pieceId)
  if (!piece) throw new ApiError('没有找到这架飞机', 404)
  if (!getLegalPieces(game, user.id, game.dice).some((item) => item.id === pieceId)) {
    throw new ApiError('这架飞机现在不能走', 409)
  }

  const player = game.players.find((item) => item.id === user.id)
  piece.position = piece.position === -1 ? 0 : piece.position + game.dice
  const captured = piece.position < trackLength ? capturePieces(game, user.id, piece.position) : []
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
}

function restartGameState(game, user) {
  if (!game.players.some((player) => player.id === user.id)) throw new ApiError('你不在这个房间里', 403)
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

function assertTurn(game, user) {
  if (game.status !== 'playing') throw new ApiError('棋局还没开始', 409)
  const currentPlayer = game.players[game.turnIndex]
  if (!currentPlayer || currentPlayer.id !== user.id) throw new ApiError('还没轮到你', 409)
}

function advanceTurn(game) {
  game.turnIndex = (game.turnIndex + 1) % game.players.length
}

async function previewExternalLink(rawUrl) {
  const url = normalizeExternalUrl(rawUrl)
  const platform = detectPlatform(url)
  const fallback = {
    card: {
      url,
      platform,
      title: platform,
      description: '',
      image: '',
    },
  }
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'YuhuangDadiLinkPreview/1.0',
      },
      signal: AbortSignal.timeout(7000),
    })
    const contentType = response.headers.get('Content-Type') || ''
    if (!response.ok || !contentType.includes('text/html')) return fallback
    const html = (await response.text()).slice(0, 180000)
    const title = firstText([
      metaContent(html, 'property', 'og:title'),
      metaContent(html, 'name', 'twitter:title'),
      titleTag(html),
      platform,
    ])
    const description = firstText([
      metaContent(html, 'property', 'og:description'),
      metaContent(html, 'name', 'description'),
      metaContent(html, 'name', 'twitter:description'),
    ])
    const image = firstText([
      metaContent(html, 'property', 'og:image'),
      metaContent(html, 'name', 'twitter:image'),
    ])
    return {
      card: {
        url,
        platform,
        title,
        description,
        image,
      },
    }
  } catch {
    return fallback
  }
}

async function summarizeExternalLink(card, env = {}) {
  const prompt = [
    '请用自然、简洁的中文总结这个短视频或外部链接。',
    '不要写营销腔，不要说“作为 AI”。',
    '输出 2 到 4 句：它大概讲什么、有什么可拍或可讨论的点。',
    `平台：${card?.platform || detectPlatform(card?.url || '')}`,
    `标题：${card?.title || ''}`,
    `描述：${card?.description || ''}`,
    `备注：${card?.note || ''}`,
    `链接：${card?.url || ''}`,
  ].join('\n')

  try {
    if (env.OPENAI_API_KEY && env.OPENAI_MODEL) {
      return { summary: await summarizeWithOpenAI(prompt, env) }
    }
    if (env.ANTHROPIC_API_KEY && env.ANTHROPIC_MODEL) {
      return { summary: await summarizeWithAnthropic(prompt, env) }
    }
  } catch {
    return { summary: fallbackSummary(card) }
  }

  return { summary: fallbackSummary(card) }
}

async function summarizeWithOpenAI(prompt, env) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      messages: [
        { role: 'system', content: '你是一个短视频链接整理助手。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
    }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error?.message || 'OpenAI failed')
  return data.choices?.[0]?.message?.content?.trim() || fallbackSummary({})
}

async function summarizeWithAnthropic(prompt, env) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 220,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error?.message || 'Anthropic failed')
  return data.content?.[0]?.text?.trim() || fallbackSummary({})
}

function fallbackSummary(card = {}) {
  const platform = card.platform || detectPlatform(card.url || '')
  const title = card.title || platform
  const note = card.note ? `备注里提到：${card.note}` : ''
  const description = card.description ? `页面描述：${card.description}` : ''
  return [`${platform} 链接已保存：${title}。`, description, note].filter(Boolean).join(' ')
}

function normalizeExternalUrl(rawUrl) {
  const withProtocol = String(rawUrl || '').trim().match(/^https?:\/\//i) ? String(rawUrl).trim() : `https://${String(rawUrl || '').trim()}`
  const url = new URL(withProtocol)
  if (!['http:', 'https:'].includes(url.protocol)) throw new ApiError('只支持网页链接', 422)
  if (isPrivateHost(url.hostname)) throw new ApiError('这个链接不能抓取', 422)
  return url.toString()
}

function isPrivateHost(hostname) {
  const host = hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.local')) return true
  if (/^127\.|^10\.|^0\./.test(host)) return true
  if (/^192\.168\./.test(host)) return true
  const match = host.match(/^172\.(\d+)\./)
  return match ? Number(match[1]) >= 16 && Number(match[1]) <= 31 : false
}

function detectPlatform(url) {
  let host = ''
  try {
    host = new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'Link'
  }
  if (host.includes('instagram')) return 'Instagram'
  if (host.includes('douyin')) return 'Douyin'
  if (host.includes('xiaohongshu') || host.includes('xhslink')) return 'Xiaohongshu'
  if (host.includes('tiktok')) return 'TikTok'
  if (host.includes('youtube') || host.includes('youtu.be')) return 'YouTube'
  return host
}

function metaContent(html, attr, value) {
  const pattern = new RegExp(`<meta[^>]+${attr}=["']${escapeRegex(value)}["'][^>]*>`, 'i')
  const tag = html.match(pattern)?.[0]
  return tag ? decodeHtml(attributeValue(tag, 'content')) : ''
}

function titleTag(html) {
  return decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '')
}

function attributeValue(tag, attr) {
  return tag.match(new RegExp(`${attr}=["']([^"']*)["']`, 'i'))?.[1] || ''
}

function firstText(values) {
  return values.map((value) => String(value || '').trim()).find(Boolean) || ''
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(String(password))
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase()
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: jsonHeaders })
}

class ApiError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}
