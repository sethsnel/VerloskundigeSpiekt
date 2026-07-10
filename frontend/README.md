This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit it.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as API routes instead of React pages.

## API migration

The API transport in `lib/api/transport.ts` is the single browser transport: it obtains/refreshes the Firebase bearer token, adds correlation IDs, maps Problem Details, and forwards abort signals. Query keys include the authenticated user and tenant practice. Practice switching cancels/removes tenant-scoped queries before the new context renders.

The client operation layer is generated from the backend OpenAPI document with `pnpm generate:api` (the API must be running at `API_OPENAPI_URL`, default `http://localhost:8080/openapi/v1.json`). `lib/api/generated.ts` keeps the accepted operation wrappers thin; it must be regenerated when the contract changes.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about the framework.
- [Learn Next.js](https://nextjs.org/learn) - learn Next.js interactively.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) for more examples.

## Deploy on Vercel

The easiest way to deploy this app is to use [Vercel](https://vercel.com/new).
