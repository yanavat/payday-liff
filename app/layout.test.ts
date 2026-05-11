import { describe, expect, it } from 'vitest'
import { viewport } from './layout'

describe('RootLayout viewport', () => {
  it('sets viewport-fit=cover so LINE in-client safe-area env() values are exposed', () => {
    expect(viewport).toMatchObject({ viewportFit: 'cover' })
  })
})
