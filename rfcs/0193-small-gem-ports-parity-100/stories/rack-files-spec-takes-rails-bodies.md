---
title: "rack spec_files.rb takes the Rails spec bodies"
status: draft
updated: 2026-10-22
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: ["rack"]
deps: []
deps-rfc: []
est-loc: 250
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
`packages/rack/src/files.test.ts` vs `vendor/rack/v3.1.14/test/spec_files.rb`: 17 count, 31 kind, 0 value mismatches, plus 2 TS-only tests.

The `test/cgi` DOCROOT fixtures it reads already live at `packages/rack/test/cgi/`.

## Acceptance criteria

- [ ] `files.test.ts` takes the Rails spec bodies verbatim (same apps, same fixtures, same assertion
      kinds and literal values), with test names unchanged.
- [ ] 0 assertion-count, kind and value mismatches for `spec_files.rb` in
      `pnpm parity:test --package rack --assertions`.
- [ ] TS-only tests in `files.test.ts` move to a `*.trails.test.ts` file or are deleted.
