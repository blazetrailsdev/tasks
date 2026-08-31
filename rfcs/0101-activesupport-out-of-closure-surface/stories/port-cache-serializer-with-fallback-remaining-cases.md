---
title: "port-cache-serializer-with-fallback-remaining-cases"
status: draft
updated: 2026-08-31
rfc: "0101-activesupport-out-of-closure-surface"
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

From the RFC 0105 reconciliation
(`reconcile-out-of-closure-activesupport-test-remainder`).
`vendor/rails/activesupport/test/cache/serializer_with_fallback_test.rb:6`
(`class SerializerWithFallbackTest`, 87 lines) has **5 cases missing** and no
RFC 0101 owner — the existing `serializer_with_fallback` stories under RFC 0023
and RFC 0072 are about the _implementation_ surface
(`packages/activesupport/src/messages/serializer-with-fallback.ts`), not this
test file's remaining cases.

The convention TS file is
`packages/activesupport/src/cache/serializer-with-fallback.test.ts`; run
`pnpm parity:test --package activesupport --missing` for the five names before
starting.

## Acceptance criteria

- The 5 missing cases ported into the convention file, Rails names verbatim.
- No new `unported-files` rows.
- `pnpm parity:test` deltas non-negative.
