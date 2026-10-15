# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm install        # node_modules is not committed; run this first
npm run dev        # dev server at http://localhost:3000
npm run build      # production build (also type-checks)
npm run lint       # eslint (flat config, next/core-web-vitals + next/typescript)
npx tsc --noEmit   # type-check only
```

There is no test framework configured. Per `AGENTS.md`, this is Next.js 16 with breaking changes from older versions — read the relevant guide in `node_modules/next/dist/docs/` (available after `npm install`) before writing Next-specific code. Note `app/layout.tsx` already uses the global `LayoutProps<"/">` helper type rather than an imported one.

## What this is

"DuHoc24 — Cổng Tiếp Nhận Hồ Sơ Du Học": a study-abroad application intake site, built as a teaching template for a 6-week course (README.md is in Vietnamese and holds the week-by-week roadmap). **Current state is Week 1: UI only.** There is no API, database, auth or env var in use; `.env.example` lists the variables that later weeks (Gemini, Supabase, magic-link login) will need. UI copy is Vietnamese (`<html lang="vi">`).

## Architecture

- **Next.js App Router**, React 19, TypeScript strict, Tailwind CSS v4 (CSS-first config in `app/globals.css`, no `tailwind.config`; PostCSS via `@tailwindcss/postcss`). Path alias `@/*` → repo root.
- **Routes** (`app/`): `/` landing (hero, quote form, highlights, chat widget), `/portal` student document portal, `/admin/*` (requests, schools, profiles, conversations; `/admin` redirects to `/admin/requests`). `app/admin/layout.tsx` supplies the sidebar shell. `/login` is deliberately not built yet (Week 6).
- **All data is hard-coded in `lib/mock-data.ts`**: types (`DocStatus`, `RequestStatus`, `ServicePackage`, `School`, `AdmissionRequest`, `StudentProfile`, `Conversation`, …) and arrays (`schools`, `servicePackages`, `admissionRequests`, `studentProfiles`, `conversations`, `currentStudent`). Pages and components import directly from it. When wiring a real backend, this file is the seam to replace — keep the exported types as the contract.
- **Status values are snake_case Vietnamese keys** (`cho_duyet`, `da_duyet`, `tu_choi`, `chua_nop`, `dang_xu_ly`, `hop_le`, `can_nop_lai`). `components/status-badge.tsx` maps them to label/tone/icon (`docStatusMeta`, `requestStatusMeta`); add new statuses there as well as in the type.
- **Server vs client components**: pages are server components. Only interactive pieces carry `"use client"` — `components/site-header.tsx`, `components/admin/sidebar.tsx`, `components/landing/quote-form.tsx`, `components/landing/chat-widget.tsx`, and the Base UI-backed primitives in `components/ui/`. The quote form and chat widget are static UI (local state only, no submission).
- **UI kit**: shadcn/ui with style `base-nova`, built on **Base UI** (`@base-ui/react`), *not* Radix — component APIs and props differ from typical shadcn examples. Config in `components.json` (icons: `lucide-react`; extra registry `@tailark-oss`). Add primitives with `npx shadcn add <name>` into `components/ui/`; use `cn()` from `lib/utils.ts` to merge classes. Theme tokens are CSS variables in `app/globals.css` (light theme only is used in practice). Font is Be Vietnam Pro via `next/font`, exposed as `--font-sans`.
- **Images**: `next.config.ts` only allows remote images from `images.unsplash.com`; add other hosts to `images.remotePatterns` before using them with `next/image`.

## Quy tắc Git

- Luôn hỏi xác nhận trước khi push lên Github
- Không bao giờ commit file .env hoặc bất kỳ file chứa API key
