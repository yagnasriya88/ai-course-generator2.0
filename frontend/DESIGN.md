# Learnify AI — Frontend Design System

Source of truth: `src/index.css` (Tailwind v4 `@theme` tokens). This doc explains
the *intent* behind those tokens and the conventions layered on top of them in
components — it doesn't duplicate values that would drift out of sync; read
`index.css` for the literal hex/scale values.

## Color

- **Primary (blue, `primary-50`…`900`)** — CTAs, active nav/tab states, links,
  the AI/agent accent color. This is the one color allowed to dominate a page.
- **Accent (amber, `accent-400/500/600`)** — used sparingly: XP badges, streak,
  Hinglish mode, highlights. Never a full scale on purpose — it's a spice, not
  a second primary.
- **Success / Danger (`success-500/600`, `danger-500/600`)** — quiz
  correctness, destructive actions, error states only. Not decorative.
- **Surface (`surface-0/50/100/200`)** — neutral backdrop scale from white to
  light slate. The global body background (see "Background system" below)
  washes this with a soft blue tint rather than sitting flat white.
- **Blush (`blush-100/200`)** — pastel pink, illustration-halo backdrops only
  (see `illustrations/`). Not for text, buttons, or borders.
- **Anti-pattern to avoid:** purple/violet as a primary gradient stop. One
  historical exception lived in `utils/coverGradient.js`'s rotating palette —
  replaced with a blue-family tone (`sky-500 → primary-600`) to keep the
  generated-cover palette from drifting into "generic AI purple."

## Typography

- **Display (`font-display`, Sora)** — `h1/h2/h3` only (wired globally in
  `index.css`), plus hero headings set explicitly with `font-display`.
- **Sans (`font-sans`, Inter)** — body copy, UI labels, everything else; it's
  the `body` default so most elements never need the class.
- **Mono (`font-mono`, JetBrains Mono)** — code blocks only.
- No custom type-scale tokens — Tailwind's default `text-xs`…`text-5xl` scale
  is used directly. In practice: `text-4xl/5xl` for page hero headings,
  `text-2xl` for page titles, `text-lg` for card/section titles, `text-sm` for
  body/UI text, `text-xs` for captions/badges/meta.

## Spacing & Radius

No custom spacing/radius tokens — Tailwind defaults, used with these
conventions (not enforced by the type system, so keep new components aligned):

| Element | Radius |
|---|---|
| Cards, panels, major containers | `rounded-2xl` |
| Buttons, inputs, pills-that-aren't-fully-round | `rounded-xl` / `rounded-lg` |
| Badges, avatars, tab pills | `rounded-full` |
| Hero/auth glass panels | `rounded-3xl` (reserved for the single largest surface on a page) |

## Elevation

- **`shadow-glow`** (custom token, `index.css`) — a soft blue-tinted shadow +
  1px ring; the default elevation for glass cards, primary buttons, and
  anything that should read as "the important surface." This is the
  workhorse — prefer it over stock Tailwind shadows for anything primary-brand
  related.
- Stock `shadow-sm` — resting state for plain (non-glass) cards.
- Stock `shadow-xl`/`shadow-2xl` — reserved for floating overlays (dropdown
  menus, toasts, modals) that sit above everything else.

## Background system

Two layers, used together:

1. **Global wash** (`body` in `index.css`) — a fixed, very-low-opacity dot
   grid over a soft top-to-bottom blue gradient. This is what keeps chrome
   *outside* any page-level component (scroll overshoot, the app shell) from
   ever reading as flat white.
2. **`components/PageBackground.jsx`** — per-page animated blob layer, three
   tones (`primary` default, `accent` for the generative/creation moment on
   New Course, `calm` for long-form reading on Lesson/Video pages). Blobs
   drift slowly via Framer Motion and freeze under `prefers-reduced-motion`
   (via `useReducedMotion`).

Glassmorphism convention layered on top of both: `border border-white/60
bg-white/70 backdrop-blur-md shadow-glow` for any major content card sitting
on a `PageBackground`. This exact class string is intentionally repeated
rather than extracted into a component — it's short enough that a shared
`GlassCard` wrapper would be premature abstraction.

## Motion

- `utils/motion.js` exports the two entrance variants used for page content:
  `fadeInUp` (12px rise + fade, 0.35s ease-out) and `staggerContainer`
  (staggers children 60ms apart). Both are also exposed via
  **`usePageMotion()`**, which swaps them for a no-op variant when the user
  has `prefers-reduced-motion` set — use the hook (not the raw exports)
  in any page-level component so reduced-motion is respected automatically.
- Interactive micro-transitions (hover, focus, open/close) are inlined per
  component with Tailwind's `transition` utilities or a local Framer Motion
  spring — typically 150–250ms, matching the brief's target range.
- Celebratory moments (streak milestones, rewards, quiz success) use the
  shared `celebrationSpring` constant, not the entrance variants — motion
  intensity should scale with how significant the moment is.

## Accessibility

- Respect `prefers-reduced-motion` via `usePageMotion()` (page transitions)
  and `useReducedMotion()` directly (`PageBackground`'s blobs).
- Decorative illustrations and background blobs are `aria-hidden`.
- Interactive icon-only controls carry `aria-label`.
- Color contrast: body text sits on `surface-50`/glass-white backgrounds,
  never directly on a saturated primary/accent fill without a dedicated
  on-color text class.

## Explicit non-goals

- **No dark mode.** `color-scheme: light` is set deliberately; this was a
  prior, intentional product decision, not an oversight.
- **No component library migration.** This app is Vite + React + JS (not
  Next.js/TypeScript/shadcn) — redesign work stays within that stack rather
  than a framework rewrite, to avoid re-risking everything already shipped.
