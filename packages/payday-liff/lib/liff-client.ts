import type liff from '@line/liff'

export type LiffClient = typeof liff

let clientPromise: Promise<LiffClient> | null = null

export async function loadLiffClient(): Promise<LiffClient> {
  if (typeof window === 'undefined') {
    throw new Error('LIFF SDK can only be loaded in the browser')
  }

  if (process.env.NEXT_PUBLIC_LIFF_MOCK === 'true') {
    return createMockLiffClient()
  }

  clientPromise ??= import('@line/liff').then((mod) => mod.default)
  return clientPromise
}

function createMockLiffClient(): LiffClient {
  return {
    init: async () => undefined,
    isLoggedIn: () => true,
    login: () => undefined,
    isInClient: () => false,
    getProfile: async () => ({
      userId: 'mock-line-user',
      displayName: 'Mock LINE User',
      pictureUrl: undefined,
      statusMessage: undefined,
    }),
  } as unknown as LiffClient
}
