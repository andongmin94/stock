type FetchJsonOptions = RequestInit & {
  timeoutMs?: number
}

const DEFAULT_FETCH_TIMEOUT_MS = 8_000

export async function fetchJson<T>(
  url: string,
  { timeoutMs = DEFAULT_FETCH_TIMEOUT_MS, signal, ...init }: FetchJsonOptions = {}
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  const abortFromParent = () => controller.abort()

  if (signal) {
    if (signal.aborted) {
      controller.abort()
    } else {
      signal.addEventListener("abort", abortFromParent, { once: true })
    }
  }

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }

    return (await response.json()) as T
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener("abort", abortFromParent)
  }
}
