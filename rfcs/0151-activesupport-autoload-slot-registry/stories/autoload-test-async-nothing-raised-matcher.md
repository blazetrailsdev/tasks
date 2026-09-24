---
title: "Port autoload_test's assert_nothing_raised as a matcher that runs against a promise"
status: done
updated: 2026-09-24
rfc: "0151-activesupport-autoload-slot-registry"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: 16
pr: trails#8037
claim: "2026-09-24T16:14:54Z"
assignee: "activesupport-tse-util-imports-not-implemented-error-through-cache-store"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/autoload.test.ts` (from trails#7815) ports the `assert_nothing_raised { ::Fixtures::Autoload::SomeClass }` checks in `vendor/rails/activesupport/test/autoload_test.rb:31,42,51,64,75,86` as `await expect(constGet(...)).resolves.not.toThrow()`. `.resolves` does fail the test when `constGet` rejects (checked by breaking a `loadPath` key), but `not.toThrow()` then runs against the resolved `undefined` and not against a function. The canonical kinds in `scripts/test-compare/assertion-kinds.ts` have no async form of `nothingRaised`, which is why this shape was used. Swapping to `resolves.toBeUndefined()` would raise `assertion-kind-mismatch`.

## Acceptance criteria

- Each of the six Rails `assert_nothing_raised` sites is ported as an async assertion whose matcher runs against a function or a promise rejection, not against a resolved value. For example, teach `assertion-kinds.ts` to fold `rejects`-negated / `resolves.toBeUndefined` onto `nothingRaised`, or use a shape it already folds.
- `parity:test --assertions` holds the activesupport `assertion-kind-mismatch` count at or below the mark.
