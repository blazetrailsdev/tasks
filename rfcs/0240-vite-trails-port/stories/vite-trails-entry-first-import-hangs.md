---
title: "vite-trails-entry-first-import-hangs"
status: ready
updated: 2026-11-16
rfc: "0240-vite-trails-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

On main, a vite-trails test file whose only import is `@blazetrails/ruby-compat` times out in `packages/ruby-compat/test-setup/class-paths.ts:27`, the `beforeAll` that loads the package entry (`packages/vite-trails/lib/index.ts`). Loading `@blazetrails/vite-assets/cli.js` first avoids it, which points to a top-level-await cycle: `vite-trails/lib/cli.ts` imports `vite-assets/lib/cli.ts`, which ends in `await CLI.requireFrameworkLibraries("cli")`. trails#10209's `vite-trails/test/tasks.trails.test.ts` works around it with a leading `import "@blazetrails/vite-assets/cli.js"`.

## Acceptance criteria

- Importing `@blazetrails/vite-trails` as the first module (vitest, and plain node on `dist/`) evaluates without hanging.
- Remove the leading import workaround from `tasks.trails.test.ts`.
