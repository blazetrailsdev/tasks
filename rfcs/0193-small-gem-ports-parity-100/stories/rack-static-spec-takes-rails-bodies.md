---
title: "rack spec_static.rb takes the Rails spec bodies"
status: draft
updated: 2026-10-22
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: ["rack"]
deps: []
deps-rfc: []
est-loc: 300
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
`packages/rack/src/static.test.ts` vs `vendor/rack/v3.1.14/test/spec_static.rb`: 18 count, 25 kind, 17 value mismatches.

The value mismatches show the port uses an invented `fallback` app and a tmpdir tree instead of Rails' `DummyApp` and the `test/cgi` DOCROOT. `cgi/assets/**` is not yet copied to `packages/rack/test/cgi/`; copy it from `vendor/rack/v3.1.14/test/cgi/assets/` in this story.

## Acceptance criteria

- [ ] `static.test.ts` takes the Rails spec bodies verbatim (same apps, same fixtures, same assertion
      kinds and literal values), with test names unchanged.
- [ ] 0 assertion-count, kind and value mismatches for `spec_static.rb` in
      `pnpm parity:test --package rack --assertions`.
- [ ] TS-only tests in `static.test.ts` move to a `*.trails.test.ts` file or are deleted.
