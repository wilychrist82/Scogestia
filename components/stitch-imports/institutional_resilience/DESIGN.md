---
name: Institutional Resilience
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3f4944'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6f7973'
  outline-variant: '#bec9c2'
  surface-tint: '#1b6b51'
  primary: '#004532'
  on-primary: '#ffffff'
  primary-container: '#065f46'
  on-primary-container: '#8bd6b7'
  inverse-primary: '#8bd6b6'
  secondary: '#545f73'
  on-secondary: '#ffffff'
  secondary-container: '#d5e0f8'
  on-secondary-container: '#586377'
  tertiary: '#393d3f'
  on-tertiary: '#ffffff'
  tertiary-container: '#505456'
  on-tertiary-container: '#c5c8ca'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a6f2d1'
  primary-fixed-dim: '#8bd6b6'
  on-primary-fixed: '#002116'
  on-primary-fixed-variant: '#00513b'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Work Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Work Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Work Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Work Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Work Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2rem
  xxl: 3rem
  touch-target: 3rem
  container-max: 1280px
  gutter: 1rem
---

## Brand & Style

The design system is built on the principles of **Institutional Professionalism** and **Functional Clarity**. Designed for the West African educational sector, it prioritizes trust and accessibility over aesthetic trends. The personality is authoritative yet approachable, ensuring school administrators feel a sense of stability and parents feel a sense of transparency.

The visual style follows a **Modern Corporate** approach with a focus on high-legibility and low-latency performance. It utilizes a structured grid, clear information hierarchy, and a restricted decorative palette to ensure the interface remains lightweight for regions with varying internet speeds. There is a deliberate avoidance of heavy blurs, complex gradients, or large image assets.

## Colors

The palette is anchored by **Deep Emerald Green**, a color associated with growth, stability, and institutional credibility. 

- **Primary:** Deep Emerald is used for primary actions, active navigation states, and brand identifiers.
- **Text & UI Base:** Deep Navy is used for primary headings and body text to provide higher contrast than pure black, reducing eye strain.
- **Backgrounds:** A tiered system of light grays and white ensures content areas are clearly defined without requiring heavy borders.
- **Semantic Colors:** Success (Green), Warning (Amber), and Error (Red) are high-saturation to ensure status badges (e.g., "Paid", "Late") are immediately identifiable at a glance.

## Typography

This design system employs a dual-font strategy to balance authority with extreme legibility.

1. **Work Sans (Headlines):** Used for its professional and grounded character. Its slightly wider apertures ensure titles remain clear even on lower-resolution mobile screens.
2. **Public Sans (Body/Labels):** An institutional font designed for clarity. It is used for all data entry, reports, and parent communications.

**Key Rules:**
- The default body size is **16px** to accommodate users across different age groups and device types.
- For Parent-facing mobile views, use `body-lg` (18px) for critical notifications to ensure immediate readability.
- All labels use a medium or semi-bold weight to differentiate them from data values.

## Layout & Spacing

The layout strategy is **Hybrid-Responsive**:
- **Admin/Accountant:** A 12-column fluid grid optimized for data-dense tables and side-navigation on desktop.
- **Parent:** A single-column vertical stack for mobile, prioritizing a "Card-per-Item" flow.

**Spacing Rhythm:**
- A base 8px (0.5rem) grid is used.
- **Touch Targets:** For mobile interfaces (Parents), all interactive elements (buttons, inputs, list items) must have a minimum height of **48px (3rem)** to ensure ease of use on the go.
- **Margins:** Use `xl` (32px) margins on desktop dashboards, reducing to `md` (16px) on mobile to maximize screen real estate.

## Elevation & Depth

To maintain a lightweight footprint, the design system avoids heavy shadows. Instead, it uses **Tonal Layering** and **Low-Contrast Outlines**:

- **Level 0 (Surface):** The main background uses `#F8FAFC` (Soft Gray).
- **Level 1 (Cards/Sections):** White surfaces with a 1px border of `#E2E8F0`. This creates a "sheet" effect without the CSS processing overhead of blurs or shadows.
- **Level 2 (Modals/Popovers):** A very soft, single-source shadow (e.g., `0 4px 6px -1px rgb(0 0 0 / 0.1)`) is used only for elements that require immediate user focus.
- **Active States:** Subtle 2px inset borders or solid color fills indicate selection, rather than depth changes.

## Shapes

The shape language is **Soft and Structural**. 

- UI elements use a **0.25rem (4px)** base radius. This provides a professional, "folder-like" appearance that feels more institutional than fully rounded consumer apps.
- **Status Badges:** Use `rounded-lg` (8px) to distinguish them from functional buttons.
- **Input Fields:** Maintain the base `rounded` (4px) to emphasize a formal, form-driven environment.

## Components

### Buttons
- **Primary:** Solid Deep Emerald Green with White text. Minimum 48px height for mobile.
- **Secondary:** Transparent with a 1px Deep Emerald border.
- **Actionable Icons:** Use simple, stroke-based icons (2px weight) with clear text labels whenever possible to avoid ambiguity.

### Status Badges
- Used for "Paid", "Late", "Pending".
- Styling: Light tinted background (10% opacity of status color) with high-contrast bold text in the primary status color. 
- Example: "Late" has a light amber background with deep amber text.

### Cards
- White background, 1px `#E2E8F0` border.
- Cards should have a `md` (16px) internal padding.
- For mobile, cards are full-width with no horizontal margin to save space.

### Data Tables (Admin Only)
- High-density rows with 12px vertical padding.
- Alternating row stripes (Zebra striping) using `#F8FAFC` for high-volume data legibility.

### Inputs
- Outlined style. The border thickens to 2px Deep Emerald Green on focus. 
- Labels must always be visible (not floating) to ensure clarity during data entry.