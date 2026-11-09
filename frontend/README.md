This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## UX Visual Governance

All frontend visual primitives must first be implemented and reviewed in `app/dev/theme-preview/page.tsx` before they are added to feature routes.

Required flow:

1. Add or update visual primitive in `app/dev/theme-preview/page.tsx`
2. Review consistency, accessibility, and responsive behavior
3. Mark approval in the visual approval log section
4. Only then reuse the primitive in feature pages

## Getting Started

## Standard Workspace Startup (Recommended)

From the workspace root, use VS Code tasks to avoid port mismatches:

1. Run task: `Dev: Start Full Stack`
2. Optional verify: run task `Dev: Health Check`
3. Stop both services with task `Dev: Stop Full Stack`

Expected ports:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`

First, run the development server:

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
