---
name: TOEIC Mastery System
colors:
  surface: '#f7fafc'
  surface-dim: '#d7dadc'
  surface-bright: '#f7fafc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f6'
  surface-container: '#ebeef0'
  surface-container-high: '#e5e9eb'
  surface-container-highest: '#e0e3e5'
  on-surface: '#181c1e'
  on-surface-variant: '#43474e'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eef1f3'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#455f88'
  primary: '#002045'
  on-primary: '#ffffff'
  primary-container: '#1a365d'
  on-primary-container: '#86a0cd'
  inverse-primary: '#adc7f7'
  secondary: '#944b00'
  on-secondary: '#ffffff'
  secondary-container: '#fe9743'
  on-secondary-container: '#6b3500'
  tertiary: '#00213e'
  on-tertiary: '#ffffff'
  tertiary-container: '#003762'
  on-tertiary-container: '#58a2f0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#adc7f7'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#2d476f'
  secondary-fixed: '#ffdcc5'
  secondary-fixed-dim: '#ffb783'
  on-secondary-fixed: '#301400'
  on-secondary-fixed-variant: '#703700'
  tertiary-fixed: '#d2e4ff'
  tertiary-fixed-dim: '#9fcaff'
  on-tertiary-fixed: '#001d37'
  on-tertiary-fixed-variant: '#00497e'
  background: '#f7fafc'
  on-background: '#181c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

This design system is built to evoke a sense of structured ambition. It balances the rigor of academic preparation with the modern efficiency of a productivity tool. The brand personality is authoritative yet encouraging, designed to reduce the anxiety of high-stakes testing through organized clarity.

The visual style follows a **Modern Corporate** aesthetic with a heavy emphasis on **Minimalism**. It utilizes a card-based architecture to modularize complex study schedules into digestible tasks. High-contrast typography and intentional white space ensure that users remain focused on their learning objectives without visual fatigue.

## Colors

The palette is anchored by **Trustworthy Navy Blue**, which serves as the primary color for navigation, headers, and primary actions to establish a professional atmosphere. **Achievement Orange** is reserved strictly for high-priority Calls to Action (CTAs) and "success" moments, such as completing a practice test or hitting a daily goal, creating a psychological link between the color and progress.

**Calm Gray** acts as the canvas, providing a low-contrast background that makes the white cards pop. Tertiary blues are used for informational links and secondary data visualizations, while status colors (Success Green and Error Red) are applied to scoring metrics and incorrect answer feedback.

## Typography

The design system utilizes **Inter** exclusively to ensure maximum legibility across dense data and long-form reading passages common in TOEIC prep. 

The type hierarchy is highly structured. **Display** and **Headline** levels use heavier weights and tighter letter spacing to create a sense of importance for scores and section titles. **Body** text is optimized for readability with generous line heights to prevent eye strain during study sessions. **Labels** utilize uppercase styling and increased tracking for metadata, such as time remaining or question categories, providing a clear distinction from primary content.

## Layout & Spacing

The layout philosophy is based on a **Fixed Grid** for desktop and a **Fluid Grid** for mobile devices. On desktop, content is centered within a 1200px max-width container using a 12-column grid. Mobile views utilize a single-column layout with 16px side margins.

Spacing follows a strict 4px base unit, ensuring a mathematical rhythm throughout the interface. Cards are separated by "lg" (24px) spacing to provide clear visual breathing room. Internal padding for cards is typically "md" (16px) or "lg" (24px) depending on the complexity of the data inside.

## Elevation & Depth

To maintain a clean and professional appearance, this design system uses a combination of **low-contrast outlines** and **ambient shadows**. 

- **Level 0 (Background):** Solid background in Calm Gray.
- **Level 1 (Cards):** White surfaces with a 1px border (#E2E8F0) and a very soft, diffused shadow (0px 4px 6px rgba(26, 54, 93, 0.04)).
- **Level 2 (Interactive/Active):** Elements like active input fields or hovered cards gain a slightly more pronounced shadow and a primary-colored border.
- **Level 3 (Overlay/Modals):** High-elevation components use a deeper shadow with a 10% opacity navy tint to maintain color harmony with the brand.

## Shapes

The design system employs a **Rounded** shape language to soften the academic nature of the app and make the experience feel more modern and accessible.

- **Standard Elements:** Buttons, input fields, and small cards use a 0.5rem (8px) radius.
- **Large Containers:** Dashboard widgets and main study cards use a "rounded-lg" 1rem (16px) radius to create a distinct visual container.
- **Indicators:** Progress bars and status tags utilize fully rounded "pill" shapes to differentiate them from interactive buttons.

## Components

### Buttons
- **Primary:** Solid Navy Blue with white text for main navigation actions.
- **CTA:** Solid Achievement Orange with white text for "Start Test," "Resume Study," or "Upgrade."
- **Ghost:** Navy Blue outline with transparent background for secondary actions like "View History."

### Cards
Cards are the primary container for study modules. They should always feature a white background and the defined Level 1 elevation. Headers within cards should use `label-lg` for categorizing content (e.g., "LISTENING SECTION").

### Progress Visualizations
- **Linear Progress:** Used for daily goals. Achievement Orange is used for the fill color against a light gray track.
- **Circular Progress:** Used for overall score readiness. Features a thick Navy Blue stroke with the score centered in `headline-lg`.

### Input Fields
Inputs are clean with a 1px gray border. Upon focus, the border transitions to Navy Blue with a subtle 2px outer glow. Labels always sit above the field in `label-md`.

### Chips & Tags
Small, pill-shaped tags are used to identify question difficulty (Easy/Medium/Hard) or topic (Grammar, Vocabulary). These use a low-opacity background tint of the status colors for high legibility without distracting from the main content.