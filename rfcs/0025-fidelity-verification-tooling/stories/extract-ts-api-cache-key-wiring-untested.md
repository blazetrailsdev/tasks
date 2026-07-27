---
title: "extract-ts-api's two cache keys have no test that each input is folded in"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
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

`scripts/api-compare/shared-cache.ts` now has four cache-key inputs — the
package fingerprint, the resolved read-set, `resolutionShapeKey`, and (PR #5420)
`dependencyKey`. Each is unit-tested in `shared-cache.test.ts`, but nothing
tests that `extract-ts-api.ts` actually FOLDS them into the two keys it builds:
the local `fingerprint` (`extract-ts-api.ts`, the `hashParts([...])` call) and
the shared `contentKey`.

That wiring is exactly where the bug class lives. `api-compare-cached-vs-fresh-
extraction-divergence` and this story both existed because a key input was
computed but not consulted; a unit test on the input alone cannot catch it. The wiring
in PR #5420 was verified by hand — append a line to `pnpm-lock.yaml`, confirm
0 of 13 packages serve from cache, restore it, confirm 13 of 13 — which is
repeatable but not repeated.

## Acceptance criteria

- A test drives the key-building path in `extract-ts-api.ts` (extracted into a
  testable helper if that is the cheapest seam) and asserts that changing EACH
  of the four inputs changes both the local fingerprint and the shared content
  key.
- A key input that is computed but dropped from either key fails the test.
- No full extraction in the test — key construction only, so it stays a unit
  test.
