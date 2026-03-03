export type ApiError = {
  message: string
  status: number
  details?: unknown
}

function resolveApiBase() {
  const explicitBase = import.meta.env.VITE_API_URL?.trim()
  if (explicitBase) {
    return explicitBase
  }

  if (typeof window === 'undefined') {
    return '/api'
  }

  const { protocol, hostname, port } = window.location

  // Для Vite dev используем proxy на /api.
  if (port === '5173') {
    return '/api'
  }

  // Для статического запуска без proxy направляем запросы прямо в API контейнер.
  const host = hostname || 'localhost'
  const apiProtocol = protocol === 'https:' ? 'https:' : 'http:'
  return `${apiProtocol}//${host}:3000/api`
}

const API_BASE = resolveApiBase()

export function getApiBase() {
  return API_BASE
}

export function getApiOrigin() {
  if (typeof window === 'undefined') {
    return ''
  }
  if (API_BASE.startsWith('http')) {
    try {
      const url = new URL(API_BASE)
      return url.origin
    } catch {
      return window.location.origin
    }
  }
  return window.location.origin
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!text) {
    return undefined as T
  }
  try {
    return JSON.parse(text) as T
  } catch {
    return text as T
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined)
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (!response.ok) {
    const body = await parseResponse<{ message?: string }>(response).catch(() => null)
    const message =
      (body && typeof body === 'object' && 'message' in body && body.message) ||
      response.statusText ||
      'Ошибка запроса'
    const error: ApiError = {
      message: Array.isArray(message) ? message.join(', ') : (message as string),
      status: response.status,
      details: body
    }
    throw error
  }

  return parseResponse<T>(response)
}
