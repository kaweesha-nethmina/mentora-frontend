# Mentora theme guide

The UI uses the colour palette of the Mentora research website (forest and leaf greens on a sage background). Every colour comes from a CSS variable in `src/app/globals.css`. Light values live in `:root` and dark values in `.dark`, so any component built with these tokens works in both themes automatically.

**Rule of thumb:** never hard-code a hex value or `text-white` / `bg-slate-900` in a component. Use a token from the table below.

## Surfaces

| Utility | Use for |
|---|---|
| `bg-background` | Page background |
| `bg-card` | Cards, panels, inputs |
| `bg-muted` | Inset areas, hover states, secondary panels |
| `bg-surface-3` | Pressed or selected neutral surface |
| `bg-sunken` | Code blocks, terminals, editor wells |
| `bg-popover` | Menus, dropdowns, dialogs |
| `bg-overlay` | Modal backdrop |
| `surface-card` | Shortcut: card background, border, radius and shadow in one class |

## Text

| Utility | Use for |
|---|---|
| `text-heading` | Page and section titles |
| `text-foreground` | Body text and labels |
| `text-muted-foreground` | Secondary text, descriptions |
| `text-subtle-foreground` | Meta text, placeholders, timestamps |

Every text token meets WCAG AA (4.5:1) on `card`, `background` and `muted` in both themes.

## Brand and actions

| Utility | Use for |
|---|---|
| `bg-primary` + `text-primary-foreground` | Primary buttons (`hover:bg-primary-hover`) |
| `bg-action` + `text-white` | Hero / high-emphasis call-to-action gradient |
| `bg-forest` + `text-white` | Brand bands (welcome banner, auth story panel) |
| `bg-primary-soft` + `text-primary-soft-foreground` | Chips, badges, selected items |
| `text-primary` | Links and text buttons |
| `text-brand` | Icons and indicators |
| `border-border` / `border-border-strong` | Default and emphasised borders |
| `ring-ring` | Focus rings |

## Status

`success`, `warning`, `danger` and `info` each have a text colour and a soft background, for example `bg-warning-soft text-warning`.

## Legacy class names

Older components still use `teal-*`, `slate-*`, `gray-*` and `zinc-*` utilities. These scales are remapped in `@theme` to the Mentora green and sage neutrals, so they match the new palette. When you touch one of these components, prefer switching to the semantic tokens above.

## Theme switching

`ThemeContext` adds the `dark` class to `<html>` and stores the choice in `localStorage` under `mentora-theme`. The switch sits in the dashboard header and on the landing page.

## Typography

- Inter (`font-sans`) for the interface.
- JetBrains Mono (`font-mono`) for code.

Both are loaded through `next/font/google` in `src/app/layout.tsx`.
