---
title: "Extend the detached-JSDoc lint to scripts/, where the motivating defect lived"
status: done
updated: 2026-07-31
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5674
claim: "2026-07-30T20:51:20Z"
assignee: "extend-detached-jsdoc-lint-to-scripts"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:detached` (`scripts/api-compare/lint-detached-jsdoc-tags.ts`, PR 5668) checks only `packages/<pkg>/src` — the population `parity:api:reasons` uses,
chosen because that is where `@internal` / `@noRailsEquivalent` carry
api-compare meaning. But the defect that motivated the lint happened in
`scripts/api-compare/extract-ts-api.ts` (PR 5654: a helper inserted between
`memberVisibility`'s JSDoc block and its signature), i.e. in the one tree the
lint does not read. The api-compare tooling itself uses `@internal` on its own
helpers, and a detached block there is just as misleading to a reader.

`listSourceFiles` in `lint-missing-rails-call-reasons.ts` is packages-shaped
(`<packagesDir>/<pkg>/src`), so a second, flat walker over `scripts/**/*.ts` is
needed; `lintFileText` itself needs no change. Check the current `scripts/`
tree for existing detachments and fix or register them before turning the gate
on.

## Acceptance criteria

- `parity:api:detached` also checks every `.ts` under `scripts/`.
- Report how many detachments the extended population finds; fix any real ones.
- Same CI step, no new job.
- Tests cover the extended file listing.
