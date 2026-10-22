---
title: "rack spec_builder.rb takes the Rails spec bodies"
status: ready
updated: 2026-10-22
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: ["rack"]
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

Split from `rack-deflater-files-static-builder-specs-take-rails-bodies`, which owned four
specs and was too large for one PR. Measured 2026-10-22 on trails `a0874e9576` with a fresh
build, `pnpm parity:test --package rack --assertions`:
`packages/rack/src/builder.test.ts` vs `vendor/rack/v3.1.14/test/spec_builder.rb`: 10 count, 13 kind, 6 value mismatches, plus 2 TS-only tests.

The spec loads `vendor/rack/v3.1.14/test/builder/*.ru`; mirror those fixtures under `packages/rack/test/builder/`.

## Acceptance criteria

- [ ] `builder.test.ts` takes the Rails spec bodies verbatim (same apps, same fixtures, same assertion
      kinds and literal values), with test names unchanged.
- [ ] 0 assertion-count, kind and value mismatches for `spec_builder.rb` in
      `pnpm parity:test --package rack --assertions`.
- [ ] TS-only tests in `builder.test.ts` move to a `*.trails.test.ts` file or are deleted.
