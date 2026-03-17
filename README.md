## Backend integration

O frontend nao chama a API da porta `8000` diretamente no browser. As requisicoes passam pelas rotas internas de `app/api`, que funcionam como proxy server-side para evitar CORS.

Crie um arquivo `.env.local` com:

```bash
BACKEND_API_URL=http://127.0.0.1:8000
COOKIE_SECRET=change-me
PAYMENT_PROVIDER_CLIENT_ID=your-client-id
PAYMENT_PROVIDER_CLIENT_SECRET=your-client-secret
```

Rotas internas usadas pelo frontend:

- `GET /api/checkout/:sessionId`
- `POST /api/checkout/:sessionId/verify-cpf`
- `POST /api/checkout/:sessionId/pay`
- `POST /api/checkout/:sessionId/transaction/credit`
- `POST /api/checkout/:sessionId/transaction/debit`

Os mapeamentos para a API externa ficam centralizados em `lib/backend/checkout.ts`.

Para cartao de credito e debito, o frontend nao recebe nem persiste o token do provedor. As credenciais ficam apenas no servidor, o token e buscado server-side a cada transacao e injetado no payload antes de encaminhar ao backend.

## Getting Started

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
