---
title: "eslint rails-file-structure-method-order: committed manifest disagrees with CI-regenerated one (4 arel files red locally)"
status: draft
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
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

Surfaced while doing `table-alias-get-skips-rails-table-branch` (PR #5006).

On merged main (`6aa86e295`), `pnpm exec eslint packages/arel/src` reports 4
`blazetrails/rails-file-structure-method-order` errors in files untouched by
that PR:

- `packages/arel/src/nodes/bind-param.ts:39` — 3 mismatches (`isInfinite` should precede `isNil`)
- `packages/arel/src/nodes/casted.ts:80` — 6 mismatches (`valueForDatabase` should precede `isNil`)
- `packages/arel/src/nodes/unqualified-column.ts:4` — 4 mismatches (`attribute` should precede `relation`)
- `packages/arel/src/select-manager.ts:69` — 43 mismatches (`taken` should precede `constraints`)

CI does **not** see these: the API/Test Comparison job regenerates
`eslint/rails-file-structure-method-order.json` (via `api:compare` /
`build-rails-privates-manifest.ts`) before linting, and its run of the same
command reported only the unrelated `UnsupportedVisitError` error. So the
**committed** manifest disagrees with the freshly-generated one.

## Why it matters

Local `pnpm lint` over `packages/arel/src` is red on a clean checkout, so every
agent working in arel sees 4 pre-existing errors unrelated to their diff. That
trains people to ignore lint output, and `--fix` would reorder ~56 members
across four files — a large, unrelated diff that is easy to commit by accident
inside a feature PR.

Either the committed manifest is stale and should be refreshed, or the four
files genuinely drifted from Rails source order and should be reordered. Decide
which, then make local and CI agree so the check is trustworthy in both places.

## Acceptance criteria

- [ ] Root cause identified: stale committed manifest vs. real member-order drift.
- [ ] `pnpm exec eslint packages/arel/src` is clean on a fresh checkout of main.
- [ ] Local and CI manifests agree (no regenerate-only delta).
- [ ] No test name changes. api:compare / test:compare delta non-negative.
