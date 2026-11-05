---
name: ZeroCoder
description: An in-browser Python learning atelier and exam prep platform
colors:
  primary: "#14b8a6"
  primary-hover: "#0d9488"
  secondary: "#6366f1"
  neutral-bg: "#0f1115"
  neutral-surface: "#1a1d24"
  neutral-elevated: "#232730"
  neutral-border: "#334155"
  text-primary: "#f8fafc"
  text-secondary: "#94a3b8"
  text-tertiary: "#64748b"
  status-error: "#ef4444"
  status-success: "#10b981"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.05em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "#14b8a6"
    textColor: "#ffffff"
    glow: "0 0 14px rgba(20, 184, 166, 0.38)"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "rgba(255, 255, 255, 0.04)"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
  button-utility:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "32px"
---

# Design System: ZeroCoder

## Overview

**Creative North Star: "The Focused Learning Atelier"**

The Focused Learning Atelier represents a refined fusion of a professional coding IDE and a calm academic learning environment. Designed specifically for university students mastering Python and preparing for coursework exams, the interface balances dense algorithmic feedback with peaceful reading typography. The system rejects both the visual clutter of utilitarian developer consoles and the infantilizing candy-colors of casual learning apps, choosing instead an understated, high-craft atmosphere where code clarity commands full attention.

Visual structure is anchored by disciplined typography, subtle glassmorphic surfaces, and a low-glare dark-mode canvas. The experience remains fluid across 6 synchronized color themes (Midnight, Daylight, Blush, Oceanic, Carbon, Amber), dynamically adapting contrast for long study sessions while maintaining identical structural ergonomics. Controls and toolbars remain compact and keyboard-friendly, elevating tactile pill buttons only for decisive primary actions (Run, Check, Submit).

**Key Characteristics:**
- **Distraction-Free Discipline:** Clean layout partitions, transparent editor gutter integration, and zero layout shift or letterboxing.
- **Tonal Depth Hierarchy:** Subtle 1px borders and progressive surface steps (Base -> Surface -> Elevated) replacing heavy muddy drop shadows.
- **Selective Tactility:** Compact 6px radius utility controls for toolbars paired with springy pill-shaped primary triggers.
- **Complete Theme Parity:** Pure Vanilla CSS tokenization ensuring flawless rendering across 6 dark and light palettes.

## Colors

The color palette centers on Adaptive Atelier Emerald-Teal against deep, neutral-warm slate tones, reserving high-chroma illumination strictly for meaningful interactive feedback and execution states.

### Primary
- **Atelier Emerald-Teal** (#14b8a6): Signature brand accent expressing intelligence, precision, and technological calm. Used for primary CTAs (Run, Submit), active tab indicators, and interactive code highlights. Adapted to darker teal tones (#0d9488) on light themes to maintain WCAG AA contrast.
- **Atelier Emerald-Hover** (#0d9488): Subtle deepen state for primary interactions.

### Secondary
- **Indigo Accent** (#6366f1): Secondary accent applied sparingly to distinguish secondary algorithmic paths, AI suggestions, and supplemental educational markers.

### Neutral
- **Abyssal Slate** (#0f1115): The primary canvas background of the default Midnight theme. A low-glare, non-pure-black void designed for extended night sessions.
- **Atelier Obsidian** (#1a1d24): Primary surface color for sidebars, glass panels, and header bars.
- **Elevated Slate** (#232730): Elevated cards, toolbars, terminal backgrounds, and floating modal headers.
- **Border Slate** (#334155): Subtle 1px boundary separating panels and structural regions.
- **Text Primary** (#f8fafc): High-contrast crisp foreground for headings, active code, and primary values.
- **Text Secondary** (#94a3b8): Calibrated reading tone for explanations, problem descriptions, and inactive states.
- **Text Tertiary** (#64748b): Muted tone for shortcuts, line numbers, and timestamps.

### Status
- **Execution Success** (#10b981): Luminous emerald indicating passed test assertions and completed assignments.
- **Execution Error** (#ef4444): Sharp crimson indicating assertion failures, syntax exceptions, and critical warnings.

### Named Rules
**The 10% Focus Accent Rule.** The primary Emerald-Teal accent is used on ≤10% of any viewport. Surfaces, gutter panels, and editor chrome remain strictly neutral. Its rarity is what gives it immediate navigational authority.

**The Theme Parity Rule.** Every UI element must resolve colors through semantic CSS custom properties (`var(--bg-base)`, `var(--accent-primary)`, etc.). Never write hardcoded hex values in component inline styles or new markup.

## Typography

**Display Font:** Inter (fallback: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)  
**Body Font:** Inter  
**Label/Mono Font:** JetBrains Mono (fallback: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)

**Character:** The pairing of Inter's clean, neutral grotesque proportions with JetBrains Mono's open apertures and tall x-height yields exceptional legibility for complex mathematical formulas, nested Python code, and dense explanatory prose.

### Hierarchy
- **Display** (700, 1.75rem / 28px, 1.2 line-height): Workspace headers, course titles, and modal title banners.
- **Headline** (600, 1.45rem / 23px, 1.3 line-height): Lecture titles, category headers, and problem titles.
- **Title** (600, 1.15rem / 18px, 1.4 line-height): Card headers, section dividers, and modal sub-headings.
- **Body** (400, 0.875rem / 14px, 1.6 line-height): Problem descriptions, lesson narrative, explanations, and instructions (max line length ~70ch for optimal reading).
- **Label** (600, 0.75rem / 12px, 1.0 line-height, 0.05em letter-spacing): Uppercase tags, test case status pills, practice badges, and keyboard shortcut chips.

### Named Rules
**The Code Legibility Rule.** All Python source code, cell inputs, test assertions, and virtual terminal output must strictly render in JetBrains Mono with 1.5 line-height and proportional character spacing.

## Layout

The spatial model relies on a full-height, flexbox-governed application shell (`height: 100dvh`) partitioned into clean, scroll-contained regions:
- **Global Header:** Sticky 64px bar (`background-color: color-mix(in srgb, var(--bg-surface) 90%, transparent)` with 12px blur) with balanced tripartite distribution (Left branding, Center navigation tabs, Right user controls).
- **Split Workspace:** 400px fixed-minimum sidebar for problem descriptions and test suite, with a flexible dual-pane code editor and bottom 110px terminal console.
- **Density & Rhythm:** 8px base grid rhythm (xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px). Generous 24px padding for lecture reading surfaces; compact 8-12px padding for IDE toolbars.
- **Responsive Auto-Collapse:** The header actions use container queries (`@container header-right (max-width: 660px)`) and viewport queries (`@media (max-width: 1600px)`) to collapse text buttons into 32x32 GitHub-style icon buttons without horizontal overflowing. On mobile (<768px), workspace action buttons scale into dedicated 36x36 touch circles.

## Elevation & Depth

ZeroCoder conveys depth primarily through **tonal layering** and **translucent glassmorphic surfaces**, rather than dark drop shadows. Surfaces lighten as they rise in stacking hierarchy: Base (`#0f1115`) -> Surface (`#1a1d24`) -> Elevated (`#232730`) -> Highlight (`#2e3440`).

### Shadow Vocabulary
- **Glass Panel Rest** (`box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`): Default subtle separation for lecture cards and floating panels, bordered with `1px solid rgba(255, 255, 255, 0.05)`.
- **Primary Button Rest** (`box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)`): Inset top highlight paired with soft shadow for primary action buttons.
- **Primary Button Hover** (`box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)`): Elevated state under user hover.
- **Modal Scrim & Overlay** (`box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5)`): Deep focal elevation for popup modals, centered against a 50% opacity backdrop.

### Named Rules
**The Tonal Surface Rule.** Elevation is communicated through progressive surface luminance and subtle 1px translucent borders (`border-color`), never through opaque or exaggerated box-shadows.

## Shapes

- **Form Language:** Crisp, modern rectangular panes tempered by soft inner radii and selective organic pills.
- **Small Controls (`--radius-sm: 6px`):** Used for utility header buttons, tag chips, code blocks, and dropdown menus.
- **Containers & Cards (`--radius-md: 8px`):** Used for test case cards, example code containers, and dashboard lecture items.
- **Floating Modals (`--radius-lg: 12px`):** Used for settings dialogs, admin panels, and full-screen cheatsheet popups.
- **Action Pills (`9999px`):** Reserved exclusively for high-intent triggers (`.button-primary`, `.button-secondary`, segmented pill tab navigation).

## Components

### Buttons
- **Shape:** Pill-shaped (`border-radius: 9999px`) for primary/secondary; compact rounded rectangle (6px) for header utilities.
- **Primary (.button-primary):** `background: var(--accent-primary)`, `color: var(--text-on-accent)`, inset 1px highlight, smooth transition (`all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)`).
- **Hover / Focus:** Lifts `transform: translateY(-2px)`, deepens shadow; on click drops `translateY(1px)`.
- **Secondary (.button-secondary):** Translucent ghost surface `rgba(255, 255, 255, 0.04)` with `1px solid var(--border-color)` and subtle hover illumination.
- **Utility Header Buttons (.header-btn):** 32px height, 6px radius, collapses gracefully to icon-only at container width < 660px.

### Chips & Badges
- **Status Badges (.badge):** Micro-pills (0.25rem 0.5rem, 12px text, 600 weight, uppercase). Pass: `rgba(16, 185, 129, 0.2)` with emerald text; Fail: `rgba(239, 68, 68, 0.2)` with red text.
- **Tag Pills (.badge-master-tag, .feature-pill):** Subtle elevated background chips with 4px border radius for categorization and dataset markers.

### Cards & Panels
- **Glass Panel (.glass-panel):** `rgba(26, 29, 36, 0.7)` with `backdrop-filter: blur(12px)` and 1px translucent border.
- **Test Case Container (.test-case):** Elevated row with 8px radius, flex alignment, and color-coded status border.
- **Master Cheatsheet Card (.master-cheatsheet-card):** Prominent hero card with integrated feature pills and direct access CTA.

### Inputs & Softer Fields
- **Search & Text Inputs:** `background: var(--bg-surface)`, `border: 1px solid var(--border-color)`, 6px radius, smooth focus transition with `outline: none` and `border-color: var(--accent-primary)`.

### Navigation & Segmented Tabs
- **Segmented Pill Navigation (.segmented-pill-track):** Contained pill background track housing active sliding buttons that visually pop with elevated surface and text illumination.

### Signature Component: Translucent CodeMirror Editor
- **Style:** CodeMirror 6 configured with 100% transparent background (`EditorView.theme({ "&": { backgroundColor: "transparent !important" } })`), seamlessly taking the active theme's background.
- **Gutters:** Transparent background with subtle 1px border separating line numbers from active code.
- **Caret & Selection:** Accent-tinted caret matching `--accent-primary` with high-contrast text selection.

## Do's and Don'ts

### Do:
- **Do** honor the Translucent Editor Doctrine: CodeMirror must remain 100% transparent and seamlessly blend into the active theme canvas without black letterboxing.
- **Do** write all CSS rules in `src/index.css` using established design tokens (`var(--bg-base)`, `var(--text-primary)`, `var(--accent-primary)`).
- **Do** verify visual hierarchy and contrast across all 6 themes (Midnight, Daylight, Blush, Oceanic, Carbon, Amber) for any UI modification.
- **Do** ensure responsive collapse: header buttons must collapse cleanly to 32x32 icon buttons on compact widths, and mobile buttons must offer 36x36 circular touch targets.
- **Do** use the custom modal and toast system in `NotificationContext` for all user alerts and confirmation dialogues.

### Don't:
- **Don't** introduce Tailwind CSS or utility-first CSS frameworks into the project.
- **Don't** use pure `#000000` black for dark mode backgrounds; use `#0f1115` (Abyssal Slate) to prevent harsh contrast glare.
- **Don't** create nested scrollbars (never place multiple `overflow: auto` containers inside the same layout hierarchy).
- **Don't** use browser-native `window.alert()` or `window.confirm()`.
- **Don't** allow accent colors to bleed onto large layout surfaces; reserve Emerald-Teal strictly for key interactive elements (≤10% of viewport).
