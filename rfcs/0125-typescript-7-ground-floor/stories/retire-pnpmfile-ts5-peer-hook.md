---
title: "Track and retire the .pnpmfile.cjs TS 5.9.3 peer hook per consumer"
status: done
updated: 2026-09-24
rfc: "0125-typescript-7-ground-floor"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#8035
claim: "2026-09-24T15:32:22Z"
assignee: "build-freshness-guard-fail-closed-oracle"
blocked-by: null
closed-reason: null
---

## Context

No Rails counterpart; this is TS build tooling. trails#8032 (`flip-build-to-ts7`) added a root
`.pnpmfile.cjs` `readPackage` hook. For every package matching `TS5_PEER_CONSUMERS`, it deletes the
`typescript` peer and adds `typescript: "5.9.3"` as a dependency. The list is wider than the six-name
set in RFC 0125 § "Root-level tooling consumers":

- `typescript-eslint`, `@typescript-eslint/*`, `ts-api-utils`: peer `>=4.8.4 <6.0.0` on 8.57.0.
- `@vitest/eslint-plugin` 1.6.12: peer `>=5.0.0`. It is lint tooling and loads the same typescript-eslint utils.
- `typedoc` 0.28.18: peer `5.0.x … 6.0.x`. Runs in `packages/website` `docs:typedoc`.
- `@sveltejs/kit` 2.55.0: peer `^5.3.3`. `src/core/sync/ts.js` does `(await import('typescript')).default`, which on 7.1 is `lib/version.cjs`, the version string. `sync/write_types` would then call compiler API members that don't exist.

`recheck-ts7-api-surface` names only typescript-eslint, typedoc and `scripts/`, so it won't notice
`@vitest/eslint-plugin` or `@sveltejs/kit`.

Separately, `@expo/require-utils@55.0.5` (peer `^5.0.0 || ^5.0.0-0`, reached through `expo` in
`examples/`) already resolved 7.1 on `main` before this flip. `pnpm peers check` reports it as the only
unmet `typescript` peer, and `build/load.js:58` `require('typescript')` would get the version string.

## Acceptance criteria

- [ ] For each hooked package, record the first release whose `typescript` peer admits 7.x, or "none yet" (`npm view <pkg> peerDependencies`).
- [ ] Remove every regex whose package now admits 7.x and bump that package. `pnpm why typescript` shows it on 7.1 and `pnpm lint` / `docs:typedoc` / website `svelte-kit sync` still run.
- [ ] If the list becomes empty, delete `.pnpmfile.cjs` along with its `eslint.config.mjs` block and the `pnpmfileChecksum` lockfile line.
- [ ] Decide `@expo/require-utils`: add it to the hook, or confirm no `examples/` config is loaded through it (`app.config.ts`). `pnpm peers check` should be clean.
