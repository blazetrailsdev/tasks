---
title: "Statically expand Object.entries/keys and derived const arrays so the last 15 dynamic titles match"
status: draft
updated: 2026-08-30
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7265 (`dynamic-title-tests-are-counted-extra-never-matched`) statically
expands a `for...of` over a literal array or a file-level `const NAME = [...]`,
dropping the `parity:test --dynamic` residue from 32 tests in 16 files to **15
tests in 6 files**. The survivors are the shapes the expansion deliberately does
not evaluate — every one is still double-counted wrong (Rails name reads
`Missing`, TS case reads `extra (TS only)`):

- `packages/activesupport/src/cache/serializer-with-fallback.test.ts` (5) —
  `const FORMATS = Object.keys(SerializerWithFallback.SERIALIZERS)` (:7) and
  `const NON_LEGACY_FORMATS = FORMATS.filter(...)` (:9).
- `packages/activesupport/src/inflector.test.ts` (2, :613 and :624) —
  `for (const [singular, plural] of Object.entries(SingularToPlural))`.
- `packages/actionpack/src/action-dispatch/journey/path/pattern.test.ts` (3) and
  `.../route/definition/scanner.test.ts` — loops over a locally computed list.
- `support/ar-db-forks-parity.trails.test.ts` (1) and
  `support/schema-file-generator.trails.test.ts` (1).

`staticIterableElements` / `evalBoundExpression` in
`scripts/test-compare/extract-ts-core.ts` are the two hooks: the first decides
what a `for...of` iterates, the second what a `${...}` span evaluates to.

## Converged shape

Extend static evaluation to the three remaining shapes, keeping the Ruby
extractor's rule that one unresolved element rejects the whole array
(`scripts/test-compare/extract-ruby-tests.rb:686-692`, `array_literal_values`):

- `Object.keys(X)` / `Object.entries(X)` where `X` is an object literal declared
  once in the file with literal keys (and literal values, for `entries`) — the
  TS twin of the Ruby extractor's constant-hash expansion.
- `ARR.filter(...)` / `ARR.map(...)` only where the callback is statically
  evaluable over literal elements; otherwise keep rejecting.
- An identifier bound to another already-resolved const array, so
  `NON_LEGACY_FORMATS = FORMATS.filter(...)` chains resolve.

Anything still not evaluable keeps today's skeleton-plus-`dynamic` behaviour and
stays reported under `--dynamic`, so the unresolvable residue never silently
matches.

## Acceptance criteria

- `pnpm parity:test --dynamic` residue drops below 15 tests, and the
  `serializer can load ... dump` and `pluralize singular ...` families match
  their Rails names with no test file edited.
- One unresolved element still rejects the whole iterable (no duplicate `<expr>`
  skeletons).
- `scripts/test-compare/extract-ts-dynamic-titles.test.ts` gains a case per new
  shape plus a still-unresolvable negative.
- `compare.ts --gates --check` and the assertion-mismatch ratchet stay green.
