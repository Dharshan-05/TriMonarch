# Mini ERP — Frontend Design System Architecture (Phase 081)

Comprehensive visual language, component specification, and design token documentation for all Mini ERP frontend modules (Phases 082–100).

---

## 1. Core Visual Principles

1. **Enterprise Grade & High Information Density**: Designed for daily business operations, complex inventory tables, manufacturing orders, and audit ledgers. Clean scanability over decorative clutter.
2. **Strict Semantic Token Usage**: Components must consume semantic CSS tokens (`bg-primary`, `bg-surface`, `bg-muted`, `text-foreground`, `border-border`, status colors) rather than hardcoded hex codes.
3. **Typography & Tabular Numbers**: Tabular numeric values (prices, balances, stock quantities, dates) use tabular font feature settings (`tabular-nums` / `font-mono`) to prevent visual jitter and maintain vertical column alignment.
4. **Subtle Elevation**: Shadow systems use subtle boundaries (`shadow-subtle`, `shadow-elevation`) rather than heavy gradients or card drops. Surface borders provide structural distinction.
5. **Calm Motion**: Transitions are fast (150ms-200ms) and respect `prefers-reduced-motion`.

---

## 2. Centralized Token Architecture

Defined in `globals.css` and exposed via `tailwind.config.js`:

### Color System Tokens
| Token Category | CSS Variable | Purpose |
|---|---|---|
| Background | `--background` | Main page background |
| Foreground | `--foreground` | Default text color |
| Surface | `--surface` | Secondary section background |
| Surface Elevated | `--surface-elevated` | Floating card / modal background |
| Primary | `--primary` | Primary action buttons, active navigation indicator |
| Secondary | `--secondary` | Secondary buttons, subtle tags, active filters |
| Muted | `--muted` | Input backgrounds, disabled states, table headers |
| Muted Foreground | `--muted-foreground` | Secondary labels, help text, captions |
| Destructive | `--destructive` | Error messages, delete actions |
| Border | `--border` | Card, table, input boundaries |
| Input | `--input` | Form control borders |
| Ring | `--ring` | Focus ring outline color |

### Business Status Tokens
| Status Variant | CSS Variable | Color | Purpose |
|---|---|---|---|
| `active`, `success`, `completed` | `--success` | Emerald / Green | Normal active operational state |
| `pending`, `warning`, `low_stock` | `--warning` | Amber / Orange | Action required / low stock warning |
| `info`, `approved` | `--info` | Blue | Information / approved status |
| `draft` | `--muted` | Muted Gray | Unsubmitted draft record |
| `processing` | Indigo | Indigo | Order processing |
| `cancelled`, `out_of_stock`, `error` | `--destructive` | Rose / Red | Cancelled order / out of stock error |

---

## 3. Component Hierarchy

### Form Control System
- **`Input`** (`src/components/ui/input.tsx`): Enterprise text/number input supporting `error` prop and focus rings.
- **`Select`** (`src/components/ui/select.tsx`): Styled native dropdown input with icon wrapper.
- **`Textarea`** (`src/components/ui/textarea.tsx`): Multi-line text field.
- **`Checkbox`** (`src/components/ui/checkbox.tsx`): Accessible check control.
- **`Switch`** (`src/components/ui/switch.tsx`): Toggle switch control with ARIA support.
- **`Label`** (`src/components/ui/label.tsx`): Form label with required indicator asterisk.
- **`FormField`** (`src/components/ui/form-field.tsx`): Standard field layout combining Label, Input, Help Text, and Error Message.

### Button System
- **`Button`** (`src/components/ui/button.tsx`):
  - **Variants**: `default`, `secondary`, `outline`, `ghost`, `destructive`, `link`.
  - **Sizes**: `sm`, `default`, `lg`, `icon`.
  - **States**: `disabled`, loading (with `Loader2` spinner).

### Data Display System
- **`Badge`** (`src/components/ui/badge.tsx`): Status badge component supporting all semantic business status variants.
- **`Table`** (`src/components/ui/table.tsx`): High-density data table primitives (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`, `TableFooter`).
- **`Formatters`** (`src/lib/utils/formatters.ts`):
  - `formatCurrency(amount, currency)`: Currency formatting (e.g. `$1,450.00`).
  - `formatQuantity(value)`: Quantity formatting (e.g. `14,500`).
  - `formatDate(date, format)`: Standardized date formatting.

### Overlays & Layout Primitives
- **`PageHeader`** (`src/components/ui/page-header.tsx`): Breadcrumbs + Title + Description + Actions header.
- **`Dialog`** (`src/components/ui/dialog.tsx`): Modal dialog with backdrop blur, focus handling, and Escape key listener.
- **`Alert`** (`src/components/ui/alert.tsx`): Status alert banner (`default`, `destructive`, `success`, `warning`, `info`).
- **`Skeleton`** (`src/components/ui/skeleton.tsx`): Animated placeholder loader.
- **`Tabs`** (`src/components/ui/tabs.tsx`): Tabbed navigation header.
- **`SearchAndFilter`** (`src/components/ui/search-and-filter.tsx`): `SearchInput`, `FilterBar`, and `FilterChip` components.

---

## 4. Theme & Accessibility Standards

- **Light/Dark Mode**: Driven by `ThemeToggle` component, storing preference in `localStorage` and toggling `dark` class on `document.documentElement`.
- **Keyboard Navigation**: All interactive elements (Buttons, Inputs, Selects, Checkboxes, Switches, Tabs, Modals) support keyboard focus (`focus-visible:ring-2`).
- **Screen Reader Support**: ARIA attributes used where semantic HTML is insufficient (`role="dialog"`, `role="status"`, `role="alert"`, `aria-checked`, `aria-label`).
- **Reduced Motion**: `@media (prefers-reduced-motion: reduce)` resets all transitions and animations to 0ms.

---

## 5. Design System Showcase Page

Access the interactive design system showcase during development at:
`http://localhost:5173/showcase`
