# BALANS AI — Biznesingizning aqlli moliyaviy markazi

O‘zbekiston bizneslari uchun **AI-powered buxgalteriya, moliya va biznes boshqaruv platformasi** (SaaS).
Buxgalteriya, AI CFO, Savdo, CRM, Ombor, Xaridlar, Ishlab chiqarish, HR, Hisobotlar va Analitika — yagona platformada.

## Texnologiyalar

- **React 18 + TypeScript + Vite** — tez, modulli, lazy-loaded
- **React Router 6** — browser routing (refresh/aniq URL/nested/protected marshrutlar)
- **Markazlashgan data store** (Context + reducer, localStorage persist) — barcha modullar bitta demo data'dan foydalanadi
- **Custom SVG chart tizimi** — animatsiyali, tooltip'li, tashqi chart kutubxonasisiz
- **Dizayn tizimi**: premium dark glass / cinematic AI estetika, light mode, to'liq responsive

## Ishga tushirish

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build
npm run preview
```

### Demo kirish

- **Email:** `odiljon@osiyosavdo.uz`  **Parol:** `balans2026` (OWNER)
- Yoki login sahifasidagi rol tugmalari: Owner / Buxgalter / Sotuvchi / Omborchi / HR

## Arxitektura

```
src/
  lib/
    types.ts        — umumiy data model (Product, Order, Transaction, ...)
    demoData.ts     — deterministik, mantiqan bog'liq demo data (12 oy seriya)
    store.tsx       — markazlashtirilgan reducer + CROSS-MODULE BUSINESS LOGIC
    analytics.ts    — derivatsiya: monthlySeries, receivables, healthScore, ...
    ai.ts           — AI CFO engine: insights + MUAMMO/SABAB/TA'SIR/TAVSIYA/ACTION
    permissions.ts  — 8 rol × 16 modul ruxsat matritsasi (VIEW/CREATE/EDIT/DELETE/EXPORT)
    auth.tsx        — demo auth (backend'ga ulanishga tayyor interfeys)
  components/       — reusable UI: Button, Card, Modal, Drawer, DataTable, Charts, ...
  pages/
    landing/        — premium landing (hero + real dashboard preview)
    auth/           — Login, Register, Forgot, Reset, Onboarding (5 qadam)
    app/            — Dashboard, AI CFO, Savdo, Mijozlar, Ombor, Xaridlar,
                      Ishlab chiqarish (+tannarx), Buxgalteriya, Moliya, Qarzdorlik,
                      HR, Hisobotlar, Analitika, Sozlamalar (10 tab), Profil, Billing
```

### Cross-module mantiq (bitta store'da)

| Amal | Avtomatik effektlar |
|---|---|
| Yangi savdo | ombor qoldig'i ↓, daromad tranzaksiyasi ↑, mijoz tarixi ↑, qarz (agar kredit) |
| Qarz to'lovi | cash flow ↑, buyurtma "to'langan", receivable ↓ |
| Xarid qabul qilindi | ombor qoldig'i ↑ |
| Xarid to'landi | xarajat tranzaksiyasi ↑, payable ↓ |
| Ishlab chiqarish bajarildi | xomashyo ↓, tayyor mahsulot ↑, tannarx xarajati ↑ |
| Ish haqi to'lovi | xarajat ↑, bildirishnoma |
| Har bir amal | bildirishnoma + activity log + AI insightlari yangilanadi |

## Testlar

```bash
npx esbuild scripts/test-logic.ts --bundle --platform=node --format=cjs --outfile=/tmp/t.cjs --jsx=automatic --loader:.tsx=tsx && node /tmp/t.cjs
npx esbuild src/main.tsx --bundle --format=iife --outfile=/tmp/app.iife.js --jsx=automatic --define:process.env.NODE_ENV='"production"' --minify
node scripts/smoke-test.cjs        # barcha marshrutlar render + konsol xatolari
node scripts/interaction-test.cjs  # modallar, rollar, qidiruv, bildirishnomalar
node scripts/flow-test.cjs         # register→onboarding→dashboard, CRUD, logout, billing
```

## Marshrutlar

`/` · `/login` · `/register` · `/forgot-password` · `/reset-password` · `/onboarding`
`/dashboard` · `/ai-cfo` · `/sales` · `/customers` · `/warehouse` · `/purchases` · `/production`
`/accounting` · `/finance` · `/debts` · `/hr` · `/reports` · `/analytics` · `/settings` · `/profile` · `/billing` · `404`
