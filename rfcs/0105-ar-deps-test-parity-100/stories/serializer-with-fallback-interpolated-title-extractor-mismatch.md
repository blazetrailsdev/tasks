---
title: "serializer-with-fallback-interpolated-title-extractor-mismatch"
status: in-progress
updated: 2026-09-22
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 30
pr: trails#7976
claim: "2026-09-22T16:47:52Z"
assignee: "serializer-with-fallback-interpolated-title-extractor-mismatch"
blocked-by: null
closed-reason: null
---

## Context

Left over from `duplicate-test-paths-remaining-groups`. `packages/activesupport/src/cache/serializer-with-fallback.test.ts:29-47`
mirrors the two `FORMATS.product(...).each` loops in
`vendor/rails/activesupport/test/cache/serializer_with_fallback_test.rb:16-28` exactly, but the
extractors disagree on the interpolated title: the Ruby extractor records
`" serializer can load  dump"` (interpolation dropped, ×2) while the TS extractor records
`"<expr> serializer can load <expr> dump"` (×3 — the second loop is counted twice at line 41).
So the TS paths score `extra (TS only)` and the Rails ones stay missing. This is a
test-compare tooling mismatch (`scripts/test-compare/extract-ts-core.ts:785`
`DYNAMIC_TITLE_PLACEHOLDER` vs the Ruby extractor), not a test-file defect.

## Acceptance criteria

- The Ruby and TS extractors normalize an interpolated test title the same way, and the TS
  extractor records one entry per `it()` call site.
- `serializer-with-fallback.test.ts` has no TS-only surplus in `parity:test`.
