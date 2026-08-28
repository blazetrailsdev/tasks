---
title: "strip-freeform-comments-ar-associations-tests-rest"
status: draft
updated: 2026-08-28
rfc: "0023-surfaced-deviations"
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

Continuation of `strip-freeform-comments-ar-associations-tests`, which swept the
first slice of test files under `packages/activerecord/src/associations/**` —
`eager.test.ts`, `has-many-associations.test.ts`, `has-one-associations.test.ts`
and `join-model.test.ts` (622 lines of comment) — and re-enabled
`blazetrails/no-freeform-comments` for exactly those four via a second config
block in `eslint.config.mjs`, immediately after the block that still carries
`ignores: ["packages/activerecord/src/associations/**/*.test.ts"]`.

The remaining ~750 flagged blocks are the rest of that tree. Measured leaders
after slice 1: `collection-proxy.trails.test.ts` (72),
`association-scope.trails.test.ts` (39), `has-many-through-associations.test.ts`
(36), `has-one-through-associations.test.ts` (26),
`join-dependency-through-aliasing.trails.test.ts` (26),
`belongs-to-associations.test.ts` (24). Roughly 1250 lines total, so this is
still two or three PRs.

The bar is unchanged: a comment that restates the line or branch it sits on
goes, whatever its subject. What survives, survives as JSDoc carrying a tag or a
tool directive. Rails' own comments go too (the Ruby is vendored). Test NAMES
must not change. The rule is autofixable — run `--fix` over the slice, then read
the diff and rescue anything load-bearing.

## Acceptance criteria

- [ ] Each PR appends its swept files to the `files:` list of the second
      no-freeform-comments block, rather than dropping the `ignores` entry
      wholesale.
- [ ] When the last slice lands, the `ignores` entry for
      `packages/activerecord/src/associations/**/*.test.ts` is gone and the two
      config blocks collapse back into one.
- [ ] `pnpm eslint` clean over the tree, and a second `--fix` run is a no-op.
- [ ] The swept test files run green; no test name changed.
- [ ] Any deferred work found in a deleted comment is filed as its own story.
