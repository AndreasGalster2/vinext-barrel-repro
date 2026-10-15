# vinext `validate-imports` false positive on sideEffects:false barrels

Repro for: `@vitejs/plugin-rsc` 0.5.37 (required by vinext 1.2.0)
`[plugin rsc:validate-imports]` failing builds that Next.js accepts.

## Repro

```sh
npm install
npm run build   # -> vite build
```

`app/page.tsx` is a server component importing ONE component:

```tsx
import { Toast } from "@heroui/react";
```

Build fails with (actual output — note the failing leaf is `Calendar`,
which this page never uses; the barrel drags it in):

```
[plugin rsc:validate-imports] .../react-aria-components/dist/exports/Calendar.mjs
Error: 'client-only' cannot be imported in server build ('rsc' environment):
 imported by .../react-aria-components/dist/exports/Calendar.mjs
  imported by .../@heroui/react/dist/components/calendar-year-picker/use-calendar-state.js
   imported by .../@heroui/react/dist/components/calendar-year-picker/index.js
    imported by .../@heroui/react/dist/index.js
     imported by app/page.tsx
```

(On larger apps the same failure appears via other leaves, e.g.
`toast/index.js` -> `toast-queue.js` -> `Toast.mjs` — including chains
that no subpath import can break.)

## Why this is a false positive

- `@heroui/react` ships `sideEffects: false` plus official per-component
  subpaths — tree-shaking drops every unused branch, including the
  `client-only` marker. Next.js builds this exact graph fine and serves it
  correctly in production.
- The validator walks re-exports pre-shake, so any barrel (or barrel-like
  re-export such as `toast/index.js` -> `toast-queue.js`) ending in a
  `client-only`-marked module fails the build even though the marker can
  never evaluate at runtime.

## Workarounds (verified)

1. Pure-barrel chains: import from the official subpath
   (`@heroui/react/skeleton`). Same modules, both builders happy.
2. Chains ending in a real directive-less module (this file): wrap usage
   in an explicit `"use client"` boundary. Client bundle byte-identical.

## Suggested fix

Teach the validator about `sideEffects` (skip subtrees the bundler will
drop), or validate post-tree-shake. Happy to provide the failing project
as-is.

## Versions

- vinext 1.2.0, @vitejs/plugin-rsc 0.5.37, vite 8
- @heroui/react 3.2.1, react-aria-components 1.18.0
- react 19, tailwindcss 4
