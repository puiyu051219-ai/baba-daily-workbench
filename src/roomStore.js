import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null

const instanceId =
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`

const roomIndexKey = 'lumiday:room-index'

export const profileIds = {
  primary: 'fengyu',
  partner: 'lumi',
}

export function createInviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'LUMI'
  for (let index = 0; index < 2; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

export function createRoomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().slice(0, 8)
  }
  return Math.random().toString(36).slice(2, 10)
}

export function createSeedState(roomId = 'lumi-demo', inviteCode = 'LUMI52') {
  const todayLabel = new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date())

  return {
    version: 1,
    room: {
      id: roomId,
      inviteCode,
      title: 'LumiDay 今天有你',
      subtitle: '今天怎么安排',
      dateLabel: todayLabel,
      theme: '高级可爱',
      updatedAt: new Date().toISOString(),
    },
    profiles: [
      {
        id: profileIds.primary,
        name: '风谕',
        avatar: 'FY',
        color: '#0f766e',
        mood: '想把今天安排得漂亮一点',
        note: '负责把混乱变成可以执行的计划。',
      },
      {
        id: profileIds.partner,
        name: 'Lumi',
        avatar: 'LU',
        color: '#e65f7c',
        mood: '想轻松一点，也想被认真对待',
        note: '偏好舒服、好看、有安全感的安排。',
      },
    ],
    todayCards: [
      {
        id: 'today-slow-start',
        kind: 'plan',
        title: '慢启动，不硬撑',
        body: '今天先把必须做的事排出来，再留一个自由散步或咖啡时间。',
        timeLabel: '10:30',
        ownerId: profileIds.partner,
        status: 'open',
        votes: { fengyu: true, lumi: false },
      },
      {
        id: 'today-date',
        kind: 'date',
        title: '晚饭后去一个不用赶场的地方',
        body: '选一个好聊天、好拍照、回家不折腾的位置。',
        timeLabel: '19:00',
        ownerId: profileIds.primary,
        status: 'open',
        votes: { fengyu: true, lumi: true },
      },
      {
        id: 'today-soft-check',
        kind: 'mood',
        title: '轻心情检查',
        body: '今天不是要解决所有问题，只要知道对方现在更需要陪伴还是空间。',
        timeLabel: '任何时候',
        ownerId: profileIds.partner,
        status: 'open',
        votes: { fengyu: false, lumi: true },
      },
    ],
    studyItems: [
      {
        id: 'study-ai',
        course: 'AI 学习',
        title: '把 Chatbot 和 Agent 的区别讲明白',
        body: '用一个生活例子解释：聊天工具回答问题，Agent 能接任务、调用工具、持续推进。',
        progress: 68,
        status: 'next',
        aiHint: '可以让 AI 先用 3 个比喻解释，再让它出 5 道小测。',
      },
      {
        id: 'study-finance',
        course: '学校课程',
        title: 'FINC 复习卡 25 分钟',
        body: '先不追求全懂，只把今天最容易丢分的一类题拿出来做。',
        progress: 35,
        status: 'open',
        aiHint: '让 AI 把题目拆成定义、公式、陷阱、检查四步。',
      },
      {
        id: 'study-memory',
        course: '共同成长',
        title: '互相讲一个今天学到的东西',
        body: '讲不明白就不算学会。两个人各用 3 分钟，不评价，只补充。',
        progress: 10,
        status: 'open',
        aiHint: '适合变成小红书选题：学习工具没进入每天，就不是真的有用。',
      },
    ],
    tripItems: [
      {
        id: 'trip-shibuya',
        name: 'Shibuya Sky',
        city: 'Tokyo',
        kind: 'place',
        tags: ['出片', '夜景', 'Klook'],
        cost: 35,
        score: 24,
        voteBy: { fengyu: 'must', lumi: 'maybe' },
        reason: '体验感强，适合做共同记忆点，不适合排在赶路日。',
        image:
          'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'trip-daikanyama',
        name: 'Daikanyama',
        city: 'Tokyo',
        kind: 'place',
        tags: ['慢逛', '拍照', '咖啡'],
        cost: 18,
        score: 20,
        voteBy: { fengyu: 'maybe', lumi: 'must' },
        reason: '适合轻松逛，不会把体力打爆，女生友好。',
        image:
          'https://images.unsplash.com/photo-1505069446780-4ef442b5207f?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'trip-kyoto',
        name: 'Kiyomizu-dera',
        city: 'Kyoto',
        kind: 'place',
        tags: ['文化', '经典', '安全'],
        cost: 12,
        score: 22,
        voteBy: { fengyu: 'must', lumi: 'must' },
        reason: '经典但不能赶场，最好和祇园拆成半天。',
        image:
          'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=80',
      },
    ],
    tripPlans: [
      {
        id: 'comfort',
        name: '舒服稳妥版',
        tagline: '少折腾，先保证大家不崩。',
        budget: 2944,
        selected: true,
        scores: { pace: 3, comfort: 5, photo: 3, safety: 5 },
        days: ['酒店附近慢启动', '只放一个主景点', '早点回安全商圈'],
      },
      {
        id: 'photo',
        name: '拍照体验版',
        tagline: '让这趟旅行真的有照片和记忆。',
        budget: 3456,
        selected: false,
        scores: { pace: 3, comfort: 3, photo: 5, safety: 4 },
        days: ['光线好的地点先拍', '安排有记忆点的体验', '保留夜景或精致晚餐'],
      },
      {
        id: 'budget',
        name: '预算控制版',
        tagline: '不穷游，但每一笔钱都有解释。',
        budget: 2304,
        selected: false,
        scores: { pace: 3, comfort: 3, photo: 3, safety: 4 },
        days: ['免费或低价景点', '交通压低', '只留一个付费体验'],
      },
    ],
    gameSessions: [
      {
        id: 'game-choice',
        kind: 'choice',
        title: '今晚二选一',
        prompt: '如果今天只能选一个，你更想要哪种结尾？',
        options: ['安静散步', '好吃晚饭'],
        answers: {},
        revealed: false,
        reward: '答案一致就解锁一个小约会任务。',
      },
      {
        id: 'game-memory',
        kind: 'quiz',
        title: '默契小测',
        prompt: '对方最近最想被照顾到的点是什么？',
        options: ['别催她', '陪她学', '带她玩', '认真听她讲'],
        answers: {},
        revealed: false,
        reward: '答案不同也没关系，这就是低压力沟通入口。',
      },
    ],
    focusMinutes: 25,
  }
}

function readRoomIndex() {
  try {
    return JSON.parse(localStorage.getItem(roomIndexKey) || '{}')
  } catch {
    return {}
  }
}

function writeRoomIndex(index) {
  localStorage.setItem(roomIndexKey, JSON.stringify(index))
}

function roomStorageKey(roomId) {
  return `lumiday:room:${roomId}`
}

function saveLocalRoom(state) {
  const next = {
    ...state,
    room: {
      ...state.room,
      updatedAt: new Date().toISOString(),
    },
  }
  localStorage.setItem(roomStorageKey(next.room.id), JSON.stringify(next))
  const index = readRoomIndex()
  index[next.room.inviteCode.toUpperCase()] = next.room.id
  writeRoomIndex(index)
  return next
}

function readLocalRoom(roomId) {
  try {
    const saved = localStorage.getItem(roomStorageKey(roomId))
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export async function createRoomSnapshot() {
  const roomId = createRoomId()
  const inviteCode = createInviteCode()
  const seed = createSeedState(roomId, inviteCode)

  if (isSupabaseConfigured) {
    const { error } = await supabase.from('rooms').upsert({
      id: seed.room.id,
      invite_code: seed.room.inviteCode,
      title: seed.room.title,
      theme: seed.room.theme,
      app_state: seed,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
  } else {
    saveLocalRoom(seed)
  }

  return seed
}

export async function joinRoomByInvite(inviteCode) {
  const normalizedCode = inviteCode.trim().toUpperCase()
  if (!normalizedCode) return null

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('rooms')
      .select('app_state')
      .eq('invite_code', normalizedCode)
      .maybeSingle()
    if (error) throw error
    return data?.app_state ?? null
  }

  const index = readRoomIndex()
  const roomId = index[normalizedCode]
  return roomId ? readLocalRoom(roomId) : null
}

export async function loadRoomSnapshot(roomId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('rooms')
      .select('app_state')
      .eq('id', roomId)
      .maybeSingle()
    if (error) throw error
    if (data?.app_state) return data.app_state
  }

  const saved = readLocalRoom(roomId)
  if (saved) return saved

  const seed = createSeedState(roomId, 'LUMI52')
  return saveLocalRoom(seed)
}

export async function saveRoomSnapshot(state) {
  const next = {
    ...state,
    room: {
      ...state.room,
      updatedAt: new Date().toISOString(),
    },
  }

  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('rooms')
      .update({
        title: next.room.title,
        theme: next.room.theme,
        app_state: next,
        updated_at: new Date().toISOString(),
      })
      .eq('id', next.room.id)
    if (error) throw error
  } else {
    saveLocalRoom(next)
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(`lumiday:${next.room.id}`)
      channel.postMessage({ source: instanceId, state: next })
      channel.close()
    }
    window.dispatchEvent(
      new CustomEvent('lumiday-local-sync', {
        detail: { source: instanceId, roomId: next.room.id, state: next },
      }),
    )
  }

  return next
}

export function subscribeToRoom(roomId, onChange) {
  if (isSupabaseConfigured) {
    const channel = supabase
      .channel(`lumiday-room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.new?.app_state) onChange(payload.new.app_state)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const broadcast =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(`lumiday:${roomId}`) : null

  const handleBroadcast = (event) => {
    if (event.data?.source !== instanceId && event.data?.state) onChange(event.data.state)
  }
  const handleCustomEvent = (event) => {
    if (
      event.detail?.source !== instanceId &&
      event.detail?.roomId === roomId &&
      event.detail?.state
    ) {
      onChange(event.detail.state)
    }
  }
  const handleStorage = (event) => {
    if (event.key === roomStorageKey(roomId) && event.newValue) {
      onChange(JSON.parse(event.newValue))
    }
  }

  broadcast?.addEventListener('message', handleBroadcast)
  window.addEventListener('lumiday-local-sync', handleCustomEvent)
  window.addEventListener('storage', handleStorage)

  return () => {
    broadcast?.removeEventListener('message', handleBroadcast)
    broadcast?.close()
    window.removeEventListener('lumiday-local-sync', handleCustomEvent)
    window.removeEventListener('storage', handleStorage)
  }
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state))
}
