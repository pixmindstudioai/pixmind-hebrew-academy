
# Global Visual Redesign Plan - PixMind Studio Academy

## Overview

This plan covers a complete visual redesign of the existing online academy platform. The redesign focuses **only on the UI layer** - no changes to routes, database tables, data structure, or business logic.

**Key Constraints:**
- Hebrew only, full RTL support
- All existing functionality must continue working
- No removal of existing components
- No changes to Course → Chapters → Lessons hierarchy

---

## 1. New Design System Foundation

### 1.1 Color Palette

Replace the current blue-navy theme with a refined, premium color scheme:

```text
┌─────────────────────────────────────────────────────────────┐
│  NEW COLOR SYSTEM                                           │
├─────────────────────────────────────────────────────────────┤
│  Background:     Warm charcoal   (220 15% 8%)               │
│  Surface/Card:   Elevated dark   (220 15% 11%)              │
│  Border:         Subtle edge     (220 12% 18%)              │
│                                                             │
│  Primary:        Amber/Gold      (38 92% 50%)               │
│  Primary Glow:   Light amber     (38 85% 65%)               │
│                                                             │
│  Secondary:      Cool gray       (220 15% 22%)              │
│  Accent:         Soft teal       (165 60% 40%)              │
│                                                             │
│  Text Primary:   Warm white      (45 10% 95%)               │
│  Text Muted:     Soft gray       (220 10% 55%)              │
│                                                             │
│  Success:        Fresh green     (142 72% 40%)              │
│  Warning:        Rich amber      (38 90% 55%)               │
│  Error:          Coral red       (0 72% 55%)                │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Typography System

Replace Rubik with a more elegant Hebrew-optimized font stack:

- **Primary Font**: "Heebo" - Modern Hebrew font with excellent RTL support
- **Fallback**: "Assistant", "Rubik", system-ui, sans-serif

**Type Scale:**
- Display (Hero titles): 4rem / 64px, font-weight 700
- H1 (Page titles): 2.5rem / 40px, font-weight 600
- H2 (Section titles): 1.875rem / 30px, font-weight 600
- H3 (Card titles): 1.25rem / 20px, font-weight 500
- Body: 1rem / 16px, font-weight 400, line-height 1.7
- Caption: 0.875rem / 14px, font-weight 400
- Small: 0.75rem / 12px, font-weight 400

### 1.3 Spacing System

New consistent spacing scale (in rem):
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)
- 3xl: 4rem (64px)

### 1.4 Border Radius

- Small (buttons, inputs): 8px (0.5rem)
- Medium (cards, dialogs): 12px (0.75rem)
- Large (hero sections): 16px (1rem)
- Full (avatars, pills): 9999px

### 1.5 Shadows

New shadow system with warm undertones:
- sm: 0 1px 2px rgba(0, 0, 0, 0.2)
- md: 0 4px 12px rgba(0, 0, 0, 0.15)
- lg: 0 8px 24px rgba(0, 0, 0, 0.2)
- glow: 0 0 20px rgba(245, 158, 11, 0.15) (primary color glow)

---

## 2. Files to Modify

### 2.1 Global Styles & Configuration

| File | Changes |
|------|---------|
| `index.html` | Add Heebo font from Google Fonts |
| `src/index.css` | Complete CSS variable overhaul, new utility classes |
| `tailwind.config.ts` | New color tokens, typography, animations |

### 2.2 Layout Components

| File | Changes |
|------|---------|
| `src/components/Navigation.tsx` | New header design with refined styling |
| `src/components/admin/AdminShell.tsx` | Redesigned admin sidebar and header |

### 2.3 Core UI Components (src/components/ui/)

| File | Changes |
|------|---------|
| `button.tsx` | New button variants with refined styles |
| `input.tsx` | Updated input styling with focus states |
| `card.tsx` | New card design with subtle borders |
| `badge.tsx` | New badge variants including success, warning |
| `tabs.tsx` | Refined tab styling |
| `dialog.tsx` | Updated dialog with RTL-aware close button |
| `accordion.tsx` | Enhanced accordion styling |
| `table.tsx` | Redesigned table with better spacing |
| `select.tsx` | Updated select dropdown styling |
| `progress.tsx` | New progress bar with gradient |
| `skeleton.tsx` | Refined skeleton animations |
| `alert.tsx` | Updated alert styling |
| `toast.tsx` / `sonner.tsx` | Updated toast styling |
| `avatar.tsx` | Refined avatar styling |
| `textarea.tsx` | Updated textarea styling |

### 2.4 Shared Components

| File | Changes |
|------|---------|
| `src/components/shared/ModuleCard.tsx` | Refined card design |
| `src/components/shared/ChapterAccordion.tsx` | Updated accordion styling |

### 2.5 Pages

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Hero section and content styling |
| `src/pages/Courses.tsx` | Page layout and card grid |
| `src/pages/CourseDetail.tsx` | Course detail styling |
| `src/pages/LessonView.tsx` | Lesson page layout |
| `src/pages/Login.tsx` | Auth form styling |
| `src/pages/SignUp.tsx` | Auth form styling |
| `src/pages/Profile.tsx` | Profile page styling |
| `src/pages/NotFound.tsx` | 404 page styling |
| Admin pages | Apply consistent admin styling |

---

## 3. Detailed Component Changes

### 3.1 Button Component

**New Variants:**
- `default`: Warm amber gradient with subtle hover glow
- `secondary`: Cool gray with light hover state
- `destructive`: Coral red with darker hover
- `outline`: Transparent with amber border
- `ghost`: Transparent with subtle hover background
- `link`: Amber text with underline on hover
- `premium`: Gold gradient for CTAs

**Styling Updates:**
- Softer border-radius (8px instead of 12px)
- Refined hover transitions (0.2s ease)
- Subtle box-shadow on hover
- Better disabled state opacity

### 3.2 Card Component

**New Design:**
- Subtle 1px border instead of heavy shadows
- Warm charcoal background with slight transparency
- Refined padding (1.5rem)
- Hover state with subtle border color change
- Optional "glass" variant with backdrop blur

### 3.3 Input & Form Elements

**Updates:**
- Consistent 8px border-radius
- Clear focus ring in primary color
- Better placeholder text contrast
- Icon positioning fixes for RTL
- Unified height (44px for default)

### 3.4 Navigation

**Header Redesign:**
- Cleaner, more minimal design
- Subtle border-bottom instead of backdrop-blur
- Better spaced nav items
- Refined mobile menu animation
- User avatar with dropdown

**Admin Sidebar:**
- Collapsible design with icons-only mode
- Clear active state indication
- Better hierarchy for menu items
- Refined color scheme

### 3.5 Tables

**Admin Table Redesign:**
- Alternating row backgrounds (subtle)
- Sticky header option
- Better cell padding
- Refined borders
- Improved RTL alignment

### 3.6 Dialogs & Modals

**Updates:**
- RTL-aware close button positioning (left side)
- Better backdrop overlay
- Refined entry/exit animations
- Consistent padding

### 3.7 Toast Notifications

**Updates:**
- Rounded design with icon
- Color-coded borders (success, error, info)
- RTL text alignment
- Refined animation

---

## 4. Page-Specific Updates

### 4.1 Home Page (Index.tsx)

- New hero section with refined gradient overlay
- Better typography hierarchy
- Improved stats section cards
- Refined featured courses grid
- Better CTA buttons

### 4.2 Courses Page

- Cleaner filter bar design
- Improved search input
- Better card grid spacing
- Refined empty state

### 4.3 Course Detail Page

- New hero section with course image
- Better progress visualization
- Refined chapter accordion design
- Improved sidebar cards

### 4.4 Lesson Page

- Better video player container
- Refined lesson info card
- Improved attachments section
- Better comments section styling

### 4.5 Login/Signup Pages

- Centered card design
- Better form field spacing
- Refined validation states
- Social login button styling (if added)

### 4.6 Profile Page

- Better profile header
- Refined tabs design
- Improved course progress cards

### 4.7 Admin Pages

- Consistent header styling
- Better data tables
- Refined filter controls
- Improved empty states
- Better loading skeletons

---

## 5. Animation & Transitions

### 5.1 New Animations

- `fade-in`: Refined 0.3s ease-out
- `scale-up`: Subtle 1.02 scale on hover
- `slide-up`: Content reveal from bottom
- `glow-pulse`: Subtle primary color pulse

### 5.2 Transition Guidelines

- Interactive elements: 0.2s ease
- Page transitions: 0.3s ease-out
- Content reveals: 0.4s ease-out
- Hover states: 0.15s ease

---

## 6. Accessibility Improvements

- WCAG 2.1 AA contrast ratios
- Clear focus indicators (2px solid primary)
- Focus-visible vs focus distinction
- Keyboard navigation support
- Screen reader improvements for Hebrew

---

## 7. Responsive Breakpoints

Maintained breakpoints with refined behavior:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

Key responsive updates:
- Better mobile navigation drawer
- Improved card stacking on mobile
- Refined table responsiveness
- Better touch targets (min 44px)

---

## 8. Implementation Order

### Phase 1: Foundation
1. Update `index.html` with Heebo font
2. Rewrite `src/index.css` with new design tokens
3. Update `tailwind.config.ts` with new theme

### Phase 2: Core Components
4. Update all UI components in `src/components/ui/`
5. Update shared components

### Phase 3: Layout
6. Update Navigation component
7. Update AdminShell component

### Phase 4: Pages
8. Update public pages (Index, Courses, CourseDetail, LessonView)
9. Update auth pages (Login, SignUp)
10. Update Profile page
11. Update admin pages

---

## Technical Notes

### Files That Will NOT Change
- All files in `src/hooks/`
- All files in `src/integrations/`
- All Supabase-related files
- `src/App.tsx` routing structure
- `src/types/` type definitions
- Business logic within page components

### RTL Considerations
- All `space-x-*` classes include `space-x-reverse`
- Icon positioning updated for RTL
- Dialog close button moved to left
- Consistent `text-right` for inputs
- Proper `dir="rtl"` maintained

### Estimated Scope
- ~25 component files to update
- ~10 page files to update
- 3 configuration files to update
- No database changes
- No route changes
- No business logic changes

