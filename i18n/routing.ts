import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  // All supported locales
  locales: ['th', 'en', 'my'],

  // Default locale (Thai — factory workers)
  defaultLocale: 'th',

  // Locale prefix strategy: always show locale in URL
  // e.g. /th/dashboard, /en/dashboard, /my/dashboard
  localePrefix: 'always',
})
