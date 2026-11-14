---
name: MoneyCheck Modern FinTech
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#444653'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#757684'
  outline-variant: '#c4c5d5'
  surface-tint: '#3755c3'
  primary: '#00288e'
  on-primary: '#ffffff'
  primary-container: '#1e40af'
  on-primary-container: '#a8b8ff'
  inverse-primary: '#b8c4ff'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#4c2e00'
  on-tertiary: '#ffffff'
  tertiary-container: '#6b4200'
  on-tertiary-container: '#ffa929'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#173bab'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 68px
    letterSpacing: -0.025em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 46px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  label-numeric:
    fontFamily: JetBrains Mono
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.02em
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 4rem
---

## Brand & Style

This design system targets modern Korean digital banking and wealth health-check consumers seeking absolute clarity, immediacy, and fiscal intelligence. The design movement pairs **Corporate Modernism** with crisp **Editorial Polish**: structural grid discipline, high-density clarity, pristine surfaces, and tactfully placed tactile high-chroma accents.

Key emotional anchors:
- **Unwavering Trust (신뢰감):** Established through deep royal blues, crisp alignment, and calm, uncluttered data hierarchy.
- **Dynamic Intuition (직관성):** Realized via vibrant golden-amber micro-interactions, explicit diagnostic states, and instant progress markers.
- **Airy Precision (정밀함):** Maintained through subtle border definitions, pure chalk-white surfaces, and generous negative space that mitigates financial anxiety.

## Colors

The palette balances authoritative institutionality with vibrant consumer engagement:

- **Primary (`#1E40AF`):** Deep Royal Cobalt. Used for anchor elements, primary brand statements, headers, authoritative active states, and high-value navigation badges.
- **Secondary (`#2563EB`):** Vibrant Electric Blue. Drives interactive forward actions, link hovers, active graph charts, focus rings, and primary interactive buttons.
- **Tertiary (`#F59E0B`):** Radiant Amber Gold. Reserved exclusively for diagnostics, alerts, reward incentives, financial health score highlights, and interactive callouts.
- **Neutral Surface Palette:**
  - Base Background: `#F8FAFC` (Slate 50) delivers an easy-reading, anti-glare canvas.
  - Card & Modal Surfaces: `#FFFFFF` (Pure White).
  - Ghost Borders & Separators: `#E2E8F0` (Slate 200) and `#CBD5E1` (Slate 300).
  - Body Text: `#334155` (Slate 700) and `#0F172A` (Slate 900) for headline contrast.
  - Subdued Text / Captions: `#64748B` (Slate 500).

## Typography

The type system blends contemporary Korean neo-grotesque structural conventions with Latin geometric clarity. In digital execution, fall back gracefully to `Pretendard`, `-apple-system`, `BlinkMacSystemFont`, or `system-ui` to guarantee native Hangul glyph precision, zero optical distortion, and complete CJK weight pairing.

- **Headlines:** Use tightened negative tracking (-0.015em to -0.025em) and confident weights (600 to 800) to deliver concise, journalistic financial assertions.
- **Body:** Open line-heights (1.6x) ensure complex financial figures, terms, and conditions remain effortless to parse across dense screens.
- **Numerics & Badges:** Monospaced values (`JetBrains Mono`) anchor monetary counters, APR percentages, and timeline metrics with tabular precision.

## Layout & Spacing

The structural layout utilizes a strict 12-column responsive fluid grid with standardized maximum container constraints:

- **Desktop (≥1200px):** 12 columns, max-width `1280px`, `1.5rem` (24px) gutters, and `3rem` (48px) side margins.
- **Tablet (768px - 1199px):** 8 columns, fluid width, `1.25rem` (20px) gutters, and `2rem` (32px) margins.
- **Mobile (<768px):** 4 columns, fluid width, `1rem` (16px) gutters, and `1.25rem` (20px) margins.

Vertical rhythm adheres strictly to an 8pt baseline scale. Component padding scales through `space-xs` (4px) up to `space-2xl` (64px), reserving larger spaces for separating thematic landing sections and interactive self-check calculator panels.

## Elevation & Depth

Visual hierarchy is maintained through disciplined **tonal layering**, **feathered ambient drop-shadows**, and **sleek hairline outlines**:

- **Tier 0 (Canvas):** Flat `#F8FAFC`. Zero elevation.
- **Tier 1 (Cards & Modules):** Pure white background (`#FFFFFF`) with a 1px structural stroke in `#E2E8F0` and an ambient, multi-layered diffuse shadow:
  - `0 1px 3px rgba(15, 23, 42, 0.04), 0 6px 16px -2px rgba(15, 23, 42, 0.06)`
- **Tier 2 (Interactive Floating States & Dropdowns):**
  - `0 12px 28px -4px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.03)`
- **Tier 3 (Active Calculator Modals & Sticky Mobile Action Trays):**
  - Hairline border `#CBD5E1` combined with deep ambient occlusion: `0 20px 40px -8px rgba(30, 64, 175, 0.12)`.
- **Micro-Highlight:** Interactive interactive elements (such as primary buttons or diagnostic gauges) use a subtle inner border highlight: `inset 0 1px 0 rgba(255, 255, 255, 0.2)`.

## Shapes

The design uses a refined, rounded geometric language (`roundedness: 2`):

- **Default Element Radius:** `0.5rem` (8px) for buttons, inputs, pills, select boxes, and alert containers.
- **Containers & Cards (`rounded-lg`):** `1rem` (16px) for financial tips cards, diagnostic step sections, and interactive simulator containers.
- **Hero & Feature Hubs (`rounded-xl`):** `1.5rem` (24px) for hero self-check panels, summary callout banners, and modal dialogs.
- **Full Radius (`rounded-full`):** Reserved for category tag pills, status chips, user avatars, and floating step markers.

## Components

### 1. Primary & Secondary Buttons
- **Primary Action (신청하기 / 진단 시작):** Background `#2563EB`, text `#FFFFFF`, font weight 600. `0.75rem` vertical by `1.5rem` horizontal padding. Subtle inset top highlight, 8px border radius. Hover shifts to `#1E40AF` with a subtle elevation boost.
- **Secondary / Ghost Action:** Background `#FFFFFF`, border 1px solid `#E2E8F0`, text `#1E40AF`. Hover shifts background to `#F1F5F9`.
- **Accent Highlight Action:** Vibrant Amber `#F59E0B` with dark slate text `#0F172A` for limited-time bonuses or urgent financial alerts.

### 2. Interactive Self-Check Hero Panel
- Two-column split on desktop; unified card on mobile.
- Left column presents authoritative headline, dynamic live tally badge, and key benefits.
- Right column encloses the **Self-Diagnosis Widget**:
  - Embedded within a Tier 2 surface with subtle Royal Blue gradient ambient glow (`rgba(37, 99, 235, 0.05)`).
  - Segmented sliders with numeric output displays using tabular numerals (`JetBrains Mono`).
  - Step progress indicated via numbered amber/blue step pills.

### 3. Financial Tip & Insight Cards
- Border 1px solid `#E2E8F0`, pure white surface (`#FFFFFF`), 16px corner radius.
- Categorical badge pinned to top-left (e.g., "절세 팁", "지출 분석") using soft-tinted backgrounds:
  - Blue category: `#EFF6FF` background with `#1E40AF` text.
  - Amber category: `#FEF3C7` background with `#B45309` text.
- Clean typography hierarchy: Category Badge -> Headline (600 weight) -> Subtitle -> Read Time / Action icon.
- Hover state: 1px border transitions from `#E2E8F0` to `#93C5FD`, card raises 4px via smooth transform.

### 4. Input Fields & Select Controls
- Height 48px, background `#FFFFFF`, border 1px solid `#CBD5E1`, padding horizontal 16px.
- Focus state: Border color changes to `#2563EB` paired with an external focus glow: `0 0 0 3px rgba(37, 99, 235, 0.15)`.
- Korean Won prefix/suffix (₩, 원) pinned in neutral `#64748B` with tabular monospaced alignment.

### 5. Chips & Diagnostic Badges
- Pill-shaped (`rounded-full`), height 28px to 32px, padding horizontal 12px.
- Positive status: `#ECFDF5` background, `#047857` text.
- Attention / Caution status: `#FEF3C7` background, `#B45309` text.
- Selected filter state: `#1E40AF` background, `#FFFFFF` text.

### 6. Interactive Checkboxes & Radio Selectors
- Checkboxes: 20px x 20px, 4px border radius. Unchecked `#CBD5E1` border; checked `#2563EB` solid fill with crisp white geometric checkmark.
- Radio buttons: 20px circular outline with 8px centered inner dot when active.