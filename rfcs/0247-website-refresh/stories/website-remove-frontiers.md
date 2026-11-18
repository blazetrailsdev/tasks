---
title: "Delete the Frontiers tutorial and sandbox, its service worker and its dependencies"
status: ready
updated: 2026-11-18
rfc: "0247-website-refresh"
cluster: website-deploy
packages: [website]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 1. Frontiers is 9,395 lines across 73 files under
`packages/website/src/lib/frontiers/**`, `src/routes/frontiers/**` and
`src/routes/dev/**`. The two `dev/` pages import only Frontiers code
(`dev/filetree/+page.svelte:3-7`, `dev/monaco/+page.svelte:2-3`). Both
SvelteKit build steps fail in it today: `build:sw` and `vite build` cannot
resolve `@blazetrails/ruby-compat/psych-adapter` from `sandbox-sw.ts` and
`runtime.ts`.

The service worker exists only for the sandbox. `vite.sw.config.ts` builds
`src/lib/frontiers/sandbox-sw.ts` as an IIFE that runs
`importScripts("/sql-wasm.js")` (`:20`), and `package.json:7,10` runs it from
`predev` and `build`. Dependencies imported only from Frontiers, per grep:

- `monaco-editor` (`MonacoEditor.svelte`)
- `sql.js` (Frontiers, `dev/filetree`, `vitest.config.ts:15,33`)
- `mermaid` (`tutorials/diagram-renderer.ts`)
- `dompurify` (`DiagramBlock.svelte`)
- `yaml` (`runtime.ts`, `sandbox-sw.ts`)

`vitest.config.ts:12` aliases `$frontiers`, and its component project
(`:38`) includes only `src/lib/frontiers/components/**`.
`@testing-library/*` and `jsdom` serve that project. CI's `Website` job runs
`build:sw` (`.github/workflows/ci.yml:2158`).

The deletion is about 9,400 lines and almost no additions (RFC open question 5
asks for a ceiling waiver). `est-loc` counts the non-deletion edits.

## Acceptance criteria

- [ ] `src/lib/frontiers/**`, `src/routes/frontiers/**` and `src/routes/dev/**` are deleted.
- [ ] `vite.sw.config.ts`, the `build:sw` and `predev` scripts, and `build:sw` in `build` are removed. `src/stubs/nokogiri-stub.ts` is removed if nothing else imports it.
- [ ] `monaco-editor`, `sql.js`, `mermaid`, `dompurify` and `yaml` are removed from `packages/website/package.json`. So are `@testing-library/svelte`, `@testing-library/jest-dom` and `jsdom`, unless a remaining test imports them. `pnpm-lock.yaml` is updated.
- [ ] `vitest.config.ts` has no Frontiers alias or project. The `Website` job in `ci.yml` no longer calls `build:sw`.
- [ ] Nav links, landing links and VitePress config contain no Frontiers reference. That includes the `frontiers.deanoftech.com` default in `docs/.vitepress/config.ts:3`.
- [ ] `pnpm --filter @blazetrails/website exec svelte-kit sync && pnpm --filter @blazetrails/website exec vite build` exits 0.
- [ ] `git grep -i frontiers -- packages/website .github` prints nothing.
- [ ] The PR body names each story this makes obsolete, and each is closed `FALSIFIED:` with the PR number: `website-frontiers-nine-tests-red-on-main`, `website-vfs-generators-cannot-load-module-templates`, `website-frontiers-generate-model-bypasses-hook-chain`, `vfs-unlink-reports-enoent-for-bundled-template`, `vfs-adapter-rmsync-noop-and-no-links`, `sql-js-connection-rollback-has-no-test`, `sqlite3-website-sql-js-engine`.

## Definition of done

Bringing Frontiers back, in any form, is out of scope. `docs:build` (TypeDoc)
is `website-docs-typedoc-fails-under-ts5`, not this story.
