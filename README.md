# Caution Studio: Beat Streaming & Licensing Marketplace

Production-ready Next.js monorepo built according to the **Caution Studio: Build Spec**.

---

## 1. Locked Decisions

| Area | Decision |
| :--- | :--- |
| **Web** | Next.js (App Router, TypeScript) |
| **Backend & Auth** | Supabase (Postgres, Auth, Row Level Security, Edge Functions) |
| **Media Storage** | Cloudflare R2 (zero egress), accessed via signed URLs |
| **Payments** | Paystack (Nigerian Naira `NGN` & international cards) |
| **Aesthetic** | Dark, flat, deep green accent (`#0F4F49`), live accent (`#3DBFA8`), 1px hairlines (`#26292A`). No purple, pink, gradients or glow. Shadow only under hero search bar. |
| **Roles** | Artist, Producer (one account can hold both) |

---

## 2. Repository Layout

```
caution-studio/
├─ apps/
│  └─ web/                    # Next.js marketplace + dashboards (Port 3000)
│     ├─ app/                 # App Router screens & routes
│     ├─ components/          # Audio, marketplace, studio & layout components
│     └─ lib/                 # Supabase client, Paystack helpers, Cloudflare R2
├─ packages/
│  ├─ tokens/                 # Design tokens (CSS vars + JS/RN export)
│  ├─ types/                  # Supabase database types, shared Zod schemas
│  ├─ licenses/               # License definitions (Basic, Premium, Exclusive) + PDF template
│  ├─ tailwind-config/        # Centralized Tailwind presets
│  └─ ui/                     # UI components & audio synthesizer
├─ supabase/
│  ├─ migrations/             # SQL schema, RLS, triggers & atomic exclusive lock
│  └─ functions/              # Paystack-webhook, signed-url, issue-license
└─ README.md
```

---

## 3. Design Tokens (`packages/tokens`)

```css
:root {
  /* surfaces */
  --bg:          #0B0C0C;
  --surface:     #121414;
  --surface-2:   #181B1B;
  --border:      #26292A;

  /* text */
  --text:        #F5F5F2;
  --text-muted:  #A9ABA8;
  --text-faint:  #6B6E6C;

  /* accent (deep green) */
  --accent:      #0F4F49;   /* primary button fill */
  --accent-live: #3DBFA8;   /* active nav, playing state, waveform progress */

  /* semantic */
  --sold:        #8A867E;   /* muted gray for sold beats */
  --danger:      #C0563F;

  /* shape */
  --radius-sm: 6px;
  --radius-pill: 999px;
  --space: 8px;             /* all spacing is multiples of 8 */
}
```

- **Type**: Heavy tight grotesque for display headlines (tracking about `-0.03em`), Inter for UI. Sentence case everywhere.
- **Icons**: 1.5px outline set (Lucide).
- **Rules**: Flat surfaces, 1px hairlines, shadow **only** under the hero search bar, and no gradients anywhere.

---

## 4. Routes & Screens

| Route | Screen | Access |
| :--- | :--- | :--- |
| `/` | Hero, license platforms, beat spotlight, pricing, FAQ | Public |
| `/beats` | Browse with filters (genre, mood, BPM, key, producer) | Public |
| `/beats/[slug]` | Beat detail, license selector, waveform player | Public |
| `/pricing` | Free vs Plus (₦3,000/mo), license tiers | Public |
| `/producers/[handle]` | Producer profile and their beats | Public |
| `/sign-in`, `/sign-up` | Auth with role selection (Artist / Producer) | Guest |
| `/checkout/success` | Order confirmation & immediate file downloads | Signed in |
| `/library` | My licenses, stem downloads & PDF agreements | Artist |
| `/likes` | Liked beats | Signed in |
| `/studio` | Producer overview, stats & revenue chart | Producer |
| `/studio/upload` | 3-step beat upload & R2 storage flow | Producer |

---

## 5. Licensing Tiers & Custom Pricing

| Tier | Price | Streams Cap | Video Cap | Stems Included | Ownership |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Starter Lease** | **₦3,000** `/ mo` | 100,000 | 1 | No (MP3 only) | Non-exclusive |
| **Premium Beat** | **₦30,000** `one-time` | 500,000 | 2 | Yes (Full WAV Stems) | Non-exclusive + Radio |
| **Exclusive Rights** | **₦100,000** `one-time` | Unlimited | Unlimited | Yes (Full WAV Stems) | 100% Sole Ownership |

---

## 6. Atomic Exclusive Lock (Spec 7.4)

When an exclusive license is purchased, the database executes an atomic lock to guarantee no race conditions can occur:

```sql
create or replace function acquire_exclusive_beat(p_beat_id uuid)
returns boolean as $$
declare
  v_updated_id uuid;
begin
  update beats
  set status = 'sold', sold_at = now()
  where id = p_beat_id and status = 'live'
  returning id into v_updated_id;

  return v_updated_id is not null;
end;
$$ language plpgsql security definer;
```

---

## 7. Getting Started

### Install Dependencies
```bash
npm install
```

### Run Web Marketplace
```bash
npm run dev:web
```
Open **`http://localhost:3000`** in your browser.
