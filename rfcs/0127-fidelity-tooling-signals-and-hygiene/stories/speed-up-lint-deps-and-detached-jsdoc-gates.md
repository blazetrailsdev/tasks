---
title: "Cut redundant parsing in lint-deps and the detached-JSDoc gate"
status: draft
updated: 2026-09-30
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

In the `rails-comparison` job two read-only gates dominate what is left of the background lane after trails#8289:

- `Dependency lint`: `scripts/api-compare/lint-deps.ts`, 16.7s average on CI and 27–30s locally. It walks `COMPARED_TS_FILES` with `typescript-5` for each rule in `RULES` (`analyzeTsDepUsage`, called once per rule inside `main()`).
- `Detached JSDoc tag blocks gate`: `scripts/api-compare/lint-detached-jsdoc-tags.ts`, 11.5s average on CI and 20s locally. `lintFileText` already skips files without `@internal`/`@noRailsEquivalent`, but for each matched file it calls `ts.createSourceFile` with `setParentNodes`, and `isCommentPosition` calls `getChildren` from the root for every unbound block match.

Job measurements as of 2026-09-30 (last 37 successful runs): mean 260s, median 274s, range 190–307s. Per-step averages over the last 10: API comparison 30.6s, ESLint exclude baselines 24.6s, Rails-private JSDoc lint 23.1s, Extract Ruby tests 21.2s, Dependency lint 16.7s, test-name ratchet 12.1s, method-order lint 12.0s, detached JSDoc 11.5s.

After trails#8289 the gate phase is CPU-bound over 3 background slots, so CPU saved here comes straight off wall time. For precedent, trails#8289 cut `generate-standalone-associations-exclude.ts` from 31.8s to 6.6s with a sound text prefilter, leaving its output byte-identical.

## Acceptance criteria

- Profile both scripts (`node --cpu-prof`) and record the hot spots in the PR body.
- Remove redundant work without changing output. Candidates: `lint-deps` parsing each file once across all rules rather than once per rule, and a sound text prefilter keyed on each rule's `tsImport`. Show both reports are byte-identical before and after on `main`.
- Each script's local runtime drops by at least half, measured and reported in the PR body.
