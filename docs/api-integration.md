# Backend API Integration - Environment Variables

For local development, create a `.env.local` file in the project root with the following variables:

```bash
# Backend API Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Company ID (for multi-tenant support)
NEXT_PUBLIC_COMPANY_ID=

# LIFF Configuration
NEXT_PUBLIC_LIFF_ID=
NEXT_PUBLIC_LIFF_MOCK=true
```

## Variable Descriptions

- `NEXT_PUBLIC_API_BASE_URL`: The base URL of the NestJS backend API
- `NEXT_PUBLIC_COMPANY_ID`: The company ID for multi-tenant support (optional)
- `NEXT_PUBLIC_LIFF_ID`: Your LIFF app ID from LINE Developers Console
- `NEXT_PUBLIC_LIFF_MOCK`: Set to `true` for local development with mocked LIFF SDK

## Production Environment

For production, set these environment variables in your hosting platform (e.g., Vercel):

- `NEXT_PUBLIC_API_BASE_URL`: Your production backend API URL
- `NEXT_PUBLIC_COMPANY_ID`: Your production company ID
- `NEXT_PUBLIC_LIFF_ID`: Your production LIFF app ID
- `NEXT_PUBLIC_LIFF_MOCK`: Set to `false` for production

## Authentication

Authentication is handled with HttpOnly Secure SameSite cookies managed by the backend and forwarded through the Next.js auth proxy. Shared API calls use `getApiClient()` with `credentials: "include"`; do not store JWTs in `localStorage` or attach bearer tokens from client code.
