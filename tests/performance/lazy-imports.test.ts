import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('LIFF bundle lazy-loading', () => {
  it('liff-request-page does not statically import canvas-confetti at the module level', () => {
    const src = readFileSync(
      resolve(import.meta.dirname, '../../components/liff-request-page.tsx'),
      'utf8',
    )
    expect(src).not.toMatch(/^import confetti from 'canvas-confetti'/m)
  })
})
