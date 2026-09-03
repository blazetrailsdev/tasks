---
title: "website-is-outside-pnpm-typecheck"
status: draft
updated: 2026-09-03
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/website` is the one workspace package absent from the root
`tsconfig.json` `references` list (`tsconfig.json:21-40` names every other
package plus `scripts`), so `pnpm typecheck` (`package.json:12` →
`scripts/typecheck.mjs`) never compiles it. Its own
`packages/website/tsconfig.json` also `extends "./.svelte-kit/tsconfig.json"`,
which does not exist until `svelte-kit sync` runs, so both `tsc -p` and
`vitest` fail to start in a fresh worktree — the website suite cannot be run
locally at all without a sync step nothing documents.

That is a live false-green. In #7438 the import-specifier sweep moved
`packages/website/src/lib/frontiers/trails-cli.ts`'s value imports to
`@blazetrails/ruby-compat` but left `type ProcessAdapter` on
`@blazetrails/activesupport`, which the same PR stopped exporting. `pnpm build`,
`pnpm typecheck`, `pnpm lint` and every local suite were green; only a reviewer
reading the diff caught it. The same shape recurs on every cross-package move
(#7422 hit `packages/website/aliases.ts` for the same reason).

## Acceptance criteria

- `pnpm typecheck` compiles `packages/website`, whether by adding it to the root
  `references` or by a step in `scripts/typecheck.mjs` that syncs first.
- A fresh worktree can run the website suite without a hand-run
  `svelte-kit sync` — either `start-worktree.sh` performs it or the package's
  `pretest`/`typecheck` script does.
- Reverting #7438's `trails-cli.ts` import to `@blazetrails/activesupport` makes
  `pnpm typecheck` fail. (Regression proof: it must be red on the baseline.)
