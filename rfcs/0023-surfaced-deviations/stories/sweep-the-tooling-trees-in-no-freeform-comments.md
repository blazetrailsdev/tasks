---
title: "sweep-the-tooling-trees-in-no-freeform-comments"
status: draft
updated: 2026-09-03
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

Story `enroll-remaining-packages-in-no-freeform-comments` swept every
`packages/*` row out of the `no-freeform-comments` exclusion list in
`eslint.config.mjs`. What is left on that list is not a package: the site,
the examples app, and the tooling trees that build and gate the port.

Remaining rows (`eslint.config.mjs`, the block whose rule is
`blazetrails/no-freeform-comments`):

- `packages/website/**`
- `examples/**`
- `eslint/**`
- `scripts/**`
- `eslint.config.mjs`
- `vitest.config.ts`
- `vitest.dx-tests.config.ts`

`scripts/test-compare/output/**` is the one PERMANENT row and stays.

These trees are the ones whose comments are most likely to be load-bearing:
`eslint/no-freeform-comments.mjs` documents the keep-set the rule enforces,
`eslint.config.mjs` documents each ratchet's only-shrink contract, and
`scripts/**` carries the gate contracts. Sweeping them is a judgement call per
file, not a mechanical `--fix`, which is why the packages went first.

`eslint/no-freeform-comments-scope.mjs`'s `sweptFilesInsideUnsweptTrees` is
down to 65 entries, all under these rows; it empties when the last row goes.

## Acceptance criteria

- [ ] Each remaining row is deleted from the `no-freeform-comments` `ignores`
      block, never re-added, with `scripts/test-compare/output/**` the sole
      survivor.
- [ ] The sweep is the rule's `--fix` output; anything rescued by hand is
      named in the PR body with what reads it.
- [ ] `sweptFilesInsideUnsweptTrees` shrinks with its rows.
- [ ] `pnpm lint` clean; no new eslint-disable.
