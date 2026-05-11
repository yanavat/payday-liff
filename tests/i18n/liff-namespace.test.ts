import { describe, expect, it } from 'vitest'
import en from '@/messages/en.json'
import th from '@/messages/th.json'
import my from '@/messages/my.json'

const REQUIRED_LIFF_KEYS = [
  'loading',
  'openInLine',
  'openInLineDescription',
  'openInLineButton',
  'linkTitle',
  'linkDescription',
  'employeeIdLabel',
  'employeeIdPlaceholder',
  'linkButton',
  'offlineMessage',
  'externalBrowserMessage',
]

describe('liff i18n namespace', () => {
  for (const lang of [
    { code: 'en', messages: en },
    { code: 'th', messages: th },
    { code: 'my', messages: my },
  ]) {
    it(`${lang.code}.json has a "liff" namespace`, () => {
      expect(lang.messages).toHaveProperty('liff')
    })

    for (const key of REQUIRED_LIFF_KEYS) {
      it(`${lang.code}.liff.${key} is a non-empty string`, () => {
        const ns = (lang.messages as Record<string, Record<string, string>>)['liff']
        expect(ns).toBeDefined()
        expect(typeof ns[key]).toBe('string')
        expect(ns[key].length).toBeGreaterThan(0)
      })
    }
  }
})
