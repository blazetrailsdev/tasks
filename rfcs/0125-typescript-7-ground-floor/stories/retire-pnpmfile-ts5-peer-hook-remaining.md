---
title: "retire-pnpmfile-ts5-peer-hook-remaining"
status: draft
updated: 2026-09-24
rfc: "0125-typescript-7-ground-floor"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

No Rails counterpart; this is TS build tooling. Split out of
`retire-pnpmfile-ts5-peer-hook` (trails#8035). That PR recorded the status of
every `.pnpmfile.cjs` `TS5_PEER_CONSUMERS` entry and added
`@expo/require-utils`. None could be retired yet.

On TS 7.1, a bare `require("typescript")` resolves to `lib/version.cjs`, which
is only a version string. So a consumer is retirable only once it stops loading
the compiler API through that import. A peer range that admits 7.x is not
enough. As of 2026-09-24:

- typescript-eslint / @typescript-eslint/\* 8.70.1: `>=4.8.4 <6.1.0`. None yet.
- ts-api-utils 2.5.0: `>=4.8.4`. Admits 7.x by range only; it is typescript-eslint's AST layer.
- @vitest/eslint-plugin 1.6.27: `>=5.0.0`. Admits 7.x by range only; it loads the typescript-eslint utils.
- typedoc 0.28.20: `5.0.x … 6.0.x`. None yet.
- @sveltejs/kit 2.70.3: `^5.3.3 || ^6.0.0`. None yet. `src/core/sync/ts.js` imports the compiler.
- @expo/require-utils 57.0.5: `… || ^7.0.0`. Admits 7.x by range only; `build/load.js` requires the compiler to load a TS app config.

## Acceptance criteria

- [ ] Re-run `npm view <pkg> peerDependencies` for each entry. Remove every regex
      whose package now works against TS 7's compiler entry point, and bump that
      package. `pnpm why typescript` shows it on 7.x and `pnpm lint` /
      `docs:typedoc` / website `svelte-kit sync` still run.
- [ ] If the list becomes empty, delete `.pnpmfile.cjs` along with its
      `eslint.config.mjs` block and the `pnpmfileChecksum` lockfile line.
- [ ] `pnpm peers check` stays clean.
