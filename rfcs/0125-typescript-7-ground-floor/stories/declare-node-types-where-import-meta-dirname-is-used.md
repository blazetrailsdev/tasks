---
title: "Declare @types/node in every package whose lib uses import.meta.dirname/filename"
status: ready
updated: 2026-11-25
rfc: "0125-typescript-7-ground-floor"
cluster: build-infra
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`import.meta.dirname` / `import.meta.filename` are typed by `@types/node`. Ten packages use them in `lib/` without declaring Node types in their own `tsconfig.json`: actioncable, actionmailbox, actiontext, activerecord-cli, activestorage, rake, solid-cable, solid-cache, solid-queue and trailties. These packages typecheck today only because some import chain happens to pull `@types/node` into their program.

trails#10285 showed how fragile that is. Deleting trailties' `lib/database.ts` helpers removed that path for `packages/turbo` and `packages/stimulus`, and the build broke with `TS2339: Property 'dirname' does not exist on type 'ImportMeta'`. The fix was the shape `packages/rack` already uses: `"types": ["node"]` in `tsconfig.json` and `"@types/node": "25.3.5"` in `devDependencies`.

Found with: `grep -rlE "import\.meta\.(dirname|filename)" packages/*/lib`, then keeping the packages whose `tsconfig.json` has no `"node"` entry in `types`.

## Acceptance criteria

- Each of the ten packages declares `"types": ["node"]` in its `tsconfig.json` and lists `@types/node` in its `devDependencies`, matching `packages/rack`.
- `pnpm typecheck` passes, and `pnpm install --frozen-lockfile` passes on the updated lockfile.
- Optional: a Repo Checks script fails any package whose `lib/` uses `import.meta.dirname` or `import.meta.filename` without Node types declared, so the next new package can't repeat this.
